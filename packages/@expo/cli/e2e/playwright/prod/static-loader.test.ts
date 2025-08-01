import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-static-loader';

test.describe('static loader in production', () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.beforeEach(async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'server-loader',
        E2E_ROUTER_SERVER_LOADERS: 'true',
      },
    });
    console.timeEnd('expo export');

    console.time('npx serve');
    await expoServe.startAsync([outputDir]);
    console.timeEnd('npx serve');
  });
  test.afterEach(async () => {
    await expoServe.stopAsync();
  });

  test('loader loads and renders data', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoServe.url.href);

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

    await page.goto(expoServe.url.href);
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

    await page.goto(expoServe.url.href);

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

    const loaderResult = page.locator('[data-testid="loader-result"]');

    // In production, `<SuspenseFallback>` returns null, but we can verify the Suspense boundary is
    // working by checking that content is not rendered during loading
    await expect(loaderResult).not.toBeVisible({ timeout: 100 });

    await expect(loaderResult).toBeVisible({ timeout: 1000 });
  });

  test('handles navigation to dynamic routes not in generateStaticParams', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const loaderRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(expoServe.url.href);

    await page.click('a[href="/posts/dynamic-post-1"]');
    await page.waitForSelector('[data-testid="loader-result"]');

    // 404 error for dynamic-post-1.js is expected in static export
    expect(pageErrors.logs.length).toBeGreaterThan(0);
    expect(pageErrors.logs[0].text()).toContain('404');

    // Should try to fetch the specific loader, then use fallback
    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/posts/dynamic-post-1.js')
    );
    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/posts/[postId].js')
    );

    const loaderData = page.locator('[data-testid="loader-result"]');
    await expect(loaderData).toContainText('"postId":"[postId]"');
  });

  test('handles multiple dynamic routes with fallback', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const dynamicRoutes = ['/posts/dynamic-post-1', '/posts/dynamic-post-2'];

    for (const route of dynamicRoutes) {
      await page.goto(expoServe.url.href);
      await page.click(`a[href="${route}"]`);
      await page.waitForSelector('[data-testid="loader-result"]');

      const loaderData = page.locator('[data-testid="loader-result"]');
      await expect(loaderData).toContainText('"postId":"[postId]"');
    }

    expect(pageErrors.logs.length).toBeGreaterThan(0);
    expect(pageErrors.logs[0].text()).toContain('404');
  });
});
