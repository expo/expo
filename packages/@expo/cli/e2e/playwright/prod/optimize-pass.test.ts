import { expect, test } from '@playwright/test';
import fs from 'fs';
import klawSync from 'klaw-sync';
import path from 'path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-optimize-pass';

const expoServe = createExpoServe({
  cwd: projectRoot,
  env: {
    NODE_ENV: 'production',
  },
});

// These tests modify the same files in the file system, so run them in serial
test.describe.configure({ mode: 'serial' });
test.beforeEach('bundle and serve', async () => {
  console.time('expo export');
  await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'static',
      E2E_ROUTER_SRC: 'tree-shaking',
      EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH: 'true',
      EXPO_USE_METRO_REQUIRE: 'true',
    },
  });
  console.timeEnd('expo export');

  console.time('expo serve');
  await expoServe.startAsync([inputDir]);
  console.timeEnd('expo serve');
});
test.afterEach(async () => {
  await expoServe.stopAsync();
});

// This test generally ensures no errors are thrown during an export loading.
test('loads without hydration errors', async ({ page }) => {
  // Ensure the JS code has string module IDs
  const jsFile = klawSync(path.join(projectRoot, inputDir, '_expo/static/js'), {
    nodir: true,
  });

  const largest = [...jsFile].sort((a, b) => b.stats.size - a.stats.size)[0].path;
  const largestFile = fs.readFileSync(largest, 'utf8');

  // Sanity
  expect(largestFile).toMatch(/__r\("packages\/expo-router\/entry.js"\);/);
  // This icon will remain because tree shaking is disabled.
  expect(largestFile).toMatch(/test-icon-apple/);
  // This icon remains.
  expect(largestFile).toMatch(/test-icon-banana/);

  // Listen for console logs and errors
  const pageErrors = pageCollectErrors(page);

  console.time('Open page');
  // Navigate to the app
  await page.goto(expoServe.url.href);
  console.timeEnd('Open page');

  // Wait for the app to load
  await page.waitForSelector('[data-testid="async-chunk"]');
  await page.waitForSelector('[data-testid="test-icon-banana"]');
  // await page.waitForSelector('[data-testid="optional-existing"]');

  expect(pageErrors.all).toEqual([]);
});
