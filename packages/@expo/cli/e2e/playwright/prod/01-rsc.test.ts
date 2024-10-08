import { expect, test } from '@playwright/test';
import execa from 'execa';
import fs from 'fs';
import klawSync from 'klaw-sync';
import path from 'path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { bin, ServeLocalCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-01-rsc';

test.beforeAll(async () => {
  // Could take 45s depending on how fast the bundler resolves
  test.setTimeout(560 * 1000);
});

let serveCmd: ServeLocalCommand;

test.beforeAll('bundle and serve', async () => {
  console.time('expo export');
  await execa('node', [bin, 'export', '-p', 'web', '--output-dir', inputDir], {
    cwd: projectRoot,
    env: {
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      E2E_RSC_ENABLED: '1',
      EXPO_USE_STATIC: 'single',
      NODE_ENV: 'production',
      E2E_ROUTER_SRC: '01-rsc',
      TEST_SECRET_VALUE: 'test-secret',
    },
  });
  console.timeEnd('expo export');

  // Duplicate the index.html file for an SPA-style export.
  fs.copyFileSync(
    path.join(projectRoot, inputDir, 'client/index.html'),
    path.join(projectRoot, inputDir, 'client/second.html')
  );

  serveCmd = new ServeLocalCommand(projectRoot, {
    NODE_ENV: 'production',
    TEST_SECRET_VALUE: 'test-secret-dynamic',
  });

  console.time('npx serve');
  await serveCmd.startAsync(['__e2e__/01-rsc/server.js', '--port=' + 3034, '--dist=' + inputDir]);
  console.timeEnd('npx serve');
  console.log('Server running:', serveCmd.url);
});

test.afterAll(async () => {
  await serveCmd.stopAsync();
});

const STATIC_RSC_PATH = path.join(projectRoot, inputDir, 'client/_flight');

test.describe.serial(inputDir, () => {
  // This test generally ensures no errors are thrown during an export loading.
  test('loads without hydration errors', async ({ page }) => {
    // Ensure the JS code has string module IDs
    const rscFiles = klawSync(STATIC_RSC_PATH, {
      nodir: true,
    }).map((entry) => path.relative(STATIC_RSC_PATH, entry.path));
    expect(rscFiles).toEqual(['web/index.txt']);

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

    console.time('hydrate');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');
    await expect(page.locator('[data-testid="index-path"]')).toHaveText('/');
    await expect(page.locator('[data-testid="index-query"]')).toHaveText('');

    console.timeEnd('hydrate');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);

    // NOTE: I had issues splitting up the tests, so consider this the next test:
    // it 'hydrates the client component'

    // Wait for the app to load
    await page.waitForSelector('[data-testid="client-button"]');

    await expect(page.locator('[data-testid="client-button"]')).toHaveText('Count: 0');

    // Click button
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

    // Ensure head has preloaded CSS files:
    // <link rel="preload" href="/_expo/static/css/global-9c7022062f03d614bbbb2e534c66e10a.css" as="style"><link rel="stylesheet" href="/_expo/static/css/global-9c7022062f03d614bbbb2e534c66e10a.css"><link rel="preload" href="/_expo/static/css/home.module-8cd85e4c745d413359c336799092a7ea.css" as="style"><link rel="stylesheet" href="/_expo/static/css/home.module-8cd85e4c745d413359c336799092a7ea.css"></head>
    await expect(page.locator('link[rel="preload"][as="style"][href*="global"]')).toBeAttached();
    await expect(page.locator('link[rel="stylesheet"][href*="global"]')).toBeAttached();
    await expect(
      page.locator('link[rel="preload"][as="style"][href*="home.module"]')
    ).toBeAttached();
    await expect(page.locator('link[rel="stylesheet"][href*="home.module"]')).toBeAttached();
  });

  test('dynamically renders RSC', async ({ page }) => {
    // Navigate to the app
    await page.goto(new URL('/second', serveCmd.url).toString());

    // Wait for the app to load
    await page.waitForSelector('[data-testid="second-text"]');

    await expect(page.locator('[data-testid="secret-text"]')).toHaveText(
      // Value should match the env var that we pass to the server after the build was completed, this will only work with dynamic rendering.
      'Secret: test-secret-dynamic'
    );
  });
});
