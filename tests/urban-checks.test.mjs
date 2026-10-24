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

import {urbanChecks} from '../shared/urban-checks.mjs';
import {buildingFrom} from '../shared/building.mjs';

const norm={district:'Los Olivos',zoning:'RDM',source:'Fuente sintética de prueba, sin validez normativa',maxFloors:10,minFreeArea:30,parkingMode:'perDwelling',parkingPerDwelling:0.5,maxHeight:36,minLotArea:450,minFront:12};
function model(){const b={...buildingFrom({}),floors:12,unitsPerFloor:4,occupancy:65,efficiency:85,floorHeight:3,manualAreaReference:500};b.specials=[1,12].map(floor=>({floor,unitsPerFloor:2,floorHeight:null,constructedMode:'auto',saleMode:'manual',constructed:null,sale:240,efficiency:85}));b.extensions.parking={enabled:true,mode:'manual',manual:20,area:null,perSpace:null,commercial:18};return b;}
const check=(b=model(),urban=norm,land={area:500,front:15})=>urbanChecks({urban,configuration:{buildingBase:b},land,district:'Los Olivos',today:'2026-10-23'});
const row=(r,id)=>r.checks.find(r=>r.id===id);
test('compara pisos, área libre y estacionamientos, con diferencias y mínimos/máximos',()=>{
  const r=check();assert.equal(row(r,'floors').status,'exceeds');assert.equal(row(r,'floors').difference,2);assert.equal(row(r,'freeArea').proposed,35);assert.equal(row(r,'freeArea').status,'within');assert.equal(row(r,'freeArea').difference,5);assert.equal(row(r,'parking').limit,22);assert.equal(row(r,'parking').difference,-2);assert.equal(row(r,'parking').status,'exceeds');assert.equal(row(r,'roof').status,'na');assert.equal(r.primary.excesses,2);
});
test('fuente ausente, ámbito distinto, zonificación vacía o fechas inválidas no producen resultados favorables',()=>{
  for(const patch of [{source:''},{district:'Miraflores'},{zoning:''},{expiryDate:'2026-01-01'},{issueDate:'2027-01-01'}]){const r=check(model(),{...norm,...patch});assert.equal(row(r,'freeArea').status,'pending');assert.equal(row(r,'floors').status,'pending');assert.equal(row(r,'floors').numericStatus,'exceeds');assert.ok(r.sourceIssues.length);}
});
test('reglas vacías, propuesta ausente y alturas incompletas permanecen pendientes',()=>{
  const r=check(model(),{...norm,maxFloors:null,minFreeArea:null,parkingMode:'pending'});for(const id of ['floors','freeArea','parking'])assert.equal(row(r,id).status,'pending');
  const missing=urbanChecks({urban:norm,configuration:{},land:{},district:'Los Olivos',today:'2026-10-23'});for(const id of ['floors','freeArea','parking','roof'])assert.equal(row(missing,id).status,'pending');
  const b=model();b.floorHeight=null;assert.equal(row(check(b),'height').status,'pending');
});
test('áreas construidas manuales no se convierten en ocupación real del suelo',()=>{
  const b=model();b.constructedMode='manual';b.constructed=325;let r=check(b);assert.equal(row(r,'freeArea').status,'pending');assert.equal(row(r,'freeArea').proposed,null);b.constructedMode='auto';b.specials[0].constructedMode='manual';b.specials[0].constructed=300;r=check(b);assert.equal(row(r,'freeArea').status,'pending');
});
test('cero explícito es dato; proporciones redondean arriba sin error de punto flotante',()=>{
  let b=model();b.extensions.parking.manual=0;b.extensions.parking.commercial=0;let r=check(b,{...norm,parkingMode:'fixed',parkingFixed:0});assert.equal(row(r,'parking').status,'within');assert.equal(row(r,'parking').limit,0);
  b={...buildingFrom({}),floors:1,unitsPerFloor:100,occupancy:100,efficiency:85,floorHeight:3};b.extensions.parking={enabled:true,mode:'manual',manual:7,commercial:0,area:null,perSpace:null};r=check(b,{...norm,minFreeArea:0,parkingPerDwelling:0.07});assert.equal(row(r,'parking').limit,7);assert.equal(row(r,'parking').status,'within');assert.equal(row(r,'freeArea').proposed,0);assert.equal(row(r,'freeArea').status,'within');assert.equal(row(check(b,{...norm,minFreeArea:0,parkingPerDwelling:1e-12}),'parking').limit,1);
});
test('azotea compara base normativa explícita y suma techados/dúplex una sola vez',()=>{
  const b=model();b.extensions.areaReference=500;b.extensions.roof={enabled:true,baseArea:325,duplexBuilt:100,duplexSale:85,commonBuilt:20,servicesBuilt:10,terraces:100,height:3,useStatus:'pending',source:''};b.extensions.duplex={enabled:true,connection:'roof',count:2,built:null,sale:null};
  const u={...norm,roofBaseArea:300,roofMaxPercent:40,roofBaseDefinition:'Base ficticia expresamente registrada'};const r=check(b,u);assert.equal(row(r,'roof').limit,120);assert.equal(row(r,'roof').proposed,130);assert.equal(row(r,'roof').difference,10);assert.equal(row(r,'roof').status,'exceeds');assert.equal(row(r,'parking').limit,22);assert.equal(row(r,'height').proposed,39);assert.ok(r.warnings.some(w=>w.includes('uso residencial')));
  assert.equal(row(check(b,{...u,roofBaseDefinition:''}),'roof').status,'pending');assert.equal(row(check(b,{...u,roofBaseArea:null}),'roof').limit,null);assert.equal(row(check(b,{...u,roofMaxPercent:null}),'roof').limit,null);
  b.extensions.areaReference=400;assert.equal(row(check(b,u),'roof').status,'pending');
});
test('controles adicionales comprueban altura completa, lote y frente; sin dimensiones no se aprueba',()=>{
  const r=check();assert.equal(row(r,'height').status,'within');assert.equal(row(r,'height').proposed,36);assert.equal(row(r,'lot').difference,50);assert.equal(row(r,'front').difference,3);assert.equal(row(check(model(),norm,{area:400,front:null}),'lot').status,'exceeds');assert.equal(row(check(model(),norm,{area:500}),'front').status,'pending');
});
test('el motor es consulta pura: no modifica hipótesis, parámetros ni resultados',()=>{
  const input={urban:{...norm},configuration:{buildingBase:model()},land:{area:500,front:15},district:'Los Olivos',today:'2026-10-23'};const before=JSON.stringify(input);urbanChecks(input);assert.equal(JSON.stringify(input),before);
  const invalid=check(model(),{...norm,minFreeArea:-10});assert.equal(row(invalid,'freeArea').status,'pending');assert.ok(invalid.sourceIssues.some(w=>w.includes('inconsistentes')));
});
test('API permite lectura a miembros, no expone escenarios ajenos y no cambia revisiones ni economía',async t=>{
  const a=await fixture(t),p=await a.project(),reader=await a.member(p),other=await a.project();let d=await a.detail(p.id);await a.owner(`/projects/${p.id}/land`,'PATCH',{revision:d.project.revision,district:'Los Olivos',land:{area:500,front:15}});d=await a.detail(p.id);await a.owner(`/projects/${p.id}/building/${d.scenarios[0].id}`,'PATCH',{revision:d.scenarios[0].revision,projectRevision:d.project.revision,building:model()});d=await a.detail(p.id);await a.owner(`/projects/${p.id}/urban`,'PATCH',{revision:d.project.revision,configuration:norm});
  const before=await a.detail(p.id),history=(await a.owner(`/projects/${p.id}/history`)).data.history.length,sid=before.scenarios[0].id;
  const response=await reader(`/projects/${p.id}/urban-checks?scenario=${sid}`);assert.equal(response.status,200);assert.equal(response.data.scenarios[0].result.primary.excesses,2);assert.equal(response.data.projectRevision,before.project.revision);assert.ok(response.data.computedAt);
  assert.equal((await a.client()(`/projects/${p.id}/urban-checks`)).status,401);assert.equal((await reader(`/projects/${other.id}/urban-checks`)).status,404);const foreign=(await a.detail(other.id)).scenarios[0];assert.equal((await reader(`/projects/${p.id}/urban-checks?scenario=${foreign.id}`)).status,404);assert.equal((await reader(`/projects/${p.id}/urban-checks`,'POST',{})).status,405);
  const after=await a.detail(p.id);assert.deepEqual(after,before);assert.equal((await a.owner(`/projects/${p.id}/history`)).data.history.length,history);
});
