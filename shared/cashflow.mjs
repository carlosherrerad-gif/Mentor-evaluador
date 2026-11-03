import {validateFinancing} from './financing-settings.mjs';
import {validateClientCollections,scheduleClients,releaseClients} from './collections.mjs';
import {profileIgv} from './profile-igv.mjs';
import {economicSummary,costGroups} from './economics.mjs';

export const stageLabels=[['land','Adquisición del terreno'],['design','Diseño y especialidades'],['permits','Licencias y trámites'],['presale','Preventa'],['construction','Construcción'],['sales','Venta del saldo'],['delivery','Entrega e independización'],['aftercare','Postventa']];
export const paymentLabels=[['land','Terreno'],...costGroups];
export const MAX_MONTHS=240;
export function validateCashflow(value={},fail=(s,m)=>{throw Error(m);}){
  const obj=v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'Configuración de flujo inválida.');return v;};obj(value);
  const number=(v,d,max=240,integer=true,min=1)=>{if(v===null)return null;if(v===undefined)return d;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||integer&&!Number.isInteger(v))fail(400,'Revisa las cantidades del cronograma.');return v;};
  const choice=(v,list,d)=>{v=v??d;if(!list.includes(v))fail(400,'Opción de programación inválida.');return v;};
  const text=(v,max=2000)=>{v=v??'';if(typeof v!=='string'||v.length>max)fail(400,'Texto de programación inválido.');return v;};
  const startMonth=text(value.startMonth,7);if(startMonth&&!/^(19\d{2}|20\d{2}|21\d{2}|2200)-(0[1-9]|1[0-2])$/.test(startMonth))fail(400,'Mes de inicio inválido.');
  const stages={},payments={};if(value.stages!==undefined)obj(value.stages);if(value.payments!==undefined)obj(value.payments);
  for(const [key] of stageLabels){const s=obj(value.stages?.[key]??{});stages[key]={mode:choice(s.mode,['auto','manual','na'],'auto'),start:number(s.start,null,240,true,0),duration:number(s.duration,null)};}
  for(const [key] of paymentLabels){const p=obj(value.payments?.[key]??{});payments[key]={mode:choice(p.mode,['auto','manual'],'auto'),start:number(p.start,null,240,true,0),duration:number(p.duration,null)};}
  const c=obj(value.collections??{}),tax=obj(value.igv??{});if(tax.enabled!==undefined&&typeof tax.enabled!=='boolean')fail(400,'Activación de IGV inválida.');
  const igv={enabled:tax.enabled??true,creditPercent:number(tax.creditPercent,100,100,false,0),creditLag:number(tax.creditLag,0,12,true,0),paymentLag:number(tax.paymentLag,1,12,true,1),openingCredit:number(tax.openingCredit,0,1e12,false,0)};
  const timelineVersion=value.timelineVersion??1;if(![1,2].includes(timelineVersion))fail(400,'Versión de cronograma inválida.');if(value.timelineReview!==undefined&&typeof value.timelineReview!=='boolean')fail(400,'Revisión de cronograma inválida.');
  return {financing:validateFinancing(value.financing,fail),clientCollections:validateClientCollections(value.clientCollections,fail),igv,timelineVersion,timelineReview:value.timelineReview??false,startMonth,velocity:number(value.velocity,2,1000,false,.01),presalePercent:number(value.presalePercent,30,100,false,0),constructionMonths:number(value.constructionMonths,12),stages,payments,collections:{mode:choice(c.mode,['sale','split'],'sale'),initialPercent:number(c.initialPercent,30,100,false,0),lag:number(c.lag,0,240,true,0)},otherIncomeMonth:number(value.otherIncomeMonth,null,240,true,0),manualReference:text(value.manualReference,10000),notes:text(value.notes)};
}
export function cashflowFrom(e){return normalizeTimeline(validateCashflow(e?.cashflow??{timelineVersion:2}));}
function normalizeTimeline(v){if(v.timelineVersion===2)return v;const next=structuredClone(v);next.timelineVersion=2;let manual=false;for(const group of [next.stages,next.payments])for(const s of Object.values(group))if(s.mode==='manual'){manual=true;if(s.start!==null)s.start=Math.max(0,s.start-1);}if(next.otherIncomeMonth!==null)next.otherIncomeMonth=Math.max(0,next.otherIncomeMonth-1);next.timelineReview=manual;return next;}
const cents=v=>v===null?null:Math.round(v*100);
const ceil=v=>Math.ceil(v-1e-9);
export function calendarLabel(start,index){if(!start)return `Mes ${index}`;const [year,month]=start.split('-').map(Number);return new Intl.DateTimeFormat('es-PE',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(year,month+index-1,1)));}
function cashflowBaseSummary({configuration={},land={},urban={},district='',economics={},settings=cashflowFrom(economics)}={}){
  const v=normalizeTimeline(validateCashflow(settings)),economic=economicSummary({configuration,land,urban,district,economics}),pending=[],warnings=[];
  const units=economic.physical.metrics.units,parkingUnits=economic.physical.metrics.commercial,velocity=v.velocity;
  if(units===null)pending.push('Completa las viviendas del escenario.');if(!velocity)pending.push('Registra una velocidad de ventas positiva.');
  if(v.presalePercent===null)pending.push('Define el porcentaje de preventa.');if(v.collections.lag===null)pending.push('Define el desfase de cobro, incluso si es cero.');
  const presaleTarget=units===null||v.presalePercent===null?null:v.stages.presale.mode==='na'?0:ceil(units*v.presalePercent/100);
  const salesMonths=units===null||!velocity||presaleTarget===null?null:ceil(presaleTarget/velocity)+ceil((units?units-presaleTarget:parkingUnits||0)/velocity);
  const preMonths=presaleTarget===null||!velocity?null:ceil(presaleTarget/velocity);
  const stages=[];
  function stage(key,start,duration){const setting=v.stages[key];const row={key,label:stageLabels.find(s=>s[0]===key)[1],mode:setting.mode,start:setting.mode==='na'?null:setting.mode==='manual'?setting.start:start,duration:setting.mode==='na'?0:setting.mode==='manual'?setting.duration:duration,end:null};row.end=row.start!==null&&row.duration!==null&&row.duration>0?row.start+row.duration-1:null;
    if(setting.mode!=='na'&&(row.start===null||row.duration===null))pending.push(`Completa inicio y duración: ${row.label}.`);if(row.end>MAX_MONTHS)pending.push(`${row.label} supera el horizonte de ${MAX_MONTHS} meses.`);stages.push(row);return row;}
  const acquisition=stage('land',0,1),pre=stage('presale',preMonths?1:null,preMonths),design=stage('design',1,Math.max(1,pre?.end??preMonths??1)),permits=stage('permits',1,Math.max(1,pre?.end??preMonths??1));
  // Preventa y saldo son fases consecutivas, sin compartir su último mes.
  const preEnd=pre.end??0,restStart=preEnd+1;
  const remaining=units===null||presaleTarget===null?null:units-presaleTarget;
  const selling=stage('sales',restStart,remaining===0&&units!==0?0:salesMonths===null?null:Math.max(1,ceil((units?remaining:parkingUnits||0)/velocity)));
  const construction=stage('construction',preMonths===null?null:Math.max(1,preEnd)+1,v.constructionMonths),delivery=stage('delivery',construction.end===null?null:construction.end+1,1),aftercare=stage('aftercare',delivery.end===null?null:delivery.end+1,3);
  for(const row of [pre,selling])if(row.mode==='auto'&&row.duration===0){row.start=null;row.end=null;}
  // A zero-duration automatic sales phase is not an incomplete manual phase.
  for(let i=pending.length-1;i>=0;i--)if((presaleTarget===0&&pending[i]===`Completa inicio y duración: ${pre.label}.`)||(remaining===0&&pending[i]===`Completa inicio y duración: ${selling.label}.`))pending.splice(i,1);
  if(construction.start!==null&&pre.end!==null&&construction.start<=pre.end)pending.push('La construcción debe empezar después del cierre de la preventa.');
  if(selling.start!==null&&pre.end!==null&&selling.start<=pre.end)pending.push('La venta del saldo debe empezar después del cierre de la preventa.');
  for(const row of [pre,design,permits,selling,construction])if(row.start!==null&&row.start<1)pending.push(`${row.label} debe comenzar desde el mes 1.`);
  if(acquisition.start!==0||acquisition.duration!==1)pending.push('La adquisición debe ocupar únicamente el mes 0.');
  if(v.timelineReview){pending.push('Revisa los intervalos manuales migrados al mes 0; se conservaron sus fechas calendario.');warnings.push('La numeración cambió a mes 0: confirma la revisión de los intervalos manuales.');}
  for(const row of [design,permits])if(row.end!==null&&construction.start!==null&&row.end>=construction.start)pending.push(`${row.label} debe concluir antes de comenzar la construcción.`);
  if(delivery.start!==null&&construction.end!==null&&delivery.start<=construction.end)pending.push('La entrega debe comenzar después de terminar la construcción.');
  if(aftercare.start!==null&&delivery.end!==null&&aftercare.start<=delivery.end)warnings.push('La postventa se superpone con la entrega; revisa este ajuste manual.');
  if(!v.startMonth)warnings.push('Sin mes calendario: se utiliza Mes 0, Mes 1… hasta definir el inicio.');
  if(v.presalePercent!==30)warnings.push('Se utiliza la meta de preventa editada, no la propuesta inicial del 30%.');
  const reference=JSON.stringify({timelineVersion:2,units,velocity:v.velocity,presalePercent:v.presalePercent,constructionMonths:v.constructionMonths});
  if((stageLabels.some(([k])=>v.stages[k].mode==='manual')||paymentLabels.some(([k])=>v.payments[k].mode==='manual'))&&reference!==v.manualReference)warnings.push('Los indicadores cambiaron o falta revisar los plazos manuales. Se conservan sus valores.');
  const mapping={land:acquisition,acquisition,construction,design,permits,administration:{start:1,duration:null,end:null},marketing:{start:pre.start??selling.start,duration:null,end:null},aftercare,finance:construction};
  const stageHorizon=Math.max(1,...stages.map(s=>s.end??0));mapping.administration.duration=stageHorizon;mapping.administration.end=stageHorizon;
  const lastSale=Math.max(pre.end??0,selling.end??0);mapping.marketing.end=lastSale;mapping.marketing.duration=mapping.marketing.start===null?null:lastSale-mapping.marketing.start+1;
  const owned=economics.acquisition?.mode==='owned';
  const budgets=[{key:'land',label:'Terreno',total:economic.landCost},...economic.categories];
  const paymentRows=budgets.map(row=>{const p=v.payments[row.key],base=mapping[row.key],nonCash=row.key==='land'&&owned;
    const start=p.mode==='manual'?p.start:base?.start??null,duration=p.mode==='manual'?p.duration:base?.duration??null,end=start!==null&&duration!==null?start+duration-1:null;
    if(!nonCash&&row.total!==0&&(start===null||duration===null||duration<1))pending.push(`Asigna meses de pago: ${row.label}.`);if(end>MAX_MONTHS)pending.push(`Los pagos de ${row.label} superan ${MAX_MONTHS} meses.`);
    return {...row,cash:nonCash?0:row.total,nonCash,mode:p.mode,start,duration,end};});
  if(!economic.complete)pending.push(...economic.pending.map(p=>`Evaluación económica: ${p}`));
  if(v.collections.mode==='split'&&(v.collections.initialPercent===null||delivery.end===null))pending.push('Define la inicial y la entrega para programar el saldo de cobranzas.');
  const horizon=Math.max(stageHorizon,...paymentRows.map(r=>r.end??0),v.otherIncomeMonth??0);
  if([...budgets.map(b=>b.total),economic.revenues.total].some(n=>n!==null&&!Number.isSafeInteger(cents(n))))pending.push('Los importes superan la precisión admitida para programar centavos.');
  if(horizon>MAX_MONTHS||pending.some(p=>p.includes('precisión admitida')))return result([]);
  const months=Array.from({length:MAX_MONTHS+1},(_,i)=>({month:i,label:calendarLabel(v.startMonth,i),presales:0,sales:0,parking:0,residential:0,parkingIncome:0,otherIncome:0,incomeRounding:0,payments:Object.fromEntries(paymentLabels.map(([key])=>[key,0])),costRounding:0,income:0,cost:0,net:0,cumulative:0}));
  const active=(s,m)=>s.start!==null&&s.end!==null&&m>=s.start&&m<=s.end;
  let soldPre=0,soldRest=0,preCapacityMonths=0,saleCapacityMonths=0,parkingSold=0,previousResidential=0,previousParking=0,latest=horizon;
  function add(month,key,amount){if(month<0||month>MAX_MONTHS){pending.push(`Una cobranza supera el horizonte de ${MAX_MONTHS} meses.`);return;}months[month][key]+=amount;latest=Math.max(latest,month);}
  for(let m=1;m<=Math.min(lastSale,MAX_MONTHS);m++){
    const isPre=active(pre,m),isSale=active(selling,m);if(!isPre&&!isSale)continue;const capacityMonths=isPre?++preCapacityMonths:++saleCapacityMonths;
    let capacity=velocity?Math.floor(capacityMonths*velocity+1e-8)-Math.floor((capacityMonths-1)*velocity+1e-8):0;
    const preQty=isPre?Math.min(Math.max(0,(presaleTarget??0)-soldPre),capacity):0;soldPre+=preQty;capacity-=preQty;
    const saleQty=isSale&&soldPre===(presaleTarget??0)?Math.min(Math.max(0,(remaining??0)-soldRest),capacity):0;soldRest+=saleQty;
    months[m].presales=preQty;months[m].sales=saleQty;
    const sold=soldPre+soldRest,N=units??0,park=parkingUnits??0;
    const nextRes=N?Math.round((cents(economic.revenues.residential)??0)*sold/N):0,res=nextRes-previousResidential;previousResidential=nextRes;
    let parkQty=N?Math.floor(sold/N*park+1e-8)-parkingSold:isSale?Math.min(park-parkingSold,capacity):0;parkQty=Math.max(0,parkQty);parkingSold+=parkQty;months[m].parking=parkQty;
    const nextPark=park?Math.round((cents(economic.revenues.parking)??0)*parkingSold/park):0,parkMoney=nextPark-previousParking;previousParking=nextPark;
    for(const [key,money] of [['residential',res],['parkingIncome',parkMoney]]){if(!money)continue;const initial=v.collections.mode==='sale'?money:Math.round(money*(v.collections.initialPercent??0)/100),when=m+(v.collections.lag??0);add(when,key,initial);if(money-initial)add(Math.max(when,delivery.end??when),key,money-initial);}
  }
  if(units!==null&&soldPre+soldRest!==units)pending.push(`El cronograma vende ${soldPre+soldRest} de ${units} viviendas. Ajusta velocidad o plazos.`);
  if(parkingUnits!==null&&parkingSold!==parkingUnits)pending.push(`Quedan ${parkingUnits-parkingSold} estacionamientos por programar.`);
  const otherMonth=v.otherIncomeMonth??delivery.end??horizon;if(economic.revenues.others!==null&&economic.revenues.others!==0)add(otherMonth,'otherIncome',cents(economic.revenues.others));
  for(const row of paymentRows){if(row.nonCash||row.cash===null||row.cash===0||row.start===null||row.duration===null||row.end>MAX_MONTHS)continue;const total=cents(row.cash),regular=Math.floor(total/row.duration);for(let j=0;j<row.duration;j++)months[row.start+j].payments[row.key]=j===row.duration-1?total-regular*(row.duration-1):regular;}
  const expectedIncome=cents(economic.revenues.total),expectedCost=economic.cost===null?null:cents(economic.cost-(owned?economic.landCost??0:0));
  // Explicit cent adjustments reconcile rounded product/category subtotals.
  const actualIncome=months.reduce((s,m)=>s+m.residential+m.parkingIncome+m.otherIncome,0),actualCost=months.reduce((s,m)=>s+Object.values(m.payments).reduce((a,b)=>a+b,0),0);
  if(expectedIncome!==null&&soldPre+soldRest===units&&parkingSold===parkingUnits)add(Math.min(MAX_MONTHS,latest),'incomeRounding',expectedIncome-actualIncome);
  if(expectedCost!==null&&paymentRows.every(r=>r.nonCash||r.cash===0||r.cash!==null&&r.start!==null&&r.duration!==null&&r.end<=MAX_MONTHS))months[Math.max(0,construction.end??latest)].costRounding=expectedCost-actualCost;
  let cumulative=0;for(const m of months){m.income=m.residential+m.parkingIncome+m.otherIncome+m.incomeRounding;m.cost=Object.values(m.payments).reduce((s,n)=>s+n,0)+m.costRounding;m.net=m.income-m.cost;cumulative+=m.net;m.cumulative=cumulative;}
  return result(months.slice(0,Math.min(MAX_MONTHS,latest)+1));
  function result(rows){const totalIncome=rows.reduce((s,m)=>s+m.income,0),totalCost=rows.reduce((s,m)=>s+m.cost,0),allPending=[...new Set(pending)],complete=allPending.length===0&&economic.complete,low=Math.min(0,...rows.map(m=>m.cumulative)),recovery=complete?rows.find((m,i)=>rows.slice(0,i).some(n=>n.cumulative<0)&&m.cumulative>=0&&rows.slice(i).every(n=>n.cumulative>=0))?.month??null:null;
    return {settings:v,economic,stages:stageLabels.map(([k])=>stages.find(s=>s.key===k)),paymentRows,reference,units,presaleTarget,salesMonths,preMonths,months:rows,complete,pending:allPending,warnings:[...new Set([...warnings,...economic.warnings])],ownedLand:owned,nonCashLand:owned?economic.landCost:0,totals:{income:totalIncome/100,cost:totalCost/100,net:(totalIncome-totalCost)/100},incomeDifference:economic.revenues.total===null?null:totalIncome/100-Math.round(economic.revenues.total*100)/100,costDifference:economic.cost===null?null:totalCost/100-Math.round((economic.cost-(owned?economic.landCost??0:0))*100)/100,deficit:complete?Math.max(0,-low/100):null,recoveryMonth:recovery,horizon:rows.length?rows.at(-1).month:0};}
}

export function cashflowSummary(input={}){const base=scheduleClients(cashflowBaseSummary(input));return releaseClients(profileIgv(base,input.economics??{},month=>calendarLabel(base.settings.startMonth,month)));}
