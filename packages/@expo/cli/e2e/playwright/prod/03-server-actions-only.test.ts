import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '03-server-actions-only';

const staticModes = ['single', 'server'] as const;

for (const outputMode of staticModes) {
  const inputDir = `dist-${testName}_${outputMode}`;

  test.describe(`EXPO_USE_STATIC: ${outputMode}`, () => {
    // Configure this describe block to run serially on a single worker so we don't bundle multiple times to the same on-disk location.
    test.describe.configure({ mode: 'serial' });

    const expoServe = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_VALUE: 'test-secret',
      },
    });

    test.beforeAll('bundle and serve', async () => {
      console.time('expo export');
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
        env: {
          EXPO_USE_STATIC: outputMode,
          E2E_ROUTER_SRC: testName,
          E2E_SERVER_FUNCTIONS: '1',
          E2E_ROUTER_JS_ENGINE: 'hermes',
          EXPO_USE_METRO_REQUIRE: '1',
          E2E_CANARY_ENABLED: '1',
          //   E2E_RSC_ENABLED: '1',
          TEST_SECRET_VALUE: 'test-secret',
          CI: '1',
        },
      });
      console.timeEnd('expo export');

      console.time('expo serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll('Close server', async () => {
      await expoServe.stopAsync();
    });

    // This test generally ensures no errors are thrown during an export loading.
    test('loads without hydration errors', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      // Navigate to the app
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      console.time('hydrate');
      // Wait for the app to load
      await page.waitForSelector('[data-testid="index-text"]');
      console.timeEnd('hydrate');

      expect(pageErrors.all).toEqual([]);

      await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');
      await expect(page.locator('[data-testid="server-contents"]')).toHaveText('Hello!');
    });

    if (outputMode === 'server') {
      test('supports API routes in server mode', async ({ page }) => {
        const response = await page.goto(new URL('/api/endpoint', expoServe.url).href);
        expect(response?.status()).toBe(200);
        expect(await response?.json()).toEqual({ hello: 'world' });
      });
    }
  });
}
