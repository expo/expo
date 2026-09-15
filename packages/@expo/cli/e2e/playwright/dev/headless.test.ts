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

  test('when resetOnFocus is true, resets the tab', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(page.getByTestId('tab-home-index').filter({ visible: true })).toBeVisible();

    await page.getByText('Go to Tab functions').click();

    await expect(page.getByTestId('tab-home-functions').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/tab-functions$/);

    await page.getByTestId('tab-movies').click();

    await expect(page.getByTestId('tab-movies-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/movies$/);

    await page.getByTestId('tab-home').click();

    await expect(page.getByTestId('tab-home-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('when resetOnFocus is false, does not reset the tab until second click', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await page.getByTestId('tab-movies').click();

    await expect(page.getByTestId('tab-movies-index').filter({ visible: true })).toBeVisible();

    await page.getByRole('link', { name: 'Toy Story' }).click();

    const visibleMovieDetails = page.getByTestId('tab-movie-details').filter({ visible: true });
    await expect(visibleMovieDetails).toContainText('Toy Story');
    await expect(visibleMovieDetails).toContainText('Lorem ipsum dolor sit amet');
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    await page.getByTestId('tab-home').click();

    await expect(page.getByTestId('tab-home-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTestId('tab-movies').click();

    // Still on the movie details page
    await expect(visibleMovieDetails).toContainText('Toy Story');
    await expect(visibleMovieDetails).toContainText('Lorem ipsum dolor sit amet');
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    // Second click on focused tab resets it
    await page.getByTestId('tab-movies').click();

    await expect(page.getByTestId('tab-movies-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/movies$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('back behavior works correctly when navigating in the stack nested inside tabs', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/', expoStart.url).href);

    await expect(page.getByTestId('tab-home-index').filter({ visible: true })).toBeVisible();

    await page.getByText('Toy Story').click();

    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toBeVisible();
    // Title + link (link is interpreted as two elements)
    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toContainText(
      'Toy Story'
    );
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    await page.getByRole('link', { name: 'Monsters Inc.' }).click();
    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toBeVisible();
    // Title + link (link is interpreted as two elements)
    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toContainText(
      'Monsters Inc.'
    );
    await expect(page).toHaveURL(/\/movies\/Monsters%20Inc$/);

    // Go back to Toy Story
    await page.goBack();
    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toBeVisible();
    // Title + link (link is interpreted as two elements)
    await expect(page.getByTestId('tab-movie-details').filter({ visible: true })).toContainText(
      'Toy Story'
    );
    await expect(page).toHaveURL(/\/movies\/Toy%20Story$/);

    // Go back to movies index
    await page.goBack();
    await expect(page.getByTestId('tab-home-index').filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    expect(pageErrors.all).toEqual([]);
  });
});
