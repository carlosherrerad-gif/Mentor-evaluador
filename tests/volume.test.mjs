import test from 'node:test';
import assert from 'node:assert/strict';
import {facadeModules,volumeGeometry} from '../shared/volume.mjs';
test('rangos de fachada sin huecos ni solapamientos y limitados por viviendas registradas',()=>{
  for(const [width,n] of [[5,1],[8,1],[9.99,1],[10,2],[15.99,2],[16,3],[21.99,3],[22,4],[27.99,4],[28,5],[34,6]])assert.equal(facadeModules(width),n);
  assert.equal(facadeModules(15,1),1);assert.equal(facadeModules(20,0),0);assert.equal(facadeModules(20,2),2);
});
test('retiros gráficos proporcionales en uno o dos frentes sin mutar terreno',()=>{
  const land={front:15,depth:30,area:500,corner:'no'},before=JSON.stringify(land),single=volumeGeometry(land),corner=volumeGeometry({...land,corner:'yes'});
  assert.equal(single.setbackFront,3);assert.equal(single.setbackSide,0);assert.equal(single.buildingWidth,15);assert.equal(corner.setbackSide,1.5);assert.equal(corner.buildingWidth,13.5);assert.equal(corner.buildingDepth,27);assert.equal(JSON.stringify(land),before);
});
test('dimensiones ausentes no inventan un lote y fondo derivado se identifica',()=>{
  assert.equal(volumeGeometry({area:500}),null);assert.equal(volumeGeometry({front:15}),null);assert.equal(volumeGeometry({front:Infinity,depth:20}),null);
  const derived=volumeGeometry({front:10,area:300});assert.equal(derived.depth,30);assert.equal(derived.derivedDepth,true);assert.equal(volumeGeometry({front:10,depth:25,area:300}).derivedDepth,false);
});
