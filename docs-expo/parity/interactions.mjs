// Usage: node parity/interactions.mjs <outDir>
// Does the same steps in the two builds. After each step it compares the page state and a screenshot.
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { BUILDS, launchBrowser, newContext } from './browser.mjs';

const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });
const browser = await launchBrowser();
const log = {};

async function state(page) {
  return page.evaluate(() => ({
    url: location.pathname + location.search + location.hash,
    title: document.title,
    h1: document.querySelector('h1')?.textContent ?? null,
    marker: window.__marker ?? null,
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    lang: document.documentElement.lang,
    scrollTops: [...document.querySelectorAll('*')]
      .filter(el => el.scrollTop > 0)
      .map(el => Math.round(el.scrollTop)),
    activeSidebar:
      document.querySelector('nav a[aria-current="page"], a[aria-current="page"]')?.textContent ??
      null,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    titles: document.querySelectorAll('title').length,
  }));
}

for (const build of Object.keys(BUILDS)) {
  const base = BUILDS[build];
  const context = await newContext(browser, base, {
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err).slice(0, 300)));
  page.on('console', msg => {
    if (
      msg.type() === 'error' &&
      !/ERR_FAILED|Failed to load resource|ERR_BLOCKED/.test(msg.text())
    )
      errors.push(msg.text().slice(0, 300));
  });
  const steps = (log[build] = []);
  const record = async name => {
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(outDir, `${name}.${build}.png`),
      animations: 'disabled',
      caret: 'hide',
    });
    steps.push({ name, ...(await state(page)) });
  };

  await page.goto(base + '/get-started/create-a-project/', { waitUntil: 'load' });
  await page.evaluate(() => {
    window.__marker = 1;
  });
  await record('1-load');

  await page.click('a[href="/get-started/set-up-your-environment/"]');
  await page
    .waitForURL('**/get-started/set-up-your-environment/**', { timeout: 10000 })
    .catch(() => {});
  await record('2-sidebar-navigation');

  await page
    .click('a[href="/versions/latest/"], a[href="/versions/latest"]')
    .catch(() => steps.push({ name: 'reference link not found' }));
  await page.waitForTimeout(500);
  await record('3-section-navigation');

  await page.goBack();
  await record('4-back');

  await page.goto(base + '/versions/latest/sdk/camera/#usage', { waitUntil: 'load' });
  await record('5-load-with-hash');

  await page
    .click('nav.w-70 a[href="#api"]')
    .catch(() => steps.push({ name: 'toc link not found' }));
  await record('6-toc-click');

  await page.keyboard.press('Meta+k');
  await record('7-search-open');
  await page.keyboard.press('Escape');

  await page.goto(base + '/versions/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await record('8-redirect-page');

  await page.goto(
    base +
      '/get-started/set-up-your-environment/?mode=development-build&platform=ios&device=simulated',
    { waitUntil: 'load' }
  );
  await record('9-load-with-query');

  await page.getByText('iOS Simulator').first().click();
  await record('10-form-selection');

  await page.goBack();
  await record('11-back-after-form-selection');

  await page.goto(base + '/bare/upgrade/', { waitUntil: 'load' });
  await record('12-query-set-on-load');

  await page.goto(base + '/versions/latest/sdk/constants/', { waitUntil: 'load' });
  await record('13-page-with-expo-heading');

  steps.push({ name: 'errors', errors });
  await context.close();
}
await browser.close();

for (let i = 0; i < log.next.length; i++) {
  const a = log.next[i],
    b = log.expo[i];
  let pixels = '';
  const fa = path.join(outDir, `${a.name}.next.png`),
    fb = path.join(outDir, `${a.name}.expo.png`);
  if (fs.existsSync(fa) && fs.existsSync(fb)) {
    const pa = PNG.sync.read(fs.readFileSync(fa)),
      pb = PNG.sync.read(fs.readFileSync(fb));
    const diff = new PNG({ width: pa.width, height: pa.height });
    const n = pixelmatch(pa.data, pb.data, diff.data, pa.width, pa.height, { threshold: 0.1 });
    if (n) fs.writeFileSync(path.join(outDir, `${a.name}.diff.png`), PNG.sync.write(diff));
    pixels = ` pixels=${n}`;
  }
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${same ? 'SAME' : 'DIFF'} ${a.name}${pixels}`);
  if (!same) {
    console.log('   next ' + JSON.stringify(a).slice(0, 600));
    console.log('   expo ' + JSON.stringify(b).slice(0, 600));
  } else console.log('   ' + JSON.stringify(a).slice(0, 330));
}
