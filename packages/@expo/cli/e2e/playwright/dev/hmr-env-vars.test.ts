/**
 * Test that environment variables in dot env files update automatically
 * while the dev server is running.
 */
import { test, expect } from '@playwright/test';
import { platform } from 'node:process';

import { setupTestProjectWithOptionsAsync } from '../../__tests__/utils';
import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

import path from 'node:path';
import { mutateFile, openPageAndEagerlyLoadJS } from '../../utils/hmr';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

test.describe('router-e2e with spaces', () => {
  if (platform === 'win32') {
    test.skip('skipping on windows', () => {
      // This test is skipped on Windows due to an issue with expo-module-scripts when cloning a project outside of the repo.
    });
    return;
  }

  let expoStart: ReturnType<typeof createExpoStart>;

  let projectRoot: string = '';
  test.beforeEach(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync(
      // NOTE(@kitten): This space is reflected in the project root:
      'hmr-env-vars',
      'with-hmr-env-vars',
      // We're installing the @expo/cli from our workspace source into the newly
      // created project. This is required to be able to execute the SSR bundle
      // outside the Expo monorepo module
      {
        linkExpoPackages: ['expo'],
        linkExpoPackagesDev: ['@expo/cli', 'babel-preset-expo', '@expo/metro-config', '@expo/server'],
      }
    );

    expoStart = createExpoStart({
      // Use linked version of @expo/cli via `bun expo-internal`:
      command: (port) => ['bun', 'expo-internal', 'start', `--port=${port}`],
      cwd: projectRoot,
      env: {
        EXPO_PUBLIC_VALUE_INLINE: 'inlined',
        TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
        NODE_ENV: 'development',
        // Ensure CI is disabled otherwise the file watcher won't run.
        CI: '0',
      },
    });

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');
    console.log('projectRoot', projectRoot);
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('renders without errors', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // Ensure inlined env vars are rendered correctly
    await expect(page.locator('[data-testid="env-var-inline"]')).toHaveText('inlined');

    // Ensure the initial hash is correct
    await expect(page.locator('[data-testid="env-var"]')).toHaveText('ROUTE_VALUE');
    const envFile = path.join(projectRoot, '.env');
    // Use a changing value to prevent caching.
    const nextValue = 'ROUTE_VALUE_' + Date.now();

    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(envFile, (contents) => {
      if (!contents.includes('ROUTE_VALUE')) {
        throw new Error(`Expected to find 'ROUTE_VALUE' in the file`);
      }
      console.log('Emulate writing to a file');
      return contents.replace(/ROUTE_VALUE/g, nextValue);
    });

    await waitForFashRefresh();

    // Observe that our change has been rendered to the screen
    await expect(page.locator('[data-testid="env-var"]')).toHaveText(nextValue);

    expect(pageErrors.all).toEqual([]);
  });
});
