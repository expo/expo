import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'server-loader';

test.describe('server loader in development', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_SERVER_LOADERS: 'true',

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

  test('loads and renders a route without a loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoStart.url.href);

    const loaderDataScript = await page.evaluate(() => {
      return globalThis.__EXPO_ROUTER_LOADER_DATA__;
    });
    expect(loaderDataScript).not.toBeDefined();

    // Index route doesn't have a loader, so no loader-result element should exist
    const loaderResult = page.locator('[data-testid="loader-result"]');
    await expect(loaderResult).toHaveCount(0);

    expect(pageErrors.all).toEqual([]);
  });

  test('loads and renders a route with a loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoStart.url.href + 'second');

    const loaderDataScript = await page.evaluate(() => {
      return globalThis.__EXPO_ROUTER_LOADER_DATA__;
    });
    expect(loaderDataScript).toBeDefined();

    // In dev mode, loader data is fetched dynamically, so we just verify the loader result renders
    await page.waitForSelector('[data-testid="loader-result"]');
    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'second' });

    expect(pageErrors.all).toEqual([]);
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
    expect(JSON.parse(loaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });
  });

  test('caches loader data for subsequent navigations', async ({ page }) => {
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

    // Should not make additional requests for cached static-post-1
    expect(loaderRequests.length).toBe(2);
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

    const suspenseFallback = await page.locator('text=Bundling...');
    await expect(suspenseFallback).toBeVisible();

    await page.waitForSelector('[data-testid="loader-result"]');
    await expect(suspenseFallback).not.toBeVisible();
  });

  test('navigates from route without loader to route with loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    // Start at index route (no loader)
    await page.goto(expoStart.url.href);

    // Navigate to second route (has loader)
    await page.click('a[href="/second"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'second' });

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
    expect(JSON.parse(postsLoaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });

    expect(pageErrors.all).toEqual([]);
  });
});
