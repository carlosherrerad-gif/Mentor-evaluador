# Entrega W1 — Base web compartida

Fecha: 19 de octubre de 2026. Estado: implementada y validada localmente. No publicada en internet.

## Resultado

Se sustituyó la vista de escritorio por una plataforma web con identidad Méntor y estructura inspirada en PEDelta: menú lateral, proyecto activo, indicadores, ficha, escenarios y colaboración. Las cifras no calculadas aparecen como pendientes; no hay resultados financieros ficticios.

Funciona: creación inicial de cuenta, inicio/cierre de sesión, proyectos privados, edición de ficha general, archivado/recuperación, escenarios vacíos independientes, miembros por proyecto, invitaciones con roles editor/lector, retirada de acceso e historial. La persistencia se realiza en SQLite del servidor; no en localStorage ni en una lista solo en memoria. Los datos de evaluación detallada y las fórmulas no se implementaron en esta entrega.

## Verificación ejecutada

- `pnpm build`: TypeScript y compilación Vite aprobados (33 módulos).
- `node --test tests/*.test.mjs`: 12 pruebas aprobadas, 0 fallidas. Evidencia en evidencia/web-api-tests.txt.
- Pruebas API: anonimato, contraseñas con hash, sesión y cierre, creación transaccional, dos escrituras sobre la misma revisión (200/409), editor y lector, aislamiento entre proyectos, invitaciones de un uso y vencimiento, destinatario con cuenta existente, origen no autorizado, limitación de intentos, reinicio con persistencia, HTTPS/cookie Secure en producción y retirada inmediata de membresía.
- Navegador: alta de cuenta sintética en base separada .tmp/web-preview.sqlite, creación de proyecto, escenario B, edición de dirección, reinicio del servidor conservando datos, cierre y reingreso.
- Revisión visual: dashboard y acceso en vista amplia; configuración inicial adaptada a 304 px de ancho sin desbordamiento horizontal (scrollWidth=clientWidth=304).
- La base de la entrega (data/mentor.sqlite) quedó sin cuentas y sin proyectos de prueba. El usuario creará su cuenta en la pantalla inicial.

Los primeros intentos de pruebas HTTP dentro del entorno restringido fallaron por bloqueo de sockets; al ejecutarlas con permiso de red local pasaron. No se atribuyó ese fallo a las fórmulas ni a la base de datos.

## Acceso local actual

http://127.0.0.1:1420. Se ejecuta el servidor Node de esta plataforma con PORT=1420 y APP_ORIGIN correspondiente. `pnpm start` sin variables usa por defecto el puerto 1430. No requiere abrir el ejecutable Windows ni el servidor Vite para usar esta entrega.

## Límites y siguiente fase

W2 elegirá alojamiento y almacenamiento central definitivo para acceso real por internet. No existe aún URL pública, dominio HTTPS, servicio de correo, recuperación de cuenta ni respaldo/restauración operativo. SQLite requiere una instancia Node y almacenamiento persistente; si se elige despliegue serverless o varias instancias se debe adaptar a PostgreSQL antes de publicar.

No implementado todavía: documentos compartidos, autoguardado de datos de evaluación, edición completa de edificios, motor físico/económico, 3D, comparador, biblioteca ni PDF. Los módulos correspondientes están identificados como próximos. El refresco de fichas es cada 30 segundos o manual; no es coedición en tiempo real. Los permisos sí se validan de inmediato en cada operación del servidor.

Se conservaron el HTML original, el PDF de especificación, la auditoría y la entrega Windows previa. La ruta vigente es PLAN-WEB.md, con decisión en docs/ADR-001-PLATAFORMA-WEB.md.
