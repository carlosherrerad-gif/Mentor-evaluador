// Campos de registro: ningún valor constituye una norma precargada.
export const urbanGroups=[
  {id:'identity',title:'Identificación y aplicabilidad',fields:[['district','Distrito / ámbito','text'],['zoning','Zonificación','text'],['allowedUse','Uso permitido','text'],['municipality','Municipalidad competente','text'],['regime','Régimen aplicable','text'],['sector','Sector / zona','text'],['road','Vía o ámbito específico','text'],['scope','Tipo de referencia','scope'],['applicability','Condiciones de aplicación','long']]},
  {id:'limits',title:'Límites de edificación',fields:[['maxHeight','Altura máxima (m)','positive'],['maxFloors','Pisos máximos explícitos','integer'],['minFreeArea','Área libre mínima (%)','percent'],['minLotArea','Área mínima de lote (m²)','positive'],['minFront','Frente mínimo (m)','positive'],['coefficient','Coeficiente de edificación','number'],['coefficientBasis','Qué áreas computan en el coeficiente','long'],['density','Densidad máxima','number'],['densityUnit','Unidad y criterio de densidad','text']]},
  {id:'setbacks',title:'Retiros y restricciones',fields:[['frontSetback','Retiro frontal (m)','number'],['sideSetback','Retiro lateral (m)','number'],['rearSetback','Retiro posterior (m)','number'],['alignment','Alineamiento de fachada','text'],['restrictions','Afectaciones, servidumbres y restricciones','long']]},
  {id:'parking',title:'Estacionamientos',fields:[['parkingMode','Regla registrada','parkingMode'],['parkingFixed','Cantidad fija exigida','count'],['parkingPerDwelling','Estacionamientos por vivienda','number'],['parkingRule','Condiciones, visitas y excepciones','long']]},
  {id:'roof',title:'Azotea y dúplex',fields:[['roofMaxPercent','Techado máximo de azotea (%)','percent'],['roofBaseArea','Superficie base normativa (m²)','positive'],['roofBaseDefinition','Definición de la superficie base normativa','long'],['roofResidentialUse','Uso residencial de azotea','use'],['duplexUse','Condición de uso dúplex','use'],['roofConditions','Retranqueos, usos y condiciones superiores','long']]},
  {id:'source',title:'Fuente y fechas',fields:[['documentType','Tipo de documento','text'],['documentNumber','Número de documento','text'],['source','Fuente / referencia del documento','long'],['issueDate','Fecha de emisión','date'],['expiryDate','Vencimiento registrado','date'],['verifiedDate','Fecha de revisión por el analista','date'],['notes','Observaciones adicionales','long']]},
];
export const urbanFields=urbanGroups.flatMap(g=>g.fields);
export function urbanFrom(input={}){return Object.fromEntries(urbanFields.map(([key,,kind])=>[key,input[key]??(['number','positive','integer','count','percent'].includes(kind)?null:kind==='scope'?'unspecified':['parkingMode','use'].includes(kind)?'pending':'')]));}
export function validateUrban(input,fail){
  const reject=message=>fail(400,message);
  if(!input||typeof input!=='object'||Array.isArray(input))reject('Parámetros inválidos.');
  const result=urbanFrom(input);
  for(const [key,label,kind] of urbanFields){let value=result[key];
    if(['number','positive','integer','count','percent'].includes(kind)){
      if(value===''||value===null){result[key]=null;continue;}
      if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9||kind==='percent'&&value>100||['integer','positive'].includes(kind)&&value===0||['integer','count'].includes(kind)&&!Number.isInteger(value))reject(`Revisa ${label}.`);
    }else{
      if(typeof value!=='string'||value.length>(kind==='long'?2000:500))reject(`Revisa ${label}.`);value=value.trim();result[key]=value;
      if(kind==='date'&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))reject(`Revisa ${label}.`);
      const choices=kind==='scope'?['unspecified','general','plot']:kind==='parkingMode'?['pending','fixed','perDwelling']:kind==='use'?['pending','allowed','notAllowed']:null;
      if(choices&&!choices.includes(value))reject(`Revisa ${label}.`);
    }
  }
  if(result.issueDate&&result.expiryDate&&result.expiryDate<result.issueDate)reject('El vencimiento no puede ser anterior a la emisión.');
  return result;
}
export function urbanWarnings(config,district,today){
  const u=urbanFrom(config),normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(),warnings=[];
  if(!u.district||!district)warnings.push('Distrito pendiente: revisa el ámbito de aplicación.');
  else if(normalize(u.district)!==normalize(district))warnings.push('El distrito de la referencia difiere del distrito del proyecto.');
  if(u.scope==='plot')warnings.push('Referencia de un predio específico: requiere revisar su aplicabilidad a este terreno.');
  if(u.scope==='unspecified')warnings.push('No se ha definido si la referencia es general o de un predio específico.');
  if(!u.source)warnings.push('Fuente pendiente de registrar.');
  if(u.expiryDate&&u.expiryDate<today)warnings.push('La fecha de vencimiento registrada ya pasó; revisa el sustento.');
  if(u.applicability)warnings.push(`Condiciones de aplicación: ${u.applicability}`);
  return warnings;
}
export function urbanConfig(input,fail){
  const config={...validateUrban(input,fail),verification:'pending'};
  if(input.sourceTemplate){
    const source=input.sourceTemplate;
    if(typeof source!=='object'||Array.isArray(source))fail(400,'Origen de parámetros inválido.');
    const clean={};for(const key of ['id','name','appliedAt']){if(source[key]!==undefined&&(typeof source[key]!=='string'||source[key].length>500))fail(400,'Origen de parámetros inválido.');if(source[key]!==undefined)clean[key]=source[key];}
    config.sourceTemplate=clean;
  }
  if(input.locallyEdited===true)config.locallyEdited=true;
  return config;
}
