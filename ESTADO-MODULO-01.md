# Módulo 01 — Proyectos, escenarios y biblioteca

Implementado localmente el 21/10/2026. Acceso: http://127.0.0.1:1420/. La publicación por internet queda para la fase final.

## Funciones disponibles

- Proyectos: identificación, ubicación, responsable, observaciones, búsqueda, filtros, orden y edición con guardado automático y control de cambios concurrentes.
- Duplicación independiente con o sin escenarios; estados borrador/en evaluación; archivado, papelera y recuperación.
- Escenarios: creación, selección, cambio de nombre, duplicación independiente, archivado y papelera. Se conserva al menos uno fuera de la papelera.
- Biblioteca compartida de modelos y referencias urbanísticas: creación, duplicación, versiones inmutables, consulta de versiones y archivado. Cada autor modifica sus propias plantillas.
- Aplicación de una versión como copia independiente, con comparación previa. Los cambios posteriores en la biblioteca no se propagan a proyectos.
- Las referencias urbanísticas aplicadas quedan pendientes de verificar para el predio. Se muestra una advertencia al superar los pisos máximos registrados, conservando la hipótesis propuesta.
- Historial paginado y permisos por proyecto. Las operaciones de administración y aplicación se verifican también en el servidor.
- Exportación de datos del proyecto a JSON y recuperación como proyecto nuevo con identificadores nuevos.

## Límites de esta entrega

El respaldo JSON contiene metadatos, configuración urbanística y escenarios con sus configuraciones y datos económicos existentes. No incluye cuentas, permisos, biblioteca global, documentos binarios ni el historial de auditoría anterior. No sustituye un respaldo operativo completo del sistema.

Se almacenan atributos de configuración; todavía no se calculan áreas, costos, rentabilidad, ascensores ni volumetrías. No hay parámetros normativos o precios precargados. La comparación de pisos no certifica cumplimiento normativo. Los formularios detallados del terreno y documentos corresponden a la siguiente fase.

## Validación

23 pruebas automatizadas aprobadas: regresión, permisos, aislamiento de copias, concurrencia, versiones, respaldo/recuperación, paginación y migración de una base anterior. Compilación TypeScript/Vite aprobada.

Recorrido de interfaz en una base sintética separada: creación y edición de proyecto, modelo de 12 pisos, referencia de máximo 8 pisos, aplicación de ambas copias y advertencia de exceso de 4 pisos. Los datos de prueba no se insertaron en la base del usuario.

Antes de actualizar la base existente se creó un respaldo consistente SQLite en data/backups. La migración agrega campos y tablas conservando registros existentes.

La calculadora HTML original permanece como referencia sin modificaciones. Siguiente fase pendiente de definición y autorización: datos del terreno y motor físico.
