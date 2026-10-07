const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://twilight.test/**', route => {
      let file = path.join(__dirname, '../dist', new URL(route.request().url()).pathname);
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      return route.fulfill({ path: file });
    });
    await page.goto('http://twilight.test/twilight2/');
    const slider = page.getByRole('slider', { name: 'Time of day', exact: true });
    const palette = () => page.locator('[data-blue-hour-end]').evaluateAll(nodes => nodes.map(n => n.getAttribute(n.tagName === 'stop' ? 'stop-color' : 'fill')));
    const original = await palette();
    const cloud = await page.locator('#twilight2-cloud-sheet').getAttribute('href');
    assert.equal(await slider.inputValue(), '0');
    assert.equal(original[0], '#263f5b', 'Initial sky preserves the existing scene');
    fs.mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/twilight2-early.png' });
    await slider.focus();
    await page.keyboard.press('End');
    assert.equal(await slider.inputValue(), '100');
    assert.equal(await slider.getAttribute('aria-valuetext'), 'End of blue hour');
    assert.notDeepEqual(await palette(), original);
    assert.ok(await page.locator('.scene').evaluate(n => n.animationsPaused()), 'Scrubbing honors reduced motion');
    await page.screenshot({ path: 'test-results/twilight2-late.png' });
    await page.keyboard.press('Home');
    assert.deepEqual(await palette(), original, 'Beginning restores the exact original colors');
    const bounds = await slider.boundingBox();
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    assert.ok(Math.abs(Number(await slider.inputValue()) - 50) < 2, 'Desktop track is clickable');
    await page.getByRole('button', { name: 'Resume motion' }).click();
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.scene').evaluate(n => n.animationsPaused()), false, 'Scrubbing does not pause motion');
    assert.equal(await page.locator('#twilight2-cloud-sheet').getAttribute('href'), cloud, 'Cloud texture is reused while scrubbing');
    await page.getByRole('button', { name: 'Pause motion' }).click();
    const samples = await page.evaluate(() => {
      const slider = document.querySelector('#blue-hour');
      return Array.from({ length: 101 }, (_, time) => {
        slider.value = time;
        slider.dispatchEvent(new Event('input'));
        return [...document.querySelectorAll('[data-blue-hour-end]')].map(n => {
          const color = n.getAttribute(n.tagName === 'stop' ? 'stop-color' : 'fill');
          return color.startsWith('#') ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)) : color.match(/\d+/g).map(Number);
        });
      });
    });
    for (let i = 1; i < samples.length; i++) samples[i].forEach((color, j) => {
      assert.ok(color.every((c, k) => c <= samples[i - 1][j][k]), 'Scene steadily deepens');
      assert.ok(color.every((c, k) => Math.abs(c - samples[i - 1][j][k]) <= 3), 'No abrupt color steps');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const mobile = await slider.boundingBox();
    await page.touchscreen.tap(mobile.x + mobile.width * .75, mobile.y + mobile.height / 2);
    assert.ok(Number(await slider.inputValue()) > 65, 'Touch adjusts the lighting');
    assert.ok(await page.locator('.scene').evaluate(n => n.animationsPaused()));
    const footer = await page.locator('footer').boundingBox();
    const control = await page.locator('.time-control').boundingBox();
    assert.ok(control.y + control.height < footer.y, 'Mobile controls do not overlap');
    assert.ok(control.x >= 0 && control.x + control.width <= 390);
    await slider.blur();
    await page.screenshot({ path: 'test-results/twilight2-slider-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: initial palette, reversible endpoints, continuous darkening, mouse/keyboard/touch, independent motion, reduced motion, mobile layout, no browser errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
