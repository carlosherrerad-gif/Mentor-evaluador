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

import {urbanFrom,urbanWarnings,validateUrban} from '../shared/urban.mjs';

const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const config={district:'Los Olivos',zoning:'Zona sintética',scope:'general',maxHeight:36,maxFloors:12,minFreeArea:35,minLotArea:450,minFront:12,frontSetback:3,sideSetback:0,rearSetback:0,parkingMode:'perDwelling',parkingPerDwelling:0.5,roofMaxPercent:50,roofBaseArea:300,roofBaseDefinition:'Superficie indicada en documento ficticio',roofResidentialUse:'pending',duplexUse:'pending',source:'Referencia sintética, no normativa real',issueDate:'2026-01-01',expiryDate:'2027-01-01'};
test('parámetros incompletos son borradores sin valores normativos predeterminados',()=>{
  const u=validateUrban({},fail);assert.equal(u.maxHeight,null);assert.equal(u.maxFloors,null);assert.equal(u.roofMaxPercent,null);assert.equal(u.roofResidentialUse,'pending');assert.equal(u.scope,'unspecified');assert.equal(u.parkingMode,'pending');assert.equal(u.expiryDate,'');assert.equal('verification' in u,false);
});
test('validación de porcentajes, enteros, fechas, unidades y ceros explícitos',()=>{
  assert.equal(validateUrban(config,fail).sideSetback,0);assert.equal(validateUrban({parkingFixed:0,minFreeArea:0},fail).parkingFixed,0);
  for(const bad of [{maxFloors:0},{maxFloors:2.5},{minFreeArea:101},{roofMaxPercent:-1},{maxHeight:0},{parkingFixed:1.5},{issueDate:'2026-02-30'},{issueDate:'2026-10-01',expiryDate:'2026-01-01'},{source:{bad:true}},{parkingMode:'arbitrary'}])assert.throws(()=>validateUrban(bad,fail));
});
test('avisos de aplicabilidad no certifican cumplimiento y detectan distrito, predio y fecha',()=>{
  const warnings=urbanWarnings({...config,scope:'plot',expiryDate:'2026-01-02'},'Miraflores','2026-10-23');assert.ok(warnings.some(w=>w.includes('difiere')));assert.ok(warnings.some(w=>w.includes('predio específico')));assert.ok(warnings.some(w=>w.includes('vencimiento')));assert.equal(urbanWarnings(config,'Los Olivos','2026-10-23').length,0);
});
async function create(a,configuration=config){const r=await a.owner('/urban-templates','POST',{name:'Parámetros de prueba',configuration});assert.equal(r.status,201);return r.data.template;}
test('administrador guarda parámetros, conserva edificio/economía y marca comprobaciones pendientes',async t=>{
  const a=await fixture(t),p=await a.project(),editor=await a.member(p,'editor'),reader=await a.member(p),s=(await a.detail(p.id)).scenarios[0];await a.owner(`/projects/${p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,configuration:{floors:12},economics:{result:500,acquisition:{amount:1000,basis:'total',currency:'PEN',mode:'purchase'}}});const current=(await a.detail(p.id)).project;
  for(const client of [editor,reader])assert.equal((await client(`/projects/${p.id}/urban`,'PATCH',{revision:current.revision,configuration:config})).status,403);
  const saved=await a.owner(`/projects/${p.id}/urban`,'PATCH',{revision:current.revision,configuration:{...config,verification:'approved'}});assert.equal(saved.status,200);assert.equal(JSON.parse(saved.data.project.urban_config_json).verification,'pending');const d=await a.detail(p.id);assert.equal(JSON.parse(d.scenarios[0].configuration_json).floors,12);const e=JSON.parse(d.scenarios[0].economics_json);assert.equal(e.result,500);assert.equal(e.acquisition.amount,1000);assert.equal(e.urbanReview.pending,true);
  assert.equal((await a.owner(`/projects/${p.id}/urban`,'PATCH',{revision:current.revision,configuration:config})).status,409);
});
test('plantillas se editan sobre el mismo registro sin crear nuevas versiones ni cambiar copias aplicadas',async t=>{
  const a=await fixture(t),p=await a.project(),tpl=await create(a);assert.equal('version' in tpl,false);assert.equal('version_date' in tpl,false);
  const applied=await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:p.revision,templateRevision:tpl.revision});assert.equal(applied.status,200);
  const updated=await a.owner(`/urban-templates/${tpl.id}`,'PATCH',{name:'Parámetros ajustados',revision:tpl.revision,configuration:{...config,maxFloors:8}});assert.equal(updated.status,200);assert.equal(updated.data.template.id,tpl.id);assert.notEqual(updated.data.template.revision,tpl.revision);assert.equal(a.store.db.prepare('SELECT count(*) n FROM template_versions WHERE template_id=?').get(tpl.id).n,1);
  const copy=JSON.parse((await a.detail(p.id)).project.urban_config_json);assert.equal(copy.maxFloors,12);assert.equal(copy.sourceTemplate.name,'Parámetros de prueba');assert.equal('version' in copy.sourceTemplate,false);
  assert.equal((await a.owner(`/templates/${tpl.id}/versions`)).status,405);assert.equal((await a.owner(`/templates/${tpl.id}/versions`,'POST',{version:1,configuration:config})).status,405);
  assert.equal((await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:applied.data.project.revision,templateRevision:tpl.revision})).status,409);
  assert.equal((await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:applied.data.project.revision,templateRevision:updated.data.template.revision})).status,200);assert.equal(JSON.parse((await a.detail(p.id)).project.urban_config_json).maxFloors,8);
});
test('dos ediciones simultáneas no sobrescriben una plantilla silenciosamente',async t=>{
  const a=await fixture(t),tpl=await create(a);const results=await Promise.all([8,10].map(maxFloors=>a.owner(`/urban-templates/${tpl.id}`,'PATCH',{revision:tpl.revision,configuration:{...config,maxFloors}})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});
test('duplicar crea alternativa propia; solo autor edita o elimina; papelera no modifica proyectos',async t=>{
  const a=await fixture(t),p=await a.project(),other=await a.member(p),tpl=await create(a);await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:p.revision,templateRevision:tpl.revision});
  assert.equal((await other(`/urban-templates/${tpl.id}`,'PATCH',{revision:tpl.revision,configuration:config})).status,403);assert.equal((await other(`/urban-templates/${tpl.id}`,'DELETE',{revision:tpl.revision})).status,403);
  const dupe=await other(`/urban-templates/${tpl.id}/duplicate`,'POST',{name:'Mi alternativa',templateRevision:tpl.revision});assert.equal(dupe.status,201);assert.notEqual(dupe.data.template.id,tpl.id);assert.equal(JSON.parse(dupe.data.template.config_json).maxFloors,12);
  const removed=await a.owner(`/urban-templates/${tpl.id}`,'DELETE',{revision:tpl.revision});assert.equal(removed.status,200);assert.equal(removed.data.template.archived,1);assert.equal(JSON.parse((await a.detail(p.id)).project.urban_config_json).maxFloors,12);
  assert.equal((await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:(await a.detail(p.id)).project.revision,templateRevision:removed.data.template.revision})).status,409);
  const recovered=await a.owner(`/urban-templates/${tpl.id}/restore`,'POST',{revision:removed.data.template.revision});assert.equal(recovered.status,200);assert.equal(recovered.data.template.archived,0);
});
test('biblioteca anterior se conserva y la aplicación antigua usa copia actual sin versión seleccionable',async t=>{
  const a=await fixture(t),p=await a.project();const tpl=await a.template('urban',{maxFloors:10,source:'Fuente anterior'});const list=(await a.owner('/urban-templates')).data.templates;assert.ok(list.some(t=>t.id===tpl.id));const applied=await a.owner(`/templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:p.revision,version:1});assert.equal(applied.status,200);assert.equal(JSON.parse(applied.data.project.urban_config_json).maxFloors,10);
});
test('respaldo y duplicación conservan parámetros, copia de fuente y borradores incompletos',async t=>{
  const a=await fixture(t),p=await a.project(),tpl=await create(a);await a.owner(`/urban-templates/${tpl.id}/apply`,'POST',{projectId:p.id,revision:p.revision,templateRevision:tpl.revision});const current=(await a.detail(p.id)).project;
  const duplicated=await a.owner(`/projects/${p.id}/duplicate`,'POST',{revision:current.revision,name:'Copia de parámetros',includeScenarios:true});assert.equal(duplicated.status,201);assert.equal(JSON.parse(duplicated.data.project.urban_config_json).roofBaseArea,300);
  const backup=(await a.owner(`/projects/${p.id}/export`)).data.backup,restored=await a.owner('/projects/import','POST',{backup});assert.equal(restored.status,201);const configCopy=JSON.parse(restored.data.project.urban_config_json);assert.equal(configCopy.maxHeight,36);assert.equal(configCopy.verification,'pending');assert.equal(configCopy.sourceTemplate.id,tpl.id);
  const draft=await a.owner(`/projects/${p.id}/urban`,'PATCH',{revision:current.revision,configuration:{}});assert.equal(draft.status,200);assert.equal(JSON.parse(draft.data.project.urban_config_json).maxFloors,null);
});
