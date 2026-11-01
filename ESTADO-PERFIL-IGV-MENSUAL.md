# IGV mensual del perfil · 01/11/2026

Alcance autorizado: estimación inicial económica/financiera, sin contabilidad operativa ni revisión documental mensual. Nueva pestaña Flujo de caja → IGV mensual con supuestos plegables, indicadores y matriz mensual compacta. Estimación activa por defecto; comparación sin ajuste tributario disponible expresamente.

## Propuesta editable

- Comprobantes coincidentes con pagos y crédito utilizable ese mismo mes; desfase global editable 0–12 meses.
- Crédito propuesto 100% del impuesto donde la partida no tenga porcentaje definido. No sustituye los porcentajes explícitos, incluidos cero y prorratas. Es un supuesto del perfil, no una conclusión sobre cumplimiento documental. El porcentaje global puede ajustarse 0–100%.
- Pago del impuesto al mes siguiente al período; desfase editable 1–12 meses. No se modelan días de vencimiento por RUC.
- Saldo a favor inicial cero, editable en moneda del análisis.
- Saldo a favor arrastrado, separado del efectivo; no se devuelve automáticamente ni compensa hacia atrás impuestos pagados antes de generar crédito.

## Cálculo y conciliación

La matriz original del cronograma se usa como patrón temporal. Cada flujo de cobros y pagos se convierte al importe bruto conciliado con Ingresos y Costos según sus reglas individuales. No modifica precios, cantidades, bases porcentuales ni presupuesto original. El reparto acumulativo en centavos conserva totales y la cobertura parcial de cronogramas incompletos: no escala una venta parcial al total del presupuesto.

Débito de ventas asignado a los cobros; otros ingresos mantienen su mes programado. IGV de compras y crédito elegible asignados a pagos uniformes del grupo, incluidos detalles de tasas mixtas. Mes 0 conserva adquisición; terreno propio no genera desembolso ni crédito de compra. Crédito disponible por período, saldo anterior, obligación neta, saldo siguiente y pago en caja separados.

Flujo mensual incluye proveedores con IGV y una fila adicional para pago del impuesto; no duplica el IGV pagado al proveedor. Saldo final, curva, déficit y recuperación recalculados. La conciliación de costos excluye la liquidación fiscal adicional para comparar correctamente contra proveedores. El horizonte se extiende a créditos/pagos posteriores y señala pendientes si excede 240 meses; no presenta déficit final mientras exista tal pendiente.

Caso independiente: ventas con IGV 5232, proveedores 2180, débito 432, crédito 180, impuesto pagado 252, caja final 2800. Si crédito se genera un mes después, se paga 432 y queda crédito 180: caja final 2620, sin devolución ficticia. La preventa puede generar impuesto antes de iniciar la obra. El caso de gran crédito posterior preserva esos pagos previos.

## Alcance de indicadores

Esta entrega prepara el flujo para VAN/TIR, todavía no implementa esos indicadores. Perfil antes de IR, sin deuda/aportes, detracciones ni fondos restringidos. No describe los resultados como rentabilidad definitiva o declaración tributaria. Los porcentajes o costos financieros preliminares existentes permanecen programados; deberán distinguirse al construir el VAN/TIR del proyecto sin deuda.

## Persistencia y verificación

Supuestos bajo economics.cashflow.igv. Validador compartido, API de flujo existente, revisión optimista, permisos y respaldo/copia conservados; sin cambio de esquema SQLite. Lectura y cálculo puros. No se guardan matrices calculadas.

120 pruebas aprobadas; TypeScript/Vite correctos. Casos de precios incluidos/excluidos, crédito explícito/global, cambios de desfases, crédito previo y posterior, terreno propio, saldo final no monetizado, inicial/saldo, partidas mixtas, centavos, extensión del horizonte, datos incompletos, cronograma parcial, operaciones sin IGV, validación y persistencia serializada. Pruebas anteriores de permisos, concurrencia, archivo, copia y respaldo preservadas.

QA en base sintética separada: propuesta completa con débito 1967759.17, crédito 1729161.03, pagos fiscales 245612.14 y saldo a favor final 7014. Cambiar crédito global a 75% recalcula pagos a 676148.89; guardado confirmado tras recargar, después restaurado 100%. Conciliaciones de ingresos/proveedores cero. Déficit estimado actualizado a 6210908.45 con cobros inicial/saldo del escenario sintético. Sin desbordamiento a 1280 px. Evidencia: evidencia/igv-perfil-mensual.jpg. No se completaron ni alteraron proyectos reales.

Referencias: https://orientacion.sunat.gob.pe/3109-05-calculo-del-impuesto ; https://orientacion.sunat.gob.pe/3114-08-declaracion-y-pago-del-impuesto-igv ; https://www.sunat.gob.pe/legislacion/tributaria/igv/ley/capitul6.htm . La disponibilidad real del crédito depende de los requisitos aplicables; aquí se utiliza el supuesto visible del perfil aprobado por el usuario.
