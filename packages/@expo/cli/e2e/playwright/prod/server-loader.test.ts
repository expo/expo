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
        E2E_ROUTER_SERVER_LOADERS: 'true',
        E2E_ROUTER_SERVER_RENDERING: 'true',
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
    // TEMP-DEBUG: print the hidden cause of React error #520 in CI
    page.on('console', (m) => console.log(`[browser:${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}\n${e.stack}`));
    await page.addInitScript(() => {
      window.addEventListener('error', (e: any) => {
        const c = e.error?.cause;
        console.log(`CAUSE message=${c?.message} stack=${c?.stack}`);
      });
      window.addEventListener('unhandledrejection', (e: any) => {
        console.log(`UNHANDLED ${e.reason?.message} ${e.reason?.stack}`);
      });
    });

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
