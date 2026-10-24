import {urbanGroups,urbanFrom,type Urban} from '../shared/urban.mjs';
import {LocationSelect} from './LocationSelect';

export const urbanLabel=(key:string)=>urbanGroups.flatMap(g=>g.fields).find(f=>f[0]===key)?.[1]??key;
export function urbanValue(value:unknown):string{
  if(value===null||value===undefined||value==='')return 'Pendiente';
  return ({pending:'Pendiente de verificar',allowed:'Permitido según referencia registrada',notAllowed:'No permitido según referencia registrada',general:'Referencia general',plot:'Referencia de un predio',unspecified:'Sin definir',fixed:'Cantidad fija',perDwelling:'Por vivienda'} as Record<string,string>)[String(value)]??String(value);
}
export function UrbanFields({value,onChange,disabled=false}:{value:Urban;onChange:(value:Urban)=>void;disabled?:boolean}){
  const set=(key:string,next:string|number|null)=>onChange({...value,[key]:next});
  return <fieldset disabled={disabled} className="urban-fields"><div className="urban-groups">{urbanGroups.map((group,index)=><details key={group.id} className="panel urban-group" open={index<2}><summary>{group.title}</summary><div className="urban-grid">{group.fields.map(([key,label,kind])=>{
    const v=value[key];const choices=kind==='scope'?[['unspecified','Sin definir'],['general','Referencia general'],['plot','Referencia de un predio']]:kind==='parkingMode'?[['pending','Pendiente de definir'],['fixed','Cantidad fija'],['perDwelling','Cantidad por vivienda']]:kind==='use'?[['pending','Pendiente de verificar'],['allowed','Permitido según referencia'],['notAllowed','No permitido según referencia']]:null;
    const inactive=key==='parkingFixed'&&value.parkingMode!=='fixed'||key==='parkingPerDwelling'&&value.parkingMode!=='perDwelling';
    return <label key={key} className={kind==='long'?'urban-long':undefined}>{label}{key==='district'?<LocationSelect field="district" value={String(v??'')} onChange={next=>set(key,next)}/>:choices?<select value={String(v)} onChange={e=>set(key,e.target.value)}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:kind==='long'?<textarea value={String(v??'')} maxLength={2000} onChange={e=>set(key,e.target.value)}/>:<input disabled={inactive} type={['number','positive','integer','count','percent'].includes(kind)?'number':kind==='date'?'date':'text'} step={['integer','count'].includes(kind)?1:'any'} min={kind==='integer'?1:kind==='positive'?0.000001:0} max={kind==='percent'?100:1e9} maxLength={500} value={v??''} onChange={e=>set(key,['number','positive','integer','count','percent'].includes(kind)?e.target.value===''?null:Number(e.target.value):e.target.value)}/>}</label>;
  })}</div>{group.id==='parking'&&<p className="form-intro urban-help">Se conserva la regla registrada. Visitas y excepciones deben explicarse; la comparación se incorporará en la Parte 5.</p>}{group.id==='roof'&&<p className="form-intro urban-help">La base normativa puede diferir de la base física de la azotea. No se presupone un 50 % de techado permitido.</p>}{group.id==='source'&&<p className="form-intro urban-help">Fechas y vencimiento registrados por el analista; no se asigna una vigencia automática. Los archivos se vincularán al implementar Documentos.</p>}</details>)}</div></fieldset>;
}
export {urbanFrom};
