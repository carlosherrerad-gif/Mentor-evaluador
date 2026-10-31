import {validateTax} from './tax.mjs';
import {potentialSummary} from './potential.mjs';

export const costGroups=[['acquisition','Gastos de adquisición'],['construction','Construcción contratada'],['design','Diseño y especialidades'],['permits','Licencias y trámites'],['administration','Administración inmobiliaria'],['marketing','Comercialización'],['aftercare','Postventa y contingencias'],['finance','Financiamiento estimado']];
export const bases=[['fixed','Importe fijo'],['floors','m² de pisos'],['basements','m² de sótanos'],['roof','m² techados de azotea'],['built','m² construidos totales'],['units','Viviendas'],['parking','Estacionamientos comercializables'],['months','Meses'],['sales','% de ventas base'],['construction','% de construcción'],['land','% del terreno']];
export function emptyCost(){return {status:'pending',mode:'quick',basis:'fixed',amount:null,months:null,floors:null,basements:null,roof:null,items:[],note:''};}
export function validateEvaluation(value={},fail=(s,m)=>{throw Error(m);}){
  const obj=(v)=>{if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'Revisa los supuestos económicos.');return v;};
  obj(value);if(JSON.stringify(value).length>48000)fail(413,'Los supuestos económicos superan el tamaño admitido.');if(value.costs!==undefined)obj(value.costs);
  const choice=(v,options,d)=>{v=v??d;if(!options.includes(v))fail(400,'Opción económica inválida.');return v;};
  const num=(v,max=1e12,integer=false)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||integer&&!Number.isInteger(v))fail(400,'Importe o cantidad económica inválida.');return v;};
  const str=(v,max=1500)=>{v=v??'';if(typeof v!=='string'||v.length>max)fail(400,'Texto económico inválido o demasiado largo.');return v.trim();};
  const list=(v,max)=>{v=v??[];if(!Array.isArray(v)||v.length>max)fail(400,'Demasiadas partidas económicas.');return v;};
  const costs={};for(const [key] of costGroups){const c=obj(value.costs?.[key]??{}),baseOptions=bases.map(b=>b[0]).filter(b=>key!=='construction'||!['construction','sales','land'].includes(b));
    const part=p=>{obj(p);const basis=choice(p.basis,baseOptions,'fixed');return {name:str(p.name,120),basis,amount:num(p.amount,basis==='sales'||basis==='construction'||basis==='land'?100:1e12),months:num(p.months,1200,true),tax:validateTax(p.tax,fail)};};
    const p=part(c);costs[key]={status:choice(c.status,['pending','active','na','included'],'pending'),mode:choice(c.mode,key==='construction'?['quick','detail','rates']:['quick','detail'],'quick'),basis:p.basis,amount:p.amount,months:p.months,floors:num(c.floors),basements:num(c.basements),roof:num(c.roof),items:list(c.items,80).map(part),note:str(c.note),tax:validateTax(c.tax,fail)};
  }
  const taxes={};if(value.taxes!==undefined)obj(value.taxes);for(const key of ['residential','parking','land'])taxes[key]=validateTax(value.taxes?.[key],fail);
  return {taxes,currency:choice(value.currency,['PEN','USD'],'PEN'),fx:num(value.fx,10000),taxBasis:choice(value.taxBasis,['pending','included','excluded'],'pending'),salesPrice:num(value.salesPrice),parkingPrice:num(value.parkingPrice),hypothesisPrice:num(value.hypothesisPrice),priceGroups:list(value.priceGroups,100).map(p=>{obj(p);const from=num(p.from,200,true),to=num(p.to,200,true);if(from===0||to===0)fail(400,'Rango de pisos inválido.');return {from,to,price:num(p.price)};}),otherIncome:list(value.otherIncome,80).map(p=>{obj(p);return {name:str(p.name,120),amount:num(p.amount),tax:validateTax(p.tax,fail)};}),costs,reviewKey:str(value.reviewKey,50000),notes:str(value.notes)};
}
export const evaluationFrom=economics=>validateEvaluation(economics?.evaluation??{});
const sum=values=>values.some(v=>v===null)?null:values.reduce((a,b)=>a+b,0);
const product=(q,p)=>q===0?0:q===null||p===null?null:q*p;
export function economicSummary({configuration={},land={},urban={},district='',economics={},evaluation=evaluationFrom(economics),today='2026-10-25'}={}){
  const v=validateEvaluation(evaluation),physical=potentialSummary({configuration,land,urban,district,today}),pending=[],warnings=[];
  const need=(condition,message)=>{if(condition)pending.push(message);};
  const reviewKey=JSON.stringify({area:land.area??null,rows:physical.base.rows.map(r=>[r.floor,r.constructed,r.sale,r.units]),basements:physical.extra.basements,roof:physical.extra.roofBuilt,parking:physical.metrics.commercial,acquisition:economics.acquisition??null});
  let pricingInvalid=false;const assigned=new Set();
  for(const group of v.priceGroups){if(group.from===null||group.to===null||group.price===null||group.from>group.to){pricingInvalid=true;continue;}for(let floor=group.from;floor<=group.to;floor++){if(assigned.has(floor)||!physical.base.rows.some(r=>r.floor===floor))pricingInvalid=true;assigned.add(floor);}}
  need(pricingInvalid,'Completa los rangos de precios: deben existir y no superponerse.');
  const floorSales=physical.base.rows.map(r=>{const group=v.priceGroups.find(p=>p.from!==null&&p.to!==null&&r.floor>=p.from&&r.floor<=p.to);return {floor:r.floor,area:r.sale,price:group?group.price:v.salesPrice,amount:product(r.sale,group?group.price:v.salesPrice),detail:!!group};});
  const residential=!physical.hasLevels||pricingInvalid?null:sum([...floorSales.map(r=>r.amount),product(physical.extra.supportedSale,v.salesPrice)]);
  const parking=product(physical.metrics.commercial,v.parkingPrice),others=sum(v.otherIncome.map(p=>p.name? p.amount:null));
  const revenue=sum([residential,parking,others]),hypothesis=product(physical.metrics.hypothesis,v.hypothesisPrice);
  need(residential===null,'Completa el edificio, las áreas vendibles y sus precios.');need(parking===null,'Completa los estacionamientos comercializables y su precio.');need(others===null,'Completa concepto e importe de los otros ingresos.');
  const a=economics.acquisition??{};let landCost=a.amount===undefined||a.amount===null?null:a.basis==='unit'?product(land.area??null,a.amount):a.amount;
  if(a.currency&&a.currency!==v.currency&&landCost!==0){landCost=v.fx===null||v.fx<=0?null:landCost===null?null:landCost*(a.currency==='USD'?v.fx:1/v.fx);need(v.fx===null||v.fx<=0,'Define el tipo de cambio PEN por USD para la adquisición.');}
  need(landCost===null,'Completa la adquisición o el valor reconocido al terreno en Datos del proyecto.');
  const fixed=c=>c.status==='active'&&(c.mode==='detail'?c.items.some(p=>p.basis==='fixed'):c.mode==='quick'&&c.basis==='fixed');
  const manualReview=costGroups.some(([key])=>fixed(v.costs[key]))&&v.reviewKey!==reviewKey;
  need(manualReview,'Revisa los importes fijos y su alcance para el edificio y terreno actuales.');
  need(v.taxBasis==='pending','Define si los importes gravados se ingresan con o sin impuestos.');
  need(!physical.hasLevels||physical.metrics.constructed===null,'Completa todas las áreas construidas del edificio.');
  need(physical.base.manualReview||physical.extra.manualReview,'Revisa las superficies manuales del edificio para el terreno actual.');
  warnings.push(...physical.warnings);if(a.mode==='owned')warnings.push('Terreno propio: se incluye su valor reconocido como costo económico; no representa un pago de compra.');
  const quantity=(basis,c,construction)=>({fixed:1,floors:physical.base.constructed,basements:physical.extra.basements,roof:physical.extra.roofBuilt,built:physical.metrics.constructed,units:physical.metrics.units,parking:physical.metrics.commercial,months:c.months,sales:revenue===null?null:revenue/100,construction:construction===null?null:construction/100,land:landCost===null?null:landCost/100})[basis];
  function category(key,construction=null){const c=v.costs[key],label=costGroups.find(p=>p[0]===key)[1];
    if(c.status==='pending'){pending.push(`Define ${label.toLowerCase()}: pendiente, no aplica o incluido.`);return {key,label,total:null,parts:[]};}
    if(c.status==='na'||c.status==='included'){if(c.status==='included'&&!c.note)pending.push(`Indica dónde está incluido: ${label}.`);return {key,label,total:c.status==='included'&&!c.note?null:0,parts:[]};}
    let parts;
    if(key==='construction'&&c.mode==='rates')parts=[['floors','Pisos',c.floors],['basements','Sótanos',c.basements],['roof','Azotea techada',c.roof]].map(([basis,name,price])=>({name,basis,quantity:quantity(basis,c,construction),price,amount:product(quantity(basis,c,construction),price)}));
    else {const items=c.mode==='detail'?c.items:[{...c,name:label}];parts=items.map(p=>({name:p.name,basis:p.basis,quantity:quantity(p.basis,p,construction),price:p.amount,amount:p.name?product(quantity(p.basis,p,construction),p.amount):null}));}
    const total=!parts.length?null:sum(parts.map(p=>p.amount));need(total===null,`Completa cantidades, bases e importes de ${label.toLowerCase()}.`);return {key,label,total,parts};
  }
  const construction=category('construction');const categories=costGroups.map(([key])=>key==='construction'?construction:category(key,construction.total));
  const cost=sum([landCost,...categories.map(c=>c.total)]);need(!physical.hasLevels,'Registra los pisos del edificio antes de evaluar.');
  for(const error of [...physical.base.errors,...physical.extra.errors])pending.push(error);
  const complete=pending.length===0&&revenue!==null&&cost!==null;
  const profit=complete?revenue-cost:null;
  // La hipótesis vuelve a calcular los gastos ligados a ventas, sin alterar el caso base.
  let hypothesisProfit=null,hypothesisCost=null;
  if(complete&&hypothesis!==null){const extraSalesCosts=costGroups.reduce((s,[key])=>{const c=v.costs[key];if(c.status!=='active')return s;const rows=c.mode==='detail'?c.items:c.mode==='quick'?[c]:[];return s+rows.filter(r=>r.basis==='sales').reduce((n,r)=>n+(r.amount??0)*hypothesis/100,0);},0);hypothesisCost=cost+extraSalesCosts;hypothesisProfit=revenue+hypothesis-hypothesisCost;}
  return {evaluation:v,physical,reviewKey,manualReview,floorSales,revenues:{residential,parking,others,total:revenue,hypothesis},landCost,categories,cost,profit,returnOnCost:profit===null||cost===0?null:profit/cost*100,margin:profit===null||revenue===0?null:profit/revenue*100,hypothesisProfit,hypothesisCost,pending:[...new Set(pending)],warnings:[...new Set(warnings)],complete};
}
