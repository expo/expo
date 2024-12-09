import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { findProjectFiles, getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-01-rsc';

const expo = createExpoServe({
  cwd: projectRoot,
  env: {
    NODE_ENV: 'production',
    TEST_SECRET_VALUE: 'test-secret-dynamic',
  },
});

// These tests modify the same files in the file system, so run them in serial
test.describe.configure({ mode: 'serial' });
test.beforeAll('bundle and serve', async () => {
  console.time('expo export');
  await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
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
    path.join(projectRoot, inputDir, 'server/index.html'),
    path.join(projectRoot, inputDir, 'client/second.html')
  );

  console.time('expo serve');
  await expo.startAsync([inputDir]);
  console.timeEnd('expo serve');
});
test.afterAll(async () => {
  await expo.stopAsync();
});

const STATIC_RSC_PATH = path.join(projectRoot, inputDir, 'client/_flight');

// This test generally ensures no errors are thrown during an export loading.
test('loads without hydration errors', async ({ page }) => {
  // Ensure the JS code has string module IDs
  expect(findProjectFiles(STATIC_RSC_PATH)).toEqual(['web/index.txt']);

  // Listen for console logs and errors
  const pageErrors = pageCollectErrors(page);

  console.time('Open page');
  // Navigate to the app
  await page.goto(expo.url.href);
  console.timeEnd('Open page');

  console.time('hydrate');
  // Wait for the app to load
  await page.waitForSelector('[data-testid="index-text"]');

  await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');
  await expect(page.locator('[data-testid="index-path"]')).toHaveText('/');
  await expect(page.locator('[data-testid="index-query"]')).toHaveText('');

  console.timeEnd('hydrate');

  expect(pageErrors.all).toEqual([]);

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
  await expect(page.locator('link[rel="preload"][as="style"][href*="home.module"]')).toBeAttached();
  await expect(page.locator('link[rel="stylesheet"][href*="home.module"]')).toBeAttached();
});

test('dynamically renders RSC', async ({ page }) => {
  // Navigate to the app
  await page.goto(new URL('/second', expo.url).href);

  // Wait for the app to load
  await page.waitForSelector('[data-testid="second-text"]');

  await expect(page.locator('[data-testid="secret-text"]')).toHaveText(
    // Value should match the env var that we pass to the server after the build was completed, this will only work with dynamic rendering.
    'Secret: test-secret-dynamic'
  );
});

test('has dynamic headers', async ({ page }) => {
  // Navigate to the app
  await page.goto(new URL('/second', expo.url).href);

  // Wait for the app to load
  await page.waitForSelector('[data-testid="second-header-platform"]');

  await expect(page.locator('[data-testid="second-header-platform"]')).toHaveText(
    // Ensure the headers are rendered as expected
    'expo-platform: web'
  );
});
