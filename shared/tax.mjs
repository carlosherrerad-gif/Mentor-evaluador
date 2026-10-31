// Classification only: no monthly settlement or automatic tax refund.
export function taxChoice(rule){const v=validateTax(rule);if(['unaffected','exempt'].includes(v.status))return 'none';if(v.status!=='taxed')return null;const effective=v.rate*(v.regime==='property'?.5:v.regime==='custom'?v.taxablePercent/100:1);return Math.abs(effective-18)<1e-8?'18':Math.abs(effective-9)<1e-8?'9':null;}
export function chooseTax(rule,choice){const v=validateTax(rule);if(!['none','18','9'].includes(choice))throw Error('Selecciona sin IGV, 18 % o 9 % efectivo.');return {...v,status:choice==='none'?(v.status==='exempt'?'exempt':'unaffected'):'taxed',regime:choice==='9'?'property':'standard',rate:18,taxablePercent:100};}
export function defaultTax(rule,key,input='pending'){const v=validateTax(rule);if(v.status!=='pending')return v;return {...chooseTax(v,['residential','parking'].includes(key)?'9':['land','permits','finance'].includes(key)?'none':'18'),input:v.input==='pending'?input:v.input};}
export function withTaxDefaults(evaluation){const v=structuredClone(evaluation);for(const key of ['residential','parking','land'])v.taxes[key]=defaultTax(v.taxes[key],key,v.taxBasis);for(const [key,c] of Object.entries(v.costs)){c.tax=defaultTax(c.tax,key,v.taxBasis);c.items=c.items.map(p=>({...p,tax:defaultTax(p.tax,key,v.taxBasis)}));}v.otherIncome=v.otherIncome.map(p=>({...p,tax:defaultTax(p.tax,'income',v.taxBasis)}));return v;}
export function validateTax(value={},fail=(s,m)=>{throw Error(m);}){
  if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'Tratamiento de IGV inválido.');
  const option=(v,choices,d)=>{v=v??d;if(!choices.includes(v))fail(400,'Opción de IGV inválida.');return v;};
  const percent=(v,d)=>{v=v===undefined?d:v;if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))fail(400,'Porcentaje de IGV inválido.');return v;};
  const note=value.note??'';if(typeof note!=='string'||note.length>500)fail(400,'El sustento de IGV admite hasta 500 caracteres.');
  return {status:option(value.status,['pending','taxed','exempt','unaffected'],'pending'),input:option(value.input,['pending','included','excluded'],'pending'),regime:option(value.regime,['standard','property','custom'],'standard'),rate:percent(value.rate,18),taxablePercent:percent(value.taxablePercent,100),creditPercent:percent(value.creditPercent,null),note:note.trim()};
}
export function taxAmount(amount,rule={},income=false){
  const v=validateTax(rule),pending=[];
  if(amount===0)return {rule:v,base:0,tax:0,total:0,credit:0,nonRecoverable:0,economic:0,pending};
  if(amount===null||!Number.isFinite(amount)||amount<0)pending.push('Completa el importe.');
  if(v.status==='pending')pending.push('Define la afectación.');
  if(v.status==='exempt'&&!v.note)pending.push('Sustenta la exoneración aplicable.');
  const taxed=v.status==='taxed';
  if(taxed){if(v.input==='pending')pending.push('Indica si el importe incluye IGV.');if(v.rate===null||v.rate===0)pending.push('Define una tasa positiva.');if(v.regime==='custom'&&(v.taxablePercent===null||!v.note))pending.push('Define la proporción gravada y su sustento.');}
  if(amount!==null&&!Number.isSafeInteger(Math.round(amount*100)))pending.push('Importe fuera de precisión en centavos.');
  if(pending.length)return {rule:v,base:null,tax:null,total:null,credit:null,nonRecoverable:null,economic:null,pending};
  const entered=Math.round(amount*100),fraction=v.regime==='property'?.5:v.regime==='custom'?v.taxablePercent/100:1,effective=taxed?v.rate/100*fraction:0;
  if(taxed&&!income&&v.creditPercent===null)pending.push('Define el porcentaje de crédito fiscal aprovechable.');if(taxed&&!income&&v.creditPercent>0&&!v.note)pending.push('Sustenta el crédito fiscal proyectado.');
  const base=v.input==='included'&&taxed?Math.round(entered/(1+effective)):entered,tax=v.input==='included'&&taxed?entered-base:Math.round(base*effective),total=base+tax,credit=pending.length?null:income?0:Math.round(tax*(v.creditPercent??0)/100),nonRecoverable=credit===null?null:income?0:tax-credit;
  return {rule:v,base:base/100,tax:tax/100,total:total/100,credit:credit===null?null:credit/100,nonRecoverable:nonRecoverable===null?null:nonRecoverable/100,economic:nonRecoverable===null?null:(income?base:base+nonRecoverable)/100,pending};
}
export function taxSummary(result,ownedLand=false){
  const v=result.evaluation,rows=[];
  const add=(key,label,amount,rule,income,source)=>{const original=validateTax(rule),resolved=defaultTax(original,source.key??key,v.taxBasis);rows.push({key,label,amount,income,source,suggested:original.status==='pending',...taxAmount(amount,resolved,income)});};
  add('residential','Departamentos',result.revenues.residential,v.taxes.residential,true,{kind:'main',key:'residential'});
  add('parking','Estacionamientos',result.revenues.parking,v.taxes.parking,true,{kind:'main',key:'parking'});
  v.otherIncome.forEach((p,i)=>add(`income-${i}`,p.name||`Otro ingreso ${i+1}`,p.amount,p.tax,true,{kind:'income',index:i}));
  add('land','Terreno reconocido',result.landCost,ownedLand?{status:'unaffected'}:v.taxes.land,false,{kind:'main',key:'land'});rows.at(-1).nonCash=ownedLand;
  for(const c of result.categories){const setting=v.costs[c.key];if(setting.status!=='active')continue;
    if(setting.mode==='detail')c.parts.forEach((p,i)=>add(`${c.key}-${i}`,`${c.label} · ${p.name||i+1}`,p.amount,setting.items[i]?.tax,false,{kind:'part',key:c.key,index:i}));
    else add(c.key,c.label,c.total,setting.tax,false,{kind:'cost',key:c.key});
  }
  const sum=(rs,key)=>rs.some(r=>r[key]===null)?null:rs.reduce((s,r)=>s+Math.round(r[key]*100),0)/100;
  const incomes=rows.filter(r=>r.income),costs=rows.filter(r=>!r.income),income=sum(incomes,'economic'),cost=sum(costs,'economic');
  const pending=rows.flatMap(r=>r.pending.map(p=>`${r.label}: ${p}`));
  const sourceIncome=result.revenues.total!==null,sourceCost=result.cost!==null;
  return {rows,pending,complete:pending.length===0&&result.complete,income:sourceIncome?income:null,cost:sourceCost?cost:null,profit:pending.length===0&&result.complete&&income!==null&&cost!==null?Math.round((income-cost)*100)/100:null,incomeTax:sourceIncome?sum(incomes,'tax'):null,purchaseTax:sourceCost?sum(costs,'tax'):null,credit:sourceCost?sum(costs,'credit'):null,nonRecoverable:sourceCost?sum(costs,'nonRecoverable'):null,incomeTotal:sourceIncome?sum(incomes,'total'):null,costTotal:sourceCost?sum(costs,'total'):null};
}
