import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getServerTesterRoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors, waitForLoaderData } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getServerTesterRoot();
const outputDir = 'dist-static-loader-playwright';

test.describe('static loaders in production', () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.beforeAll(async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        E2E_ROUTER_WEB_OUTPUT: 'static',
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
      if (request.url().includes('/_expo/loaders/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(new URL('/', expoServe.url.href).href);
    expect(loaderRequests).toHaveLength(0);

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/loaders/posts/static-post-1')
    );

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });
  });

  test('loads grouped loader data on client-side navigation', async ({ page }) => {
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(new URL('/', expoServe.url.href).href);
    await page.getByRole('link', { name: '/loaders/groups/(group)', exact: true }).click();
    await expect(page.locator('[data-testid="loader-result"]')).toHaveText(
      JSON.stringify({ data: 'grouped-index' }, null, 2)
    );
    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/loaders/groups/(group)/index')
    );
  });

  test('loads a platform-specific catch-all loader on client-side navigation', async ({ page }) => {
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(new URL('/', expoServe.url.href).href);
    await page
      .getByRole('link', { name: '/loaders/groups/platform/alpha/beta', exact: true })
      .click();
    await expect(page).toHaveURL(/\/platform\/alpha\/beta$/);
    await expect(page.locator('[data-testid="loader-result"]')).toHaveText(
      JSON.stringify({ data: 'platform-catch-all' }, null, 2)
    );
    expect(loaderRequests).toContainEqual(
      expect.stringContaining('/_expo/loaders/loaders/groups/(group)/platform/alpha/beta')
    );
    expect(loaderRequests).not.toContainEqual(expect.stringContaining('[...slug].web'));
  });

  test('revalidates headerless loader data on every fresh mount', async ({ page }) => {
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(new URL('/loaders', expoServe.url.href).href);

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });

    await page.goBack();
    await waitForLoaderData(page, { data: 'root-index' });

    await page.getByRole('link', { name: '/loaders/posts/static-post-2', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-2' } });

    await page.goBack();
    await waitForLoaderData(page, { data: 'root-index' });

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });

    expect(loaderRequests).toEqual([
      expect.stringContaining('/_expo/loaders/loaders/posts/static-post-1'),
      expect.stringContaining('/_expo/loaders/loaders/index'),
      expect.stringContaining('/_expo/loaders/loaders/posts/static-post-2'),
      expect.stringContaining('/_expo/loaders/loaders/index'),
      expect.stringContaining('/_expo/loaders/loaders/posts/static-post-1'),
    ]);
  });

  test('handles loader module fetch errors gracefully', async ({ page }) => {
    await page.goto(new URL('/', expoServe.url.href).href);

    await page.route('**/_expo/loaders/**', (route) => {
      route.abort('failed');
    });

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();

    await expect(page.locator('[data-testid="loader-result"]')).not.toBeVisible();
  });

  test('shows suspense fallback while loading', async ({ page }) => {
    await page.goto(new URL('/', expoServe.url.href).href);

    await page.route('**/_expo/loaders/**', async (route) => {
      // The fallback appears only once the lazy route chunks load, so a short delay can end first.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    const suspenseFallback = page.locator('[data-testid="suspense-fallback"]');
    await expect(suspenseFallback).toBeVisible();

    await page.waitForSelector('[data-testid="loader-result"]');
    await expect(suspenseFallback).not.toBeVisible();
  });

  test('navigates from route without loader to route with loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    const url = new URL(expoServe.url.href);
    url.pathname = '/';

    // Start on no loader route
    await page.goto(url.toString(), { waitUntil: 'networkidle' });

    // Navigate to index route (has loader)
    await page.getByRole('link', { name: '/loaders', exact: true }).click();
    await waitForLoaderData(page, { data: 'root-index' });

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ data: 'root-index' });

    expect(pageErrors.all).toEqual([]);
  });

  test('navigates from route with loader to another route with loader', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    const url = new URL(expoServe.url.href);
    url.pathname = '/loaders';

    // Start on the index route (with loader)
    await page.goto(url.toString());
    await page.waitForSelector('[data-testid="loader-result"]');

    const indexLoaderDataContent = await page
      .locator('[data-testid="loader-result"]')
      .textContent();
    expect(JSON.parse(indexLoaderDataContent!)).toEqual({ data: 'root-index' });

    // Navigate to posts route (has loader)
    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
    const postsLoaderDataContent = await page
      .locator('[data-testid="loader-result"]')
      .textContent();
    expect(JSON.parse(postsLoaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });

    expect(pageErrors.all).toEqual([]);
  });
});
