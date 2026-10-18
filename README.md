# Méntor Evaluador Inmobiliario

Base Windows compilada y probada. Consulte PLAN-DE-DESARROLLO.md para alcance de cada fase y ESTADO-FASE-1.md para pruebas y limitaciones. Abra `entregas/Mentor-Evaluador-Fase1.exe` con doble clic en este equipo.

## Desarrollo

Con Node, pnpm y las dependencias instaladas: `pnpm dev` abre el servidor local; `pnpm build` verifica TypeScript y genera recursos; `pnpm desktop` inicia Tauri cuando Rust/MSVC/WebView2 estén disponibles. `pnpm tauri build` genera distribución de Windows.

No hay datos demostrativos ni cálculos implementados. La navegación usa recursos locales y tipografías del sistema. SQLite y creación de proyectos corresponden a la siguiente fase.
