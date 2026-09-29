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
 * The server-rendered HTML is interactive only once the client has committed. With async routes
 * the client first loads the layout chunks for the URL, which Metro bundles on demand, so wait for
 * the router to write its browser history entry before interacting with the page.
 */
async function waitForClientCommit(page: Page, previousEntryId?: string) {
  await expect
    .poll(() => page.evaluate(() => history.state?.id), { timeout: 120 * 1000 })
    .toEqual(expect.any(String));
  if (previousEntryId) {
    await expect
      .poll(() => page.evaluate(() => history.state?.id), { timeout: 120 * 1000 })
      .not.toBe(previousEntryId);
  }
  return page.evaluate(() => history.state.id as string);
}

// Async routes are the web default in SDK 58. In development no route chunk is linked in the
// HTML, so `_layout` modules load after the route tree is built and the client must still read
// `unstable_settings.anchor` from them.
// See: https://github.com/expo/expo/issues/50641
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

    test('deep links into an anchored stack and goes back to the anchor', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/anchored/details', expoStart.url).href);
      await waitForClientCommit(page);
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      // The anchor sits below the deep-linked screen, so in-app back reaches it.
      await page.locator('[data-testid="anchored-back"]').click();
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await expect(page).toHaveURL(/\/anchored$/);

      expect(pageErrors.all).toEqual([]);
    });

    test('keeps the anchor below the screen after a reload', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/anchored', expoStart.url).href);
      await waitForClientCommit(page);
      await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
      await page.locator('[data-testid="go-anchored-details"]').click();
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );
      const entryId = await page.evaluate(() => history.state.id as string);

      await page.reload();
      await waitForClientCommit(page, entryId);
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
