import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = 'web-workers';

const inputDir = `dist-${testName}`;

test.describe(inputDir, () => {
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
        EXPO_USE_STATIC: 'single',
        E2E_ROUTER_SRC: testName,
        E2E_ROUTER_JS_ENGINE: 'hermes',
        E2E_ROUTER_ASYNC: 'true',
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

  test('calls web worker', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    console.time('Open page');
    // Navigate to the app
    await page.goto(expoServe.url.href);
    console.timeEnd('Open page');

    console.time('button');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="test-anchor"]');
    console.timeEnd('button');

    // Click the button
    await page.click('[data-testid="test-anchor"]');

    expect(await page.textContent('[data-testid="data-1"]')).toBe('20');

    expect(pageErrors.all).toEqual([]);
  });
});
