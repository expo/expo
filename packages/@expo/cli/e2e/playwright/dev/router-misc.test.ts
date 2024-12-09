import { test, Page, WebSocket, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { ExpoStartCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'router-misc';

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let expo: ExpoStartCommand;

  test.beforeEach(async () => {
    expo = new ExpoStartCommand(projectRoot, {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    });
  });

  test.afterEach(async () => {
    await expo.stopAsync();
  });

  test('url hash and search params are parsed correctly when both are set in URL', async ({ page }) => {
    await expo.startAsync(['--port=8085']);
    console.log('Server running:', expo.url);
    await expo.fetchAsync('/');
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(`${expo.url}/hash-support?foo=bar#my-hash`);

    // Ensure the hash and param are correct
    await expect(page.locator('[data-testid="hash"]')).toHaveText('my-hash');
    await expect(page.locator('[data-testid="foo-param"]')).toHaveText('bar');
    expect(page.url()).toEqual(`${expo.url}/hash-support?foo=bar#my-hash`);
  });

  test('url hash being set multiple times', async ({ page }) => {
    await expo.startAsync(['--port=8085']);
    console.log('Server running:', expo.url);
    await expo.fetchAsync('/');
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(`${expo.url}/hash-support#my-hash`);

    // Ensure the initial hash is correct
    await expect(page.locator('[data-testid="hash"]')).toHaveText('my-hash');

    // Update the hash
    page.locator('[data-testid="set-hash-test"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('test');
    expect(page.url()).toEqual(`${expo.url}/hash-support#test`);

    // Updating the hash multiple times will not duplicate the hash
    page.locator('[data-testid="set-hash-test"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('test');
    expect(page.url()).toEqual(`${expo.url}/hash-support#test`);

    // Clear the hash
    page.locator('[data-testid="clear-hash"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('');
    expect(page.url()).toEqual(`${expo.url}/hash-support`);
  });
});
