# Módulo 02 · Parte 5 — Comprobación urbanística por escenario

Entrega local en Datos del proyecto → Parámetros y Edificio. El escenario se selecciona con el selector superior existente. No se modifica automáticamente ninguna propuesta al detectar incompatibilidades.

## Controles

- Pisos sobre el terreno frente al máximo explícito; no se agregan sótanos ni azotea como otro piso automáticamente.
- Área libre = 100 % − ocupación propuesta, si se registró área del terreno y las áreas construidas son automáticas. Si existe construcción manual, la ocupación real queda pendiente. La diferencia de porcentajes se expresa en puntos porcentuales.
- Estacionamientos previstos totales frente a cantidad fija o regla por vivienda. La proporción por vivienda se redondea hacia arriba sobre viviendas únicas, sin volver a contar dúplex. El redondeo utiliza la representación decimal registrada para evitar errores de coma flotante y no redondear proporciones positivas pequeñas a cero. La cantidad comercializable no sustituye al total.
- Azotea: suma única de superficies techadas frente a base normativa × porcentaje / 100. Requiere definición de la base; no sustituye la base normativa por el terreno o la base física, ni presupone un 50 %. Sin azotea y con edificio definido: No aplica.
- Adicionales desplegables: altura completa sobre el terreno (incluyendo altura de azotea si existe y excluyendo sótanos), lote mínimo y frente mínimo.

## Estados y trazabilidad

Estados internos: dentro del límite registrado, exceso/incumplimiento del mínimo, pendiente de verificar y no aplica. Para los mínimos, la etiqueta se expresa como No alcanza el mínimo registrado. Se muestran límite, propuesta, diferencia, regla utilizada y motivo de pendientes.

La fuente, distrito y zonificación deben estar registrados; un distrito diferente, fuente ausente, vencimiento pasado, emisión futura o datos inconsistentes mantienen los controles aplicables pendientes. Si ya se detecta una diferencia numérica, permanece visible aunque el estado sea pendiente. El conteo de excesos numéricos puede coincidir con pendientes de sustento; no es una suma de estados excluyentes.

Registrar una fuente no certifica su autenticidad o aplicabilidad municipal. La interfaz conserva esta distinción y muestra las restricciones fuera del alcance: geometría de retiros, densidad/coeficiente sin bases cuantificadas, usos, accesibilidad e iluminación. La comparación de techado no cambia la clasificación de venta hipotética de azotea ni autoriza usos residenciales.

Los cambios locales sin guardar se presentan como vista previa pendiente. La tabla se actualiza con el escenario y los datos disponibles; no reemplaza resultados económicos anteriores ni limpia sus marcas históricas de revisión.

## Implementación y verificación

Motor puro compartido entre navegador y servidor. API de consulta GET /api/projects/:id/urban-checks, con filtro opcional ?scenario=:id, devuelve revisiones y fecha de cálculo. Requiere acceso al proyecto; no consulta escenarios ajenos ni altera datos, revisiones o historial. No se guardan nuevas versiones ni resultados sobre evaluaciones históricas.

Compilación TypeScript/Vite aprobada. Suite completa: 64 pruebas aprobadas, con nueve nuevas pruebas de cálculo/API. Incluyen pendientes, ceros, redondeo, áreas manuales, azotea, controles adicionales, permisos y ausencia de mutaciones.

Recorrido visual sobre base sintética: 12 pisos frente a 10 (+2), 35 % de área libre frente a mínimo 35 % (0 p.p.), 20 plazas frente a 22 exigidas (−2) y 130 m² techados de azotea frente a 120 m² (+10). Adicionales: 39 m frente a 36 m (+3), lote 500 m² frente a 450 m² y frente 15 m frente a 12 m. La misma tabla aparece en Parámetros y Edificio. Vaciar la fuente dejó los cuatro controles principales pendientes y conservó diferencias/excesos numéricos; se restauró la fuente al terminar. Sin errores de consola ni desbordamiento horizontal general en la vista revisada.

Pruebas realizadas en base separada; respaldo consistente de la base existente antes de activar. Sin dependencias nuevas ni migración de esquema.

La siguiente parte pendiente es Expediente documental. Requiere su esquema y aprobación antes de construirse. No se implementaron costos, aprobación normativa integral ni publicación por internet.
