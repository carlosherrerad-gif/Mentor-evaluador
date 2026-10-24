# Módulo 03 · Resumen físico del potencial

Entrega local del 24/10/2026. Disponible en Potencial inmobiliario para el escenario activo.

- Cuatro indicadores: viviendas únicas, superficie construida total, superficie vendible sin hipótesis y estacionamientos.
- Desglose entre pisos, sótanos y azotea, con origen automático/manual y detalle desplegable.
- La venta hipotética de azotea permanece separada; registrar sustento no representa aprobación municipal.
- Dúplex y pisos especiales se contabilizan una sola vez. Las sumas incompletas aparecen pendientes.
- Restricciones numéricas y datos pendientes reutilizan las comprobaciones urbanísticas existentes.
- Consulta sin escritura: reutiliza los motores de Edificio, sin migración ni cambios de economía.

Validación: TypeScript y compilación Vite correctos; 70 pruebas automáticas aprobadas. Tres casos equivalentes comparados con la función calcular del HTML original, considerando eficiencia, ocupación, pisos, sótanos y estacionamientos equivalentes. Pruebas de ausencia de datos, ceros explícitos, superficies manuales, hipótesis y ausencia de mutaciones. Revisión visual a 1280 px con datos sintéticos en base separada: 44 viviendas, 4,830 m² construidos, 3,242.5 m² vendibles, 20 estacionamientos y 85 m² hipotéticos; acceso a Edificio comprobado y sin desbordamiento horizontal.

Pendientes para entregas posteriores con esquema aprobado: volumetría 3D y evaluación económica. Por decisión del usuario, el expediente documental y los adjuntos se posponen a una versión posterior. Esta entrega no publica la plataforma en internet.
