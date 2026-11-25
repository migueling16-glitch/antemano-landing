/**
 * Capas (<dialog> modales) sincronizadas con el historial (ESPEC §7.8, B11).
 *
 *   const abrir = capa(dialogo, 'hoja');  abrir();
 *
 * - Abrir hace showModal() y empuja una entrada { capa, capas } al historial.
 * - "Atrás" del navegador (popstate) cierra solo las capas que ya no están en el estado actual,
 *   así una capa dentro de otra (aviso de privacidad dentro de la hoja) se cierra sola sin cerrar la de abajo.
 * - Cerrar con botón, Escape o el gesto nativo de Android: si el estado actual es el de esta capa,
 *   history.back() quita la entrada, así no queda un "atrás muerto".
 */
type Estado = { capa?: string; capas?: string[] } | null;

const estado = (): Estado => (history.state && typeof history.state === 'object' ? history.state : null);

export function capa(dlg: HTMLDialogElement, id: string) {
  let porAtras = false;

  addEventListener('popstate', () => {
    if (!dlg.open) return;
    const capas = estado()?.capas ?? [];
    if (!capas.includes(id)) {
      porAtras = true;
      dlg.close();
    }
  });

  dlg.addEventListener('close', () => {
    if (!porAtras && estado()?.capa === id) history.back();
    porAtras = false;
  });

  return function abrir() {
    if (dlg.open) return;
    dlg.showModal();
    const previas = estado()?.capas ?? [];
    try {
      history.pushState({ ...(estado() ?? {}), capa: id, capas: [...previas.filter((c) => c !== id), id] }, '');
    } catch {
      /* historial no disponible (iframe sandbox): la capa funciona igual */
    }
  };
}

/** Cierra el diálogo y resuelve cuando el historial ya volvió (para desplazarse a un ancla después). */
export function cerrarYEsperar(dlg: HTMLDialogElement): Promise<void> {
  return new Promise((resolver) => {
    if (!dlg.open) return resolver();
    let hecho = false;
    const fin = () => {
      if (hecho) return;
      hecho = true;
      removeEventListener('popstate', fin);
      resolver();
    };
    addEventListener('popstate', fin);
    dlg.close();
    setTimeout(fin, 350);
  });
}
