/* This tests rendering an app with URI-unsafe characters in the project path.
 * We have a project inside a "with spaces" folder and expect it to render as
 * expected in development.
 * See:
 * - https://github.com/expo/expo/pull/34289
 * - https://github.com/expo/expo/issues/32843
 */

import { test, expect } from '@playwright/test';

import { setupTestProjectWithOptionsAsync } from '../../__tests__/utils';
import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

test.describe('router-e2e with spaces', () => {
  let expoStart: ReturnType<typeof createExpoStart>;

  test.beforeEach(async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      // NOTE(@kitten): This space is reflected in the project root:
      'with spaces',
      'with-router',
      {
        linkExpoPackages: ['expo-router' ],
      }
    );

    expoStart = createExpoStart({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'development',
        E2E_USE_STATIC: 'static',
      },
    });

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('renders without errors', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    // Ensure the initial hash is correct
    await expect(page.locator('[data-testid="content"]')).toHaveText('Index');

    expect(pageErrors.all).toEqual([]);
  });
});
