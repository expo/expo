import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

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
        E2E_ROUTER_SERVER_LOADERS: 'true',
        E2E_ROUTER_SERVER_RENDERING: outputMode === 'server' ? 'true' : 'false',

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

    test('loads loader data modules on client-side navigation', async ({ page }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await page.goto(expoStart.url.href);
      expect(loaderRequests).toHaveLength(0);

      await page.click('a[href="/posts/static-post-1"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      expect(loaderRequests).toContainEqual(
        expect.stringContaining('/_expo/loaders/posts/static-post-1')
      );

      const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
      expect(JSON.parse(loaderDataContent!)).toEqual({
        params: { postId: 'static-post-1' },
      });
    });

    test('refetches headerless loader data on every fresh mount', async ({ page }) => {
      const loaderRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/_expo/loaders/')) {
          loaderRequests.push(request.url());
        }
      });

      await page.goto(expoStart.url.href);

      await page.click('a[href="/posts/static-post-1"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      await page.click('a[href="/"]');

      await page.click('a[href="/posts/static-post-2"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      await page.click('a[href="/"]');

      await page.click('a[href="/posts/static-post-1"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      expect(loaderRequests).toHaveLength(5);
      expect(
        loaderRequests.filter((url) => url.includes('/_expo/loaders/posts/static-post-1'))
      ).toHaveLength(2);
      expect(loaderRequests.filter((url) => url.includes('/_expo/loaders/index'))).toHaveLength(2);
    });

    test('the initial max-age seed fetches once, then primes the HTTP cache', async ({ page }) => {
      const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/response');
      const responseUrl = new URL('/response', expoStart.url.href).toString();

      await page.goto(responseUrl);
      expect(statuses).toEqual([]);

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

      await page.goto(expoStart.url.href);
      await page.click('a[href="/second"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/"]');
      await page.waitForSelector('[data-testid="loader-result"]');
      await page.click('a[href="/second"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      await expect.poll(() => statuses).toEqual([200, 200]);
    });

    test('handles loader module fetch errors gracefully', async ({ page }) => {
      await page.goto(expoStart.url.href);

      await page.route('**/_expo/loaders/**', (route) => {
        route.abort('failed');
      });

      await page.click('a[href="/posts/static-post-1"]');

      await expect(page.locator('[data-testid="loader-result"]')).not.toBeVisible();
    });

    test('shows suspense fallback while loading', async ({ page }) => {
      await page.goto(expoStart.url.href);

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

    test('navigates from route without loader to route with loader', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const url = new URL(expoStart.url.href);
      url.pathname = '/no-loader';

      // Start on no loader route
      await page.goto(url.toString());

      // Navigate to index route (has loader)
      await page.click('a[href="/"]');
      await page.waitForSelector('[data-testid="loader-result"]');

      const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
      expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'root-index' });

      expect(pageErrors.all).toEqual([]);
    });

    test('navigates from route with loader to another route with loader', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const url = new URL(expoStart.url.href);
      url.pathname = '/second';

      // Start on second route (with loader)
      await page.goto(url.toString());
      await page.waitForSelector('[data-testid="loader-result"]');

      const secondLoaderDataContent = await page
        .locator('[data-testid="loader-result"]')
        .textContent();
      expect(JSON.parse(secondLoaderDataContent!)).toEqual({ data: 'second' });

      // Navigate to posts route (has loader)
      await page.click('a[href="/posts/static-post-1"]');
      const postsLoaderDataContent = await page
        .locator('[data-testid="loader-result"]')
        .textContent();
      expect(JSON.parse(postsLoaderDataContent!)).toEqual({
        params: { postId: 'static-post-1' },
      });

      expect(pageErrors.all).toEqual([]);
    });
  });
}

async function trackLoaderNetworkStatuses(page: Page, pathname: string): Promise<number[]> {
  const session = await page.context().newCDPSession(page);
  const requestUrls = new Map<string, string>();
  const statuses: number[] = [];

  await session.send('Network.enable');
  session.on('Network.requestWillBeSent', ({ requestId, request }) => {
    requestUrls.set(requestId, request.url);
  });
  session.on('Network.responseReceivedExtraInfo', ({ requestId, statusCode }) => {
    if (requestUrls.get(requestId)?.includes(pathname)) {
      statuses.push(statusCode);
    }
  });

  return statuses;
}
