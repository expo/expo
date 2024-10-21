import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { ExpoStartCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '02-server-actions';
const inputDir = 'dist-' + testName;

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let expo: ExpoStartCommand;

  test.beforeEach(async () => {
    expo = new ExpoStartCommand(projectRoot, {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: testName,
      EXPO_UNSTABLE_SERVER_ACTIONS: '1',
      E2E_ROUTER_ASYNC: 'development',
      E2E_RSC_ENABLED: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_METRO_REQUIRE: '1',
      TEST_SECRET_VALUE: 'test-secret',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    });
  });

  test.afterEach(async () => {
    await expo.stopAsync();
  });

  test('renders RSC and calls server action', async ({ page }) => {
    console.time('expo start');
    await expo.startAsync(['--port=8086']);
    console.timeEnd('expo start');
    console.log('Server running:', expo.url);
    console.time('Eagerly bundled JS');
    await expo.fetchAsync('/');
    console.timeEnd('Eagerly bundled JS');

    console.time('Open page');

    const serverResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/index.txt');
    });

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

    // Navigate to the app
    await page.goto(expo.url);
    console.timeEnd('Open page');

    await serverResponsePromise;

    // Wait for the app to load
    await page.waitForSelector('[data-testid="index-text"]');

    // Get text of `index-server-date-rendered`
    const dateRendered = await page
      .locator('[data-testid="index-server-date-rendered"]')
      .textContent();

    // Ensure the server components don't exist yet..
    await expect(page.locator('[data-testid="server-action-props"]')).not.toBeVisible();

    // Observe network request
    const serverActionRequest = page.waitForRequest((request) => {
      const headers = request.headers();
      // console.log('request.url()', request.url(), request.method(), headers);
      return (
        // Server Actions can only be POST requests
        request.method() === 'POST' &&
        // When the server action returns JSX we use this header.
        headers['accept'] === 'text/x-component' &&
        // Framework headers
        headers['expo-platform'] === 'web' &&
        // Props from the server action
        request.postData() === '["c=0"]' &&
        // Expected URL location
        new URL(request.url()).pathname.startsWith('/_flight/web/ACTION_')
      );
    });

    const serverActionResponsePromise = page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
    });

    // Call the server action
    await page.locator('[data-testid="call-jsx-server-action"]').click();

    await serverActionRequest;
    const response = await serverActionResponsePromise;

    const rscPayload = new TextDecoder().decode(await response.body());

    expect(rscPayload)
      .toBe(`1:I["apps/router-e2e/__e2e__/02-server-actions/lib/react-native.tsx",["/apps/router-e2e/__e2e__/02-server-actions/lib/react-native.tsx.bundle?platform=web&dev=true&hot=false&transform.asyncRoutes=true&transform.routerRoot=__e2e__%2F02-server-actions%2Fapp&modulesOnly=true&runModule=false&resolver.clientboundary=true&xRSC=1"],"Text"]
0:{"_value":[["$","$L1",null,{"style":{"color":"darkcyan"},"testID":"server-action-props","children":"c=0"},null],["$","$L1",null,{"testID":"server-action-platform","children":"web"},null]]}
`);

    // Ensure the server date didn't change...
    await expect(page.locator('[data-testid="index-server-date-rendered"]')).toHaveText(
      dateRendered
    );

    // Look for the new JSX...
    await expect(page.locator('[data-testid="server-action-props"]')).toHaveText('c=0');
    await expect(page.locator('[data-testid="server-action-platform"]')).toHaveText('web');

    // Update the props and call again...
    await page.locator('[data-testid="update-jsx-server-action-props"]').click();
    await page.locator('[data-testid="call-jsx-server-action"]').click();

    // The new props should be represented in the server action
    await expect(page.locator('[data-testid="server-action-props"]')).toHaveText('c=1');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);
  });
});
