const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
(async () => {
  const browser = await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || undefined});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'site.test') return route.fulfill({body:''});
      let file = path.join(root, decodeURIComponent(url.pathname));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      assert.ok(fs.existsSync(file), `Missing local resource: ${url.pathname}`);
      return route.fulfill({path:file});
    });
    await page.goto('http://site.test/');
    await page.getByRole('button', {name:'Rain',exact:true}).click();
    await page.waitForFunction(() => document.documentElement.dataset.weather === 'rain');
    const glass = await page.locator('.rain-glass').innerHTML();
    assert.equal(await page.locator('.rain-glass path').count(), 712);
    const drops = await page.locator('.raindrop').evaluateAll(nodes => nodes.map(n => {
      const s = getComputedStyle(n);
      return {width:s.width,height:parseFloat(s.height),radius:s.borderRadius,background:s.backgroundImage};
    }));
    assert.equal(drops.length, 64);
    assert.ok(drops.every(d => d.width === '4px' && d.height >= 36 && d.height <= 84 && d.radius === '0px' && d.background === 'none'));
    await page.reload();
    assert.equal(await page.locator('.rain-glass').innerHTML(), glass);
    assert.equal(await page.locator('html').getAttribute('data-weather'), 'rain');
    fs.mkdirSync(path.resolve(__dirname, '../test-results'), {recursive:true});
    await page.screenshot({path:path.resolve(__dirname,'../test-results/rain-preview.png')});
    await page.getByRole('link',{name:'Blog',exact:true}).click();
    await page.locator('.post-card').first().waitFor();
    assert.equal(await page.locator('.post-card').count(), 8);
    const links = await page.locator('.post-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
    for (const link of links) {
      await page.goto('http://site.test' + link);
      await page.locator('.post-header h1').waitFor();
      assert.equal(await page.locator('dialog').evaluate(n => n.open), true);
      assert.equal(await page.locator('.post-spotify-player').count(), 1);
      assert.ok(!(await page.locator('.post-content').innerText()).includes('![['));
    }
    for (const url of ['/about.html','/work.html','/guestbook.html','/kr/','/kr.html','/studio.html','/blog.html']) {
      await page.goto('http://site.test' + url);
      if (url === '/blog.html') { await page.waitForURL('**/blog/'); await page.locator('.post-card').first().waitFor(); }
      assert.ok(!(await page.content()).includes('{%'));
      if (url.startsWith('/kr')) assert.equal(await page.locator('.latest-post-card h2').innerText(),'Loss');
    }
    await page.goto('http://site.test/');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.notEqual(await page.locator('.raindrop').first().evaluate(n => getComputedStyle(n).animationName),'none');
    assert.notEqual(await page.locator('.glass-droplet').first().evaluate(n => getComputedStyle(n).animationName),'none');
    assert.deepEqual(errors, []);
    console.log('PASS: production routes, eight Markdown posts, Spotify embeds, Korean latest post, rectangular rain, persistent weather, unchanged glass markup and animation with reduced motion enabled.');
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
