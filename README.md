# Méntor Evaluador Inmobiliario

Base inicial de desarrollo. Consulte PLAN-DE-DESARROLLO.md para alcance y aceptación de cada fase. No existe todavía una versión Windows compilada.

## Desarrollo

Con Node, pnpm y las dependencias instaladas: `pnpm dev` abre el servidor local; `pnpm build` verifica TypeScript y genera recursos; `pnpm desktop` inicia Tauri cuando Rust/MSVC/WebView2 estén disponibles. `pnpm tauri build` genera distribución de Windows.

No hay datos demostrativos ni cálculos implementados. La navegación usa recursos locales y tipografías del sistema. SQLite y creación de proyectos corresponden a la siguiente fase.
