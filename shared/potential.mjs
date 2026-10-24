import {buildingFrom,buildingSummary} from './building.mjs';
import {extraSummary} from './building-extra.mjs';
import {urbanChecks} from './urban-checks.mjs';

// Consolida resultados existentes; no mantiene un segundo motor de áreas.
export function potentialSummary({configuration={},urban={},land={},district='',today}){
  const model=buildingFrom(configuration),area=land.area??null,base=buildingSummary(model,area),extra=extraSummary(model.extensions,area,base);
  const checks=urbanChecks({configuration,urban,land,district,today}),hasLevels=base.rows.length>0;
  const origin=(rows,key)=>{const kinds=[...new Set(rows.map(r=>r[key]))];return !kinds.length?'Pendiente':kinds.length>1?'Mixto':kinds[0]==='manual'?'Manual':'Automático';};
  const groups=[
    {id:'floors',name:'Pisos sobre el terreno',constructed:base.constructed,sale:base.sale,hypothesis:hasLevels?0:null,units:base.units,constructedOrigin:origin(base.rows,'constructedMode'),saleOrigin:origin(base.rows,'saleMode'),note:'Los pisos especiales reemplazan a los típicos. El segundo nivel de dúplex entre pisos ya está incluido.'},
    {id:'basements',name:'Sótanos',constructed:hasLevels?extra.basements:null,sale:hasLevels?0:null,hypothesis:hasLevels?0:null,units:hasLevels?0:null,constructedOrigin:extra.basementRows.length?origin(extra.basementRows,'mode'):'No incluidos',saleOrigin:'No aplica',note:'Sin área vendible residencial ni nuevas viviendas.'},
    {id:'roof',name:'Azotea',constructed:hasLevels?extra.roofBuilt:null,sale:hasLevels?extra.supportedSale:null,hypothesis:hasLevels?extra.hypotheticalSale:null,units:hasLevels?0:null,constructedOrigin:model.extensions.roof.enabled?'Manual':'No incluida',saleOrigin:model.extensions.roof.enabled?'Manual':'No aplica',note:'El nivel superior del dúplex se registra una vez. Su venta se separa según el sustento registrado por el analista.'},
  ];
  const pending=[];
  if(!hasLevels)pending.push('Define la cantidad de pisos del edificio.');
  if(base.units===null)pending.push('Completa los departamentos de la planta típica y de los pisos especiales.');
  if(base.constructed===null)pending.push('Completa las áreas construidas automáticas o manuales de los pisos.');
  if(base.sale===null)pending.push('Completa la eficiencia o las áreas vendibles residenciales de los pisos.');
  if(extra.basements===null)pending.push('Completa las áreas de los sótanos.');
  if(extra.roofBuilt===null)pending.push('Completa las superficies techadas de azotea.');
  if(extra.roofSale===null)pending.push('Completa el área vendible superior de los dúplex en azotea.');
  if(hasLevels&&extra.parking===null)pending.push('Completa la cantidad o los datos de estimación de estacionamientos.');
  if(hasLevels&&extra.commercial===null)pending.push('Registra cuántos estacionamientos serán comercializables.');
  if(extra.duplexCount===null)pending.push('Completa la cantidad de dúplex para distinguirlos de los flats.');
  if(base.manualReview)pending.push('Revisa las áreas manuales de los pisos para el terreno actual.');
  const warnings=[...base.errors,...extra.errors,...extra.warnings];
  return {model,base,extra,checks,hasLevels,groups,pending:[...new Set(pending)],warnings:[...new Set(warnings)],metrics:{units:base.units,constructed:hasLevels?extra.constructed:null,sale:hasLevels?extra.sale:null,parking:hasLevels?extra.parking:null,commercial:hasLevels?extra.commercial:null,hypothesis:hasLevels?extra.hypotheticalSale:null}};
}
