/* Gallery lightbox: <dialog> gives focus trapping, ESC and backdrop for free.
   Restoring focus to the button that opened it is the one thing the platform
   does not do for us. */
(() => {
  const dialog = document.querySelector('[data-lightbox]');
  const gallery = document.querySelector('[data-gallery]');
  if (!dialog || !gallery) return;

  const image = dialog.querySelector('[data-lightbox-img]');
  const title = dialog.querySelector('[data-lightbox-title]');
  const meta = dialog.querySelector('[data-lightbox-meta]');
  let opener = null;

  gallery.addEventListener('click', (event) => {
    const button = event.target.closest('[data-src]');
    if (!button) return;
    opener = button;
    image.src = button.dataset.src;
    image.alt = button.dataset.alt || '';
    title.textContent = button.dataset.title || '';
    meta.textContent = button.dataset.meta || '';
    dialog.showModal();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    image.src = '';
    opener?.focus();
  });
})();
