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

import {buildingFrom,buildingSummary,validateBuilding} from '../shared/building.mjs';

const typical=()=>({...buildingFrom({}),floors:12,unitsPerFloor:4,floorHeight:3,occupancy:65,efficiency:85});
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
test('12 pisos con dos excepciones: 44 viviendas, sin sumar dos veces plantas',()=>{
  const model=typical();model.specials=[1,12].map(floor=>({...model,floor,unitsPerFloor:2,saleMode:'manual',sale:240}));model.manualAreaReference=500;
  const result=buildingSummary(validateBuilding(model,fail,500),500);assert.equal(result.units,44);assert.equal(result.constructed,3900);assert.equal(result.sale,3242.5);assert.equal(result.height,36);assert.equal(result.typicalFloors,10);assert.equal(result.specialFloors,2);assert.ok(Math.abs(result.average-73.693181818)<1e-6);assert.equal(result.complete,true);
});
test('lobby sin viviendas conserva construcción y aporta cero área vendible; no divide entre cero',()=>{
  const model={...typical(),floors:1,unitsPerFloor:0};const result=buildingSummary(model,500);assert.equal(result.sale,0);assert.equal(result.constructed,325);assert.equal(result.average,null);assert.equal(result.units,0);
});
test('faltantes no se transforman en cero ni sumas parciales completas',()=>{
  const model=typical();assert.equal(buildingSummary(model,null).constructed,null);model.specials=[{...model,floor:1,unitsPerFloor:null,floorHeight:null}];model.floorHeight=null;const result=buildingSummary(model,500);assert.equal(result.units,null);assert.equal(result.average,null);assert.equal(result.height,null);model.efficiency=null;assert.equal(buildingSummary(model,500).sale,null);
});
test('cambio de terreno recalcula automáticas y conserva manuales pendientes de revisión',()=>{
  const model=typical();model.manualAreaReference=500;model.specials=[{...model,floor:1,constructedMode:'manual',constructed:300,saleMode:'manual',sale:240}];const before=buildingSummary(model,500),after=buildingSummary(model,600);assert.equal(before.constructed,3875);assert.equal(after.constructed,4590);assert.equal(after.rows[0].constructed,300);assert.equal(after.rows[1].constructed,390);assert.equal(after.manualReview,true);assert.equal(before.manualReview,false);
});
test('valida pisos, conteos, porcentajes, excepciones únicas y vendible <= construida',()=>{
  for(const model of [{...typical(),floors:0},{...typical(),unitsPerFloor:2.5},{...typical(),occupancy:101},{...typical(),floorHeight:0},{...typical(),specials:[{...typical(),floor:13}]},{...typical(),specials:[1,1].map(floor=>({...typical(),floor}))},{...typical(),saleMode:'manual',sale:500}])assert.throws(()=>validateBuilding(model,fail,500));assert.doesNotThrow(()=>validateBuilding({},fail));
});
async function prepared(t){const a=await fixture(t),p=await a.project();await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{area:500}});return {...a,p:(await a.detail(p.id)).project};}
async function save(a,s,model,client=a.owner){const p=(await a.detail(a.p.id)).project;return client(`/projects/${a.p.id}/building/${s.id}`,'PATCH',{revision:s.revision,projectRevision:p.revision,building:model});}
test('guardar edificio respeta permisos, conserva economía y rechaza concurrencia de escenario o terreno',async t=>{
  const a=await prepared(t),editor=await a.member(a.p,'editor'),reader=await a.member(a.p);let s=(await a.detail(a.p.id)).scenarios[0];s=(await a.owner(`/projects/${a.p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,economics:{result:123}})).data.scenario;
  assert.equal((await save(a,s,typical(),reader)).status,403);const saved=await save(a,s,typical(),editor);assert.equal(saved.status,200);assert.equal(JSON.parse(saved.data.scenario.economics_json).result,123);assert.equal((await save(a,s,typical())).status,409);
  const current=await a.detail(a.p.id);await a.owner(`/projects/${a.p.id}/land`,'PATCH',{revision:current.project.revision,land:{area:600}});assert.equal((await a.owner(`/projects/${a.p.id}/building/${s.id}`,'PATCH',{revision:saved.data.scenario.revision,projectRevision:current.project.revision,building:typical()})).status,409);
});
test('plantillas completas, copias y respaldo conservan excepciones; aplicación recalcula automáticas en destino',async t=>{
  const a=await prepared(t);let s=(await a.detail(a.p.id)).scenarios[0];const model=typical();model.specials=[{...model,floor:1,unitsPerFloor:2}];const saved=await save(a,s,model);assert.equal(saved.status,200);const tpl=await a.template('building',{floors:12,buildingBase:model});assert.equal(JSON.parse(tpl.config_json).buildingBase.specials.length,1);
  const destination=await a.project();const landSaved=await a.owner(`/projects/${destination.id}/land`,'PATCH',{revision:destination.revision,land:{area:600}});assert.equal(landSaved.status,200);const ds=(await a.detail(destination.id)).scenarios[0];assert.equal((await a.owner(`/templates/${tpl.id}/apply`,'POST',{projectId:destination.id,scenarioId:ds.id,revision:ds.revision,version:1})).status,200);
  const copied=(await a.detail(destination.id)).scenarios[0];assert.equal(buildingSummary(buildingFrom(JSON.parse(copied.configuration_json)),600).constructed,4680);assert.equal(buildingSummary(buildingFrom(JSON.parse(saved.data.scenario.configuration_json)),500).constructed,3900);
  const backup=(await a.owner(`/projects/${a.p.id}/export`)).data.backup;const restored=await a.owner('/projects/import','POST',{backup});assert.equal(restored.status,201);const r=(await a.detail(restored.data.project.id)).scenarios[0];assert.equal(JSON.parse(r.configuration_json).buildingBase.specials[0].unitsPerFloor,2);
  const dupe=await a.owner(`/projects/${a.p.id}/scenarios/${saved.data.scenario.id}/duplicate`,'POST',{revision:saved.data.scenario.revision,name:'Copia edificio'});assert.equal(dupe.status,201);assert.notEqual(dupe.data.scenario.id,saved.data.scenario.id);assert.deepEqual(JSON.parse(dupe.data.scenario.configuration_json).buildingBase,JSON.parse(saved.data.scenario.configuration_json).buildingBase);
});
