import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '02-server-actions';
const inputDir = 'dist-' + testName;

const expo = createExpoServe({
  cwd: projectRoot,
  env: {
    NODE_ENV: 'production',
  },
});

// These tests modify the same files in the file system, so run them in serial
test.describe.configure({ mode: 'serial' });
test.beforeAll('bundle and serve', async () => {
  console.time('expo export');
  await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_SRC: testName,
      EXPO_UNSTABLE_SERVER_FUNCTIONS: '1',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      EXPO_USE_METRO_REQUIRE: '1',
      E2E_CANARY_ENABLED: '1',
      E2E_RSC_ENABLED: '1',
      TEST_SECRET_VALUE: 'test-secret',
      CI: '1',
    },
  });
  console.timeEnd('expo export');

  console.time('expo serve');
  await expo.startAsync([inputDir]);
  console.timeEnd('expo serve');
});
test.afterAll('Close server', async () => {
  await expo.stopAsync();
});

// This test generally ensures no errors are thrown during an export loading.
test('loads without hydration errors', async ({ page }) => {
  // Listen for console logs and errors
  const pageErrors = pageCollectErrors(page);

  console.time('Open page');
  // Navigate to the app
  await page.goto(expo.url.href);
  console.timeEnd('Open page');

  console.time('hydrate');
  // Wait for the app to load
  await page.waitForSelector('[data-testid="index-text"]');
  console.timeEnd('hydrate');

  expect(pageErrors.all).toEqual([]);
});

test('increments client state without re-rendering server component', async ({ page }) => {
  // Listen for console logs and errors
  const pageErrors = pageCollectErrors(page);

  await page.goto(expo.url.href);

  console.time('hydrate');
  // Wait for the app to load
  await page.waitForSelector('[data-testid="index-text"]');
  console.timeEnd('hydrate');

  expect(pageErrors.all).toEqual([]);

  // Get text of `index-server-date-rendered`
  const dateRendered = await page
    .locator('[data-testid="index-server-date-rendered"]')
    .textContent();

  // Increment client-only state at button-client-state
  await expect(page.locator('[data-testid="client-state-count"]')).toHaveText('0');
  await page.locator('[data-testid="button-client-state"]').click();
  await expect(page.locator('[data-testid="client-state-count"]')).toHaveText('1');

  // Ensure the server date didn't change...
  await expect(page.locator('[data-testid="index-server-date-rendered"]')).toHaveText(
    dateRendered!
  );
});

test('calls a server action', async ({ page }) => {
  await page.goto(expo.url.href);
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

  const serverResponsePromise = page.waitForResponse((response) => {
    return new URL(response.url()).pathname.startsWith('/_flight/web/ACTION_');
  });

  // Call the server action
  await page.locator('[data-testid="call-jsx-server-action"]').click();

  await serverActionRequest;
  const response = await serverResponsePromise;

  const rscPayload = new TextDecoder().decode(await response.body());

  expect(rscPayload).toBe(`1:I["node_modules/react-native-web/dist/exports/Text/index.js",[],""]
0:{"_value":[["$","$L1",null,{"style":{"color":"darkcyan"},"testID":"server-action-props","children":"c=0"}],["$","$L1",null,{"testID":"server-action-platform","children":"web"}]]}
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
});

test('renders server actions with headers', async ({ page }) => {
  await page.goto(expo.url.href);

  // Ensure the server date didn't change...
  await expect(page.locator('[data-testid="server-action-headers"]')).toHaveText('headers:web');
});
