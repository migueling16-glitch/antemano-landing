"""
QR del menú de Ryo Café y tarjeta de barra lista para imprimir.

Genera, en public/ryo/qr/:
  - qr-menu.svg       vector (para imprenta o rotulación): café sobre champagne
  - qr-menu.png       el mismo, en mapa de bits
  - ryo-qr-barra-A6.pdf  tarjeta A6 vertical con el QR, el enlace escrito y el slogan
  - ryo-qr-barra-A6.png  vista previa de la tarjeta

Por qué así (investigación en src/ryo/README.md):
  - Nivel de corrección M (15 %): es el estándar para impresión limpia; un
    nivel más alto agrandaría el código sin necesidad.
  - Zona de silencio de 4 módulos, como pide la norma: no se le pone nada cerca.
  - Café #302413 sobre champagne #F8F3D1: contraste alto, oscuro sobre claro
    (los lectores lo prefieren). Nada de rojos ni degradados.
  - Se verifica leyendo el resultado (SVG, PNG y la tarjeta ya rasterizada).

Uso:   python scripts/ryo-qr.py
Requiere: pip install segno pymupdf zxing-cpp numpy
Las tipografías (JetBrains Mono) vienen de la carpeta de marca; si está en otro
lado, RYO_TIPOGRAFIAS=<carpeta>.
"""
import os
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
import numpy as np
import segno
import zxingcpp

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / 'public' / 'ryo' / 'qr'
SALIDA.mkdir(parents=True, exist_ok=True)

CAFE = '#302413'
CHAMPAGNE = '#f8f3d1'

# El enlace sale de config.ts: así nunca se desincroniza con el sitio.
config = (RAIZ / 'src' / 'ryo' / 'config.ts').read_text(encoding='utf-8')
URL = re.search(r"MENU_URL\s*=\s*'([^']+)'", config).group(1)
URL_LEGIBLE = URL.replace('https://', '')
SLOGAN = re.search(r"slogan:\s*'([^']+)'", config).group(1)

TIPOGRAFIAS = Path(os.environ.get(
    'RYO_TIPOGRAFIAS',
    'C:/Users/migue/OneDrive/Documents/RYO/Ryo Café-20260921T205332Z-1-001/Ryo Café/Tipografías',
))


def leer(img_bytes_or_path):
    """Decodifica con zxing-cpp: si no lee, el QR no sirve."""
    if isinstance(img_bytes_or_path, (str, Path)):
        pix = fitz.Pixmap(str(img_bytes_or_path))
    else:
        pix = fitz.Pixmap(img_bytes_or_path)
    if pix.alpha:
        pix = fitz.Pixmap(pix, 0)
    gris = fitz.Pixmap(fitz.csGRAY, pix)
    arr = np.frombuffer(gris.samples, dtype=np.uint8).reshape(gris.height, gris.width)
    return [r.text for r in zxingcpp.read_barcodes(arr)]


# ── 1. El código ──
qr = segno.make(URL, error='m', micro=False)
print(f'URL: {URL}')
print(f'Versión {qr.version}, {qr.symbol_size(border=0)[0]}×{qr.symbol_size(border=0)[0]} módulos, nivel {qr.error}')

svg_path = SALIDA / 'qr-menu.svg'
png_path = SALIDA / 'qr-menu.png'
qr.save(svg_path, scale=10, border=4, dark=CAFE, light=CHAMPAGNE, xmldecl=False, svgclass=None, lineclass=None)
qr.save(png_path, scale=24, border=4, dark=CAFE, light=CHAMPAGNE)

# Verificación: el PNG y el SVG rasterizado tienen que devolver exactamente el enlace.
leido_png = leer(png_path)
svg_doc = fitz.open(svg_path)
svg_pix = svg_doc[0].get_pixmap(dpi=300)
leido_svg = leer(svg_pix.tobytes('png'))
assert leido_png == [URL], f'PNG no lee bien: {leido_png}'
assert leido_svg == [URL], f'SVG no lee bien: {leido_svg}'
print('✓ El PNG y el SVG se leen y devuelven el enlace.')

# ── 2. La tarjeta A6 ──
ANCHO, ALTO = 297.64, 419.53  # A6 vertical en puntos
doc = fitz.open()
pag = doc.new_page(width=ANCHO, height=ALTO)


def color(hex_):
    h = hex_.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


pag.draw_rect(pag.rect, color=None, fill=color(CHAMPAGNE))

regular = TIPOGRAFIAS / 'JetBrainsMono-Regular.ttf'
cursiva = TIPOGRAFIAS / 'JetBrainsMono-Italic.ttf'
if not regular.exists():
    sys.exit(f'No encuentro la tipografía: {regular}. Define RYO_TIPOGRAFIAS.')
pag.insert_font(fontname='mono', fontfile=str(regular))
pag.insert_font(fontname='monoi', fontfile=str(cursiva))
f_reg = fitz.Font(fontfile=str(regular))
f_cur = fitz.Font(fontfile=str(cursiva))


def con_tracking(texto, y, tam, tracking_em, nombre='mono', fuente=f_reg):
    """Texto centrado con separación entre letras (el tracking de la marca)."""
    ancho = sum(fuente.text_length(c, fontsize=tam) for c in texto) + tracking_em * tam * (len(texto) - 1)
    x = (ANCHO - ancho) / 2
    for c in texto:
        pag.insert_text((x, y), c, fontname=nombre, fontsize=tam, color=color(CAFE))
        x += fuente.text_length(c, fontsize=tam) + tracking_em * tam


# Logotipo (viene en la misma carpeta de assets del sitio)
logo_svg = (RAIZ / 'src' / 'ryo' / 'assets' / 'logotipo.svg').read_text(encoding='utf-8')
logo_svg = logo_svg.replace('currentColor', CAFE)
logo_svg = re.sub(r'viewBox="[^"]*"', 'viewBox="38 35 469 369"', logo_svg, count=1)
logo_doc = fitz.open(stream=logo_svg.encode('utf-8'), filetype='svg')
logo_pdf = fitz.open('pdf', logo_doc.convert_to_pdf())
alto_logo = 66
ancho_logo = alto_logo * 469 / 369
pag.show_pdf_page(fitz.Rect((ANCHO - ancho_logo) / 2, 30, (ANCHO + ancho_logo) / 2, 30 + alto_logo), logo_pdf, 0)

con_tracking('MENÚ', 128, 11, 0.35)
pag.draw_line((ANCHO / 2 - 18, 136), (ANCHO / 2 + 18, 136), color=color(CAFE), width=0.7)

# QR: 190 pt (≈ 67 mm) con su zona de silencio incluida
lado = 190
qr_pdf = fitz.open('pdf', svg_doc.convert_to_pdf())
pag.show_pdf_page(fitz.Rect((ANCHO - lado) / 2, 150, (ANCHO + lado) / 2, 150 + lado), qr_pdf, 0)

con_tracking('ESCANEA PARA VER EL MENÚ', 360, 9, 0.18)
# El enlace escrito: si la cámara no lo lee, se puede teclear.
tam_url = 9.5
ancho_url = f_cur.text_length(URL_LEGIBLE, fontsize=tam_url)
pag.insert_text(((ANCHO - ancho_url) / 2, 376), URL_LEGIBLE, fontname='monoi', fontsize=tam_url, color=color(CAFE))
renglones = [r.strip() for r in re.split(r'(?<=,)\s+', SLOGAN)]
for i, r in enumerate(renglones):
    con_tracking(r, 398 + i * 11, 7, 0.3)

pdf_path = SALIDA / 'ryo-qr-barra-A6.pdf'
doc.save(pdf_path, garbage=4, deflate=True)
tarjeta_png = SALIDA / 'ryo-qr-barra-A6.png'
pix = pag.get_pixmap(dpi=300)
pix.save(tarjeta_png)

# Verificación de la tarjeta ya rasterizada, y también reducida (como la ve una cámara de lejos).
assert leer(pix.tobytes('png')) == [URL], 'La tarjeta no se lee a 300 dpi'
chico = pag.get_pixmap(dpi=90)
assert leer(chico.tobytes('png')) == [URL], 'La tarjeta no se lee a baja resolución'
print('✓ La tarjeta se lee a 300 dpi y a 90 dpi.')
print('Archivos:')
for p in (svg_path, png_path, pdf_path, tarjeta_png):
    print('  ', p.relative_to(RAIZ), f'({p.stat().st_size // 1024} KB)')
