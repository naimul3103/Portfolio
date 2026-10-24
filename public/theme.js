/* Theme toggle: three states collapse to two on purpose — the OS preference is
   the default, and an explicit choice persists until it is changed again. */
(() => {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  const label = () => {
    const dark = document.documentElement.dataset.theme !== 'light';
    button.setAttribute('aria-pressed', String(!dark));
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.title = dark ? 'Light theme' : 'Dark theme';
  };

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode: the choice simply does not persist */
    }
    label();
  });

  label();
})();
