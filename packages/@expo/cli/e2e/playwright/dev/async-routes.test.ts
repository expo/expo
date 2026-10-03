import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

test.setTimeout(560 * 1000);

/**
 * The server-rendered HTML is interactive only once the client has hydrated. With async routes the
 * client first loads the layout chunks for the URL, which Metro bundles on demand, so wait for the
 * marker the root layout renders after it mounts before interacting with the page.
 */
async function waitForHydration(page: Page) {
  await page.waitForSelector('[data-testid="root-mounted"]');
}

/** The route files whose split bundles the page requested, relative to the app directory. */
function collectRouteBundleRequests(page: Page) {
  const requested: string[] = [];
  page.on('request', (request) => {
    const match = request.url().match(/\/navigator-browser-history\/app\/(.+)\.bundle\?/);
    if (match) {
      requested.push(match[1]!);
    }
  });
  return requested;
}

// In development no route chunk is linked in the HTML, so every route module the client needs
// is requested from Metro after the route tree is built. Only the layouts on the URL may load.
for (const outputMode of ['server', 'static'] as const) {
  test.describe(`${inputDir} with async routes in development (${outputMode})`, () => {
    test.describe.configure({ mode: 'serial' });
    const expoStart = createExpoStart({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'development',
        EXPO_USE_STATIC: outputMode,
        E2E_ROUTER_SRC: inputDir,
        E2E_ROUTER_ASYNC: 'true',

        // Ensure CI is disabled otherwise the file watcher won't run.
        CI: '0',
      },
    });

    test.beforeAll(async () => {
      await expoStart.startAsync();
      await expoStart.fetchBundleAsync('/');
    });

    test.afterAll(async () => {
      await expoStart.stopAsync();
    });

    test('loads only the layouts on the initial URL', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);
      const requested = collectRouteBundleRequests(page);

      await page.goto(expoStart.url.href);
      await waitForHydration(page);
      await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

      // The layouts load in ancestry order, then the page loads when it renders.
      expect(requested).toEqual(['_layout', '(tabs)/_layout', '(tabs)/index']);
      expect(pageErrors.all).toEqual([]);
    });

    test('deep links into an anchored stack and goes back to the anchor', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);
      const requested = collectRouteBundleRequests(page);

      await page.goto(new URL('/anchored/details', expoStart.url).href);
      await waitForHydration(page);
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      // The anchor sits below the deep-linked screen, so in-app back reaches it.
      await page.locator('[data-testid="anchored-back"]').click();
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await expect(page).toHaveURL(/\/anchored$/);

      expect(requested).not.toContain('(tabs)/explore/_layout');
      expect(pageErrors.all).toEqual([]);
    });

    test('keeps the anchor below the screen after a reload', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/anchored', expoStart.url).href);
      await waitForHydration(page);
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await page.locator('[data-testid="go-anchored-details"]').click();
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      await page.reload();
      await waitForHydration(page);
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      await page.locator('[data-testid="anchored-back"]').click();
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await expect(page).toHaveURL(/\/anchored$/);

      expect(pageErrors.all).toEqual([]);
    });
  });
}
