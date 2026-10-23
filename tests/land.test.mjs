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

const land={area:500,front:15,depth:30,registry:'0000123',shape:'irregular',offer:{amount:1500000,basis:'total',currency:'PEN'},commercial:{amount:2700,basis:'unit',currency:'PEN'}};
const acquisition={amount:1250000,basis:'total',currency:'PEN',mode:'purchase',notes:'Negociación'};
test('ficha incompleta válida, valores positivos, fechas y opciones se validan',async t=>{
  const a=await fixture(t),p=await a.project();
  let r=await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{}});assert.equal(r.status,200);assert.equal(JSON.parse(r.data.project.land_json).area,null);
  for(const invalid of [{area:0},{area:-1},{fronts:1.5},{shape:'circle'},{offer:{currency:'EUR'}},{offer:{date:'2026-02-30'}}])assert.equal((await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:r.data.project.revision,land:invalid})).status,400);
  r=await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:r.data.project.revision,land});assert.equal(r.status,200);assert.equal(JSON.parse(r.data.project.land_json).registry,'0000123');assert.equal(JSON.parse(r.data.project.land_json).area,500);
});
test('admin controla terreno; editor adquisición; lector y extraños no editan',async t=>{
  const a=await fixture(t),p=await a.project(),editor=await a.member(p,'editor'),reader=await a.member(p),s=(await a.detail(p.id)).scenarios[0];
  for(const client of [editor,reader])assert.equal((await client(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land})).status,403);
  assert.equal((await reader(`/projects/${p.id}/land/acquisition/${s.id}`,'PATCH',{revision:s.revision,acquisition})).status,403);
  assert.equal((await editor(`/projects/${p.id}/land/acquisition/${s.id}`,'PATCH',{revision:s.revision,acquisition})).status,200);
  const current=(await a.detail(p.id)).project;
  assert.equal((await editor(`/projects/${p.id}`,'PATCH',{revision:current.revision,district:'Cambio no autorizado'})).status,403);
  const other=await a.project();assert.equal((await a.owner(`/projects/${other.id}/land/acquisition/${s.id}`,'PATCH',{revision:2,acquisition})).status,404);
});
test('área marca pendientes sin perder resultados ni adquisiciones; oferta no cambia escenarios',async t=>{
  const a=await fixture(t),p=await a.project();let s=(await a.detail(p.id)).scenarios[0];
  s=(await a.owner(`/projects/${p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,economics:{result:12345,acquisition}})).data.scenario;
  const second=(await a.owner(`/projects/${p.id}/scenarios/${s.id}/duplicate`,'POST',{revision:s.revision,name:'Alternativa B'})).data.scenario;
  await a.owner(`/projects/${p.id}/land/acquisition/${second.id}`,'PATCH',{revision:second.revision,acquisition:{...acquisition,amount:1300000}});
  let d=await a.detail(p.id);const saved=await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:d.project.revision,land});assert.equal(saved.status,200);
  d=await a.detail(p.id);for(const scenario of d.scenarios){const e=JSON.parse(scenario.economics_json);assert.equal(e.result,12345);assert.equal(e.landReview.pending,true);}assert.equal(JSON.parse(d.scenarios.find(x=>x.id===s.id).economics_json).acquisition.amount,1250000);
  const rev=d.scenarios[0].revision;await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:d.project.revision,land:{...land,offer:{...land.offer,amount:999999}}});d=await a.detail(p.id);assert.equal(d.scenarios[0].revision,rev);assert.equal(JSON.parse(d.scenarios.find(x=>x.id===second.id).economics_json).acquisition.amount,1300000);
});
test('concurrencia conserva un ganador y rechaza revisión vieja en terreno y adquisición',async t=>{
  const a=await fixture(t),p=await a.project();const results=await Promise.all([400,500].map(area=>a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{area}})));assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
  const s=(await a.detail(p.id)).scenarios[0];const changes=await Promise.all([500,600].map(amount=>a.owner(`/projects/${p.id}/land/acquisition/${s.id}`,'PATCH',{revision:s.revision,acquisition:{...acquisition,amount}})));assert.deepEqual(changes.map(x=>x.status).sort(),[200,409]);
});
test('duplicación y respaldo restauran ficha y adquisición sin enlazar el original',async t=>{
  const a=await fixture(t),p=await a.project();await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{...land,marketSnapshot:{id:'reference',version:1,median:2000}}});let d=await a.detail(p.id);let s=d.scenarios[0];await a.owner(`/projects/${p.id}/land/acquisition/${s.id}`,'PATCH',{revision:s.revision,acquisition});d=await a.detail(p.id);
  const clone=await a.owner(`/projects/${p.id}/duplicate`,'POST',{revision:d.project.revision,name:'Copia',includeScenarios:true});assert.equal(clone.status,201);assert.deepEqual(JSON.parse(clone.data.project.land_json),JSON.parse(d.project.land_json));
  const backup=(await a.owner(`/projects/${p.id}/export`)).data.backup;assert.equal(backup.project.land.area,500);const restored=await a.owner('/projects/import','POST',{backup});assert.equal(restored.status,201);const r=await a.detail(restored.data.project.id);assert.equal(JSON.parse(r.scenarios[0].economics_json).acquisition.amount,1250000);assert.equal(JSON.parse(r.project.land_json).marketSnapshot.version,1);
  await a.owner(`/projects/${r.project.id}/land`,'PATCH',{revision:r.project.revision,land:{area:700}});assert.equal(JSON.parse((await a.detail(p.id)).project.land_json).area,500);
});
test('referencias manuales versionadas no alteran la instantánea del expediente',async t=>{
  const a=await fixture(t),p=await a.project(),other=await a.member(p,'editor');const input={district:'Distrito de prueba',kind:'Lotes menores de 500 m²',currency:'USD',median:1000,minimum:800,maximum:1200,publicationDate:'2026-10-01',source:'Fuente sintética de pruebas',methodology:'Banda ilustrativa ±20 %, no mínimos y máximos observados',sample:10,maxArea:500};
  let saved=await a.owner('/market-references','POST',input);assert.equal(saved.status,201);const reference=saved.data.reference;await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{marketSnapshot:reference}});
  assert.equal((await other('/market-references','POST',{...input,previousId:reference.id})).status,403);
  saved=await a.owner('/market-references','POST',{...input,median:1100,previousId:reference.id});assert.equal(saved.status,201);assert.equal(saved.data.reference.version,2);assert.equal(JSON.parse((await a.detail(p.id)).project.land_json).marketSnapshot.median,1000);
  assert.equal((await a.owner('/market-references')).data.references.length,2);assert.equal((await a.owner('/market-references','POST',{...input,previousId:reference.id})).status,409);
  assert.equal((await a.owner('/market-references','POST',{...input,minimum:1500,maximum:1000})).status,400);
});

