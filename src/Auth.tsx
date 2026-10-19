import {useEffect,useState,type FormEvent} from 'react';
import {api,type User,type Session} from './api';
import {Brand,Button,ErrorBox,message,roles} from './ui';
import {Icon} from './Icon';
export function Auth({session,onUser,invitation}:{session:Session;onUser:(user:User)=>void;invitation:string|null}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [invite,setInvite]=useState<{projectName:string;email:string;role:keyof typeof roles;accountExists:boolean}|null>(null);
  useEffect(()=>{let live=true;if(invitation)api<typeof invite>(`/invitations/${invitation}`).then(value=>{if(live)setInvite(value);}).catch(err=>{if(live)setError(message(err));});return()=>{live=false;};},[invitation]);
  const setup=session.setupRequired&&!invitation,newInvite=Boolean(invite&&!invite.accountExists);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setBusy(true);const values=Object.fromEntries(new FormData(event.currentTarget));
    try{const result=await api<{user:User}>(newInvite?`/invitations/${invitation}`:setup?'/setup':'/login','POST',values);if(newInvite)window.history.replaceState({},'',window.location.pathname);onUser(result.user);}catch(err){setError(message(err));}finally{setBusy(false);}
  }
  return <div className="auth-layout"><div className="auth-story"><Brand/><div className="auth-copy"><span className="auth-kicker">EVALUADOR INMOBILIARIO</span><h1>Una visión completa.<br/>Mejores decisiones.</h1><p>El terreno, las alternativas y tu equipo.<br/>Todo en un mismo espacio de trabajo.</p><div className="auth-art" aria-hidden="true"><div className="building one"/><div className="building two"/><div className="building three"/><div className="ground"/></div></div><span className="auth-foot">MÉNTOR · Ingeniería e inversión</span></div><main className="auth-main"><div className="auth-card"><span className="pill"><Icon name="lock" size={14}/>Espacio privado de trabajo</span><h2>{setup?'Configura tu espacio':newInvite?'Únete al proyecto':'Bienvenido a Méntor'}</h2><p>{setup?'Crea la primera cuenta para comenzar.':invite?`Tienes una invitación a ${invite.projectName} como ${roles[invite.role].toLowerCase()}.`:'Ingresa para acceder a los proyectos de tu equipo.'}</p>{setup&&!session.setupAllowed?<ErrorBox text="El administrador debe habilitar la configuración inicial en el servidor."/>:<form onSubmit={submit}>
    {(setup||newInvite)&&<label>Nombre completo<input name="name" autoComplete="name" maxLength={100} required/></label>}
    <label>Correo electrónico<input name="email" type="email" autoComplete="username" required defaultValue={invite?.email} key={invite?.email||'email'} readOnly={Boolean(invite)} maxLength={254}/></label>
    <label>Contraseña<input name="password" type="password" autoComplete={setup||newInvite?'new-password':'current-password'} minLength={setup||newInvite?12:undefined} maxLength={128} required placeholder={setup||newInvite?'Al menos 12 caracteres':undefined}/></label>
    {setup&&session.setupTokenRequired&&<label>Clave de configuración<input name="setupToken" type="password" required autoComplete="off"/></label>}
    <ErrorBox text={error}/><Button type="submit" disabled={busy||Boolean(invitation&&!invite)}>{busy?'Conectando…':setup?'Crear cuenta y comenzar':newInvite?'Aceptar invitación':'Iniciar sesión'}<Icon name="arrow" size={18}/></Button>
    </form>}<div className="auth-note"><Icon name="users" size={17}/><span>El acceso a cada proyecto se concede por invitación.</span></div><p className="development-note">Primera entrega web · Proyectos y acceso. Los módulos de evaluación se incorporarán por fases.</p></div></main></div>;
}
