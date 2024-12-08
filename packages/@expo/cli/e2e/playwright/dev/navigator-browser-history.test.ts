import { test, Page, WebSocket, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { ExpoStartCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let expo: ExpoStartCommand;

  test.beforeEach(async () => {
    expo = new ExpoStartCommand(projectRoot, {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    });
  });

  test.afterEach(async () => {
    await expo.stopAsync();
  });

  // Test expo router history by navigating through <Link>,
  // then using the browser back/forward actions
  test('navigator browser history', async ({ page }) => {
    await expo.startAsync(['--port=8085']);
    console.log('Server running:', expo.url);
    await expo.fetchAsync('/');
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(`${expo.url}/`);

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
