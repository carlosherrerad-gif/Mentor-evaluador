# Criterios propuestos para la siguiente etapa

Revisión del 30/10/2026. Especificación para revisión; no implementa cambios en la aplicación.

## Referencias identificadas

Cuatro Excel aportados: Ficha de Evaluación Preliminar de Terreno_A001 rev2.xlsx, ejemplo para chat gpt.xlsx, Factibilidad y Presupuesto OMBÚ - BCP (01.2025), Flujo de Caja Proyectado OMBU (01.2025). Complemento: calculadora HTML original y aplicación vigente. No se han identificado seis Excel aportados explícitamente.

La ficha orienta el análisis rápido. El ejemplo orienta el detalle, pero no es autoridad de fórmulas: Desarrollo B96 confunde IGV con renta; F103 contiene un 30% fijo; F110 supone capital propio del 30%; el acumulado del flujo contiene #REF!. OMBÚ tiene vínculos externos y reglas particulares de IGV/crédito fiscal, además de un costo financiero prefijado. No se trasladan automáticamente.

## Cronograma confirmado por el usuario

- Mes 0: adquisición del terreno y sus pagos de adquisición previstos.
- Mes 1: inicio automático de diseño, especialidades, trámites y preventa.
- Preventa termina antes de iniciar venta del saldo; no se comparte capacidad sobrante de su último mes.
- Construcción y venta del saldo comienzan el mes siguiente al cierre de preventa. Si ajustes manuales de preparación retrasan obra, mostrar el conflicto y solicitar resolverlo, sin cambiar silenciosamente los plazos.
- Duración general de obra editable, pagos uniformes y ajustes de centavos al final.
- Duración de venta automática: ceil(meta preventa / velocidad) + ceil(inventario restante / velocidad), con duración cero para una fase sin unidades. La separación de fases puede añadir un mes frente a ceil(inventario total / velocidad).
- La fecha calendario inicial corresponderá al mes 0. La migración de manuales existentes debe conservar fechas o pedir revisión explícita; no desplazar datos guardados silenciosamente.

## Presupuesto y tratamiento tributario propuesto

Un presupuesto de origen por escenario. Para cada concepto: afectación (gravado/exonerado/inafecto/pendiente), modalidad de importe (incluye/no incluye IGV), tasa y base gravada aplicables, y crédito fiscal elegible. No inferir impuestos únicamente del título del grupo.

Los precios actuales conservan su significado hasta que se confirme su tratamiento; no reinterpretar importes históricos silenciosamente. Una partida mixta requiere desglose o base gravada explícita sustentada.

Modelo ordinario de primera venta gravada: separar valor de transferencia sin impuesto y componente terreno excluido de la base conforme a norma. Para la regla general del 50% de terreno y tasa conjunta del 18%, el impuesto equivale al 9% del valor antes del impuesto. Un precio final incluido se divide entre 1.09, no se multiplica por 9%. No aplicar a operaciones exoneradas o con tratamiento pendiente. Viviendas, estacionamientos y otros productos se clasifican por separado. Evaluar las condiciones y vigencia de eventuales exoneraciones, sin presumirlas por distrito ni precio solamente.

La construcción subcontratada es un contrato completo; no separar utilidad del contratista. Sugerir tratamiento gravado ordinario para el servicio contratado, sujeto a revisión de la operación y documento. Compra de terreno, tasas municipales, honorarios, planilla, servicios y comisiones se clasifican individualmente. No aplicar 18% a todo el grupo de trámites o administración.

Crédito fiscal: diferenciar adquisiciones destinadas exclusivamente a operaciones gravadas, a no gravadas y comunes; las comunes requieren asignación/prorrata sustentada. No usar automáticamente el 50% del IGV de todos los indirectos. Registrar supuestos y revisión; una proyección no acredita por sí misma los requisitos documentales.

## Caja tributaria propuesta

- Cobros y pagos de caja incluyen los impuestos efectivamente cobrados/pagados.
- Débito de ventas según cobros para la primera venta gravada; distinguir de venta comercial y de reconocimiento de ingresos contables.
- Mes de crédito fiscal según comprobantes/requisitos y su disponibilidad; el pago al proveedor no prueba por sí solo el derecho a crédito. Propuesta inicial de proyección: factura coincidente con pago, advertencia visible y desfase editable.
- Liquidación por período: débito menos crédito admisible y saldo anterior. Pago positivo programado en el mes de vencimiento; saldo a favor se arrastra.
- El saldo a favor no es un cobro, una devolución automática ni utilidad disponible. No restarlo automáticamente de la utilidad sin evaluar recuperabilidad.
- Mostrar crédito fiscal final no utilizado y mantener separado el saldo de efectivo.
- Detracciones: distinguir efectivo disponible y fondos restringidos cuando apliquen; no son un costo adicional ni un descuento del precio total. Deben contemplarse antes de considerar definitivo el déficit financiable. No agregar retenciones/percepciones sin identificar que aplican.
- El IGV no recuperable integra el costo cuando corresponda; el recuperable se separa del resultado económico, aunque afecte temporalmente caja.
- Renta es un módulo separado del IGV. No fijar 30% ni aplicar sin más una tasa a utilidad total del proyecto; definir régimen, ejercicio, reconocimiento y pagos a cuenta. Hasta su implementación, indicadores claramente antes de IR.

## Indicadores del proyecto

Pestaña Indicadores dentro de Flujo de caja. Antes de deuda y aportes, excluir intereses/comisiones de financiación correspondientes para evitar doble conteo con la tasa de descuento. Incluir impuestos operativos modelados y su calendario; identificar resultados antes/después de IR.

VAN = F0 + sum(Ft/(1+im)^t), t desde 1. im = (1+ia)^(1/12)-1, ia efectiva anual editable sin tasa recomendada universal. TIR mensual: raíz del VAN; anual equivalente = (1+TIR mensual)^12-1. Mes 0 no se descuenta. Tasa 0% válida; tasa vacía deja VAN pendiente. Conservar TIR negativa válida, no ocultarla. Flujos sin solución o con raíces múltiples se señalan; no elegir una raíz arbitrariamente. Usar VAN como referencia cuando TIR no sea concluyente.

Terreno propio: sin desembolso en caja, pero su valor de oportunidad se incorpora como inversión económica inicial para medir el rendimiento del proyecto. Conciliar ese ajuste explícitamente, sin duplicarlo como pago o préstamo. Horizonte debe incluir todos los cobros, pagos e impuestos pendientes, sin valor terminal inventado.

## Financiamiento y socios (entrega posterior)

Aportes monetarios y en especie, desembolsos de préstamos, intereses sobre saldo, amortizaciones y distribuciones. Tasas efectivas y períodos consistentes; gracia definida como de capital o total; capitalización explícita, sin bucles de cálculo implícitos. Intereses reales sustituyen solo el estimado correspondiente, no todos los gastos financieros indiscriminadamente.

Déficit previo a financiamiento orienta la necesidad; deuda y socios se calculan después de caja tributaria y fondos restringidos. Flujo del socio: aportes negativos y distribuciones positivas; no confundir caja de la empresa, monto de préstamo o utilidad contable con dinero recibido por el socio. Aportes en especie se valoran y muestran por separado. Tasa de descuento del socio distinta de la del proyecto, sin asumir capital propio fijo del 30%.

## Entregas propuestas

1. Corregir cronograma e implementar clasificación de IGV y conciliación base/impuesto/total, preservando datos.
2. Caja tributaria mensual y distinción de fondos disponibles/restringidos aplicables.
3. VAN/TIR del proyecto con alcance tributario explícito.
4. Financiamiento, aportes y VAN/TIR del socio.

Cada entrega requiere esquema revisado antes de implementación. Mantener listas compactas desplegables; no activar suscripciones todavía. No modificar proyectos reales para completar supuestos.

## Fuentes normativas y metodológicas

- https://www.sunat.gob.pe/legislacion/igv/regla/cap4.htm
- https://www.sunat.gob.pe/legislacion/tributaria/igv/ley/capitul1.htm
- https://www.sunat.gob.pe/legislacion/oficios/2008/oficios/i1852008.htm
- https://orientacion.sunat.gob.pe/3109-05-calculo-del-impuesto
- https://emprender.sunat.gob.pe/principales-impuestos/impuesto-general-las-ventas-igv/sistema-detracciones-igv
- https://www.accaglobal.com/uk/en/student/exam-support-resources/prodipsust-study-resources/technical-articles/investment-appraisal.html

Las reglas tributarias específicas de cada operación y su vigencia deben confirmarse antes de presentar el modelo como liquidación definitiva.
