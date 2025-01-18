import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '03-server-actions-only';
const inputDir = 'dist-' + testName;

test.describe(inputDir, () => {
  test.describe.configure({ mode: 'serial' });

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: testName,
      E2E_ROUTER_ASYNC: 'development',
      EXPO_UNSTABLE_SERVER_FUNCTIONS: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_METRO_REQUIRE: '1',
      TEST_SECRET_VALUE: 'test-secret',

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

  test('renders RSC and calls server action', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    // Observe network request
    const serverActionRequest = page.waitForRequest((request) => {
      const headers = request.headers();
      //   console.log('request.url()', request.postData(), request.url(), request.method(), headers);
      return (
        // Server Actions can only be POST requests
        request.method() === 'POST' &&
        // When the server action returns JSX we use this header.
        headers['accept'] === 'text/x-component' &&
        // Framework headers
        headers['expo-platform'] === 'web' &&
        // Props from the server action
        request.postData() === '[{"title":"Hello!"}]' &&
        // Expected URL location
        new URL(request.url()).pathname.startsWith('/_flight/web/ACTION_')
      );
    });

    const serverActionResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
    });

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    await serverActionRequest;
    const response = await serverActionResponsePromise;

    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    const rscPayload = new TextDecoder().decode(await response.body());

    expect(rscPayload).toMatch(
      '2:I["node_modules/react-native-web/dist/exports/Text/index.js",["/node_modules/react-native-web/dist/exports/Text/index.js.bundle?platform=web&dev=true&hot=false&transform.asyncRoutes=true&transform.routerRoot=__e2e__%2F03-server-actions-only%2Fapp&modulesOnly=true&runModule=false&resolver.clientboundary=true&xRSC=1"]'
    );

    expect(pageErrors.all).toEqual([]);
  });

  test('renders nested server action with HMR', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="call-jsx-server-action-two"]');

    // Press button
    await page.click('[data-testid="call-jsx-server-action-two"]');

    await page.waitForSelector('[data-testid="action-results-two-0"]');
    const firstContents = await page.textContent('[data-testid="action-results-two-0"]');
    expect(firstContents).toMatch(/\w+/);

    // Give time
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Press button
    await page.click('[data-testid="call-jsx-server-action-two"]');

    await page.waitForSelector('[data-testid="action-results-two-1"]');
    const secondContents = await page.textContent('[data-testid="action-results-two-1"]');
    expect(secondContents).toMatch(/\w+/);
    expect(secondContents).not.toBe(firstContents);

    expect(pageErrors.all).toEqual([]);
  });
});
