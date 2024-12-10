import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'router-misc';

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('url hash', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/hash-support#my-hash', expoStart.url).href);

    // Ensure the initial hash is correct
    await expect(page.locator('[data-testid="hash"]')).toHaveText('my-hash');

    // Update the hash
    page.locator('[data-testid="set-hash-test"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('test');
    expect(page.url()).toEqual(new URL('/hash-support#test', expoStart.url).href);

    // Updating the hash multiple times will not duplicate the hash
    page.locator('[data-testid="set-hash-test"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('test');
    expect(page.url()).toEqual(new URL('/hash-support#test', expoStart.url).href);

    // Clear the hash
    page.locator('[data-testid="clear-hash"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('');
    expect(page.url()).toEqual(new URL('/hash-support', expoStart.url).href);

    expect(pageErrors.all).toEqual([]);
  });

  test('url hash stays when setting other params', async ({ page }) => {
    console.log('Server running:', expoStart.url);
    await expoStart.fetchAsync('/');
    page.on('console', (msg) => console.log(msg.text()));

    await page.goto(`${expoStart.url.href}hash-support#my-hash`);

    // Ensure the initial hash and param is correct
    await expect(page.locator('[data-testid="hash"]')).toHaveText('my-hash');
    await expect(page.locator('[data-testid="foo-param"]')).not.toHaveText('bar');
    expect(page.url()).toEqual(`${expoStart.url.href}hash-support#my-hash`);

    // Update other params
    page.locator('[data-testid="set-param-test"]').click();
    await expect(page.locator('[data-testid="hash"]')).toHaveText('my-hash');
    await expect(page.locator('[data-testid="foo-param"]')).toHaveText('bar');
    expect(page.url()).toEqual(`${expoStart.url.href}hash-support?foo=bar#my-hash`);
  });
});
