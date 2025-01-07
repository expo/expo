import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '04-server-error-boundaries';
const inputDir = 'dist-' + testName;

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: testName,
      EXPO_UNSTABLE_SERVER_FUNCTIONS: '1',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach('bundle and serve', async () => {
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

  test('catches server action errors in boundary with expected params', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const serverActionResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
    });

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    console.time('button');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="button-error-in-server-action"]');
    console.timeEnd('button');

    // Click the button
    await page.click('[data-testid="button-error-in-server-action"]');

    // Extract UI from error boundar:
    // await serverActionRequest;
    const response = await serverActionResponsePromise;
    expect(response.status()).toBe(500);

    console.time('error-type');
    expect(await page.textContent('[data-testid="error-type"]')).toBe('REACT_SERVER_ERROR');
    console.timeEnd('error-type');
    expect(await page.textContent('[data-testid="error-statusCode"]')).toBe('500');
    const urlText = await page.textContent('[data-testid="error-url"]');
    expect(urlText).toMatch(/\/_flight\/web\/ACTION_/);
    new URL(urlText!);
    JSON.parse((await page.textContent('[data-testid="error-headers"]'))!);

    expect(pageErrors.all.length).toEqual(2);
  });

  test('catches server action bundling errors in master boundary', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const serverActionResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
    });

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    console.time('button');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="button-bundler-error"]');
    console.timeEnd('button');

    // Click the button
    await page.click('[data-testid="button-bundler-error"]');

    // Extract UI from error boundar:
    const response = await serverActionResponsePromise;
    expect(response.status()).toBe(404);

    console.time('error-type');
    const text = await page.textContent('[data-testid="logbox_title"]');
    expect(text).toMatch(/(Syntax Error|Uncaught Error)/);
    console.timeEnd('error-type');

    expect(pageErrors.all.length).toEqual(2);
  });

  test('catches server action errors in Expo Router error boundary with expected params', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const serverActionResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
    });

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    console.time('button');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="button-error-with-default-boundary"]');
    console.timeEnd('button');

    // Click the button
    await page.click('[data-testid="button-error-with-default-boundary"]');

    // Extract UI from error boundar:
    // await serverActionRequest;
    const response = await serverActionResponsePromise;
    expect(response.status()).toBe(500);

    console.time('error-text');
    await page.waitForSelector('[data-testid="router_error_message"]');
    console.timeEnd('error-text');

    // Extra components
    await page.waitForSelector('[data-testid="router_error_sitemap"]');
    await page.waitForSelector('[data-testid="router_error_retry"]');

    expect(pageErrors.all.length).toEqual(2);
  });
});
