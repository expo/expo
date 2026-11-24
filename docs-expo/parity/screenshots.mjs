// Usage: node parity/screenshots.mjs <outDir> <pathsFile> [--viewport WxH] [--scheme light|dark]
//   [--label name] [--threshold 0.1] [--settle 1200] [--concurrency 1] [--self <port>]
//   [--delete-same] [--no-diff-images]
// Takes a screenshot of each path in the two builds and counts the different pixels.
// `--self` compares one build with itself, to measure the noise of the method.
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { BUILDS as DEFAULT_BUILDS, launchBrowser, newContext } from './browser.mjs';

const args = process.argv.slice(2);
const [outDir, pathsFile] = args;
const opt = name => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const [width, height] = (opt('viewport') ?? '1440x900').split('x').map(Number);
const scheme = opt('scheme') ?? 'light';
const label = opt('label') ?? `${width}x${height}-${scheme}`;
const scrollTo = opt('scroll');
const BUILDS = opt('self')
  ? { next: `http://127.0.0.1:${opt('self')}`, expo: `http://127.0.0.1:${opt('self')}` }
  : DEFAULT_BUILDS;
const paths = fs
  .readFileSync(pathsFile, 'utf8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'));
fs.mkdirSync(path.join(outDir, label), { recursive: true });

const browser = await launchBrowser();
const results = [];

async function shoot(build, p, file) {
  const context = await newContext(browser, BUILDS[build], {
    viewport: { width, height },
    colorScheme: scheme,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err).slice(0, 300)));
  page.on('requestfailed', req => {
    if (req.url().startsWith(BUILDS[build]) && !/\.(mp4|webm)/.test(req.url()))
      errors.push(
        `requestfailed ${req.url().slice(BUILDS[build].length, BUILDS[build].length + 80)}`
      );
  });
  page.on('console', msg => {
    if (
      msg.type() === 'error' &&
      !/ERR_FAILED|Failed to load resource|ERR_BLOCKED/.test(msg.text())
    )
      errors.push(msg.text().slice(0, 300));
  });
  await page.goto(BUILDS[build] + p, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(Number(opt('settle') ?? 1200));
  // A playing video shows a different frame in each screenshot. Stop each video at its start.
  const videos = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('video')];
    await Promise.all(
      list.map(
        video =>
          new Promise(resolve => {
            video.pause();
            if (video.readyState < 1) return resolve();
            video.addEventListener('seeked', resolve, { once: true });
            video.currentTime = 0;
            setTimeout(resolve, 1500);
          })
      )
    );
    return list.length;
  });
  if (videos) await page.waitForTimeout(400);
  if (scrollTo) {
    await page.evaluate(y => {
      document.querySelectorAll('*').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 200 && getComputedStyle(el).overflowY !== 'visible')
          el.scrollTop = y;
      });
    }, Number(scrollTo));
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  await context.close();
  return errors;
}

async function comparePath(p) {
  const name = p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  const files = Object.fromEntries(
    Object.keys(BUILDS).map(b => [b, path.join(outDir, label, `${name}.${b}.png`)])
  );
  const errors = {};
  // A failed request makes the screenshot invalid. Take it again.
  await Promise.all(
    Object.keys(BUILDS).map(async build => {
      for (let attempt = 0; attempt < 3; attempt++) {
        errors[build] = await shoot(build, p, files[build]);
        if (!errors[build].some(error => error.startsWith('requestfailed'))) break;
      }
    })
  );
  const a = PNG.sync.read(fs.readFileSync(files.next));
  const b = PNG.sync.read(fs.readFileSync(files.expo));
  let diffPixels = -1;
  if (a.width === b.width && a.height === b.height) {
    const diff = new PNG({ width: a.width, height: a.height });
    diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: Number(opt('threshold') ?? 0.1),
    });
    if (diffPixels > 0 && !args.includes('--no-diff-images'))
      fs.writeFileSync(path.join(outDir, label, `${name}.diff.png`), PNG.sync.write(diff));
  }
  const ratio = diffPixels < 0 ? null : diffPixels / (a.width * a.height);
  results.push({ path: p, diffPixels, ratio, errors });
  if (diffPixels === 0 && args.includes('--delete-same')) {
    fs.rmSync(files.next);
    fs.rmSync(files.expo);
  }
  console.log(
    `${diffPixels === 0 ? 'SAME' : 'DIFF'} ${String(diffPixels).padStart(8)} ${(ratio * 100).toFixed(3).padStart(7)}%  ${p}${errors.expo.length ? '  expoErrors=' + JSON.stringify(errors.expo.slice(0, 2)) : ''}${errors.next.length ? '  nextErrors=' + errors.next.length : ''}`
  );
}
const concurrency = Number(opt('concurrency') ?? 1);
const queue = [...paths];
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        await comparePath(p);
      } catch (error) {
        results.push({
          path: p,
          diffPixels: -2,
          ratio: null,
          errors: { next: [], expo: [String(error).slice(0, 200)] },
        });
        console.log(`FAIL ${p} ${String(error).slice(0, 200)}`);
      }
    }
  })
);
fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(results, null, 1));
const same = results.filter(r => r.diffPixels === 0).length;
console.log(`${label}: ${same}/${results.length} identical`);
await browser.close();
