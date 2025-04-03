import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = '01-rsc';

// TODO: We'll split this test up in the future when server/single do different things.
const outputModes = ['single', 'server'] as const;

for (const outputMode of outputModes) {
  test.describe(`output: ${outputMode}`, () => {
    test.describe.configure({ mode: 'serial' });

    const expoStart = createExpoStart({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'development',
        EXPO_USE_STATIC: outputMode,
        E2E_ROUTER_JS_ENGINE: 'hermes',
        E2E_ROUTER_SRC: inputDir,
        E2E_ROUTER_ASYNC: 'development',
        E2E_RSC_ENABLED: '1',
        E2E_CANARY_ENABLED: '1',
        EXPO_USE_METRO_REQUIRE: '1',
        TEST_SECRET_VALUE: 'test-secret',

        // Ensure CI is disabled otherwise the file watcher won't run.
        CI: '0',
      },
    });

    test.beforeEach(async () => {
      console.time('expo start');
      await expoStart.startAsync();
      console.timeEnd('expo start');

      console.time('Eagerly bundled JS');
      await expoStart.fetchBundleAsync('/');
      console.timeEnd('Eagerly bundled JS');
    });
    test.afterEach(async () => {
      await expoStart.stopAsync();
    });

    test('renders RSC', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');

      const serverResponsePromise = page.waitForResponse((response) => {
        return new URL(response.url()).pathname.startsWith('/_flight/web/index.txt');
      });

      // Navigate to the app
      await page.goto(expoStart.url.href);
      console.timeEnd('Open page');

      await serverResponsePromise;

      // Wait for the app to load
      await page.waitForSelector('[data-testid="index-text"]');

      await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');

      await expect(page.locator('[data-testid="index-path"]')).toHaveText('/');
      await expect(page.locator('[data-testid="index-query"]')).toHaveText('');

      expect(pageErrors.all).toEqual([]);

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

    if (outputMode === 'server') {
      test('can use API routes', async ({ page }) => {
        const res = await page.goto(new URL('/api/endpoint', expoStart.url.href).href);

        expect(res?.status()).toBe(200);
        expect(await res?.json()).toEqual({ hello: 'world' });
      });
    }
  });
}
