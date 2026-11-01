# Faseo vigente — Méntor web compartido

Actualización 01/11/2026: IGV mensual implementado como estimación de perfil, con cobros/pagos brutos, crédito propuesto editable, compensación y pago al mes siguiente. Actualiza déficit y caja, sin devolución automática del saldo a favor. Ver ESTADO-PERFIL-IGV-MENSUAL.md. Siguiente etapa: esquema de VAN/TIR del proyecto; después financiación/aportes e indicadores del socio.

Actualización 31/10/2026: Ingresos y Costos incorporan columnas IGV, importe sin IGV, total con IGV y porcentaje automático sobre ventas brutas base; desglose y subtotales concilian sin duplicar partidas. Ver ESTADO-PRESUPUESTO-IGV.md. Caja tributaria mensual sigue pendiente.

Actualización 31/10/2026: IGV simplificado a tres columnas de selección única (sin IGV / 18% / 9% efectivo), propuestas editables por concepto y creación de partidas independientes. Desglose base/IGV/total separado del crédito fiscal. Ver ESTADO-IGV-2.md. Caja tributaria mensual e indicadores financieros aún pendientes.

Decisión vigente 24/10/2026: expediente documental, adjuntos e intercambio/restauración de archivos se posponen a una versión posterior. V1 conserva el respaldo JSON de datos y configuraciones. Módulo 02, partes 1–5, implementado localmente; las plantillas de parámetros se editan directamente, sin nuevas versiones. Continúa Módulo 03: resumen físico de Potencial inmobiliario; volumetría 3D y economía requieren entregas aprobadas posteriores.

Avance 21/10/2026: D2 implementada localmente como Módulo 01, incluyendo la biblioteca versionada adelantada desde D6. Detalle y límites en ESTADO-MODULO-01.md. El comparador y los motores de cálculo siguen pendientes. La siguiente fase se define con el usuario antes de implementarla.

Actualizado el 20/10/2026: primero diseñar y completar V1 localmente; publicar al final. Conserva los siete módulos, las fórmulas auditadas y la arquitectura compartida. Cada entrega se revisa antes de comenzar la siguiente. W1 (base web de acceso y proyectos) es el antecedente ya implementado.

| Fase | Entrega | Criterio de cierre |
|---|---|---|
| D1 — Diseño integral | Maqueta navegable y especificación de pantallas, campos, acciones y estados | Revisar y ajustar con el usuario antes de implementar funciones nuevas |
| D2 — Proyectos y escenarios | Completar duplicación, archivado, historial y gestión del escenario activo | Aislamiento y conservación de datos; flujo completo de gestión |
| D3 — Datos y motor físico | Terreno, niveles, sótanos, dúplex, azoteas, fuentes y resumen de potencial; documentos en versión posterior | Paridad con original para casos equivalentes; sin doble conteo; pendientes visibles |
| D4 — Evaluación económica | Fórmulas originales, supuestos editables, tarifas excluyentes y partidas manuales | Referencias HTML/PDF, redondeo y nuevas reglas aprobadas, escenarios independientes |
| D5 — Volumetría | Three.js, niveles, vistas y PNG | Coherencia con motor; el fallo del visor no interrumpe los cálculos |
| D6 — Comparador y biblioteca | Cuatro escenarios vigentes del mismo terreno; modelos versionados y plantillas de parámetros editables directamente | Copias independientes, sin propagación no autorizada ni resultados obsoletos |
| D7 — Informes | Ejecutivo y completo, A4 mixto, emisiones inmutables | Igualdad de cifras, revisión visual, fuentes y advertencias conservadas |
| D8 — Validación integral V1 | Recorridos, permisos, cuentas, concurrencia, respaldo/restauración y recuperación | V1 funcional validada localmente; limitaciones documentadas |
| D9 — Publicación por internet | Alojamiento, base/almacenamiento, dominio HTTPS y operación | Dos personas desde equipos distintos, persistencia, respaldos y seguridad del despliegue |

La referencia PEDelta orienta navegación, filtros, paneles y jerarquía visual. No se copian sus datos, identidad ni funciones ajenas al evaluador inmobiliario. La primera vista previa utiliza el servidor de este equipo: todavía no equivale a acceso público por internet.

La propuesta de D1 está en docs/DISENO-INTEGRAL-V1.md y en /diseno-v1.html. Ver ADR-002 para el cambio de orden. La maqueta no guarda ni calcula y todavía requiere revisión.


### Vista conceptual 3D · entrega local 24/10/2026
Implementada en Potencial inmobiliario: fachada automática por ancho, retiros gráficos del 10 % en uno o dos frentes, ventanas/balcones, firma discreta Méntor, giro, acercamiento, selección de pisos, sótanos y azotea ocultables, modo arquitectónico y análisis. Geometría rectangular referencial independiente de áreas económicas y normativas. Expediente y adjuntos siguen pospuestos. Evaluación económica pendiente de esquema aprobado.


### Evaluación económica · entrega 1 · 25/10/2026
Implementada evaluación estática rápida/detallada por escenario: ingresos, costos contratados y propios de la inmobiliaria, resultado preliminar antes de IR, hipótesis separada y guardado con revisiones. No liquida IGV ni calcula IR. Próxima entrega: esquema aprobado de cronograma y flujo mensual; después financiamiento y sensibilidad. Ver ESTADO-EVALUACION-ECONOMICA-1.md.


### Flujo de caja independiente · 28/10/2026
Sección propia en el menú, disponible para todos los equipos con los permisos existentes. La segmentación Básico/Premium, activación por equipo y cobros se definirán al cerrar el alcance; no se implementa gating ahora. Incluye propuesta automática de cronograma por inventario, velocidad y meta de preventa; inicio de obra después de preventa/preparación, duración general editable y pagos uniformes; cobranzas, pagos y flujo mensual conciliado. Los ajustes manuales se conservan. No cambia el presupuesto del módulo económico. Pendientes posteriores: curva variable opcional de obra, financiamiento por deuda/aportes, impuestos, VAN/TIR y sensibilidad. Ver ESTADO-FLUJO-CAJA-1.md.
### IGV por concepto y cronograma · 30/10/2026

Primera entrega de la siguiente etapa: terreno en mes 0, preparación/preventa desde mes 1, saldo en el mes siguiente al cierre de preventa. Fechas manuales anteriores conservadas con revisión explícita. Clasificación tributaria por concepto y conciliación adicional de base, IGV, total y crédito proyectado en Evaluación económica → IGV. El presupuesto y el flujo conservan importes de origen hasta la entrega de caja tributaria mensual. VAN/TIR y financiamiento aún pendientes. Ver ESTADO-IGV-1.md y docs/CRITERIOS-EVALUACION-FINANCIERA.md. Estos criterios sustituyen las reglas anteriores de compartir capacidad en el último mes de preventa y comenzar la adquisición en mes 1.
