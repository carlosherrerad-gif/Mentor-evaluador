import {UrbanCheckPanel} from './UrbanCheckPanel';
import {useAutosave,SaveState} from './useAutosave';
import {UrbanFields,urbanFrom} from './UrbanFields';
import {UrbanLibrary} from './UrbanLibrary';
import {urbanWarnings,type Urban} from '../shared/urban.mjs';
import type {Project,Scenario} from './api';

export function UrbanPanel({project,userId,onSaved,onDirty,scenarios=[],active=''}:{project:Project;scenarios?:Scenario[];active?:string;userId:string;onSaved:()=>Promise<void>;onDirty:(block:string,dirty:boolean)=>void}){
  const config=JSON.parse(project.urban_config_json||'{}'),admin=project.role==='admin';
  const state=useAutosave<Urban>(urbanFrom(config),project.revision,`/projects/${project.id}/urban`,(configuration,revision)=>({configuration,revision}),onSaved,d=>onDirty('urban',d),data=>({value:urbanFrom(JSON.parse(data.project.urban_config_json||'{}')),revision:data.project.revision}));
  const v=state.draft,today=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Lima'}),warnings=urbanWarnings(v,project.district,today);
  const hasRoof=scenarios.some(s=>!s.deleted_at&&JSON.parse(s.configuration_json||'{}').buildingBase?.extensions?.roof?.enabled);

  return <div className="compact-terrain urban-panel"><div className="terrain-toolbar"><span>Parámetros compartidos del terreno · {admin?'Edición habilitada':'Solo un administrador puede editar'}</span>{admin&&<SaveState state={state}/>}</div><div className="urban-context"><span>Datos adicionales opcionales</span><span>Comprobación por escenario disponible</span>{config.sourceTemplate?.name&&<span>Origen: {config.sourceTemplate.name}{config.locallyEdited?' · ajustado en este proyecto':''}</span>}</div><UrbanFields showRoof={hasRoof} value={v} onChange={state.change} disabled={!admin}><UrbanCheckPanel project={project} scenario={scenarios.find(s=>s.id===active)} urban={v} unsaved={state.status!=='Guardado'}/></UrbanFields><details className="urban-notes"><summary>Aplicabilidad y datos pendientes ({warnings.length})</summary>{warnings.map(w=><p key={w}>{w}</p>)}<p>Los límites registrados no equivalen a aprobación municipal. La falta de datos no se interpreta como cumplimiento.</p></details><p className="form-intro">Los controles se actualizan con los parámetros y la propuesta. Se conservan los resultados económicos anteriores, los edificios y las adquisiciones.</p><p className="form-intro">Guarda los cambios pendientes antes de aplicar una plantilla.</p><details className="urban-template-section"><summary>Plantillas de parámetros · crear, editar o aplicar</summary><UrbanLibrary userId={userId} project={project} onApplied={onSaved} seed={v} canApply={state.status==='Guardado'} compact/></details></div>;
}
