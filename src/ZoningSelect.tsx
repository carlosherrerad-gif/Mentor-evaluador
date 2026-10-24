import {useEffect,useId,useRef,useState} from 'react';

// Catálogo de nombres, no de parámetros ni de aplicabilidad por distrito.
// Fuentes: IMP/MINAM (capa de zonificación metropolitana) y nomenclatura MVCS.
export const zoningOptions=[
  ['RDB','Residencial de densidad baja'],['RDM','Residencial de densidad media'],
  ['RDA','Residencial de densidad alta'],['RDMA','Residencial de densidad muy alta'],
  ['CV','Comercio vecinal'],['CZ','Comercio zonal'],['CM','Comercio metropolitano'],
  ['CE','Comercio especializado'],['VT','Vivienda taller'],['OU','Otros usos'],
  ['ZRE','Zona de reglamentación especial'],['ZRP','Zona de recreación pública'],
  ['E','Educación'],['H','Salud'],
];
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function ZoningSelect({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[custom,setCustom]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
  const known=zoningOptions.find(([code])=>normalize(code)===normalize(value)),options=zoningOptions.filter(option=>normalize(option.join(' ')).includes(normalize(search)));
  useEffect(()=>{function outside(e:PointerEvent){if(root.current&&!root.current.contains(e.target as Node))setOpen(false);}document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
  function choose(code:string){onChange(code);setCustom(false);setOpen(false);trigger.current?.focus();}
  return <div className="zoning-picker" ref={root} onKeyDown={e=>{
    if(open&&e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus();}
    if(open&&e.key==='Enter'&&(e.target as HTMLElement).getAttribute('aria-label')==='Buscar zonificación'){e.preventDefault();if(options[0])choose(options[0][0]);}
    if(open&&['ArrowDown','ArrowUp'].includes(e.key)){const list=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role=option]')||[]);if(!list.length)return;e.preventDefault();const current=list.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='ArrowDown'?(current+1)%list.length:current<0?list.length-1:(current-1+list.length)%list.length;list[next].focus();}
  }}><button ref={trigger} type="button" aria-label="Zonificación" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} className="zoning-trigger" onClick={()=>{setOpen(!open);setSearch('');}}><span>{known?`${known[0]} · ${known[1]}`:value||'Seleccionar zonificación'}</span><span aria-hidden="true">▾</span></button>{open&&<div className="zoning-menu"><input aria-label="Buscar zonificación" autoFocus value={search} placeholder="Código o descripción" onChange={e=>setSearch(e.target.value)}/><div id={id} role="listbox" aria-label="Opciones de zonificación"><button type="button" role="option" aria-selected={!value} onClick={()=>choose('')}>Sin definir</button>{options.map(([code,name])=><button key={code} type="button" role="option" aria-selected={known?.[0]===code} onClick={()=>choose(code)}><strong>{code}</strong><span>{name}</span></button>)}{!options.length&&<p>No se encontraron códigos del catálogo.</p>}<button type="button" role="option" aria-selected={custom||Boolean(value&&!known)} onClick={()=>{setCustom(true);setOpen(false);}}>Otra zonificación · escribir código</button></div></div>}{(custom||Boolean(value&&!known))&&<input className="zoning-custom" aria-label="Código de otra zonificación" placeholder="Código según tu documento" maxLength={500} value={value} onChange={e=>onChange(e.target.value)}/>}</div>;
}
