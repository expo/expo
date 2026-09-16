import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

test.setTimeout(560 * 1000);

test.describe(inputDir, () => {
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

  test.beforeEach(async () => {
    await expoStart.startAsync();
    await expoStart.fetchBundleAsync('/');
  });

  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  // Test expo router history by navigating through <Link>,
  // then using the browser back/forward actions
  test('navigator browser history', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(`${expoStart.url}`);

    // <Stack> in the browser currently works by setting hidden
    // screens to `display: none`, so we could just use 'home-content'
    // for all these checks, but using separate ids in case that
    // behavior changes
    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.locator('[data-testid="go-explore"]').click();

    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');

    await page.goBack();

    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.goForward();

    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');

    expect(pageErrors.all).toEqual([]);
  });

  test('rapid history traverses nested state', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(`${expoStart.url}`);
    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.locator('[data-testid="go-explore"]').click();
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');
    await page.locator('[data-testid="go-details"]').click();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.locator('[data-testid="go-final"]').click();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');

    await page.evaluate(() => {
      // Wait for the first traversal before starting the second; browsers may collapse synchronous calls.
      addEventListener('popstate', () => history.back(), { once: true });
      history.back();
    });
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');

    await page.evaluate(() => {
      // Chain the second traversal from `popstate` while the router is still processing the first.
      addEventListener('popstate', () => history.forward(), { once: true });
      history.forward();
    });
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');

    await page.reload();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await page.goBack();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.goForward();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');

    expect(pageErrors.all).toEqual([]);
  });

  test('creates one browser entry per push in a batch', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(`${expoStart.url}`);
    await page.locator('[data-testid="go-explore"]').click();
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');

    await page.locator('[data-testid="push-details-and-final"]').click();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');

    await page.goBack();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await expect(page).toHaveURL(/\/explore\/details$/);

    await page.goBack();
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');
    await expect(page).toHaveURL(/\/explore$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('keeps router.back aligned with browser back after batched nested pushes', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(`${expoStart.url}`);
    await page.locator('[data-testid="go-explore"]').click();
    await expect(page).toHaveURL(/\/explore$/);
    const initialLength = await page.evaluate(() => history.length);
    await page.locator('[data-testid="push-details-and-final"]').click();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await expect.poll(() => page.evaluate(() => history.length)).toBe(initialLength + 2);

    await page.locator('[data-testid="final-back"]').click();
    await expect(page).toHaveURL(/\/explore\/details$/);
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.goForward();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await page.goBack();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.locator('[data-testid="details-back"]').click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');
    await page.goForward();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.goBack();
    await expect(page.locator('[data-testid="explore-content"]')).toHaveText('/explore');
    expect(pageErrors.all).toEqual([]);
  });

  test('creates two visits when batched pushes open a previously unmounted tab stack', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    await page.goto(`${expoStart.url}`);
    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');
    const initialLength = await page.evaluate(() => history.length);
    await page.locator('[data-testid="push-unmounted-details-and-final"]').click();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await expect.poll(() => page.evaluate(() => history.length)).toBe(initialLength + 2);
    await page.goBack();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await page.goForward();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await page.locator('[data-testid="final-back"]').click();
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    expect(pageErrors.all).toEqual([]);
  });

  test('deep links into an anchored stack and goes back to the anchor', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(new URL('/anchored/details', expoStart.url).href);
    await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
      '/anchored/details'
    );

    // The anchor sits below the deep-linked screen, so in-app back reaches it.
    await page.locator('[data-testid="anchored-back"]').click();
    await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
    await expect(page).toHaveURL(/\/anchored$/);

    await page.locator('[data-testid="go-anchored-details"]').click();
    await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
      '/anchored/details'
    );

    await page.goBack();
    await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
    await expect(page).toHaveURL(/\/anchored$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('keeps the anchor below the screen after a reload', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(`${expoStart.url}`);
    await page.locator('[data-testid="go-anchored-details"]').click();
    await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
      '/anchored/details'
    );

    await page.reload();
    await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
      '/anchored/details'
    );

    await page.locator('[data-testid="anchored-back"]').click();
    await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
    await expect(page).toHaveURL(/\/anchored$/);

    // The entry from before the reload is still the previous browser entry.
    await page.goBack();
    await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

    await page.goForward();
    await expect(page.locator('[data-testid="anchored-content"]')).toHaveText('/anchored');
    await expect(page).toHaveURL(/\/anchored$/);

    expect(pageErrors.all).toEqual([]);
  });

  test('restores a nested tab stack without remounting', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);

    await page.goto(`${expoStart.url}`);
    await page.locator('[data-testid="go-explore"]').click();
    await page.locator('[data-testid="go-details"]').click();
    await page.locator('[data-testid="increment-details"]').click();
    await expect(page.locator('[data-testid="details-count"]')).toHaveText('1');

    await page.locator('[data-testid="go-final"]').click();
    await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
    await page.goBack();
    await expect(page).toHaveURL(/\/explore\/details$/);
    await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
    await expect(page.locator('[data-testid="details-count"]')).toHaveText('1');

    expect(pageErrors.all).toEqual([]);
  });
});
