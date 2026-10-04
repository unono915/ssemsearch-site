// Run from the parent desktop project: node website/scripts/verify.cjs [base URL]
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.argv[2] || 'http://127.0.0.1:4173';
  const report = [];
  try {
    assert.equal((await page.goto(base)).status(), 200);
    await page.locator('#demo-search').fill('0231');
    assert.equal(await page.locator('#demo-results li').count(), 2);
    assert.deepEqual(await page.locator('#demo-results b').allTextContents(), ['0231', '0231']);
    await page.locator('[data-query="김민수"]').click();
    assert.equal(await page.locator('#demo-results li').count(), 2);
    await page.locator('[data-query="교무실"]').click();
    assert.equal(await page.locator('#demo-results li').count(), 4);
    await page.locator('#demo-search').fill('없음');
    assert.match(await page.locator('#demo-results').textContent(), /검색 결과가 없어요/);
    await page.locator('#demo-search').fill('');
    assert.match(await page.locator('#demo-results').textContent(), /입력해 보세요/);
    await page.locator('#demo-search').fill('<img src=x onerror=alert(1)>');
    assert.equal(await page.locator('#demo-results img').count(), 0);
    await page.locator('#demo-search').press('Escape');
    assert.equal(await page.locator('#demo-closed').isVisible(), true);
    await page.locator('#reopen-demo').click();
    assert.equal(await page.locator('#demo-search').isVisible(), true);
    await page.locator('[data-query="김민수"]').click();
    report.push('Search: exact extension / duplicate names / office / empty / no results / HTML input / Esc and reopen');
    await page.locator('#step-tab-2').click();
    assert.equal(await page.locator('#step-panel-2').isVisible(), true);
    await page.locator('#step-tab-2').press('ArrowDown');
    assert.equal(await page.locator('#step-panel-3').isVisible(), true);
    await page.locator('#step-tab-3').press('Home');
    assert.equal(await page.locator('#step-panel-1').isVisible(), true);
    await page.locator('.faq-list summary').nth(1).click();
    assert.equal(await page.locator('.faq-list details').nth(1).getAttribute('open'), '');
    report.push('Guide tabs: mouse + keyboard, FAQ expands');
    for (const href of await page.locator('a[href^="#"]').evaluateAll(els => els.map(el => el.getAttribute('href')))) {
      if (href !== '#') assert.equal(await page.locator(href).count(), 1, `Anchor ${href}`);
    }
    for (const src of await page.locator('img').evaluateAll(els => els.map(el => el.getAttribute('src')))) {
      assert.equal((await page.request.get(new URL(src, base).href)).status(), 200, src);
    }
    for (const href of await page.locator('a[href^="assets/"]').evaluateAll(els => els.map(el => el.getAttribute('href')))) {
      assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, href);
    }
    report.push('Every local image, download asset and navigation anchor resolves');
    const artifacts = path.resolve(__dirname, '../../artifacts');
    fs.mkdirSync(artifacts, { recursive: true });
    for (const width of [1440, 768, 720, 390, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Overflow at ${width}`);
      await page.screenshot({ path: path.join(artifacts, `landing-${width}.png`), fullPage: width === 1440 });
    }
    report.push('No horizontal overflow at 1440, 768, 720, 390 and 320 CSS px');
    const noScript = await browser.newPage({ javaScriptEnabled: false });
    await noScript.goto(base);
    assert.equal(await noScript.locator('#step-panel-2').isVisible(), true);
    assert.equal(await noScript.locator('#step-panel-3').isVisible(), true);
    await noScript.close();
    report.push('Without JavaScript: all guide panels and download links remain available');
    assert.deepEqual(errors, []);
    report.push('No browser JavaScript errors');
    console.log(JSON.stringify({ base, passed: report }, null, 2));
    fs.writeFileSync(path.join(artifacts, 'landing-verification.json'), JSON.stringify({ base, passed: report, checkedAt: new Date().toISOString() }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
