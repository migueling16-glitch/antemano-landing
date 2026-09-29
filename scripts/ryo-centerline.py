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

# Margen de la máscara sobre el grosor real del trazo. Lo justo para taparlo:
# si sobra, un trazo gordo que pasa cerca de un detalle fino (los ojos) lo
# destapa antes de tiempo.
MARGEN_MASCARA = 1.8
MARGEN_FIJO = 5.0

# ── Elementos del dibujo ──────────────────────────────────────────────
# El isotipo es un solo path compuesto: sus subtrazos son la silueta y los
# huecos, no las líneas sueltas. Así que las piezas se separan por dónde caen,
# con polígonos trazados sobre el mapa que imprime este script con --mapa.
# Coordenadas en unidades del viewBox (553 x 440).
ORDEN_GRUPOS = ["taza", "cafe", "persona", "ojos"]

REGIONES = {
    "cabeza": [(246, 28), (344, 28), (344, 124), (246, 124)],
    "brazo-izq": [(300, 88), (308, 130), (150, 130), (120, 146), (100, 134),
                  (126, 100), (230, 88)],
    "brazo-der": [(306, 92), (324, 142), (420, 154), (454, 176), (468, 158),
                  (430, 130), (338, 96)],
    "piernas": [(92, 282), (140, 238), (216, 210), (274, 238), (242, 300),
                (202, 372), (150, 374), (116, 330), (94, 306)],
    # superficie del café, por dentro del borde de la taza
    "cafe": [(112, 142), (250, 118), (402, 150), (442, 182), (420, 216),
             (300, 236), (160, 222), (96, 186)],
}


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


def distancias(tinta: set[tuple[int, int]], ancho: int, alto: int) -> dict:
    """Distancia de cada píxel de tinta al fondo (chamfer 3-4, /3 = píxeles).

    Sirve para saber el grosor real de cada trazo: el radio máximo a lo largo
    de su eje es la mitad de lo ancho que es esa línea en el dibujo.
    """
    INF = 10**9
    d = {p: INF for p in tinta}
    # pasada adelante
    for y in range(alto):
        for x in range(ancho):
            if (x, y) not in d:
                continue
            m = INF
            for dx, dy, w in ((-1, 0, 3), (0, -1, 3), (-1, -1, 4), (1, -1, 4)):
                q = (x + dx, y + dy)
                m = min(m, (d[q] if q in d else 0) + w)
            d[(x, y)] = min(d[(x, y)], m)
    # pasada atrás
    for y in range(alto - 1, -1, -1):
        for x in range(ancho - 1, -1, -1):
            if (x, y) not in d:
                continue
            m = d[(x, y)]
            for dx, dy, w in ((1, 0, 3), (0, 1, 3), (1, 1, 4), (-1, 1, 4)):
                q = (x + dx, y + dy)
                m = min(m, (d[q] if q in d else 0) + w)
            d[(x, y)] = m
    return {p: v / 3.0 for p, v in d.items()}


def grosor_de(linea, dist) -> float:
    """Ancho del trazo original bajo esta polilínea (percentil 80 de los radios).

    El percentil, y no el máximo, para que los cruces —donde dos líneas se
    enciman y el radio se dispara— no engorden el trazo entero.
    """
    radios = sorted(dist.get(p, 1.0) for p in linea)
    if not radios:
        return 4.0
    return 2.0 * radios[int(len(radios) * 0.8) - 1 if len(radios) > 1 else 0]


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


def dentro(punto, poligono) -> bool:
    """Punto en polígono, por conteo de cruces."""
    x, y = punto
    d = False
    n = len(poligono)
    for i in range(n):
        x0, y0 = poligono[i]
        x1, y1 = poligono[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            d = not d
    return d


def clasificar(pts, grosor) -> str:
    """A qué elemento del dibujo pertenece este trazo."""
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    ancho = max(p[0] for p in pts) - min(p[0] for p in pts)
    alto = max(p[1] for p in pts) - min(p[1] for p in pts)

    if dentro((cx, cy), REGIONES["cabeza"]):
        # los ojos son los trazos chicos dentro de la cabeza, y van al final
        if ancho < 48 and alto < 26 and 58 <= cy <= 104:
            return "ojos"
        return "persona"
    for r in ("brazo-izq", "brazo-der", "piernas"):
        if dentro((cx, cy), REGIONES[r]):
            return "persona"
    if dentro((cx, cy), REGIONES["cafe"]):
        return "cafe"
    return "taza"


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


def ordenar(trazos):
    """Encadena los trazos por cercanía: la pluma no salta de un lado a otro."""
    if not trazos:
        return []
    restantes = list(trazos)
    restantes.sort(key=lambda t: largo(t["pts"]), reverse=True)
    salida = [restantes.pop(0)]
    while restantes:
        fin = salida[-1]["pts"][-1]
        mejor, mejor_d, voltear = 0, float("inf"), False
        for i, tr in enumerate(restantes):
            # Cercanía pura, sin favorecer trazos largos: la pluma sigue desde
            # donde quedó. Pesar por longitud la hacía saltar a un trazo largo
            # lejano, y el dibujo se veía como piezas sueltas que luego se unen.
            l = tr["pts"]
            if math.dist(fin, l[0]) < mejor_d:
                mejor, mejor_d, voltear = i, math.dist(fin, l[0]), False
            if math.dist(fin, l[-1]) < mejor_d:
                mejor, mejor_d, voltear = i, math.dist(fin, l[-1]), True
        tr = restantes.pop(mejor)
        if voltear:
            tr = {**tr, "pts": tr["pts"][::-1]}
        salida.append(tr)
    return salida


def mapa_de_verificacion(grupos, vb, destino):
    """Dibuja el esqueleto coloreado por grupo sobre el arte, para revisar a ojo
    que la taza, el café, el mono y los ojos quedaron bien separados."""
    COLOR = {"taza": (0.10, 0.35, 0.85), "cafe": (0.85, 0.55, 0.05),
             "persona": (0.85, 0.10, 0.20), "ojos": (0.10, 0.65, 0.25)}
    S = 1.8
    doc = fitz.open()
    pg = doc.new_page(width=vb.width * S, height=vb.height * S)
    pg.draw_rect(pg.rect, color=None, fill=(1, 1, 1))

    tmp = PROJ / "scripts/.mapa-tmp.svg"
    tmp.write_text(ORIGEN.read_text(encoding="utf-8").replace('fill="currentColor"', 'fill="#e8e4d9"'), encoding="utf-8")
    try:
        pix = fitz.open(str(tmp))[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pg.insert_image(fitz.Rect(0, 0, vb.width * S, vb.height * S), pixmap=pix)
    finally:
        tmp.unlink(missing_ok=True)

    # las regiones que deciden la clasificación
    for nombre, poli in REGIONES.items():
        c = COLOR["cafe"] if nombre == "cafe" else COLOR["persona"]
        pts = [(x * S, y * S) for x, y in poli]
        for a, b in zip(pts, pts[1:] + pts[:1]):
            pg.draw_line(a, b, color=c, width=0.6, dashes="[3 3] 0")

    n = 0
    for grupo in ORDEN_GRUPOS:
        for tr in grupos.get(grupo, []):
            pts = [(x * S, y * S) for x, y in tr["pts"]]
            for a, b in zip(pts, pts[1:]):
                pg.draw_line(a, b, color=COLOR[grupo], width=1.6)
            cx = sum(x for x, _ in pts) / len(pts)
            cy = sum(y for _, y in pts) / len(pts)
            pg.insert_text((cx - 4, cy + 3), str(n), fontsize=7, color=(0, 0, 0))
            n += 1

    y = 14
    for grupo in ORDEN_GRUPOS:
        pg.insert_text((10, y), f"{grupo}: {len(grupos.get(grupo, []))} trazos",
                       fontsize=11, color=COLOR[grupo])
        y += 14
    pg.get_pixmap(matrix=fitz.Matrix(1.4, 1.4), alpha=False).save(str(destino))


def main() -> int:
    if not ORIGEN.exists():
        print(f"No encuentro {ORIGEN}", file=sys.stderr)
        return 1

    tinta, ancho, alto, fx, fy = rasterizar()
    print(f"tinta: {len(tinta)} px de {ancho}x{alto}")

    dist = distancias(tinta, ancho, alto)
    esqueleto = adelgazar(tinta)
    print(f"esqueleto: {len(esqueleto)} px")

    crudos = encadenar(trazar(esqueleto))

    # El grosor se mide sobre los píxeles crudos, antes de simplificar.
    trazos = []
    for linea in crudos:
        g = grosor_de(linea, dist) * max(fx, fy)
        pts = [(x * fx, y * fy) for x, y in simplificar(linea, TOLERANCIA)]
        trazos.append({"pts": pts, "grosor": g})

    for tr in trazos:
        tr["grupo"] = clasificar(tr["pts"], tr["grosor"])

    grupos = {g: ordenar([t for t in trazos if t["grupo"] == g]) for g in ORDEN_GRUPOS}
    sueltos = [t for t in trazos if t["grupo"] not in grupos]
    if sueltos:
        print(f"AVISO: {len(sueltos)} trazos sin grupo", file=sys.stderr)

    total = sum(largo(t["pts"]) for t in trazos)
    print(f"trazos: {len(trazos)} · largo total {total:.0f}")
    for g in ORDEN_GRUPOS:
        anchos = [t["grosor"] for t in grupos[g]]
        if anchos:
            print(f"  {g:<8} {len(anchos):>3} trazos · grosor {min(anchos):.1f}–{max(anchos):.1f}")

    doc = fitz.open(str(ORIGEN))
    vb = doc[0].rect

    piezas = []
    for g in ORDEN_GRUPOS:
        if not grupos[g]:
            continue
        caminos = []
        for tr in grupos[g]:
            # Cada trazo lleva SU grosor: uno global haría que el contorno de la
            # cabeza destapara los ojos al pasar cerca.
            m = tr["grosor"] * MARGEN_MASCARA + MARGEN_FIJO
            d = " L ".join(f"{x:.1f} {y:.1f}" for x, y in tr["pts"])
            caminos.append(f'<path stroke-width="{m:.1f}" d="M {d}"/>')
        piezas.append(f'<g data-grupo="{g}">' + "".join(caminos) + "</g>")

    SALIDA.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb.width:g} {vb.height:g}">'
        + "".join(piezas)
        + "</svg>",
        encoding="utf-8",
    )
    print(f"{SALIDA.relative_to(PROJ)} — {SALIDA.stat().st_size} bytes")

    if "--mapa" in sys.argv:
        destino = pathlib.Path(sys.argv[sys.argv.index("--mapa") + 1])
        mapa_de_verificacion(grupos, vb, destino)
        print(f"mapa de verificación: {destino}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
