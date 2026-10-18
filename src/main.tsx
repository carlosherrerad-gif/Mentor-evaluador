import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const modules = [
  ['Mis proyectos', 'Tus terrenos y alternativas de desarrollo', 'Aquí podrás crear proyectos, conservar su expediente y gestionar escenarios independientes.'],
  ['Datos del proyecto', 'La información que sostiene tu evaluación', 'Terreno, edificio, parámetros urbanísticos y documentos locales.'],
  ['Potencial inmobiliario', 'Comprende lo que puedes desarrollar', 'Áreas, unidades, estacionamientos y volumetría conceptual por niveles.'],
  ['Evaluación económica', 'Evalúa ingresos, costos y rentabilidad', 'Cada escenario conservará sus propios precios, tarifas y gastos.'],
  ['Escenarios comparativos', 'Explora alternativas del mismo terreno', 'Compara hasta cuatro escenarios con resultados vigentes y diferencias de supuestos visibles.'],
  ['Informes', 'Convierte tu evaluación en un documento', 'Informes ejecutivo y completo, generados localmente y conservados por emisión.'],
  ['Biblioteca', 'Reutiliza tu experiencia', 'Configuraciones locales versionadas que se aplicarán como copias independientes.'],
] as const;

function App() {
  const [active, setActive] = useState(0);
  const selected = modules[active];
  return <div className="app">
    <aside>
      <div className="brand">MÉNTOR<span>INGENIERÍA E INVERSIÓN</span></div>
      <p className="product">Evaluador inmobiliario</p>
      <nav aria-label="Módulos">{modules.map(([name], index) => <button key={name} aria-current={active === index ? 'page' : undefined} onClick={() => setActive(index)}><span className="number">{String(index + 1).padStart(2, '0')}</span>{name}</button>)}</nav>
      <div className="local">Almacenamiento local previsto<br/><small>Base de desarrollo · Fase 1</small></div>
    </aside>
    <main>
      <header><span>ESPACIO DE TRABAJO</span><span>V1.0 · En desarrollo</span></header>
      <section aria-labelledby="module-title">
        <p className="eyebrow">{selected[0]}</p>
        <h1 id="module-title">{selected[1]}</h1>
        <p className="intro">{selected[2]}</p>
        <div className="empty"><div className="symbol" aria-hidden="true">M</div><h2>{active === 0 ? 'Tu espacio está listo para empezar' : 'Módulo previsto en el plan de desarrollo'}</h2><p>{active === 0 ? 'Todavía no hay proyectos. La creación y el guardado se incorporarán en la Fase 2.' : 'Esta primera base permite revisar la navegación. Las funciones de este módulo aún no están implementadas.'}</p></div>
      </section>
      <footer>Evaluación preliminar de proyectos inmobiliarios · Méntor</footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
