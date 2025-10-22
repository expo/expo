import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'headless';

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

  test('when resetOnFocus is true, resets the tab', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    expect(page.getByTestId('tab-home-index')).toBeDefined();

    await page.getByText('Go to Tab functions').click();

    expect(page.getByTestId('tab-home-functions')).toBeDefined();

    await page.getByTestId('tab-movies').click();

    expect(page.getByTestId('tab-movies-index')).toBeDefined();

    await page.getByTestId('tab-home').click();

    expect(page.getByTestId('tab-home-index')).toBeDefined();

    expect(pageErrors.all).toEqual([]);
  });

  test('when resetOnFocus is false, does reset the tab until second click', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await page.getByTestId('tab-movies').click();

    expect(page.getByTestId('tab-movies-index')).toBeDefined();

    await page.getByRole('link', { name: 'Toy Story' }).click();

    expect(page.getByTestId('tab-movies-details')).toBeDefined();
    expect(page.getByText('Toy Story')).toBeDefined();
    expect(page.getByText('Lorem ipsum dolor sit amet')).toBeDefined();

    await page.getByTestId('tab-home').click();

    expect(page.getByTestId('tab-home-index')).toBeDefined();

    await page.getByTestId('tab-movies').click();

    // Still on the movie details page
    expect(page.getByTestId('tab-movies-details')).toBeDefined();
    expect(page.getByText('Toy Story')).toBeDefined();
    expect(page.getByText('Lorem ipsum dolor sit amet')).toBeDefined();

    // Second click on focused tab resets it
    await page.getByTestId('tab-movies').click();

    expect(page.getByTestId('tab-movies-index')).toBeDefined();

    expect(pageErrors.all).toEqual([]);
  });

  test('back behavior works correctly when navigating in the stack nested inside tabs', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    expect(page.getByTestId('tab-home-index')).toBeDefined();

    await page.getByText('Toy Story').click();

    expect(page.getByTestId('tab-movies-details')).toBeDefined();
    // Title + link (link is interpreted as two elements)
    expect(page.getByRole('heading', { name: 'Toy Story' })).toBeDefined();
    expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    await page.getByRole('link', { name: 'Monsters Inc.' }).click();
    expect(page.getByTestId('tab-movies-details')).toBeDefined();
    // Title + link (link is interpreted as two elements)
    expect(page.getByRole('heading', { name: 'Monsters Inc.' })).toBeDefined();
    expect(page).toHaveURL(/\/movies\/Monsters%20Inc$/);

    // Go back to Toy Story
    await page.goBack();
    expect(page.getByTestId('tab-movies-details')).toBeDefined();
    // Title + link (link is interpreted as two elements)
    expect(page.getByRole('heading', { name: 'Toy Story' })).toBeDefined();
    expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    // Go back to movies index
    await page.goBack();
    expect(page.getByTestId('tab-home-index')).toBeDefined();
    expect(page).toHaveURL(/\/$/);

    expect(pageErrors.all).toEqual([]);
  });
});
