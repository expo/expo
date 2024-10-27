import { expect, test } from '@playwright/test';
import execa from 'execa';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { bin, ServeStaticCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-css-global-import';

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let serveCmd: ServeStaticCommand;

  test.beforeEach('bundle and serve', async ({}, testInfo) => {
    console.time('hydration setup');
    testInfo.setTimeout(testInfo.timeout + 30000);

    console.time('expo export');
    await execa('node', [bin, 'export', '-p', 'web', '--output-dir', inputDir], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'css-global-import',
      },
    });
    console.timeEnd('expo export');

    serveCmd = new ServeStaticCommand(projectRoot, {
      NODE_ENV: 'production',
    });
    console.timeEnd('hydration setup');

    console.time('npx serve');
    await serveCmd.startAsync([inputDir]);
    console.timeEnd('npx serve');
    console.log('Server running:', serveCmd.url);
  });

  test.afterAll(async () => {
    await serveCmd.stopAsync();
  });

  // This test generally ensures no errors are thrown during an export loading.
  test('loads without hydration errors', async ({ page }) => {
    console.time('Open page');
    // Navigate to the app
    await page.goto(serveCmd.url);

    console.timeEnd('Open page');

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

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);

    // Ensure expected tags
    // <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap">
    // <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300" media="screen and (min-width: 900px)">

    await page.$(
      'link[rel="stylesheet"][href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap"]'
    );
    await page.$('link[rel="stylesheet"][media="screen and (min-width: 900px)"]');
  });
});
