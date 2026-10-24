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

import {extraFrom,extraSummary,validateExtra} from '../shared/building-extra.mjs';

const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
function model(){const b={...buildingFrom({}),floors:12,occupancy:65,unitsPerFloor:4,floorHeight:3,efficiency:85,manualAreaReference:500};b.specials=[1,12].map(floor=>({floor,unitsPerFloor:2,floorHeight:null,efficiency:85,constructedMode:'auto',saleMode:'manual',constructed:null,sale:240}));return b;}
function roofModel(){const b=model(),e=b.extensions;e.areaReference=500;e.basements=[{mode:'auto',occupancy:80,area:null,height:2.5},{mode:'auto',occupancy:80,area:null,height:2.5}];e.parking={enabled:true,mode:'estimate',manual:null,area:620,perSpace:30,commercial:18};e.roof={enabled:true,baseArea:325,duplexBuilt:100,duplexSale:85,commonBuilt:20,servicesBuilt:10,terraces:100,height:3,useStatus:'pending',source:''};e.duplex={enabled:true,connection:'roof',count:2,built:null,sale:null};e.elevators=2;return b;}
const summary=(b,area=500)=>extraSummary(b.extensions,area,buildingSummary(b,area));
test('dúplex de azotea no crean unidades y sus áreas se suman una sola vez; venta hipotética separada',()=>{
  const b=validateBuilding(roofModel(),fail,500),r=summary(b);assert.equal(r.units,44);assert.equal(r.duplexCount,2);assert.equal(r.flats,42);assert.equal(r.basements,800);assert.equal(r.roofBuilt,130);assert.equal(r.constructed,4830);assert.equal(r.hypotheticalSale,85);assert.equal(r.supportedSale,0);assert.equal(r.sale,3242.5);assert.equal(r.roofFree,195);assert.equal(r.height,39);assert.equal(r.parking,20);assert.equal(r.commercial,18);assert.equal(r.complete,false);
});
test('fuente registrada diferencia venta sustentada sin alterar pisos ni declarar aprobación',()=>{
  const b=roofModel();b.extensions.roof.useStatus='supported';b.extensions.roof.source='Documento sintético, revisado por analista';const r=summary(validateBuilding(b,fail,500));assert.equal(r.supportedSale,85);assert.equal(r.hypotheticalSale,0);assert.equal(r.sale,3327.5);assert.equal(r.units,44);assert.throws(()=>validateBuilding({...b,extensions:{...b.extensions,roof:{...b.extensions.roof,source:''}}},fail,500));
});
test('dúplex entre pisos son subconjuntos de destino: no aumentan áreas ni viviendas',()=>{
  const b=model();b.extensions.areaReference=500;b.extensions.duplex={enabled:true,connection:'floors',count:2,built:150,sale:120};const r=summary(validateBuilding(b,fail,500));assert.equal(r.constructed,3900);assert.equal(r.sale,3242.5);assert.equal(r.units,44);assert.equal(r.originFloor,11);assert.equal(r.targetFloor,12);assert.equal(r.roofBuilt,0);assert.equal(r.flats,42);
});
test('estacionamientos estimados redondean abajo, no son venta residencial ni generan costos',()=>{
  const b=model();b.extensions.parking={enabled:true,mode:'estimate',manual:null,area:619,perSpace:30,commercial:18};let r=summary(b);assert.equal(r.parking,20);assert.equal(r.sale,3242.5);b.extensions.parking.commercial=21;assert.throws(()=>validateBuilding(b,fail,500));b.extensions.parking.commercial=18;b.extensions.parking.perSpace=0;assert.throws(()=>validateBuilding(b,fail,500));
});
test('faltantes quedan pendientes y cero explícito se conserva',()=>{
  const b=roofModel();b.extensions.basements[0].occupancy=null;assert.equal(summary(b).basements,null);assert.equal(summary(b).constructed,null);b.extensions.roof.servicesBuilt=null;assert.equal(summary(b).roofBuilt,null);b.extensions.parking.perSpace=null;assert.equal(summary(b).parking,null);b.extensions.roof.servicesBuilt=0;assert.equal(summary(b).roofBuilt,120);b.extensions.parking.enabled=false;assert.equal(summary(b).parking,0);
});
test('cambio de terreno recalcula sótanos automáticos y conserva manuales para revisión',()=>{
  const b=roofModel();b.extensions.basements[1]={mode:'manual',area:350,occupancy:null,height:2.5};const initial=summary(b),changed=summary(b,600);assert.equal(initial.basements,750);assert.equal(changed.basements,830);assert.equal(changed.basementRows[1].area,350);assert.equal(changed.roofBuilt,130);assert.equal(changed.manualReview,true);assert.equal(initial.manualReview,false);
});
test('valida conexiones, superficies y límites de viviendas sin porcentaje de azotea universal',()=>{
  const invalid=[];let b=roofModel();b.extensions.duplex.count=3;invalid.push(b);b=roofModel();b.extensions.roof.baseArea=100;invalid.push(b);b=roofModel();b.extensions.roof.terraces=200;invalid.push(b);b=roofModel();b.extensions.roof.duplexSale=110;invalid.push(b);b=model();b.extensions.duplex={enabled:true,connection:'floors',count:2,built:400,sale:120};invalid.push(b);b=roofModel();b.extensions.roof.enabled=false;invalid.push(b);for(const value of invalid)assert.throws(()=>validateBuilding(value,fail,500));assert.equal('maxRoofPercent' in extraFrom().roof,false);assert.throws(()=>validateExtra({basements:[{mode:'auto',occupancy:101}]},fail));assert.throws(()=>validateExtra({elevators:1.5},fail));
});
test('configuración anterior conserva sótanos y ascensores al pasar al edificio ampliado',()=>{
  const b=buildingFrom({basements:2,elevators:1,buildingBase:{...model(),extensions:undefined}});assert.equal(b.extensions.basements.length,2);assert.equal(b.extensions.elevators,1);assert.equal(summary(b).basements,null);
});
async function setup(t){const a=await fixture(t),p=await a.project();const r=await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:p.revision,land:{area:500}});return {...a,p:r.data.project};}
async function save(a,b,client=a.owner){const d=await a.detail(a.p.id);return client(`/projects/${a.p.id}/building/${d.scenarios[0].id}`,'PATCH',{revision:d.scenarios[0].revision,projectRevision:d.project.revision,building:b});}
test('API guarda ampliación, protege permisos, valida relaciones y conserva adquisiciones',async t=>{
  const a=await setup(t),reader=await a.member(a.p),editor=await a.member(a.p,'editor');const before=await a.detail(a.p.id),s=before.scenarios[0];await a.owner(`/projects/${a.p.id}/scenarios/${s.id}`,'PATCH',{revision:s.revision,economics:{acquisition:{amount:1000000,basis:'total',currency:'PEN',mode:'purchase'},result:123}});
  assert.equal((await save(a,roofModel(),reader)).status,403);let r=await save(a,roofModel(),editor);assert.equal(r.status,200);assert.equal(JSON.parse(r.data.scenario.configuration_json).basements,2);assert.equal(JSON.parse(r.data.scenario.economics_json).acquisition.amount,1000000);assert.equal(JSON.parse(r.data.scenario.economics_json).result,123);assert.equal(JSON.parse(r.data.scenario.economics_json).buildingReview.pending,true);const bad=roofModel();bad.extensions.parking.commercial=99;assert.equal((await save(a,bad)).status,400);
});
test('plantillas, versiones, duplicación y respaldo conservan extensiones independientes',async t=>{
  const a=await setup(t),saved=await save(a,roofModel());assert.equal(saved.status,200);const d=await a.detail(a.p.id),config=JSON.parse(d.scenarios[0].configuration_json),tpl=await a.template('building',config);assert.equal(JSON.parse(tpl.config_json).buildingBase.extensions.duplex.connection,'roof');
  const second=(await a.owner(`/projects/${a.p.id}/scenarios`,'POST',{name:'Alternativa B'})).data.scenario;assert.equal((await a.owner(`/templates/${tpl.id}/apply`,'POST',{projectId:a.p.id,scenarioId:second.id,revision:second.revision,version:1})).status,200);const both=await a.detail(a.p.id);assert.equal(JSON.parse(both.scenarios.find(s=>s.id===second.id).configuration_json).buildingBase.extensions.roof.duplexSale,85);
  const updated=model();await save(a,updated);const unchanged=(await a.detail(a.p.id)).scenarios.find(s=>s.id===second.id);assert.equal(JSON.parse(unchanged.configuration_json).buildingBase.extensions.basements.length,2);
  const copy=await a.owner(`/projects/${a.p.id}/scenarios/${unchanged.id}/duplicate`,'POST',{revision:unchanged.revision,name:'Copia ampliada'});assert.equal(copy.status,201);assert.deepEqual(JSON.parse(copy.data.scenario.configuration_json).buildingBase.extensions,JSON.parse(unchanged.configuration_json).buildingBase.extensions);
  const backup=(await a.owner(`/projects/${a.p.id}/export`)).data.backup,restored=await a.owner('/projects/import','POST',{backup});assert.equal(restored.status,201);const restoredScenario=(await a.detail(restored.data.project.id)).scenarios.find(s=>s.name==='Alternativa B');assert.equal(JSON.parse(restoredScenario.configuration_json).buildingBase.extensions.elevators,2);
  const next={...config,buildingBase:{...config.buildingBase,extensions:{...config.buildingBase.extensions,elevators:3}}};const v=await a.owner(`/templates/${tpl.id}/versions`,'POST',{version:1,name:tpl.name,note:'Ascensores',configuration:next});assert.equal(v.status,201);const versions=(await a.owner(`/templates/${tpl.id}/versions`)).data.versions;assert.equal(JSON.parse(versions.find(v=>v.version===1).config_json).buildingBase.extensions.elevators,2);
});
