import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'native-tabs';

const visibleTestId = (page: Page, testId: string) =>
  page.getByTestId(testId).filter({ visible: true });

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('navigation with links works across tabs', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested/inner', exact: true }).click();

    await expect(visibleTestId(page, 'native-tabs-nested-inner')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /', exact: true }).click();

    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested', exact: true }).click();

    await expect(visibleTestId(page, 'native-tabs-nested-index')).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('state is not reset when navigating between tabs', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    // 1 is the badge value on the "nested" tab
    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-nested-index')).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested/inner', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-nested-inner')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-nested-inner')).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-nested-index')).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(visibleTestId(page, 'native-tabs-nested-index')).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('dynamic options are applied only when tab is focused', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(visibleTestId(page, 'native-tabs-index')).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Dynamic 9', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Dynamic 9', exact: true }).click();
    await expect(visibleTestId(page, 'label-input')).toBeVisible();
    await expect(visibleTestId(page, 'badge-input')).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Dynamic 9', exact: true })).not.toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });
});
