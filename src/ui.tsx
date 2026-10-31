import {useEffect,useRef,type ReactNode} from 'react';
import {Icon} from './Icon';
export const roles={admin:'Administrador',editor:'Editor',reader:'Lector'};
export const statuses={draft:'Borrador',active:'En evaluación',archived:'Archivado'};
export const date=(value:string)=>new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Lima'}).format(new Date(value));
export const message=(error:unknown)=>error instanceof Error?error.message:'No se pudo completar la operación.';
export function Brand(){return <div className="brand" aria-label="Méntor · Inmobiliaria y BIM"><svg className="brand-official-symbol" viewBox="400 190 445 610" role="img" aria-label="Logo oficial de Méntor"><image href="/brand/mentor-oficial.jpg" width="1254" height="1254"/></svg><div>MÉNTOR<small>Inmobiliaria y BIM</small></div></div>;}
export function Button({children,onClick,secondary=false,disabled=false,type='button'}:{children:ReactNode;onClick?:()=>void;secondary?:boolean;disabled?:boolean;type?:'button'|'submit'}){return <button className={secondary?'button secondary':'button'} type={type} onClick={onClick} disabled={disabled}>{children}</button>;}
export function ErrorBox({text}:{text:string}){return text?<div className="error" role="alert">{text}</div>:null;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return <dialog ref={ref} onCancel={event=>{event.preventDefault();onClose();}} aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close"/></button></div>{children}</dialog>;
}
export function Status({value}:{value:keyof typeof statuses}){return <span className={`status ${value}`}><span/>{statuses[value]}</span>;}
export function Metric({icon,label,value,note}:{icon:string;label:string;value:string|number;note?:string}){return <div className="metric"><div className="metric-heading"><span>{label}</span><Icon name={icon} size={18}/></div><strong>{value}</strong>{note&&<small>{note}</small>}</div>;}
export function Empty({icon,title,text,action}:{icon:string;title:string;text:string;action?:ReactNode}){return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={30}/></div><h2>{title}</h2><p>{text}</p>{action}</div>;}
