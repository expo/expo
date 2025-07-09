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
const inputDir = 'dist-stable-module-ids';

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
        E2E_ROUTER_SRC: 'compiler',
        E2E_ROUTER_COMPILER: 'true',
        EXPO_USE_METRO_REQUIRE: 'true',
      },
    });
    console.timeEnd('expo export');

    console.time('expo start');
    await expoServe.startAsync([inputDir]);
    console.timeEnd('expo start');
  });
  test.afterEach(async () => {
    await expoServe.stopAsync();
  });

  // This test generally ensures no errors are thrown during an export loading.
  test('loads compiler', async ({ page }) => {
    // Ensure the JS code has string module IDs
    const jsFile = findProjectFiles(path.join(projectRoot, inputDir, '_expo/static/js'))
      .map((file) => path.join(projectRoot, inputDir, '_expo/static/js', file))
      .find((file) => file.endsWith('.js'));
    expect(fs.readFileSync(jsFile!, 'utf8')).toMatch(/__r\("packages\/expo-router\/entry.js"\);/);

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
