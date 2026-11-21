/* Maltraña · age-gate.js
   Aviso de mayoría de edad. Requiere bootstrap.bundle.min.js antes.
   - "Sí": guarda una cookie por 1 hora y aclara la página.
   - "No": muestra el aviso para menores y el enlace sobre los riesgos.
   Mientras la cookie exista, el aviso no vuelve a aparecer. */
(() => {
  const COOKIE = 'mlt_mayor_edad';
  const UNA_HORA = 60 * 60; // segundos

  const gate = document.getElementById('mlt-agegate');
  const root = document.documentElement;
  if (!gate || typeof bootstrap === 'undefined') return;

  const tieneCookie = () => document.cookie.split('; ').includes(`${COOKIE}=1`);

  if (tieneCookie()) {
    root.classList.remove('mlt-gated');
    return;
  }

  root.classList.add('mlt-gated');

  // Todo lo que está detrás del aviso queda inactivo (ni clic, ni teclado, ni lector de pantalla)
  const fondo = [...document.body.children].filter((el) => el !== gate && el.tagName !== 'SCRIPT');
  fondo.forEach((el) => { el.inert = true; });

  const modal = bootstrap.Modal.getOrCreateInstance(gate);
  modal.show();

  gate.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-agegate]');
    if (!boton) return;

    if (boton.dataset.agegate === 'yes') {
      const seguro = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${COOKIE}=1; max-age=${UNA_HORA}; path=/; SameSite=Lax${seguro}`;
      fondo.forEach((el) => { el.inert = false; });
      root.classList.remove('mlt-gated');   // la página se aclara (transición en style.css)
      modal.hide();
    }

    if (boton.dataset.agegate === 'no') {
      gate.querySelector('[data-agegate-step="ask"]').hidden = true;
      const menor = gate.querySelector('[data-agegate-step="minor"]');
      menor.hidden = false;
      menor.querySelector('h2').focus();
    }
  });
})();
