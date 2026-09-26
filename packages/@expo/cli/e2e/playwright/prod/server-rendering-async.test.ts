import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
test.describe.configure({ mode: 'serial' });

const outputDir = 'dist-server-rendering-async-playwright';
test.describe('server rendering with async routes in production', () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      TEST_SECRET_KEY: 'test-secret-key',
    },
  });

  test.beforeAll(async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_ROUTER_SPLIT_STRATEGY: 'bitset',
        E2E_ROUTER_ASYNC: 'true',
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

  test('loads page without JavaScript errors', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const scripts: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url());
    });

    await page.goto(expoServe.url.href);
    await page.waitForSelector('[data-testid="index-text"]');

    expect(pageErrors.errors).toEqual([]);
    const readiness = await page.evaluate(() => {
      const runtime = globalThis as any;
      const urls = [...runtime.__expo_chunk_completion__] as string[];
      return { urls, ready: runtime.__loadBundleAsync.isReady(urls) };
    });
    expect(readiness.urls.length).toBeGreaterThan(0);
    expect(readiness.ready).toBe(true);
    expect(new Set(scripts).size).toBe(scripts.length);
    expect(pageErrors.logs.filter((log) => /hydration/i.test(log.text()))).toEqual([]);
  });

  test('boots the generated not-found page and navigates without reloading', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(new URL('/missing/deep', expoServe.url).href);
    await expect(page.getByTestId('expo-router-unmatched')).toBeVisible();

    await page.evaluate(() => {
      (window as any).__e2eMarker = 'alive';
    });
    await page.getByText('Go back', { exact: true }).click();
    await expect(page.getByTestId('index-text')).toHaveText('Index');
    expect(await page.evaluate(() => (window as any).__e2eMarker)).toBe('alive');
    expect(pageErrors.errors).toEqual([]);
    expect(
      pageErrors.logs.filter((log) => /hydration|react\.dev\/errors/i.test(log.text()))
    ).toEqual([]);
  });

  test('rejects a script that loads without completing registration and permits retry', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(new URL('/links', expoServe.url).href);
    await expect(page.getByTestId('links-one')).toBeVisible();
    const html = await (await page.request.get(new URL('/about', expoServe.url).href)).text();
    const urls = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(
      (match) => new URL(match[1]!, expoServe.url).href
    );
    const targetUrl = urls.find((url) => /\/about-[^/]+\.js$/.test(url))!;
    await page.addScriptTag({ url: targetUrl });
    const sharedUrl = await page.evaluate(
      (urls) =>
        urls.find(
          (url) =>
            url.includes('/__shared-') && !(globalThis as any).__loadBundleAsync.isReady([url])
        ),
      urls
    );
    expect(sharedUrl).toBeTruthy();
    await page.route(sharedUrl!, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'throw new Error("test: chunk registration failed");',
      })
    );
    const result = await page.evaluate(
      async (paths) => {
        const load = (globalThis as any).__loadBundleAsync;
        try {
          await load(paths);
          return { message: null, ready: load.isReady(paths) };
        } catch (error) {
          return { message: String(error), ready: load.isReady(paths) };
        }
      },
      [targetUrl, sharedUrl!]
    );
    expect(result.message).toContain('did not finish registering');
    expect(result.ready).toBe(false);

    await page.unroute(sharedUrl!);
    await page.evaluate(
      (paths) => (globalThis as any).__loadBundleAsync(paths),
      [targetUrl, sharedUrl!]
    );
    await page.getByTestId('links-one').click();
    await expect(page.getByTestId('content')).toHaveText('About');
    expect(pageErrors.errors.map((error) => error.message)).toEqual([
      'test: chunk registration failed',
    ]);
  });

  test('waits for shared registrations when the target factory is already present', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(new URL('/links', expoServe.url).href);
    await expect(page.getByTestId('links-one')).toBeVisible();
    const html = await (await page.request.get(new URL('/about', expoServe.url).href)).text();
    const urls = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(
      (match) => new URL(match[1]!, expoServe.url).href
    );
    const targetUrl = urls.find((url) => /\/about-[^/]+\.js$/.test(url))!;
    expect(targetUrl).toBeTruthy();
    // Register the route before loading its shared dependency.
    await page.addScriptTag({ url: targetUrl });
    const missingUrls = await page.evaluate(
      (urls) =>
        urls.filter(
          (url) =>
            url.includes('/__shared-') && !(globalThis as any).__loadBundleAsync.isReady([url])
        ),
      urls
    );
    expect(missingUrls.length).toBeGreaterThan(0);
    let releaseSharedResponse!: () => void;
    let notifySharedRequest!: () => void;
    const sharedResponsePromise = new Promise<void>((resolve) => {
      releaseSharedResponse = resolve;
    });
    const sharedRequestPromise = new Promise<void>((resolve) => {
      notifySharedRequest = resolve;
    });
    await page.route(missingUrls[0]!, async (route) => {
      notifySharedRequest();
      await sharedResponsePromise;
      await route.continue();
    });
    try {
      await page.getByTestId('links-one').click();
      await sharedRequestPromise;
      expect(pageErrors.errors).toEqual([]);
    } finally {
      releaseSharedResponse();
    }
    await expect(page.getByTestId('content')).toHaveText('About');
    expect(pageErrors.errors).toEqual([]);
  });
});
