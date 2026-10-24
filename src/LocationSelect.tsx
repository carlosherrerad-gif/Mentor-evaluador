// Provincia de Lima: 43 distritos. INEI, Perú en Cifras.
export const limaDistricts=[
  'Ancón','Ate','Barranco','Breña','Carabayllo','Chaclacayo','Chorrillos','Cieneguilla','Comas','El Agustino',
  'Independencia','Jesús María','La Molina','La Victoria','Lima','Lince','Los Olivos','Lurigancho','Lurín',
  'Magdalena del Mar','Miraflores','Pachacámac','Pucusana','Pueblo Libre','Puente Piedra','Punta Hermosa',
  'Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores',
  'San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa',
  'Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo',
];
export function LocationSelect({field,value,onChange}:{field:'region'|'province'|'district';value:string;onChange:(value:string)=>void}){
  const options=field==='district'?limaDistricts:['Lima'];
  const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const matching=options.find(option=>normalize(option)===normalize(value));
  // Conserva valores anteriores fuera del catálogo hasta que el usuario los cambie.
  return <select value={matching||value} onChange={e=>onChange(e.target.value)}><option value="">Seleccionar {field==='region'?'departamento':field==='province'?'provincia':'distrito'}</option>{value&&!matching&&<option value={value} disabled>{value} · guardado anteriormente</option>}{options.map(option=><option key={option} value={option}>{option==='Lima'&&field==='district'?'Lima (Cercado de Lima)':option==='Lurigancho'?'Lurigancho (Chosica)':option}</option>)}</select>;
}
