# Evaluación económica · entrega 1

Entrega local del 25/10/2026. Disponible por escenario en Evaluación económica: Resumen, Ingresos y Costos.

- Recupera áreas, viviendas, estacionamientos comercializables y adquisición del escenario, sin volver a ingresarlos.
- Ventas mediante precio promedio por m², sustituciones por rangos de pisos sin solapamientos, precio de estacionamientos y otros ingresos opcionales. Azotea con sustento usa el promedio; venta hipotética se mantiene fuera del caso base.
- Construcción contratada por importe/base agrupada, costos por m² diferenciados o paquetes detallados. Incluye gastos generales y utilidad del contratista, sin desglosarlos otra vez.
- Ocho grupos: adquisición adicional, construcción, diseño, permisos, administración, comercialización, postventa/contingencia y financiamiento estimado.
- Cada grupo exige decidir registrar, no aplica, incluido con explicación o pendiente. Partidas detalladas sustituyen al importe agrupado. Cantidades por áreas/unidades, meses e importes/porcentajes explícitos. Sin ciclos en la base de construcción.
- Moneda PEN/USD; conversión de adquisición mediante tipo explícito PEN por USD. Cambiar la moneda no convierte silenciosamente los demás supuestos.
- Criterio uniforme de importes gravados con/sin impuestos. No liquida IGV, crédito fiscal ni impuesto a la renta. La utilidad es preliminar antes de IR sobre importes ingresados, no utilidad tributaria certificada ni flujo de caja.
- Resultado: ingresos, costo total, utilidad, rentabilidad sobre costo y margen sobre ventas. Hipótesis recalcula gastos sobre ventas sin duplicar construcción de azotea. Denominadores cero no generan porcentajes falsos.
- Campos vacíos e información incompleta permanecen pendientes; se conservan ceros explícitos. Cambios de cantidades recalculan bases automáticas y requieren revisión de importes fijos y superficies manuales.
- Guardado automático, historial, permisos y revisiones optimistas de escenario/proyecto. Se conservan adquisición y datos anteriores. Copia y respaldo JSON incluyen supuestos, sin almacenar resultados derivados como autoridad. Sin migración de base.

Validación: TypeScript/Vite correctos y 81 pruebas aprobadas. Ocho pruebas nuevas abarcan cálculo independiente, sustitución de precios/partidas, faltantes, ceros, moneda, revisión por cambios físicos, hipótesis, validación, acceso, concurrencia, archivo, copia y respaldo. Caso independiente: ingresos 500000, costos 385000 y utilidad 115000. Prueba visual con base sintética separada: edición de precio, guardado, actualización de gastos porcentuales, resultado pendiente al retirar precio y persistencia tras recarga. Sin desbordamiento horizontal (viewport 1280 px). Evidencia en evidencia/evaluacion-economica-1.png con datos de prueba.

Alcance posterior: programación de cobranzas/pagos, flujo mensual, préstamos y amortizaciones, capital requerido, VAN/TIR, sensibilidad y plantillas económicas. Expediente documental y adjuntos siguen pospuestos. No se publican servicios en internet. Las referencias Excel se utilizaron para conceptos y relaciones; no se afirma paridad tributaria ni reproducción íntegra de sus resultados.
