# Edificio conceptual 3D

Entrega local 24/10/2026, dentro de Potencial inmobiliario. Acceso adicional desde Inicio.

Representación tridimensional con proyección ortográfica SVG, giro por arrastre o botones, inclinación, acercamiento y restablecimiento. Funciona sin dependencias, modelos externos ni llamadas de generación de imágenes.

Fachada arquitectónica con ventanas, balcones, acceso, jardineras y firma pequeña M MÉNTOR en un paño junto al acceso, siguiendo la marca tipográfica existente. Vista de análisis con colores para pisos típicos, especiales y sótanos. Selección de nivel mediante el modelo o selector accesible muestra las superficies y viviendas del motor existente. Sótanos y azotea se pueden ocultar.

Reglas visuales: un módulo bajo 10 m, dos desde 10 hasta menos de 16, tres desde 16 hasta menos de 22, cuatro desde 22 hasta menos de 28; luego uno más cada 6 m. Limitados por las viviendas registradas; ajuste opcional del frente principal. No representan distribución interior. La fachada lateral de esquina usa el fondo referencial; las apariciones en dos fachadas no añaden viviendas.

Retiro únicamente gráfico: 10 % de la dimensión perpendicular a cada calle, en un frente o en ambos de esquina. Lados colindantes sin retiro automático. No se escriben áreas, parámetros ni economía. Parcela rectangular referencial; el fondo se deriva de área/frente si falta el registrado y se identifica. Si falta el frente o toda referencia de fondo, se pide completar datos. Alturas ausentes usan referencias visuales explícitas (3 m por piso, 2.5 m por sótano, 2.8 m de azotea). Patios, topografía, retiros normativos y geometría real de superficies manuales requieren desarrollo posterior. Controles de vista temporales, sin cambios persistentes en el escenario.

Validación: TypeScript y Vite correctos, 73 pruebas automáticas aprobadas. Nuevas pruebas comprueban rangos, límite de viviendas, proporción de retiros, falta de dimensiones y ausencia de mutaciones del terreno. Revisión visual en base sintética separada: frente único y esquina, selección de piso especial (325 m² construidos, 240 m² vendibles y 2 viviendas), giro, modo análisis, sótanos y azotea ocultables. Sin desbordamiento horizontal a 1280 px. Evidencia: evidencia/modulo03-edificio-3d.png.

La evaluación económica sigue pendiente; expediente documental y adjuntos se reservan para una versión posterior. Sin publicación en internet ni migración de datos.
