import {useId,useRef,useState} from 'react';
import type {Potential} from '../shared/potential.mjs';
import {facadeModules,volumeGeometry} from '../shared/volume.mjs';
import './volume.css';

type V=[number,number,number];
type Face={p:V[];color:string;level:string;opacity?:number;line?:string;overlay:boolean};
const shade=(hex:string,factor:number)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*factor).toString(16).padStart(2,'0')).join('');
const number=(v:number|null)=>v===null?'Pendiente':new Intl.NumberFormat('es-PE',{maximumFractionDigits:2}).format(v);
export function BuildingVolume({data,land}:{data:Potential;land:Record<string,unknown>}){
  const [angle,setAngle]=useState(land.corner==='yes'?-20:20),[tilt,setTilt]=useState(24),[zoom,setZoom]=useState(1),[analysis,setAnalysis]=useState(false),[basements,setBasements]=useState(false),[roof,setRoof]=useState(true),[selection,setSelection]=useState(''),[modules,setModules]=useState(0);
  const drag=useRef<{x:number;a:number;moved:boolean}|null>(null),suppress=useRef(false),uid=useId().replace(/:/g,'');
  const g=volumeGeometry(land);
  if(!g||!data.hasLevels)return <section className="panel bv-missing"><h2>Edificio conceptual 3D</h2><p>Para dibujar el edificio, registra el frente del terreno, su fondo referencial o área, y los pisos del escenario.</p></section>;
  const {width:w,depth:d,buildingWidth:bw,buildingDepth:bd}=g,x=g.setbackSide,y=g.setbackFront;
  const faces:Face[]=[],labels:{p:V[];text:string}[]=[],levels:{id:string;name:string;built:number|null;sale:number|null;units:number|null;note:string}[]=[];
  let decorating=false;
  const face=(p:V[],color:string,level='',opacity=1,line='')=>faces.push({p,color,level,opacity,line,overlay:decorating});
  function box(a:number,b:number,z:number,width:number,depth:number,height:number,color:string,level='',opacity=1,top=true){
    const x2=a+width,y2=b+depth,z2=z+height;
    if(Math.cos(angle*Math.PI/180)>0)face([[a,b,z],[x2,b,z],[x2,b,z2],[a,b,z2]],color,level,opacity);
    if(Math.sin(angle*Math.PI/180)<0)face([[a,b,z],[a,y2,z],[a,y2,z2],[a,b,z2]],shade(color,.88),level,opacity);
    if(Math.sin(angle*Math.PI/180)>0)face([[x2,b,z],[x2,y2,z],[x2,y2,z2],[x2,b,z2]],shade(color,.86),level,opacity);
    if(Math.cos(angle*Math.PI/180)<0)face([[a,y2,z],[x2,y2,z],[x2,y2,z2],[a,y2,z2]],shade(color,.9),level,opacity);
    if(top)face([[a,b,z2],[x2,b,z2],[x2,y2,z2],[a,y2,z2]],color,level,opacity);
  }
  // Parcela y espacio urbano ilustrativos. El retiro solo afecta al dibujo.
  box(-2,-4,-.32,w+4,d+6,.18,'#d7ded9');
  box(-2,-4,-.13,w+4,3,.05,'#aebbb6');
  if(g.corner)box(-4,-4,-.3,3,d+6,.1,'#aebbb6');
  box(0,0,-.16,w,d,.16,'#e1e9df');
  box(x+bw*.35,0,.015,bw*.3,y,.03,'#c6c9bd');
  let bottom=0;
  for(const r of data.extra.basementRows){const h=r.height??2.5;bottom-=h;levels.push({id:`b${r.level}`,name:`Sótano ${r.level}`,built:r.area,sale:0,units:0,note:r.height===null?'Altura gráfica referencial: 2.5 m':'Altura registrada'});if(basements)box(x,y,bottom,bw,bd,h*.96,'#83a9b0',`b${r.level}`,.62);}
  let z=0;
  const green='#398573',special='#bb9369';
  const maximumModules=Math.max(1,...data.base.rows.map(r=>facadeModules(bw,r.units)));
  function facade(side:boolean,start:number,height:number,n:number,id:string,ground:boolean){
    decorating=true;
    const length=side?bd:bw;
    const p=(u:number,v:number,out=0):V=>side?[x-out,y+u,v]:[x+u,y-out,v];
    if(ground&&!side){
      face([p(length*.4,start+.12,.035),p(length*.6,start+.12,.035),p(length*.6,start+height*.82,.035),p(length*.4,start+height*.82,.035)],'#354d49',id);
      face([p(length*.12,start+.12,.035),p(length*.34,start+.12,.035),p(length*.34,start+height*.65,.035),p(length*.12,start+height*.65,.035)],'#7d8981',id);
      // Firma de marca sobre un paño, sin cambiar el volumen ni abrir vanos.
      labels.push({p:[p(length*.66,start+height*.52,.07),p(length*.91,start+height*.52,.07),p(length*.91,start+height*.73,.07),p(length*.66,start+height*.73,.07)],text:'M MÉNTOR'});
      decorating=false;return;
    }
    for(let i=0;i<n;i++){
      const span=length/n,u=span*i+span*.12,balcony=span*.44,window=span*.18;
      const windowQuad=(a:number,len:number,lo:number,hi:number,out=.025)=>[p(a,start+lo,out),p(a+len,start+lo,out),p(a+len,start+hi,out),p(a,start+hi,out)];
      face(windowQuad(u,balcony,height*.16,height*.83),'#385b60',id);
      face(windowQuad(u+balcony+span*.1,window,height*.36,height*.81),'#64868a',id);
      face(windowQuad(u+balcony+span*.1,window*.22,height*.36,height*.81,.03),'#c1cfc6',id);
      if(side)box(x-.48,y+u,start+.12,.48,balcony,.1,'#c7c7b8',id);else box(x+u,y-.48,start+.12,balcony,.48,.1,'#c7c7b8',id);
      face(windowQuad(u,balcony,.25,height*.4,.48),'#a8c7c0',id,.72,'#748c86');
      face([p(u,start+height*.4,.48),p(u+balcony,start+height*.4,.48),p(u+balcony,start+height*.43,.48),p(u,start+height*.43,.48)],'#536b62',id);
    }
    decorating=false;
  }
  for(const r of data.base.rows){
    const h=r.height??3,id=`p${r.floor}`;
    levels.push({id,name:`Piso ${r.floor}${r.special?' · especial':''}`,built:r.constructed,sale:r.sale,units:r.units,note:r.height===null?'Altura gráfica referencial: 3 m':r.special?'Piso especial: reemplaza la planta típica':'Planta típica'});
    const color=analysis?(r.special?special:green):(r.floor===1?'#a5aa99':r.special?'#d2d0bb':'#e8e4d5');
    box(x,y,z,bw,bd,h*.97,color,id,1,false);
    box(x,y,z+h*.94,bw,bd,h*.06,analysis?'#edf1e7':'#c5c6b8',id,1,r.floor===data.base.rows.length);
    if(!analysis){
      const n=modules?Math.min(modules,r.units??modules):facadeModules(bw,r.units);
      if(Math.cos(angle*Math.PI/180)>0)facade(false,z,h,n,id,r.floor===1);
      if(g.corner&&Math.sin(angle*Math.PI/180)<0)facade(true,z,h,facadeModules(bd,r.units),id,false);
    }
    z+=h;
  }
  const roofHeight=data.model.extensions.roof.height??2.8;
  if(data.model.extensions.roof.enabled){
    levels.push({id:'roof',name:'Azotea',built:data.extra.roofBuilt,sale:data.extra.supportedSale,units:0,note:`Venta hipotética separada: ${number(data.extra.hypotheticalSale)} m². El nivel superior de dúplex no añade viviendas.`});
    if(roof){
      box(x,y,z,bw,bd,.1,'#e4e1d1','roof');
      const ratio=Math.sqrt(Math.min(.8,Math.max(.08,(data.extra.roofBuilt??bw*bd*.2)/(bw*bd))));
      box(x+bw*(1-ratio),y+bd*(1-ratio),z+.1,bw*ratio,bd*ratio,roofHeight,analysis?'#b28a68':'#b9b9a5','roof');
      box(x,y,z+.1,bw,.12,.7,'#bacbc0','roof');
      box(x,y,z+.1,.12,bd,.7,'#bacbc0','roof');
    }
  }
  // Jardineras discretas en el retiro frontal.
  for(const t of [.08,.85]){box(w*t,y*.3,.03,Math.min(1.1,w*.08),Math.min(.8,y*.35),.35,'#c4c0ac');box(w*t,y*.3,.38,Math.min(1.1,w*.08),Math.min(.8,y*.35),.48,'#719d7a');}
  const a=angle*Math.PI/180,e=tilt*Math.PI/180,total=z+(roof&&data.model.extensions.roof.enabled?roofHeight:0),lowest=basements?bottom:0;
  const rotate=([px,py,pz]:V)=>{const dx=px-w/2,dy=py-d/2;return {x:dx*Math.cos(a)+dy*Math.sin(a),depth:-dx*Math.sin(a)+dy*Math.cos(a),z:pz};};
  const projected=(p:V)=>{const r=rotate(p);return {x:r.x,y:-r.depth*Math.sin(e)-r.z*Math.cos(e),depth:r.depth*Math.cos(e)-r.z*Math.sin(e)};};
  const bounds:V[]=[];for(const px of [-4,w+2])for(const py of [-4,d+2])for(const pz of [lowest,total])bounds.push([px,py,pz]);
  const projectedBounds=bounds.map(projected),minX=Math.min(...projectedBounds.map(p=>p.x)),maxX=Math.max(...projectedBounds.map(p=>p.x)),minY=Math.min(...projectedBounds.map(p=>p.y)),maxY=Math.max(...projectedBounds.map(p=>p.y));
  const scale=Math.min(680/(maxX-minX),400/(maxY-minY))*zoom;
  const screen=(p:V)=>{const q=projected(p);return {x:420+(q.x-(minX+maxX)/2)*scale,y:250+(q.y-(minY+maxY)/2)*scale};};
  const points=(p:V[])=>p.map(v=>{const q=screen(v);return `${q.x},${q.y}`;}).join(' ');
  const sorted=faces.map((f,i)=>({...f,i,depth:f.p.reduce((s,p)=>s+projected(p).depth,0)/f.p.length})).sort((a,b)=>Number(a.overlay)-Number(b.overlay)||b.depth-a.depth||a.i-b.i);
  const selected=levels.find(l=>l.id===selection),missingHeights=data.base.rows.some(r=>r.height===null)||data.extra.basementRows.some(r=>r.height===null)||(data.model.extensions.roof.enabled&&data.model.extensions.roof.height===null);
  function reset(){setAngle(g?.corner?-20:20);setTilt(24);setZoom(1);}
  return <section className="panel building-volume" aria-label="Edificio conceptual 3D"><div className="panel-heading"><div><h2>Edificio conceptual 3D</h2><p>Fachada tentativa · retiro proporcional · {g.corner?'esquina':'un frente a calle'}</p></div><div className="bv-modes"><button className={!analysis?'active':''} aria-pressed={!analysis} onClick={()=>setAnalysis(false)}>Arquitectónica</button><button className={analysis?'active':''} aria-pressed={analysis} onClick={()=>setAnalysis(true)}>Análisis</button></div></div>
    <div className="bv-layout"><div className="bv-stage"><span className="bv-stamp">MÉNTOR / ESTUDIO CONCEPTUAL</span><svg viewBox="0 0 840 500" role="img" aria-label={`Modelo 3D de ${data.base.rows.length} pisos. Usa los controles para girar y el selector para consultar niveles.`} onPointerDown={ev=>{if(ev.button!==0)return;suppress.current=false;drag.current={x:ev.clientX,a:angle,moved:false};ev.currentTarget.setPointerCapture(ev.pointerId);}} onPointerMove={ev=>{if(!drag.current)return;const dx=ev.clientX-drag.current.x;if(Math.abs(dx)>4)drag.current.moved=true;setAngle(drag.current.a+dx*.45);}} onPointerUp={()=>{suppress.current=!!drag.current?.moved;drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <defs><radialGradient id={`${uid}bg`}><stop stopColor="#fff"/><stop offset="1" stopColor="#e7eee8"/></radialGradient><filter id={`${uid}shadow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter></defs><rect width="840" height="500" fill={`url(#${uid}bg)`}/><ellipse cx="455" cy="429" rx="155" ry="22" fill="#496555" opacity=".12" filter={`url(#${uid}shadow)`}/>
      {sorted.map(f=><polygon key={f.i} points={points(f.p)} fill={f.color} fillOpacity={f.opacity} stroke={f.level&&f.level===selection?'#e9ac47':f.line||'#62786a'} strokeOpacity={f.level&&f.level===selection?1:.16} strokeWidth={f.level&&f.level===selection?1.7:.5} style={{cursor:f.level?'pointer':undefined}} onClick={()=>{if(!suppress.current&&f.level)setSelection(f.level);}}><title>{levels.find(l=>l.id===f.level)?.name||'Entorno conceptual'}</title></polygon>)}
      {!analysis&&labels.map((label,i)=>{const q=label.p.map(screen),u={x:q[1].x-q[0].x,y:q[1].y-q[0].y},v={x:q[3].x-q[0].x,y:q[3].y-q[0].y};const visible=Math.cos(a)>0;return visible?<g key={i} transform={`matrix(${u.x/100} ${u.y/100} ${-v.x/22} ${-v.y/22} ${q[3].x} ${q[3].y})`} pointerEvents="none"><rect width="100" height="22" rx="2" fill="#27644f"/><text x="50" y="15" textAnchor="middle" fill="#fff" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="bold">{label.text}</text></g>:null;})}
    </svg><div className="bv-hint">Arrastra para girar · selecciona un nivel</div><div className="bv-orbit"><button aria-label="Girar a la izquierda" onClick={()=>setAngle(angle-20)}>↶</button><button aria-label="Alejar edificio" disabled={zoom<=.6} onClick={()=>setZoom(Math.max(.6,zoom-.15))}>−</button><button onClick={reset}>Restablecer vista</button><button aria-label="Acercar edificio" disabled={zoom>=2} onClick={()=>setZoom(Math.min(2,zoom+.15))}>+</button><button aria-label="Girar a la derecha" onClick={()=>setAngle(angle+20)}>↷</button></div></div>
    <aside className="bv-controls"><label>Nivel seleccionado<select value={selection} onChange={ev=>setSelection(ev.target.value)}><option value="">Vista general</option>{[...levels].reverse().map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>{selected?<div className="bv-selection" role="status"><strong>{selected.name}</strong><dl><dt>Construida</dt><dd>{number(selected.built)} m²</dd><dt>Vendible sin hipótesis</dt><dd>{number(selected.sale)} m²</dd><dt>Viviendas del nivel</dt><dd>{number(selected.units)}</dd></dl><small>{selected.note}</small></div>:<div className="bv-selection"><strong>{data.base.rows.length} pisos · {number(data.metrics.units)} viviendas</strong><p>Selecciona un nivel para consultar los datos guardados.</p></div>}
      <label>Giro<input aria-label="Giro del edificio" type="range" min="-180" max="180" value={((angle+180)%360+360)%360-180} onChange={ev=>setAngle(+ev.target.value)}/></label><label>Inclinación<input aria-label="Inclinación del edificio" type="range" min="10" max="65" value={tilt} onChange={ev=>setTilt(+ev.target.value)}/></label>
      <label className="bv-check"><input type="checkbox" checked={basements} onChange={ev=>setBasements(ev.target.checked)}/>Mostrar sótanos</label><label className="bv-check"><input type="checkbox" checked={roof} disabled={!data.model.extensions.roof.enabled} onChange={ev=>setRoof(ev.target.checked)}/>Mostrar azotea</label>
      <details><summary>Composición y supuestos visuales</summary><label>Módulos del frente principal<select value={modules} onChange={ev=>setModules(+ev.target.value)}><option value="0">Automáticos · según ancho</option>{Array.from({length:Math.max(6,maximumModules)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label><p>Ventanas y balcones ilustrativos. El frente lateral de esquina usa el fondo referencial; una vivienda puede aparecer en ambos lados.</p><p>Retiro gráfico del 10 % perpendicular a cada calle. No modifica las áreas registradas.</p><p>Parcela rectangular referencial: {number(w)} × {number(d)} m{g.derivedDepth?' · fondo derivado de área/frente':''}. {missingHeights?'Alturas faltantes: pisos 3 m, sótanos 2.5 m y azotea 2.8 m, solo en el dibujo.':''}</p><p>Los patios de luz, la distribución interior y la topografía no están modelados. Las áreas manuales y de azotea no definen su geometría real.</p></details>
    </aside></div><div className="bv-caption"><span><i className="bv-dot"/>Modelo conceptual · sin validación geométrica o municipal</span><span>{analysis?'Verde: típico · arena: especial · azul: sótanos':'Fachada automática · firma Méntor junto al acceso'}</span></div></section>;
}
