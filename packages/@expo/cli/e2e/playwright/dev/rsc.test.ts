import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { ExpoStartCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = '01-rsc';

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let expo: ExpoStartCommand;

  test.beforeEach(async () => {
    expo = new ExpoStartCommand(projectRoot, {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',
      E2E_RSC_ENABLED: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_METRO_REQUIRE: '1',
      TEST_SECRET_VALUE: 'test-secret',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    });
  });

  test.afterEach(async () => {
    await expo.stopAsync();
  });

  test('renders RSC', async ({ page }) => {
    console.time('expo start');
    await expo.startAsync();
    console.timeEnd('expo start');
    console.log('Server running:', expo.url);
    console.time('Eagerly bundled JS');
    await expo.fetchAsync('/');
    console.timeEnd('Eagerly bundled JS');

    console.time('Open page');

    const serverResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/index.txt');
    });

    // Listen for console errors
    const errorLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    // Listen for uncaught exceptions and console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to the app
    await page.goto(expo.url!);
    console.timeEnd('Open page');

    await serverResponsePromise;

    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');

    await expect(page.locator('[data-testid="index-path"]')).toHaveText('/');
    await expect(page.locator('[data-testid="index-query"]')).toHaveText('');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);

    // Interactivity

    // Wait for the app to load
    await page.waitForSelector('[data-testid="client-button"]');

    await expect(page.locator('[data-testid="client-button"]')).toHaveText('Count: 0');

    // - Click button
    await page.locator('[data-testid="client-button"]').click();

    await expect(page.locator('[data-testid="client-button"]')).toHaveText('Count: 1');

    // CSS styles exist
    await expect(page.locator('[data-testid="layout-global-style"]')).toHaveCSS(
      'background-color',
      'rgb(0, 128, 0)'
    );
    await expect(page.locator('[data-testid="layout-module-style"]')).toHaveCSS(
      'background-color',
      'rgb(127, 255, 212)'
    );
  });
});
