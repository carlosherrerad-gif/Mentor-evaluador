import {randomUUID} from 'node:crypto';

const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateLand(value,fail){
  if(!object(value))fail(400,'Revisa la ficha del terreno.');
  const number=(v,label,integer=false)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>1e12||(integer&&!Number.isInteger(v)))fail(400,`Revisa ${label}: debe ser un número positivo.`);return v;};
  const str=(v,max=2000)=>{if(v===undefined||v===null)return '';if(typeof v!=='string'||v.length>max)fail(400,'Texto inválido o demasiado largo.');return v.trim();};
  const choice=(v,values,defaultValue)=>{v=v??defaultValue;if(!values.includes(v))fail(400,'Opción inválida en la ficha.');return v;};
  const date=v=>{v=str(v,10);if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))fail(400,'Fecha inválida.');return v;};
  const money=v=>{v=v??{};if(!object(v))fail(400,'Valor monetario inválido.');return {basis:choice(v.basis,['total','unit'],'total'),amount:number(v.amount,'el importe'),currency:choice(v.currency,['PEN','USD'],'PEN'),date:date(v.date),source:str(v.source)};};
  const clean={area:number(value.area,'el área'),front:number(value.front,'el frente'),depth:number(value.depth,'el fondo'),fronts:number(value.fronts,'el número de frentes',true),shape:choice(value.shape,['undefined','rectangular','irregular'],'undefined'),corner:choice(value.corner,['undefined','yes','no'],'undefined'),topography:choice(value.topography,['undefined','flat','slope'],'undefined'),registry:str(value.registry,120),notes:str(value.notes),offer:money(value.offer),commercial:money(value.commercial)};
  if(value.marketSnapshot!==undefined&&value.marketSnapshot!==null){
    const snapshot=value.marketSnapshot;
    if(!object(snapshot)||JSON.stringify(snapshot).length>12000)fail(400,'Referencia de mercado inválida.');
    for(const key of ['id','owner_id','author','previous_id','district','kind','currency','source','publicationDate','methodology'])if(snapshot[key]!==undefined&&snapshot[key]!==null&&typeof snapshot[key]!=='string')fail(400,'Texto inválido en la referencia de mercado.');
    for(const key of ['version','minimum','maximum','median','sample','maxArea'])if(snapshot[key]!==undefined&&snapshot[key]!==null)number(snapshot[key],key,['version','sample'].includes(key));
    clean.marketSnapshot=snapshot;
  }
  return clean;
}
export function validateAcquisition(value,fail){
  if(!object(value))fail(400,'Adquisición inválida.');
  const money=validateLand({offer:value},fail).offer;
  if(!['purchase','owned'].includes(value.mode??'purchase'))fail(400,'Modalidad de adquisición inválida.');
  if(value.notes!==undefined&&(typeof value.notes!=='string'||value.notes.length>2000))fail(400,'Revisa la justificación.');
  return {...money,mode:value.mode??'purchase',notes:value.notes??'',...(value.origin&&object(value.origin)&&JSON.stringify(value.origin).length<12000?{origin:value.origin}:{})};
}
export async function landRoutes({path,req,user,store,body,text,fail,access,send}){
  const {db,transaction,history,projectFor}=store,now=()=>new Date().toISOString();
  const revision=(expected,current)=>{if(!Number.isInteger(expected)||expected!==current)fail(409,'La información cambió. Tus cambios siguen en el formulario; revisa la versión del servidor.','REVISION_CONFLICT');};
  const route=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/land(?:\/acquisition\/([a-f0-9-]{36}))?$/);
  if(route){
    const [,id,sid]=route,p=access(id,user,req.method==='PATCH',!sid&&req.method==='PATCH');
    if(req.method!=='PATCH')fail(405,'Método no permitido.');
    const input=await body(req,32000);
    if(sid){
      const acquisition=validateAcquisition(input.acquisition,fail);
      transaction(()=>{const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=? AND deleted_at IS NULL').get(sid,id);if(!s)fail(404,'Escenario no encontrado.');if(s.status==='archived')fail(409,'Recupera el escenario antes de editarlo.');revision(input.revision,s.revision);const economics=JSON.parse(s.economics_json);economics.acquisition=acquisition;db.prepare('UPDATE scenarios SET economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(economics),now(),sid);db.prepare('UPDATE projects SET revision=revision+1,updated_at=? WHERE id=?').run(now(),id);history(id,user.id,'acquisition_updated',`Adquisición de ${s.name} actualizada de forma independiente.`);});
      send(200,{scenario:db.prepare('SELECT * FROM scenarios WHERE id=?').get(sid),project:projectFor(id,user.id)});return true;
    }
    const land=validateLand(input.land,fail);
    const location=Object.fromEntries(['region','province','district','address'].map(k=>[k,text(input[k]??p[k],k,k==='address'?240:120)]));
    transaction(()=>{const current=projectFor(id,user.id);revision(input.revision,current.revision);const previous=JSON.parse(current.land_json);const areaChanged=(previous.area??null)!==land.area;db.prepare('UPDATE projects SET land_json=?,region=?,province=?,district=?,address=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(land),location.region,location.province,location.district,location.address,now(),id);if(areaChanged)for(const s of db.prepare('SELECT * FROM scenarios WHERE project_id=?').all(id)){const e=JSON.parse(s.economics_json);e.landReview={pending:true,reason:'Área del terreno modificada',at:now(),previousArea:previous.area??null,area:land.area};db.prepare('UPDATE scenarios SET economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(e),now(),s.id);}history(id,user.id,'land_updated',areaChanged?'Área del terreno modificada. Escenarios marcados pendientes de actualización; se conservaron sus resultados.':'Ficha y referencias del terreno actualizadas. No se modificaron adquisiciones.');});
    send(200,{project:projectFor(id,user.id)});return true;
  }
  if(path==='/api/market-references'){
    if(req.method==='GET'){send(200,{references:db.prepare('SELECT r.*,u.name author FROM market_references r JOIN users u ON u.id=r.owner_id ORDER BY r.created_at DESC,r.id').all().map(r=>({...r,...JSON.parse(r.data_json),data_json:undefined}))});return true;}
    if(req.method==='POST'){
      const input=await body(req),district=text(input.district,'el distrito',120,true),kind=text(input.kind,'el tipo de terreno',200,true),source=text(input.source,'la fuente',2000,true),methodology=text(input.methodology,'la metodología',2000,true);
      const validNumber=(v,label)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>1e12)fail(400,`Revisa ${label}.`);return v;};
      const data={district,kind,source,methodology,currency:input.currency,minimum:validNumber(input.minimum,'el mínimo'),maximum:validNumber(input.maximum,'el máximo'),median:validNumber(input.median,'la mediana'),sample:validNumber(input.sample,'la muestra'),maxArea:validNumber(input.maxArea,'el área máxima de referencia'),publicationDate:input.publicationDate};
      if(!['PEN','USD'].includes(data.currency)||!data.publicationDate||!/^\d{4}-\d{2}-\d{2}$/.test(data.publicationDate)||Number.isNaN(Date.parse(data.publicationDate))||new Date(data.publicationDate).toISOString().slice(0,10)!==data.publicationDate)fail(400,'Moneda o fecha inválida.');
      if(!data.median&&!(data.minimum&&data.maximum))fail(400,'Registra una mediana o una banda completa.');
      if(Boolean(data.minimum)!==Boolean(data.maximum)||(data.minimum&&data.minimum>data.maximum)||data.sample&&!Number.isInteger(data.sample))fail(400,'Revisa la banda o la muestra.');
      const id=randomUUID();let version=1;
      transaction(()=>{if(input.previousId){const prev=db.prepare('SELECT * FROM market_references WHERE id=?').get(input.previousId);if(!prev)fail(404,'Referencia no encontrada.');if(prev.owner_id!==user.id)fail(403,'Solo el autor puede actualizar su referencia.');if(db.prepare('SELECT 1 FROM market_references WHERE previous_id=?').get(prev.id))fail(409,'Existe una versión posterior. Actualiza la lista.');version=prev.version+1;}db.prepare('INSERT INTO market_references VALUES (?,?,?,?,?,?,?)').run(id,user.id,input.previousId||null,version,JSON.stringify(data),now(),0);});send(201,{reference:{id,owner_id:user.id,version,...data}});return true;
    }
    fail(405,'Método no permitido.');
  }
  return false;
}
