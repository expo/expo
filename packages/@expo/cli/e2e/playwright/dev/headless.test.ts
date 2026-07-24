import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'headless';

const visibleTestId = (page: Page, testId: string) =>
  page.getByTestId(testId).filter({ visible: true });
const movieDetailsFor = (page: Page, name: string) =>
  visibleTestId(page, 'tab-movie-details').filter({ hasText: name });

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

    await expect(visibleTestId(page, 'tab-home-index')).toBeVisible();

    await page.getByText('Go to Tab functions').click();

    await expect(visibleTestId(page, 'tab-home-functions')).toBeVisible();

    await page.getByTestId('tab-movies').click();

    await expect(visibleTestId(page, 'tab-movies-index')).toBeVisible();

    await page.getByTestId('tab-home').click();

    await expect(visibleTestId(page, 'tab-home-index')).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('when resetOnFocus is false, does reset the tab until second click', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await page.getByTestId('tab-movies').click();

    await expect(visibleTestId(page, 'tab-movies-index')).toBeVisible();

    await page.getByRole('link', { name: 'Toy Story' }).click();

    const movieDetails = movieDetailsFor(page, 'Toy Story');
    await expect(movieDetails).toBeVisible();
    await expect(movieDetails).toContainText('Toy Story');
    await expect(movieDetails).toContainText('Lorem ipsum dolor sit amet');

    await page.getByTestId('tab-home').click();

    await expect(visibleTestId(page, 'tab-home-index')).toBeVisible();

    await page.getByTestId('tab-movies').click();

    // Still on the movie details page
    await expect(movieDetails).toBeVisible();
    await expect(movieDetails).toContainText('Toy Story');
    await expect(movieDetails).toContainText('Lorem ipsum dolor sit amet');

    // Second click on focused tab resets it
    await page.getByTestId('tab-movies').click();

    await expect(visibleTestId(page, 'tab-movies-index')).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('back behavior works correctly when navigating in the stack nested inside tabs', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(visibleTestId(page, 'tab-home-index')).toBeVisible();

    await page.getByText('Toy Story').click();

    const toyStoryDetails = movieDetailsFor(page, 'Toy Story');
    await expect(toyStoryDetails).toBeVisible();
    await expect(toyStoryDetails).toContainText('Toy Story');
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    await page.getByRole('link', { name: 'Monsters Inc.' }).click();
    const monstersDetails = movieDetailsFor(page, 'Monsters Inc.');
    await expect(monstersDetails).toBeVisible();
    await expect(monstersDetails).toContainText('Monsters Inc.');
    await expect(page).toHaveURL(/\/movies\/Monsters%20Inc$/);

    // Go back to Toy Story
    await page.goBack();
    await expect(toyStoryDetails).toBeVisible();
    await expect(toyStoryDetails).toContainText('Toy Story');
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    // Go back to movies index
    await page.goBack();
    await expect(visibleTestId(page, 'tab-home-index')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    expect(pageErrors.all).toEqual([]);
  });
});
