/**
 * Movimiento de la landing v2. Sin dependencias.
 * - Un solo listener de scroll (pasivo) + rAF; cada efecto solo corre mientras su escena está en pantalla.
 * - Solo se escriben transform/opacity (vía variables CSS que el CSS convierte en transform).
 * - <html data-quieto> ("Pausar movimiento"): no se anima nada; el CSS ya deja todo visible.
 * - <html data-suave> (el sistema pide menos movimiento): versión calmada — intro, fundidos, brillos y cifras sí;
 *   zooms, parallax, carrusel fijo y desplazamientos grandes no.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const curva = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function iniciarMovimiento(): void {
  const raiz = document.documentElement;
  const quieto = raiz.hasAttribute('data-quieto');
  const suave = raiz.hasAttribute('data-suave');
  const escritorio = window.matchMedia('(min-width: 1024px)');

  // ---------- 0 · Encendido + 1 · titular que se enciende ----------
  const hero = document.querySelector<HTMLElement>('.e2-hero');
  const intro = document.querySelector<HTMLElement>('[data-intro]');
  const encender = () => hero?.classList.add('e2-encendido');
  if (raiz.classList.contains('e2-con-intro') && intro) {
    try { sessionStorage.setItem('al-encendido', '1'); } catch {}
    let listo = false;
    const terminar = (rapido: boolean) => {
      if (listo) return;
      listo = true;
      if (rapido) intro.classList.add('is-fuera');
      window.setTimeout(() => {
        raiz.classList.remove('e2-con-intro');
        encender();
      }, rapido ? 360 : 0);
    };
    const saltar = () => terminar(true);
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((ev) =>
      window.addEventListener(ev, saltar, { once: true, passive: true }),
    );
    window.setTimeout(() => terminar(false), 3300);
  } else if (!quieto) {
    window.setTimeout(encender, 150);
  }
  if (quieto) return;

  const vh = () => window.innerHeight;

  // ---------- Registro de efectos ligados al scroll ----------
  type Efecto = { el: Element; activo: boolean; correr: () => void };
  const efectos: Efecto[] = [];
  const vigia = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        const ef = efectos.find((x) => x.el === e.target);
        if (ef) ef.activo = e.isIntersecting;
      }
      pedir();
    },
    { rootMargin: '10% 0px 10% 0px' },
  );
  const registrar = (el: Element | null, correr: () => void) => {
    if (!el) return;
    efectos.push({ el, activo: false, correr });
    vigia.observe(el);
  };
  let pendiente = false;
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      for (const ef of efectos) if (ef.activo) ef.correr();
    });
  };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir, { passive: true });

  // ---------- 1 · Portada: la cámara retrocede al bajar ----------
  const mueve = document.querySelector<HTMLElement>('[data-parallax]');
  if (!suave) registrar(hero, () => {
    if (!mueve || !hero) return;
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / r.height);
    mueve.style.transform = `translate3d(0, ${p * 14}%, 0) scale(${1 + p * 0.08})`;
  });

  // ---------- Loops de video (la foto queda debajo; nunca en modo suave ni con ahorro de datos) ----------
  const clips = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-clip]'));
  const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const visibles = new Set<HTMLVideoElement>();
  let cargada = document.readyState === 'complete';
  const permitido = (v: HTMLVideoElement) => {
    const f = v.closest('.e2-imagina__foto');
    if (f && !f.classList.contains('is-activa')) return false; // en Imagina solo corre la escena activa
    if (v.hasAttribute('data-clip-tras-carga') && !cargada) return false; // la portada espera a que cargue la página
    return true;
  };
  const sincronizarClips = () => {
    if (suave || ahorro) return;
    for (const v of clips) {
      const debe = visibles.has(v) && permitido(v) && !raiz.hasAttribute('data-quieto');
      if (debe) {
        if (!v.getAttribute('src')) v.src = v.dataset.clip!;
        if (v.paused) v.play().catch(() => {}); // si el navegador lo bloquea, se queda la foto
      } else if (!v.paused) v.pause();
    }
  };
  if (clips.length && !suave && !ahorro) {
    clips.forEach((v) => {
      v.muted = true;
      v.addEventListener('playing', () => v.classList.add('is-viva'));
    });
    const ioClips = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) visibles.add(v);
          else visibles.delete(v);
        }
        sincronizarClips();
      },
      { rootMargin: '20% 0px 20% 0px' },
    );
    clips.forEach((v) => ioClips.observe(v));
    if (!cargada) {
      window.addEventListener('load', () => {
        cargada = true;
        window.setTimeout(sincronizarClips, 400);
      }, { once: true });
    }
    document.addEventListener('al:movimiento', sincronizarClips);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clips.forEach((v) => v.pause());
      else sincronizarClips();
    });
  }

  // ---------- 2 · Imagina: la foto fija cambia con cada frase ----------
  const imagina = document.querySelector<HTMLElement>('[data-imagina]');
  if (imagina) {
    const fotos = Array.from(imagina.querySelectorAll<HTMLElement>('.e2-imagina__foto'));
    const pasos = Array.from(imagina.querySelectorAll<HTMLElement>('.e2-paso'));
    const hora = imagina.querySelector<HTMLElement>('[data-hora]');
    let actual = -1;
    const activar = (n: number) => {
      if (n === actual) return;
      actual = n;
      fotos.forEach((f, i) => f.classList.toggle('is-activa', i === n));
      sincronizarClips();
      pasos.forEach((p, i) => p.classList.toggle('is-activo', i === n));
      if (hora) {
        hora.style.opacity = '0';
        window.setTimeout(() => {
          hora.textContent = pasos[n]?.dataset.horaPaso ?? '';
          hora.style.opacity = '1';
        }, 220);
      }
    };
    activar(0);
    // Manda la FRASE, no el bloque: está activa la última frase que ya subió por encima del 62 % de la pantalla.
    // Se calcula por posición (no solo al cruzar), así un salto o un scroll rápido nunca deja la foto equivocada.
    const frases = pasos.map((p) => p.querySelector<HTMLElement>('.e2-frase'));
    const calcular = () => {
      const linea = vh() * 0.62;
      let n = 0;
      frases.forEach((f, i) => { if (f && f.getBoundingClientRect().top < linea) n = i; });
      activar(n);
    };
    registrar(imagina, calcular);
    calcular();
  }

  // ---------- 3 · Contraste: la brasa quema el blanco y negro a color ----------
  const contraste = document.querySelector<HTMLElement>('[data-contraste]');
  const tacha = contraste?.querySelector<HTMLElement>('[data-tacha]');
  registrar(contraste, () => {
    if (!contraste) return;
    const r = contraste.getBoundingClientRect();
    const total = r.height - vh();
    const p = clamp(-r.top / total);
    const k = curva(0.12, 0.78, p);
    if (suave) contraste.style.setProperty('--e2-o', k.toFixed(3));
    else contraste.style.setProperty('--e2-c', `${((1 - k) * 100).toFixed(2)}%`);
    tacha?.classList.toggle('is-tachado', p > 0.18);
  });

  // ---------- 5 · Oficio: carrusel con dedo (móvil) o fijo horizontal (escritorio) ----------
  const oficio = document.querySelector<HTMLElement>('[data-oficio]');
  const pista = oficio?.querySelector<HTMLElement>('[data-pista]');
  if (oficio && pista) {
    // móvil: la tarjeta del centro crece
    const tarjetas = Array.from(pista.children) as HTMLElement[];
    const centro = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) (e.target as HTMLElement).classList.toggle('is-centro', e.intersectionRatio > 0.6);
      },
      { root: pista, threshold: [0, 0.6, 1] },
    );
    tarjetas.forEach((t) => centro.observe(t));
    pista.classList.add('is-viva');

    let distancia = 0;
    const medir = () => {
      if (escritorio.matches && !suave) {
        oficio.setAttribute('data-pin-activo', '');
        distancia = Math.max(0, pista.scrollWidth - window.innerWidth);
        oficio.style.setProperty('--e2-oficio-h', `${vh() + distancia}px`);
      } else {
        oficio.removeAttribute('data-pin-activo');
        oficio.style.removeProperty('--e2-oficio-h');
        pista.style.removeProperty('--e2-x');
      }
    };
    medir();
    window.addEventListener('resize', medir, { passive: true });
    escritorio.addEventListener?.('change', medir);
    registrar(oficio, () => {
      if (suave || !escritorio.matches || !distancia) return;
      const r = oficio.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh()));
      pista.style.setProperty('--e2-x', `${(-p * distancia).toFixed(1)}px`);
    });
  }

  // ---------- 6 · Una noche real: el dron baja + cifras que cuentan ----------
  const zoom = document.querySelector<HTMLElement>('[data-zoom]');
  if (!suave) registrar(zoom?.parentElement ?? null, () => {
    if (!zoom?.parentElement) return;
    const r = zoom.parentElement.getBoundingClientRect();
    const p = clamp((vh() - r.top) / (vh() + r.height));
    zoom.style.setProperty('--e2-z', (1.2 - 0.2 * curva(0, 0.75, p)).toFixed(4));
  });
  const cifras = Array.from(document.querySelectorAll<HTMLElement>('[data-cuenta]'));
  if (cifras.length) {
    const fin = (el: HTMLElement, n: number) => `${el.dataset.pre ?? ''}${n}${el.dataset.suf ?? ''}`;
    cifras.forEach((el) => (el.textContent = fin(el, 0)));
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          const meta = Number(el.dataset.cuenta);
          const t0 = performance.now();
          const paso = (t: number) => {
            const k = curva(0, 1, (t - t0) / 1400);
            el.textContent = fin(el, Math.round(meta * k));
            if (k < 1) requestAnimationFrame(paso);
          };
          requestAnimationFrame(paso);
        }
      },
      { threshold: 0.6 },
    );
    cifras.forEach((el) => io.observe(el));
  }

  pedir();
}
