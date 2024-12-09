import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-css-global-import';

test.describe(inputDir, () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.beforeEach('bundle and serve', async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'css-global-import',
      },
    });
    console.timeEnd('expo export');

    console.time('expo serve');
    await expoServe.startAsync([inputDir]);
    console.timeEnd('expo serve');
  });

  test.afterAll(async () => {
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

    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    // Ensure the text color is blue
    const indexText = await page.$('[data-testid="index-text"]');
    expect(indexText).not.toBeNull();
    expect(await indexText?.evaluate((node) => getComputedStyle(node).color)).toBe(
      'rgb(0, 0, 255)'
    );

    // Ensure the text color is blue
    const betaText = await page.$('[data-testid="beta-text"]');
    expect(betaText).not.toBeNull();
    expect(await betaText?.evaluate((node) => getComputedStyle(node).color)).toBe('rgb(255, 0, 0)');

    expect(pageErrors.all).toEqual([]);

    // Ensure expected tags
    // <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap">
    // <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300" media="screen and (min-width: 900px)">

    await page.$(
      'link[rel="stylesheet"][href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap"]'
    );
    await page.$('link[rel="stylesheet"][media="screen and (min-width: 900px)"]');
  });
});
