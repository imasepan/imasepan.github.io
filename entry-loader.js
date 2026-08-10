(() => {
  const loader = document.querySelector('[data-entry-loader]');
  if (!loader) return;

  const startedAt = performance.now();
  const minimumDuration = 450;
  const maximumDuration = 3000;
  const sources = (loader.dataset.assets || '')
    .split(',')
    .map((source) => source.trim())
    .filter(Boolean);
  const themeAsset = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? loader.dataset.darkAsset
    : loader.dataset.lightAsset;

  if (themeAsset) sources.push(themeAsset);

  const decodeImage = (source) => new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const decode = () => {
      if (image.decode) image.decode().catch(() => {}).finally(finish);
      else finish();
    };

    image.onload = decode;
    image.onerror = finish;
    image.fetchPriority = 'high';
    image.src = source;
    if (image.complete) decode();
  });

  const decodeVisibleImage = (image) => {
    if (image.loading === 'lazy' || !image.decode) return Promise.resolve();
    return image.decode().catch(() => {});
  };

  const assetsReady = Promise.all([
    ...[...new Set(sources)].map(decodeImage),
    ...[...document.images].map(decodeVisibleImage),
    document.fonts?.ready?.catch(() => {}) || Promise.resolve(),
  ]);
  const timeout = new Promise((resolve) => window.setTimeout(resolve, maximumDuration));

  Promise.race([assetsReady, timeout]).then(() => {
    const remaining = Math.max(0, minimumDuration - (performance.now() - startedAt));
    window.setTimeout(() => {
      loader.classList.add('is-ready');
      loader.setAttribute('aria-hidden', 'true');
      window.dispatchEvent(new Event('entry-loader-ready'));
      window.setTimeout(() => loader.remove(), 550);
    }, remaining);
  });
})();
