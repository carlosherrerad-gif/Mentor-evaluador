import {evaluationFrom,economicSummary} from './economics.mjs';
import {cashflowFrom,cashflowSummary} from './cashflow.mjs';
import {budgetSummary} from './budget.mjs';
import {taxSummary} from './tax.mjs';

export function validateExecutive(value={},fail=(s,m)=>{throw Error(m);}){
  if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'Supuestos gerenciales inválidos.');
  const num=(v,d,max,integer=false)=>{if(v===undefined)return d;if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||integer&&!Number.isInteger(v))fail(400,'Revisa las tasas y metas gerenciales.');return v;};
  const note=value.rateNote??'';if(typeof note!=='string'||note.length>1000)fail(400,'La justificación de tasa admite hasta 1000 caracteres.');
  return {annualRate:num(value.annualRate,12,1000),targetRoi:num(value.targetRoi,null,1000),maxCapital:num(value.maxCapital,null,1e12),targetMonths:num(value.targetMonths,null,240,true),rateNote:note.trim()};
}
export const executiveFrom=e=>validateExecutive(e?.executive??{});
const money=n=>{const value=Math.round(n*100)/100;return value===0?0:value;};
const add=rs=>rs.some(n=>n===null)?null:money(rs.reduce((s,n)=>s+n,0));

// Positive polynomial roots in q=1/(1+r), isolated by derivative turning points.
// Unlike a single guessed IRR, this also detects separate or repeated roots.
function signChanges(a){let prior=0,count=0;for(const v of a){const s=Math.sign(v);if(s&&prior&&s!==prior)count++;if(s)prior=s;}return count;}
function evaluate(a,q,absolute=false){if(q<=1){let y=0;for(let i=a.length-1;i>=0;i--)y=y*q+(absolute?Math.abs(a[i]):a[i]);return y;}let y=absolute?Math.abs(a[0]):a[0];for(let i=1;i<a.length;i++)y=y/q+(absolute?Math.abs(a[i]):a[i]);return y;}
function positiveRoots(coefficients){
  const a=[...coefficients];while(a.length&&a.at(-1)===0)a.pop();while(a.length&&a[0]===0)a.shift();if(a.length<2||!signChanges(a))return [];
  const norm=Math.max(...a.map(Math.abs));for(let i=0;i<a.length;i++)a[i]/=norm;
  const bound=1+Math.max(...a.slice(0,-1).map(v=>Math.abs(v/a.at(-1))));if(!Number.isFinite(bound))return null;
  const critical=signChanges(a)>1?positiveRoots(a.slice(1).map((v,i)=>v*(i+1))):[];if(critical===null)return null;
  const points=[0,...critical.filter(q=>q>0&&q<bound),bound],roots=[];
  const near=(q,y)=>Math.abs(y)<=Math.max(Number.MIN_VALUE,evaluate(a,q,true)*2e-12);
  for(const q of points.slice(1,-1))if(near(q,evaluate(a,q)))roots.push(q);
  for(let i=0;i<points.length-1;i++){
    let lo=points[i],hi=points[i+1],left=evaluate(a,lo),right=evaluate(a,hi);
    if(left===0&&lo>0)roots.push(lo);if(right===0)roots.push(hi);if(!left||!right||Math.sign(left)===Math.sign(right))continue;
    for(let k=0;k<220;k++){const mid=(lo+hi)/2,val=evaluate(a,mid);if(val===0){lo=hi=mid;break;}if(Math.sign(val)===Math.sign(left)){lo=mid;left=val;}else hi=mid;if(hi-lo<=1e-13*Math.max(Math.abs(lo),Math.abs(hi),1e-100))break;}
    roots.push((lo+hi)/2);
  }
  return roots.sort((a,b)=>a-b).filter((q,i,all)=>q>0&&(!i||Math.abs(q-all[i-1])>1e-8*Math.max(q,all[i-1])));
}
export function investmentReturns(flows,annualRate=12){
  if(!Array.isArray(flows)||!flows.length||flows.some(n=>typeof n!=='number'||!Number.isFinite(n))||annualRate!==null&&(typeof annualRate!=='number'||!Number.isFinite(annualRate)||annualRate<0||annualRate>1000))return {npv:null,monthlyRate:null,irr:null,monthlyIrr:null,irrStatus:'invalid',roots:[]};
  const monthlyRate=annualRate===null?null:Math.expm1(Math.log1p(annualRate/100)/12),npv=monthlyRate===null?null:flows.reduce((s,n,t)=>s+n/Math.pow(1+monthlyRate,t),0);
  const nonzero=flows.filter(n=>n!==0);let irrStatus='none',roots=[];
  if(nonzero.some(n=>n<0)&&nonzero.some(n=>n>0)){
    const q=positiveRoots(flows);if(q===null)irrStatus='invalid';else {roots=q.map(n=>({monthly:(1/n-1)*100,annual:Math.expm1(-12*Math.log(n))*100}));irrStatus=roots.length>1?'multiple':roots.length===1?'unique':'none';}
    if(nonzero[0]>0)irrStatus='financing';
  }
  const root=irrStatus==='unique'?roots[0]:null;if(root&&!Number.isFinite(root.annual))irrStatus='range';
  return {npv:npv!==null&&Number.isFinite(npv)?money(npv):null,monthlyRate:monthlyRate===null?null:monthlyRate*100,irr:irrStatus==='unique'?root.annual:null,monthlyIrr:irrStatus==='unique'?root.monthly:null,irrStatus,roots};
}

function recovery(rows,field){if(!rows.some(r=>r[field]<0))return {month:null,status:'notRequired'};const row=rows.find((r,i)=>rows.slice(0,i).some(p=>p[field]<0)&&r[field]>=0&&rows.slice(i).every(p=>p[field]>=0));return {month:row?.month??null,status:row?'recovered':'unrecovered'};}

export function executiveSummary({configuration={},land={},urban={},district='',economics={},settings=executiveFrom(economics)}={}){
  const v=validateExecutive(settings),evaluation=evaluationFrom(economics),flowSettings=cashflowFrom(economics),comparisonWithoutIgv=!flowSettings.igv.enabled;flowSettings.igv.enabled=true;
  const source=cashflowSummary({configuration,land,urban,district,economics,settings:flowSettings});
  const projectEconomics={...economics,evaluation:{...evaluation,costs:{...evaluation.costs,finance:{...evaluation.costs.finance,status:'na'}}}};
  const project=cashflowSummary({configuration,land,urban,district,economics:projectEconomics,settings:flowSettings});
  const tax=taxSummary(project.economic,project.ownedLand),budget=budgetSummary(project.economic,project.ownedLand),pending=[...project.pending];
  const costValues=tax.rows.filter(r=>!r.income).map(r=>{if(r.base===null||r.tax===null)return null;const pct=r.rule.creditPercent??flowSettings.igv.creditPercent;if(r.tax&&pct===null)return null;return money(r.base+r.tax-Math.round(r.tax*100*(pct??0)/100)/100);});
  const cost=budget.costTotals.total===null?null:add(costValues),income=budget.incomeTotals.base,profit=cost===null||income===null?null:money(income-cost);
  if(cost===null||income===null)pending.push('Completa el presupuesto y su clasificación de IGV para conciliar el resultado del proyecto.');
  const dataComplete=project.complete&&cost!==null&&income!==null,ownedValue=project.ownedLand?project.nonCashLand??0:0;
  const residential=budget.incomes[0].base,parking=budget.incomes[1].base,others=budget.incomes[2],units=project.units??0,parkingUnits=project.economic.physical.metrics.commercial??0;
  let sold=0,parkSold=0,otherReceived=0,cumulativeInvestment=0,receipts=0,payments=0;
  const months=project.months.map(m=>{sold+=m.presales+m.sales;parkSold+=m.parking;otherReceived+=m.otherIncome;receipts+=m.income;payments+=m.cost;const adjustment=m.month===0?Math.round(ownedValue*100):0,investmentNet=m.net-adjustment;cumulativeInvestment+=investmentNet;
    const res=units&&residential!==null?Math.round(residential*100*sold/units):0,park=parkingUnits&&parking!==null?Math.round(parking*100*parkSold/parkingUnits):0,other=others.total&&others.base!==null?Math.round(others.base*100*otherReceived/Math.round(others.total*100)):0;
    return {month:m.month,label:m.label,sold,parkingSold:parkSold,sales:money((res+park+other)/100),receipts:receipts/100,payments:payments/100,net:m.net/100,cash:m.cumulative/100,ownedAdjustment:adjustment/100,investmentNet:investmentNet/100,investmentBalance:cumulativeInvestment/100,taxPayment:m.igv.payment/100};});
  const returns=dataComplete?investmentReturns(months.map(m=>m.investmentNet),v.annualRate):{npv:null,monthlyRate:null,irr:null,monthlyIrr:null,irrStatus:'pending',roots:[]};
  const threshold=cost,breakRow=dataComplete&&cost>0?months.find(m=>m.sales>=cost-.005):null;
  const breakEven={status:!dataComplete?'pending':cost===0?'notApplicable':breakRow?'reached':'unreached',month:breakRow?.month??null,sales:breakRow?.sales??null,units:breakRow?.sold??null,parking:breakRow?.parkingSold??null,requiredShare:income===null||income===0||cost===null?null:cost/income*100,threshold};
  const cashRecovery=dataComplete?recovery(months,'cash'):{month:null,status:'pending'},economicRecovery=dataComplete?recovery(months,'investmentBalance'):{month:null,status:'pending'};
  const critical=dataComplete&&months.length?months.reduce((a,b)=>b.cash<a.cash?b:a):null,deficit=dataComplete?project.deficit:null;
  const bridge=dataComplete?money((months.at(-1)?.investmentBalance??0)-(profit+(flowSettings.igv.openingCredit??0)-project.igv.closingCredit)):null;
  if(bridge!==null&&Math.abs(bridge)>.02)pending.push('La utilidad y la caja no concilian: revisa los importes y el horizonte.');
  const complete=dataComplete&&pending.length===0,roi=complete&&cost>0?profit/cost*100:null,margin=complete&&income>0?profit/income*100:null;
  const targets=[{key:'npv',label:'VAN del proyecto',value:complete?returns.npv:null,target:0,pass:returns.npv===null?null:returns.npv>=0},{key:'irr',label:'TIR anual equivalente',value:complete?returns.irr:null,target:v.annualRate,pass:returns.irr===null||v.annualRate===null?null:returns.irr+1e-7>=v.annualRate},{key:'roi',label:'Rentabilidad total sobre costo',value:roi,target:v.targetRoi,pass:roi===null||v.targetRoi===null?null:roi>=v.targetRoi},{key:'capital',label:'Déficit monetario máximo',value:deficit,target:v.maxCapital,pass:deficit===null||v.maxCapital===null?null:deficit<=v.maxCapital},{key:'months',label:'Horizonte total del perfil',value:complete?project.horizon:null,target:v.targetMonths,pass:v.targetMonths===null?null:project.horizon<=v.targetMonths}].map(r=>({...r,pass:complete?r.pass:null}));
  const sourceFinance=source.paymentRows.find(r=>r.key==='finance')?.cash??null;
  const warnings=[...project.warnings,'Perfil estimado antes de IR, sin deuda ni aportes. La tasa objetivo no es un WACC validado.'];
  if(comparisonWithoutIgv)warnings.push('Esta evaluación incorpora IGV estimado aunque la comparación del Flujo de caja esté desactivada.');
  if(project.igv.creditAssumed)warnings.push(`Se utiliza el crédito fiscal propuesto del ${flowSettings.igv.creditPercent}% donde no hay porcentaje específico.`);
  if(returns.irrStatus==='multiple')warnings.push('El flujo admite varias TIR: se omite una tasa única. Usa el VAN y revisa el flujo.');
  if(project.igv.closingCredit>0)warnings.push('Existe saldo a favor de IGV al cierre; no se incorpora como cobro ni valor terminal.');
  return {settings:v,complete,pending:[...new Set(pending)],warnings:[...new Set(warnings)],currency:evaluation.currency,source,project,months,returns:complete?returns:{...returns,npv:null,irr:null,monthlyIrr:null,irrStatus:'pending'},metrics:{income:complete?income:null,cost:complete?cost:null,profit:complete?profit:null,roi,margin,deficit:complete?deficit:null,criticalMonth:deficit>0?critical?.month??null:null,landShare:complete&&income>0?(budget.costs[0].base??0)/income*100:null,costPerSaleArea:complete&&project.economic.physical.metrics.sale>0?cost/project.economic.physical.metrics.sale:null,pricePerSaleArea:complete&&project.economic.physical.metrics.sale>0&&residential!==null?residential/project.economic.physical.metrics.sale:null,commercialPerUnit:complete&&units>0?add(tax.rows.filter(r=>r.source.key==='marketing').map(r=>r.base===null||r.tax===null?null:money(r.base+r.tax-Math.round(r.tax*100*(r.rule.creditPercent??flowSettings.igv.creditPercent??0)/100)/100)))/units:null},breakEven:complete?breakEven:{...breakEven,status:'pending',month:null},cashRecovery:complete?cashRecovery:{month:null,status:'pending'},economicRecovery:complete?economicRecovery:{month:null,status:'pending'},targets,bridge:{difference:bridge,ownedValue,openingCredit:flowSettings.igv.openingCredit,closingCredit:project.igv.closingCredit,sourceFinance,sourceNet:source.complete?source.totals.net:null,projectCashNet:complete?project.totals.net:null,investmentCashNet:complete?months.at(-1)?.investmentBalance??0:null}};
}
