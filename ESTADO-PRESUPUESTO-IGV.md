# Presupuestos con desglose de IGV · 31/10/2026

Entrega autorizada: Ingresos y Costos muestran concepto, IGV monetario, importe sin IGV, total con IGV y porcentaje sobre ventas, en ese orden. Subtotales y totales independientes por columna. Importes en la moneda del análisis indicada en cabecera.

Se reutilizan los tratamientos por concepto de IGV (sin impuesto, 18%, 9% efectivo o especial conservado) y el criterio individual de precio incluido/excluido. Los costos detallados suman exclusivamente sus partidas activas; importes rápidos y tarifas se desglosan con la regla del grupo. No aplica/incluido suman cero, mientras costos pendientes conservan totales pendientes. Crédito fiscal pendiente no bloquea estas columnas, porque son independientes de la recuperabilidad del impuesto.

Porcentaje automático = total con IGV de cada producto/costo dividido entre total de ingresos base con IGV. La fila total de ingresos es 100% si el total es positivo. Cero genera No aplica; información faltante genera Pendiente. La azotea hipotética sigue separada. Los porcentajes introducidos para estimar costos conservan su base de origen; la incidencia calculada usa la base homogénea con IGV y puede diferir.

Desplegables conservados. Los detalles de otros ingresos, ventas por piso y partidas de costos incorporan tabla financiera con el mismo orden y subtotal. Se mantiene aparte la explicación del cálculo de origen (superficie, cantidad, precio o tasa). Distribución en centavos del impuesto agregado entre pisos/tarifas para conciliar exactamente detalle y subtotal, sin duplicar redondeos.

shared/budget.mjs es consulta pura; no persiste matrices, cambia precios, reclasifica conceptos ni modifica revisiones. No hay cambios de esquema de base de datos ni permisos. El Resumen y el flujo aún conservan importes de origen hasta las entregas de integración económica/caja tributaria; esta entrega modifica las pestañas Ingresos y Costos, no liquida impuestos mensuales.

108 pruebas aprobadas, TypeScript y Vite correctos. Casos nuevos: ingresos y costos mixtos con IGV incluido/excluido, denominador homogéneo, detalle/subtotales sin duplicados, centavos por piso, datos faltantes, ceros, ausencia de crédito fiscal definido y conservación del presupuesto de origen.

QA visual en instancia 1440 con datos sintéticos: orden de ambas cabeceras, total de ingresos 100%, partidas/subtotal de diseño, cambio de precio de estacionamiento 45000→46000 actualiza ingreso 810000→828000 y participación 3.40%→3.47%; precio restaurado y guardado en la base de pruebas. Sin desbordamiento del documento a 1280 px; en anchos menores hay desplazamiento horizontal interno del presupuesto. No se modificaron proyectos reales.

Evidencia: evidencia/presupuesto-ingresos-igv.jpg y evidencia/presupuesto-costos-igv.jpg. Vista previa real en http://127.0.0.1:1420/.
