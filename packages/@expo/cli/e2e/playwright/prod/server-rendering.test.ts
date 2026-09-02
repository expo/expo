import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-server-rendering-async-playwright';

test.describe('server rendering in production', () => {
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

  test('loads page without JavaScript errors', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(expoServe.url.href);
    await page.waitForSelector('[data-testid="index-text"]');

    expect(pageErrors.errors).toEqual([]);
  });

  test('hydrates and performs client-side navigation from the links page', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/links', expoServe.url).href);
    await page.waitForSelector('[data-testid="links-one"]');

    await page.evaluate(() => {
      (window as any).__e2eMarker = 'alive';
    });

    await page.locator('[data-testid="links-one"]').click();

    await expect(page).toHaveURL(new URL('/about', expoServe.url).href);
    await expect(page.locator('[data-testid="content"]')).toHaveText('About');

    expect(
      await page.evaluate(() => {
        return (window as any).__e2eMarker;
      })
    ).toBe('alive');
    expect(pageErrors.all).toEqual([]);
  });

  test('streams two pending Suspense boundaries and completes them later', async ({ page }) => {
    const response = await page.request.get(new URL('/streaming?delay=300', expoServe.url).href);
    const html = await response.text();

    expect(html.match(/<!--\$\?-->/g)).toHaveLength(2);
    expect(html.match(/\$RC\(/g)).toHaveLength(2);
    expect(html).toContain('Dana K.');
    expect(html).toContain('Burr Hand Grinder');
  });

  test('adopts streamed Suspense content during hydration', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    // Runs before the client bundle, so the flag marks the server-rendered node.
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const header = document.querySelector('[data-testid="streaming-header"]');
        if (header) {
          (header as any).__fromServer = true;
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });

    // `load` fires only when the stream ends; `commit` lets us observe hydration while pending.
    await page.goto(new URL('/streaming?delay=4000', expoServe.url).href, {
      waitUntil: 'commit',
    });
    await page.waitForSelector('[data-testid="streaming-hydrated"]');

    // Hydration must happen while both are pending, or the test proves nothing.
    await expect(page.getByTestId('streaming-reviews-skeleton')).toHaveCount(1);
    await expect(page.getByTestId('streaming-related-skeleton')).toHaveCount(1);
    await expect(page.getByTestId('streaming-reviews')).toHaveCount(0);
    await expect(page.getByTestId('streaming-related')).toHaveCount(0);

    // The client promises never resolve, so this content can only come from the server stream.
    await expect(page.getByTestId('streaming-reviews')).toContainText('Dana K.', {
      timeout: 10_000,
    });
    await expect(page.getByTestId('streaming-reviews-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('streaming-related')).toContainText('Burr Hand Grinder', {
      timeout: 10_000,
    });
    await expect(page.getByTestId('streaming-related-skeleton')).toHaveCount(0);

    const headerFromServer = await page.evaluate(
      () =>
        (document.querySelector('[data-testid="streaming-header"]') as any)?.__fromServer === true
    );
    expect(headerFromServer).toBe(true);

    expect(pageErrors.all).toEqual([]);
  });
});
