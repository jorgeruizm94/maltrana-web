/* Maltraña · main.js
   Requiere bootstrap.bundle.min.js cargado antes.
   Une pestañas (escritorio) y acordeón (móvil) que comparten el mismo HTML. */
(() => {
  // Altura real del header fijo → variable CSS --mlt-header-h
  // (la usan la imagen sticky y los enlaces internos para no quedar tapados)
  const header = document.querySelector('.mlt-header');
  if (header) {
    const setH = () => document.documentElement.style.setProperty('--mlt-header-h', `${header.offsetHeight}px`);
    new ResizeObserver(setH).observe(header);
    setH();
  }

  const wide = window.matchMedia('(min-width: 768px)');

  // En escritorio las .tab-pane son paneles de pestañas; en móvil son ítems de acordeón
  const syncRoles = () => {
    document.querySelectorAll('.mlt-tabs .tab-pane').forEach((pane) => {
      const tab = document.querySelector(`[data-bs-target="#${pane.id}"]`);
      if (wide.matches) {
        pane.setAttribute('role', 'tabpanel');
        if (tab) pane.setAttribute('aria-labelledby', tab.id);
        pane.tabIndex = 0;
      } else {
        pane.removeAttribute('role');
        pane.removeAttribute('aria-labelledby');
        pane.removeAttribute('tabindex');
      }
    });
  };
  wide.addEventListener('change', syncRoles);
  // Bootstrap también pone role="tabpanel" al cargar y al crear pestañas;
  // volvemos a sincronizar después de él
  window.addEventListener('load', syncRoles);
  syncRoles();

  // Abrir un bloque del acordeón → activa su pestaña
  document.querySelectorAll('.mlt-tabs .accordion-collapse').forEach((col) => {
    col.addEventListener('show.bs.collapse', () => {
      const pane = col.closest('.tab-pane');
      const tab = document.querySelector(`[data-bs-target="#${pane.id}"]`);
      if (tab) bootstrap.Tab.getOrCreateInstance(tab).show();
      syncRoles();
    });
  });

  // Cambiar de pestaña → abre su bloque del acordeón
  document.querySelectorAll('.mlt-tabs [data-bs-toggle="tab"]').forEach((tab) => {
    tab.addEventListener('shown.bs.tab', () => {
      const col = document.querySelector(tab.dataset.bsTarget).querySelector('.accordion-collapse');
      bootstrap.Collapse.getOrCreateInstance(col, { toggle: false }).show();
    });
  });

  // Acercamiento suave de las fotos al hacer scroll.
  // Empieza cuando la sección entra al 80% de la pantalla y se detiene
  // 600px después, en 1.08 (8% más grande). Sin animación si el usuario
  // pidió reducir movimiento en su sistema.
  const MAX_ZOOM = 0.08;
  const DISTANCIA = 600;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fotos = [...document.querySelectorAll('.mlt-product__media img')];
  let pendiente = false;

  const actualizarZoom = () => {
    pendiente = false;
    const vh = window.innerHeight;
    fotos.forEach((img) => {
      if (reduce.matches) { img.style.removeProperty('--mlt-zoom'); return; }
      const seccion = img.closest('.mlt-product');
      const inicioAbs = seccion.getBoundingClientRect().top + window.scrollY - vh * 0.8;
      const avance = Math.min(Math.max((window.scrollY - Math.max(0, inicioAbs)) / DISTANCIA, 0), 1);
      img.style.setProperty('--mlt-zoom', (1 + avance * MAX_ZOOM).toFixed(4));
    });
  };
  const alHacerScroll = () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizarZoom); }
  };
  window.addEventListener('scroll', alHacerScroll, { passive: true });
  window.addEventListener('resize', alHacerScroll);
  actualizarZoom();
})();
