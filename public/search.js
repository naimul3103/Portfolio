/* Pagefind is generated after `astro build`, so it cannot be imported during the
   build. This loader upgrades the fallback only when the index actually exists,
   which keeps local dev honest instead of showing a broken widget. */
(async () => {
  const root = document.querySelector('[data-search]');
  if (!root) return;

  try {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/pagefind/pagefind-ui.css';
    document.head.append(css);

    await import('/pagefind/pagefind-ui.js');

    if (typeof window.PagefindUI !== 'function') return;

    root.innerHTML = '';
    new window.PagefindUI({
      element: root,
      showSubResults: true,
      showImages: false,
      resetStyles: false,
      translations: {
        placeholder: 'Search projects, posts, notes…',
        zero_results: 'No hits for [SEARCH_TERM] — try fewer words.',
        many_results: '[COUNT] results for [SEARCH_TERM]',
        one_result: 'One result for [SEARCH_TERM]',
        searching: 'Searching…',
      },
    });
  } catch {
    /* No index (development) — the server-rendered fallback stays visible. */
  }
})();
