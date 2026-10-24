# Módulo 02 · Parte 3 — Sótanos, estacionamientos, azotea y dúplex

Entrega local integrada en Datos del proyecto → Edificio, bajo el edificio base. Cuatro bloques compactos y desplegables; sus resúmenes permanecen visibles.

## Alcance implementado

- Sótanos por nivel (hasta 50): ocupación propia y cálculo área del terreno × ocupación, o área manual, con altura opcional. Reducir la cantidad requiere confirmación. No generan viviendas ni venta residencial.
- Estacionamientos manuales o estimados por área destinada / factor explícito de m² por plaza, redondeados hacia abajo. Cantidad comercializable separada y no superior al total. Sin factor ni proporción normativa predeterminados.
- Azotea: superficie base física, áreas comunes techadas, servicios/equipamientos, terrazas, altura y superficies superiores de dúplex. El techado no puede superar la base física cuando ambas se conocen. Las terrazas forman parte de la superficie sin techar; no se duplican como área construida.
- Dúplex entre penúltimo/último piso o entre último piso/azotea. Cantidad agregada limitada por las viviendas del origen. Los departamentos del piso de destino representan viviendas independientes que comienzan allí; los segundos niveles no crean viviendas.
- Entre pisos, las áreas superiores son subconjuntos del piso de destino y no vuelven a sumarse. En azotea se registran una sola vez y se suman con las otras superficies techadas.
- Venta residencial de azotea pendiente de sustento separada como hipótesis. Registrar una fuente permite clasificarla como superficie con sustento registrado por el analista; no implica certificación municipal. No se presume un techado autorizado del 50 %.
- Cantidad de ascensores como atributo informativo. No se asignan costos automáticamente a ascensores, terrazas o equipamientos.
- Resumen integrado: viviendas únicas, dúplex/flats, construcción por zona y total, venta residencial de pisos, venta de azotea con sustento o hipotética, estacionamientos y altura sobre el terreno. Los datos incompletos permanecen pendientes.
- Cambiar el terreno recalcula áreas automáticas. Las superficies manuales complementarias se conservan y requieren revisión explícita para el terreno actual.
- Cambiar pisos con excepciones o conexiones dúplex requiere confirmación. Las conexiones se revisan para los nuevos niveles y se desactivan si faltan niveles, conservando sus campos.
- Se reutiliza el guardado y los permisos del edificio base. Validación también en servidor; historial y resultados económicos anteriores conservados con marca pendiente de actualización.
- Plantillas versionadas, duplicación y respaldo/restauración conservan las extensiones como copias independientes. Los edificios anteriores conservan sus cantidades de sótanos y ascensores al abrir la ampliación.

## Verificación

Compilación TypeScript/Vite aprobada. Suite completa: 46 pruebas aprobadas, con diez pruebas nuevas de cálculo y API, más regresión de los módulos anteriores. Sin dependencias nuevas ni migración de esquema.

Recorrido en base sintética separada: terreno de 500 m², edificio de 12 pisos con 44 viviendas, dos sótanos automáticos de 400 m², 130 m² techados en azotea y dos dúplex. Resultado: 44 viviendas (2 dúplex y 42 flats), 4 830 m² construidos totales, 3 242,50 m² vendibles en pisos y 85 m² hipotéticos separados en azotea. Estacionamientos estimados: 20 totales y 18 comercializables. Altura sobre terreno con azotea: 39 m. Valores conservados después de recargar.

Confirmaciones de reducción de pisos y sótanos comprobadas en pantalla: cancelar conserva 12 pisos y dos sótanos. Este diálogo de pisos ahora pertenece a la aplicación, resolviendo la limitación del diálogo nativo registrada en la Parte 2. Sin errores de consola ni desbordamiento horizontal general en la vista revisada.

## Pendiente

No incluye cálculo económico, aprobación urbanística, límites normativos de azotea, distribución arquitectónica de estacionamientos, documentos ni volumetría 3D. La siguiente parte es Registro de parámetros urbanísticos y requiere su esquema y autorización propios.

Los datos de prueba se mantienen fuera de la base del usuario. Antes de activar la entrega se crea un respaldo consistente de la base existente en data/backups.
