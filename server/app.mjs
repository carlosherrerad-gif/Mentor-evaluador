import {cashflowRoutes} from './cashflow.mjs';
import {economicRoutes} from './economics.mjs';
import {urbanCheckRoutes} from './urban-checks.mjs';
import {urbanRoutes} from './urban.mjs';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.mjs';
import {buildingRoutes} from './building.mjs';
import {landRoutes} from './land.mjs';
import { moduleOne } from './module-one.mjs';
import { token, digest, hashPassword, verifyPassword, sameSecret } from './auth.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
class ApiError extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code; } }
const fail = (status, message, code) => { throw new ApiError(status,message,code); };
function text(value, label, max = 160, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, `Revisa ${label}.`);
  return value.trim();
}
function account(input) {
  const name = text(input.name, 'tu nombre', 100, true);
  const email = text(input.email, 'el correo', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Ingresa un correo válido.');
  if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) fail(400,'Usa una contraseña de 12 a 128 caracteres.');
  return { name,email,password:input.password };
}
async function body(req, limit = 16384) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415,'Se requiere JSON.');
  const chunks=[];let length=0;
  for await (const chunk of req) {length+=chunk.length;if(length>limit)fail(413,'La solicitud es demasiado grande.');chunks.push(chunk);}
  const raw=Buffer.concat(chunks).toString('utf8');
  try { const data = JSON.parse(raw); if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error(); return data; }
  catch { fail(400,'La solicitud no es válida.'); }
}
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.ico':'image/x-icon', '.svg':'image/svg+xml' };

export function createMentorServer({ filename = resolve(root,'data/mentor.sqlite'), origin = 'http://127.0.0.1:1430', production = false, setupToken = '', host = '127.0.0.1' } = {}) {
  if (production && new URL(origin).protocol !== 'https:') throw Error('APP_ORIGIN debe usar HTTPS en producción');
  const store = openStore(filename);
  const {db,transaction,history,projectFor} = store;
  // Evita diferencias rápidas de respuesta para correos inexistentes.
  const dummyHash = hashPassword(token());
  const attempts = new Map();
  const limiter = setInterval(() => { for (const [key,value] of attempts) if (Date.now() > value.until) attempts.delete(key); }, 60000);
  limiter.unref();
  const publicUser = user => ({id:user.id,name:user.name,email:user.email});
  const hasUsers = () => Number(db.prepare('SELECT count(*) n FROM users').get().n) > 0;
  const localSetup = !production && ['127.0.0.1','localhost','::1'].includes(host);
  const setupAllowed = Boolean(setupToken) || localSetup;
  function checkAccess(projectId,user,write = false,admin = false,includeDeleted = false) {
    const project = projectFor(projectId,user.id);
    if (!project || (project.deleted_at && !includeDeleted)) fail(404,'Proyecto no encontrado.');
    if ((write && project.role === 'reader') || (admin && project.role !== 'admin')) fail(403,'Tu permiso no permite realizar esta acción.');
    return project;
  }
  function currentUser(req) {
    const cookie = req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('mentor_session='))?.slice(15);
    if (!cookie) return null;
    return db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(digest(cookie),Date.now()) || null;
  }
  const cookie = (value,maxAge) => `mentor_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
  function session(res,user) {
    const value = token();
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(value),user.id,Date.now()+12*3600000);
    res.setHeader('Set-Cookie',cookie(value,43200));
  }
  const server = createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (production) res.setHeader('Strict-Transport-Security','max-age=31536000');
    const send = (status,data) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url,origin), path = url.pathname;
      if (!path.startsWith('/api/')) {
        if (!['GET','HEAD'].includes(req.method)) fail(405,'Método no permitido.');
        let file = resolve(root,'dist','.'+decodeURIComponent(path));
        const dist = resolve(root,'dist');
        if (file !== dist && !file.startsWith(dist+sep)) fail(404,'No encontrado.');
        if (!extname(path)) file = resolve(dist,'index.html');
        try { if (!(await stat(file)).isFile()) fail(404,'No encontrado.'); }
        catch { fail(404,'Recurso no encontrado. Ejecuta pnpm build.'); }
        res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});
        res.end(req.method==='HEAD'?undefined:await readFile(file)); return;
      }
      if (!['GET','HEAD'].includes(req.method)) {
        if (req.headers.origin !== origin) fail(403,'Origen no autorizado.');
        if (!req.headers['content-type']?.startsWith('application/json')) fail(415,'Se requiere JSON.');
      }
      if (path === '/api/health' && req.method==='GET') return send(200,{ok:true});
      const user = currentUser(req);
      if (path === '/api/session' && req.method==='GET') return send(200,{user:user?publicUser(user):null,setupRequired:!hasUsers(),setupAllowed,setupTokenRequired:Boolean(setupToken)});
      if (['/api/login','/api/setup'].includes(path) && req.method==='POST') {
        const key = req.socket.remoteAddress || 'unknown';
        const attempt = attempts.get(key);
        if (attempt && Date.now()<attempt.until && attempt.count>=10) fail(429,'Demasiados intentos. Vuelve a intentar en 15 minutos.');
        attempts.set(key,{count:(attempt && Date.now()<attempt.until?attempt.count:0)+1,until:attempt && Date.now()<attempt.until?attempt.until:Date.now()+900000});
        const input = await body(req);
        let logged;
        if (path === '/api/setup') {
          if (!setupAllowed || hasUsers()) fail(403,'La configuración inicial no está disponible.');
          if (setupToken && !sameSecret(String(input.setupToken || ''),setupToken)) fail(403,'La clave de configuración no es válida.');
          if (!setupToken && !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) fail(403,'Configuración disponible solo desde este equipo.');
          const data = account(input), hash = await hashPassword(data.password);
          // Revalidar después del hash asíncrono para impedir dos primeros administradores.
          logged = transaction(() => {
            if (hasUsers()) fail(409,'La cuenta inicial ya fue creada.');
            const id = randomUUID();
            db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(id,data.name,data.email,hash,new Date().toISOString());
            return db.prepare('SELECT * FROM users WHERE id=?').get(id);
          });
        } else {
          const email = typeof input.email==='string'?input.email.trim().toLowerCase():'';
          if (typeof input.password!=='string' || input.password.length>128) fail(401,'Correo o contraseña incorrectos.');
          logged = db.prepare('SELECT * FROM users WHERE email=?').get(email);
          const valid = await verifyPassword(input.password,logged?.password_hash || await dummyHash);
          if (!logged || !valid) fail(401,'Correo o contraseña incorrectos.');
        }
        attempts.delete(key); session(res,logged); return send(200,{user:publicUser(logged)});
      }
      if (path === '/api/logout' && req.method==='POST') {
        const value = req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('mentor_session='))?.slice(15);
        if (value) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(value));
        res.setHeader('Set-Cookie',cookie('',0)); return send(200,{ok:true});
      }
      const inviteMatch = path.match(/^\/api\/invitations\/([A-Za-z0-9_-]{43})$/);
      if (inviteMatch && ['GET','POST'].includes(req.method)) {
        const hash = digest(inviteMatch[1]);
        const invite = db.prepare(`SELECT i.*,p.name project_name FROM invitations i JOIN projects p ON p.id=i.project_id WHERE i.token_hash=? AND i.expires_at>?`).get(hash,Date.now());
        if (!invite) fail(404,'La invitación no existe, expiró o ya fue utilizada.');
        const existing = db.prepare('SELECT * FROM users WHERE email=?').get(invite.email);
        if (req.method==='GET') return send(200,{projectName:invite.project_name,email:invite.email,role:invite.role,accountExists:Boolean(existing)});
        const input = await body(req);
        let member = existing, newHash;
        if (existing) { if (!user || user.id!==existing.id) fail(403,'Inicia sesión con el correo de la invitación.'); }
        else { const data = account({...input,email:invite.email}); newHash = await hashPassword(data.password); member={id:randomUUID(),name:data.name,email:data.email}; }
        transaction(()=>{
          if (!db.prepare('SELECT 1 FROM invitations WHERE token_hash=? AND expires_at>?').get(hash,Date.now())) fail(409,'La invitación ya no está disponible.');
          if (!existing) {
            if (db.prepare('SELECT 1 FROM users WHERE email=?').get(member.email)) fail(409,'La cuenta ya existe. Inicia sesión para aceptar la invitación.');
            db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(member.id,member.name,member.email,newHash,new Date().toISOString());
          }
          // Un enlace antiguo nunca degrada permisos ya concedidos.
          db.prepare('INSERT OR IGNORE INTO project_members VALUES (?,?,?)').run(invite.project_id,member.id,invite.role);
          db.prepare('DELETE FROM invitations WHERE token_hash=?').run(hash);
          history(invite.project_id,member.id,'member_joined',`${member.name} se incorporó al proyecto.`);
        });
        session(res,member); return send(200,{user:publicUser(member),projectId:invite.project_id});
      }
      if (!user) fail(401,'Inicia sesión para continuar.');
      if (await cashflowRoutes({path,req,user,store,body,fail,access:checkAccess,send})) return;
      if (await economicRoutes({path,req,user,store,body,fail,access:checkAccess,send})) return;
      if (urbanCheckRoutes({path,req,user,store,access:checkAccess,send,fail})) return;
      if (await urbanRoutes({path,req,user,store,body,text,fail,access:checkAccess,send})) return;
      if (await buildingRoutes({path,req,user,store,body,text,fail,access:checkAccess,send})) return;
      if (await landRoutes({path,req,user,store,body,text,fail,access:checkAccess,send})) return;
      if (await moduleOne({path,req,user,store,body,text,fail,access:checkAccess,send})) return;
      const memberMatch=path.match(/^\/api\/projects\/([a-f0-9-]{36})\/members\/([a-f0-9-]{36})$/);
      if (memberMatch && req.method==='DELETE') {
        const [,projectId,userId]=memberMatch;
        checkAccess(projectId,user,false,true);
        const member=db.prepare('SELECT m.role,u.name,u.email FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? AND m.user_id=?').get(projectId,userId);
        if (!member) fail(404,'Miembro no encontrado.');
        if (member.role==='admin') fail(400,'No se puede retirar el acceso del administrador del proyecto.');
        transaction(()=>{
          db.prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(projectId,userId);
          db.prepare('DELETE FROM invitations WHERE project_id=? AND email=?').run(projectId,member.email);
          history(projectId,user.id,'member_removed',`Acceso retirado a ${member.name}.`);
        });
        return send(200,{ok:true});
      }
      if (path === '/api/projects' && req.method==='GET') {
        const projects=db.prepare(`SELECT p.*,m.role,(SELECT count(*) FROM scenarios s WHERE s.project_id=p.id AND s.deleted_at IS NULL) scenario_count,
          (SELECT count(*) FROM project_members pm WHERE pm.project_id=p.id) member_count
          FROM projects p JOIN project_members m ON m.project_id=p.id WHERE m.user_id=? ORDER BY p.updated_at DESC`).all(user.id);
        return send(200,{projects});
      }
      if (path === '/api/projects' && req.method==='POST') {
        const input = await body(req), name=text(input.name,'el nombre del proyecto',120,true);
        const code=text(input.code ?? '','el código',40),district=text(input.district ?? '','el distrito',120),address=text(input.address ?? '','la dirección',240);
        const id=randomUUID(),date=new Date().toISOString();
        transaction(()=>{
          db.prepare('INSERT INTO projects(id,name,code,district,address,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(id,name,code,district,address,date,date);
          db.prepare('UPDATE projects SET region=?,province=?,responsible=?,description=? WHERE id=?').run(text(input.region??'', 'el departamento',120),text(input.province??'', 'la provincia',120),text(input.responsible??'', 'el responsable',120),text(input.description??'', 'la descripción',2000),id);
          db.prepare('INSERT INTO project_members VALUES (?,?,?)').run(id,user.id,'admin');
          db.prepare('INSERT INTO scenarios(id,project_id,name,created_at,updated_at) VALUES (?,?,?,?,?)').run(randomUUID(),id,'Escenario A',date,date);
          history(id,user.id,'project_created',`Proyecto ${name} creado.`);
        });
        return send(201,{project:projectFor(id,user.id)});
      }
      const match = path.match(/^\/api\/projects\/([a-f0-9-]{36})(?:\/(scenarios|members|invitations|history))?$/);
      if (match) {
        const [,id,resource]=match;
        const project=checkAccess(id,user);
        if (!resource && req.method==='GET') return send(200,{project,scenarios:db.prepare('SELECT * FROM scenarios WHERE project_id=? ORDER BY created_at,id').all(id)});
        if (!resource && req.method==='PATCH') {
          checkAccess(id,user,true);
          const input=await body(req);
          if (input.revision!==project.revision) fail(409,'Otra persona modificó este proyecto. Actualiza los datos antes de guardar.','REVISION_CONFLICT');
          const name=text(input.name ?? project.name,'el nombre',120,true),code=text(input.code ?? project.code,'el código',40),district=text(input.district ?? project.district,'el distrito',120),address=text(input.address ?? project.address,'la dirección',240);
          if(['district','address','region','province'].some(k=>input[k]!==undefined&&input[k]!==project[k])) checkAccess(id,user,false,true);
          const status=input.status ?? project.status;
          if (!['draft','active','archived'].includes(status)) fail(400,'Estado inválido.');
          if (status!==project.status) checkAccess(id,user,false,true);
          transaction(()=>{
            db.prepare('UPDATE projects SET region=?,province=?,responsible=?,description=? WHERE id=?').run(text(input.region??project.region,'el departamento',120),text(input.province??project.province,'la provincia',120),text(input.responsible??project.responsible,'el responsable',120),text(input.description??project.description,'la descripción',2000),id);
            const result=db.prepare('UPDATE projects SET name=?,code=?,district=?,address=?,status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').run(name,code,district,address,status,new Date().toISOString(),id,input.revision);
            if (!result.changes) fail(409,'El proyecto cambió. Recarga antes de guardar.','REVISION_CONFLICT');
            history(id,user.id,'project_updated',status!==project.status?`Estado cambiado a ${status}.`:'Ficha del proyecto actualizada.');
          });
          return send(200,{project:projectFor(id,user.id)});
        }
        if (resource==='scenarios' && req.method==='POST') {
          checkAccess(id,user,true); const input=await body(req),name=text(input.name,'el nombre del escenario',100,true),date=new Date().toISOString();
          const scenarioId=randomUUID();
          transaction(()=>{
            db.prepare('INSERT INTO scenarios(id,project_id,name,created_at,updated_at) VALUES (?,?,?,?,?)').run(scenarioId,id,name,date,date);
            db.prepare('UPDATE projects SET updated_at=?,revision=revision+1 WHERE id=?').run(date,id);
            history(id,user.id,'scenario_created',`Escenario ${name} creado.`);
          });
          return send(201,{scenario:db.prepare('SELECT * FROM scenarios WHERE id=?').get(scenarioId)});
        }
        if (resource==='members' && req.method==='GET') return send(200,{members:db.prepare(`SELECT u.id,u.name,u.email,m.role FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? ORDER BY u.name`).all(id)});
        if (resource==='invitations' && req.method==='POST') {
          checkAccess(id,user,false,true); const input=await body(req), email=text(input.email,'el correo',254,true).toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['editor','reader'].includes(input.role)) fail(400,'Revisa correo y permiso.');
          const value=token(),expires=Date.now()+48*3600000;
          transaction(()=>{
            db.prepare('DELETE FROM invitations WHERE project_id=? AND email=?').run(id,email);
            db.prepare('INSERT INTO invitations VALUES (?,?,?,?,?,?)').run(digest(value),id,email,input.role,expires,user.id);
            history(id,user.id,'invitation_created',`Invitación ${input.role} creada para ${email}.`);
          });
          return send(201,{link:`${origin}/?invitacion=${value}`,expiresAt:new Date(expires).toISOString()});
        }
        if (resource==='history' && req.method==='GET') {const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)fail(400,'Página no válida.');const rows=db.prepare(`SELECT h.id,h.action,h.detail,h.created_at,u.name user_name FROM history h JOIN users u ON u.id=h.user_id WHERE project_id=? ORDER BY h.created_at DESC,h.rowid DESC LIMIT 51 OFFSET ?`).all(id,offset);return send(200,{history:rows.slice(0,50),hasMore:rows.length>50});}
      }
      fail(404,'Recurso no encontrado.');
    } catch (error) {
      if (!(error instanceof ApiError)) console.error('Error interno en API:',error.code || error.name);
      send(error.status || 500,{error:error.status?error.message:'No se pudo completar la operación.',code:error.code && error.status?error.code:undefined});
    }
  });
  server.requestTimeout=15000;
  server.headersTimeout=10000;
  server.on('close',()=>{clearInterval(limiter);store.close();});
  return {server,store};
}
