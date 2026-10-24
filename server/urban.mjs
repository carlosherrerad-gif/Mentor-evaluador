import {randomUUID} from 'node:crypto';
import {validateUrban,urbanConfig} from '../shared/urban.mjs';

export async function urbanRoutes({path,req,user,store,body,text,fail,access,send}){
  const {db,transaction,history,projectFor}=store,stamp=()=>new Date().toISOString();
  const query=`SELECT t.id,t.owner_id,t.name,t.archived,t.created_at,v.version,v.config_json,v.created_at updated_at,u.name author FROM templates t JOIN template_versions v ON v.template_id=t.id JOIN users u ON u.id=t.owner_id WHERE t.category='urban' AND v.version=(SELECT max(x.version) FROM template_versions x WHERE x.template_id=t.id)`;
  const get=id=>db.prepare(query+' AND t.id=?').get(id);
  const publicRow=row=>{const {version,...rest}=row;return {...rest,revision:row.updated_at};};
  const check=(expected,current)=>{if(expected!==current)fail(409,'La información cambió. Conserva tus cambios y carga la información actual antes de guardar.','REVISION_CONFLICT');};
  const mark=(pid,config,action,detail)=>{
    const now=stamp();db.prepare('UPDATE projects SET urban_config_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(config),now,pid);
    for(const s of db.prepare('SELECT id,economics_json FROM scenarios WHERE project_id=?').all(pid)){const e=JSON.parse(s.economics_json);e.urbanReview={pending:true,reason:'Parámetros del terreno modificados',at:now};db.prepare('UPDATE scenarios SET economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(e),now,s.id);}
    history(pid,user.id,action,detail);
  };
  const projectMatch=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/urban$/);
  if(projectMatch){
    if(req.method!=='PATCH')fail(405,'Método no permitido.');const pid=projectMatch[1];access(pid,user,true,true);const input=await body(req,64000),config=validateUrban(input.configuration??{},fail);
    transaction(()=>{const current=projectFor(pid,user.id);check(input.revision,current.revision);const previous=JSON.parse(current.urban_config_json);mark(pid,urbanConfig({...config,...(previous.sourceTemplate?{sourceTemplate:previous.sourceTemplate,locallyEdited:true}:{})},fail),'urban_updated','Parámetros del terreno actualizados. Comprobación pendiente; resultados anteriores conservados.');});send(200,{project:projectFor(pid,user.id)});return true;
  }
  if(path==='/api/urban-templates'){
    if(req.method==='GET'){send(200,{templates:db.prepare(query+' ORDER BY t.name').all().map(publicRow)});return true;}
    if(req.method!=='POST')fail(405,'Método no permitido.');const input=await body(req,64000),name=text(input.name,'el nombre',120,true),config=validateUrban(input.configuration??{},fail),id=randomUUID(),now=stamp();
    transaction(()=>{db.prepare('INSERT INTO templates VALUES (?,?,?,?,0,?)').run(id,user.id,'urban',name,now);db.prepare('INSERT INTO template_versions VALUES (?,1,?,?,?)').run(id,JSON.stringify(config),'Configuración actual',now);});send(201,{template:publicRow(get(id))});return true;
  }
  const match=path.match(/^\/api\/(urban-templates|templates)\/([a-f0-9-]{36})(?:\/(apply|duplicate|restore|versions))?$/);
  if(!match)return false;
  const [,namespace,id,action]=match,t=get(id);if(!t){if(namespace==='templates')return false;fail(404,'Plantilla de parámetros no encontrada.');}
  if(action==='versions')fail(405,'Las plantillas de parámetros se editan directamente; no tienen versiones.');
  if(!action&&req.method==='GET'){send(200,{template:publicRow(t)});return true;}
  const input=await body(req,64000);
  if(action==='apply'&&req.method==='POST'){
    const pid=input.projectId;if(typeof pid!=='string'||!/^[-a-f0-9]{36}$/.test(pid))fail(400,'Selecciona un proyecto válido.');access(pid,user,true,true);
    transaction(()=>{const current=get(id);if(current.archived)fail(409,'Recupera la plantilla antes de aplicarla.');if(namespace==='urban-templates')check(input.templateRevision,current.updated_at);check(input.revision,projectFor(pid,user.id).revision);const copy={...validateUrban(JSON.parse(current.config_json),fail),sourceTemplate:{id,name:current.name,appliedAt:stamp()},verification:'pending'};mark(pid,copy,'urban_template_applied',`${current.name} aplicada como copia independiente. Revisa su aplicabilidad al predio; comprobación pendiente.`);});send(200,{project:projectFor(pid,user.id)});return true;
  }
  if(action==='duplicate'&&req.method==='POST'){
    if(t.archived)fail(409,'Recupera la plantilla antes de duplicarla.');const name=text(input.name,'el nombre de la copia',120,true),target=randomUUID(),now=stamp();
    transaction(()=>{const current=get(id);if(current.archived)fail(409,'Recupera la plantilla antes de duplicarla.');if(namespace==='urban-templates')check(input.templateRevision,current.updated_at);db.prepare('INSERT INTO templates VALUES (?,?,?,?,0,?)').run(target,user.id,'urban',name,now);db.prepare('INSERT INTO template_versions VALUES (?,1,?,?,?)').run(target,current.config_json,'Configuración actual',now);});send(201,{template:publicRow(get(target))});return true;
  }
  if(t.owner_id!==user.id)fail(403,'Solo el autor puede modificar o eliminar esta plantilla; puedes duplicarla.');
  if(!action&&req.method==='PATCH'&&input.configuration!==undefined){
    const name=text(input.name??t.name,'el nombre',120,true),config=validateUrban(input.configuration,fail);
    transaction(()=>{const current=get(id);check(input.revision,current.updated_at);if(current.archived)fail(409,'Recupera la plantilla antes de editarla.');const now=new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString();db.prepare('UPDATE template_versions SET config_json=?,note=?,created_at=? WHERE template_id=? AND version=?').run(JSON.stringify(config),'Configuración actual',now,id,current.version);db.prepare('UPDATE templates SET name=? WHERE id=?').run(name,id);});send(200,{template:publicRow(get(id))});return true;
  }
  const trash=!action&&req.method==='DELETE'||!action&&req.method==='PATCH'&&input.archived===true;
  const restore=action==='restore'&&req.method==='POST'||!action&&req.method==='PATCH'&&input.archived===false;
  if(trash||restore){transaction(()=>{const current=get(id);if(namespace==='urban-templates')check(input.revision,current.updated_at);const now=new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString();db.prepare('UPDATE templates SET archived=? WHERE id=?').run(trash?1:0,id);db.prepare('UPDATE template_versions SET created_at=? WHERE template_id=? AND version=?').run(now,id,current.version);});send(200,{template:publicRow(get(id))});return true;}
  fail(405,'Método no permitido.');
}
