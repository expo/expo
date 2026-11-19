import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getServerTesterRoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors, trackLoaderNetworkStatuses, waitForLoaderData } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getServerTesterRoot();
const outputDir = 'dist-server-loader-playwright';

test.describe('server loaders in production', () => {
  test.describe.configure({ mode: 'serial' });

  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      E2E_ROUTER_WEB_OUTPUT: 'server',
      TEST_SECRET_KEY: 'test-secret-key',
      TEST_THROW_ERROR: 'true',
    },
  });

  test.beforeAll(async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        E2E_ROUTER_WEB_OUTPUT: 'server',
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

  test('refreshes hydrated data through the HTTP cache while keeping client state', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/loaders/revalidate');
    await page.goto(new URL('/loaders/revalidate', expoServe.url).href);
    await expect(page.getByTestId('refresh-mounted')).toHaveText('true');
    expect(statuses).toEqual([]);
    await page.getByTestId('refresh-input').fill('keep this text');
    const initial = await page.getByTestId('refresh-data').textContent();
    await page.screenshot({ path: test.info().outputPath('refresh-before.png'), fullPage: true });
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('refresh-data')).not.toHaveText(initial!);
    await expect.poll(() => statuses).toEqual([200]);
    const firstRefresh = await page.getByTestId('refresh-data').textContent();
    await page.getByTestId('refresh-toggle').click();
    await expect(page.getByTestId('refresh-data')).toBeHidden();
    await page.getByTestId('refresh-button').click();
    await expect.poll(() => statuses).toEqual([200, 200]);
    await expect(page.getByTestId('refresh-pending')).toHaveText('false');
    await page.getByTestId('refresh-toggle').click();
    await expect(page.getByTestId('refresh-data')).not.toHaveText(firstRefresh!);
    await expect(page.getByTestId('refresh-input')).toHaveValue('keep this text');
    await page.screenshot({ path: test.info().outputPath('refresh-after.png'), fullPage: true });
    expect(pageErrors.all).toEqual([]);
  });

  test('retains loader data and local state across Activity hide and reveal', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) loaderRequests.push(request.url());
    });
    await page.goto(new URL('/loaders', expoServe.url).href);
    await page.getByTestId('route-links-mounted').first().waitFor({ state: 'attached' });
    await page.getByTestId('index-increment').click();
    await expect(page.getByTestId('index-count')).toHaveText('1');
    loaderRequests.length = 0;
    await page.getByTestId('toggle-route-activity').click();
    await expect(page.getByTestId('loader-result')).toBeHidden();
    await page.screenshot({
      path: test.info().outputPath('activity-hidden.png'),
      fullPage: true,
    });
    await page.getByTestId('toggle-route-activity').click();
    await expect(page.getByTestId('loader-result')).toContainText('root-index');
    await expect(page.getByTestId('index-count')).toHaveText('1');
    await page.screenshot({
      path: test.info().outputPath('activity-revealed.png'),
      fullPage: true,
    });
    expect(loaderRequests).toEqual([]);
    expect(pageErrors.all).toEqual([]);
  });

  test('hydrates large completed Suspense content', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/loaders/large-suspense', expoServe.url).href);
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
      if (request.url().includes('/_expo/loaders/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    await page.goto(new URL('/', expoServe.url.href).href);
    expect(loaderRequests).toHaveLength(0);

    await page.getByRole('link', { name: '/loaders/posts/static-post-1', exact: true }).click();
    await waitForLoaderData(page, { params: { postId: 'static-post-1' } });
    expect(loaderRequests).toContainEqual(expect.stringContaining('/_expo/loaders/loaders/posts'));

    const loaderDataContent = await page.locator('[data-testid="loader-result"]').textContent();
    expect(JSON.parse(loaderDataContent!)).toEqual({ params: { postId: 'static-post-1' } });
  });

  test('refetches headerless loader data on every fresh mount', async ({ page }) => {
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

  test('the initial max-age seed fetches once, then primes the HTTP cache', async ({ page }) => {
    const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/loaders/response');
    const responseUrl = new URL('/loaders/response', expoServe.url.href).toString();

    await page.goto(responseUrl);
    expect(statuses).toEqual([]);

    // The first revisit hits the network — the hydration seed never primes the HTTP cache.
    await page.goto(new URL('/', expoServe.url.href).href);
    await page.getByRole('link', { name: '/loaders/response', exact: true }).click();
    await page.waitForSelector('[data-testid="loader-result"]');
    await expect.poll(() => statuses).toEqual([200]);

    await page.goBack();
    await page.getByTestId('index-text').waitFor();
    await page.getByRole('link', { name: '/loaders/response', exact: true }).click();
    await page.waitForSelector('[data-testid="loader-result"]');

    // A second render-driven fetch occurs, but max-age lets Chromium answer it locally.
    await expect.poll(() => statuses).toEqual([200]);
  });

  test('a declared no-store loader reaches the network on every mount', async ({ page }) => {
    const statuses = await trackLoaderNetworkStatuses(page, '/_expo/loaders/loaders/second');

    await page.goto(new URL('/', expoServe.url.href).href);
    await page.getByRole('link', { name: '/loaders/second', exact: true }).click();
    await page.waitForSelector('[data-testid="loader-result"]');
    await page.goBack();
    await page.getByTestId('index-text').waitFor();
    await page.getByRole('link', { name: '/loaders/second', exact: true }).click();
    await page.waitForSelector('[data-testid="loader-result"]');

    await expect.poll(() => statuses).toEqual([200, 200]);
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

  test('displays error boundary when loader throws on client-side navigation', async ({ page }) => {
    await page.goto(new URL('/', expoServe.url.href).href);

    // Navigate to error route
    await page.getByRole('link', { name: '/loaders/error', exact: true }).click();

    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();

    expect(errorMessage).toContain('Failed to load loader data for route: /loaders/error');
    await expect(page.locator('[data-testid="should-not-render"]')).not.toBeVisible();
  });
});
