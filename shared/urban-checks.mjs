import {urbanFrom,urbanWarnings,validateUrban} from './urban.mjs';
import {buildingFrom,buildingSummary,validateBuilding} from './building.mjs';
import {extraSummary} from './building-extra.mjs';

const number=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
// Opera sobre la representación decimal registrada: evita 0.07 × 100 = 7.000000000000001.
function requiredSpaces(units,ratio){
  const [mantissa,exponent='0']=String(ratio).toLowerCase().split('e'),places=(mantissa.split('.')[1]||'').length,power=Number(exponent)-places;
  let numerator=BigInt(mantissa.replace('.',''))*BigInt(units),denominator=1n;
  if(power>=0)numerator*=10n**BigInt(power);else denominator=10n**BigInt(-power);
  return Number((numerator+denominator-1n)/denominator);
}
const sumCount=rows=>({excesses:rows.filter(r=>r.numericStatus==='exceeds').length,pending:rows.filter(r=>r.status==='pending').length,within:rows.filter(r=>r.status==='within').length,notApplicable:rows.filter(r=>r.status==='na').length});
export function urbanChecks({urban={},configuration={},land={},district='',today}){
  const u=urbanFrom(urban),model=buildingFrom(configuration),base=buildingSummary(model,number(land.area)),extra=extraSummary(model.extensions,number(land.area),base),hasBuilding=base.rows.length>0;
  const sourceIssues=[];
  const invalid=(_status,message)=>{throw Error(message);};
  try{validateUrban(u,invalid);}catch(error){sourceIssues.push(`Parámetros inconsistentes: ${error.message}`);}
  try{validateBuilding(model,invalid,number(land.area));}catch(error){sourceIssues.push(`Edificio inconsistente: ${error.message}`);}
  if(!String(u.source).trim())sourceIssues.push('Falta registrar la fuente de los parámetros.');
  if(!u.district||!district)sourceIssues.push('Falta el distrito del terreno o de los parámetros.');
  else if(normalize(u.district)!==normalize(district))sourceIssues.push('El distrito de los parámetros no coincide con el terreno.');
  if(!String(u.zoning).trim())sourceIssues.push('Falta registrar la zonificación.');
  if(u.expiryDate&&today&&u.expiryDate<today)sourceIssues.push('El vencimiento registrado ya pasó.');
  if(u.issueDate&&today&&u.issueDate>today)sourceIssues.push('La fecha de emisión registrada está en el futuro.');
  const make=(id,label,unit,limit,proposed,direction,rule,{na=false,pending='',extraNote='',additional=false}={})=>{
    limit=number(limit);proposed=number(proposed);
    const difference=limit!==null&&proposed!==null?proposed-limit:null;
    const numericStatus=difference===null?null:(direction==='max'?difference>1e-7:difference< -1e-7)?'exceeds':'within';
    const reasons=[...(pending?[pending]:[]),...sourceIssues];
    if(limit===null)reasons.unshift('Límite o regla pendiente de registrar.');
    if(proposed===null)reasons.unshift('Datos de la propuesta pendientes.');
    const status=na?'na':reasons.length?'pending':numericStatus;
    return {id,label,unit,limit,proposed,difference,direction,rule,additional,status,numericStatus:na?null:numericStatus,reasons:na?['Este escenario no incluye azotea.']:reasons,extraNote};
  };
  const rows=[];
  rows.push(make('floors','Pisos','pisos',u.maxFloors,hasBuilding?model.floors:null,'max','Pisos sobre el terreno ≤ máximo explícito. No incluye sótanos ni cuenta la azotea automáticamente como otro piso.'));
  const automatic=model.constructedMode==='auto'&&model.specials.every(s=>s.constructedMode==='auto');
  const free=hasBuilding&&number(land.area)>0&&automatic&&number(model.occupancy)!==null&&model.occupancy>=0&&model.occupancy<=100?100-model.occupancy:null;
  rows.push(make('freeArea','Área libre','%',u.minFreeArea,free,'min','Área libre propuesta = 100 % − ocupación propuesta.',{pending:hasBuilding&&!automatic?'Hay áreas construidas manuales: no se conoce la ocupación real del suelo.':'',extraNote:'La diferencia se expresa en puntos porcentuales. No comprueba geometría de retiros.'}));
  let required=null,parkingRule='Registra cantidad fija o estacionamientos por vivienda.';
  if(u.parkingMode==='fixed'&&number(u.parkingFixed)!==null){required=u.parkingFixed;parkingRule='Estacionamientos previstos ≥ cantidad fija registrada.';}
  else if(u.parkingMode==='perDwelling'&&number(u.parkingPerDwelling)!==null&&u.parkingPerDwelling>=0&&Number.isInteger(base.units)&&base.units>=0){required=requiredSpaces(base.units,u.parkingPerDwelling);parkingRule=`Exigidos = redondeo hacia arriba de ${base.units} viviendas únicas × ${u.parkingPerDwelling} plazas/vivienda. Los dúplex cuentan una vez.`;}
  rows.push(make('parking','Estacionamientos','plazas',required,hasBuilding?extra.parking:null,'min',parkingRule,{extraNote:'Se compara la cantidad total, no solo los comercializables. Visitas, accesibilidad y excepciones no cuantificadas requieren revisión.'}));
  const roof=model.extensions.roof,roofBase=number(u.roofBaseArea),roofPercent=number(u.roofMaxPercent);
  const roofLimit=roofBase>0&&roofPercent!==null&&String(u.roofBaseDefinition).trim()?roofBase*roofPercent/100:null;
  const roofPending=[];
  if(roof.enabled&&!String(u.roofBaseDefinition).trim())roofPending.push('Define qué superficie establece la norma como base del porcentaje.');
  if(roof.enabled&&extra.manualReview)roofPending.push('Revisa las superficies complementarias para el terreno actual.');
  if(roof.enabled&&extra.errors.some(e=>e.includes('azotea')||e.includes('dúplex')))roofPending.push('La configuración de superficies superiores contiene inconsistencias.');
  rows.push(make('roof','Techado de azotea','m²',roofLimit,hasBuilding&&roof.enabled?extra.roofBuilt:null,'max',roofLimit!==null?`Máximo = ${roofBase} m² de base normativa × ${roofPercent} % / 100. Incluye dúplex, áreas comunes y servicios techados una sola vez.`:'Registra base normativa, su definición y porcentaje máximo; no se asume 50 %. No se usa automáticamente la base física.',{na:hasBuilding&&!roof.enabled,pending:roofPending.join(' '),extraNote:'Comparar techado no autoriza el uso residencial ni convierte superficies hipotéticas en venta confirmada.'}));
  rows.push(make('height','Altura sobre el terreno','m',u.maxHeight,hasBuilding?extra.height:null,'max','Suma de alturas de pisos y altura de azotea cuando se utiliza. Excluye sótanos; los niveles sin altura dejan el total pendiente.',{additional:true}));
  rows.push(make('lot','Área del lote','m²',u.minLotArea,number(land.area)>0?land.area:null,'min','Área registrada del terreno ≥ área mínima de lote.',{additional:true}));
  rows.push(make('front','Frente principal','m',u.minFront,number(land.front)>0?land.front:null,'min','Frente principal registrado ≥ frente mínimo.',{additional:true}));
  const warnings=[...urbanWarnings(u,district,today),...base.errors,...extra.errors];
  if(model.extensions.duplex.enabled&&model.extensions.duplex.connection==='roof'&&(u.roofResidentialUse!=='allowed'||u.duplexUse!=='allowed'||roof.useStatus!=='supported'||!roof.source.trim()))warnings.push('El uso residencial del dúplex en azotea requiere verificación independiente del límite de techado. Se conserva su clasificación de hipótesis o sustento registrado.');
  return {checks:rows,primary:sumCount(rows.filter(r=>!r.additional)),additional:sumCount(rows.filter(r=>r.additional)),sourceIssues,warnings:[...new Set(warnings)],source:String(u.source||''),documentNumber:String(u.documentNumber||''),issueDate:String(u.issueDate||''),expiryDate:String(u.expiryDate||''),notChecked:['Geometría de retiros y terrenos irregulares','Densidad y coeficiente sin definición cuantificada de áreas/unidades aplicables','Usos, accesibilidad, iluminación y otras condiciones no cuantificadas'],notice:'Comprobación cuantitativa contra datos registrados. No acredita aprobación municipal ni modifica escenarios, parámetros o resultados económicos.'};
}
