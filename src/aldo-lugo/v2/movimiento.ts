/**
 * Movimiento de la landing v3. Sin dependencias.
 * - Carriles horizontales (v2/Carril.astro) y comparador servido/al fuego: funcionan siempre, incluso con
 *   "Pausar movimiento"; lo único que se apaga ahí son las invitaciones animadas (empujoncito, meneo).
 * - Un solo listener de scroll vertical (pasivo) + rAF; cada efecto solo corre mientras su escena está en pantalla.
 * - <html data-quieto> ("Pausar movimiento"): nada se anima solo.
 * - <html data-suave> (el sistema pide menos movimiento): sin parallax, zoom ni video; carriles y comparador sí.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const curva = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const raiz = document.documentElement;
const enPausa = () => raiz.hasAttribute('data-quieto');

// ---------- Carriles: un deslizón = una tarjeta, con invitación obvia ----------
function iniciarCarriles(): void {
  document.querySelectorAll<HTMLElement>('[data-carril]').forEach((carril) => {
    const pista = carril.querySelector<HTMLElement>('[data-pista]');
    if (!pista) return;
    const items = Array.from(pista.children) as HTMLElement[];
    if (!items.length) return;
    const barras = Array.from(carril.querySelectorAll<HTMLElement>('.e2-carril__barras li'));
    const cuenta = carril.querySelector<HTMLElement>('[data-actual]');
    const ant = carril.querySelector<HTMLButtonElement>('[data-anterior]');
    const sig = carril.querySelector<HTMLButtonElement>('[data-siguiente]');

    // Posición de scroll en la que cada tarjeta queda alineada (la última se recorta al final de la pista).
    const destino = (i: number) => {
      const max = pista.scrollWidth - pista.clientWidth;
      return clamp(items[i].offsetLeft - items[0].offsetLeft, 0, max);
    };
    const indice = () => {
      const x = pista.scrollLeft;
      let mejor = 0;
      let d = Infinity;
      items.forEach((_, i) => {
        const dd = Math.abs(destino(i) - x);
        if (dd < d) { d = dd; mejor = i; }
      });
      return mejor;
    };
    let actual = -1;
    const pintar = () => {
      const n = indice();
      if (n === actual) return;
      actual = n;
      barras.forEach((b, i) => b.classList.toggle('is-hecha', i <= n));
      if (cuenta) cuenta.textContent = String(n + 1);
      if (ant) ant.disabled = n === 0;
      if (sig) sig.disabled = n === items.length - 1;
    };
    const ir = (i: number) => {
      const n = clamp(i, 0, items.length - 1);
      pista.scrollTo({ left: destino(n), behavior: enPausa() ? 'auto' : 'smooth' });
    };

    let tocado = false;
    const marcar = () => {
      if (tocado) return;
      tocado = true;
      carril.classList.add('is-tocado');
      carril.classList.remove('is-empuja');
    };

    let pendiente = false;
    pista.addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; pintar(); });
      if (pista.scrollLeft > 8) marcar();
    }, { passive: true });
    window.addEventListener('resize', () => { actual = -1; pintar(); }, { passive: true });
    pista.addEventListener('touchstart', marcar, { passive: true, once: true });
    ant?.addEventListener('click', () => { marcar(); ir(actual - 1); });
    sig?.addEventListener('click', () => { marcar(); ir(actual + 1); });
    pista.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); marcar(); ir(actual + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); marcar(); ir(actual - 1); }
    });

    // Arrastre con mouse (en táctil manda el scroll nativo con snap).
    let x0 = 0;
    let xu = 0;
    let s0 = 0;
    let arrastre = false;
    let movido = false;
    pista.addEventListener('dragstart', (e) => e.preventDefault()); // las fotos no se "arrastran" como archivo
    pista.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arrastre = true;
      movido = false;
      x0 = xu = e.clientX;
      s0 = pista.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      xu = e.clientX;
      const dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 6) {
        movido = true;
        marcar();
        pista.classList.add('is-arrastrando');
      }
      if (movido) pista.scrollLeft = s0 - dx;
    });
    const soltar = (e: PointerEvent) => {
      if (!arrastre) return;
      arrastre = false;
      if (!movido) return;
      const dx = (e.type === 'pointercancel' ? xu : e.clientX) - x0;
      const desde = indice();
      pista.classList.remove('is-arrastrando');
      // Basta un jalón corto para pasar de tarjeta, como en el celular.
      const base = items.findIndex((_, i) => destino(i) >= s0 - 1);
      const n = Math.abs(dx) > 40 ? (dx < 0 ? Math.max(desde, base + 1) : Math.min(desde, base - 1)) : base;
      ir(n);
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    pista.addEventListener('click', (e) => {
      if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; }
    }, true);

    // Empujoncito: al entrar en pantalla, las tarjetas se asoman a la izquierda y regresan (hasta 3 veces).
    let veces = 0;
    let reloj = 0;
    const empujar = () => {
      if (tocado || enPausa() || veces >= 3) return;
      veces++;
      carril.classList.remove('is-empuja');
      void carril.offsetWidth;
      carril.classList.add('is-empuja');
      reloj = window.setTimeout(empujar, 4200);
    };
    const vista = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        window.clearTimeout(reloj);
        if (e.isIntersecting) reloj = window.setTimeout(empujar, 650);
      }
    }, { threshold: 0.55 });
    vista.observe(carril);
    carril.addEventListener('animationend', (e) => {
      if ((e.target as HTMLElement) === items[0]) carril.classList.remove('is-empuja');
    });

    pintar();
  });
}

// ---------- Comparador: arrastra la línea de fuego de lado ----------
function iniciarComparador(): void {
  const caja = document.querySelector<HTMLElement>('[data-antes]');
  if (!caja) return;
  const rango = caja.querySelector<HTMLInputElement>('[data-antes-rango]');
  let p = 58;
  const poner = (v: number) => {
    p = clamp(v, 0, 100);
    caja.style.setProperty('--p', `${p.toFixed(2)}%`);
    if (rango) rango.value = String(Math.round(p));
  };
  const desdeX = (x: number) => {
    const r = caja.getBoundingClientRect();
    poner(((x - r.left) / r.width) * 100);
  };
  let tocado = false;
  let meneo = 0;
  const marcar = () => {
    if (tocado) return;
    tocado = true;
    cancelAnimationFrame(meneo);
    caja.classList.add('is-tocado');
  };

  let id: number | null = null;
  let x0 = 0;
  let y0 = 0;
  let decidido = false;
  caja.addEventListener('dragstart', (e) => e.preventDefault());
  caja.addEventListener('pointerdown', (e) => {
    id = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    decidido = e.pointerType === 'mouse';
    if (decidido) {
      marcar();
      caja.setPointerCapture(e.pointerId);
      desdeX(e.clientX);
    }
  });
  caja.addEventListener('pointermove', (e) => {
    if (id !== e.pointerId) return;
    if (!decidido) {
      const dx = Math.abs(e.clientX - x0);
      if (dx < 6 || dx < Math.abs(e.clientY - y0)) return;
      decidido = true;
      marcar();
      try { caja.setPointerCapture(e.pointerId); } catch {}
    }
    desdeX(e.clientX);
  });
  const soltar = (e: PointerEvent) => {
    if (id !== e.pointerId) return;
    // Un toque sin arrastre también mueve la línea ahí (hasta un niño lo entiende).
    if (!decidido && e.type === 'pointerup' && Math.abs(e.clientY - y0) < 10) { marcar(); desdeX(e.clientX); }
    id = null;
    decidido = false;
  };
  caja.addEventListener('pointerup', soltar);
  caja.addEventListener('pointercancel', soltar);
  rango?.addEventListener('input', () => { marcar(); poner(Number(rango.value)); });

  // Meneo al entrar en pantalla: la línea va y viene para que se note que se mueve (2 veces como máximo).
  let veces = 0;
  let reloj = 0;
  const menear = () => {
    if (tocado || enPausa() || veces >= 2) return;
    veces++;
    const t0 = performance.now();
    const base = p;
    const paso = (t: number) => {
      const k = clamp((t - t0) / 1700);
      poner(base + Math.sin(k * Math.PI * 2) * 26 * (1 - k * 0.35) * (k < 1 ? 1 : 0));
      if (k < 1 && !tocado) meneo = requestAnimationFrame(paso);
      else if (!tocado) { poner(base); reloj = window.setTimeout(menear, 4500); }
    };
    meneo = requestAnimationFrame(paso);
  };
  const vista = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      window.clearTimeout(reloj);
      if (e.isIntersecting) reloj = window.setTimeout(menear, 500);
    }
  }, { threshold: 0.6 });
  vista.observe(caja);
}

export function iniciarMovimiento(): void {
  const quieto = enPausa();
  const suave = raiz.hasAttribute('data-suave');

  iniciarCarriles();
  iniciarComparador();

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

  // ---------- Registro de efectos ligados al scroll vertical ----------
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
  // El observador ve también el recorte de los carriles: solo corren la tarjeta visible y la que se asoma.
  const clips = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-clip]'));
  const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const visibles = new Set<HTMLVideoElement>();
  let cargada = document.readyState === 'complete';
  const sincronizarClips = () => {
    if (suave || ahorro) return;
    for (const v of clips) {
      const debe = visibles.has(v) && (cargada || !v.hasAttribute('data-clip-tras-carga')) && !enPausa();
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

  // ---------- 6 · Lo que ya hice: el dron baja + cifras que cuentan ----------
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
