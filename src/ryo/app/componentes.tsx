/**
 * Componentes de la app, sobre el design system de Ryo Café.
 *
 * Los que no existían en el sistema (stepper, brújula, gráficas,
 * hoja) se hicieron con sus reglas: filetes de 1px, bloques planos, radio 0,
 * cuadrados en vez de círculos, tramas en vez de un tercer color.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import isotipoSvg from '../assets/isotipo.svg?raw';
import logotipoSvg from '../assets/logotipo.svg?raw';
import taglineSvg from '../assets/tagline.svg?raw';
import auxiliarSvg from '../assets/auxiliar.svg?raw';
import { useAviso, cerrarAviso, useRitual, cerrarRitual, vibrar } from './estado';
import { leerFoto } from './lib/fotos';
import { redondear, type Objetivo, type Sabor, ventanaRatio } from './lib/calibracion';

/* ═══ NAVEGACIÓN ══════════════════════════════════════════ */

export const ir = (ruta: string) => { location.hash = `#${ruta}`; };

export function useRuta(): string[] {
  const leer = () => (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const f = () => { setRuta(leer()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return ruta;
}

/* ═══ MARCA ═══════════════════════════════════════════════ */

/*
 * Las cuatro piezas de marca, recortadas a su área de dibujo (los SVG
 * originales traen margen) para que `alto` sea la altura real del trazo.
 * Brand book: logotipo e isotipo nunca por debajo de 50 px de alto.
 */
const recorte = (svg: string, caja: string) => svg.replace(/viewBox="[^"]*"/, `viewBox="${caja}"`);
const MARCAS = {
  isotipo: recorte(isotipoSvg, '38 40 479 361'),
  logotipo: recorte(logotipoSvg, '38 35 469 369'),
  tagline: recorte(taglineSvg, '67 52 664 191'),
  auxiliar: recorte(auxiliarSvg, '103 106 592 488'),
};
export type TipoMarca = keyof typeof MARCAS;

/** Una pieza de marca en la tinta del tema. `revela` la hace subir como el nivel de la taza. */
export function Marca({ tipo, alto, etiqueta, revela, className = '' }: {
  tipo: TipoMarca; alto: number; etiqueta?: string; revela?: boolean; className?: string;
}) {
  return (
    <span
      className={`marca marca-${tipo}${revela ? ' revela' : ''} ${className}`}
      style={{ height: alto }}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
      dangerouslySetInnerHTML={{ __html: MARCAS[tipo] }}
    />
  );
}

/** Estado vacío o en calma: el isotipo y una frase corta. */
export const Vacio = ({ children }: { children: ReactNode }) => (
  <div className="vacio">
    <Marca tipo="isotipo" alto={52} revela />
    <p className="cuerpo">{children}</p>
  </div>
);

/**
 * Ritual cumplido: al terminar algo que importa (la apertura, la receta del
 * día, un nivel) la pantalla se llena como la taza, aparece el isotipo y una
 * frase. Se va sola o con un toque.
 */
export function Ritual() {
  const r = useRitual();
  const [visto, setVisto] = useState(r);
  useEffect(() => {
    if (r) {
      setVisto(r);
      const t = setTimeout(cerrarRitual, 2400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisto(null), 420);
    return () => clearTimeout(t);
  }, [r]);
  const m = r ?? visto;
  if (!m) return null;
  return (
    <div className="ritual inv" key={m.id} role="status" data-saliendo={r ? 'no' : 'si'} onClick={cerrarRitual}>
      <div className="ritual-contenido">
        <Marca tipo="isotipo" alto={92} className="ritual-marca" />
        <p className="ritual-titulo">{m.titulo}</p>
        {m.sub && <p className="cuerpo ritual-sub">{m.sub}</p>}
      </div>
    </div>
  );
}

/* ═══ BARRA SUPERIOR ══════════════════════════════════════ */

/**
 * Título grande de la pantalla y, arriba, una barra compacta que se queda
 * fija. Cuando el título grande se va bajo la barra, la barra lo repite.
 */
export function Sup({ titulo, sub, volver, accion, marca }: {
  titulo: string; sub?: string; volver?: string; accion?: { texto: string; hacer: () => void };
  /** El isotipo junto al título: solo en Inicio, la casa. */
  marca?: boolean;
}) {
  const grande = useRef<HTMLHeadingElement>(null);
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    const el = grande.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setCompacta(!e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <header className="sup" data-compacta={compacta ? 'si' : 'no'}>
        {volver && (
          <button type="button" className="sup-volver" onClick={() => (volver === 'atras' ? history.back() : ir(volver))}>
            <span aria-hidden="true">←</span> Atrás
          </button>
        )}
        <span className="sup-centro" aria-hidden="true">
          {!volver && <span className="sup-firma">Ryo Café</span>}
          <span className="sup-titulo">{titulo}</span>
        </span>
        {accion && <button type="button" className="sup-accion" onClick={accion.hacer}>{accion.texto}</button>}
      </header>
      <div className={`encabezado${marca ? ' con-marca' : ''}`}>
        <div className="encabezado-texto">
          <h1 className="encabezado-titulo" ref={grande}>{titulo}</h1>
          {sub && <p className="encabezado-sub">{sub}</p>}
        </div>
        {marca && <Marca tipo="isotipo" alto={56} revela />}
      </div>
    </>
  );
}

/* ═══ PIEZAS PEQUEÑAS ═════════════════════════════════════ */

/** Etiqueta de estado. Si su texto cambia mientras se ve, se estampa. */
export function Estado({ children, fuerte, tenue }: { children: ReactNode; fuerte?: boolean; tenue?: boolean }) {
  const texto = typeof children === 'string' ? children : String((children as ReactNode[] | undefined) ?? '');
  const previo = useRef(texto);
  const cambio = previo.current !== texto;
  useEffect(() => { previo.current = texto; });
  return (
    <span key={texto} className={`estado${fuerte ? ' fuerte' : ''}${tenue ? ' tenue' : ''}${cambio ? ' sello' : ''}`}>{children}</span>
  );
}

export const Seccion = ({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) => (
  <section className="sec">
    <h2 className="sec-titulo"><span>{titulo}</span>{extra && <span className="extra">{extra}</span>}</h2>
    {children}
  </section>
);

export const BarraProg = ({ valor }: { valor: number }) => (
  <div className="barra-prog" role="progressbar" aria-valuenow={Math.round(valor * 100)} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${Math.max(0, Math.min(1, valor)) * 100}%` }} />
  </div>
);

export const Avatar = ({ texto, lleno }: { texto: string; lleno?: boolean }) => (
  <span className={`avatar${lleno ? ' lleno' : ''}`} aria-hidden="true">{texto}</span>
);

/** Casilla cuadrada. Rebota al marcarse: el toque se siente. */
export function Casilla({ hecha }: { hecha: boolean }) {
  const [pop, setPop] = useState(false);
  const previa = useRef(hecha);
  useEffect(() => {
    const recien = hecha && !previa.current;
    previa.current = hecha;
    if (!recien) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 340);
    return () => clearTimeout(t);
  }, [hecha]);
  return <span className={`casilla${pop ? ' pop' : ''}`} data-hecha={hecha ? 'si' : 'no'} aria-hidden="true" />;
}

/* ═══ AVISO BREVE ═════════════════════════════════════════ */

export function Aviso() {
  const a = useAviso();
  const [visto, setVisto] = useState(a);
  useEffect(() => {
    if (a) { setVisto(a); return; }
    const t = setTimeout(() => setVisto(null), 200);
    return () => clearTimeout(t);
  }, [a]);
  const m = a ?? visto;
  if (!m) return null;
  return (
    <div className="toast" role="status" key={m.id} data-saliendo={a ? 'no' : 'si'}>
      <span>{m.texto}</span>
      {m.accion && (
        <button type="button" onClick={() => { m.accion!.hacer(); cerrarAviso(); }}>{m.accion.etiqueta}</button>
      )}
    </div>
  );
}

/* ═══ HOJA (panel desde abajo) ════════════════════════════ */

export function Hoja({ abierta, alCerrar, titulo, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; children: ReactNode;
}) {
  // Al cerrar se queda montada lo que dura la salida, con su último contenido.
  const [montada, setMontada] = useState(abierta);
  const ultimo = useRef({ titulo, children });
  if (abierta) ultimo.current = { titulo, children };
  useEffect(() => {
    if (abierta) { setMontada(true); return; }
    const t = setTimeout(() => setMontada(false), 220);
    return () => clearTimeout(t);
  }, [abierta]);
  useEffect(() => {
    if (!abierta) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') alCerrar(); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [abierta, alCerrar]);
  if (!abierta && !montada) return null;
  const v = ultimo.current;
  return (
    <div className="hoja" data-saliendo={abierta ? 'no' : 'si'}>
      <div className="hoja-afuera" onClick={alCerrar} aria-hidden="true" />
      <div className="hoja-panel inv" role="dialog" aria-modal="true" aria-label={v.titulo}>
        <div className="fila-h entre">
          <p className="etq">{v.titulo}</p>
          <button type="button" className="enlace" onClick={alCerrar}>Cerrar</button>
        </div>
        {v.children}
      </div>
    </div>
  );
}

/* ═══ STEPPER: + / − sin teclado ══════════════════════════ */

export function Stepper({ etiqueta, valor, paso, min = -Infinity, max = Infinity, dec = 1, unidad, fuera, onCambio }: {
  etiqueta: string; valor: number; paso: number; min?: number; max?: number; dec?: number; unidad?: string;
  fuera?: boolean; onCambio: (v: number) => void;
}) {
  const valorRef = useRef(valor);
  valorRef.current = valor;
  const previo = useRef(valor);
  const dir = valor > previo.current ? 'sube' : valor < previo.current ? 'baja' : '';
  useEffect(() => { previo.current = valor; });
  const repetir = useRef<number>();
  const cambiar = (dir: 1 | -1) => {
    const v = redondear(Math.min(max, Math.max(min, valorRef.current + dir * paso)), dec);
    if (v !== valorRef.current) { valorRef.current = v; onCambio(v); vibrar(5); }
  };
  // Mantener presionado repite, cada vez más rápido: para ir de 30 a 38 g sin 80 toques.
  const empezar = (dir: 1 | -1) => {
    cambiar(dir);
    let intervalo = 180;
    const tic = () => { cambiar(dir); intervalo = Math.max(45, intervalo * 0.85); repetir.current = window.setTimeout(tic, intervalo); };
    repetir.current = window.setTimeout(tic, 420);
  };
  const parar = () => clearTimeout(repetir.current);
  useEffect(() => parar, []);
  const boton = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={`${dir > 0 ? 'Subir' : 'Bajar'} ${etiqueta}`}
      onPointerDown={(e) => { e.preventDefault(); empezar(dir); }}
      onPointerUp={parar}
      onPointerLeave={parar}
      onPointerCancel={parar}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cambiar(dir); } }}
    >{dir > 0 ? '+' : '−'}</button>
  );
  return (
    <div className="pila-s">
      <span className="etq">{etiqueta}</span>
      <div className="stepper" data-fuera={fuera ? 'si' : 'no'}>
        {boton(-1)}
        <div className="stepper-centro" aria-live="polite">
          <span key={valor} className={`stepper-valor ${dir}`}>{valor.toFixed(dec)}{unidad && <span className="stepper-unidad">{unidad}</span>}</span>
        </div>
        {boton(1)}
      </div>
    </div>
  );
}

/* ═══ GAUGE: dónde cae un valor contra su ventana ═════════ */

export function Gauge({ valor, desde, hasta, vmin, vmax, etiqueta, texto }: {
  valor: number; desde: number; hasta: number; vmin: number; vmax: number; etiqueta: string; texto: string;
}) {
  const pos = (v: number) => `${((Math.min(vmax, Math.max(vmin, v)) - vmin) / (vmax - vmin)) * 100}%`;
  const dentro = valor >= desde && valor <= hasta;
  return (
    <div className="pila-s">
      <div className="fila-h entre">
        <span className="etq">{etiqueta}</span>
        <span className="etq">{dentro ? 'En ventana' : valor < desde ? 'Abajo' : 'Arriba'}</span>
      </div>
      <div className="fila-h entre"><span className="num-m">{texto}</span></div>
      <div className="gauge" aria-hidden="true">
        <span className="gauge-ventana" style={{ left: pos(desde), width: `calc(${pos(hasta)} - ${pos(desde)})` }} />
        <span className="gauge-marca" style={{ left: pos(valor) }} />
      </div>
    </div>
  );
}

/* ═══ BRÚJULA DE SABOR ════════════════════════════════════ */

export function Brujula({ valor, onCambio }: { valor?: Sabor; onCambio: (s: Sabor) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const [onda, setOnda] = useState<{ n: number; x: number; y: number } | null>(null);
  const balance = !!valor && Math.abs(valor.x) <= 0.25 && Math.abs(valor.y) <= 0.25;
  const desdeEvento = (e: React.PointerEvent) => {
    const r = caja.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = 1 - ((e.clientY - r.top) / r.height) * 2;
    const lim = (n: number) => redondear(Math.max(-1, Math.min(1, n)), 2);
    onCambio({ x: lim(x), y: lim(y) });
  };
  return (
    <div
      ref={caja}
      className="brujula"
      data-balance={balance ? 'si' : 'no'}
      role="application"
      aria-label="Brújula de sabor: toca dónde cae el shot"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        desdeEvento(e);
        vibrar(8);
        const r = caja.current!.getBoundingClientRect();
        setOnda((o) => ({ n: (o?.n ?? 0) + 1, x: e.clientX - r.left, y: e.clientY - r.top }));
      }}
      onPointerMove={(e) => { if (e.buttons) desdeEvento(e); }}
    >
      <span className="brujula-eje-x" />
      <span className="brujula-eje-y" />
      <span className="brujula-centro" />
      <span className="brujula-rotulo" style={{ top: 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>Intenso</span>
      <span className="brujula-rotulo" style={{ bottom: 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>Débil</span>
      <span className="brujula-rotulo" style={{ left: 8, top: '50%', transform: 'translateY(-130%)' }}>Ácido<br />subextraído</span>
      <span className="brujula-rotulo" style={{ right: 8, top: '50%', transform: 'translateY(-130%)', textAlign: 'right' }}>Amargo<br />sobreextraído</span>
      <span className="brujula-taza" data-visible={balance ? 'si' : 'no'}><Marca tipo="isotipo" alto={52} /></span>
      <span className="brujula-rotulo brujula-balance" data-oculto={balance ? 'si' : 'no'} style={{ left: '50%', top: '50%', transform: 'translate(-50%, 90%)' }}>Balance</span>
      {onda && <span key={onda.n} className="brujula-onda" style={{ left: onda.x, top: onda.y }} />}
      {valor && <span className="brujula-punto" style={{ left: `${((valor.x + 1) / 2) * 100}%`, top: `${((1 - valor.y) / 2) * 100}%` }} />}
    </div>
  );
}

/* ═══ GRÁFICAS ════════════════════════════════════════════ */

const Trama = () => (
  <defs>
    <pattern id="trama" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--ink)', strokeWidth: 1 }} />
    </pattern>
  </defs>
);

type Ejes = { x0: number; x1: number; y0: number; y1: number };
const W = 320, H = 220, M = { l: 34, r: 10, t: 12, b: 30 };
const escala = (e: Ejes) => ({
  x: (v: number) => M.l + ((v - e.x0) / (e.x1 - e.x0)) * (W - M.l - M.r),
  y: (v: number) => H - M.b - ((v - e.y0) / (e.y1 - e.y0)) * (H - M.t - M.b),
});

function Marco({ e, px, py, marcasX, marcasY, etqX, etqY, children }: {
  e: Ejes; px: (v: number) => number; py: (v: number) => number; marcasX: number[]; marcasY: number[];
  etqX: string; etqY: string; children: ReactNode;
}) {
  return (
    <svg className="grafica" viewBox={`0 0 ${W} ${H}`} role="img">
      <Trama />
      {marcasX.map((v) => <g key={`x${v}`}><line className="guia" x1={px(v)} x2={px(v)} y1={py(e.y0)} y2={py(e.y1)} /><text x={px(v)} y={H - M.b + 13} textAnchor="middle">{v}</text></g>)}
      {marcasY.map((v) => <g key={`y${v}`}><line className="guia" x1={px(e.x0)} x2={px(e.x1)} y1={py(v)} y2={py(v)} /><text x={M.l - 5} y={py(v) + 3} textAnchor="end">{v}</text></g>)}
      <line className="eje" x1={px(e.x0)} x2={px(e.x1)} y1={py(e.y0)} y2={py(e.y0)} />
      <line className="eje" x1={px(e.x0)} x2={px(e.x0)} y1={py(e.y0)} y2={py(e.y1)} />
      <text x={W - M.r} y={H - 3} textAnchor="end">{etqX}</text>
      <text x={3} y={M.t - 2}>{etqY}</text>
      {children}
    </svg>
  );
}

/** Tiempo contra rendimiento de los shots de la sesión, con la zona objetivo. */
export function GraficaSesion({ shots, objetivo, dosis }: {
  shots: { n: number; tiempo: number; rendimiento: number; aprobado?: boolean }[]; objetivo: Objetivo; dosis: number;
}) {
  const [rmin, rmax] = ventanaRatio(objetivo);
  const tMin = objetivo.tiempo - objetivo.tolTiempo, tMax = objetivo.tiempo + objetivo.tolTiempo;
  const ts = shots.map((s) => s.tiempo), rs = shots.map((s) => s.rendimiento);
  const e: Ejes = {
    x0: Math.floor(Math.min(tMin - 6, ...ts) / 2) * 2, x1: Math.ceil(Math.max(tMax + 6, ...ts) / 2) * 2,
    y0: Math.floor(Math.min(dosis * rmin - 4, ...rs) / 2) * 2, y1: Math.ceil(Math.max(dosis * rmax + 4, ...rs) / 2) * 2,
  };
  const { x: px, y: py } = escala(e);
  const paso = (a: number, b: number, n: number) => { const r: number[] = []; for (let v = Math.ceil(a / n) * n; v <= b; v += n) r.push(v); return r; };
  return (
    <Marco e={e} px={px} py={py} marcasX={paso(e.x0, e.x1, 4)} marcasY={paso(e.y0, e.y1, 4)} etqX="TIEMPO S" etqY="RENDIMIENTO G">
      <rect className="zona" x={px(tMin)} y={py(dosis * rmax)} width={px(tMax) - px(tMin)} height={py(dosis * rmin) - py(dosis * rmax)} />
      <text x={px(tMax) + 3} y={py(dosis * rmax) + 9}>OBJETIVO</text>
      {shots.length > 1 && (
        <polyline key={shots.length} className="traza dibuja" pathLength={1} points={shots.map((s) => `${px(s.tiempo)},${py(s.rendimiento)}`).join(' ')} />
      )}
      {shots.map((s, i) => (
        <g key={s.n} className="p" style={{ '--i': i } as React.CSSProperties}>
          <rect className={s.aprobado ? 'punto' : 'punto-vacio'} x={px(s.tiempo) - 7} y={py(s.rendimiento) - 7} width={14} height={14} />
          <text className={s.aprobado ? 'etq-punto' : ''} x={px(s.tiempo)} y={py(s.rendimiento) + 3} textAnchor="middle" style={s.aprobado ? {} : { fontSize: 8 }}>{s.n}</text>
        </g>
      ))}
    </Marco>
  );
}

/** Molienda que funcionó contra días de reposo, con su tendencia. */
export function GraficaTendencia({ puntos, recta, hoy }: {
  puntos: { x: number; y: number }[]; recta: ((x: number) => number) | null; hoy?: number;
}) {
  const ys = puntos.map((p) => p.y);
  const e: Ejes = { x0: 0, x1: 20, y0: Math.floor(Math.min(...ys, 5) - 0.5), y1: Math.ceil(Math.max(...ys, 7) + 0.5) };
  const { x: px, y: py } = escala(e);
  const marcasY: number[] = [];
  for (let v = e.y0; v <= e.y1; v += 1) marcasY.push(v);
  return (
    <Marco e={e} px={px} py={py} marcasX={[0, 4, 8, 12, 16, 20]} marcasY={marcasY} etqX="DÍAS DE REPOSO" etqY="MOLIENDA">
      {recta && <line className="traza" x1={px(e.x0)} y1={py(recta(e.x0))} x2={px(e.x1)} y2={py(recta(e.x1))} style={{ strokeDasharray: '4 3' }} />}
      {hoy !== undefined && <line className="eje" x1={px(hoy)} x2={px(hoy)} y1={py(e.y0)} y2={py(e.y1)} />}
      {hoy !== undefined && <text x={px(hoy) + 3} y={M.t + 8}>HOY</text>}
      {puntos.map((p, i) => <rect key={i} className="punto p" style={{ '--i': i } as React.CSSProperties} x={px(p.x) - 4} y={py(p.y) - 4} width={8} height={8} />)}
    </Marco>
  );
}

/* ═══ FOTO GUARDADA ═══════════════════════════════════════ */

/** Muestra una foto de evidencia. Las de los datos de ejemplo son un marcador. */
export function Foto({ id, className = 'foto-mini', sello }: { id?: string; className?: string; sello?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!id || id === 'demo') return;
    let vivo = true, u: string | undefined;
    leerFoto(id).then((b) => { if (b && vivo) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { vivo = false; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  if (!id) return null;
  if (id === 'demo' || !url) {
    return (
      <span className={`${className} foto-vacia`} title={sello ?? 'Foto de ejemplo'} />
    );
  }
  return <img className={className} src={url} alt={sello ?? 'Foto de evidencia'} />;
}
