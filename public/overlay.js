(() => {
  const dialog = document.querySelector('.page-overlay');
  const content = dialog.querySelector('.overlay-content');
  const scroller = dialog.querySelector('.overlay-scroll');
  const label = document.querySelector('#overlay-label');
  const home = document.querySelector('.home-screen');
  let controller;
  let opener;
  const isHome = url => /^\/(?:index\.html)?$/.test(url.pathname);
  const section = url => url.pathname.includes('/blog') ? 'blog' : url.pathname.includes('guestbook') ? 'guestbook' : url.pathname.includes('work') ? 'work' : 'about';
  const refresh = () => {
    enhanceObsidianImageEmbeds();
    enhancePostFigureCaptions();
    initialisePostFigureCaptions();
    initialisePortraitCaption();
    enhancePostSpotifyLinks();
    syncSpotifyTheme();
  };
  function open() {
    home.inert = true;
    if (!dialog.open) dialog.show();
  }
  function close(updateHistory = true) {
    controller?.abort();
    disposePostFigureCaptions();
    disposePortraitCaption();
    dialog.close();
    home.inert = false;
    if (updateHistory) history.pushState({}, '', '/');
    document.title = 'imasepan — home';
    (opener || document.querySelector('.home-links a')).focus();
  }
  async function navigate(url, updateHistory = true) {
    if (isHome(url)) { close(updateHistory); return; }
    controller?.abort();
    const request = controller = new AbortController();
    disposePostFigureCaptions();
    disposePortraitCaption();
    label.textContent = section(url);
    content.innerHTML = '<p class="load-message" role="status">Opening page…</p>';
    open();
    scroller.scrollTop = 0;
    try {
      const response = await fetch(url.href, { signal: request.signal });
      if (!response.ok) throw new Error('Page unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = page.querySelector('.overlay-content');
      if (!next) throw new Error('Page unavailable');
      if (request.signal.aborted) return;
      content.replaceChildren(...next.childNodes);
      label.textContent = section(url);
      document.title = page.title;
      if (updateHistory) history.pushState({}, '', url.href);
      refresh();
      if (document.documentElement.dataset.appearance !== 'frutiger' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        content.getAnimations().forEach(animation => animation.cancel());
        content.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 500, easing: 'cubic-bezier(.2, .75, .25, 1)' });
      }
      scroller.scrollTop = 0;
      dialog.querySelector('.overlay-close').focus();
      if (url.hash) content.querySelector(`[id="${CSS.escape(decodeURIComponent(url.hash.slice(1)))}"]`)?.scrollIntoView();
    } catch (error) {
      if (error.name === 'AbortError') return;
      content.innerHTML = '<p class="load-message" role="alert">This page couldn’t be opened. Please try again.</p><button type="button" class="retry-page">Try again</button>';
      content.querySelector('button').addEventListener('click', () => navigate(url, updateHistory));
    }
  }
  dialog.querySelector('.overlay-close').addEventListener('click', event => { event.preventDefault(); close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dialog.open) { event.preventDefault(); close(); } });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (!/^\/(?:index\.html|about\.html|work\.html|guestbook\.html|blog(?:\.html|\/.*)?)?$/.test(url.pathname)) return;
    // Different sections are available only after returning home.
    if (dialog.open && !isHome(url) && section(url) !== section(new URL(location.href))) { event.preventDefault(); return; }
    event.preventDefault();
    if (!dialog.open) opener = link;
    if (url.pathname === '/blog.html') url.pathname = '/blog/';
    navigate(url);
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href), false));
  if (!isHome(new URL(location.href))) {
    label.textContent = section(new URL(location.href));
    open();
  }
})();
