// Reglas gráficas exclusivamente: no escribe ni recalcula superficies del proyecto.
export function facadeModules(width,units=null){
  const suggested=width<10?1:width<16?2:width<22?3:width<28?4:4+Math.floor((width-22)/6);
  return units===null?suggested:Math.max(0,Math.min(suggested,units));
}
export function volumeGeometry(land={}){
  const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
  if(!positive(land.front))return null;
  const depth=positive(land.depth)?land.depth:positive(land.area)?land.area/land.front:null;
  if(!depth)return null;
  const corner=land.corner==='yes';
  return {width:land.front,depth,corner,derivedDepth:!positive(land.depth),setbackFront:depth*.1,setbackSide:corner?land.front*.1:0,buildingWidth:land.front*(corner?.9:1),buildingDepth:depth*.9};
}
