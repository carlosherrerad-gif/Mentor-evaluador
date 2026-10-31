# IGV simplificado · 31/10/2026

Entrega autorizada: tres columnas con casillas visuales y semántica de radio, una selección por concepto: sin IGV, 18%, 9% efectivo de primera venta gravada. Marcar otra opción reemplaza la anterior; pulsar la activa no deja la fila vacía. Selección accesible por teclado y nombre individual; campos deshabilitados para lectores y escenarios archivados.

Propuestas iniciales: departamentos/estacionamientos 9% efectivo; terreno sin construir, tasas municipales y financiación que califica sin IGV; contrato de obra y servicios gravados 18%. Grupos mixtos deben desglosarse. El usuario puede editar cada propuesta. Una operación sin IGV conserva el motivo inafecto/exonerado en su detalle. No se concluye aplicabilidad fiscal por el nombre de una partida. Operaciones gravadas usan el criterio previo de importe incluido/excluido como propuesta; si no estaba definido, permanece pendiente. Las selecciones explícitas anteriores se conservan. Reglas especiales anteriores que no equivalen a 0/18/9 se muestran como tratamiento especial conservado, sin reinterpretarlas; se sustituyen solo al elegir una columna.

Los defaults se calculan en copia del borrador, sin escribir al abrir. Guardar la evaluación persiste esas selecciones usando la API/revisiones/permisos existentes. La clasificación opera en la conciliación tributaria; resumen y flujo continúan con importes de origen hasta la entrega de caja tributaria mensual.

Base, IGV y total se calculan independientemente de la definición del crédito fiscal. El crédito y el costo ajustado quedan pendientes si faltan porcentaje o sustento; no bloquean el desglose base/impuesto/total ni se inventa crédito del 100%.

En costos se puede crear una nueva partida desde el desplegable de IGV. La conversión a detalle conserva las bases, precios y cantidades activas anteriores, incluso porcentajes y tarifas por m². La nueva partida es fija, con importe pendiente y propuesta 18%, editable; no duplica el importe de origen. Se pueden editar nombre e importe fijo desde IGV. Renombrar conserva el tratamiento; crear otra fila permite un tratamiento independiente. Las bases variables se editan en Costos, y otros ingresos se agregan desde Ingresos.

Validación: TypeScript y Vite correctos, 103 pruebas aprobadas. Pruebas añadidas para exclusividad lógica, equivalencia de tasas, defaults por tipo, crédito independiente, idempotencia, ausencia de mutación y conservación al renombrar. QA con base sintética separada: alternar 9/18/9, verificar desmarcado y recálculo sin abrir detalle, crear partida, renombrar, registrar cero, cambiar a sin IGV, guardar y recargar; una marca por fila, sin desbordamiento a 1280 px. El presupuesto de origen se mantuvo con una partida adicional de cero. Evidencia: evidencia/igv-tres-opciones.jpg. No se modificaron proyectos reales.

La liquidación mensual, IR, detracciones, VAN/TIR y financiación siguen pendientes de las siguientes entregas.
