# Flujo de caja · primera entrega independiente

Entrega local del 28/10/2026. Botón propio «Flujo de caja», fuera de Evaluación económica. Disponible para todos los equipos; sin cambios de suscripción, facturación ni reglas de activación. Los permisos administrador/editor/lector se siguen comprobando en el servidor. La futura segmentación Básico/Premium será por equipo, según decisión del usuario.

## Funcionamiento

- Cronograma, Cobros y pagos, Flujo mensual en tres pestañas, con listas de etapas y partidas desplegables.
- Propuesta explícita inicial: 2 departamentos/mes, meta de preventa 30%, construcción de 12 meses, entrega de 1 mes y postventa de 3. Todos son supuestos editables. Mes calendario opcional; si falta se trabaja con meses relativos.
- Meta de preventa redondeada hacia arriba a viviendas enteras. Duración nominal de ventas = viviendas/velocidad, redondeada hacia arriba. La capacidad sobrante del último mes de preventa puede vender saldo en ese mismo mes, sin superar el inventario ni la velocidad conjunta.
- Diseño y trámites automáticos dentro del período de preventa. Se pueden acortar o ajustar manualmente. La construcción empieza después del cierre de preventa y de la preparación programada; sin preventa hay al menos el mes inicial de diseño/trámites antes de obra. No se calcula duración de obra por pisos ni procesos: es un plazo general ingresado.
- Etapas automáticas o manuales, opción No aplica y calendario de barras. Ajustes manuales conservados con advertencia al cambiar indicadores. Entrega posterior a construcción. Inicios y duraciones ausentes o fuera del horizonte de 240 meses permanecen pendientes.
- Pagos uniformes por intervalo: importe total dividido entre meses, con ajuste de centavos en el último mes. La construcción no desglosa utilidad del contratista y no modifica el costo contratado. Cada grupo admite intervalo manual de pago. Diseño, trámites y otros grupos usan su etapa; administración usa horizonte del cronograma, comercialización período de ventas, financiamiento estimado período de construcción y postventa su etapa.
- El total presupuestado permanece fijo, incluso si fue estimado originalmente como costo por mes. Cambiar meses de pago no recalcula la evaluación económica.
- Cobro simplificado inicial del 100% al vender, o inicial porcentual y saldo en entrega. Desfase configurable, saldo nunca antes del cobro de su inicial. Misma regla para viviendas y estacionamientos. Otros ingresos en entrega o mes elegido.
- Se usa el precio promedio ponderado de departamentos y se asignan estacionamientos proporcionalmente a viviendas vendidas. No se supone secuencia de venta de tipologías; no se duplican viviendas ni estacionamientos. Si solo hay estacionamientos, se utiliza su inventario para programarlos.
- Flujo mensual con unidades vendidas, cobros, pagos por categoría, neto y saldo acumulado; gráfico, déficit máximo antes de financiamiento y recuperación estable del saldo. El horizonte incorpora cobros/pagos posteriores a ventas u obra.
- Conciliación contra ingresos y presupuesto de desembolsos. Ajustes explícitos de redondeo por centavos. Terreno propio registrado como aporte no monetario: permanece en el costo económico y no se desembolsa en caja. Hipótesis de azotea fuera del flujo base.
- Sin crédito fiscal, liquidación de impuestos, préstamos, aportes monetarios, VAN ni TIR. El gasto financiero preliminar se programa como costo, sin simular financiación recibida. Saldos mensuales agregados, sin movimientos intramensuales.

## Persistencia y validación

Supuestos guardados en economics.cashflow, conservando evaluación y adquisición. No se almacenan matrices derivadas como fuente de verdad. API GET/PATCH independiente, revisión optimista de proyecto y escenario, protección de proyectos ajenos/archivados y lectores. Copia, respaldo y restauración conservan programación. Sin migración de base. Control del tamaño combinado de supuestos para mantener compatibilidad con respaldo/importación.

TypeScript y compilación Vite correctos; 90 pruebas automáticas aprobadas. Nueve pruebas nuevas comprueban caso independiente, reparto exacto de centavos, inventario, velocidades fraccionarias, 0/100% de preventa, ausencia de viviendas, cobranzas diferidas, terreno propio, conservación de manuales, datos incompletos, calendario, validación y API (permisos, concurrencia, archivo, copia y respaldo).

Caso independiente: 30 viviendas a 2/mes, 9 preventas en 5 meses, venta completa en 15 meses, construcción de 12 meses desde mes 6. Contrato de 2.4 millones repartido en doce pagos de 200000. Verificado inventario único, conciliación y suma de ingresos/pagos.

QA visual con base sintética separada: 44 viviendas, 14 preventas, 7 meses de preventa, 22 meses nominales de venta y obra en meses 8–19. Cambio de velocidad a 3 recalcula la propuesta; diseño manual de 2 meses se conserva; inicial/saldo modifica déficit y no los totales. Guardado comprobado y recargado; conciliaciones en cero y sin desbordamiento horizontal a 1280 px. Evidencias en evidencia/flujo-caja-cronograma.png y evidencia/flujo-caja-mensual.png. Ningún proyecto real fue rellenado con datos de prueba.
