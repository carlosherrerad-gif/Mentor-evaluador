import {useAutosave,SaveState} from './useAutosave';
import {UrbanFields,urbanFrom} from './UrbanFields';
import {UrbanLibrary} from './UrbanLibrary';
import {urbanFields,urbanWarnings,type Urban} from '../shared/urban.mjs';
import type {Project} from './api';

export function UrbanPanel({project,userId,onSaved,onDirty}:{project:Project;userId:string;onSaved:()=>Promise<void>;onDirty:(block:string,dirty:boolean)=>void}){
  const config=JSON.parse(project.urban_config_json||'{}'),admin=project.role==='admin';
  const state=useAutosave<Urban>(urbanFrom(config),project.revision,`/projects/${project.id}/urban`,(configuration,revision)=>({configuration,revision}),onSaved,d=>onDirty('urban',d),data=>({value:urbanFrom(JSON.parse(data.project.urban_config_json||'{}')),revision:data.project.revision}));
  const v=state.draft,today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Lima'}),warnings=urbanWarnings(v,project.district,today);
  const filled=urbanFields.filter(([key,,kind])=>v[key]!==null&&v[key]!==''&&(!['scope','parkingMode','use'].includes(kind)||!['pending','unspecified'].includes(String(v[key])))).length;
  return <div className="compact-terrain urban-panel"><div className="terrain-toolbar"><span>Parámetros compartidos del terreno · {admin?'Edición habilitada':'Solo un administrador puede editar'}</span>{admin&&<SaveState state={state}/>}</div><div className="urban-context"><span>{filled} campos registrados</span><span>Comprobación pendiente · Parte 5</span>{config.sourceTemplate?.name&&<span>Origen: {config.sourceTemplate.name}{config.locallyEdited?' · ajustado en este proyecto':''}</span>}</div><UrbanFields value={v} onChange={state.change} disabled={!admin}/><details className="urban-notes"><summary>Aplicabilidad y datos pendientes ({warnings.length})</summary>{warnings.map(w=><p key={w}>{w}</p>)}<p>Los límites registrados no equivalen a aprobación municipal. La falta de datos no se interpreta como cumplimiento.</p></details><p className="form-intro">Modificar parámetros conserva los resultados previos y deja las comprobaciones de los escenarios pendientes de actualización. No altera sus edificios ni adquisiciones.</p><p className="form-intro">Guarda los cambios pendientes antes de aplicar una plantilla.</p><details className="urban-template-section"><summary>Plantillas de parámetros · crear, editar o aplicar</summary><UrbanLibrary userId={userId} project={project} onApplied={onSaved} seed={v} canApply={state.status==='Guardado'} compact/></details></div>;
}
