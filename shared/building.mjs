// Motor único de áreas sobre el terreno. Sin valores normativos predeterminados.
export function buildingFrom(config={}) {
  return {floors:config.floors??null,unitsPerFloor:config.unitsPerFloor??null,floorHeight:config.floorHeight??null,occupancy:null,efficiency:config.efficiency??null,constructedMode:'auto',saleMode:'auto',constructed:null,sale:null,specials:[],notes:'',manualAreaReference:null,...config.buildingBase};
}
function areaFor(row,model,area){
  const constructed=row.constructedMode==='manual'?row.constructed:(area!=null&&model.occupancy!=null?area*model.occupancy/100:null);
  const sale=row.unitsPerFloor===0?0:row.saleMode==='manual'?row.sale:(constructed!=null&&row.efficiency!=null?constructed*row.efficiency/100:null);
  return {constructed,sale,average:row.unitsPerFloor>0&&sale!=null?sale/row.unitsPerFloor:null,units:row.unitsPerFloor,height:row.floorHeight??model.floorHeight};
}
export function buildingSummary(model,area){
  const rows=[];
  if(Number.isInteger(model.floors)&&model.floors>0&&model.floors<=200)for(let floor=1;floor<=model.floors;floor++){
    const special=model.specials.find(s=>s.floor===floor),row=special??model;
    rows.push({floor,special:Boolean(special),constructedMode:row.constructedMode,saleMode:row.saleMode,...areaFor(row,model,area)});
  }
  const sum=key=>rows.length&&rows.every(r=>r[key]!=null)?rows.reduce((s,r)=>s+r[key],0):null;
  const constructed=sum('constructed'),sale=sum('sale'),units=sum('units'),height=sum('height');
  const errors=[];
  for(const r of rows)if(r.sale!=null&&r.constructed!=null&&r.sale>r.constructed+1e-8)errors.push(`Piso ${r.floor}: el área vendible supera la construida.`);
  const hasManual=[model,...model.specials].some(r=>r.constructedMode==='manual'||r.saleMode==='manual');
  const manualReview=hasManual&&(area==null||model.manualAreaReference!==area);
  return {rows,constructed,sale,units,height,average:units>0&&sale!=null?sale/units:null,typicalFloors:rows.filter(r=>!r.special).length,specialFloors:rows.filter(r=>r.special).length,errors,manualReview,complete:rows.length>0&&[constructed,sale,units].every(v=>v!=null)&&!errors.length&&!manualReview};
}
export function validateBuilding(input,fail,area=null){
  const reject=message=>fail(400,message);
  if(!input||typeof input!=='object'||Array.isArray(input))return reject('Configuración de edificio inválida.');
  const number=(v,label,max=1e9,integer=false,positive=false)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||(integer&&!Number.isInteger(v))||(positive&&v===0))reject(`Revisa ${label}.`);return v;};
  const row=v=>{
    if(!v||typeof v!=='object'||Array.isArray(v))return reject('Planta inválida.');
    for(const key of ['constructedMode','saleMode'])if(v[key]!==undefined&&!['auto','manual'].includes(v[key]))reject('Modo de área inválido.');
    return {unitsPerFloor:number(v.unitsPerFloor,'departamentos',10000,true),floorHeight:number(v.floorHeight,'altura',100,false,true),efficiency:number(v.efficiency,'eficiencia',100),constructedMode:v.constructedMode??'auto',saleMode:v.saleMode??'auto',constructed:number(v.constructed,'área construida'),sale:number(v.sale,'área vendible')};
  };
  const model={...row(input),floors:number(input.floors,'pisos (1 a 200)',200,true,true),occupancy:number(input.occupancy,'ocupación',100),specials:[],notes:input.notes??'',manualAreaReference:number(input.manualAreaReference,'área de referencia')};
  if(typeof model.notes!=='string'||model.notes.length>2000)reject('Observaciones demasiado largas.');
  if(input.specials!==undefined&&!Array.isArray(input.specials))reject('Pisos especiales inválidos.');
  if((input.specials||[]).length>200)reject('Demasiados pisos especiales.');
  const seen=new Set();
  for(const s of input.specials||[]){const floor=number(s?.floor,'piso especial',200,true,true);if(floor===null||model.floors===null||floor>model.floors||seen.has(floor))reject('Los pisos especiales deben ser únicos y estar dentro del edificio.');seen.add(floor);model.specials.push({...row(s),floor});}
  model.specials.sort((a,b)=>a.floor-b.floor);
  const result=buildingSummary(model,area);if(result.errors.length)reject(result.errors[0]);
  return model;
}
