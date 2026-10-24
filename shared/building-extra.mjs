export const emptyBasement=()=>({mode:'auto',occupancy:null,area:null,height:null});
export function extraFrom(value={},legacy={}){
  return {basements:Array.from({length:Number.isInteger(legacy.basements)&&legacy.basements>=0&&legacy.basements<=50?legacy.basements:0},emptyBasement),parking:{enabled:false,mode:'manual',manual:null,area:null,perSpace:null,commercial:null},roof:{enabled:false,baseArea:null,duplexBuilt:null,duplexSale:null,commonBuilt:null,servicesBuilt:null,terraces:null,height:null,useStatus:'pending',source:''},duplex:{enabled:false,connection:'floors',count:null,built:null,sale:null},elevators:legacy.elevators??null,areaReference:null,...value};
}
const sum=values=>values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null;
export function extraSummary(extra,area,base){
  const e=extraFrom(extra),errors=[],warnings=[],b=e.basements.map((row,i)=>({level:i+1,mode:row.mode,area:row.mode==='manual'?row.area:area!=null&&row.occupancy!=null?area*row.occupancy/100:null,height:row.height}));
  const basements=sum(b.map(r=>r.area)),roofDuplex=e.duplex.enabled&&e.duplex.connection==='roof';
  const roofBuilt=e.roof.enabled?sum([roofDuplex?e.roof.duplexBuilt:0,e.roof.commonBuilt,e.roof.servicesBuilt]):0;
  const roofSale=e.roof.enabled&&roofDuplex?e.roof.duplexSale:0;
  const free=e.roof.enabled&&e.roof.baseArea!=null&&roofBuilt!=null?e.roof.baseArea-roofBuilt:null;
  const supported=e.roof.useStatus==='supported'&&Boolean(e.roof.source.trim());
  const supportedSale=supported?roofSale:0,hypotheticalSale=supported?0:roofSale;
  const parking=e.parking.enabled?(e.parking.mode==='manual'?e.parking.manual:e.parking.area!=null&&e.parking.perSpace>0?Math.floor(e.parking.area/e.parking.perSpace):null):0;
  const commercial=e.parking.enabled?e.parking.commercial:0;
  if(parking!=null&&commercial!=null&&commercial>parking)errors.push('Los estacionamientos comercializables superan el total.');
  if(e.parking.enabled&&parking===null)warnings.push('Estacionamientos pendientes de cantidad o datos de estimación.');
  if(e.parking.enabled&&commercial===null)warnings.push('Estacionamientos comercializables pendientes.');
  if(e.roof.enabled){
    if(roofBuilt!=null&&e.roof.baseArea!=null&&roofBuilt>e.roof.baseArea+1e-8)errors.push('El techado de azotea supera su superficie base física.');
    if(free!=null&&e.roof.terraces!=null&&e.roof.terraces>free+1e-8)errors.push('Las terrazas superan la superficie sin techar de la azotea.');
    if(roofSale!=null&&e.roof.duplexBuilt!=null&&roofSale>e.roof.duplexBuilt+1e-8)errors.push('El área vendible superior del dúplex supera su área construida.');
    if(roofDuplex&&!supported)warnings.push('Uso residencial de azotea pendiente de sustento: su área vendible se mantiene como hipótesis separada.');
    if(roofBuilt===null||e.roof.baseArea===null||e.roof.terraces===null)warnings.push('Azotea incompleta: registra superficies o cero cuando no correspondan.');
  }
  let origin=null,target=null,duplexCount=e.duplex.enabled?e.duplex.count:0;
  if(e.duplex.enabled){
    const sourceFloor=e.duplex.connection==='floors'?base.rows.length-1:base.rows.length;
    origin=base.rows.find(r=>r.floor===sourceFloor)??null;
    target=e.duplex.connection==='floors'?base.rows.find(r=>r.floor===sourceFloor+1)??null:null;
    if(!origin||(e.duplex.connection==='floors'&&!target))errors.push('La conexión dúplex requiere niveles de origen y destino válidos.');
    if(duplexCount!=null&&origin?.units!=null&&duplexCount>origin.units)errors.push('La cantidad de dúplex supera las viviendas del piso de origen.');
    if(e.duplex.connection==='roof'&&!e.roof.enabled)errors.push('Activa la azotea para utilizarla como segundo nivel dúplex.');
    if(e.duplex.connection==='floors'){
      if(e.duplex.built!=null&&target?.constructed!=null&&e.duplex.built>target.constructed+1e-8)errors.push('El área superior dúplex supera la construida del piso de destino.');
      if(e.duplex.sale!=null&&target?.sale!=null&&e.duplex.sale>target.sale+1e-8)errors.push('El área vendible superior dúplex supera la vendible del piso de destino.');
      if(e.duplex.sale!=null&&e.duplex.built!=null&&e.duplex.sale>e.duplex.built+1e-8)errors.push('El área vendible superior dúplex supera su área construida.');
      if(e.duplex.built===null||e.duplex.sale===null)warnings.push('Superficies superiores de dúplex entre pisos pendientes.');
    }
    if(duplexCount===null||origin?.units==null)warnings.push('Cantidad de dúplex o viviendas del piso de origen pendiente.');
  }
  const manual=b.some(r=>r.mode==='manual')||e.roof.enabled||e.duplex.enabled&&e.duplex.connection==='floors';
  const manualReview=manual&&(area==null||e.areaReference!==area);
  if(manualReview)warnings.push('Revisa las superficies manuales para el área actual del terreno.');
  if(b.some(r=>r.area===null))warnings.push('Hay áreas de sótano pendientes.');
  if(e.parking.enabled&&e.parking.mode==='estimate')warnings.push('La cantidad de estacionamientos es una estimación; no valida distribución ni exigencia normativa.');
  const constructed=sum([base.constructed,basements,roofBuilt]),sale=sum([base.sale,supportedSale]);
  const units=base.units,flats=units!=null&&duplexCount!=null?units-duplexCount:null;
  const height=sum([base.height,e.roof.enabled?e.roof.height:0]);
  return {basementRows:b,basements,roofBuilt,roofSale,supportedSale,hypotheticalSale,roofFree:free,parking,commercial,duplexCount,flats,units,constructed,sale,height,originFloor:origin?.floor??null,targetFloor:target?.floor??null,manualReview,errors,warnings,complete:base.complete&&constructed!=null&&sale!=null&&duplexCount!=null&&(!e.parking.enabled||parking!=null&&commercial!=null)&&!errors.length&&!warnings.some(w=>!w.startsWith('La cantidad de estacionamientos es una estimación'))};
}
export function validateExtra(input,fail){
  const reject=message=>fail(400,message),obj=(v,label)=>{if(!v||typeof v!=='object'||Array.isArray(v))reject(`Revisa ${label}.`);return v;};
  const number=(v,label,max=1e9,integer=false,positive=false)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||integer&&!Number.isInteger(v)||positive&&v===0)reject(`Revisa ${label}.`);return v;};
  const choice=(v,list,fallback)=>{if(v===undefined)return fallback;if(!list.includes(v))reject('Opción inválida en configuración adicional.');return v;};
  const enabled=v=>{if(v===undefined)return false;if(typeof v!=='boolean')reject('Activación inválida.');return v;};
  input=input===undefined?{}:obj(input,'configuración adicional');const e=extraFrom(),p=obj(input.parking??{},'estacionamientos'),r=obj(input.roof??{},'azotea'),d=obj(input.duplex??{},'dúplex');
  if(input.basements!==undefined&&!Array.isArray(input.basements))reject('Sótanos inválidos.');
  if((input.basements||[]).length>50)reject('Máximo 50 sótanos.');
  e.basements=(input.basements||[]).map(v=>{obj(v,'sótano');return {mode:choice(v.mode,['auto','manual'],'auto'),occupancy:number(v.occupancy,'ocupación del sótano',100),area:number(v.area,'área del sótano'),height:number(v.height,'altura de sótano',100,false,true)};});
  e.parking={enabled:enabled(p.enabled),mode:choice(p.mode,['manual','estimate'],'manual'),manual:number(p.manual,'cantidad de estacionamientos',1e6,true),area:number(p.area,'área destinada a estacionamiento'),perSpace:number(p.perSpace,'m² por plaza',1e6,false,true),commercial:number(p.commercial,'estacionamientos comercializables',1e6,true)};
  e.roof={enabled:enabled(r.enabled),baseArea:number(r.baseArea,'superficie base de azotea',1e9,false,true),duplexBuilt:number(r.duplexBuilt,'área construida superior'),duplexSale:number(r.duplexSale,'área vendible superior'),commonBuilt:number(r.commonBuilt,'áreas comunes techadas'),servicesBuilt:number(r.servicesBuilt,'servicios techados'),terraces:number(r.terraces,'terrazas'),height:number(r.height,'altura de azotea',100,false,true),useStatus:choice(r.useStatus,['pending','supported'],'pending'),source:r.source??''};
  if(typeof e.roof.source!=='string'||e.roof.source.length>2000)reject('Fuente de uso residencial inválida.');
  if(e.roof.useStatus==='supported'&&!e.roof.source.trim())reject('Registra la fuente del sustento de uso residencial o déjalo pendiente.');
  e.duplex={enabled:enabled(d.enabled),connection:choice(d.connection,['floors','roof'],'floors'),count:number(d.count,'cantidad de dúplex',10000,true,true),built:number(d.built,'área superior dúplex'),sale:number(d.sale,'área vendible superior dúplex')};
  e.elevators=number(input.elevators,'ascensores',10000,true);e.areaReference=number(input.areaReference,'referencia de área');
  return e;
}
