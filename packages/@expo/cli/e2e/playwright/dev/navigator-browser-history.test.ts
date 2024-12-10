import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

test.setTimeout(560 * 1000);

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    await expoStart.startAsync();
    await expoStart.fetchBundleAsync('/');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  // Test expo router history by navigating through <Link>,
  // then using the browser back/forward actions
  test('navigator browser history', async ({ page }) => {
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(`${expoStart.url}`);

    // <Stack> in the browser currently works by setting hidden
    // screens to `display: none`, so we could just use 'home-content'
    // for all these checks, but using separate ids in case that
    // behavior changes
    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.locator('[data-testid="go-explore"]').click();

    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');

    await page.goBack();

    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.goForward();

    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');
  });
});
