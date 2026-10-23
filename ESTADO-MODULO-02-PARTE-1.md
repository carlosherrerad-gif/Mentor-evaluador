# Módulo 02 · Parte 1 — Terreno y valorización

Implementada localmente el 23/10/2026, conforme al esquema aprobado. Acceso en Datos del proyecto → Terreno.

## Entrega

- Ubicación existente del proyecto, partida registral (texto), área, frente, fondo, forma, frentes, esquina, topografía y observaciones propias del terreno.
- Borradores incompletos. Los datos numéricos registrados deben ser positivos; los conteos, enteros. No se inventan dimensiones. Diferencias superiores al 1 % entre área y frente × fondo producen advertencia solo para terrenos rectangulares.
- Oferta y valor comercial compartidos. Importe total o por m² como dato de origen, moneda PEN/USD, fecha y fuente. El valor derivado depende del área; no se realizan conversiones monetarias. Sin área no se permite convertir un importe existente entre ambas bases para evitar perderlo.
- Compra o terreno propio/costo de oportunidad por escenario, con importe, moneda, fecha, fuente y justificación. Copiar oferta o valor comercial requiere acción explícita y conserva su origen; no crea una vinculación automática.
- Guardado automático y botón de guardado inmediato. Conflictos y errores conservan el borrador; cargar la versión del servidor consulta datos recientes y requiere confirmar el descarte. Advertencia al salir con cambios pendientes.
- Los cambios de área marcan los escenarios como pendientes de actualización, sin borrar resultados ni modificar sus adquisiciones. Los motores que consumirán esa marca se desarrollarán en sus partes respectivas.
- Solo administradores modifican terreno y ubicación compartida; editores y administradores modifican adquisición; lectores consultan. Se comprueba en el servidor, también en la ruta anterior de edición del proyecto.
- Biblioteca de referencias de mercado de entrada manual, separada de modelos y normativa: distrito, tipo de lote, moneda, banda/mediana, fuente, fecha, muestra, área máxima y metodología. Versiones conservadas; actualización reservada al autor. Cada expediente puede conservar una copia de la versión consultada. No modifica precios ni realiza tasaciones.
- Se avisa de distritos diferentes o área fuera del alcance registrado. No se cargaron precios externos sin verificar.
- Duplicación y respaldo JSON incluyen terreno, referencias consultadas y adquisiciones. La biblioteca global de mercado no se incluye en ese respaldo; su copia consultada sí. Se mantiene compatibilidad con los respaldos anteriores sin ficha de terreno.

## Verificación

Compilación TypeScript/Vite aprobada. Suite completa: 29 pruebas aprobadas, incluidas seis pruebas nuevas de API que verifican validación, permisos, escenarios independientes, concurrencia, respaldo/duplicación y referencias versionadas. Migración aditiva de SQLite a versión 3 comprobada.

Recorrido de navegador realizado sobre base sintética separada: terreno de 500 m², frente de 15 m y fondo de 30 m, advertencia de diferencia, partida 0000123, oferta PEN 1 500 000 = PEN 3 000/m², valor comercial PEN 2 700/m² = PEN 1 350 000, adquisición independiente PEN 1 250 000 = PEN 2 500/m² y referencia sintética con instantánea. Valores conservados tras recargar. Sin errores de consola ni desbordamiento horizontal en la vista revisada.

## Alcance pendiente

No incluye edificio, motor físico/económico, documentos, tasación automática, conversión monetaria, visualización 3D ni publicación. Los adjuntos y respaldo completo de archivos se implementarán en las partes 6 y 7. La siguiente parte requiere presentar su esquema y obtener aprobación antes de construirla.

Se creó un respaldo consistente de la base existente antes de su actualización, dentro de data/backups. Los datos sintéticos de prueba no se incorporaron en ella.
