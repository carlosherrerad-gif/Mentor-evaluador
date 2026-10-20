# Méntor — Plataforma web compartida

Ruta vigente: PLAN-WEB.md. Decisión y límites: docs/ADR-001-PLATAFORMA-WEB.md.

Actualización del 20/10/2026: primero completar V1 localmente; publicar al final (docs/ADR-002-DISENAR-V1-ANTES-DE-PUBLICAR.md). Propuesta integral de pantallas: docs/DISENO-INTEGRAL-V1.md. Maqueta sin datos en `/diseno-v1.html`, accesible con el servidor local.

## Requisitos y arranque local

Node 24 LTS (>=24.14 y <25), pnpm 11.25. No necesita Rust para la versión web.

1. `pnpm install --frozen-lockfile`
2. `pnpm build`
3. `pnpm start`
4. Abrir http://127.0.0.1:1430.

La primera visita permite crear la cuenta inicial en este equipo. No hay contraseña predeterminada ni proyectos ficticios. Después se inicia sesión con esa cuenta. Para trabajar en conjunto, crear un proyecto y usar Equipo del proyecto → Invitar persona. El enlace se comparte manualmente; la aplicación no envía correos.

Los datos se guardan en `data/mentor.sqlite` y deben conservarse junto a sus archivos WAL/SHM mientras el servicio está activo. No copiar la DB abierta de forma improvisada; el respaldo consistente se implementará y probará antes de la publicación operativa. Los datos y secretos están excluidos de Git.

## Desarrollo

La forma más simple de revisar esta entrega es compilar y usar el servidor de producción local del paso anterior. Para HMR: iniciar API con APP_ORIGIN=http://127.0.0.1:1420, PORT=1430 y luego `pnpm dev --port 1420 --strictPort`; Vite redirige /api al backend. Debe accederse por 127.0.0.1, no mezclar localhost con otro origen.

## Pruebas

`pnpm test` ejecuta las pruebas HTTP de autenticación, roles, proyectos, persistencia, invitaciones y concurrencia. Abren puertos loopback temporales y necesitan permiso de red local en entornos restringidos. Usan DB de prueba y credenciales sintéticas, nunca cuentas de usuarios. El test de persistencia crea una carpeta temporal propia dentro de .tmp.

## Despliegue pendiente

La versión actual requiere un proceso Node permanente y un volumen persistente (instancia única). APP_ORIGIN debe ser la URL HTTPS definitiva, NODE_ENV=production y MENTOR_SETUP_TOKEN un secreto fuerte de configuración inicial. HTTPS se termina en un proxy del alojamiento. No configurar CORS abierto ni exponer la base como archivo público.

Para un despliegue serverless o escalado horizontal se debe preparar PostgreSQL u otro almacén central adecuado, no una copia efímera de SQLite por función. No hay proveedor, dominio ni publicación contratados. No se han verificado Docker, máquinas remotas ni recuperación de cuenta.

La entrega Windows anterior permanece como antecedente. No reconstruir Tauri con este frontend web: requiere su servidor y la nueva ruta de autenticación.
