import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const inputDir = 'router-prevent-remove';
const expoStart = createExpoStart({
  cwd: getRouterE2ERoot(),
  env: {
    NODE_ENV: 'production',
    EXPO_USE_STATIC: 'single',
    E2E_ROUTER_SRC: inputDir,
    E2E_ROUTER_ASYNC: 'development',
    CI: '0',
  },
});

test.describe(inputDir, () => {
  test.beforeEach(async () => {
    await expoStart.startAsync();
    await expoStart.fetchBundleAsync('/');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  // TODO(@ubax): Restore remove prevention after reducer dispatch supports it. https://linear.app/expo/issue/ENG-26123
  test.skip('blocks removal and continues after disabling the hook', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(expoStart.url.href);

    await page.getByTestId('open-hook').click();
    await page.getByTestId('back').click();
    await expect(page.getByTestId('form-hook')).toBeVisible();
    await expect(page.getByTestId('prevented-count')).toHaveText('1');

    await page.goBack();
    await expect(page.getByTestId('form-hook')).toBeVisible();
    await expect(page.getByTestId('prevented-count')).toHaveText('2');

    await page.getByTestId('discard').click();
    await expect(page.getByTestId('index')).toBeVisible();

    await page.getByTestId('open-option').click();
    await page.getByTestId('back').click();
    await expect(page.getByTestId('form-option')).toBeVisible();
    await expect(page.getByTestId('prevented-count')).toHaveText('1');
    await page.getByTestId('discard').click();
    await expect(page.getByTestId('index')).toBeVisible();
    expect(pageErrors.all).toEqual([]);
  });
});
