import {validateEvaluation,economicSummary} from '../shared/economics.mjs';
export async function economicRoutes({path,req,user,store,body,fail,access,send}){
  const match=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/evaluation\/([a-f0-9-]{36})$/);if(!match)return false;
  const [,pid,sid]=match;access(pid,user,req.method==='PATCH');const {db,transaction,projectFor,history}=store;
  const scenario=()=>{const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=? AND deleted_at IS NULL').get(sid,pid);if(!s)fail(404,'Escenario no encontrado.');return s;};
  if(req.method==='GET'){const p=projectFor(pid,user.id),s=scenario();send(200,{summary:economicSummary({configuration:JSON.parse(s.configuration_json),land:JSON.parse(p.land_json),urban:JSON.parse(p.urban_config_json),district:p.district,economics:JSON.parse(s.economics_json),today:new Date().toISOString().slice(0,10)})});return true;}
  if(req.method!=='PATCH')fail(405,'Método no permitido.');const input=await body(req,200000),evaluation=validateEvaluation(input.evaluation,fail);
  transaction(()=>{const s=scenario(),p=projectFor(pid,user.id);if(s.status==='archived')fail(409,'Recupera el escenario antes de editarlo.');if(s.revision!==input.revision||p.revision!==input.projectRevision)fail(409,'El escenario o el terreno cambió. Conserva el borrador y carga la versión actual.','REVISION_CONFLICT');const e=JSON.parse(s.economics_json);e.evaluation=evaluation;const now=new Date().toISOString();db.prepare('UPDATE scenarios SET economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(e),now,sid);db.prepare('UPDATE projects SET revision=revision+1,updated_at=? WHERE id=?').run(now,pid);history(pid,user.id,'evaluation_updated',`Supuestos económicos de ${s.name} actualizados. Resultado preliminar, sin liquidación tributaria ni flujo mensual.`);});
  send(200,{scenario:scenario(),project:projectFor(pid,user.id)});return true;
}
