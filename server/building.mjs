import {validateBuilding} from '../shared/building.mjs';
export async function buildingRoutes({path,req,user,store,body,fail,access,send}){
  const match=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/building\/([a-f0-9-]{36})$/);
  if(!match)return false;
  if(req.method!=='PATCH')fail(405,'Método no permitido.');
  const [,pid,sid]=match;access(pid,user,true);const input=await body(req,64000);
  const {db,transaction,projectFor,history}=store,now=new Date().toISOString();
  transaction(()=>{
    const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=? AND deleted_at IS NULL').get(sid,pid);
    if(!s)fail(404,'Escenario no encontrado.');if(s.status==='archived')fail(409,'Recupera el escenario antes de editarlo.');
    const p=projectFor(pid,user.id);if(s.revision!==input.revision||p.revision!==input.projectRevision)fail(409,'El escenario o el terreno cambió. Conserva tu borrador y carga la versión actual antes de guardar.','REVISION_CONFLICT');
    const area=JSON.parse(p.land_json).area??null,model=validateBuilding(input.building,fail,area),config=JSON.parse(s.configuration_json);
    config.buildingBase=model;config.floors=model.floors;config.unitsPerFloor=model.unitsPerFloor;config.floorHeight=model.floorHeight;config.efficiency=model.efficiency;config.buildingType='Multifamiliar';config.basements=model.extensions.basements.length;config.elevators=model.extensions.elevators;
    const economics=JSON.parse(s.economics_json);economics.buildingReview={pending:true,reason:'Configuración del edificio modificada',at:now};
    db.prepare('UPDATE scenarios SET configuration_json=?,economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(config),JSON.stringify(economics),now,sid);
    db.prepare('UPDATE projects SET revision=revision+1,updated_at=? WHERE id=?').run(now,pid);
    history(pid,user.id,'building_updated',`Edificio base de ${s.name} actualizado. Los pisos especiales reemplazan plantas típicas; resultados económicos conservados.`);
  });send(200,{scenario:db.prepare('SELECT * FROM scenarios WHERE id=?').get(sid),project:projectFor(pid,user.id)});return true;
}
