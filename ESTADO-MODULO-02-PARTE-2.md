# Módulo 02 · Parte 2 — Edificio base

Implementada localmente conforme al esquema aprobado. Acceso: Datos del proyecto → Edificio, con escenario activo seleccionado.

## Funciones

- Edificio multifamiliar por escenario; pisos sobre el terreno (1–200), ocupación propuesta, departamentos, altura típica y observaciones.
- Planta típica con áreas construidas y vendibles automáticas o manuales. Construida automática = área del terreno × ocupación; vendible automática = construida × eficiencia. No hay porcentajes normativos precargados ni descuento geométrico de retiros.
- Pisos especiales únicos dentro del edificio; sustituyen la planta típica. Pueden tener áreas, departamentos y alturas distintos. Una altura especial vacía utiliza la típica. Al reducir pisos se pide confirmar el retiro de excepciones que queden fuera.
- Cero departamentos implica cero área vendible residencial, conservando la construida. No se divide entre cero.
- Cuadro de pisos con origen automático/manual, promedio por departamento y altura; resumen de viviendas, superficies, promedio y altura total de niveles.
- Los totales incompletos muestran Pendiente. El área vendible no puede superar la construida correspondiente cuando ambas están definidas. Se permiten borradores incompletos.
- Las áreas automáticas usan el terreno actual. Las manuales permanecen y requieren revisión explícita al cambiar el área o aplicarse a un terreno diferente. La comprobación de compatibilidad urbanística completa queda pendiente.
- Guardado automático, conflictos de revisión de escenario y terreno, historial y permisos de servidor. Editor y administrador modifican, lector consulta.
- La economía anterior se conserva y los cambios del edificio marcan sus resultados pendientes de actualización.
- Edificios completos como plantillas versionadas, incluyendo planta típica y excepciones. Aplicación por copia independiente; precios y terreno no se transfieren. La biblioteca conserva la estructura al crear nuevas versiones.
- Duplicación y respaldo/restauración del proyecto conservan las nuevas configuraciones. No fue necesaria una nueva migración de esquema; se utilizan las configuraciones existentes.

## Verificación

Compilación TypeScript/Vite correcta y 36 pruebas aprobadas. Se añadieron siete pruebas de cálculo/API para casos completos e incompletos, lobby sin viviendas, manuales, validaciones, permisos, concurrencia, plantillas y respaldo.

Recorrido visual sobre base sintética separada: 500 m² de terreno, 12 pisos, ocupación 65 %, eficiencia 85 %, altura típica 3 m y cuatro departamentos por planta. Pisos 1 y 12 con dos departamentos y 240 m² vendibles manuales. Resultado: 44 viviendas, 3 900 m² construidos, 3 242,50 m² vendibles, 73,69 m² promedio y 36 m de altura de niveles. Configuración conservada tras volver a abrir; plantilla guardada mediante la interfaz. Sin errores de consola ni desbordamiento horizontal general en la vista revisada.

La comprobación automatizada del diálogo nativo de confirmación al reducir pisos encontró una limitación del navegador de pruebas; no se certifica ese recorrido como probado visualmente. Las validaciones del servidor de pisos y excepciones sí están probadas.

## Próxima parte

Sótanos, estacionamientos, azotea y dúplex requieren su propio esquema y autorización. No se implementaron costos, rentabilidad, visor 3D ni aprobación normativa. La publicación por internet sigue pendiente.

Se creó respaldo consistente de la base existente antes de activar la entrega. Las pruebas utilizaron datos sintéticos separados.
