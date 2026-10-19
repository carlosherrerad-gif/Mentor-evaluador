# ADR 001 — Plataforma web compartida

Fecha: 19 de octubre de 2026. Decisión autorizada por el usuario: acceso de varias personas a los mismos proyectos, desde cualquier lugar por internet; comenzar con una entrega local revisable.

## Cambio de producto

La vía principal deja de ser el ejecutable Windows/Tauri. Se conserva su código e historial como antecedente. La interfaz React continúa y consume una API central. Los archivos originales y las fórmulas auditadas permanecen intactos. El requisito de funcionamiento exclusivamente local queda sustituido por el acceso compartido mediante servidor.

## Primera entrega implementada

Node 24 LTS sirve frontend y API bajo un mismo origen. SQLite reside exclusivamente en el servidor; los navegadores no descargan la base. Para este primer servicio se usa una única instancia con volumen persistente. Proyectos y escenarios se identifican por UUID, con membresía y rol por proyecto. Un resultado futuro seguirá perteneciendo a un escenario concreto.

La implementación actual admite cuentas, sesiones, proyectos, fichas generales, escenarios vacíos, invitaciones de un uso, revocación de acceso e historial. No implementa todavía cálculos, documentos, restablecimiento de contraseñas, verificación de correo, respaldo operativo ni edición colaborativa de campos en tiempo real. No debe declararse lista para publicación operativa hasta completar su revisión y despliegue.

## Por qué esta base

Permite probar colaboración real entre sesiones sin exigir cuentas externas ni trasladar datos a un proveedor durante el desarrollo. El repositorio de persistencia está separado de la API y de la interfaz. SQLite admite este piloto de instancia única; si se necesitan múltiples instancias, concurrencia elevada o servicios serverless se migrará la capa de datos a PostgreSQL antes del despliegue, conservando contratos y pruebas.

Esta versión **no** debe publicarse como exportación estática ni ejecutar su SQLite en almacenamiento efímero de funciones serverless (por ejemplo, un frontend en Vercel no proporciona por sí solo la persistencia requerida). Elegir proveedor, capacidad y base administrada forma parte de la siguiente decisión de despliegue, no de los ejemplos visuales de PEDelta.

## Acceso y consistencia

- Contraseñas: scrypt asíncrono con sal por cuenta; no se almacenan en texto.
- Sesiones aleatorias: solo su SHA-256 se guarda en DB; cookie HttpOnly y SameSite=Strict; Secure obligatorio en producción; caducidad 12 horas.
- El servidor verifica membresía en cada lectura y escritura. Administrador gestiona acceso; editor modifica fichas y crea escenarios; lector consulta.
- Invitaciones: token aleatorio, hash en DB, 48 horas, un solo uso, sin envío automático de correo. Las cuentas existentes deben iniciar sesión como destinatarias.
- Retirar una membresía impide inmediatamente nuevas consultas a ese proyecto; no borra su historial.
- Escrituras JSON del mismo origen; límites de solicitud e intentos de acceso. No se confía en cabeceras de IP aportadas por el cliente.
- Ediciones de ficha llevan revisión; si otra persona guardó primero se devuelve 409 y se conserva el formulario local.
- La interfaz consulta cambios cada 30 segundos y permite actualizar manualmente. Esto no es coedición en tiempo real.
- El primer registro solo se permite desde loopback en desarrollo. En producción requiere MENTOR_SETUP_TOKEN y APP_ORIGIN con HTTPS. No hay registro público abierto.

## Pendiente antes de publicar

Proveedor, dominio/HTTPS, ubicación de datos, volumen o PostgreSQL, respaldo/restauración, recuperación de cuenta, correo transaccional si se desea, revisión de seguridad del entorno, revocación administrativa de sesiones, monitoreo y pruebas con personas reales. La configuración de producción existe como contrato; aún no hay URL pública ni despliegue externo.

Referencias técnicas consultadas: documentación oficial de Node 24 LTS para node:sqlite y node:crypto. `node:sqlite` todavía tiene estabilidad experimental en Node 24; se debe reevaluar el adaptador antes de comprometer producción, con las mismas pruebas de persistencia.
