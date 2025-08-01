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

  test.beforeEach(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');
  });
  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('loader loads and renders data', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoStart.url.href);

    const loaderDataScript = await page.evaluate(() => {
      return window.__EXPO_ROUTER_LOADER_DATA__;
    });
    expect(loaderDataScript).toBeDefined();
    expect(loaderDataScript!['/']).toEqual({ params: {} });

    await page.waitForSelector('[data-testid="loader-result"]');
    const loaderDataElement = await page.locator('[data-testid="loader-result"]');
    await expect(loaderDataElement).toHaveText('{"params":{}}');

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
      expect.stringContaining('/_expo/loaders/posts/static-post-1.js')
    );

    const loaderData = page.locator('[data-testid="loader-result"]');
    await expect(loaderData).toContainText('"postId":"static-post-1"');
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
    const firstRequestCount = loaderRequests.length;

    await page.click('a[href="/"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    await page.click('a[href="/posts/static-post-1"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    expect(loaderRequests.length).toBe(firstRequestCount);
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

  test('handles navigation to dynamic routes not in generateStaticParams', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const loaderRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(expoStart.url.href);

    // Navigate to a dynamic route not pre-generated via generateStaticParams
    await page.click('a[href="/posts/dynamic-post-1"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    expect(pageErrors.all).toEqual([]);

    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/posts/dynamic-post-1.js')
    );

    const loaderData = page.locator('[data-testid="loader-result"]');
    await expect(loaderData).toContainText('"postId":"dynamic-post-1"');
  });

  test('handles multiple dynamic routes with fallback', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    const dynamicRoutes = ['/posts/dynamic-post-1', '/posts/dynamic-post-2'];

    for (const route of dynamicRoutes) {
      await page.goto(expoStart.url.href);
      await page.click(`a[href="${route}"]`);
      await page.waitForSelector('[data-testid="loader-result"]');

      const loaderData = page.locator('[data-testid="loader-result"]');
      const expectedPostId = route.split('/').pop();
      await expect(loaderData).toContainText(`"postId":"${expectedPostId}"`);
    }

    // Should not have any errors across all navigations
    expect(pageErrors.all).toEqual([]);
  });
});
