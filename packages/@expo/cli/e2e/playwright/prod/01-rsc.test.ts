import { expect, test } from '@playwright/test';
import execa from 'execa';

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
      EXPO_E2E_RSC: '1',
      EXPO_USE_STATIC: 'single',
      EXPO_PUBLIC_USE_RSC: '1',
      NODE_ENV: 'production',
      E2E_ROUTER_SRC: '01-rsc',
      TEST_SECRET_VALUE: 'test-secret',
    },
  });
  console.timeEnd('expo export');

  serveCmd = new ServeLocalCommand(projectRoot, {
    NODE_ENV: 'production',
  });

  console.time('npx serve');
  await serveCmd.startAsync(['__e2e__/01-rsc/server.js', '--port=' + 3034, '--dist=' + inputDir]);
  console.timeEnd('npx serve');
  console.log('Server running:', serveCmd.url);
});

test.afterAll(async () => {
  await serveCmd.stopAsync();
});

test.describe(inputDir, () => {
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

    console.time('hydrate');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');

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
  });
});
