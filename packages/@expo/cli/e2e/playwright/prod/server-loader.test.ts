import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors, trackLoaderNetworkStatuses, waitForLoaderData } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-server-loader-playwright';

test.describe('server loaders in production', () => {
  test.describe.configure({ mode: 'serial' });

  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'server',
      TEST_SECRET_KEY: 'test-secret-key',
      TEST_THROW_ERROR: 'true',
    },
  });

  test.beforeAll(async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'server-loader',
      },
    });
    console.timeEnd('expo export');

    console.time('expo serve');
    await expoServe.startAsync([outputDir]);
    console.timeEnd('expo serve');
  });
  test.afterAll(async () => {
    await expoServe.stopAsync();
  });

  test('writes large completed Suspense content before the bootstrap script', async ({
    request,
  }) => {
    const response = await request.get(new URL('/large-suspense', expoServe.url).href);
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
  });

  test('shows large completed Suspense content without JavaScript', async ({ browser }) => {
    const page = await browser.newPage({ javaScriptEnabled: false });
    try {
      const response = await page.goto(new URL('/large-suspense', expoServe.url).href);

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

    await page.goto(new URL('/large-suspense', expoServe.url).href);
    await expect(page.getByTestId('suspense-row')).toHaveCount(400);
    await expect(page.getByTestId('suspense-content')).toBeVisible();
    await expect(page.getByTestId('suspense-count')).toHaveText('0');
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

    await page.goto(expoServe.url.href);
    expect(loaderRequests).toHaveLength(0);

    await page.click('a[href="/posts/static-post-1"]');
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
    expect(loaderRequests).toContainEqual(expect.stringContaining('/_expo/loaders/posts'));

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });
  });

  test('loads a platform-specific catch-all loader on client-side navigation', async ({ page }) => {
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(expoServe.url.href);
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

  test('refetches headerless loader data on every fresh mount', async ({ page }) => {
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(expoServe.url.href);

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
    const responseUrl = new URL('/response', expoServe.url.href).toString();

    await page.goto(responseUrl);
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

    await page.goto(expoServe.url.href);
    await page.click('a[href="/second"]');
    await page.waitForSelector('[data-testid="loader-result"]');
    await page.click('a[href="/"]');
    await page.waitForSelector('[data-testid="loader-result"]');
    await page.click('a[href="/second"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    await expect.poll(() => statuses).toEqual([200, 200]);
  });

  test('handles loader module fetch errors gracefully', async ({ page }) => {
    await page.goto(expoServe.url.href);

    await page.route('**/_expo/loaders/**', (route) => {
      route.abort('failed');
    });

    await page.click('a[href="/posts/static-post-1"]');

    await expect(page.locator('[data-testid="loader-result"]')).not.toBeVisible();
  });

  test('shows suspense fallback while loading', async ({ page }) => {
    await page.goto(expoServe.url.href);

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

    const url = new URL(expoServe.url.href);
    url.pathname = '/no-loader';

    // Start on no loader route
    await page.goto(url.toString(), { waitUntil: 'networkidle' });

    // Navigate to index route (has loader)
    await page.click('a[href="/"]');
    await waitForLoaderData(page, { data: 'root-index' });

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'root-index' });

    expect(pageErrors.all).toEqual([]);
  });

  test('navigates from route with loader to another route with loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    const url = new URL(expoServe.url.href);
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
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
    const postsLoaderDataContent = await page
      .locator('[data-testid="loader-result"]')
      .textContent();
    expect(JSON.parse(postsLoaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });

    expect(pageErrors.all).toEqual([]);
  });

  test('displays error boundary when loader throws on client-side navigation', async ({ page }) => {
    await page.goto(expoServe.url.href);

    // Navigate to error route
    await page.click('a[href="/error"]');

    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();

    expect(errorMessage).toContain('Failed to load loader data for route: /error');
    await expect(page.locator('[data-testid="should-not-render"]')).not.toBeVisible();
  });
});
