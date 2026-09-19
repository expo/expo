import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-server-rendering-playwright';

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
        E2E_ROUTER_ASYNC: 'false',
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

  test('adopts streamed Suspense content instead of re-rendering it', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    // Runs before the client bundle, so every streamed node is tagged as it is
    // parsed. A node the client re-rendered is a different node without the tag,
    // which is what makes this stronger than asserting the text is present.
    await page.addInitScript(() => {
      const ids = ['streaming-header', 'streaming-reviews', 'streaming-related'];
      const w = window as any;
      w.__streamed = {};
      w.__discarded = [];
      const observer = new MutationObserver(() => {
        for (const id of ids) {
          const node = document.querySelector(`[data-testid="${id}"]`);
          if (node && !w.__streamed[id]) {
            w.__streamed[id] = node;
          }
        }
        for (const id of ids) {
          const streamed = w.__streamed[id];
          if (streamed && !streamed.isConnected && !w.__discarded.includes(id)) {
            w.__discarded.push(id);
          }
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });

    // `load` only fires once the stream ends, so `commit` is needed to watch the
    // document while the server is still writing to it.
    await page.goto(new URL('/streaming?delay=2000', expoServe.url).href, {
      waitUntil: 'commit',
    });

    // Both boundaries are pending in the initial shell, so their content can
    // only reach the page through the stream.
    await expect(page.getByTestId('streaming-reviews-skeleton')).toHaveCount(1);
    await expect(page.getByTestId('streaming-related-skeleton')).toHaveCount(1);

    await page.waitForSelector('[data-testid="streaming-hydrated"]');

    // The client promises never resolve, so anything still on the page came
    // from the server and survived hydration.
    await expect(page.getByTestId('streaming-reviews')).toContainText('Dana K.');
    await expect(page.getByTestId('streaming-related')).toContainText('Burr Hand Grinder');
    await expect(page.getByTestId('streaming-reviews-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('streaming-related-skeleton')).toHaveCount(0);

    // Give any post-hydration effect a chance to invalidate the boundaries.
    await page.waitForTimeout(1000);

    const adoption = await page.evaluate(() => {
      const w = window as any;
      return {
        discarded: w.__discarded,
        stillStreamedNodes: ['streaming-header', 'streaming-reviews', 'streaming-related'].filter(
          (id) => w.__streamed[id] === document.querySelector(`[data-testid="${id}"]`)
        ),
      };
    });

    expect(adoption.discarded).toEqual([]);
    expect(adoption.stillStreamedNodes).toEqual([
      'streaming-header',
      'streaming-reviews',
      'streaming-related',
    ]);

    expect(pageErrors.all).toEqual([]);
  });
});
