import {validateExecutive,executiveSummary} from '../shared/executive.mjs';
export async function executiveRoutes({path,req,user,store,body,fail,access,send}){
  const match=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/executive\/([a-f0-9-]{36})$/);if(!match)return false;
  const [,pid,sid]=match;access(pid,user,req.method==='PATCH');const {db,transaction,projectFor,history}=store;
  const scenario=()=>{const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=? AND deleted_at IS NULL').get(sid,pid);if(!s)fail(404,'Escenario no encontrado.');return s;};
  if(req.method==='GET'){const s=scenario(),p=projectFor(pid,user.id);send(200,{summary:executiveSummary({configuration:JSON.parse(s.configuration_json),land:JSON.parse(p.land_json),urban:JSON.parse(p.urban_config_json),district:p.district,economics:JSON.parse(s.economics_json)})});return true;}
  if(req.method!=='PATCH')fail(405,'Método no permitido.');const input=await body(req,64000),settings=validateExecutive(input.executive,fail);
  transaction(()=>{const s=scenario(),p=projectFor(pid,user.id);if(s.status==='archived')fail(409,'Recupera el escenario antes de editarlo.');if(input.revision!==s.revision||input.projectRevision!==p.revision)fail(409,'El escenario o el proyecto cambió. Conserva el borrador y carga la versión actual.','REVISION_CONFLICT');const e=JSON.parse(s.economics_json);e.executive=settings;if(JSON.stringify(e).length>64000)fail(413,'Los supuestos del escenario superan el tamaño admitido.');const now=new Date().toISOString();db.prepare('UPDATE scenarios SET economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(e),now,sid);db.prepare('UPDATE projects SET revision=revision+1,updated_at=? WHERE id=?').run(now,pid);history(pid,user.id,'executive_updated',`Tasa objetivo y metas gerenciales de ${s.name} actualizadas.`);});
  send(200,{scenario:scenario(),project:projectFor(pid,user.id)});return true;
}
