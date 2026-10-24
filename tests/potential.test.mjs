import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {potentialSummary} from '../shared/potential.mjs';
import {buildingFrom} from '../shared/building.mjs';

const today='2026-10-24',land={area:500,front:15},urban={district:'Los Olivos',zoning:'RDM',source:'Referencia sintética de prueba',maxFloors:10,minFreeArea:35,parkingMode:'perDwelling',parkingPerDwelling:0.5};
function model(){const b={...buildingFrom({}),floors:12,unitsPerFloor:4,occupancy:65,efficiency:85,floorHeight:3,manualAreaReference:500};b.specials=[1,12].map(floor=>({floor,unitsPerFloor:2,floorHeight:null,constructedMode:'auto',saleMode:'manual',constructed:null,sale:240,efficiency:85}));b.extensions.basements=[1,2].map(()=>({mode:'auto',occupancy:80,area:null,height:2.5}));b.extensions.areaReference=500;b.extensions.parking={enabled:true,mode:'estimate',area:620,perSpace:30,commercial:18,manual:null};b.extensions.roof={enabled:true,baseArea:325,duplexBuilt:100,duplexSale:85,commonBuilt:20,servicesBuilt:10,terraces:100,height:3,useStatus:'pending',source:''};b.extensions.duplex={enabled:true,connection:'roof',count:2,built:null,sale:null};return b;}
const summary=(b=model(),area=land)=>potentialSummary({configuration:{buildingBase:b},land:area,urban,district:'Los Olivos',today});

test('potencial consolida 44 viviendas y áreas sin incorporar hipótesis ni duplicar niveles superiores',()=>{
  const r=summary();assert.deepEqual(r.metrics,{units:44,constructed:4830,sale:3242.5,parking:20,commercial:18,hypothesis:85});assert.equal(r.extra.duplexCount,2);assert.equal(r.extra.flats,42);assert.equal(r.groups[2].units,0);assert.equal(r.groups[1].units,0);assert.equal(r.groups[2].sale,0);assert.equal(r.groups[2].hypothesis,85);assert.equal(r.groups[0].saleOrigin,'Mixto');assert.equal(r.checks.primary.excesses,2);
});
test('azotea con sustento registrado se clasifica sin modificar el número de viviendas',()=>{
  const b=model();b.extensions.roof.useStatus='supported';b.extensions.roof.source='Documento ficticio del analista';const r=summary(b);assert.equal(r.metrics.units,44);assert.equal(r.metrics.sale,3327.5);assert.equal(r.metrics.hypothesis,0);assert.equal(r.groups[2].sale,85);
});
test('datos ausentes no se publican como cero ni totales parciales',()=>{
  const empty=potentialSummary({today});assert.equal(empty.hasLevels,false);for(const value of Object.values(empty.metrics))assert.equal(value,null);assert.ok(empty.pending.length);
  const b=model();b.extensions.basements[0].occupancy=null;let r=summary(b);assert.equal(r.metrics.constructed,null);assert.equal(r.groups[0].constructed,3900);assert.equal(r.groups[1].constructed,null);assert.ok(r.pending.some(item=>item.includes('sótanos')));
  b.extensions.roof.servicesBuilt=null;r=summary(b);assert.equal(r.metrics.constructed,null);assert.equal(r.groups[2].constructed,null);assert.equal(r.metrics.units,44);
});
test('superficies manuales se conservan al cambiar terreno y quedan señaladas para revisión',()=>{
  const b=model();let r=summary(b,{area:600,front:15});assert.equal(r.groups[0].constructed,4680);assert.equal(r.groups[1].constructed,960);assert.equal(r.groups[2].constructed,130);assert.equal(r.metrics.constructed,5770);assert.ok(r.pending.some(item=>item.includes('manuales')));assert.equal(r.base.manualReview,true);
});
test('cero departamentos es explícito y un resumen no escribe en el escenario ni en sus parámetros',()=>{
  const b={...buildingFrom({}),floors:1,unitsPerFloor:0,occupancy:65,efficiency:85,floorHeight:3};const input={configuration:{buildingBase:b},land,urban,district:'Los Olivos',today};const before=JSON.stringify(input),r=potentialSummary(input);assert.equal(r.metrics.units,0);assert.equal(r.metrics.sale,0);assert.equal(r.metrics.constructed,325);assert.equal(JSON.stringify(input),before);assert.equal(r.metrics.parking,0);
});
test('casos equivalentes mantienen paridad física con la función calcular del HTML original',()=>{
  const html=readFileSync(new URL('../../calculadora-potencial-terreno-v20.html',import.meta.url),'utf8');
  const start=html.indexOf('function calcular(d)'),end=html.indexOf('/* ================= PRESENTACIÓN',start);assert.ok(start>0&&end>start);const source=html.slice(start,end);
  for(const d of [{area:500,libre:35,pisos:12,deptosPiso:4,sotanos:2},{area:735.5,libre:32.4,pisos:7,deptosPiso:3,sotanos:1},{area:240,libre:40,pisos:4,deptosPiso:2,sotanos:0}]){
    const assumptions={eficienciaPct:85,sotanoOcupacionPct:80,m2PorEstacionamiento:30,precioEstacionamiento:0,costoObraM2:1,especialidadesM2:0,licenciasPct:0,ventasMarketingPct:0,administracionPct:0,postventaPct:0,interesesPct:0};
    const original=runInNewContext(source+'\ncalcular(input)',{supuestosDe:()=>assumptions,input:{...d,zona:'prueba',precioVenta:1,precioTerreno:0,velocidad:1}},{timeout:1000});
    const b={...buildingFrom({}),floors:d.pisos,unitsPerFloor:d.deptosPiso,occupancy:100-d.libre,efficiency:85,floorHeight:3};b.extensions.basements=Array.from({length:d.sotanos},()=>({mode:'auto',occupancy:80,area:null,height:2.5}));b.extensions.parking={enabled:true,mode:'estimate',area:original.construidaSotanos,perSpace:30,commercial:0,manual:null};
    const r=potentialSummary({configuration:{buildingBase:b},land:{area:d.area},today});for(const [actual,expected] of [[r.metrics.constructed,original.construidaTotal],[r.groups[0].constructed,original.construidaSobreSuelo],[r.groups[1].constructed,original.construidaSotanos],[r.metrics.sale,original.vendibleTotal]])assert.ok(Math.abs(actual-expected)<1e-8);assert.equal(r.metrics.units,original.departamentos);assert.equal(r.metrics.parking,original.estacionamientos);
  }
});

