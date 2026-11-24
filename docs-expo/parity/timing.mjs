// Usage: node parity/timing.mjs <path> <name=url>...
// Measures, for each build, the time from navigation start to the first sidebar scroll.
// The sidebar scrolls to the active entry after hydration, so this time shows when the
// page became interactive. It prints the median of seven loads. Use a page whose active
// sidebar entry is below the viewport, for example `/versions/latest/sdk/video/`.
import { launchBrowser, newContext } from './browser.mjs';

const [pagePath, ...builds] = process.argv.slice(2);
const RUNS = 7;
const browser = await launchBrowser();

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

for (const build of builds) {
  const [name, baseUrl] = build.split('=');
  const results = { firstScroll: [], load: [], scriptTime: [] };
  for (let run = 0; run < RUNS; run++) {
    const context = await newContext(browser, baseUrl, { viewport: { width: 1440, height: 2000 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const check = () => {
        const scrolled = [...document.querySelectorAll('*')].some(
          element => element.scrollTop > 0 && element.getBoundingClientRect().x < 280
        );
        if (scrolled) {
          window.__firstSidebarScroll = performance.now();
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
    await page.goto(baseUrl + pagePath, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__firstSidebarScroll, null, { timeout: 15000 });
    const timing = await page.evaluate(() => ({
      firstScroll: window.__firstSidebarScroll,
      load: performance.getEntriesByType('navigation')[0].loadEventStart,
    }));
    results.firstScroll.push(timing.firstScroll);
    results.load.push(timing.load);
    await context.close();
  }
  console.log(
    `${name.padEnd(9)} load event ${Math.round(median(results.load))} ms, first sidebar scroll ${Math.round(median(results.firstScroll))} ms`
  );
}
await browser.close();
