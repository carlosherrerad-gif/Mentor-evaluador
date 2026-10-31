import {taxSummary,taxAmount,defaultTax} from './tax.mjs';
const fields=['base','tax','total'];
const sum=(rows,key)=>rows.some(r=>r[key]===null)?null:rows.reduce((s,r)=>s+Math.round(r[key]*100),0)/100;
export const salesPercentage=(amount,sales)=>amount===null||sales===null||sales===0?null:amount/sales*100;
function aggregate(rows,source){return Object.fromEntries(fields.map(k=>[k,source===null?null:sum(rows,k)]));}
// Distribute an aggregate classification in cents so detail always matches its subtotal.
function distribute(parts,parent){let weight=0;const total=parts.reduce((s,p)=>s+(p.amount??0),0),previous={base:0,tax:0};return parts.map(p=>{weight+=p.amount??0;const row={...p};for(const key of ['base','tax']){const next=parent[key]===null?null:total===0?0:Math.round(parent[key]*100*weight/total);row[key]=next===null?null:(next-previous[key])/100;if(next!==null)previous[key]=next;}row.total=row.base===null||row.tax===null?null:Math.round((row.base+row.tax)*100)/100;return row;});}
export function budgetSummary(result,ownedLand=false){
  const tax=taxSummary(result,ownedLand),v=result.evaluation;
  const residential=tax.rows.find(r=>r.key==='residential'),parking=tax.rows.find(r=>r.key==='parking');
  const floors=result.floorSales.map(p=>({label:`Piso ${p.floor}`,amount:p.amount}));
  const floorTotal=result.floorSales.reduce((s,p)=>s+(p.amount??0),0),supported=result.revenues.residential===null?null:result.revenues.residential-floorTotal;
  if(supported!==null&&supported>1e-7)floors.push({label:'Área adicional con sustento',amount:supported});
  const others=tax.rows.filter(r=>r.source.kind==='income').map(r=>({...r,label:r.label||'Sin concepto'}));
  const incomes=[{key:'residential',label:'Departamentos',...residential,parts:distribute(floors,residential)},{key:'parking',label:'Estacionamientos',...parking,parts:[]},{key:'others',label:'Otros ingresos',...aggregate(others,result.revenues.others),parts:others}];
  const land=tax.rows.find(r=>r.key==='land'),costs=[{...land,label:'Terreno del escenario',parts:[]}];
  for(const c of result.categories){const setting=v.costs[c.key],rows=tax.rows.filter(r=>r.source.key===c.key);let parts=[];
    if(setting.status==='active')parts=setting.mode==='detail'?c.parts.map((p,i)=>({...p,label:p.name||'Sin concepto',...taxAmount(p.amount,defaultTax(setting.items[i]?.tax,c.key,v.taxBasis))})):distribute(c.parts.map(p=>({...p,label:p.name})),rows[0]);
    costs.push({key:c.key,label:c.label,...aggregate(rows,c.total),parts});
  }
  const incomeTotals=aggregate(incomes,result.revenues.total),costTotals=aggregate(costs,result.cost);
  const addShare=r=>({...r,share:salesPercentage(r.total,incomeTotals.total),parts:r.parts.map(p=>({...p,share:salesPercentage(p.total,incomeTotals.total)}))});
  return {incomes:incomes.map(addShare),costs:costs.map(addShare),incomeTotals:{...incomeTotals,share:salesPercentage(incomeTotals.total,incomeTotals.total)},costTotals:{...costTotals,share:salesPercentage(costTotals.total,incomeTotals.total)}};
}
