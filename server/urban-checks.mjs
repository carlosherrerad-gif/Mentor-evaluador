import {urbanChecks} from '../shared/urban-checks.mjs';
export function urbanCheckRoutes({path,req,user,store,access,send,fail}){
  const match=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/urban-checks$/);if(!match)return false;
  if(req.method!=='GET')fail(405,'La comprobación consulta los datos guardados; no modifica el proyecto.');
  const p=access(match[1],user),id=new URL(req.url,'http://mentor.local').searchParams.get('scenario');
  const scenarios=store.db.prepare('SELECT * FROM scenarios WHERE project_id=? AND deleted_at IS NULL AND status=? ORDER BY created_at,id').all(p.id,'active');
  const selected=id?scenarios.filter(s=>s.id===id):scenarios;if(id&&!selected.length)fail(404,'Escenario activo no encontrado en este proyecto.');
  const today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Lima'}),computedAt=new Date().toISOString();
  send(200,{projectRevision:p.revision,computedAt,scenarios:selected.map(s=>({id:s.id,name:s.name,revision:s.revision,result:urbanChecks({urban:JSON.parse(p.urban_config_json),configuration:JSON.parse(s.configuration_json),land:JSON.parse(p.land_json),district:p.district,today})}))});return true;
}
