import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'native-tabs';

test.describe(inputDir, () => {
  test.describe.configure({ mode: 'serial' });

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeAll(async () => {
    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterAll(async () => {
    await expoStart.stopAsync();
  });

  test('navigation with links works across tabs', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested/inner', exact: true }).click();

    await expect(
      page.getByTestId('native-tabs-nested-inner').filter({ visible: true })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/nested\/inner$/);

    await page.getByRole('link', { name: 'Go to /', exact: true }).click();

    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('link', { name: 'Go to /nested', exact: true }).click();

    await expect(
      page.getByTestId('native-tabs-nested-index').filter({ visible: true })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/nested$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('state is not reset when navigating between tabs', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    // 1 is the badge value on the "nested" tab
    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(
      page.getByTestId('native-tabs-nested-index').filter({ visible: true })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested/inner', exact: true }).click();
    await expect(
      page.getByTestId('native-tabs-nested-inner').filter({ visible: true })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Go to /', exact: true }).click();
    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(
      page.getByTestId('native-tabs-nested-inner').filter({ visible: true })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('link', { name: 'Go to /nested', exact: true }).click();
    await expect(
      page.getByTestId('native-tabs-nested-index').filter({ visible: true })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Index label', exact: true }).click();
    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('tab', { name: 'nested 1', exact: true }).click();
    await expect(
      page.getByTestId('native-tabs-nested-index').filter({ visible: true })
    ).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('dynamic options are applied only when tab is focused', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(page.getByTestId('native-tabs-index').filter({ visible: true })).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Dynamic 9', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Dynamic 9', exact: true }).click();
    await expect(page.getByTestId('label-input').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/dynamic$/);

    await expect(page.getByRole('tab', { name: 'Dynamic 9', exact: true })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tab 2 9+', exact: true })).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });
});
