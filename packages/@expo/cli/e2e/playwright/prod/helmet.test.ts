import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const outputDir = 'dist-helmet-playwright';

test.describe('Head component document title', () => {
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
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'helmet',
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

  test('updates document title when navigating between tabs', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(expoServe.url.href);
    await page.waitForSelector('[data-testid="index-text"]');

    await expect(page).toHaveTitle('Index');

    await page.getByRole('tab', { name: 'page1' }).click();
    await page.waitForSelector('[data-testid="page1-text"]');
    await expect(page).toHaveTitle('Page 1');

    await page.getByRole('tab', { name: 'page2' }).click();
    await page.waitForSelector('[data-testid="page2-text"]');
    await expect(page).toHaveTitle('Page 2');

    await page.getByRole('tab', { name: 'index' }).click();
    await page.waitForSelector('[data-testid="index-text"]');
    await expect(page).toHaveTitle('Index');

    expect(pageErrors.all).toEqual([]);
  });

  test('updates document title when navigating via links', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(expoServe.url.href);
    await page.waitForSelector('[data-testid="index-text"]');
    await expect(page).toHaveTitle('Index');

    await page.getByTestId('index-link-page1').click();
    await page.waitForSelector('[data-testid="page1-text"]');
    await expect(page).toHaveTitle('Page 1');

    await page.getByTestId('page1-link-page2').click();
    await page.waitForSelector('[data-testid="page2-text"]');
    await expect(page).toHaveTitle('Page 2');

    await page.getByTestId('page2-link-index').click();
    await page.waitForSelector('[data-testid="index-text"]');
    await expect(page).toHaveTitle('Index');

    expect(pageErrors.all).toEqual([]);
  });

  test('updates document title when navigating via router.push', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(expoServe.url.href);
    await page.waitForSelector('[data-testid="index-text"]');
    await expect(page).toHaveTitle('Index');

    await page.getByTestId('index-button-page1').click();
    await page.waitForSelector('[data-testid="page1-text"]');
    await expect(page).toHaveTitle('Page 1');

    await page.getByTestId('page1-button-page2').click();
    await page.waitForSelector('[data-testid="page2-text"]');
    await expect(page).toHaveTitle('Page 2');

    await page.getByTestId('page2-button-index').click();
    await page.waitForSelector('[data-testid="index-text"]');
    await expect(page).toHaveTitle('Index');

    expect(pageErrors.all).toEqual([]);
  });
});
