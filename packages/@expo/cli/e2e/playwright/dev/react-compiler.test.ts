import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const baseDir = 'dist-react-compiler';

test.describe(baseDir, () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.describe('default', () => {
    const inputDir = 'dist-react-compiler-default';

    test.beforeEach('bundle and serve', async () => {
      console.time('expo export');
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'compiler',
          E2E_ROUTER_COMPILER: 'true',
        },
      });
      console.timeEnd('expo export');

      console.time('npx serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('npx serve');
    });
    test.afterEach(async () => {
      await expoServe.stopAsync();
    });

    // This test generally ensures no errors are thrown during an export loading.
    test('loads compiler', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      // Navigate to the app
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      console.time('hydrate');
      // Wait for the app to load
      await expect(page.locator('[data-testid="react-compiler"]')).toHaveText('2');
      console.timeEnd('hydrate');

      expect(pageErrors.all).toEqual([]);
    });
  });

  test.describe('without live bindings', () => {
    const inputDir = 'dist-react-compiler-no-live-bindings';

    test.beforeEach('bundle and serve', async () => {
      console.time('expo export');
      const res = await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--output-dir', inputDir],
        {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_SRC: 'compiler',
            E2E_ROUTER_COMPILER: 'true',
            EXPO_UNSTABLE_LIVE_BINDINGS: 'false',
          },
        }
      );
      console.timeEnd('expo export');

      console.log('expo export result:', res.stdout, res.stderr);

      console.time('npx serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('npx serve');
    });
    test.afterEach(async () => {
      await expoServe.stopAsync();
    });

    // This test generally ensures no errors are thrown during an export loading.
    test('fails to load', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      // Navigate to the app
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      await page.waitForTimeout(500); // Wait for the runtime error

      expect(pageErrors.errors).toContainEqual(new Error('Prefix is not defined.'));
    });
  });
});
