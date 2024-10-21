import { expect, test } from '@playwright/test';
import execa from 'execa';
import path from 'path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { bin, ServeLocalCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = '02-server-actions';
const inputDir = 'dist-' + testName;

test.beforeAll(async () => {
  // Could take 45s depending on how fast the bundler resolves
  test.setTimeout(560 * 1000);
});

let serveCmd: ServeLocalCommand;

// These tests modify the same files in the file system, so run them in serial
test.describe.configure({ mode: 'serial' });

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
      E2E_RSC_ENABLED: '1',
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
    console.timeEnd('hydrate');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('increments client state without re-rendering server component', async ({ page }) => {
    await page.goto(serveCmd.url);

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
      dateRendered
    );
  });

  test('calls a server action', async ({ page }) => {
    await page.goto(serveCmd.url);
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
  });
});
