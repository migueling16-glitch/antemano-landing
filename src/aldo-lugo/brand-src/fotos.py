"""
ALDO chef LUGO · Mesa de Lumbre: fotos web del demo.

Lee los originales de La Tapada de Luna (solo lectura), aplica retoques puntuales de marcas ajenas, recorta,
aplica el tratamiento BRASA (color contenido) o CARBÓN (B/N virado a hueso), agrega grano sutil, quita todos
los metadatos y exporta AVIF + WebP en escalera y un JPEG de respaldo, más un LQIP WebP en base64.

Uso (desde la raíz del repo; siempre con -P, porque -I rompe Pillow en esta máquina):
    python -P src/aldo-lugo/brand-src/fotos.py                 # todo: fotos, fotos.json y og.jpg
    python -P src/aldo-lugo/brand-src/fotos.py --solo F080,F019 # solo esas fotos (fusiona en fotos.json)
    python -P src/aldo-lugo/brand-src/fotos.py --previa DIR     # dibuja los recortes sobre cada original en DIR
    python -P src/aldo-lugo/brand-src/fotos.py --hoja DIR       # hoja de contactos de lo exportado en DIR

Originales: 02_Fotos/00_Originales_Drive (cambia la ruta con la variable de entorno ALDO_FOTOS).

Escribe:
    public/aldo-lugo/fotos/<id>-<recorte>-<ancho>.{avif,webp,jpg}
    src/aldo-lugo/fotos.json        clave "<id>-<recorte>" (contrato en src/aldo-lugo/README.md)
    public/aldo-lugo/og.jpg         1200×630, F019 retocada con el logotipo en hueso

Reglas (propuesta §5 y §8.3, ESPEC §5): nunca se amplía; las marcas ajenas se evitan con el recorte y solo se
retocan donde la propuesta lo pide (F019, F363); sin fotos de la lista "evitar" de seleccion_fotos.md §8;
el horno de tierra (F289, F358) se acredita a los maestros mezcaleros; sin EXIF, XMP, GPS ni ICC.
"""
from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import io
import json
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
ORIGINALES = Path(os.environ.get("ALDO_FOTOS", r"C:\Users\migue\Videos\Canito\Chef Aldo Lugo\02_Fotos\00_Originales_Drive"))
INVENTARIO = ORIGINALES.parent / "_analisis" / "inventario.csv"
# Cuadros fijos sacados de los clips del evento (1080×1920) para platos sin foto: ids "Vxxx" (03_Video/_cuadros).
CUADROS = ORIGINALES.parents[1] / "03_Video" / "_cuadros"
SALIDA = RAIZ / "public" / "aldo-lugo" / "fotos"
JSON = RAIZ / "src" / "aldo-lugo" / "fotos.json"
OG = RAIZ / "public" / "aldo-lugo" / "og.jpg"
LOGO = AQUI / "originales" / "ALDO_LOGOTIPO-negro.png"
URL = "/aldo-lugo/fotos"

HUESO = np.array([237, 230, 214], np.float32) / 255  # --al-hueso #EDE6D6: tope del blanco en CARBÓN
CARBON_RGB = (20, 20, 20)  # --al-carbon
CREDITO_MEZCALEROS = "Horno de tierra de los maestros mezcaleros · ritual del evento"

PROPORCION = {"9x16": 9 / 16, "4x5": 4 / 5, "16x9": 16 / 9, "1x1": 1.0, "3x2": 3 / 2}

# Escaleras de anchos (contrato: 480/768/1080/1600, nunca por encima del recorte). El 1600 solo donde la foto
# se ve grande en escritorio; las miniaturas se quedan en 768. Así el total cabe en el presupuesto (≤ 25 MB).
GRANDE = (480, 768, 1080, 1600)
MEDIA = (480, 768, 1080)
MINI = (480, 768)

Q_AVIF, Q_WEBP, Q_JPG = 50, 72, 76


@dataclass
class Salida:
    id: str
    recorte: str
    caja: tuple[int, int, int, int]  # x0, y0, x1, y1 en píxeles del original (ya derecho por EXIF)
    alt: str
    anchos: tuple[int, ...] = MEDIA
    jpg: int = 960
    q_avif: int = Q_AVIF
    q_webp: int = Q_WEBP
    fondo: bool = False  # fondo del formulario: oscurecido 60 % y desenfocado en el export
    credito: str | None = None


@dataclass
class Foto:
    id: str
    tratamiento: str  # brasa | carbon
    salidas: list[Salida] = field(default_factory=list)
    noche: bool = False  # neutraliza el verde/cian de los LED
    dron: bool = False  # quita el aspecto HDR y calienta los medios
    mezcla_bn: tuple[float, float, float] = (0.50, 0.40, 0.10)  # CARBÓN: R .50 · G .40 · B .10 (piel: .45/.45/.10)
    retoques: list[dict] = field(default_factory=list)
    nota: str = ""


def S(id_, recorte, caja, alt, **kw) -> Salida:
    return Salida(id_, recorte, tuple(caja), alt, **kw)


# ---------------------------------------------------------------------------------------------------------------
# Inventario de fotos del demo (propuesta §5, recortes de seleccion_fotos.md §2–§3 y ESPEC §5.5 donde existen).
# Las cajas están en píxeles del original. Las verticales miden 2500 × 3750; las horizontales, 2500 × 1667 (dron 1665).
# ---------------------------------------------------------------------------------------------------------------
ALT_F080 = "Aldo Lugo frente al colgadero de hierro, con tomahawks sobre la leña encendida"
ALT_F019 = "Vista aérea al atardecer: mesas largas en cruz, la cocina de leña encendida y la ex hacienda bajo la sierra"
ALT_F013 = "La sierra de Durango al atardecer, con el valle y la hacienda en penumbra"
ALT_F009 = "Campo de agaves y la sierra vistos desde el dron"
ALT_F062 = "Pabellón de piedra con una pila de piñas de agave y luces colgantes"
ALT_F289 = "Piedra volcánica incandescente rodeada de piñas de agave en el horno de tierra de los maestros mezcaleros"
ALT_F139 = "Pollo entero amarrado con hilo y romero, colgado en el domo entre berenjenas"
ALT_F153 = "Mesa larga con bajoplatos de palma, en perspectiva"
ALT_F203 = "Aceitunas a la brasa con cubos de queso añejo en un plato de vidrio verde, visto desde arriba"
ALT_F216 = "Platos de loza verde con hummus, salchicha picante y pistache"

FOTOS: list[Foto] = [
    # ── v2 (guion GUION_LANDING_v2.md). Cajas compuestas a mano: coronilla al 12–25 % desde arriba, sujeto
    #    mirando hacia dentro, sin cortar cabeza, manos ni brasa. Sin invitados identificables ni marcas ajenas.
    # Escena 1 · Hero. Coronilla de Aldo en y≈1450: 9:16 la deja al 25 % con el fuego completo abajo; 4:5 al 18 %.
    Foto("F080", "brasa", [
        S("F080", "9x16", (324, 733, 1937, 3600), ALT_F080, anchos=MEDIA),
        S("F080", "4x5", (50, 955, 2250, 3705), ALT_F080, anchos=GRANDE),
    ]),
    # Escena 2 · Imagina (9:16 móvil, 4:5 escritorio)
    Foto("F013", "brasa", [
        S("F013", "9x16", (890, 0, 1827, 1665), ALT_F013, anchos=MEDIA),
        S("F013", "4x5", (694, 0, 2026, 1665), ALT_F013, anchos=MEDIA),
    ], dron=True, nota="Centrado en la hacienda (x≈1360) con la sierra y el cielo arriba."),
    Foto("F028", "brasa", [
        S("F028", "9x16", (391, 0, 2500, 3750), "Pollos enteros y berenjenas colgados sobre el fuego, con humo", anchos=MEDIA),
        S("F028", "4x5", (0, 300, 2500, 3425), "Pollos enteros y berenjenas colgados sobre el fuego, con humo", anchos=MEDIA),
    ]),
    Foto("F153", "brasa", [
        S("F153", "9x16", (0, 0, 2109, 3750), ALT_F153, anchos=MEDIA),
        S("F153", "4x5", (0, 400, 2500, 3525), ALT_F153, anchos=MEDIA),
    ]),
    Foto("F255", "brasa", [
        S("F255", "9x16", (1450, 0, 2388, 1667), "Banquete de noche bajo un árbol iluminado y estrellas de papel", anchos=MEDIA),
        S("F255", "4x5", (1300, 100, 2500, 1600), "Banquete de noche bajo un árbol iluminado y estrellas de papel", anchos=MEDIA),
    ], noche=True, nota="Siempre desde x ≥ 1300: fuera la carpa de Coca-Cola y el neón; los invitados quedan lejos."),
    # Escena 3 · El contraste (de B/N a color en el navegador; se exporta en color)
    Foto("F220", "brasa", [
        S("F220", "9x16", (0, 0, 2109, 3750), "Chapa de acero en llamas con tuétanos alrededor", anchos=MEDIA),
        S("F220", "4x5", (0, 30, 2125, 2686), "Chapa de acero con leña encendida al centro y tuétanos alrededor", anchos=MEDIA),
    ]),
    # Escena 4 · El que cuida el fuego. F042 mira a cámara (coronilla y≈1000 → 18 %); F249 coronilla y≈800 → 17 %.
    Foto("F042", "carbon", [S("F042", "4x5", (0, 505, 2200, 3255),
                              "Aldo Lugo mira a cámara con un lomo bridado sobre la brasa y costillares colgados arriba", anchos=MEDIA)],
         mezcla_bn=(0.45, 0.45, 0.10), nota="Termina en x 2200: fuera el cocinero de la derecha."),
    Foto("F249", "brasa", [S("F249", "4x5", (0, 269, 2500, 3394), "Aldo Lugo emplata a contraluz, al atardecer", anchos=GRANDE)]),
    # Escena 5 · Cada pieza pide su fuego
    Foto("F252", "brasa", [S("F252", "4x5", (0, 520, 2200, 3270), "Tomahawks colgados en un bastidor de hierro sobre la leña")]),
    Foto("F139", "brasa", [S("F139", "4x5", (0, 450, 2500, 3575), ALT_F139)]),
    Foto("F044", "brasa", [S("F044", "4x5", (0, 500, 2500, 3625), "Lomos bridados sobre la parrilla, entre llama y brasa")]),
    Foto("F250", "brasa", [S("F250", "4x5", (100, 350, 2400, 3225), "Zanahorias chamuscadas sobre brasa y ceniza")]),
    Foto("F140", "brasa", [S("F140", "4x5", (100, 1000, 2000, 3375), "Olla grande de risotto de hongos sobre la brasa")],
         nota="El recorte deja fuera la cara del cocinero de la derecha y a la persona del borde izquierdo."),
    # Escena 6 · Una noche real
    Foto("F019", "brasa", [
        S("F019", "16x9", (80, 0, 2500, 1361), ALT_F019, anchos=GRANDE),
        S("F019", "4x5", (644, 0, 1976, 1665), ALT_F019, anchos=MEDIA),
    ], dron=True,
         retoques=[
             dict(tipo="rellenar", caja=(1393, 690, 1481, 750), pluma=5),
             dict(tipo="limpiar_patron", poligono=[(1698, 660), (1893, 720), (1983, 710), (1983, 771), (1900, 792),
                                                   (1897, 858), (1880, 856), (1775, 814), (1768, 800), (1700, 782)], tam=19, umbral=0.10),
             dict(tipo="rellenar", caja=(1741, 756, 1765, 777), pluma=2),
             dict(tipo="rellenar", caja=(1766, 764, 1789, 793), pluma=2),
             dict(tipo="rellenar", caja=(1906, 889, 1937, 911), pluma=2),
             dict(tipo="rellenar", caja=(1944, 902, 1966, 916), pluma=2),
         ],
         nota="Retoque automático provisional (neón, insignia y patrón del food truck, letrero del carrito)."),
    Foto("F174", "brasa", [S("F174", "4x5", (940, 380, 1800, 1455), "La cocina de fuego abierta: pila de leña, domo colgante y humo bajo los mezquites")]),
    Foto("F216", "brasa", [S("F216", "4x5", (0, 350, 2500, 3475), ALT_F216)]),
    # Escena 7 · Tu mesa
    Foto("F307", "brasa", [S("F307", "4x5", (0, 350, 2500, 3475), "Tuétanos asados en platos de vidrio ámbar sobre una mesa de madera")]),
    Foto("F128", "brasa", [S("F128", "4x5", (470, 250, 2500, 2788), "Mesa larga al aire libre con los arcos de la hacienda al fondo")]),
    Foto("F006", "brasa", [S("F006", "4x5", (1000, 250, 2132, 1665), "Mesa larga montada con tejidos y centros de follaje, vista desde arriba")],
         dron=True),
    # Tarjeta Fuego de Marca (Aldo, 28-nov): el domo con piñas al atardecer. Los invitados del fondo quedan desenfocados.
    Foto("F261", "brasa", [S("F261", "4x5", (0, 320, 2500, 3445), "Domo de varilla con piñas, pollos y berenjenas colgados; al fondo, luces y mesas al atardecer")]),
    # Escena 6 y 10 · La noche y el cierre: brasa del horno de los maestros mezcaleros (con crédito)
    Foto("F289", "brasa", [
        S("F289", "4x5", (500, 0, 1833, 1667), ALT_F289, credito=CREDITO_MEZCALEROS),
        S("F289", "9x16", (843, 0, 1781, 1667), ALT_F289, anchos=MEDIA, credito=CREDITO_MEZCALEROS),
        S("F289", "16x9", (0, 300, 2180, 1526), ALT_F289, anchos=GRANDE, credito=CREDITO_MEZCALEROS),
    ], noche=True, nota="Todos los recortes terminan antes de x 2200: fuera la carretilla roja."),
    # Sección de platos (menú de La Tapada, 27-nov-2026). Solo el plato: sin caras ni marcas.
    Foto("F203", "brasa", [S("F203", "4x5", (380, 730, 2180, 2980), ALT_F203, anchos=MINI)]),
    Foto("F308", "brasa", [S("F308", "4x5", (300, 450, 2500, 3200), "Picadas con tuétanos asados en un plato de vidrio ámbar", anchos=MINI)], noche=True),
    Foto("F276", "brasa", [S("F276", "4x5", (200, 850, 2200, 3350), "Muhamara con kebab y almendras en platos de cerámica", anchos=MINI)], noche=True),
    Foto("F310", "brasa", [S("F310", "4x5", (150, 1450, 1950, 3700), "Risotto de hongos con cabrería rebanada y provolone rallado al momento", anchos=MINI)],
         noche=True, nota="Empieza en y 1450: fuera la cara del cocinero."),
    Foto("F251", "brasa", [S("F251", "4x5", (0, 500, 2500, 3625), "Tomahawks colgados de ganchos sobre la parrilla", anchos=MINI)]),
    Foto("F321", "brasa", [S("F321", "4x5", (280, 650, 2080, 2900), "Calabaza en tacha con helado de requesón y guayaba en un platito blanco", anchos=MINI)], noche=True),
    Foto("V055", "brasa", [S("V055", "4x5", (0, 470, 1080, 1820), "Pollo al romero colgado en el domo, entre berenjenas", anchos=MINI)]),
    # Correcciones de Aldo (27-nov): "Así se vive" con estructura y comida (cuadros de los clips, 1080 × 1920 = 9:16 completo)
    # y el cierre con fuego prendiendo de su cocina (carpeta de Canito, sin marca a la vista).
    Foto("V011", "brasa", [S("V011", "9x16", (0, 0, 1080, 1920), "Aldo Lugo entre el humo, junto al domo con piñas y berenjenas", anchos=MEDIA)]),
    Foto("V085", "brasa", [S("V085", "9x16", (0, 0, 1080, 1920), "Aldo Lugo emplata frente a una fila de platos", anchos=MEDIA)]),
    Foto("V142", "brasa", [S("V142", "9x16", (0, 0, 1080, 1920), "Picadas con tuétanos asados en un plato de vidrio ámbar, de noche", anchos=MEDIA)],
         noche=True),
    Foto("VC2068", "brasa", [
        S("VC2068", "9x16", (0, 0, 1080, 1920), "Leña ardiendo dentro de una reja de hierro", anchos=MEDIA),
        S("VC2068", "16x9", (0, 660, 1080, 1268), "Leña ardiendo dentro de una reja de hierro", anchos=MEDIA),
    ], noche=True, nota="Cuadro del clip C2068 (Clips Drive/Noviembre)."),
]

OG_CAJA = (80, 40, 2500, 1311)  # F019 (retocada), 1200 × 630; el recorte quita el neón Audi


# ---------------------------------------------------------------------------------------------------------------
# Utilidades de color (todo en float32, sRGB 0–1)
# ---------------------------------------------------------------------------------------------------------------
def a_float(im: Image.Image) -> np.ndarray:
    return np.asarray(im, dtype=np.float32) / 255.0


def a_img(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGB")


def luma(rgb: np.ndarray) -> np.ndarray:
    return rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def matiz(rgb: np.ndarray) -> np.ndarray:
    """Matiz en grados (0–360)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    c = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / c) % 6, np.where(mx == g, (b - r) / c + 2, (r - g) / c + 4))
    return (h * 60.0) % 360.0


def curva_s(x: np.ndarray, a: float) -> np.ndarray:
    """S de película normalizada (0→0, 1→1)."""
    lo, hi = 1 / (1 + np.exp(a / 2)), 1 / (1 + np.exp(-a / 2))
    return (1 / (1 + np.exp(-a * (x - 0.5))) - lo) / (hi - lo)


# Saturación por matiz (BRASA): naranjas y rojos intactos, global −18 %, verdes −40 %, cian y azul −50 %.
H_PTS = np.array([0, 15, 25, 42, 52, 62, 78, 95, 150, 175, 195, 250, 285, 320, 345, 360], np.float32)
F_DIA = np.array([.94, .98, 1.0, 1.0, .92, .80, .66, .60, .60, .55, .50, .50, .66, .80, .90, .94], np.float32)
F_NOCHE = np.array([.94, .98, 1.0, 1.0, .90, .74, .50, .40, .40, .36, .34, .36, .58, .78, .90, .94], np.float32)


def brasa(rgb: np.ndarray, noche=False, dron=False) -> np.ndarray:
    if dron:  # quita el aspecto HDR: devuelve parte del contraste local que el dron exagera, y calienta los medios
        L = luma(rgb)
        base = ndimage.gaussian_filter(L, sigma=max(4.0, rgb.shape[1] * 0.012))
        rgb = rgb + ((base + (L - base) * 0.82) - L)[..., None]
        m = np.clip(4 * L * (1 - L), 0, 1)[..., None]
        rgb = rgb * (1 + m * np.array([0.018, 0.0, -0.022], np.float32))
    rgb = np.clip(rgb, 0, 1)
    f = np.interp(matiz(rgb), H_PTS, F_NOCHE if noche else F_DIA).astype(np.float32)
    L = luma(rgb)[..., None]
    rgb = L + (rgb - L) * f[..., None]
    # Curva: negros profundos (0–4/255), S suave, hombro largo con blanco en 246/255
    x = np.clip((rgb - 0.014) / (1 - 0.014), 0, 1)
    x = 0.45 * x + 0.55 * curva_s(x, 4.2)
    return 0.004 + x * (0.965 - 0.004)


def carbon(rgb: np.ndarray, mezcla=(0.50, 0.40, 0.10)) -> np.ndarray:
    L = np.clip(rgb @ np.array(mezcla, np.float32), 0, 1)
    L = curva_s(L, 4.6)  # S más fuerte; el máximo vale 1
    t = np.clip((L - 0.66) / 0.34, 0, 1)[..., None]  # virado a hueso solo en el tercio alto
    return L[..., None] * (1 + (HUESO - 1) * t)


def grano(rgb: np.ndarray, semilla: int, fuerza: float = 2.2 / 255) -> np.ndarray:
    """Grano monocromo sutil, más presente en los medios tonos que en negros y blancos."""
    rng = np.random.default_rng(semilla)
    n = ndimage.gaussian_filter(rng.standard_normal(rgb.shape[:2]).astype(np.float32), 0.55)
    n /= n.std() + 1e-6
    L = luma(rgb)
    peso = 0.35 + 0.65 * np.clip(4 * L * (1 - L), 0, 1)
    return rgb + (n * peso * fuerza)[..., None]


def semilla(*partes) -> int:
    return int(hashlib.sha1("|".join(map(str, partes)).encode()).hexdigest()[:8], 16)


# ---------------------------------------------------------------------------------------------------------------
# Retoques (sobre el original, antes del recorte)
# ---------------------------------------------------------------------------------------------------------------
def pluma(mask: np.ndarray, r: float) -> np.ndarray:
    m = mask.astype(np.float32)
    return np.clip(ndimage.gaussian_filter(m, r) * 1.6, 0, 1) if r > 0 else m


def rellenar(arr: np.ndarray, caja, r_pluma=4, sem=0) -> None:
    """Relleno armónico (Laplace) del rectángulo desde su borde + grano del entorno: borra un letrero pequeño."""
    x0, y0, x1, y1 = caja
    m = 12
    X0, Y0, X1, Y1 = x0 - m, y0 - m, x1 + m, y1 + m
    sub = arr[Y0:Y1, X0:X1].copy()
    dentro = np.zeros(sub.shape[:2], bool)
    dentro[m:-m, m:-m] = True
    borde = ~dentro
    # arranque: convolución normalizada del borde (ya cerca de la solución), luego Jacobi
    w = ndimage.gaussian_filter(borde.astype(np.float32), 8)
    for c in range(3):
        v = ndimage.gaussian_filter(np.where(borde, sub[..., c], 0), 8)
        sub[..., c] = np.where(dentro, v / (w + 1e-6), sub[..., c])
    for _ in range(400):
        prom = (np.roll(sub, 1, 0) + np.roll(sub, -1, 0) + np.roll(sub, 1, 1) + np.roll(sub, -1, 1)) / 4
        sub[dentro] = prom[dentro]
    # textura: el ruido de alta frecuencia del anillo exterior, para que el parche no quede liso
    alta = luma(arr[Y0:Y1, X0:X1] - ndimage.gaussian_filter(arr[Y0:Y1, X0:X1], (1.5, 1.5, 0)))[borde]
    sd = min(0.02, 1.4826 * float(np.median(np.abs(alta - np.median(alta)))))  # MAD: ignora bordes y manchas
    rng = np.random.default_rng(sem)
    ruido = ndimage.gaussian_filter(rng.standard_normal(sub.shape[:2]).astype(np.float32), 0.8)
    ruido *= sd / (ruido.std() + 1e-6)
    sub[dentro] += ruido[dentro][:, None]
    alfa = np.zeros(sub.shape[:2], np.float32)
    alfa[m:-m, m:-m] = 1
    alfa = pluma(alfa > 0, r_pluma) if r_pluma else alfa
    arr[Y0:Y1, X0:X1] = arr[Y0:Y1, X0:X1] * (1 - alfa[..., None]) + sub * alfa[..., None]


def limpiar_patron(arr: np.ndarray, poligono, tam=17, umbral=0.10) -> None:
    """Quita las manchas oscuras pequeñas (íconos impresos) dentro de un polígono: cierre morfológico, solo en
    componentes chicas, para no tocar ventanas, llantas ni personas."""
    xs, ys = [p[0] for p in poligono], [p[1] for p in poligono]
    x0, y0, x1, y1 = min(xs) - tam, min(ys) - tam, max(xs) + tam, max(ys) + tam
    sub = arr[y0:y1, x0:x1]
    mask_img = Image.new("L", (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(mask_img).polygon([(x - x0, y - y0) for x, y in poligono], fill=255)
    poly = np.asarray(mask_img) > 0
    liso = ndimage.gaussian_filter(sub, (1.2, 1.2, 0))  # sin el ruido del sensor, que uniría las manchas
    cerrado = np.stack([ndimage.grey_closing(liso[..., c], size=(tam, tam)) for c in range(3)], -1)
    oscuro = (luma(cerrado) - luma(liso)) > umbral  # el tamaño se juzga completo, aunque la mancha salga del polígono
    etiquetas, n = ndimage.label(oscuro)
    if n:
        areas = ndimage.sum(np.ones_like(etiquetas), etiquetas, index=np.arange(1, n + 1))
        cajas = ndimage.find_objects(etiquetas)
        chicas = np.zeros(n + 1, bool)
        for i, (a, sl) in enumerate(zip(areas, cajas), start=1):
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            chicas[i] = a <= tam * tam * 1.6 and max(h, w) <= tam * 2.2
        manchas = chicas[etiquetas] & poly
    else:
        manchas = np.zeros_like(poly)
    manchas = ndimage.binary_dilation(manchas, iterations=2)
    suave = np.stack([ndimage.gaussian_filter(cerrado[..., c], 1.2) for c in range(3)], -1)
    alfa = pluma(manchas, 1.2)[..., None] * poly[..., None]
    arr[y0:y1, x0:x1] = sub * (1 - alfa) + suave * alfa


def borrar_impresion(arr: np.ndarray, caja, umbral=0.09, sem=0) -> None:
    """Borra lo impreso (letras, logos) sobre una superficie lisa: lo que se aparta del color mediano de la caja se
    rellena con el color vecino de la propia superficie. La caja debe quedar dentro de esa superficie."""
    x0, y0, x1, y1 = caja
    sub = arr[y0:y1, x0:x1]
    liso = ndimage.gaussian_filter(sub, (0.8, 0.8, 0))
    med = np.median(liso.reshape(-1, 3), axis=0)
    marca = ndimage.binary_dilation(np.abs(liso - med).max(-1) > umbral, iterations=2)
    queda = (~marca).astype(np.float32)
    peso = ndimage.gaussian_filter(queda, 5)
    relleno = ndimage.gaussian_filter(sub * queda[..., None], (5, 5, 0)) / (peso[..., None] + 1e-6)
    relleno = np.where(peso[..., None] > 0.05, relleno, med)
    rng = np.random.default_rng(sem)
    relleno += (rng.standard_normal(sub.shape[:2]).astype(np.float32) * 0.008)[..., None]
    alfa = pluma(marca, 1.0)[..., None]
    arr[y0:y1, x0:x1] = sub * (1 - alfa) + relleno * alfa


def retocar(arr: np.ndarray, foto: Foto) -> np.ndarray:
    for i, r in enumerate(foto.retoques):
        if r["tipo"] == "rellenar":
            rellenar(arr, r["caja"], r.get("pluma", 4), semilla(foto.id, i))
        elif r["tipo"] == "limpiar_patron":
            limpiar_patron(arr, r["poligono"], r.get("tam", 17), r.get("umbral", 0.10))
        elif r["tipo"] == "borrar_impresion":
            borrar_impresion(arr, r["caja"], r.get("umbral", 0.09), semilla(foto.id, i))
    return arr


# ---------------------------------------------------------------------------------------------------------------
# Carga, recorte, tratamiento y exporte
# ---------------------------------------------------------------------------------------------------------------
def inventario() -> dict[str, str]:
    with open(INVENTARIO, encoding="utf-8-sig", newline="") as f:
        return {r["id"]: r["archivo"] for r in csv.DictReader(f)}


def cargar(foto: Foto, inv: dict[str, str]) -> np.ndarray:
    ruta = CUADROS / f"{foto.id}.jpg" if foto.id.startswith("V") else ORIGINALES / inv[foto.id]
    with Image.open(ruta) as im:
        im = ImageOps.exif_transpose(im)
        icc = im.info.get("icc_profile")
        if icc:  # a sRGB si trae otro perfil (los de este lote ya son sRGB IEC61966-2.1)
            from PIL import ImageCms
            perfil = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            if "srgb" not in (ImageCms.getProfileDescription(perfil) or "").lower():
                im = ImageCms.profileToProfile(im, perfil, ImageCms.createProfile("sRGB"), outputMode="RGB")
        arr = a_float(im.convert("RGB"))
    return retocar(arr, foto) if foto.retoques else arr


def ajustar_caja(caja, recorte, W, H) -> tuple[int, int, int, int]:
    """Valida la caja y la recorta a la proporción exacta (encoge alrededor del centro)."""
    x0, y0, x1, y1 = caja
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    w, h, r = x1 - x0, y1 - y0, PROPORCION[recorte]
    if w / h > r:
        nw = round(h * r)
        x0 += (w - nw) // 2
        x1 = x0 + nw
    else:
        nh = round(w / r)
        y0 += (h - nh) // 2
        y1 = y0 + nh
    return x0, y0, x1, y1


def escalera(anchos, w_caja) -> list[int]:
    validos = [a for a in anchos if a <= w_caja]
    # si el recorte rebasa en ≥ 15 % el último peldaño (y no llega al siguiente), su ancho nativo es un peldaño más
    if w_caja not in validos and (not validos or w_caja >= validos[-1] * 1.15) and len(validos) < len(anchos):
        validos.append(w_caja)
    return validos


def reducir(im: Image.Image, w: int) -> Image.Image:
    if w == im.width:
        return im.copy()
    r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    return r.filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))


def limpio(im: Image.Image) -> Image.Image:
    """Imagen nueva sin info (EXIF, XMP, ICC)."""
    n = Image.frombytes("RGB", im.size, im.convert("RGB").tobytes())
    n.info = {}
    return n


def guardar(im: Image.Image, nombre: str, fmt: str, **kw) -> int:
    ruta = SALIDA / nombre
    limpio(im).save(ruta, fmt, **kw)
    return ruta.stat().st_size


def procesar(foto: Foto) -> tuple[dict, list[str], dict]:
    t = time.time()
    inv = inventario()
    arr = cargar(foto, inv)
    H, W = arr.shape[:2]
    entradas, avisos, pesos = {}, [], {}
    for s in foto.salidas:
        caja = ajustar_caja(s.caja, s.recorte, W, H)
        if caja != s.caja:
            d = max(abs(a - b) for a, b in zip(caja, s.caja))
            if d > 6:
                avisos.append(f"{s.id}-{s.recorte}: la caja {s.caja} se ajustó a {caja}")
        x0, y0, x1, y1 = caja
        wc = x1 - x0
        anchos = escalera(s.anchos, wc)
        if not anchos:
            raise ValueError(f"{s.id}-{s.recorte}: el recorte mide {wc} px, menos que {s.anchos[0]}")
        wmax = max(anchos)
        base = a_img(arr[y0:y1, x0:x1])
        if wmax != wc:
            base = base.resize((wmax, round(base.height * wmax / base.width)), Image.LANCZOS)
        rgb = a_float(base)
        rgb = carbon(rgb, foto.mezcla_bn) if foto.tratamiento == "carbon" else brasa(rgb, foto.noche, foto.dron)
        if s.fondo:  # fondo del formulario: oscurecido 60 % y desenfocado (horneado, nunca con CSS)
            rgb = ndimage.gaussian_filter(rgb, (wmax * 0.007, wmax * 0.007, 0)) * 0.4
        tratada = a_img(np.clip(rgb, 0, 1))
        clave = f"{s.id}-{s.recorte}"
        e = {"id": s.id, "recorte": s.recorte, "tratamiento": foto.tratamiento, "ancho": 0, "alto": 0,
             "anchos": anchos, "avif": [], "webp": [], "jpg": "", "lqip": None, "alt": s.alt}
        if s.credito:
            e["credito"] = s.credito
        for w in anchos:
            r = reducir(tratada, w)
            r = a_img(np.clip(grano(a_float(r), semilla(clave, w), (1.6 if s.fondo else 2.2) / 255), 0, 1))
            n_avif = f"{clave}-{w}.avif"
            n_webp = f"{clave}-{w}.webp"
            pesos[n_avif] = guardar(r, n_avif, "AVIF", quality=s.q_avif, speed=4)
            pesos[n_webp] = guardar(r, n_webp, "WEBP", quality=s.q_webp, method=6)
            e["avif"].append(f"{URL}/{n_avif}")
            e["webp"].append(f"{URL}/{n_webp}")
            e["ancho"], e["alto"] = r.size
        wj = min(s.jpg, wc)
        rj = reducir(tratada, wj) if wj <= tratada.width else tratada
        rj = a_img(np.clip(grano(a_float(rj), semilla(clave, "jpg"), 2.0 / 255), 0, 1))
        n_jpg = f"{clave}-{rj.width}.jpg"
        pesos[n_jpg] = guardar(rj, n_jpg, "JPEG", quality=Q_JPG, optimize=True, progressive=True, subsampling="4:2:0")
        e["jpg"] = f"{URL}/{n_jpg}"
        # LQIP ~24 px, WebP en base64
        lq = limpio(tratada.resize((24, max(1, round(24 * tratada.height / tratada.width))), Image.LANCZOS))
        b = io.BytesIO()
        lq.save(b, "WEBP", quality=40, method=6)
        e["lqip"] = "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode("ascii")
        entradas[clave] = e
    print(f"  {foto.id}: {len(foto.salidas)} recorte(s) en {time.time() - t:.1f} s", flush=True)
    return entradas, avisos, pesos


def og(inv: dict[str, str]) -> int:
    foto = next(f for f in FOTOS if f.id == "F019")
    arr = cargar(foto, inv)
    x0, y0, x1, y1 = OG_CAJA
    base = a_img(arr[y0:y1, x0:x1]).resize((1200, 630), Image.LANCZOS)
    rgb = brasa(a_float(base), dron=True)
    # degradado de carbón abajo para el logotipo (centrado: sobrevive al recorte cuadrado de las vistas previas)
    y = np.linspace(0, 1, 630, dtype=np.float32)[:, None, None]
    sombra = np.clip((y - 0.45) / 0.55, 0, 1) ** 1.2 * 0.9
    rgb = rgb * (1 - sombra) + np.array(CARBON_RGB, np.float32) / 255 * sombra
    im = a_img(np.clip(grano(rgb, semilla("og"), 2.0 / 255), 0, 1))
    with Image.open(LOGO) as lg:
        alfa = lg.convert("RGBA").getchannel("A")
    ancho = 440
    alfa = alfa.resize((ancho, round(alfa.height * ancho / alfa.width)), Image.LANCZOS)
    tinta = Image.new("RGB", alfa.size, tuple(int(v * 255) for v in HUESO))
    im.paste(tinta, ((1200 - ancho) // 2, 630 - 46 - alfa.height), alfa)
    limpio(im).save(OG, "JPEG", quality=82, optimize=True, progressive=True)
    return OG.stat().st_size


# ---------------------------------------------------------------------------------------------------------------
# Verificación
# ---------------------------------------------------------------------------------------------------------------
def verificar_meta(rutas) -> list[str]:
    malos = []
    for p in rutas:
        with Image.open(p) as im:
            if len(im.getexif()) or {"icc_profile", "xmp", "exif"} & set(im.info):
                malos.append(p.name)
        if b"http://ns.adobe.com/xap" in p.read_bytes():
            malos.append(p.name)
    return malos


def previa(destino: Path, ids: set[str] | None) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    inv = inventario()
    colores = ["#ff3b30", "#34c759", "#0a84ff", "#ffd60a"]
    for foto in FOTOS:
        if ids and foto.id not in ids:
            continue
        arr = cargar(foto, inv)
        im = a_img(arr)
        W, H = im.size
        esc = 900 / max(W, H)
        p = im.resize((round(W * esc), round(H * esc)), Image.LANCZOS)
        d = ImageDraw.Draw(p)
        for i, s in enumerate(foto.salidas):
            x0, y0, x1, y1 = ajustar_caja(s.caja, s.recorte, W, H)
            d.rectangle([x0 * esc, y0 * esc, x1 * esc - 1, y1 * esc - 1], outline=colores[i % 4], width=3)
            d.text((x0 * esc + 6, y0 * esc + 6 + 12 * i), s.recorte, fill=colores[i % 4])
        p.save(destino / f"{foto.id}-previa.jpg", quality=85)
        print("  previa", foto.id)


def hoja(destino: Path) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    datos = json.loads(JSON.read_text(encoding="utf-8"))
    miniaturas = []
    for clave, e in sorted(datos.items()):
        with Image.open(RAIZ / "public" / e["jpg"].lstrip("/")) as im:
            t = im.convert("RGB")
            t.thumbnail((300, 300))
            miniaturas.append((clave, t))
    cols, celda = 6, 320
    filas = (len(miniaturas) + cols - 1) // cols
    h = Image.new("RGB", (cols * celda, filas * (celda + 20)), (30, 30, 30))
    d = ImageDraw.Draw(h)
    for i, (clave, t) in enumerate(miniaturas):
        x, y = (i % cols) * celda, (i // cols) * (celda + 20)
        h.paste(t, (x + (celda - t.width) // 2, y + 20 + (celda - t.height) // 2))
        d.text((x + 6, y + 4), clave, fill=(237, 230, 214))
    h.save(destino / "hoja-fotos.jpg", quality=82)
    print("  hoja", destino / "hoja-fotos.jpg")


# ---------------------------------------------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--solo", help="ids separados por coma (F080,F019): exporta solo esas y fusiona en fotos.json")
    ap.add_argument("--previa", type=Path, help="dibuja los recortes sobre cada original (retocado) en esta carpeta")
    ap.add_argument("--hoja", type=Path, help="hoja de contactos de lo exportado en esta carpeta")
    ap.add_argument("--sin-og", action="store_true", help="no regenera og.jpg")
    ap.add_argument("--procesos", type=int, default=max(1, min(6, (os.cpu_count() or 2) - 1)))
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ids = {x.strip().upper() for x in a.solo.split(",")} if a.solo else None
    if a.previa:
        previa(a.previa, ids)
        return 0
    if a.hoja:
        hoja(a.hoja)
        return 0
    if not ORIGINALES.exists():
        print(f"No encuentro los originales en {ORIGINALES} (variable ALDO_FOTOS).", file=sys.stderr)
        return 1
    SALIDA.mkdir(parents=True, exist_ok=True)
    lote = [f for f in FOTOS if not ids or f.id in ids]
    if ids and len(lote) != len(ids):
        print(f"Ids desconocidos: {sorted(ids - {f.id for f in lote})}", file=sys.stderr)
        return 1
    t = time.time()
    print(f"Exportando {sum(len(f.salidas) for f in lote)} recortes de {len(lote)} fotos con {a.procesos} procesos…", flush=True)
    entradas, avisos, pesos = {}, [], {}
    with ProcessPoolExecutor(a.procesos) as ex:
        for e, av, ps in ex.map(procesar, lote):
            entradas.update(e)
            avisos += av
            pesos.update(ps)
    if ids and JSON.exists():
        previo = json.loads(JSON.read_text(encoding="utf-8") or "{}")
        previo.update(entradas)
        entradas = previo
    else:  # corrida completa: se borran los exportes huérfanos
        for p in SALIDA.iterdir():
            if p.is_file() and p.name not in pesos:
                p.unlink()
                print(f"  huérfano borrado: {p.name}")
    JSON.write_text(json.dumps(dict(sorted(entradas.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not a.sin_og and (not ids or "F019" in ids):
        kb = og(inventario()) / 1024
        print(f"  og.jpg: {kb:.0f} KB")
        if kb > 200:
            avisos.append(f"og.jpg pesa {kb:.0f} KB (> 200 KB)")
    # topes
    for clave in ("F080-4x5", "F080-9x16"):
        n = f"{clave}-1080.avif"
        if n in pesos and pesos[n] / 1024 > 180:
            avisos.append(f"{n}: {pesos[n] / 1024:.0f} KB > 180 KB")
    total = sum(p.stat().st_size for p in SALIDA.iterdir() if p.is_file())
    if total > 25 * 1024 * 1024:
        avisos.append(f"public/aldo-lugo/fotos pesa {total / 1048576:.1f} MB (> 25 MB)")
    malos = verificar_meta([p for p in SALIDA.iterdir() if p.is_file()] + ([OG] if OG.exists() else []))
    if malos:
        avisos.append("Con metadatos: " + ", ".join(malos))
    print(f"Listo en {time.time() - t:.0f} s · {len(entradas)} entradas en fotos.json · "
          f"{len(list(SALIDA.iterdir()))} archivos · {total / 1048576:.2f} MB")
    for av in avisos:
        print("AVISO:", av)
    return 2 if avisos else 0


if __name__ == "__main__":
    sys.exit(main())
