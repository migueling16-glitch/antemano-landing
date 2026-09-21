"""
Saca el eje central (esqueleto) del isotipo de Ryo Café y lo guarda como
trazos sueltos en src/ryo/assets/isotipo-trazo.svg.

La página no dibuja ese archivo: lo usa como MÁSCARA sobre el isotipo real.
Así lo que aparece en pantalla siempre es el vector original del manual —
el esqueleto solo decide en qué orden y con qué ritmo se va destapando,
y se ve como una sola línea gruesa avanzando, no como un contorno.

Uso:  python scripts/ryo-centerline.py

Requiere PyMuPDF. Sin numpy: el adelgazamiento (Zhang-Suen) va en Python
puro sobre el conjunto de píxeles de tinta, que son pocos.
"""

import math
import pathlib
import sys

import fitz  # PyMuPDF

PROJ = pathlib.Path(__file__).resolve().parent.parent
ORIGEN = PROJ / "src/ryo/assets/isotipo.svg"
SALIDA = PROJ / "src/ryo/assets/isotipo-trazo.svg"

ESCALA = 1.0      # px por unidad de viewBox
UMBRAL = 128      # gris por debajo = tinta
TOLERANCIA = 1.1  # simplificación de polilíneas, en px
MIN_LARGO = 4     # descarta ramitas más cortas que esto (px)

VECINOS = [(-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)]


def rasterizar() -> tuple[set[tuple[int, int]], int, int, float, float]:
    """Pinta el SVG en negro sobre blanco y devuelve el conjunto de píxeles de tinta."""
    texto = ORIGEN.read_text(encoding="utf-8").replace('fill="currentColor"', 'fill="#000"')
    tmp = PROJ / "scripts/.centerline-tmp.svg"
    tmp.write_text(texto, encoding="utf-8")
    try:
        doc = fitz.open(str(tmp))
        pagina = doc[0]
        vb = pagina.rect
        pix = pagina.get_pixmap(matrix=fitz.Matrix(ESCALA, ESCALA), alpha=False, colorspace=fitz.csGRAY)
    finally:
        tmp.unlink(missing_ok=True)

    datos = pix.samples
    ancho, alto = pix.width, pix.height
    tinta = {
        (x, y)
        for y in range(alto)
        for x in range(ancho)
        if datos[y * pix.stride + x] < UMBRAL
    }
    # factor para volver a coordenadas del viewBox
    return tinta, ancho, alto, vb.width / ancho, vb.height / alto


def adelgazar(pixeles: set[tuple[int, int]]) -> set[tuple[int, int]]:
    """Zhang-Suen: deja la figura de un píxel de grosor conservando su forma."""
    S = set(pixeles)

    def vecindario(x: int, y: int):
        # P2..P9 en el orden del algoritmo (arriba, y en sentido horario)
        return [
            (x, y - 1), (x + 1, y - 1), (x + 1, y), (x + 1, y + 1),
            (x, y + 1), (x - 1, y + 1), (x - 1, y), (x - 1, y - 1),
        ]

    cambio = True
    while cambio:
        cambio = False
        for sub in (0, 1):
            marcados = []
            for (x, y) in S:
                v = vecindario(x, y)
                p = [1 if q in S else 0 for q in v]
                B = sum(p)
                if B < 2 or B > 6:
                    continue
                # transiciones 0->1 dando la vuelta
                A = sum(1 for i in range(8) if p[i] == 0 and p[(i + 1) % 8] == 1)
                if A != 1:
                    continue
                if sub == 0:
                    if p[0] * p[2] * p[4] or p[2] * p[4] * p[6]:
                        continue
                else:
                    if p[0] * p[2] * p[6] or p[0] * p[4] * p[6]:
                        continue
                marcados.append((x, y))
            if marcados:
                S.difference_update(marcados)
                cambio = True
    return S


def trazar(S: set[tuple[int, int]]) -> list[list[tuple[int, int]]]:
    """Recorre el esqueleto y lo parte en polilíneas (de punta a punta o a cruce)."""
    def vecinos(p):
        x, y = p
        return [(x + dx, y + dy) for dx, dy in VECINOS if (x + dx, y + dy) in S]

    grado = {p: len(vecinos(p)) for p in S}
    usados: set[frozenset] = set()
    polis: list[list[tuple[int, int]]] = []

    def recorrer(inicio, siguiente):
        linea = [inicio, siguiente]
        usados.add(frozenset((inicio, siguiente)))
        actual, previo = siguiente, inicio
        while grado[actual] == 2:
            paso = [q for q in vecinos(actual) if q != previo and frozenset((actual, q)) not in usados]
            if not paso:
                break
            q = paso[0]
            usados.add(frozenset((actual, q)))
            linea.append(q)
            previo, actual = actual, q
        return linea

    # primero desde puntas y cruces
    for p in sorted(S, key=lambda q: (grado[q] != 1, q)):
        if grado[p] == 2:
            continue
        for q in vecinos(p):
            if frozenset((p, q)) not in usados:
                polis.append(recorrer(p, q))

    # lo que quede son ciclos cerrados
    for p in sorted(S):
        for q in vecinos(p):
            if frozenset((p, q)) not in usados:
                polis.append(recorrer(p, q))

    return [l for l in polis if largo(l) >= MIN_LARGO]


def largo(linea) -> float:
    return sum(math.dist(linea[i], linea[i + 1]) for i in range(len(linea) - 1))


def simplificar(linea, tol):
    """Ramer-Douglas-Peucker, iterativo para no reventar la pila."""
    if len(linea) < 3:
        return linea
    guardar = [False] * len(linea)
    guardar[0] = guardar[-1] = True
    pila = [(0, len(linea) - 1)]
    while pila:
        ini, fin = pila.pop()
        ax, ay = linea[ini]
        bx, by = linea[fin]
        dx, dy = bx - ax, by - ay
        norma = math.hypot(dx, dy)
        peor, idx = 0.0, -1
        for i in range(ini + 1, fin):
            px, py = linea[i]
            if norma == 0:
                d = math.dist((px, py), (ax, ay))
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norma
            if d > peor:
                peor, idx = d, i
        if peor > tol and idx > 0:
            guardar[idx] = True
            pila.append((ini, idx))
            pila.append((idx, fin))
    return [p for p, k in zip(linea, guardar) if k]


def encadenar(polis, tol=2.5):
    """Une trazos que comparten punta siguiendo el ángulo más suave.

    El esqueleto se parte en cada cruce; sin esto la pluma se detendría
    a cada rato y el dibujo se vería a pedazos en vez de corrido.
    """
    lineas = [list(l) for l in polis]
    unido = True
    while unido:
        unido = False
        for i, a in enumerate(lineas):
            if not a:
                continue
            mejor, mejor_ang, voltear = -1, math.pi / 2.2, False  # no dobla más de ~80°
            for j, b in enumerate(lineas):
                if i == j or not b:
                    continue
                for rev in (False, True):
                    c = b[::-1] if rev else b
                    if math.dist(a[-1], c[0]) > tol:
                        continue
                    ang = giro(a[-2], a[-1], c[min(1, len(c) - 1)])
                    if ang < mejor_ang:
                        mejor, mejor_ang, voltear = j, ang, rev
            if mejor >= 0:
                b = lineas[mejor][::-1] if voltear else lineas[mejor]
                lineas[i] = a + b[1:]
                lineas[mejor] = []
                unido = True
    return [l for l in lineas if l]


def giro(a, b, c) -> float:
    """Cuánto se dobla la pluma al pasar de a→b a b→c, en radianes."""
    v1 = (b[0] - a[0], b[1] - a[1])
    v2 = (c[0] - b[0], c[1] - b[1])
    n1, n2 = math.hypot(*v1), math.hypot(*v2)
    if n1 == 0 or n2 == 0:
        return math.pi
    cos = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)))
    return math.acos(cos)


def ordenar(polis):
    """Encadena los trazos por cercanía: la pluma no salta de un lado a otro."""
    restantes = list(polis)
    restantes.sort(key=largo, reverse=True)
    salida = [restantes.pop(0)]
    while restantes:
        fin = salida[-1][-1]
        mejor, mejor_d, voltear = 0, float("inf"), False
        for i, l in enumerate(restantes):
            d0 = math.dist(fin, l[0])
            d1 = math.dist(fin, l[-1])
            # un trazo largo cercano vale más que uno corto cercano
            peso = 1.0 / (1.0 + largo(l) / 120.0)
            if d0 * peso < mejor_d:
                mejor, mejor_d, voltear = i, d0 * peso, False
            if d1 * peso < mejor_d:
                mejor, mejor_d, voltear = i, d1 * peso, True
        l = restantes.pop(mejor)
        salida.append(l[::-1] if voltear else l)
    return salida


def main() -> int:
    if not ORIGEN.exists():
        print(f"No encuentro {ORIGEN}", file=sys.stderr)
        return 1

    tinta, ancho, alto, fx, fy = rasterizar()
    print(f"tinta: {len(tinta)} px de {ancho}x{alto}")

    esqueleto = adelgazar(tinta)
    print(f"esqueleto: {len(esqueleto)} px")

    polis = encadenar(trazar(esqueleto))
    total = sum(largo(l) for l in polis)
    # área / longitud ≈ grosor medio del trazo original
    grosor = (len(tinta) / total) if total else 8
    print(f"trazos: {len(polis)} · largo total {total:.0f}px · grosor medio {grosor:.1f}px")

    polis = ordenar([simplificar(l, TOLERANCIA) for l in polis])

    # Un <path> por trazo, en orden de dibujo.
    #
    # No sirve meterlos como subtrazos de un solo path: SVG reinicia el patrón
    # de stroke-dasharray en cada subtrazo, así que un único stroke-dashoffset
    # no los va destapando en orden — o se ven todos o ninguno. La página los
    # anima uno por uno, encadenados.
    caminos = []
    for linea in polis:
        pts = [f"{x * fx:.1f} {y * fy:.1f}" for x, y in linea]
        caminos.append('<path d="M ' + " L ".join(pts) + '"/>')

    doc = fitz.open(str(ORIGEN))
    vb = doc[0].rect
    # la máscara tiene que tapar el trazo original con margen
    ancho_mascara = grosor * max(fx, fy) * 1.9 + 8

    SALIDA.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb.width:g} {vb.height:g}"'
        f' data-grosor="{ancho_mascara:.1f}">'
        + "".join(caminos)
        + "</svg>",
        encoding="utf-8",
    )
    print(f"{SALIDA.relative_to(PROJ)} — {SALIDA.stat().st_size} bytes, grosor de máscara {ancho_mascara:.1f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
