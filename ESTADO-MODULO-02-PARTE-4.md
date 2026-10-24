# Módulo 02 · Parte 4 — Registro de parámetros urbanísticos

Entrega local en Datos del proyecto → Parámetros. Diseño compacto con grupos desplegables. Se conserva la biblioteca anterior y las configuraciones de proyectos existentes.

## Registro del terreno

- Identificación: distrito, zonificación, uso permitido, municipalidad, régimen, sector, vía, ámbito general/predio/sin definir y condiciones de aplicación.
- Límites: altura máxima, pisos explícitos, área libre, lote y frente mínimos, coeficiente con definición de áreas computables, densidad y su unidad.
- Retiros frontal/lateral/posterior, alineamiento, afectaciones y restricciones.
- Estacionamientos: cantidad fija o proporción por vivienda, con condiciones, visitas y excepciones como texto. No se fija una proporción universal.
- Azotea y dúplex: porcentaje máximo, base normativa y su definición, condición de uso residencial y otras condiciones. Sin porcentaje ni autorización precargados; la base normativa se distingue de la superficie física.
- Fuente: tipo y número de documento, referencia textual, emisión, vencimiento, revisión y observaciones. No se infiere automáticamente una vigencia. Los adjuntos se vincularán en la parte de Documentos.
- Borradores incompletos, guardado automático, botón de guardado, errores/conflictos con borrador conservado y permisos en servidor. Solo el administrador edita los parámetros compartidos.
- Los cambios marcan las comprobaciones de escenarios pendientes, conservando edificios, adquisiciones y resultados económicos anteriores. Nunca se declara cumplimiento por defecto.

## Plantillas simplificadas según decisión del usuario

- Crear, ver, editar directamente, duplicar, eliminar a papelera y recuperar.
- No se crean nuevas versiones al editar ni existe selector o historial de versiones para parámetros. Los modelos de edificios mantienen su comportamiento previo.
- La configuración actual se reemplaza sobre el mismo registro. Se usa una referencia de concurrencia interna, sin numeración visible de versiones.
- Las filas históricas anteriores se conservan internamente por compatibilidad de almacenamiento, pero no se ofrecen para consultar ni aplicar. La API anterior de versiones se bloquea para plantillas urbanísticas.
- Solo el autor modifica o elimina una plantilla; los demás pueden duplicarla como alternativa propia.
- Aplicación explícita con diferencias entre proyecto y plantilla, avisos de ámbito/distrito/fecha/fuente y copia independiente pendiente de verificar para el predio. Editar o eliminar la plantilla no modifica proyectos anteriores.
- Disponible desde Biblioteca → Parámetros urbanísticos y desde la pestaña Parámetros. Se pueden guardar los parámetros actuales como plantilla sin transferir terreno, precios o permisos.
- Duplicación y respaldo/restauración de datos del proyecto conservan los parámetros y su procedencia. La biblioteca global no forma parte del respaldo JSON de un solo proyecto.

## Validación

Compilación TypeScript/Vite aprobada. Suite completa: 55 pruebas aprobadas. Nueve pruebas nuevas cubren validación de datos y fechas, permisos, concurrencia, edición sin nuevas versiones, copias independientes, papelera/recuperación, compatibilidad con biblioteca anterior y respaldo. Las pruebas de parámetros se repitieron tras la normalización final de procedencia.

Recorrido de interfaz en base sintética separada: registro de parámetros, guardado y creación de plantilla; edición de 12 a 10 pisos en la plantilla sin cambiar el proyecto; comparación 12→10 y aplicación confirmada; duplicación, eliminación y recuperación. Persistencia al recargar, ausencia de botones V1/V2 en parámetros y ausencia de errores de consola/desbordamiento horizontal general en la vista revisada.

## Límites y siguiente paso

No hay interpretación automática de certificados, referencias normativas precargadas ni diagnóstico urbanístico completo. Se conserva la advertencia simple previa de pisos del inicio. La Parte 5 incorporará las comprobaciones cuantitativas y requiere su esquema y aprobación antes de ejecutarse. La publicación por internet y los documentos siguen pendientes.

No se requirió migración de esquema ni dependencias nuevas. Los datos de prueba están separados de la base del usuario. Se crea un respaldo consistente de esta base antes de activar la entrega.
