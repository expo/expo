import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

/** The split chunks the page requested, as file names. */
function collectChunkRequests(page: Page) {
  const requested: string[] = [];
  page.on('request', (request) => {
    const match = request.url().match(/\/_expo\/static\/js\/web\/([^/?]+\.js)/);
    if (match) {
      requested.push(match[1]!);
    }
  });
  return requested;
}

/** The split chunks linked in the HTML, as file names. */
function getLinkedChunks(page: Page) {
  return page.evaluate(() =>
    Array.from(document.scripts, (script) => script.src.split('/').pop()!).filter(Boolean)
  );
}

// In production the HTML links the chunks of the layouts and the page on the URL, so the client
// has every module it needs before it builds the route tree. No other chunk may load.
for (const outputMode of ['server', 'static'] as const) {
  const outputDir = `dist-async-routes_${outputMode}`;

  test.describe(`${inputDir} with async routes in production (${outputMode})`, () => {
    // Run serially on a single worker so the export is not written twice to the same location.
    test.describe.configure({ mode: 'serial' });

    const expoServe = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    test.beforeAll(async () => {
      console.time('expo export');
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: outputMode,
          E2E_ROUTER_SRC: inputDir,
          E2E_ROUTER_ASYNC: 'true',
          CI: '1',
        },
      });
      console.timeEnd('expo export');

      console.time('expo serve');
      await expoServe.startAsync([outputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('requests only the chunks linked in the HTML', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);
      const requested = collectChunkRequests(page);

      await page.goto(expoServe.url.href);
      await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');
      // Give the runtime a chance to request chunks after hydration.
      await page.waitForTimeout(1000);

      // The chunks load in the order the HTML links them: runtime, layouts, page, entry.
      const linked = await getLinkedChunks(page);
      expect(linked.filter((chunk) => chunk.startsWith('_layout-'))).toHaveLength(2);
      expect(requested).toEqual(linked);
      expect(pageErrors.all).toEqual([]);
    });

    test('reads the anchor of a layout linked in the HTML', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);
      const requested = collectChunkRequests(page);

      await page.goto(new URL('/anchored/details', expoServe.url).href);
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      // The anchor sits below the deep-linked screen, so in-app back reaches it.
      await page.locator('[data-testid="anchored-back"]').click();
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await expect(page).toHaveURL(/\/anchored$/);

      const linked = await getLinkedChunks(page);
      expect(linked.filter((chunk) => chunk.startsWith('_layout-'))).toHaveLength(3);
      expect(requested).toEqual(linked);
      expect(pageErrors.all).toEqual([]);
    });
  });
}
