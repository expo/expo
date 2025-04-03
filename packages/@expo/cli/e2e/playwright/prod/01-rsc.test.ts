import { expect, test } from '@playwright/test';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { findProjectFiles, getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

// TODO: We'll split this test up in the future when server/single do different things.
const outputModes = ['single', 'server'] as const;

for (const outputMode of outputModes) {
  test.describe(`EXPO_USE_STATIC: ${outputMode}`, () => {
    // Configure this describe block to run serially on a single worker so we don't bundle multiple times to the same on-disk location.
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(() => clearEnv());
    test.afterAll(() => restoreEnv());

    const projectRoot = getRouterE2ERoot();
    const inputDir = `dist-01-rsc_${outputMode}`;

    const expoServe = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_VALUE: 'test-secret-dynamic',
        E2E_BUILD_MARKER: 'dynamic',
      },
    });

    test.beforeAll('bundle and serve', async () => {
      console.time('expo export');
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
        env: {
          E2E_ROUTER_JS_ENGINE: 'hermes',
          E2E_CANARY_ENABLED: '1',
          E2E_RSC_ENABLED: '1',
          E2E_ROUTER_SRC: '01-rsc',
          E2E_BUILD_MARKER: 'static',
          EXPO_USE_STATIC: outputMode,
          TEST_SECRET_VALUE: 'test-secret',
        },
      });
      console.timeEnd('expo export');

      console.time('expo serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    const STATIC_RSC_PATH = path.join(projectRoot, inputDir, 'client/_flight');

    test('loads without hydration errors', async ({ page }) => {
      expect(findProjectFiles(STATIC_RSC_PATH)).toEqual([
        'web/colors/blue.txt',
        'web/colors/red.txt',
        'web/index.txt',
        'web/shapes/square.txt',
      ]);

      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      console.time('hydrate');
      await page.waitForSelector('[data-testid="index-text"]');

      await expect(page.locator('[data-testid="secret-text"]')).toHaveText('Secret: test-secret');
      await expect(page.locator('[data-testid="index-path"]')).toHaveText('/');
      await expect(page.locator('[data-testid="index-query"]')).toHaveText('');

      console.timeEnd('hydrate');

      expect(pageErrors.all).toEqual([]);

      await page.waitForSelector('[data-testid="client-button"]');
      await expect(page.locator('[data-testid="client-button"]')).toHaveText('Count: 0');
      await page.locator('[data-testid="client-button"]').click();
      await expect(page.locator('[data-testid="client-button"]')).toHaveText('Count: 1');

      await expect(page.locator('[data-testid="layout-global-style"]')).toHaveCSS(
        'background-color',
        'rgb(0, 128, 0)'
      );
      await expect(page.locator('[data-testid="layout-module-style"]')).toHaveCSS(
        'background-color',
        'rgb(127, 255, 212)'
      );

      await expect(page.locator('link[rel="preload"][as="style"][href*="global"]')).toBeAttached();
      await expect(page.locator('link[rel="stylesheet"][href*="global"]')).toBeAttached();
      await expect(
        page.locator('link[rel="preload"][as="style"][href*="home.module"]')
      ).toBeAttached();
      await expect(page.locator('link[rel="stylesheet"][href*="home.module"]')).toBeAttached();
    });

    test('gets 404 NOT_FOUND for non-existent route', async ({ page }) => {
      const response = await page.goto(new URL('/route-that-does-not-exist', expoServe.url).href);
      expect(response?.status()).toBe(404);
    });

    if (outputMode === 'server') {
      test('supports API routes in server mode', async ({ page }) => {
        const response = await page.goto(new URL('/api/endpoint', expoServe.url).href);
        expect(response?.status()).toBe(200);
        expect(await response?.json()).toEqual({ hello: 'world' });
      });
    }

    test('dynamically renders RSC', async ({ page }) => {
      await page.goto(new URL('/second', expoServe.url).href);
      await page.waitForSelector('[data-testid="second-text"]');
      await expect(page.locator('[data-testid="secret-text"]')).toHaveText(
        'Secret: test-secret-dynamic'
      );
    });

    test('has static public file', async ({ page }) => {
      const res = await page.goto(new URL('/_static-file.txt', expoServe.url).href);
      const status = await res?.status();
      expect(status).toBe(200);
      const text = await res?.text();
      expect(text).toBe('hello');
    });

    test('has dynamic headers', async ({ page }) => {
      await page.goto(new URL('/second', expoServe.url).href);
      await page.waitForSelector('[data-testid="second-header-platform"]');
      await expect(page.locator('[data-testid="second-header-platform"]')).toHaveText(
        'expo-platform: web'
      );
    });

    test('has static version of static page (colors)', async ({ page }) => {
      const staticComponentRequest = page.waitForRequest((request) => {
        return (
          request.method() === 'GET' &&
          new URL(request.url()).pathname.startsWith('/_flight/web/colors/blue.txt')
        );
      });

      const serverResponsePromise = page.waitForResponse((response) => {
        return new URL(response.url()).pathname.startsWith('/_flight/web/colors/blue.txt');
      });

      await page.goto(new URL('/colors/blue', expoServe.url).href);
      await staticComponentRequest;
      const response = await serverResponsePromise;
      const rscPayload = new TextDecoder().decode(await response.body()).trim();

      expect(rscPayload)
        .toBe(`1:I["node_modules/react-native-safe-area-context/lib/module/index.js",[],"SafeAreaView"]
2:I["packages/expo-router/build/rsc/router/host.js",[],"Children"]
3:I["node_modules/react-native-web/dist/exports/View/index.js",[],""]
4:I["packages/expo-router/build/rsc/router/client.js",[],"Link"]
5:I["node_modules/react-native-web/dist/exports/Text/index.js",[],""]
0:{"layout":["$","$L1",null,{"style":{"flex":1},"testID":"layout-child-wrapper","children":[["$","$L2",null,{}],["$","$L3",null,{"testID":"layout-global-style","style":[{"width":100,"height":100},{"$$css":true,"_":"custom-global-style"}]}],["$","$L3",null,{"testID":"layout-module-style","style":[{"width":100,"height":100},{"$$css":true,"_":"zvzhJW_container"}]}],["$","$L3",null,{"style":{"flexDirection":"row","padding":12,"justifyContent":"space-around"},"children":[["$","$L4",null,{"href":"/","style":{},"children":"One"}],["$","$L4",null,{"href":"/second","style":{},"children":"Two"}]]}]]}],"colors/blue/page":["$","$L5",null,{"testID":"color","children":["blue","-","static"]}],"/SHOULD_SKIP":[["layout",[]],["colors/layout",[]],["colors/blue/layout",[]],["colors/blue/page",[]]],"/LOCATION":["/colors/blue",""]}`);

      await expect(page.locator('[data-testid="color"]')).toHaveText('blue-static');
    });

    test('has dynamic version of static page (colors)', async ({ page }) => {
      await page.goto(new URL('/colors/magenta', expoServe.url).href);
      await expect(page.locator('[data-testid="color"]')).toHaveText('magenta-dynamic');
    });

    test('has static version of static-only page (shapes)', async ({ page }) => {
      await page.goto(new URL('/shapes/square', expoServe.url).href);
      await expect(page.locator('[data-testid="shape"]')).toHaveText('square-static');
    });

    test('does not have static version of static-only page that was not rendered (shapes)', async ({
      page,
    }) => {
      const staticComponentRequest = page.waitForRequest((request) => {
        return (
          request.method() === 'GET' &&
          new URL(request.url()).pathname.startsWith('/_flight/web/shapes/other.txt')
        );
      });

      const serverResponsePromise = page.waitForResponse((response) => {
        return new URL(response.url()).pathname.startsWith('/_flight/web/shapes/other.txt');
      });

      await page.goto(new URL('/shapes/other', expoServe.url).href);
      await staticComponentRequest;
      const response = await serverResponsePromise;

      expect(response.status()).toBe(404);
      await expect(page.locator('[data-testid="shape"]')).not.toBeVisible();
    });
  });
}
