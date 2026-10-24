/* The only JavaScript on the résumé page: print, and keep the template choice
   in the URL so a recruiter can link directly to the version they want. */
(() => {
  const printButton = document.querySelector('[data-print]');
  printButton?.addEventListener('click', () => window.print());

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('template');
  if (requested === 'europass') {
    const radio = document.querySelector('#tpl-europass');
    if (radio) radio.checked = true;
  }

  for (const radio of document.querySelectorAll('input[name="template"]')) {
    radio.addEventListener('change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('template', radio.value);
      history.replaceState({}, '', url);
    });
  }
})();
