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
});
