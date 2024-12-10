import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '02-server-actions';
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
      E2E_ROUTER_ASYNC: 'development',
      E2E_RSC_ENABLED: '1',
      E2E_CANARY_ENABLED: '1',
      EXPO_USE_METRO_REQUIRE: '1',
      TEST_SECRET_VALUE: 'test-secret',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeAll('bundle and serve', async () => {
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

    // Navigate to the app
    console.time('Open page');
    await page.goto(expoStart.url.href);
    console.timeEnd('Open page');

    // Wait until the page has loaded the RSC/function payload
    await page.waitForResponse((response) => {
      return new URL(response.url()).pathname.startsWith('/_flight/web/index.txt');
    });

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
      const pathname = new URL(response.url()).pathname;
      return (
        pathname.startsWith('/_flight/web/ACTION_') && pathname.endsWith('_$$INLINE_ACTION.txt')
      );
    });

    // Call the server action
    await page.locator('[data-testid="call-jsx-server-action"]').click();

    await serverActionRequest;
    const response = await serverActionResponsePromise;

    const rscPayload = new TextDecoder().decode(await response.body());

    expect(rscPayload)
      .toBe(`1:I["node_modules/react-native-web/dist/exports/Text/index.js",["/node_modules/react-native-web/dist/exports/Text/index.js.bundle?platform=web&dev=true&hot=false&transform.asyncRoutes=true&transform.routerRoot=__e2e__%2F02-server-actions%2Fapp&modulesOnly=true&runModule=false&resolver.clientboundary=true&xRSC=1"],""]
0:{"_value":[["$","$L1",null,{"style":{"color":"darkcyan"},"testID":"server-action-props","children":"c=0"},null],["$","$L1",null,{"testID":"server-action-platform","children":"web"},null]]}
`);

    // Ensure the server date didn't change...
    await expect(page.locator('[data-testid="index-server-date-rendered"]')).toHaveText(
      dateRendered!
    );

    // Look for the new JSX...
    await expect(page.locator('[data-testid="server-action-props"]')).toHaveText('c=0');
    await expect(page.locator('[data-testid="server-action-platform"]')).toHaveText('web');

    // Update the props and call again...
    await page.locator('[data-testid="update-jsx-server-action-props"]').click();
    await page.locator('[data-testid="call-jsx-server-action"]').click();

    // The new props should be represented in the server action
    await expect(page.locator('[data-testid="server-action-props"]')).toHaveText('c=1');

    // Ensure there are no detected thrown or logged errors
    expect(pageErrors.all).toEqual([]);
  });
});
