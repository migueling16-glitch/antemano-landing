"""
Genera public/ryo/og.png (1200x630), la imagen que se ve al compartir el link.

Se rehace con:  python scripts/ryo-og.py

Usa el logotipo vectorial y JetBrains Mono con el tracking 100 del manual.
Requiere PyMuPDF (pip install pymupdf) y el TTF de la marca.
"""

import pathlib
import sys

import fitz  # PyMuPDF

PROJ = pathlib.Path(__file__).resolve().parent.parent
LOGO = PROJ / "public/ryo/marcas/logotipo-001-cafe.svg"
SALIDA = PROJ / "public/ryo/og.png"

# TTF del paquete de marca. Cambiar si la carpeta se mueve.
FUENTE = pathlib.Path(
    r"C:\Users\migue\OneDrive\Documents\RYO\Ryo Café-20260921T205332Z-1-001"
    r"\Ryo Café\Tipografías\JetBrainsMono-Regular.ttf"
)

CHAMPAGNE = (248 / 255, 243 / 255, 209 / 255)
CAFE = (48 / 255, 36 / 255, 19 / 255)
W, H = 1200, 630
TRACKING = 0.1  # 100 pts del manual


def main() -> int:
    if not FUENTE.exists():
        print(f"No encuentro la tipografía: {FUENTE}", file=sys.stderr)
        return 1

    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    page.draw_rect(fitz.Rect(0, 0, W, H), color=None, fill=CHAMPAGNE)
    # Filete de 1px, como los separadores del manual.
    page.draw_rect(fitz.Rect(40, 40, W - 40, H - 40), color=CAFE, width=1)

    svg = fitz.open(str(LOGO))
    pix = svg[0].get_pixmap(matrix=fitz.Matrix(4, 4), alpha=True)
    logo_w = 400
    logo_h = logo_w * pix.height / pix.width
    page.insert_image(
        fitz.Rect((W - logo_w) / 2, 118, (W + logo_w) / 2, 118 + logo_h), pixmap=pix
    )

    font = fitz.Font(fontfile=str(FUENTE))
    escritor = fitz.TextWriter(page.rect)

    def trackeado(y: float, texto: str, size: float) -> None:
        """Centra una línea aplicando el tracking del manual. Mono = avance constante."""
        avance = font.text_length("M", fontsize=size) + size * TRACKING
        ancho = avance * len(texto) - size * TRACKING
        x = (W - ancho) / 2
        for ch in texto:
            escritor.append((x, y), ch, font=font, fontsize=size)
            x += avance

    trackeado(505, "SOFT LIVING, DEEP SIPING.", 30)
    trackeado(562, "DURANGO, DGO.", 15)
    escritor.write_text(page, color=CAFE)

    page.get_pixmap(alpha=False).save(str(SALIDA))
    print(f"{SALIDA.relative_to(PROJ)} — {SALIDA.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
