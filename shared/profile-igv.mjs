import {budgetSummary} from './budget.mjs';
import {taxSummary} from './tax.mjs';

const cents=n=>n===null?null:Math.round(n*100),MAX=240;
const zero=()=>({debit:0,inputTax:0,creditGenerated:0,creditAvailable:0,openingCredit:0,due:0,closingCredit:0,payment:0});
// All monthly values are integer cents, like the source cash-flow matrix.
export function profileIgv(base,economics,labelMonth){
  const config=base.settings.igv;
  if(!config.enabled)return {...base,months:base.months.map(m=>({...m,operatingNet:m.net,igv:zero()})),igv:{enabled:false,creditAssumed:0,debit:0,inputTax:0,credit:0,paid:0,closingCredit:0,unpaid:0,pending:[],assumptions:[]}};
  const budget=budgetSummary(base.economic,base.ownedLand),tax=taxSummary(base.economic,base.ownedLand),pending=[];
  const assumptions=['Perfil estimado: comprobantes coinciden con pagos; el crédito se aplica con el desfase elegido.','Saldo a favor se arrastra, sin devolución automática. Antes de IR; no modela detracciones ni fondos restringidos.'];
  for(const [key,label] of [['creditPercent','Crédito fiscal propuesto'],['creditLag','Desfase del crédito'],['paymentLag','Desfase del pago de IGV'],['openingCredit','Saldo a favor inicial']])if(config[key]===null)pending.push(`Completa ${label.toLowerCase()}.`);
  for(const row of tax.rows)if(row.total===null||row.tax===null)pending.push(`IGV de ${row.label}: revisa importe, afectación y criterio con/sin IGV en Evaluación económica.`);
  if(!base.months.length)return {...base,complete:false,deficit:null,recoveryMonth:null,pending:[...new Set([...base.pending,...pending])],igv:{enabled:true,creditAssumed:0,debit:0,inputTax:0,credit:0,paid:0,closingCredit:0,unpaid:0,pending,assumptions}};
  const months=Array.from({length:MAX+1},(_,month)=>{const m=base.months[month];return {...(m??{month,label:labelMonth(month),presales:0,sales:0,parking:0}),residential:0,parkingIncome:0,otherIncome:0,incomeRounding:0,payments:Object.fromEntries(base.paymentRows.map(p=>[p.key,0])),costRounding:0,income:0,cost:0,net:0,operatingNet:0,cumulative:0,igv:zero()};});
  let latest=base.horizon,creditAssumed=0;
  // Do not normalise a partial source schedule to a full budget: preserve its coverage.
  function allocate(source,expected,target,put){if(expected===null||target===null)return;if(expected===0)return;let collected=0,previous=0;for(const m of base.months){collected+=source(m);const next=Math.round(target*collected/expected);put(m.month,next-previous);previous=next;}}
  function splitTax(series,totalGross,totalTax,put){if(!totalGross||totalTax===null)return;let collected=0,previous=0;for(let i=0;i<months.length;i++){collected+=series(months[i]);const next=Math.round(totalTax*collected/totalGross);put(i,next-previous);previous=next;}}
  for(const [key,sourceKey] of [['residential','residential'],['parking','parkingIncome'],['others','otherIncome']]){const row=budget.incomes.find(p=>p.key===key),gross=cents(row.total),taxTotal=cents(row.tax),original=cents(base.economic.revenues[key]);allocate(m=>m[sourceKey],original,gross,(month,n)=>months[month][sourceKey]=n);splitTax(m=>m[sourceKey],gross,taxTotal,(month,n)=>months[month].igv.debit+=n);}
  const paymentRows=base.paymentRows.map(row=>{const b=budget.costs.find(c=>c.key===row.key),cash=row.nonCash?0:b.total,groupTax=tax.rows.filter(r=>!r.income&&(r.source.key===row.key)),gross=cents(cash);let credit=0;
    for(const part of groupTax){if(row.nonCash||part.tax===null)continue;const amount=cents(part.tax),pct=part.rule.creditPercent??config.creditPercent??0;credit+=Math.round(amount*pct/100);if(part.rule.creditPercent===null&&amount)creditAssumed+=amount;}
    allocate(m=>m.payments[row.key],cents(row.cash),gross,(month,n)=>months[month].payments[row.key]=n);
    splitTax(m=>m.payments[row.key],gross,row.nonCash?0:cents(b.tax),(month,n)=>months[month].igv.inputTax+=n);
    splitTax(m=>m.payments[row.key],gross,credit,(month,n)=>months[month].igv.creditGenerated+=n);
    return {...row,sourceTotal:row.total,total:b.total,cash};});
  function at(month,field,amount){if(!amount)return;if(month>MAX){pending.push(`El IGV supera el horizonte de ${MAX} meses; reduce plazos o desfases.`);return;}months[month].igv[field]+=amount;latest=Math.max(latest,month);}
  for(const m of months)if(m.igv.creditGenerated)at(m.month+(config.creditLag??0),'creditAvailable',m.igv.creditGenerated);
  let carry=cents(config.openingCredit)??0,dueTotal=0;
  for(const m of months){const i=m.igv;i.openingCredit=carry;i.due=Math.max(0,i.debit-i.creditAvailable-carry);carry=Math.max(0,carry+i.creditAvailable-i.debit);i.closingCredit=carry;dueTotal+=i.due;at(m.month+(config.paymentLag??1),'payment',i.due);}
  let cumulative=0;for(const m of months){m.income=m.residential+m.parkingIncome+m.otherIncome;m.cost=Object.values(m.payments).reduce((a,b)=>a+b,0)+m.igv.payment;m.operatingNet=m.income-m.cost+m.igv.payment;m.net=m.income-m.cost;cumulative+=m.net;m.cumulative=cumulative;}
  const rows=months.slice(0,latest+1),total=k=>rows.reduce((s,m)=>s+m.igv[k],0)/100,paid=total('payment');
  const income=rows.reduce((s,m)=>s+m.income,0)/100,cost=rows.reduce((s,m)=>s+m.cost,0)/100,supplierCost=rows.reduce((s,m)=>s+Object.values(m.payments).reduce((a,b)=>a+b,0),0)/100;
  const allPending=[...new Set([...base.pending,...pending])],complete=base.complete&&allPending.length===0,low=Math.min(0,...rows.map(m=>m.cumulative));
  const recovery=complete?rows.find((m,i)=>rows.slice(0,i).some(n=>n.cumulative<0)&&m.cumulative>=0&&rows.slice(i).every(n=>n.cumulative>=0))?.month??null:null;
  if(creditAssumed)assumptions.unshift(`Crédito fiscal propuesto ${config.creditPercent??0}% donde la partida no tiene porcentaje definido; los porcentajes explícitos se conservan.`);
  return {...base,paymentRows,months:rows,complete,pending:allPending,totals:{income,cost,net:Math.round((income-cost)*100)/100,supplierCost,taxPaid:paid},incomeDifference:budget.incomeTotals.total===null?null:Math.round((income-budget.incomeTotals.total)*100)/100,costDifference:budget.costTotals.total===null?null:Math.round((supplierCost-budget.costTotals.total+(base.ownedLand?budget.costs[0].total??0:0))*100)/100,deficit:complete?Math.max(0,-low/100):null,recoveryMonth:recovery,horizon:latest,igv:{enabled:true,creditAssumed:creditAssumed/100,debit:total('debit'),inputTax:total('inputTax'),credit:total('creditAvailable'),paid,closingCredit:(rows.at(-1)?.igv.closingCredit??0)/100,unpaid:Math.round((dueTotal/100-paid)*100)/100,pending,assumptions}};
}
