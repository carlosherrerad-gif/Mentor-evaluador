# Méntor Evaluador Inmobiliario — Nuevo faseo

Objetivo: entregar una aplicación Windows instalable, completamente offline, con datos locales y siete módulos funcionales. Inicio: 18 de octubre de 2026. El usuario autorizó reorganizar las etapas y empezar. Esta autorización inicia la Fase 1; cada fase posterior requiere revisión de su entrega antes de continuar.

## Fases y puertas de salida

| Fase | Resultado utilizable | Alcance | Verificación para cerrar |
|---|---|---|---|
| 1 — Base ejecutable | Ventana Windows con navegación Méntor | Repositorio, React/TypeScript, Tauri 2, recursos locales, permisos mínimos y entorno de compilación | Compila, abre y navega sin red; registrar limitaciones del entorno |
| 2 — Proyectos que se conservan | Crear, guardar y reabrir terrenos y escenarios | SQLite, migraciones, borradores, autoguardado, duplicación, archivado e historial | Reiniciar sin perder datos; editar B sin alterar A; recuperación transaccional |
| 3 — Evaluación equivalente al original | Evaluar una configuración típica y obtener sus resultados | Motor puro, entradas y supuestos independientes, fórmulas físicas/económicas originales | Paridad contra referencias v20 y ejemplo económico del PDF; ninguna fórmula alterada |
| 4 — Edificios y expediente completos | Configurar propuestas reales por niveles | Plantas especiales, áreas manuales, sótanos, azoteas, dúplex por grupos, documentos y normativa | Áreas/unidades sin duplicación; fuentes compartidas por terreno; valores faltantes visibles |
| 5 — Economía configurable | Costear cada alternativa con sus propias condiciones | Tarifas general/diferenciada excluyentes, partidas manuales, ingresos condicionados y diagnóstico de información | No duplicar obra; conservar costos físicos en vista conservadora; aislamiento por escenario |
| 6 — Volumetría e imágenes | Explorar niveles y exportar PNG | Three.js local, selección por nivel, cámara, visibilidad y vista explotada | Geometría coincide con motor; fallo del visor no afecta cálculos |
| 7 — Comparador y biblioteca | Comparar y reutilizar configuraciones | Hasta cuatro escenarios del mismo terreno; plantillas/versiones/copias independientes | Cambios actualizan comparador; plantillas nuevas no alteran proyectos anteriores |
| 8 — Informes conservados | Emitir PDF ejecutivo y completo | Marca local, vista previa, A4 mixto, fuentes locales, advertencias y registro de emisión | Texto seleccionable, cifras consistentes, PDF anterior inmutable y generación offline |
| 9 — Producto distribuible | Instalador y recuperación integral | Respaldos/restauración, pruebas de sistema, WebView2 offline, licencias y guía | Instalar en Windows limpio sin red, restaurar todos los datos y archivos, ejecutar recorrido completo |

La base Windows de Fase 1 y la distribución de Fase 9 tienen objetivos distintos: comprobar temprano que la plataforma funciona y, al final, validar el producto completo en una máquina limpia.

## Reglas de ejecución

- La calculadora original permanece fuera del proyecto, sin modificaciones.
- Motor, interfaz, persistencia, geometría e informes tendrán responsabilidades separadas.
- No agregar servicios cloud ni recursos remotos obligatorios.
- No incorporar datos de mercado o normativa inventados.
- Los cálculos nuevos por niveles amplían la representación física; requieren reglas documentadas y casos de aceptación antes de implementarse.
- Mantener Number y redondeos originales durante la paridad; no introducir redondeo por partida sin aprobación.
- Mantener el límite original: 25% clasifica como alta; registrar discrepancia del PDF para decisión expresa antes de cambiarlo.
- Representar dúplex mediante grupos y cantidades; no construir inventario comercial individual de departamentos.
- Cada cierre informa archivos, pruebas ejecutadas, resultados, pendientes y estado recuperable en Git.

## Estado inicial de Fase 1

Se creó el código inicial de interfaz y configuración Tauri. Todavía no se declara ejecutable ni instalada la aplicación. En la revisión inicial se encontraron Node y pnpm; cargo no está en PATH ni en la ubicación habitual del usuario y no se encontró el instalador de Visual Studio en su ruta habitual. Esto no demuestra ausencia de todas las instalaciones posibles, pero obliga a verificar y preparar el entorno antes de compilar Windows.

Siguiente trabajo de Fase 1: resolver dependencias de desarrollo, instalar/verificar Rust y MSVC cuando sea necesario, compilar frontend y Tauri, ejecutar la ventana y probar navegación offline. No se considera cerrada la fase hasta obtener esa evidencia.
