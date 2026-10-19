import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createMentorServer } from '../server/app.mjs';

const password=()=>randomBytes(20).toString('base64url');
const accountData=()=>({name:'Persona de prueba',email:`${randomBytes(6).toString('hex')}@example.test`,password:password()});
async function app(options={}) {
  const origin=options.production?'https://mentor.test':'http://mentor.test';
  const {server,store}=createMentorServer({filename:':memory:',origin,...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const client=()=>{
    let cookie='';
    return {get cookie(){return cookie;},async call(path,method='GET',data,custom={}){
      const response=await fetch(base+'/api'+path,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(cookie?{Cookie:cookie}:{}),...custom},body:data===undefined?undefined:JSON.stringify(data)});
      const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];
      return {status:response.status,data:await response.json(),headers:response.headers};
    }};
  };
  const close=()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  return {store,client,close};
}
async function setup(a){const owner=a.client(),details=accountData();assert.equal((await owner.call('/setup','POST',details)).status,200);return {owner,details};}
async function invite(owner,client,project,role='reader',details=accountData()){
  const created=await owner.call(`/projects/${project.id}/invitations`,'POST',{email:details.email,role});
  assert.equal(created.status,201);const token=new URL(created.data.link).searchParams.get('invitacion');
  const joined=await client.call(`/invitations/${token}`,'POST',details);assert.equal(joined.status,200);
  return {token,details};
}
async function project(owner,name='Proyecto de prueba'){const result=await owner.call('/projects','POST',{name,district:'Distrito de prueba'});assert.equal(result.status,201);return result.data.project;}

test('el acceso anónimo no revela proyectos y la configuración inicial solo ocurre una vez',async t=>{
  const a=await app();t.after(a.close);const anon=a.client();assert.equal((await anon.call('/projects')).status,401);
  const data=accountData();assert.equal((await anon.call('/setup','POST',{...data,password:'corta'})).status,400);
  const {owner,details}=await setup(a);assert.match(owner.cookie,/mentor_session=/);
  assert.equal((await a.client().call('/setup','POST',accountData())).status,403);
  const row=a.store.db.prepare('SELECT * FROM users').get();assert.notEqual(row.password_hash,details.password);assert.match(row.password_hash,/^scrypt:/);
  assert.equal((await owner.call('/session')).data.user.email,details.email);
});

test('login genérico, cookies privadas y cierre de sesión revocan acceso',async t=>{
  const a=await app();t.after(a.close);const {details}=await setup(a),client=a.client();
  const missing=await client.call('/login','POST',{email:'absent@example.test',password:password()});
  const wrong=await client.call('/login','POST',{...details,password:password()});assert.equal(missing.status,401);assert.deepEqual(missing.data,wrong.data);
  const login=await client.call('/login','POST',{...details,email:details.email.toUpperCase()});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const old=client.cookie;assert.equal((await client.call('/logout','POST',{})).status,200);
  assert.equal((await a.client().call('/projects','GET',undefined,{Cookie:old})).status,401);
});

test('proyecto y primer escenario se crean juntos y las revisiones evitan sobrescrituras',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner);
  const detail=await owner.call(`/projects/${p.id}`);assert.equal(detail.data.scenarios.length,1);assert.equal(detail.data.project.role,'admin');
  const results=await Promise.all(['Nombre A','Nombre B'].map(name=>owner.call(`/projects/${p.id}`,'PATCH',{revision:p.revision,name})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await owner.call(`/projects/${p.id}/history`)).data.history.length,2);
});

test('editor invitado comparte el proyecto y crea alternativas independientes',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner),editor=a.client();
  await invite(owner,editor,p,'editor');const shared=(await editor.call('/projects')).data.projects;assert.equal(shared.length,1);assert.equal(shared[0].id,p.id);
  assert.equal((await editor.call(`/projects/${p.id}`,'PATCH',{revision:p.revision,name:'Actualizado por editor'})).status,200);
  assert.equal((await owner.call(`/projects/${p.id}`)).data.project.name,'Actualizado por editor');
  assert.equal((await editor.call(`/projects/${p.id}/scenarios`,'POST',{name:'Alternativa B'})).status,201);
  const scenarios=(await owner.call(`/projects/${p.id}`)).data.scenarios;assert.equal(scenarios.length,2);assert.notEqual(scenarios[0].id,scenarios[1].id);
  assert.equal((await editor.call(`/projects/${p.id}/invitations`,'POST',{email:'other@example.test',role:'reader'})).status,403);
});

test('lector puede consultar pero no editar, archivar, invitar ni crear escenarios',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner),reader=a.client();await invite(owner,reader,p);
  assert.equal((await reader.call(`/projects/${p.id}`)).status,200);
  for(const [suffix,method,data] of [['','PATCH',{revision:p.revision,name:'Prohibido'}],['','PATCH',{revision:p.revision,status:'archived'}],['/scenarios','POST',{name:'No'}],['/invitations','POST',{email:'x@example.test',role:'editor'}]])assert.equal((await reader.call(`/projects/${p.id}${suffix}`,method,data)).status,403);
});

test('los miembros de otro proyecto no acceden a ficha, miembros, historial ni escenarios ajenos',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner),outsider=a.client();await invite(owner,outsider,p);
  const hidden=await project(owner,'Proyecto privado');assert.equal((await outsider.call('/projects')).data.projects.length,1);
  for(const suffix of ['','/members','/history'])assert.equal((await outsider.call(`/projects/${hidden.id}${suffix}`)).status,404);
  assert.equal((await outsider.call(`/projects/${hidden.id}/scenarios`,'POST',{name:'No autorizado'})).status,404);
});

test('invitaciones expiran, son de un uso y no permiten promoción de permisos',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner),reader=a.client();
  assert.equal((await owner.call(`/projects/${p.id}/invitations`,'POST',{email:'a@example.test',role:'admin'})).status,400);
  const {token}=await invite(owner,reader,p);assert.equal((await a.client().call(`/invitations/${token}`)).status,404);
  const next=await owner.call(`/projects/${p.id}/invitations`,'POST',{email:'b@example.test',role:'reader'}),nextToken=new URL(next.data.link).searchParams.get('invitacion');
  a.store.db.prepare('UPDATE invitations SET expires_at=0').run();assert.equal((await a.client().call(`/invitations/${nextToken}`)).status,404);
});

test('un enlace para una cuenta existente requiere sesión del destinatario',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a),p=await project(owner),reader=a.client();const {details}=await invite(owner,reader,p);
  const second=await project(owner,'Segundo proyecto'),link=await owner.call(`/projects/${second.id}/invitations`,'POST',{email:details.email,role:'editor'}),token=new URL(link.data.link).searchParams.get('invitacion');
  assert.equal((await owner.call(`/invitations/${token}`,'POST',{})).status,403);
  assert.equal((await a.client().call(`/invitations/${token}`,'POST',{})).status,403);
  assert.equal((await reader.call(`/invitations/${token}`,'POST',{})).status,200);
});

test('se bloquean escrituras entre orígenes y los intentos de acceso excesivos',async t=>{
  const a=await app();t.after(a.close);const {owner}=await setup(a);
  assert.equal((await owner.call('/projects','POST',{name:'No crear'},{Origin:'https://otro.test'})).status,403);
  assert.equal((await owner.call('/projects')).data.projects.length,0);
  for(let i=0;i<10;i++)assert.equal((await a.client().call('/login','POST',{email:'x@example.test',password:password()})).status,401);
  assert.equal((await a.client().call('/login','POST',{email:'x@example.test',password:password()})).status,429);
});

test('persistencia: los proyectos y sesiones sobreviven al reinicio del servidor',async()=>{
  mkdirSync(resolve('.tmp'),{recursive:true});const dir=await mkdtemp(resolve('.tmp/persist-')),filename=resolve(dir,'test.sqlite');
  let a=await app({filename});try{const {owner}=await setup(a),p=await project(owner),cookie=owner.cookie;await a.close();a=await app({filename});const result=await a.client().call(`/projects/${p.id}`,'GET',undefined,{Cookie:cookie});assert.equal(result.status,200);assert.equal(result.data.project.name,p.name);}finally{await a.close();await rm(dir,{recursive:true,force:true});}
});

test('producción exige HTTPS y una clave para crear la primera cuenta',async t=>{
  assert.throws(()=>createMentorServer({production:true,origin:'http://mentor.test',filename:':memory:'}),/HTTPS/);
  const blocked=await app({production:true});t.after(blocked.close);assert.equal((await blocked.client().call('/setup','POST',accountData())).status,403);
  const key=password(),a=await app({production:true,setupToken:key});t.after(a.close);
  const result=await a.client().call('/setup','POST',{...accountData(),setupToken:key});assert.equal(result.status,200);assert.match(result.headers.get('set-cookie'),/; Secure/);
});
