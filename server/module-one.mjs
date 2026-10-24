import {validateBuilding} from '../shared/building.mjs';
import {validateLand,validateAcquisition} from './land.mjs';
import {randomUUID} from 'node:crypto';

const idPattern='[a-f0-9-]{36}';
const stamp=()=>new Date().toISOString();
const decode=value=>JSON.parse(value || '{}');
export async function moduleOne(ctx) {
  const {path,req,user,store,body,text,fail,access,send}=ctx;
  const {db,transaction,history,projectFor}=store;
  const touch=id=>db.prepare('UPDATE projects SET revision=revision+1,updated_at=? WHERE id=?').run(stamp(),id);
  const revision=(value,current)=>{if(!Number.isInteger(value)||value!==current)fail(409,'La información cambió. Actualiza antes de guardar; tus cambios no se han sobrescrito.','REVISION_CONFLICT');};
  const json=(value,label)=>{
    if(!value||typeof value!=='object'||Array.isArray(value))fail(400,`Revisa ${label}.`);
    const serialized=JSON.stringify(value);if(serialized.length>64000)fail(413,`${label} es demasiado grande.`);return serialized;
  };
  const metadata=input=>Object.fromEntries(['name','code','district','address','region','province','responsible','description'].map(key=>[key,text(input[key]??'',key,key==='description'?2000:key==='address'?240:key==='name'?120:120,key==='name')]));
  function copyScenario(source,projectId,name) {
    const id=randomUUID(),now=stamp();
    db.prepare(`INSERT INTO scenarios(id,project_id,name,created_at,updated_at,status,configuration_json,economics_json,source_template_json) VALUES (?,?,?,?,?,?,?,?,?)`).run(id,projectId,name,now,now,source.status || 'active',source.configuration_json||'{}',source.economics_json||'{}',source.source_template_json||null);
    return db.prepare('SELECT * FROM scenarios WHERE id=?').get(id);
  }
  function insertProject(input,urban='{}',land='{}') {
    const m=metadata(input),id=randomUUID(),now=stamp();
    db.prepare(`INSERT INTO projects(id,name,code,district,address,region,province,responsible,description,urban_config_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,m.name,m.code,m.district,m.address,m.region,m.province,m.responsible,m.description,urban,input.status==='active'?'active':'draft',now,now);
    db.prepare('UPDATE projects SET land_json=? WHERE id=?').run(land,id);
    db.prepare('INSERT INTO project_members VALUES (?,?,?)').run(id,user.id,'admin');return id;
  }
  const projectAction=path.match(new RegExp(`^/api/projects/(${idPattern})/(duplicate|trash|recover|export)$`));
  if(projectAction) {
    const [,id,action]=projectAction;
    const p=access(id,user,action!=='export',true,true);
    if(action==='export'&&req.method==='GET') {
      const fields=metadata(p);
      const scenarios=db.prepare('SELECT * FROM scenarios WHERE project_id=? AND deleted_at IS NULL ORDER BY created_at,id').all(id);
      send(200,{backup:{format:'mentor-project',version:1,exportedAt:stamp(),project:{...fields,status:p.status,urban:decode(p.urban_config_json),land:decode(p.land_json)},scenarios:scenarios.map(s=>({name:s.name,status:s.status,configuration:decode(s.configuration_json),economics:decode(s.economics_json),source:s.source_template_json?decode(s.source_template_json):null}))},scope:'Datos del proyecto y configuraciones aplicadas. No incluye cuentas, biblioteca global ni archivos documentales.'});return true;
    }
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const input=await body(req);revision(input.revision,p.revision);
    if(action==='duplicate') {
      if(p.deleted_at)fail(409,'Recupera el proyecto antes de duplicarlo.');
      const name=text(input.name,'el nombre de la copia',120,true);
      const copied=transaction(()=>{
        revision(input.revision,projectFor(id,user.id).revision);
        const target=insertProject({...p,name,code:'',status:'draft'},p.urban_config_json,p.land_json);
        if(input.includeScenarios!==false)for(const s of db.prepare('SELECT * FROM scenarios WHERE project_id=? AND deleted_at IS NULL').all(id))copyScenario(s,target,s.name);
        if(!db.prepare('SELECT 1 FROM scenarios WHERE project_id=?').get(target))copyScenario({},target,'Escenario A');
        history(target,user.id,'project_duplicated',`Copia independiente de ${p.name}. Los accesos no se copiaron.`);return target;
      });send(201,{project:projectFor(copied,user.id)});return true;
    }
    if(!['trash','recover'].includes(action))fail(405,'Método no permitido.');
    transaction(()=>{
      revision(input.revision,projectFor(id,user.id).revision);
      db.prepare('UPDATE projects SET deleted_at=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').run(action==='trash'?stamp():null,stamp(),id,p.revision);
      if(action==='trash')db.prepare('DELETE FROM invitations WHERE project_id=?').run(id);
      history(id,user.id,action==='trash'?'project_trashed':'project_recovered',action==='trash'?'Proyecto movido a papelera. Se conservaron escenarios e historial.':'Proyecto recuperado de la papelera.');
    });send(200,{project:projectFor(id,user.id)});return true;
  }
  if(path==='/api/projects/import'&&req.method==='POST') {
    const input=await body(req,2_000_000),b=input.backup;
    if(!b||b.format!=='mentor-project'||b.version!==1||!b.project||!Array.isArray(b.scenarios))fail(400,'El archivo no es un respaldo de datos de Méntor V1.');
    const fields=metadata({...b.project,name:input.name||b.project.name});
    const land=JSON.stringify(validateLand(b.project.land||{},fail));
    const urban=json(b.project.urban || {},'la referencia urbanística');
    const scenarios=b.scenarios.map(s=>({name:text(s.name,'el escenario',100,true),status:s.status==='archived'?'archived':'active',configuration_json:json(s.configuration||{},'la configuración'),economics_json:json(s.economics||{},'los supuestos'),source_template_json:s.source?json(s.source,'la procedencia'):null}));
    const id=transaction(()=>{
      const target=insertProject({...fields,status:'draft'},urban,land);
      for(const s of scenarios){const e=decode(s.economics_json);const config=decode(s.configuration_json);if(config.buildingBase){config.buildingBase=validateBuilding(config.buildingBase,fail,JSON.parse(land).area??null);s.configuration_json=JSON.stringify(config);}if(e.acquisition)e.acquisition=validateAcquisition(e.acquisition,fail);copyScenario({...s,economics_json:JSON.stringify(e)},target,s.name);}
      if(!scenarios.length)copyScenario({},target,'Escenario A');
      history(target,user.id,'project_imported','Datos recuperados desde un respaldo como proyecto nuevo. No se sobrescribió ningún proyecto existente.');return target;
    });send(201,{project:projectFor(id,user.id)});return true;
  }
  const scenarioMatch=path.match(new RegExp(`^/api/projects/(${idPattern})/scenarios/(${idPattern})(?:/(duplicate|trash|recover))?$`));
  if(scenarioMatch) {
    const [,projectId,scenarioId,action]=scenarioMatch;
    access(projectId,user,true);
    const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=?').get(scenarioId,projectId);
    if(!s)fail(404,'Escenario no encontrado.');
    const input=await body(req);revision(input.revision,s.revision);
    if(action==='duplicate'&&req.method==='POST') {
      if(s.deleted_at)fail(409,'Recupera el escenario antes de duplicarlo.');
      const name=text(input.name,'el nombre del escenario',100,true);
      const result=transaction(()=>{revision(input.revision,db.prepare('SELECT revision FROM scenarios WHERE id=?').get(s.id).revision);const created=copyScenario({...s,status:'active'},projectId,name);touch(projectId);history(projectId,user.id,'scenario_duplicated',`Escenario ${s.name} duplicado como ${name}, con configuración independiente.`);return created;});
      send(201,{scenario:result});return true;
    }
    if(['trash','recover'].includes(action)&&req.method==='POST') {
      transaction(()=>{
        revision(input.revision,db.prepare('SELECT revision FROM scenarios WHERE id=?').get(s.id).revision);
        if(action==='trash'&&!s.deleted_at&&Number(db.prepare('SELECT count(*) n FROM scenarios WHERE project_id=? AND deleted_at IS NULL').get(projectId).n)<=1)fail(409,'Conserva al menos un escenario en el proyecto.');
        db.prepare('UPDATE scenarios SET deleted_at=?,revision=revision+1,updated_at=? WHERE id=?').run(action==='trash'?stamp():null,stamp(),s.id);
        touch(projectId);history(projectId,user.id,'scenario_'+action,`${s.name}: ${action==='trash'?'movido a papelera':'recuperado'}.`);
      });send(200,{scenario:db.prepare('SELECT * FROM scenarios WHERE id=?').get(s.id)});return true;
    }
    if(!action&&req.method==='PATCH') {
      if(s.deleted_at)fail(409,'Recupera el escenario para editarlo.');
      const name=text(input.name??s.name,'el nombre del escenario',100,true),status=input.status??s.status;
      if(!['active','archived'].includes(status))fail(400,'Estado de escenario inválido.');
      if(input.configuration?.buildingBase)input.configuration.buildingBase=validateBuilding(input.configuration.buildingBase,fail,JSON.parse(projectFor(projectId,user.id).land_json).area??null);
      const config=input.configuration===undefined?s.configuration_json:json(input.configuration,'la configuración');
      if(input.economics?.acquisition)input.economics.acquisition=validateAcquisition(input.economics.acquisition,fail);
      const economics=input.economics===undefined?s.economics_json:json(input.economics,'los supuestos');
      transaction(()=>{
        revision(input.revision,db.prepare('SELECT revision FROM scenarios WHERE id=?').get(s.id).revision);
        db.prepare('UPDATE scenarios SET name=?,status=?,configuration_json=?,economics_json=?,revision=revision+1,updated_at=? WHERE id=?').run(name,status,config,economics,stamp(),s.id);
        touch(projectId);history(projectId,user.id,'scenario_updated',`Escenario ${name} actualizado${status==='archived'?' · archivado':''}.`);
      });send(200,{scenario:db.prepare('SELECT * FROM scenarios WHERE id=?').get(s.id)});return true;
    }
    fail(405,'Método no permitido.');
  }
  function configData(category,input) {
    const numeric=category==='building'?['floors','basements','unitsPerFloor','floorHeight','elevators','efficiency']:['maxFloors','minFreeArea','frontSetback','sideSetback','density','coefficient'];
    const strings=category==='building'?['buildingType','parkingSystem','notes']:['district','zoning','parkingRule','source','verifiedDate','notes'];
    const value={};
    for(const key of numeric) {
      const raw=input[key];if(raw===null||raw===''||raw===undefined){value[key]=null;continue;}
      if(typeof raw!=='number'||!Number.isFinite(raw)||raw<0||raw>1_000_000)fail(400,`Valor inválido en ${key}.`);
      if(['floors','basements','unitsPerFloor','elevators','maxFloors'].includes(key)&&!Number.isInteger(raw))fail(400,`${key} debe ser entero.`);
      if(['efficiency','minFreeArea'].includes(key)&&raw>100)fail(400,`${key} no puede superar 100%.`);
      if(['floors','floorHeight','maxFloors'].includes(key)&&raw===0)fail(400,`${key} debe ser mayor que cero o quedar pendiente.`);
      value[key]=raw;
    }
    for(const key of strings)value[key]=text(input[key]??'',key,key==='notes'?2000:500);
    if(category==='building'&&input.buildingBase){value.buildingBase=validateBuilding(input.buildingBase,fail);for(const key of ['floors','unitsPerFloor','floorHeight','efficiency'])value[key]=value.buildingBase[key];}
    return value;
  }
  const templateQuery=`SELECT t.*,v.version,v.config_json,v.note,v.created_at version_date,u.name author FROM templates t JOIN template_versions v ON v.template_id=t.id JOIN users u ON u.id=t.owner_id WHERE v.version=(SELECT max(x.version) FROM template_versions x WHERE x.template_id=t.id)`;
  if(path==='/api/templates'&&req.method==='GET'){send(200,{templates:db.prepare(templateQuery+' ORDER BY t.name').all()});return true;}
  if(path==='/api/templates'&&req.method==='POST') {
    const input=await body(req);if(!['building','urban'].includes(input.category))fail(400,'Categoría no válida.');
    const name=text(input.name,'el nombre de la plantilla',120,true),config=configData(input.category,input.configuration||{}),id=randomUUID(),now=stamp();
    transaction(()=>{db.prepare('INSERT INTO templates VALUES (?,?,?,?,0,?)').run(id,user.id,input.category,name,now);db.prepare('INSERT INTO template_versions VALUES (?,1,?,?,?)').run(id,JSON.stringify(config),'Versión inicial',now);});
    send(201,{template:db.prepare(templateQuery+' AND t.id=?').get(id)});return true;
  }
  const templateMatch=path.match(new RegExp(`^/api/templates/(${idPattern})(?:/(versions|duplicate|apply))?$`));
  if(templateMatch) {
    const [,id,action]=templateMatch,t=db.prepare(templateQuery+' AND t.id=?').get(id);
    if(!t)fail(404,'Plantilla no encontrada.');
    if(action==='versions'&&req.method==='GET'){send(200,{versions:db.prepare('SELECT * FROM template_versions WHERE template_id=? ORDER BY version DESC').all(id)});return true;}
    const input=await body(req);
    if(action==='apply'&&req.method==='POST') {
      if(t.archived)fail(409,'Esta plantilla está archivada.');
      const p=access(input.projectId,user,true);
      const version=input.version??t.version,v=db.prepare('SELECT * FROM template_versions WHERE template_id=? AND version=?').get(id,version);
      if(!v)fail(404,'Versión no encontrada.');
      const source={id:t.id,name:t.name,version,appliedAt:stamp()};
      if(t.category==='building') {
        const s=db.prepare('SELECT * FROM scenarios WHERE id=? AND project_id=? AND deleted_at IS NULL').get(input.scenarioId,p.id);
        if(!s)fail(404,'Escenario no encontrado.');revision(input.revision,s.revision);
        transaction(()=>{revision(input.revision,db.prepare('SELECT revision FROM scenarios WHERE id=?').get(s.id).revision);const copy=decode(v.config_json);if(copy.buildingBase)copy.buildingBase=validateBuilding(copy.buildingBase,fail,decode(projectFor(p.id,user.id).land_json).area??null);db.prepare('UPDATE scenarios SET configuration_json=?,source_template_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(copy),JSON.stringify(source),stamp(),s.id);touch(p.id);history(p.id,user.id,'building_template_applied',`${t.name} V${version} aplicada como copia independiente a ${s.name}. Áreas y resultados pendientes de cálculo.`);});
      } else {
        access(p.id,user,false,true);revision(input.revision,p.revision);
        const copied={...decode(v.config_json),sourceTemplate:source,verification:'pending'};
        transaction(()=>{db.prepare('UPDATE projects SET urban_config_json=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(copied),stamp(),p.id);history(p.id,user.id,'urban_template_applied',`${t.name} V${version} aplicada al terreno como referencia pendiente de verificar.`);});
      }
      send(200,{project:projectFor(p.id,user.id)});return true;
    }
    if(action==='duplicate'&&req.method==='POST') {
      const target=randomUUID(),name=text(input.name,'el nombre de la copia',120,true),now=stamp();
      transaction(()=>{db.prepare('INSERT INTO templates VALUES (?,?,?,?,0,?)').run(target,user.id,t.category,name,now);db.prepare('INSERT INTO template_versions VALUES (?,1,?,?,?)').run(target,t.config_json,`Copia de ${t.name} V${t.version}`,now);});
      send(201,{template:db.prepare(templateQuery+' AND t.id=?').get(target)});return true;
    }
    if(t.owner_id!==user.id)fail(403,'Solo el autor puede modificar esta plantilla; puedes duplicarla.');
    if(action==='versions'&&req.method==='POST') {
      revision(input.version,t.version);
      const config=configData(t.category,input.configuration||{}),name=text(input.name??t.name,'el nombre',120,true),note=text(input.note||'Actualización de configuración','el motivo',500,true);
      transaction(()=>{revision(input.version,db.prepare('SELECT max(version) version FROM template_versions WHERE template_id=?').get(id).version);db.prepare('INSERT INTO template_versions VALUES (?,?,?,?,?)').run(id,t.version+1,JSON.stringify(config),note,stamp());db.prepare('UPDATE templates SET name=? WHERE id=?').run(name,id);});
      send(201,{template:db.prepare(templateQuery+' AND t.id=?').get(id)});return true;
    }
    if(!action&&req.method==='PATCH') {if(typeof input.archived!=='boolean')fail(400,'Estado no válido.');db.prepare('UPDATE templates SET archived=? WHERE id=?').run(input.archived?1:0,id);send(200,{template:db.prepare(templateQuery+' AND t.id=?').get(id)});return true;}
    fail(405,'Método no permitido.');
  }
  return false;
}
