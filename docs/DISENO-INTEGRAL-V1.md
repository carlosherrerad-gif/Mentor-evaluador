# Méntor V1 — Propuesta integral de diseño

20 de octubre de 2026. **Propuesta para revisión; no equivale a aprobación ni a funciones implementadas.** El usuario decidió completar y validar V1 localmente antes de publicarla en internet. El desarrollo conserva la arquitectura compartida de usuarios y proyectos.

## 1. Recorrido principal

Crear proyecto → registrar terreno y fuentes → configurar edificio del escenario → revisar potencial y restricciones → completar economía → comparar alternativas → revisar y emitir informe.

Biblioteca, documentos y equipo están disponibles durante el recorrido. No se obliga a completar todo de una sola vez: se permiten borradores, pero un resultado incompleto nunca se presenta como cero ni como evaluación terminada.

## 2. Organización común de las pantallas

- Menú lateral: Inicio; Mis proyectos; Datos del proyecto; Potencial inmobiliario; Evaluación económica; Escenarios comparativos; Informes; Biblioteca. Bloque secundario: Equipo y acceso; Configuración.
- Barra superior: proyecto activo y escenario activo, ambos siempre identificados. Datos del terreno compartidos llevan una etiqueta visible. El comparador y los PDF identifican cada escenario explícitamente.
- Inicio muestra el siguiente paso y las tareas pendientes, además del resumen físico y económico cuando existan resultados vigentes.
- Encabezado: nombre del proyecto, escenario, estado de evaluación, permiso y guardado. Las tablas y fichas explican unidades y origen del dato.
- Avisos diferenciados: falta dato; incoherencia que impide calcular; condición por verificar; resultado desactualizado. La clasificación de rentabilidad permanece separada del estado de información.
- Formularios: guardando, guardado, sin conexión, error y conflicto entre revisiones. Un conflicto conserva lo escrito y permite revisar los cambios del servidor; no sobreescribe automáticamente.
- En pantallas pequeñas el menú se recoge; las tablas anchas se desplazan horizontalmente dentro de su panel. Acciones, campos y mensajes tienen etiquetas; no dependen solo del color.

## 3. Módulo 01 — Mis proyectos

**Listado:** buscar por nombre, código y ubicación; filtros de estado; columnas de terreno, escenarios, actualización y permiso. Acciones: crear, abrir, duplicar, archivar/recuperar. La eliminación requiere revisar dependencias y confirmación, sin eliminar inadvertidamente documentos compartidos.

**Nuevo proyecto:** nombre obligatorio; código, ubicación, responsable y observaciones opcionales; crea terreno y primer escenario en borrador. Crear sin datos económicos es válido. Las referencias de precio no se aplican sin una acción explícita.

**Duplicar:** elegir escenarios y documentos que se copian. Nuevos identificadores y copias independientes; un proyecto duplicado no participa en el comparador del terreno original. Se conserva procedencia, no referencias activas a valores que cambian.

**Historial:** quién, cuándo, objeto y resumen de cambios. Permite identificar revisiones; la restauración debe mostrar consecuencias y volver a invalidar resultados afectados. No es un historial separado del comparador.

**Aceptación:** dos proyectos conservan sus escenarios separados; archivar permite recuperar; duplicar y editar no cambia el original.

## 4. Módulo 02 — Datos del proyecto

### 4.A. Terreno — compartido

| Bloque | Campos propuestos | Comportamiento |
|---|---|---|
| Identificación | Nombre, código, dirección, partida, código catastral, propietario opcional | No requieren inventar un registro faltante |
| Localización | Departamento, provincia, distrito y referencias | No necesita mapas externos para funcionar |
| Geometría | Área real m²; frente/fondo m opcionales; forma regular/irregular; topografía y notas | Frente × fondo no reemplaza área declarada en lotes irregulares |
| Precio pedido | S/m² o total; fuente y fecha | Se conserva cuál importe dirige la conversión al cambiar el área |
| Valor de mercado | S/m² o total; fuente, fecha y confianza | Independiente del precio pedido y de adquisición |
| Fuentes | Documento, versión, página/referencia y nota | Se enlaza al expediente compartido |

El precio de adquisición pertenece a la economía de cada escenario, aunque se muestre como referencia en la ficha. No hay un único costo de terreno que sobrescriba todas las alternativas.

### 4.B. Edificio — por escenario

**Configuración general:** nombre del escenario, pisos sobre rasante, área libre prevista, alturas por nivel si se registran, ascensores como atributo y observaciones.

**Tabla de niveles/grupos:** rango de niveles sin solapamientos, uso, área construida (automática/manual), eficiencia física, área vendible (automática/manual), unidades simples que comienzan en ese nivel, avisos. Los pisos especiales sustituyen los niveles indicados del grupo típico.

**Propuesta para el cambio automático/manual:** conservar ambos valores y su procedencia, usando únicamente el modo activo. Al volver a automático se muestra el cambio antes de aplicarlo. Cambiar el terreno recalcula automáticos y marca manuales para revisión; nunca los borra silenciosamente. Esta regla se somete a aprobación.

**Sótanos:** grupos/áreas por nivel; superficie destinada a parqueo; estacionamientos automáticos o manuales; cantidad comercializable independiente si no todos se venderán. Estimación original: parte entera del área de parqueo/40 m², conservando tolerancia original de frontera cuando corresponda.

**Azotea:** área construida, uso, área vendible computable y área condicionada con su fuente normativa. El costo físico permanece cuando se excluye del ingreso una porción pendiente de validación.

**Dúplex por grupos:** nivel de inicio, nivel de continuación, cantidad y superficie de cada tramo. No se crea inventario comercial individual. Propuesta: las unidades se cuentan en su nivel de inicio; el nivel superior no suma otra vivienda. Las porciones de dúplex se identifican dentro de las superficies ya registradas de cada nivel, no como un área adicional que vuelve a sumarse. No asumir 50% de azotea permitido. Su semántica final requiere aprobación y casos de prueba antes de programar.

### 4.C. Parámetros urbanísticos — compartidos

Reglas registradas: altura/pisos máximos, lote y frente mínimos, área libre, azotea, estacionamientos, coeficiente con definición de áreas aplicables, retiros y observaciones. Cada regla conserva unidad, fuente/documento/versión, emisor, fecha y aplicabilidad.

Estados: dentro del límite registrado; excede; pendiente; no aplica. Si faltan datos, no concluir cumplimiento. No resolver geometría urbanística compleja ni certificar autorización municipal.

### 4.D. Documentos — expediente compartido

Tabla con nombre, categoría, fecha, emisor, versión, vínculos y estado. Acciones: incorporar copia, abrir, clasificar, archivar y cargar nueva versión. Enlaces desde valores y reglas a documento/versión/página. La nueva versión no reemplaza silenciosamente el archivo histórico ni la cita de un PDF emitido.

## 5. Módulo 03 — Potencial inmobiliario

**Pantalla:** indicadores físicos; tabla por nivel; visor conceptual; panel de advertencias y fuentes. Indicadores: construida sobre rasante, sótanos, azotea, total, vendible residencial válida/condicionada, departamentos, parqueos, área promedio e índices con denominador declarado.

La separación azotea/rasante debe explicitarse: si se muestra azotea como fila independiente, el subtotal de rasante la excluye para no duplicarla. Los totales provienen del motor único; el visor no los calcula.

**Visor:** orbitar, acercar, desplazar, restablecer, elegir nivel, ocultar sótanos/azotea, vista explotada, exportar PNG y abrir ficha del nivel. Un rectángulo supuesto se etiqueta como conceptual. No se presenta un modelo BIM arquitectónico.

**Si falla el visor:** las tablas y resultados siguen disponibles. **Si falta un dato esencial:** indicadores como pendientes, sin resultados falsos. **Si cambian insumos:** resultados desactualizados y recálculo antes de emitir o comparar como vigentes.

## 6. Módulo 04 — Evaluación económica

Pestañas: Supuestos; Ingresos; Egresos; Resultado y observaciones. Todas pertenecen al escenario activo.

| Bloque | Campos/acciones |
|---|---|
| Terreno | Adquisición considerada S/m² o total; fuente; no reemplaza pedido/mercado |
| Ventas | Precio único residencial S/m²; precio por estacionamiento; velocidad departamentos/mes; fuentes y fechas |
| Obra | Selector excluyente general/diferenciada; tarifa general o tarifas de rasante, sótanos y azotea |
| Especialidades | Tarifa por m² sobre área pertinente; base visible |
| Gastos | Licencias, marketing, administración, postventa e intereses; porcentaje y base de ingresos visibles |
| Partidas manuales | Concepto, cantidad, unidad, tarifa/importe, fuente y estado cuantificado/pendiente |
| Resultado | Ingresos, egresos, utilidad, ROC, composición y duración comercial |

Los valores de arranque heredados se identifican con su procedencia y no se llaman cotizaciones vigentes. No añadir automáticamente imprevistos, descuentos, ascensores o impuestos. La velocidad no altera el 2% de intereses original, que sigue siendo una reserva simplificada, no una tasa anual.

Propuesta de vista conservadora: excluir ingresos de áreas condicionadas, conservar costos físicos y recalcular los gastos ligados a los ingresos de esa misma vista. La política se debe aprobar como extensión; no altera las referencias originales.

Partidas pendientes permanecen visibles. Antes de programar debemos resolver si se permite emitir con subtotal parcial o se bloquea el resultado económico completo. Recomendación: mostrar subtotales identificados y bloquear una conclusión presentada como completa mientras falten importes esenciales.

No hay flujo mensual, VAN, TIR, financiamiento detallado ni modelo tributario completo en V1.0. No introducir rentabilidad anualizada.

## 7. Módulo 05 — Escenarios comparativos

Selección de dos a cuatro escenarios del mismo terreno; las alternativas almacenadas pueden ser más de cuatro. Vista en columnas; A vs. B con diferencias absolutas, relativas y puntos porcentuales de ROC. Base cero implica variación relativa no calculable.

Se comparan configuración, áreas, unidades, ingresos, egresos, utilidad, ROC, duración y advertencias urbanísticas. Las diferencias de adquisición, tarifas y ventas se destacan para no atribuir a la geometría efectos que provienen de otro supuesto.

Elegir orden por ROC/utilidad/inversión/área vendible; no declarar ganador automático. No comparar terrenos distintos. Los resultados deben ser vigentes y de la misma vista económica; no mezclar conservadora de A con completa de B sin indicarlo. No guardar historial independiente del comparador.

## 8. Módulo 06 — Informes

**Listado de emisiones:** identificador, fecha, tipo, escenarios, responsable, estado y archivo. Descargar/abrir no regenera un PDF previo.

**Asistente de emisión:** 1) elegir ejecutivo/completo y escenarios; 2) elegir secciones, imagen y destinatario; 3) revisar datos, fuentes y advertencias; 4) vista previa con paginación definitiva; 5) emitir nueva copia inmutable.

Ejecutivo: portada, terreno, volumetría, indicadores, economía, advertencias y conclusiones revisadas. Completo: además fuentes, normativa, niveles, desglose, supuestos, fórmulas y comparación opcional. A4 vertical por defecto; páginas horizontales para tablas cuando sean necesarias. No se fuerza un número fijo de páginas si genera cortes.

**Perfil de marca:** empresa, logo, colores, responsable, contacto y pie. Conclusiones editables por analista; ninguna certificación automática de viabilidad. Si falta información esencial, impedir emisión con indicadores no computables y explicar qué falta. Las advertencias no se ocultan para emitir.

## 9. Módulo 07 — Biblioteca

Cuatro categorías: edificios; urbanística; economía; referencias de suelo. Buscar por nombre, categoría, zona y estado. Ficha con ID, versión, origen, fuente, fecha y ámbito.

Acciones: crear, duplicar, nueva versión, archivar y aplicar. Aplicar muestra diferencias y permite elegir campos antes de sobrescribir. Se copian datos independientes y se conserva referencia de procedencia; no se propagan actualizaciones a proyectos existentes.

Una plantilla económica no cambia la eficiencia física; una de edificio no traslada el precio de adquisición ni el área real del terreno de origen. Las áreas automáticas se recalculan, las manuales se señalan para revisión. Un certificado de otro predio no se trata como aplicable sin comprobarlo.

Sin importación/exportación individual de plantillas en V1.0. El respaldo integral futuro conserva todas las versiones necesarias.

## 10. Pantallas auxiliares

**Inicio:** proyecto y escenario; resultados vigentes o pendientes; próximos pasos; información del terreno; alternativas; accesos a documentos y equipo. No mostrar como completo un proyecto que solo tiene nombre.

**Equipo y acceso:** miembros, rol por proyecto, invitaciones y revocación. Acceso/login/recuperación de cuenta forman parte de V1 antes de publicar; las contraseñas no se comparten entre personas. Cambios de permisos se validan en servidor.

**Configuración:** perfil de informes; preferencias numéricas y unidades permitidas; gestión de respaldo/restauración y fuentes predeterminadas. Los respaldos globales no deben quedar disponibles para un administrador de proyecto cualquiera: definir administrador de instalación/sistema antes de implementar esta pantalla.

## 11. Mapa de propiedad e invalidación

| Dato que cambia | Efecto |
|---|---|
| Terreno compartido | Invalida físicos/economía de escenarios dependientes; revisa áreas manuales |
| Nivel de escenario B | Invalida potencial y economía B; comparador vigente; no cambia A |
| Precio/tarifa de B | Invalida economía B; no cambia geometría ni economía A |
| Fuente/regla del terreno | Reevalúa restricciones; no cambia áreas editadas silenciosamente |
| Plantilla global | No cambia proyectos donde se aplicó una versión anterior |
| Nuevo informe | Crea emisión; no modifica resultados, informes anteriores ni comparador |

## 12. Decisiones para revisar antes de implementar

1. Navegación propuesta y presencia permanente de proyecto/escenario activos.
2. Modo automático/manual: conservar valores alternativos y exigir revisión ante cambio de terreno.
3. Dúplex: unidades en nivel de inicio y tramos contenidos en las superficies físicas, sin inventario individual.
4. Tratamiento de importes pendientes y posibilidad de mostrar resultados parciales claramente identificados.
5. Vista conservadora y su impacto en gastos ligados a ingresos.
6. Etiqueta a 25% de ROC: el HTML original usa “alta”, mientras el PDF de diseño incluye 25% en “favorable”. Mantener original hasta decisión expresa.
7. Quién administra respaldos globales y el perfil institucional, separado del administrador de proyecto.
8. Presentación del informe completo y alcance de anexos (referencias a documentos, sin exportación DOCX/PPTX).

La maqueta muestra estas reglas como propuestas. No calcula, no guarda datos, no lee proyectos del servidor, no crea informes ni sube documentos. Los botones de acciones futuras explican el flujo esperado en vez de simular éxito.
