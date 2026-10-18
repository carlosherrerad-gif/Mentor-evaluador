"""Reutiliza el favicon del original sin modificarlo."""
from pathlib import Path
import re
import base64
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = (root.parent / 'calculadora-potencial-terreno-v20.html').read_text(encoding='utf-8')
match = re.search(r'<link rel="icon"[^>]+base64,([^"]+)', source)
if not match:
    raise ValueError('No se encontró el favicon original')
icons = root / 'src-tauri' / 'icons'
icons.mkdir(exist_ok=True)
(icons / 'icon.png').write_bytes(base64.b64decode(match.group(1)))
Image.open(icons / 'icon.png').save(icons / 'icon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('Icono original copiado a PNG e ICO')
