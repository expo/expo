import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors, trackLoaderNetworkStatuses, waitForLoaderData } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();

// TODO: We'll split this test up in the future when server/single do different things.
const outputModes = ['static', 'server'] as const;

for (const outputMode of outputModes) {
  test.describe(`${outputMode} loaders in development`, () => {
    test.describe.configure({ mode: 'serial' });

    const expoStart = createExpoStart({
      cwd: projectRoot,
      env: {
        EXPO_USE_STATIC: outputMode,
        E2E_ROUTER_SRC: 'server-loader',

        // Ensure CI is disabled otherwise the file watcher won't run.
        CI: '0',
      },
    });

    test.beforeAll(async () => {
      console.time('expo start');
      await expoStart.startAsync();
      console.timeEnd('expo start');
    });
    test.afterAll(async () => {
      await expoStart.stopAsync();
    });

    // TODO(@hassankhan): Remove server-specific guard after #46526 is merged
    (outputMode === 'server' ? test : test.skip)(
      'writes large completed Suspense content before the bootstrap script',
      async ({ request }) => {
        const response = await request.get(new URL('/large-suspense', expoStart.url).href);
        expect(response.status()).toBe(200);
        const html = await response.text();
        const contentStart = html.indexOf('data-testid="suspense-content"');
        const contentEnd = html.indexOf('data-testid="suspense-content-end"');
        const bootstrap = html.indexOf('globalThis.__EXPO_ROUTER_HYDRATE__');

        expect(contentStart).toBeGreaterThan(-1);
        expect(contentEnd).toBeGreaterThan(contentStart);
        expect(bootstrap).toBeGreaterThan(contentEnd);
        expect(html).toContain('globalThis.__EXPO_ROUTER_LOADER_DATA__');
        expect(html).not.toContain('<div hidden id="S:');
      }
    );

    test('shows large completed Suspense content without JavaScript', async ({ browser }) => {
      const page = await browser.newPage({ javaScriptEnabled: false });
      try {
        const response = await page.goto(new URL('/large-suspense', expoStart.url).href);

        expect(response?.status()).toBe(200);
        await expect(page.getByTestId('suspense-row')).toHaveText(
          Array.from(
            { length: 400 },
            (_, id) => `Row ${id} of 400, carrying enough text that a few hundred of them add up`
          )
        );
        await expect(page.getByTestId('suspense-content')).toBeVisible();
        await expect(page.getByTestId('suspense-content-end')).toBeVisible();
      } finally {
        await page.close();
      }
    });

    test('hydrates large completed Suspense content', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/large-suspense', expoStart.url).href);
      await expect(page.getByTestId('suspense-row')).toHaveCount(400);
      await expect(page.getByTestId('suspense-content')).toBeVisible();
      await expect(page.getByTestId('suspense-count')).toHaveText('0');
      // React drops a click that arrives before hydration finishes.
      await expect(page.getByTestId('suspense-mounted')).toBeVisible();
      await page.getByTestId('suspense-increment').click();
      await expect(page.getByTestId('suspense-count')).toHaveText('1');
      expect(pageErrors.all).toEqual([]);
    });

    test('loads loader data modules on client-side navigation', async ({ page }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await gotoHydrated(page, expoStart.url.href);
      expect(loaderRequests).toHaveLength(0);

      await page.click('a[href="/posts/static-post-1"]');
      await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
      expect(loaderRequests).toContainEqual(
        expect.stringContaining('/_expo/loaders/posts/static-post-1')
      );

      const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
      expect(JSON.parse(loaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });
    });

    test('loads grouped loader data on client-side navigation', async ({ page }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await gotoHydrated(page, expoStart.url.href);
      await page.getByText('Go to Grouped Index').click();
      await expect(page.locator('[data-testid="loader-result"]')).toHaveText(
        JSON.stringify({ data: 'grouped-index' }, null, 2)
      );
      expect(loaderRequests).toContainEqual(
        expect.stringContaining('/_expo/loaders/(group)/index')
      );
    });

    test('loads a platform-specific catch-all loader on client-side navigation', async ({
      page,
    }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await gotoHydrated(page, expoStart.url.href);
      await page.getByText('Go to Platform Catch-all').click();
      await expect(page).toHaveURL(/\/platform\/alpha\/beta$/);
      await expect(page.locator('[data-testid="loader-result"]')).toHaveText(
        JSON.stringify({ data: 'platform-catch-all' }, null, 2)
      );
      expect(loaderRequests).toContainEqual(
        expect.stringContaining('/_expo/loaders/(group)/platform/alpha/beta')
      );
      expect(loaderRequests).not.toContainEqual(expect.stringContaining('[...slug].web'));
    });

    test('defaults headerless loaders to no-store without replacing declared headers', async ({
      request,
    }) => {
      const headerless = await request.get(
        new URL('/_expo/loaders/posts/static-post-1', expoStart.url).href
      );
      const declared = await request.get(new URL('/_expo/loaders/response', expoStart.url).href);

      expect(headerless.headers()['cache-control']).toBe('no-store');
      expect(declared.headers()['cache-control']).toBe(
        outputMode === 'static' ? 'public, max-age=604800' : 'public, max-age=3600'
      );
    });

    test('refetches headerless loader data on every fresh mount', async ({ page }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await gotoHydrated(page, expoStart.url.href);

      await page.click('a[href="/posts/static-post-1"]');
      await waitForLoaderData(page, { params: { postId: 'static-post-1' } });

      await page.click('a[href="/"]');
      await waitForLoaderData(page, { data: 'root-index' });

      await page.click('a[href="/posts/static-post-2"]');
      await waitForLoaderData(page, { params: { postId: 'static-post-2' } });

      await page.click('a[href="/"]');
      await waitForLoaderData(page, { data: 'root-index' });

      await page.click('a[href="/posts/static-post-1"]');
      await waitForLoaderData(page, { params: { postId: 'static-post-1' } });

      expect(loaderRequests).toEqual([
        expect.stringContaining('/_expo/loaders/posts/static-post-1'),
        expect.stringContaining('/_expo/loaders/index'),
        expect.stringContaining('/_expo/loaders/posts/static-post-2'),
        expect.stringContaining('/_expo/loaders/index'),
        expect.stringContaining('/_expo/loaders/posts/static-post-1'),
      ]);
    });

    test('the initial max-age seed fetches once, then primes the HTTP cache', async ({ page }) => {
      const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/response');
      const responseUrl = new URL('/response', expoStart.url.href).toString();

      await gotoHydrated(page, responseUrl);
      expect(statuses).toEqual([]);

      // The first revisit hits the network — the hydration seed never primes the HTTP cache.
      await page.click('a[href="/"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/response"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await expect.poll(() => statuses).toEqual([200]);

      await page.click('a[href="/"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/response"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      // A second render-driven fetch occurs, but max-age lets Chromium answer it locally.
      await expect.poll(() => statuses).toEqual([200]);
    });

    test('a declared no-store loader reaches the network on every mount', async ({ page }) => {
      const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/second');

      await gotoHydrated(page, expoStart.url.href);
      await page.click('a[href="/second"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/second"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      await expect.poll(() => statuses).toEqual([200, 200]);
    });

    test('handles loader module fetch errors gracefully', async ({ page }) => {
      await gotoHydrated(page, expoStart.url.href);

      await page.route('**/_expo/loaders/**', (route) => {
        route.abort('failed');
      });

      await page.click('a[href="/posts/static-post-1"]');

      await expect(page.locator('[data-testid="loader-result"]')).not.toBeVisible();
    });

    test('shows suspense fallback while loading', async ({ page }) => {
      await gotoHydrated(page, expoStart.url.href);

      await page.route('**/_expo/loaders/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.click('a[href="/posts/static-post-1"]');

      const suspenseFallback = await page.locator('[data-testid="suspense-fallback"]');
      await expect(suspenseFallback).toBeVisible();

      await page.waitForSelector('[data-testid="loader-result"]');
      await expect(suspenseFallback).not.toBeVisible();
    });

    test('abandons a suspended load on Back and starts fresh on revisit', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);
      const slowRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/slow')) {
          slowRequests.push(request.url());
        }
      });

      await gotoHydrated(page, expoStart.url.href);
      await page.click('a[href="/slow"]');
      await expect(page.locator('[data-testid="suspense-fallback"]')).toBeVisible();
      await expect.poll(() => slowRequests).toHaveLength(1);

      await page.goBack();
      await expect(page).toHaveURL(expoStart.url.href);

      await page.click('a[href="/slow"]');
      await expect(page.locator('[data-testid="suspense-fallback"]')).toBeVisible();
      await expect.poll(() => slowRequests).toHaveLength(2);

      const loaderResult = page.locator('[data-testid="loader-result"]');
      await expect(loaderResult).toBeVisible({ timeout: 10_000 });
      expect(JSON.parse((await loaderResult.textContent())!)).toMatchObject({ data: 'slow' });
      expect(slowRequests).toHaveLength(2);
      expect(pageErrors.all).toEqual([]);
    });

    test('navigates from route without loader to route with loader', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const url = new URL(expoStart.url.href);
      url.pathname = '/no-loader';

      // Start on no loader route
      await gotoHydrated(page, url.toString());

      // Navigate to index route (has loader)
      await page.click('a[href="/"]');
      await waitForLoaderData(page, { data: 'root-index' });

      const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
      expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'root-index' });

      expect(pageErrors.all).toEqual([]);
    });

    test('navigates from route with loader to another route with loader', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const url = new URL(expoStart.url.href);
      url.pathname = '/second';

      // Start on second route (with loader)
      await gotoHydrated(page, url.toString());
      await page.waitForSelector('[data-testid="loader-result"]');

      const secondLoaderDataContent = await page
        .locator('[data-testid="loader-result"]')
        .textContent();
      expect(JSON.parse(secondLoaderDataContent!)).toEqual({ data: 'second' });

      // Navigate to posts route (has loader)
      await page.click('a[href="/posts/static-post-1"]');
      await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
      const postsLoaderDataContent = await page
        .locator('[data-testid="loader-result"]')
        .textContent();
      expect(JSON.parse(postsLoaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });

      expect(pageErrors.all).toEqual([]);
    });
  });
}

// React drops a click that arrives before hydration finishes.
async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await page.getByTestId('site-links-mounted').waitFor({ state: 'attached' });
}
