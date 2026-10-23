import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createMentorServer} from '../server/app.mjs';
import {openStore} from '../server/store.mjs';

async function fixture(t){
  const origin='http://mentor.test',{server,store}=createMentorServer({filename:':memory:',origin});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));t.after(()=>new Promise(done=>server.close(done)));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  function client(){let cookie='';return async(path,method='GET',data)=>{const response=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:data===undefined?undefined:JSON.stringify(data)});const header=response.headers.get('set-cookie');if(header)cookie=header.split(';')[0];return {status:response.status,data:await response.json()};};}
  const owner=client();assert.equal((await owner('/setup','POST',{name:'Administrador de prueba',email:'owner@example.test',password:randomBytes(20).toString('hex')})).status,200);
  async function project(){const r=await owner('/projects','POST',{name:'Terreno de prueba',region:'Región de prueba',province:'Provincia de prueba',responsible:'Responsable de prueba',description:'Notas iniciales'});assert.equal(r.status,201);return r.data.project;}
  async function detail(id){return (await owner(`/projects/${id}`)).data;}
  async function member(p,role='reader'){const other=client(),email=randomBytes(5).toString('hex')+'@example.test';const link=(await owner(`/projects/${p.id}/invitations`,'POST',{email,role})).data.link;const token=new URL(link).searchParams.get('invitacion');assert.equal((await other(`/invitations/${token}`,'POST',{name:'Integrante de prueba',password:randomBytes(20).toString('hex')})).status,200);return other;}
  async function template(category,configuration){const r=await owner('/templates','POST',{category,name:'Configuración de prueba',configuration});assert.equal(r.status,201);return r.data.template;}
  return {owner,client,project,detail,member,template,store};
}

test('duplicar proyecto conserva metadatos y configuraciones sin copiar accesos ni enlazar cambios',async t=>{
  const a=await fixture(t),p=await a.project();await a.member(p);let source=(await a.detail(p.id)).scenarios[0];
  assert.equal((await a.owner(`/projects/${p.id}/scenarios/${source.id}`,'PATCH',{revision:source.revision,configuration:{floors:12,nested:{units:4}},economics:{sale:123}})).status,200);
  const current=(await a.detail(p.id)).project;
  const copied=await a.owner(`/projects/${p.id}/duplicate`,'POST',{revision:current.revision,name:'Copia independiente',includeScenarios:true});assert.equal(copied.status,201);
  const copy=await a.detail(copied.data.project.id);assert.notEqual(copy.project.id,p.id);assert.equal(copy.project.member_count,1);assert.equal(copy.project.responsible,p.responsible);assert.equal(copy.project.description,p.description);
  const scenario=copy.scenarios[0];assert.notEqual(scenario.id,source.id);assert.deepEqual(JSON.parse(scenario.configuration_json),{floors:12,nested:{units:4}});
  await a.owner(`/projects/${copy.project.id}/scenarios/${scenario.id}`,'PATCH',{revision:scenario.revision,configuration:{floors:8}});
  assert.equal(JSON.parse((await a.detail(p.id)).scenarios[0].configuration_json).floors,12);
});

test('escenario duplicado comparte terreno pero guarda su propia configuración y supuestos',async t=>{
  const a=await fixture(t),p=await a.project(),s=(await a.detail(p.id)).scenarios[0];
  const saved=(await a.owner(`/projects/${p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,configuration:{floors:10},economics:{land:750}})).data.scenario;
  const clone=await a.owner(`/projects/${p.id}/scenarios/${s.id}/duplicate`,'POST',{revision:saved.revision,name:'Alternativa B'});assert.equal(clone.status,201);assert.equal(clone.data.scenario.project_id,p.id);assert.notEqual(clone.data.scenario.id,s.id);
  await a.owner(`/projects/${p.id}/scenarios/${clone.data.scenario.id}`,'PATCH',{revision:1,economics:{land:900}});
  const original=(await a.detail(p.id)).scenarios.find(x=>x.id===s.id);assert.equal(JSON.parse(original.economics_json).land,750);
});

test('papelera conserva historial, bloquea el proyecto hasta recuperarlo y requiere permiso de administrador',async t=>{
  const a=await fixture(t),p=await a.project(),editor=await a.member(p,'editor');
  assert.equal((await editor(`/projects/${p.id}/trash`,'POST',{revision:p.revision})).status,403);
  const trash=await a.owner(`/projects/${p.id}/trash`,'POST',{revision:p.revision});assert.equal(trash.status,200);assert.ok(trash.data.project.deleted_at);
  assert.equal((await a.owner(`/projects/${p.id}`)).status,404);
  assert.equal((await editor(`/projects/${p.id}/scenarios`,'POST',{name:'No'})).status,404);
  const recovered=await a.owner(`/projects/${p.id}/recover`,'POST',{revision:trash.data.project.revision});assert.equal(recovered.status,200);assert.equal(recovered.data.project.deleted_at,null);
  const history=(await a.owner(`/projects/${p.id}/history`)).data.history;assert.ok(history.some(x=>x.action==='project_trashed'));assert.ok(history.some(x=>x.action==='project_recovered'));
});

test('el último escenario se conserva; las alternativas retiradas se pueden recuperar',async t=>{
  const a=await fixture(t),p=await a.project(),s=(await a.detail(p.id)).scenarios[0];
  assert.equal((await a.owner(`/projects/${p.id}/scenarios/${s.id}/trash`,'POST',{revision:s.revision})).status,409);
  const second=(await a.owner(`/projects/${p.id}/scenarios`,'POST',{name:'Segunda'})).data.scenario;
  const removed=await a.owner(`/projects/${p.id}/scenarios/${second.id}/trash`,'POST',{revision:second.revision});assert.equal(removed.status,200);
  assert.equal((await a.detail(p.id)).project.scenario_count,1);
  const back=await a.owner(`/projects/${p.id}/scenarios/${second.id}/recover`,'POST',{revision:removed.data.scenario.revision});assert.equal(back.status,200);assert.equal((await a.detail(p.id)).project.scenario_count,2);
});

test('la revisión protege cambios simultáneos del escenario',async t=>{
  const a=await fixture(t),p=await a.project(),s=(await a.detail(p.id)).scenarios[0];
  const responses=await Promise.all(['Uno','Dos'].map(name=>a.owner(`/projects/${p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,name})));
  assert.deepEqual(responses.map(x=>x.status).sort(),[200,409]);
});

test('respaldo de datos se recupera como proyecto nuevo y excluye cuentas y biblioteca global',async t=>{
  const a=await fixture(t),p=await a.project();const reader=await a.member(p);
  assert.equal((await reader(`/projects/${p.id}/export`)).status,403);
  const exported=await a.owner(`/projects/${p.id}/export`),backup=exported.data.backup;assert.equal(exported.status,200);assert.equal(backup.format,'mentor-project');
  for(const key of ['users','sessions','members','templates'])assert.equal(key in backup,false);
  const imported=await a.owner('/projects/import','POST',{backup,name:'Proyecto recuperado'});assert.equal(imported.status,201);assert.notEqual(imported.data.project.id,p.id);assert.equal(imported.data.project.responsible,p.responsible);
  assert.equal((await a.detail(imported.data.project.id)).scenarios.length,1);assert.equal((await a.detail(p.id)).project.name,p.name);
  assert.equal((await a.owner('/projects/import','POST',{backup:{...backup,version:999}})).status,400);
});

test('las versiones de edificio no cambian copias aplicadas ni la norma del terreno',async t=>{
  const a=await fixture(t),p=await a.project(),s=(await a.detail(p.id)).scenarios[0],tpl=await a.template('building',{floors:12,basements:2,unitsPerFloor:4,efficiency:85});
  assert.equal((await a.owner(`/templates/${tpl.id}/apply`,'POST',{projectId:p.id,scenarioId:s.id,revision:s.revision,version:1})).status,200);
  const version2=await a.owner(`/templates/${tpl.id}/versions`,'POST',{name:'Modelo actualizado',version:1,configuration:{floors:8,basements:1,efficiency:83},note:'Nueva alternativa'});assert.equal(version2.status,201);assert.equal(version2.data.template.version,2);
  const detail=await a.detail(p.id);assert.equal(JSON.parse(detail.scenarios[0].configuration_json).floors,12);assert.equal(JSON.parse(detail.scenarios[0].source_template_json).version,1);assert.equal(detail.project.urban_config_json,'{}');
  const versions=await a.owner(`/templates/${tpl.id}/versions`);assert.equal(versions.data.versions.length,2);assert.equal(JSON.parse(versions.data.versions[1].config_json).floors,12);
});

test('la plantilla urbanística se copia al terreno como pendiente y no modifica el edificio',async t=>{
  const a=await fixture(t),p=await a.project(),s=(await a.detail(p.id)).scenarios[0];
  await a.owner(`/projects/${p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,configuration:{floors:12}});
  const tpl=await a.template('urban',{maxFloors:8,minFreeArea:35,source:'Referencia sintética de prueba'}),current=(await a.detail(p.id)).project;
  const applied=await a.owner(`/templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:current.revision,version:1});assert.equal(applied.status,200);
  const detail=await a.detail(p.id),urban=JSON.parse(detail.project.urban_config_json);assert.equal(urban.verification,'pending');assert.equal(urban.maxFloors,8);assert.equal(JSON.parse(detail.scenarios[0].configuration_json).floors,12);
});

test('lector no aplica configuraciones; editar plantillas ajenas requiere una copia',async t=>{
  const a=await fixture(t),p=await a.project(),reader=await a.member(p),s=(await a.detail(p.id)).scenarios[0],tpl=await a.template('building',{floors:5});
  assert.equal((await reader(`/templates/${tpl.id}/apply`,'POST',{projectId:p.id,scenarioId:s.id,revision:s.revision})).status,403);
  assert.equal((await reader(`/templates/${tpl.id}/versions`,'POST',{version:1,name:'No',configuration:{floors:20}})).status,403);
  assert.equal((await reader(`/templates/${tpl.id}/duplicate`,'POST',{name:'Copia personal'})).status,201);
  assert.equal((await a.owner('/templates','POST',{name:'Eficiencia inválida',category:'building',configuration:{efficiency:101}})).status,400);
  assert.equal((await a.owner('/templates','POST',{name:'Campo pendiente',category:'building',configuration:{floors:null,basements:0}})).status,201);
});

test('historial paginado permite revisar más de cincuenta operaciones',async t=>{
  const a=await fixture(t),p=await a.project();
  for(let n=0;n<55;n++)a.store.history(p.id,a.store.db.prepare('SELECT id FROM users').get().id,'test','Operación de prueba '+n);
  const first=(await a.owner(`/projects/${p.id}/history`)).data,second=(await a.owner(`/projects/${p.id}/history?offset=50`)).data;
  assert.equal(first.history.length,50);assert.equal(first.hasMore,true);assert.equal(second.history.length,6);assert.equal(second.hasMore,false);assert.notEqual(first.history[0].id,second.history[0].id);
});

test('migración aditiva conserva registros de la base anterior y puede reabrirse',async()=>{
  const root=resolve('.tmp');mkdirSync(root,{recursive:true});const dir=await mkdtemp(resolve(root,'migration-'));assert.ok(dir.startsWith(root+sep));const file=resolve(dir,'old.sqlite');
  try {
    const old=new DatabaseSync(file);old.exec(`CREATE TABLE projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,code TEXT NOT NULL DEFAULT '',district TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',revision INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL) STRICT; INSERT INTO projects VALUES ('legacy','Proyecto anterior','','','','draft',1,'2026-01-01','2026-01-01');`);old.close();
    let store=openStore(file);let row=store.db.prepare('SELECT * FROM projects WHERE id=?').get('legacy');assert.equal(row.name,'Proyecto anterior');assert.equal(row.deleted_at,null);assert.equal(row.description,'');store.close();
    store=openStore(file);assert.equal(store.db.prepare('SELECT count(*) n FROM projects').get().n,1);assert.equal(store.db.prepare('SELECT max(version) version FROM schema_migrations').get().version,3);store.close();
  } finally {assert.ok(dir.startsWith(root+sep));await rm(dir,{recursive:true,force:true});}
});
