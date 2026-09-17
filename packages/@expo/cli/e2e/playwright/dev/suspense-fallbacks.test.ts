import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'suspense-fallbacks';

/**
 * Holds the async chunk for a route module until `release` is called, so the test can observe
 * the Suspense fallback while the module is loading rather than while data is pending.
 * `requested` resolves once the page has asked for the chunk, and `loaded` resolves after the
 * released chunk has been served.
 */
async function holdRouteModule(page: Page, modulePath: string) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markRequested!: () => void;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  // Metro serves async route chunks at `<file path without extension>.bundle?...`.
  const pattern = new RegExp(`${modulePath.replace(/[/.]/g, '\\$&')}(\\.[jt]sx?)?\\.bundle`);
  await page.route(pattern, async (route) => {
    markRequested();
    await gate;
    await route.continue();
  });
  return {
    release,
    requested,
    loaded: () => page.waitForResponse(pattern),
  };
}

/** Opens a page and waits until the client tree has replaced the server-rendered HTML. */
async function gotoClient(page: Page, url: string) {
  // The held chunk is a script tag, so do not wait for the `load` event.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('client-mounted')).toBeAttached();
}

test.describe(inputDir, () => {
  // Custom Suspense fallbacks with async routes enabled.
  test.describe.configure({ mode: 'serial' });

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      // The SPA (`single`) dev HTML does not enable async routes, so use static output.
      EXPO_USE_STATIC: 'static',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'true',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeAll(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterAll(async () => {
    await expoStart.stopAsync();
  });

  test('uses the layout export while a route module loads and while it suspends on data', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    const chunk = await holdRouteModule(page, 'app/layout-export/index');

    await gotoClient(page, new URL('/layout-export', expoStart.url).href);
    await chunk.requested;

    // The route module has not loaded yet, so the nearest layout export is shown.
    await expect(page.getByTestId('layout-export-fallback')).toBeVisible();
    await expect(page.getByTestId('layout-export-fallback')).toHaveText(
      'Loading ./layout-export/index.tsx'
    );
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);
    await expect(page.getByTestId('layout-export-content')).toHaveCount(0);

    chunk.release();
    await chunk.loaded();

    // The module has loaded and the screen now suspends on data. The same fallback is shown.
    await expect(page.getByTestId('layout-export-fallback')).toBeVisible();
    await expect(page.getByTestId('layout-export-content')).toHaveCount(0);
    await expect(page.getByTestId('layout-export-content')).toHaveText('Loaded layout-export');
    await expect(page.getByTestId('layout-export-fallback')).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });

  test('uses the navigator prop before the layout export', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const chunk = await holdRouteModule(page, 'app/navigator-prop/index');

    await gotoClient(page, new URL('/navigator-prop', expoStart.url).href);
    await chunk.requested;

    await expect(page.getByTestId('navigator-prop-fallback')).toBeVisible();
    await expect(page.getByTestId('navigator-prop-layout-fallback')).toHaveCount(0);
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);

    chunk.release();

    await expect(page.getByTestId('navigator-prop-content')).toHaveText('Loaded navigator-prop');
    await expect(page.getByTestId('navigator-prop-fallback')).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });

  test('inherits the nearest ancestor fallback through a layout without one', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const chunk = await holdRouteModule(page, 'app/inherited/index');

    await gotoClient(page, new URL('/inherited', expoStart.url).href);
    await chunk.requested;

    await expect(page.getByTestId('root-fallback')).toBeVisible();
    await expect(page.getByTestId('root-fallback')).toHaveText('Loading ./inherited/index.tsx');

    chunk.release();

    await expect(page.getByTestId('inherited-content')).toHaveText('Loaded inherited');
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });

  test('uses the ancestor fallback while a nested layout loads', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const chunk = await holdRouteModule(page, 'app/layout-export/_layout');

    await gotoClient(page, new URL('/layout-export', expoStart.url).href);
    await chunk.requested;

    // The nested layout module cannot supply its export before it loads.
    await expect(page.getByTestId('root-fallback')).toBeVisible();
    await expect(page.getByTestId('root-fallback')).toHaveText(
      'Loading ./layout-export/_layout.tsx'
    );
    await expect(page.getByTestId('layout-export-fallback')).toHaveCount(0);

    chunk.release();

    await expect(page.getByTestId('layout-export-content')).toHaveText('Loaded layout-export');
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });

  test('resets to the built-in fallback when suspenseFallback is null', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const chunk = await holdRouteModule(page, 'app/reset/index');

    await gotoClient(page, new URL('/reset', expoStart.url).href);
    await chunk.requested;

    // The built-in development fallback is shown instead of the root layout's export.
    await expect(page.getByText('Bundling...')).toBeVisible();
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);
    await expect(page.getByTestId('reset-content')).toHaveCount(0);

    chunk.release();

    await expect(page.getByTestId('reset-content')).toHaveText('Loaded reset');
    await expect(page.getByTestId('root-fallback')).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });
});
