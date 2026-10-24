import {useEffect,useRef,useState} from 'react';
import {api,type Project,type Scenario} from './api';
import {Button,ErrorBox,message} from './ui';
export function useAutosave<T>(source:T,sourceRevision:number,path:string,payload:(value:T,revision:number)=>unknown,onSaved:()=>Promise<void>,onDirty:(dirty:boolean)=>void,read:(data:{project:Project;scenarios:Scenario[]})=>{value:T;revision:number}){
  const [draft,setDraft]=useState(source),[status,setStatus]=useState('Guardado'),[error,setError]=useState('');
  const latest=useRef(source),saved=useRef(JSON.stringify(source)),revision=useRef(sourceRevision),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),flight=useRef<Promise<void>|null>(null),blocked=useRef(false),mounted=useRef(true);
  const payloadRef=useRef(payload);payloadRef.current=payload;
  const callback=useRef(onSaved);callback.current=onSaved;const dirtyCallback=useRef(onDirty);dirtyCallback.current=onDirty;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;clearTimeout(timer.current);dirtyCallback.current(false);};},[]);
  useEffect(()=>{if(JSON.stringify(latest.current)===saved.current&&!flight.current){latest.current=source;saved.current=JSON.stringify(source);revision.current=sourceRevision;setDraft(source);}},[JSON.stringify(source),sourceRevision]);
  async function save(){
    clearTimeout(timer.current);if(flight.current){await flight.current;if(!blocked.current)await save();return;}
    const snapshot=latest.current,serialized=JSON.stringify(snapshot);if(serialized===saved.current||blocked.current)return;
    setStatus('Guardando…');setError('');
    const work=(async()=>{try{const result=await api<{project?:Project;scenario?:Scenario}>(path,'PATCH',payloadRef.current(snapshot,revision.current));revision.current=(result.scenario||result.project)!.revision;saved.current=serialized;if(mounted.current){const pending=JSON.stringify(latest.current)!==serialized;setStatus(pending?'Cambios pendientes':'Guardado');dirtyCallback.current(pending);}await callback.current().catch(()=>{});}catch(err){blocked.current=true;if(mounted.current){setError(message(err));setStatus('No guardado');}}})();
    flight.current=work;await work;flight.current=null;
    if(mounted.current&&!blocked.current&&JSON.stringify(latest.current)!==saved.current)timer.current=setTimeout(()=>{void save();},800);
  }
  function change(value:T){latest.current=value;setDraft(value);setStatus('Cambios pendientes');dirtyCallback.current(true);clearTimeout(timer.current);if(!blocked.current)timer.current=setTimeout(()=>{void save();},1000);}
  async function reload(){if(!window.confirm('Se reemplazarán los cambios pendientes de este bloque por la versión del servidor. ¿Continuar?'))return;clearTimeout(timer.current);try{const data=await api<{project:Project;scenarios:Scenario[]}>(path.split('/').slice(0,3).join('/'));const current=read(data);latest.current=current.value;saved.current=JSON.stringify(current.value);revision.current=current.revision;setDraft(current.value);blocked.current=false;setError('');setStatus('Guardado');dirtyCallback.current(false);await callback.current().catch(()=>{});}catch(err){setError(message(err));}}
  function retry(){blocked.current=false;void save();}
  return {draft,change,status,error,save,reload,retry};
}
export function SaveState({state}:{state:{status:string;error:string;save:()=>Promise<void>;reload:()=>void;retry:()=>void}}){return <div className="land-save"><span role="status">{state.status}</span><Button secondary onClick={()=>{void state.save();}} disabled={state.status==='Guardando…'}>Guardar ahora</Button><ErrorBox text={state.error}/>{state.error&&<><p>Tus cambios siguen aquí. Puedes copiarlos antes de cargar la versión del servidor.</p><Button secondary onClick={state.retry}>Reintentar guardado</Button><Button secondary onClick={state.reload}>Cargar versión del servidor</Button></>}</div>;}
