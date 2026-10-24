import {ZoningSelect} from './ZoningSelect';
import {urbanGroups,urbanFrom,type Urban} from '../shared/urban.mjs';
import {LocationSelect} from './LocationSelect';

export const urbanLabel=(key:string)=>urbanGroups.flatMap(g=>g.fields).find(f=>f[0]===key)?.[1]??key;
export function urbanValue(value:unknown):string{
  if(value===null||value===undefined||value==='')return 'Pendiente';
  return ({pending:'Pendiente de verificar',allowed:'Permitido según referencia registrada',notAllowed:'No permitido según referencia registrada',general:'Referencia general',plot:'Referencia de un predio',unspecified:'Sin definir',fixed:'Cantidad fija',perDwelling:'Por vivienda'} as Record<string,string>)[String(value)]??String(value);
}
export function UrbanFields({value,onChange,disabled=false,showRoof=true}:{value:Urban;onChange:(value:Urban)=>void;disabled?:boolean;showRoof?:boolean}){
  const set=(key:string,next:string|number|null)=>onChange({...value,[key]:next});
  function field([key,label,kind]:string[]){
    const v=value[key];const choices=kind==='scope'?[['unspecified','Sin definir'],['general','Referencia general'],['plot','Referencia de un predio']]:kind==='parkingMode'?[['pending','Pendiente de definir'],['fixed','Cantidad fija'],['perDwelling','Cantidad por vivienda']]:kind==='use'?[['pending','Pendiente de verificar'],['allowed','Permitido según referencia'],['notAllowed','No permitido según referencia']]:null;
    return <label key={key} className={kind==='long'?'urban-long':undefined}>{label}{key==='district'?<LocationSelect field="district" value={String(v??'')} onChange={next=>set(key,next)}/>:key==='zoning'?<ZoningSelect value={String(v??'')} onChange={next=>set(key,next)}/>:choices?<select value={String(v)} onChange={e=>set(key,e.target.value)}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:kind==='long'?<textarea value={String(v??'')} maxLength={2000} onChange={e=>set(key,e.target.value)}/>:<input type={['number','positive','integer','count','percent'].includes(kind)?'number':kind==='date'?'date':'text'} step={['integer','count'].includes(kind)?1:'any'} min={kind==='integer'?1:kind==='positive'?0.000001:0} max={kind==='percent'?100:1e9} maxLength={500} value={v??''} onChange={e=>set(key,['number','positive','integer','count','percent'].includes(kind)?e.target.value===''?null:Number(e.target.value):e.target.value)}/>}</label>;
  }
  const primary=['district','zoning','maxFloors','minFreeArea','parkingMode',...(value.parkingMode==='fixed'?['parkingFixed']:value.parkingMode==='perDwelling'?['parkingPerDwelling']:[])];
  const roof=urbanGroups.find(g=>g.id==='roof')!;
  const roofHasValues=roof.fields.some(([key,,kind])=>value[key]!==null&&value[key]!==''&&(kind!=='use'||value[key]!=='pending'));
  const displayRoof=showRoof||roofHasValues;
  function group(g:typeof roof){return <details key={g.id} className="panel urban-group"><summary>{g.title}</summary><div className="urban-grid">{g.fields.map(field)}</div>{g.id==='roof'&&<p className="form-intro urban-help">Sin porcentaje predeterminado. La base normativa puede diferir de la superficie física.</p>}{g.id==='source'&&<p className="form-intro urban-help">No se asigna vigencia automática. Los archivos se vincularán en Documentos.</p>}</details>;}
  const additional=urbanGroups.filter(g=>g.id!=='source'&&(!displayRoof||g.id!=='roof')).map(g=>({...g,fields:g.fields.filter(([key])=>!['district','zoning','maxFloors','minFreeArea','parkingMode','parkingFixed','parkingPerDwelling'].includes(key))})).filter(g=>g.fields.length);
  return <fieldset disabled={disabled} className="urban-fields"><section className="panel urban-essentials"><div className="panel-heading"><h2>Parámetros principales</h2></div><div className="urban-grid urban-main-grid">{primary.map(key=>field(urbanGroups.flatMap(g=>g.fields).find(f=>f[0]===key)!))}</div><p className="form-intro urban-help">El código identifica la zonificación; no rellena pisos, área libre ni estacionamientos. Usa los valores de tu referencia o aplica una plantilla.</p></section>{displayRoof&&group(roof)}{group({...urbanGroups.find(g=>g.id==='source')!,title:'Fuente y observaciones (opcional)'})}<details className="urban-additional"><summary>Datos adicionales (opcional)</summary><div className="urban-groups">{additional.map(group)}</div></details></fieldset>;
}

export {urbanFrom};
