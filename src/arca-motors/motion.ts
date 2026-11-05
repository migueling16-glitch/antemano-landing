/**
 * Arca Motors — sistema de motion compartido (lo carga ArcaLayout.astro).
 *
 * Atributos que escanea (ver la documentación en el CSS de ArcaLayout):
 *   [data-split]      texto dividido en palabras con revelado por máscara
 *   [data-kinetic]    letras que se ensanchan (eje wdth de Saira) cerca del puntero / en ola en táctil
 *   .am-reveal        aparición al entrar en pantalla
 *   [data-inview]     solo recibe .is-in al entrar (para CSS propio de cada página)
 *   .am-h2            se ensancha (wdth 100 → 115) al entrar
 *   [data-count]      cuenta desde 0 al entrar (data-count="off" lo desactiva)
 *   [data-tilt]       tilt 3D + brillo (--mx --my --rx --ry) con puntero fino
 *   [data-magnetic]   se acerca al puntero (usa la propiedad `translate`)
 *   [data-cursor]     etiqueta del cursor custom
 *   [data-marquee]    marquesina infinita (clona la pista)
 *   [data-parallax]   desplazamiento vertical con el scroll (usa `translate`)
 *   [data-scrub]      expone --p (0 → 1) mientras cruza la pantalla
 *   [data-spotlight]  foco de luz que sigue al puntero o deriva solo (--sx --sy en px)
 *   .am-loop / .am-btn--red / .am-badge--new / .am-giant …  se pausan fuera de pantalla (.is-off)
 *
 * API: window.arcaMotion.refresh()  ·  document.dispatchEvent(new Event('arca:motion-refresh'))
 *      window.arcaMotion.lenis (instancia de Lenis o null)  ·  window.arcaMotion.scrollTo(target)
 */
import Lenis from 'lenis';

type El = HTMLElement;

const root = document.documentElement;
const reduceMQ = matchMedia(document.documentElement.classList.contains('am-anim') ? 'not all' : 'all');
const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
const motionOK = () => !reduceMQ.matches;
const fine = () => fineMQ.matches;

root.classList.add('am-motion');
if (matchMedia('(pointer: coarse)').matches) root.classList.add('is-touch');

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
// Un registro por función, para que un mismo elemento pueda tener reveal + tilt + magnético…
const bound = new Map<string, WeakSet<Element>>();
const once = (el: Element, key: string) => {
  let set = bound.get(key);
  if (!set) bound.set(key, (set = new WeakSet()));
  if (set.has(el)) return false;
  set.add(el);
  return true;
};
const $$ = <T extends Element = El>(sel: string, ctx: ParentNode = document) => [...ctx.querySelectorAll<T>(sel)];

/* ------------------------------------------------------------------ Lenis */
let lenis: Lenis | null = null;
if (motionOK() && fine()) {
  try {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, allowNestedScroll: true, autoRaf: true, anchors: false, stopInertiaOnNavigate: true });
  } catch (e) {
    lenis = null;
  }
}
const header = document.querySelector<El>('.am-header');
const headerOffset = () => (header?.offsetHeight ?? 72) + 16;

function scrollTo(target: El | number | string) {
  const el = typeof target === 'string' ? document.querySelector<El>(target) : target;
  if (el == null) return;
  if (lenis) {
    lenis.scrollTo(el as any, { offset: typeof el === 'number' ? 0 : -headerOffset(), duration: 1.4 });
  } else if (typeof el === 'number') {
    window.scrollTo({ top: el, behavior: motionOK() ? 'smooth' : 'auto' });
  } else {
    el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
  }
}

// Anclas de la misma página (#financiamiento, #vende…) con Lenis y compensando el header.
document.addEventListener('click', (e) => {
  if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
  let target: El | null = null;
  try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { target = null; }
  if (!target) return;
  e.preventDefault();
  scrollTo(target);
  history.pushState(null, '', url.hash);
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

/* ------------------------------------- View Transitions: la foto de la tarjeta vuela a la ficha
   Las tarjetas traen data-vt="car-<folio>" y el nombre se pone solo en la que se toca (si todas lo
   llevaran fijo, al ir de una página con tarjetas a otra volarían varias fotos a la vez y por encima
   del header). La página de llegada lo pone al volver de una ficha (script inline del <head>). */
const clearVT = () => {
  document.querySelectorAll<El>('[data-vt-on]').forEach((el) => {
    // data-vt-on guarda el nombre que tenía antes ('' = ninguno).
    el.style.viewTransitionName = el.getAttribute('data-vt-on') || '';
    el.removeAttribute('data-vt-on');
  });
};
document.addEventListener('click', (e) => {
  if (!motionOK() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self')) return;
  const media = a.closest('[data-car]')?.querySelector<El>('[data-vt]');
  const name = media?.dataset.vt;
  const vis = media?.querySelector<El>('.am-visual');
  if (!name || !vis || new URL(a.href, location.href).origin !== location.origin) return;
  clearVT();
  // Nadie más con el mismo nombre en esta página (p. ej. la foto principal de la ficha).
  document.querySelectorAll<El>('[style*="view-transition-name"]').forEach((el) => {
    if (el !== vis && el.style.viewTransitionName === name) {
      el.setAttribute('data-vt-on', name);
      el.style.viewTransitionName = 'none';
    }
  });
  vis.setAttribute('data-vt-on', vis.style.viewTransitionName || '');
  vis.style.viewTransitionName = name;
});
addEventListener('pageshow', (e) => { if (e.persisted) clearVT(); });

/* ------------------------------------------- scroll: progreso, header, parallax, scrub */
const progress = document.querySelector<El>('.am-progress__bar');
const parallaxOn = new Set<El>();
const scrubOn = new Set<El>();
const parallaxShift = new WeakMap<El, number>();
let ticking = false;

// En táctil el scroll no escribe estilos por cuadro: va en el compositor y cualquier escritura desde
// rAF llega un cuadro tarde (se ve "nadar"). Ahí solo se marca el header; parallax/scrub/progreso se
// quedan en su valor fijo del CSS.
const touch = root.classList.contains('is-touch');
function onScrollFrame() {
  ticking = false;
  const y = window.scrollY;
  if (header) header.classList.toggle('is-scrolled', y > 24);
  if (touch) return;
  const vh = window.innerHeight;
  // Primero se lee todo y luego se escribe (leer después de escribir fuerza un layout por elemento).
  const max = root.scrollHeight - vh;
  const reads: [El, DOMRect][] = [];
  if (motionOK()) {
    parallaxOn.forEach((el) => reads.push([el, el.getBoundingClientRect()]));
    scrubOn.forEach((el) => reads.push([el, el.getBoundingClientRect()]));
  }
  if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0})`;
  reads.forEach(([el, r]) => {
    if (parallaxOn.has(el) && el.dataset.parallax !== undefined) {
      const f = parseFloat(el.dataset.parallax || '') || 0.15;
      const prev = parallaxShift.get(el) ?? 0;
      const center = r.top - prev + r.height / 2;
      const shift = (center - vh / 2) * -f;
      parallaxShift.set(el, shift);
      el.style.translate = `0 ${shift.toFixed(1)}px`;
    }
    if (scrubOn.has(el)) {
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      el.style.setProperty('--p', p.toFixed(4));
    }
  });
}
const requestScrollFrame = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScrollFrame);
  }
};
addEventListener('scroll', requestScrollFrame, { passive: true });
addEventListener('resize', requestScrollFrame, { passive: true });

/* --------------------------------------------- aparición: reveal, split, h2, count */
const SPLIT_CLASS = /^am-[a-z-]*-text(--[a-z]+)?$/; // am-silver-text, am-red-text, am-outline-text(--red)…

function splitWords(el: El) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  const interactive = !!el.querySelector('a, button, input, select, textarea');
  // Los <br> cuentan como espacio en el nombre accesible ("Estrena hoy. Paga…", no "hoy.Paga").
  const txt = (n: Node): string => n.nodeName === 'BR' ? ' ' : n.nodeType === Node.TEXT_NODE ? (n.textContent || '') : [...n.childNodes].map(txt).join('');
  if (!interactive) el.setAttribute('aria-label', txt(el).replace(/\s+/g, ' ').trim());
  let i = 0;
  const walk = (parent: Node, classes: string[]) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (node.textContent || '').split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'am-w';
          if (!interactive) w.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.className = ['am-w__i', ...classes].join(' ');
          inner.style.setProperty('--i', String(i++));
          inner.textContent = tok;
          w.append(inner);
          frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node as El;
        if (['br', 'svg', 'img', 'picture'].includes(child.tagName.toLowerCase())) return;
        const moved = [...child.classList].filter((c) => SPLIT_CLASS.test(c));
        moved.forEach((c) => child.classList.remove(c));
        walk(child, [...classes, ...moved]);
      }
    });
  };
  walk(el, []);
}

const kinetic = new Set<El>();
function splitLetters(el: El) {
  if (el.dataset.kineticDone) return;
  el.dataset.kineticDone = '1';
  const cs = getComputedStyle(el);
  const base = parseFloat(cs.fontStretch) || 100;
  const max = parseFloat(el.dataset.kineticMax || '') || 125;
  el.style.setProperty('--am-k-base', String(base));
  el.style.setProperty('--am-k-max', String(max));
  // Ya viene partido desde el servidor (titular del hero): solo se registra.
  if (el.querySelector('.am-ch')) { kinetic.add(el); return; }
  // Primero palabras (para que la línea pueda partir entre palabras), luego letras.
  if (!el.dataset.splitDone) splitWords(el);
  let ci = 0;
  $$('.am-w__i', el).forEach((w) => {
    const text = w.textContent || '';
    const cls = [...w.classList].filter((c) => SPLIT_CLASS.test(c));
    cls.forEach((c) => w.classList.remove(c));
    w.textContent = '';
    [...text].forEach((ch) => {
      const s = document.createElement('span');
      s.className = ['am-ch', ...cls].join(' ');
      s.style.setProperty('--ci', String(ci++));
      s.style.setProperty('--am-k', String(base));
      s.textContent = ch;
      w.append(s);
    });
  });
  kinetic.add(el);
}

function countUp(el: El) {
  if (el.dataset.count === 'off' || el.dataset.countDone) return;
  el.dataset.countDone = '1';
  if (!motionOK()) return;
  const final = el.textContent || '';
  const m = final.match(/\d[\d,]*(\.\d+)?/);
  if (!m) return;
  const raw = m[0];
  const target = parseFloat(raw.replace(/,/g, ''));
  if (!isFinite(target) || target === 0) return;
  const decimals = m[1] ? m[1].length - 1 : 0;
  const grouping = raw.includes(',') || target >= 10000;
  const fmt = new Intl.NumberFormat('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping });
  const pre = final.slice(0, m.index);
  const post = final.slice((m.index || 0) + raw.length);
  // En táctil, conteo corto: reescribir texto en cada cuadro durante 2 s compite con la entrada.
  const dur = touch ? 650 : clamp(parseFloat(el.dataset.countDur || '') || 1600, 300, 4000);
  const t0 = performance.now();
  let last = '';
  const step = (t: number) => {
    if (last && el.textContent !== last) return; // alguien más cambió el texto: no pelear
    const k = clamp((t - t0) / dur, 0, 1);
    const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
    last = pre + fmt.format(target * e) + post;
    el.textContent = last;
    if (k < 1) requestAnimationFrame(step);
    else el.textContent = final;
  };
  requestAnimationFrame(step);
}

const revealIO = new IntersectionObserver(
  (entries) => {
    let n = 0;
    entries
      .filter((en) => en.isIntersecting)
      .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .forEach((en) => {
        const el = en.target as El;
        revealIO.unobserve(el);
        if (el.classList.contains('am-reveal') && !el.style.getPropertyValue('--am-delay')) {
          el.style.setProperty('--am-delay', `${Math.min(n++, 6) * 70}ms`);
        }
        if (el.hasAttribute('data-count')) countUp(el);
        el.classList.add('is-in');
      });
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0 }
);

/* ---------------------------------------- pausa de bucles fuera de pantalla + visibles */
const visible = new Set<El>();
const loopIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      const el = en.target as El;
      el.classList.toggle('is-off', !en.isIntersecting);
      if (en.isIntersecting) visible.add(el);
      else visible.delete(el);
      if (el.hasAttribute('data-parallax')) en.isIntersecting ? parallaxOn.add(el) : parallaxOn.delete(el);
      if (el.hasAttribute('data-scrub')) en.isIntersecting ? scrubOn.add(el) : scrubOn.delete(el);
      if (el.hasAttribute('data-spotlight') && en.isIntersecting) startSpot();
      if (el.hasAttribute('data-kinetic') && en.isIntersecting) startKinetic();
    });
    requestScrollFrame();
  },
  { rootMargin: '15% 0px 15% 0px' }
);
const LOOP_SEL = '.am-loop, .am-btn--red, .am-badge--new, .am-marquee, .am-giant, .am-visual--frame, [data-spotlight], [data-kinetic], [data-parallax], [data-scrub], .am-pulse-dot';

/* ------------------------------------------------------------ tilt + magnético */
function bindTilt(el: El) {
  if (!once(el, "tilt")) return;
  let raf = 0;
  let px = 0.5;
  let py = 0.5;
  const max = parseFloat(el.dataset.tilt || '') || 6;
  const paint = () => {
    raf = 0;
    el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !fine() || !motionOK()) return;
    el.classList.add('is-tilting');
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !fine() || !motionOK()) return;
    const r = el.getBoundingClientRect();
    px = clamp((e.clientX - r.left) / r.width, 0, 1);
    py = clamp((e.clientY - r.top) / r.height, 0, 1);
    if (!raf) raf = requestAnimationFrame(paint);
  });
  el.addEventListener('pointerleave', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
}

// Magnético con resorte en JS (no usa transiciones CSS, así no choca con las del elemento).
function bindMagnetic(el: El) {
  if (!once(el, "magnetic")) return;
  let cx = 0;
  let cy = 0;
  let inside = false;
  let raf = 0;
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  const strength = parseFloat(el.dataset.magnetic || '') || 0.35;
  const tick = () => {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    if (Math.abs(tx - x) + Math.abs(ty - y) < 0.05) {
      x = tx;
      y = ty;
      raf = 0;
    } else {
      raf = requestAnimationFrame(tick);
    }
    el.style.translate = x || y ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : '';
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !fine() || !motionOK()) return;
    const r = el.getBoundingClientRect();
    cx = r.left - x + r.width / 2;
    cy = r.top - y + r.height / 2;
    inside = true;
    el.classList.add('is-magnet');
  });
  el.addEventListener('pointermove', (e) => {
    if (!inside || e.pointerType !== 'mouse') return;
    tx = clamp((e.clientX - cx) * strength, -10, 10);
    ty = clamp((e.clientY - cy) * strength, -10, 10);
    kick();
  });
  el.addEventListener('pointerleave', () => {
    inside = false;
    el.classList.remove('is-magnet');
    tx = 0;
    ty = 0;
    kick();
  });
}

/* ------------------------------------------------------------------- marquee */
const marquees = new Set<El>();
function buildMarquee(el: El) {
  const track = el.querySelector<El>('.am-marquee__track');
  if (!track) return;
  track.querySelectorAll('[data-marquee-clone]').forEach((c) => c.remove());
  if (!motionOK()) return;
  const items = [...track.children] as El[];
  if (!items.length) return;
  const setW = track.scrollWidth;
  const boxW = el.clientWidth;
  if (!setW || !boxW) return;
  const copies = Math.max(1, Math.ceil(boxW / setW));
  const total = copies * 2;
  const frag = document.createDocumentFragment();
  for (let k = 1; k < total; k++) {
    items.forEach((it) => {
      const c = it.cloneNode(true) as El;
      c.setAttribute('data-marquee-clone', '');
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button, [tabindex]').forEach((f) => f.setAttribute('tabindex', '-1'));
      if (c.matches('a, button')) c.setAttribute('tabindex', '-1');
      frag.append(c);
    });
  }
  track.append(frag);
  const speed = parseFloat(el.dataset.marquee || '') || 60; // px por segundo
  el.style.setProperty('--am-marquee-dur', `${((setW * copies) / speed).toFixed(2)}s`);
  el.dataset.marqueeW = String(boxW);
  el.classList.add('is-ready');
}
let resizeT = 0;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = window.setTimeout(() => {
    marquees.forEach((m) => {
      if (String(m.clientWidth) !== m.dataset.marqueeW) buildMarquee(m);
    });
  }, 200);
});

/* ------------------------------------------------------------------ spotlight */
type Spot = { el: El; lights: El[]; x: number; y: number; tx: number; ty: number; inside: boolean; seed: number };
const spots = new Map<El, Spot>();
let spotRaf = 0;
function bindSpot(el: El) {
  if (!once(el, "spot")) return;
  // Solo sus focos: un [data-spotlight] anidado (p. ej. la calculadora dentro de #financiamiento) mueve los suyos.
  const lights = $$('.am-spotlight', el).filter((l) => l.closest('[data-spotlight]') === el);
  const s: Spot = { el, lights, x: 0, y: 0, tx: 0, ty: 0, inside: false, seed: Math.random() * 1000 };
  const r = el.getBoundingClientRect();
  s.x = s.tx = r.width / 2;
  s.y = s.ty = r.height * 0.45;
  spots.set(el, s);
  lights.forEach((l) => { l.style.left = '0'; l.style.top = '0'; });
  paintSpot(s);
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const rr = el.getBoundingClientRect();
    s.tx = e.clientX - rr.left;
    s.ty = e.clientY - rr.top;
    s.inside = true;
    startSpot();
  });
  el.addEventListener('pointerleave', () => { s.inside = false; });
}
function paintSpot(s: Spot) {
  s.el.style.setProperty('--sx', `${s.x.toFixed(1)}px`);
  s.el.style.setProperty('--sy', `${s.y.toFixed(1)}px`);
  s.lights.forEach((l) => {
    l.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
  });
}
function startSpot() {
  // En táctil el foco se queda quieto: derivar solo repinta la sección en cada cuadro (pesado en celular).
  if (!spotRaf && motionOK() && fine()) spotRaf = requestAnimationFrame(tickSpot);
}
function tickSpot(t: number) {
  spotRaf = 0;
  let active = false;
  spots.forEach((s) => {
    if (!visible.has(s.el)) return;
    active = true;
    if (!s.inside) {
      // deriva sola (táctil o puntero fuera): curva de Lissajous lenta
      const w = s.el.clientWidth;
      const h = s.el.clientHeight;
      const tt = t + s.seed;
      s.tx = w * (0.5 + 0.32 * Math.sin(tt * 0.00028));
      s.ty = h * (0.45 + 0.22 * Math.sin(tt * 0.00041 + 1.3));
    }
    s.x += (s.tx - s.x) * (s.inside ? 0.12 : 0.04);
    s.y += (s.ty - s.y) * (s.inside ? 0.12 : 0.04);
    paintSpot(s);
  });
  if (active) spotRaf = requestAnimationFrame(tickSpot);
}

/* ------------------------------------------------------------------- kinetic */
let kinRaf = 0;
let pX = -9999;
let pY = -9999;
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  pX = e.clientX;
  pY = e.clientY;
  if (kinetic.size) startKinetic();
}, { passive: true });
function startKinetic() {
  if (!kinRaf && motionOK() && fine()) kinRaf = requestAnimationFrame(tickKinetic);
}
function tickKinetic() {
  kinRaf = 0;
  let moving = false;
  // Dos fases: primero se leen todas las posiciones y luego se escribe. Leer y escribir letra por
  // letra forzaba un layout por letra en cada cuadro (el eje wdth cambia el ancho).
  const items: [El, DOMRect, number, number, number][] = [];
  kinetic.forEach((el) => {
    if (!visible.has(el) || el.dataset.kinetic === 'wave') return;
    const base = parseFloat(el.style.getPropertyValue('--am-k-base')) || 100;
    const max = parseFloat(el.style.getPropertyValue('--am-k-max')) || 125;
    const radius = parseFloat(el.dataset.kineticRadius || '') || 280;
    el.querySelectorAll<El>('.am-ch').forEach((ch) => items.push([ch, ch.getBoundingClientRect(), base, max, radius]));
  });
  items.forEach(([ch, r, base, max, radius]) => {
    {
      const d = Math.hypot(pX - (r.left + r.width / 2), (pY - (r.top + r.height / 2)) * 1.4);
      const inf = clamp(1 - d / radius, 0, 1);
      const target = base + (max - base) * (1 - Math.pow(1 - inf, 3));
      const cur = parseFloat(ch.style.getPropertyValue('--am-k')) || base;
      const next = cur + (target - cur) * 0.14;
      if (Math.abs(next - target) > 0.15) moving = true;
      ch.style.setProperty('--am-k', next.toFixed(2));
    }
  });
  if (moving) kinRaf = requestAnimationFrame(tickKinetic);
}

/* -------------------------------------------------------------- cursor custom */
function initCursor() {
  if (!fine() || !motionOK() || document.querySelector('.am-cursor')) return;
  root.classList.add('has-cursor');
  const c = document.createElement('div');
  c.className = 'am-cursor is-hidden';
  c.setAttribute('aria-hidden', 'true');
  c.innerHTML = '<span class="am-cursor__dot"></span><span class="am-cursor__ring"><span class="am-cursor__circle"></span><span class="am-cursor__label"></span></span>';
  document.body.append(c);
  const dot = c.querySelector<El>('.am-cursor__dot')!;
  const ring = c.querySelector<El>('.am-cursor__ring')!;
  const label = c.querySelector<El>('.am-cursor__label')!;
  let mx = -100;
  let my = -100;
  let rx = mx;
  let ry = my;
  let raf = 0;
  const tick = () => {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
    raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (c.classList.contains('is-hidden')) { rx = e.clientX; ry = e.clientY; }
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    c.classList.remove('is-hidden');
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    if (!t || !t.closest) return;
    const native = t.closest('input, select, textarea, [contenteditable="true"], iframe');
    c.classList.toggle('is-native', !!native);
    const lab = t.closest<El>('[data-cursor]');
    const text = lab?.dataset.cursor || '';
    if (text && !native) {
      label.textContent = text;
      c.classList.add('is-label');
    } else {
      c.classList.remove('is-label');
    }
    c.classList.toggle('is-hover', !text && !!t.closest('a, button, [role="button"], label, summary, [data-magnetic]'));
  });
  document.addEventListener('pointerdown', () => c.classList.add('is-down'));
  document.addEventListener('pointerup', () => c.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) c.classList.add('is-hidden'); });
}

/* ------------------------------------------------------------------- refresh */
function refresh(ctx: ParentNode = document) {
  $$('[data-split]', ctx).forEach(splitWords);
  if (motionOK()) $$('[data-kinetic]', ctx).forEach(splitLetters);
  $$('.am-reveal, [data-split], [data-inview], .am-h2, [data-count]', ctx).forEach((el) => {
    if (once(el, "reveal")) revealIO.observe(el);
  });
  $$(LOOP_SEL, ctx).forEach((el) => {
    if (el.dataset.amLoop) return;
    el.dataset.amLoop = '1';
    loopIO.observe(el);
  });
  if (fine()) {
    $$('[data-tilt]', ctx).forEach(bindTilt);
    $$('[data-magnetic]', ctx).forEach(bindMagnetic);
  }
  $$('[data-marquee]', ctx).forEach((m) => {
    if (marquees.has(m)) return;
    marquees.add(m);
    buildMarquee(m);
  });
  $$('[data-spotlight]', ctx).forEach(bindSpot);
  requestScrollFrame();
}

initCursor();
refresh();
// Las fuentes cambian anchos: re-medir las marquesinas cuando carguen.
document.fonts?.ready.then(() => marquees.forEach((m) => buildMarquee(m)));
document.addEventListener('arca:motion-refresh', () => refresh());

declare global {
  interface Window {
    arcaMotion: { refresh: (ctx?: ParentNode) => void; lenis: Lenis | null; scrollTo: typeof scrollTo };
  }
}
window.arcaMotion = { refresh, lenis, scrollTo };
