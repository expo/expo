import { expect, test } from '@playwright/test';
import execa from 'execa';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { bin, ServeLocalCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '03-server-actions-only';
const inputDir = 'dist-' + testName;

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
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_SRC: testName,
      EXPO_UNSTABLE_SERVER_ACTIONS: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      //   E2E_RSC_ENABLED: '1',
      TEST_SECRET_VALUE: 'test-secret',
      CI: '1',
    },
    stdio: 'inherit',
  });
  console.timeEnd('expo export');

  serveCmd = new ServeLocalCommand(projectRoot, {
    NODE_ENV: 'production',
  });

  console.time('npx serve');
  await serveCmd.startAsync(['serve.js', '--port=' + randomPort(), '--dist=' + inputDir]);
  console.timeEnd('npx serve');
  console.log('Server running:', serveCmd.url);
});

function randomPort() {
  return Math.floor(Math.random() * 1000 + 3000);
}

test.afterAll('Close server', async () => {
  await serveCmd.stopAsync();
});

test.describe(inputDir, () => {
  // This test generally ensures no errors are thrown during an export loading.
  test('loads without hydration errors', async ({ page }) => {
    console.time('Open page');
    // Navigate to the app
    await page.goto(serveCmd.url!);

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
    console.timeEnd('hydrate');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);

    await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');
    await expect(page.locator('[data-testid="server-contents"]')).toHaveText('Hello!');
  });
});
