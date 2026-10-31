# IGV por concepto y cronograma corregido

Entrega local del 30/10/2026. Corresponde a la primera entrega propuesta en docs/CRITERIOS-EVALUACION-FINANCIERA.md: cronograma e IGV por concepto. No publica el sitio ni activa suscripciones.

## Cronograma

Adquisición en mes 0; diseño, trámites y preventa desde mes 1. La venta del saldo empieza el mes posterior a la preventa, sin usar su capacidad sobrante. Obra propuesta desde ese mismo mes, con duración general editable y pagos uniformes. Sin preventa se conserva un mes inicial de preparación antes de obra. Si un intervalo manual de diseño/licencias retrasa preparación, el resultado queda pendiente en lugar de desplazar obra silenciosamente.

El calendario, gráfico de barras, pagos, tabla y curva incluyen mes 0. Caso 30 viviendas, velocidad 2, preventa 30%: 9 preventas en meses 1–5; 21 ventas de saldo en meses 6–16; obra meses 6–17. Compra de terreno en mes 0 genera ahora correctamente déficit inicial incluso si los cobros futuros cubren la inversión.

Los cronogramas guardados sin timelineVersion son anteriores a mes 0. Su lectura migra una copia a timelineVersion 2: intervalos manuales y mes explícito de otros ingresos se renumeran conservando fechas calendario; no se escribe la base al consultar. Los manuales quedan pendientes de revisión explícita. Diseño que antes coincidía con adquisición puede quedar en mes 0: se conserva su fecha, se señala el conflicto y el usuario decide su nueva programación. Guardar conserva la nueva convención sin desplazarla otra vez. Copias y respaldos aceptan ambos formatos.

## Clasificación de IGV

Pestaña IGV en Evaluación económica, con presupuesto compacto de ingresos y costos y filas desplegables. Afectación pendiente/gravada/exonerada/inafecta, importe con/sin IGV, tasa, base completa/primera venta gravada con exclusión del 50% de terreno/proporción sustentada, porcentaje de crédito fiscal y fuente. Sugerencias explícitas que el usuario aplica por concepto; no se autoasigna crédito ni se cambia el significado de precios históricos.

Los costos detallados se clasifican por partida; importes rápidos y tarifas de construcción usan la clasificación del grupo activo. No se suman modos inactivos. Otros ingresos tienen reglas propias. La hipótesis de azotea permanece fuera de la conciliación base.

Base, IGV y total concilian en centavos. Precio final 109000 de primera venta gravada ordinaria: valor sin IGV 100000 e impuesto 9000. Crédito fiscal proyectado separado de IGV no recuperable y costo económico ajustado. Crédito positivo y exoneración requieren sustento; no se presume 50% de crédito de indirectos. Ceros no generan pendientes innecesarios. Terreno propio conserva valor económico sin inventar impuesto ni crédito de compra.

Supuestos en economics.evaluation: taxes para productos/terreno, tax en costos, partidas y otros ingresos. Validación compartida y del servidor, mismas revisiones optimistas y permisos. Guardado, copia y respaldo preservan tratamientos y adquisición/configuración anteriores. La API genérica y restauración también validan estas reglas. No hay migración física de SQLite.

## Alcance pendiente

Resumen, porcentajes del presupuesto y flujo siguen usando importes de origen. La pestaña IGV muestra una conciliación adicional y lo explica: no conecta aún importes brutos ni pagos tributarios al flujo. No declarar ese flujo como caja definitiva después de impuestos. El antiguo criterio global se conserva como criterio del presupuesto de origen; no sustituye la clasificación por concepto.

Próximas entregas: caja tributaria mensual, fondos restringidos/detracciones aplicables, VAN/TIR del proyecto, financiamiento y aportes, rendimiento del socio. No hay liquidación mensual de IGV, pagos de IR, devoluciones automáticas, crédito bancario, VAN ni TIR en esta entrega. El porcentaje de crédito ingresado es un supuesto sustentado, no un cálculo automático de prorrata ni una comprobación documental.

## Verificación

100 pruebas automáticas completas aprobadas. Incluyen IGV incluido/excluido, extracción 9/109, crédito parcial, centavos, pendientes, exoneración y sustento, propiedad aportada, partidas detalladas, conservación de presupuesto, validación, copias y respaldos por API; mes 0, separación de fases, velocidades fraccionarias y migración idempotente de manuales. TypeScript y Vite correctos.

QA visual en instancia separada 1440 con cuenta y proyecto sintéticos: sugerencia de primera venta gravada, selección de precio incluido, guardado, recarga y conservación de desglose; fecha y advertencia de diseño manual migrado, corrección a mes 1 y revisión explícita. Sin desbordamiento horizontal a ancho 1280. Evidencia: evidencia/igv-clasificacion.png. No se rellenaron ni clasificaron proyectos reales.

Respaldo SQLite consistente antes del reinicio en data/backups/antes-igv-*.sqlite. Vista previa real en http://127.0.0.1:1420/ con backend actualizado.
