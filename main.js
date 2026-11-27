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

/* ------------------------------------------------------------
   Foto por tamaño (Raicillas Maltraña)
   Escritorio (con mouse): al pasar el cursor por "250 ml" o "50 ml" se ve
   esa foto; al quitarlo vuelve la original.
   Celular: al picar un tamaño la foto cambia y se queda hasta picar otro;
   si la foto no está a la vista, la pantalla sube hasta ella.
   Al recargar siempre vuelve la foto original.
   ------------------------------------------------------------ */
(() => {
  const conMouse = window.matchMedia('(hover: hover) and (min-width: 768px)');
  const mostrar = (figura, size) => {
    if (!size || size === '750') delete figura.dataset.show;   // 750 ml = foto original
    else figura.dataset.show = size;
  };
  document.querySelectorAll('.mlt-product').forEach((producto) => {
    const figura = producto.querySelector('.mlt-product__media');
    const pills = [...producto.querySelectorAll('.mlt-pill--size')];
    if (!figura || !pills.length) return;
    pills.forEach((pill) => {
      // Escritorio: solo mientras el cursor está encima
      pill.addEventListener('mouseenter', () => { if (conMouse.matches) mostrar(figura, pill.dataset.size); });
      pill.addEventListener('mouseleave', () => { if (conMouse.matches) mostrar(figura, null); });
      // Celular: se queda elegido
      pill.addEventListener('click', () => {
        if (conMouse.matches) return;
        pills.forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
        mostrar(figura, pill.dataset.size);
        const caja = figura.getBoundingClientRect();
        const header = document.querySelector('.mlt-header')?.offsetHeight || 0;
        if (caja.top < header || caja.bottom > window.innerHeight) {
          const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: window.scrollY + caja.top - header - 16, behavior: suave ? 'smooth' : 'auto' });
        }
      });
    });
  });
})();

/* ------------------------------------------------------------
   Menú de celular
   Al abrirse: el ícono cambia a una cruz (CSS), el resto de la página
   se oscurece y se difumina, y picar fuera del menú lo cierra.
   ------------------------------------------------------------ */
(() => {
  const menu = document.getElementById('mlt-nav');
  if (!menu || !window.bootstrap) return;
  const velo = document.createElement('div');
  velo.className = 'mlt-menu-veil';
  document.body.appendChild(velo);
  menu.addEventListener('show.bs.collapse', () => document.documentElement.classList.add('mlt-menu-open'));
  menu.addEventListener('hide.bs.collapse', () => document.documentElement.classList.remove('mlt-menu-open'));
  velo.addEventListener('click', () => bootstrap.Collapse.getOrCreateInstance(menu).hide());
})();

/* ------------------------------------------------------------
   Flecha "regresar a categorías" (Coctelería)
   Aparece solo cuando las categorías quedaron más de una pantalla arriba.
   ------------------------------------------------------------ */
(() => {
  const flecha = document.querySelector('.mlt-totop');
  const cats = document.getElementById('categorias');
  if (!flecha || !cats) return;
  const revisar = () => {
    const lejos = cats.getBoundingClientRect().bottom < -window.innerHeight * 0.75;
    flecha.hidden = !lejos;
  };
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
})();

/* ------------------------------------------------------------
   Pilares (Distribución)
   Escritorio: al picar un pilar se abre su lista
   y la foto grande cambia. En celular todos se ven completos (CSS).
   ------------------------------------------------------------ */
(() => {
  const pilares = [...document.querySelectorAll('.mlt-pillar')];
  const fotos = [...document.querySelectorAll('.mlt-pillars__photo')];
  if (!pilares.length) return;
  const activar = (i) => {
    pilares.forEach((p, n) => {
      p.classList.toggle('is-active', n === i);
      p.querySelector('.mlt-pillar__head').setAttribute('aria-expanded', String(n === i));
    });
    fotos.forEach((f, n) => f.classList.toggle('is-active', n === i));
  };
  pilares.forEach((p, i) => {
    p.querySelector('.mlt-pillar__head').addEventListener('click', () => activar(i));
  });
})();

/* ------------------------------------------------------------
   Carta de coctelería
   - Marca en la barra la categoría que estás viendo (IntersectionObserver).
   - --mlt-catnav-h: alto de la barra, para que al picar una categoría
     su título no quede escondido debajo del header y la barra.
   ------------------------------------------------------------ */
(() => {
  const nav = document.getElementById('catnav');
  if (!nav || !window.bootstrap) return;
  const medir = () => document.documentElement.style.setProperty('--mlt-catnav-h', nav.offsetHeight + 'px');
  medir();
  new ResizeObserver(medir).observe(nav);
  // Marca la categoría cuyo bloque cruza una franja a ~35% de la pantalla
  const links = [...nav.querySelectorAll('.mlt-catnav__link')];
  const grupos = links.map((a) => document.querySelector(a.hash)).filter(Boolean);
  const marcar = (id) => links.forEach((a) => {
    const on = a.hash === '#' + id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) marcar(e.target.id); });
  }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
  grupos.forEach((g) => obs.observe(g));
})();

/* ------------------------------------------------------------
   Relato del proceso (Raicilla, escritorio)
   El momento que cruza el centro de la pantalla se ilumina y la foto
   fija de la izquierda cambia a la suya.
   ------------------------------------------------------------ */
(() => {
  const pasos = [...document.querySelectorAll('.mlt-story__step')];
  const fotos = [...document.querySelectorAll('.mlt-story__photo')];
  if (!pasos.length) return;
  const titulo = document.querySelector('.mlt-story__title');
  const activar = (i) => {
    pasos.forEach((p, n) => p.classList.toggle('is-active', n === i));
    fotos.forEach((f, n) => f.classList.toggle('is-active', n === i));
    // en el último momento el título se desvanece, para que no se quede solo al final
    if (titulo) titulo.classList.toggle('is-faded', i === pasos.length - 1);
  };
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) activar(Number(e.target.dataset.step)); });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  pasos.forEach((p) => obs.observe(p));
})();
