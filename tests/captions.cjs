// Run with Node and Playwright available (or set PLAYWRIGHT_MODULE to its path).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const shell = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const post = `<article class="post-page"><div class="post-content">
  <p><img width="400" height="240" alt="Test image" src="/fixture.svg"></p>
  <p>[figcaption: A caption that must survive every hover]</p>
  <p><img width="400" height="240" alt="Second image" src="/fixture.svg"></p>
  <p>[figcaption: A second caption]</p>
  </div></article>`;
const html = shell.replace('<div class="overlay-content">', '<div class="overlay-content">' + post).replace(/<script src="\/entry-loader[^<]+<\/script>/, '')
  .replace(/<div class="entry-loader"[\s\S]*?<\/div>\s*<\/div>/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'caption.test') return route.fulfill({ body: '' });
      if (url.pathname === '/fixture.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="400" height="240" fill="tan"/></svg>' });
      if (/\.(js|css)$/.test(url.pathname)) return route.fulfill({ path: path.join(root, url.pathname) });
      return route.fulfill({ contentType: 'text/html', body: html });
    });
    await page.goto('http://caption.test/2026/08/09/test/');
    assert.deepEqual(errors, [], 'Direct blog loading must finish initialization');
    const figure = page.locator('.post-figure').first();
    const tooltip = page.locator('.post-caption-tooltip').first();
    await figure.scrollIntoViewIfNeeded();
    const height = await figure.evaluate(node => node.offsetHeight);
    for (let i = 0; i < 10; i++) {
      await figure.hover();
      await page.waitForTimeout(500);
      assert.equal(await tooltip.evaluate(node => getComputedStyle(node).opacity), '1');
      assert.equal(await tooltip.evaluate(node => node.classList.contains('is-exiting')), false);
      await page.mouse.move(5, 5);
      await page.waitForTimeout(180);
      assert.equal(await tooltip.evaluate(node => getComputedStyle(node).opacity), '0');
      assert.equal(await figure.evaluate(node => node.offsetHeight), height, 'Hover must not change layout');
    }
    for (let i = 0; i < 15; i++) {
      await figure.hover();
      await page.mouse.move(5, 5);
    }
    await figure.hover();
    await page.waitForTimeout(500);
    assert.equal(await tooltip.evaluate(node => getComputedStyle(node).opacity), '1');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(5, 5);
    await figure.hover();
    await page.waitForTimeout(500);
    assert.equal(await tooltip.evaluate(node => getComputedStyle(node).opacity), '1');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => initialisePostFigureCaptions());
      assert.equal(await page.locator('.post-caption-tooltip').count(), 2);
    }
    await page.evaluate(() => { history.pushState({}, '', '/blog/2026/08/09/next/'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.locator('.post-figure').first().waitFor();
    assert.equal(await page.locator('.post-caption-tooltip').count(), 2);
    await page.locator('.post-figure').first().hover();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.post-caption-tooltip').first().evaluate(node => getComputedStyle(node).opacity), '1');
    assert.equal(await page.locator('.sunlit-blur').count(), 0);
    assert.notEqual(await page.locator('.film-grain').evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await page.locator('.analog-grain').evaluate(node => getComputedStyle(node).animationName), 'none');
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'caption.test') return route.fulfill({ body: '' });
      if (/\.(js|css)$/.test(url.pathname)) return route.fulfill({ path: path.join(root, url.pathname) });
      return route.fulfill({ contentType: 'text/html', body: html });
    });
    await mobile.goto('http://caption.test/blog/');
    assert.equal(await mobile.locator('.post-figure.has-pointer-caption').count(), 0);
    assert.equal(await mobile.locator('.post-caption-tooltip').first().evaluate(node => getComputedStyle(node).display), 'none');
    assert.ok(await mobile.locator('figcaption').first().isVisible());
    assert.deepEqual(errors, []);
    console.log('PASS: direct blog load, 10 repeated hovers, 15 interrupted hovers, stable layout, reduced motion, cleanup, soft navigation, touch captions, and lighter background effects.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
