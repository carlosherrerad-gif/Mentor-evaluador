# D1 — Diseño integral V1 para revisión

20 de octubre de 2026. Propuesta entregada; pendiente de revisión y ajustes con el usuario. No se ha iniciado D2.

## Entregables

- docs/DISENO-INTEGRAL-V1.md: recorrido, campos, acciones, estados, propiedad de datos, aceptación y ocho decisiones pendientes.
- public/diseno-v1.html, .css y .js: maqueta navegable disponible en http://127.0.0.1:1420/diseno-v1.html.
- PLAN-WEB.md actualizado: completar V1 y validar localmente antes de publicar.
- docs/ADR-002-DISENAR-V1-ANTES-DE-PUBLICAR.md: registro de la nueva decisión de orden.

La maqueta no lee la API ni los proyectos del usuario; no guarda, calcula, emite PDFs ni sube archivos. Los botones de acciones futuras explican el comportamiento propuesto. Inputs deshabilitados señalan los campos previstos. El ejemplo de figura en Potencial no representa un edificio configurado.

## Comprobaciones ejecutadas

- `node --check public/diseno-v1.js`: aprobado.
- `pnpm build`: aprobado; el frontend funcional conserva su salida y se incorporan los archivos públicos de diseño.
- Navegación en navegador: diez pantallas verificadas por su título.
- Catorce pestañas: selección verificada en Datos (4), Economía (4), Informes (2) y Biblioteca (4).
- Comparador conceptual: cuatro columnas y botón para quinta columna bloqueado.
- Cambio de escenario a B: etiqueta de propiedad actualizada a escenario B.
- Explicación de dúplex: apertura y cierre del diálogo comprobados.
- Campos finales: eficiencia física y cuatro tarifas de obra presentes.
- Ancho sin desbordamiento de página: 1265/1265 en vista amplia y 402/402 al mostrar el navegador estrecho; las tablas anchas utilizan su propio contenedor.
- Evidencias: evidencia/diseno-v1-inicio.png y evidencia/diseno-v1-verificacion.json.

No se repitieron pruebas del backend: esta entrega solo añade diseño público y documentación, sin cambiar API, permisos ni base de datos. No se declara implementada ninguna función futura por haberla dibujado en esta maqueta.

## Primera revisión recomendada

Datos del proyecto → Terreno y Edificio. Revisar campos obligatorios, cambio automático/manual, agrupación de niveles y conteo de dúplex. Después: partidas económicas pendientes, vista conservadora, clasificación ROC a 25% y perfil de administración global. Estas decisiones deben cerrarse antes de implementar las reglas respectivas.
