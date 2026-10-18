# Fase 1 — Entrega inicial

Fecha: 18 de octubre de 2026. Estado: base ejecutable compilada y probada en Windows. Fase 1 completada; Fase 2 pendiente de revisión de esta entrega.

## Implementado

- Nuevo plan de nueve fases con criterios de cierre.
- Interfaz React/TypeScript con siete módulos navegables y estados vacíos explícitos.
- Estilo Méntor con recursos locales y fuentes del sistema.
- Configuración Tauri 2, ventana Windows y distribución NSIS con WebView2 offline prevista.
- CSP de producción y ventana sin permisos de archivos o sistema.
- Dependencias instaladas y lockfile generado; ejecución del script de esbuild permitida de forma explícita.
- Icono PNG e ICO recuperados del favicon embebido de la calculadora original, sin modificarla.
- Versiones nativas fijadas y Cargo.lock conservado: tauri 2.12.4, tauri-build 2.7.3 y CLI 2.12.3.

## Comprobaciones ejecutadas

- `pnpm install`: completado después de configurar la autorización del script de esbuild.
- `pnpm build`: aprobado; TypeScript sin errores y producción Vite generada (28 módulos).
- Diagnóstico inicial: WebView2 155.0.4283.62, Node 24.19.0 y pnpm 11.25.0; inicialmente faltaban Rust/Cargo y MSVC/SDK.
- Instalación autorizada completada: Microsoft Visual Studio Build Tools 2022 con herramientas C++ y SDK de Windows; Rust/Cargo 1.99.1.
- `pnpm tauri build --no-bundle`: compilación release aprobada, ejecutable Windows generado.
- `scripts/verificar-interfaz.cjs`: siete módulos comprobados en Edge; sin errores JS ni solicitudes a dominios externos detectadas; navegación tras desconectar red emulada.
- Mismo verificador conectado al WebView2 de la aplicación nativa: recarga y siete módulos con red emulada como desconectada, sin errores JS ni solicitudes externas detectadas. Captura revisada visualmente.
- Evidencias: `evidencia/prueba-interfaz.json`, `evidencia/prueba-windows.json`, `evidencia/ventana-windows.png`.
- El puerto de depuración se habilitó solo por variable de entorno del proceso de prueba. No está configurado en el ejecutable ni en la apertura normal.

## Límites de esta entrega

No se ha generado instalador ni probado una máquina limpia. La prueba offline usa emulación de red en WebView2; no se desconectó físicamente Windows. Se entrega la base ejecutable para este equipo con WebView2 instalado; distribución integral e instalación sin red corresponden a Fase 9. No hay persistencia ni cálculos: pertenecen a fases posteriores. La compilación emite una advertencia de obsolescencia de STATIC_VCRUNTIME del sistema de construcción, sin impedir generar el ejecutable.

## Cómo abrir

Ejecutar `entregas/Mentor-Evaluador-Fase1.exe` con doble clic. No necesita el servidor Vite. La vista previa en navegador es adicional al ejecutable. La entrega es una base de desarrollo, no una aplicación funcional de evaluación completa.

Fuentes técnicas consultadas: https://v2.tauri.app/start/prerequisites/ y https://v2.tauri.app/distribute/windows-installer/.

La calculadora HTML y el PDF original no se han modificado.
