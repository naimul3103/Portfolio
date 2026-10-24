/* Runs before first paint, from <head>, so the theme never flashes.
   External file (not inline) so the CSP can stay `script-src 'self'`. */
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme =
      stored === 'light' || stored === 'dark' ? stored : system;
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
