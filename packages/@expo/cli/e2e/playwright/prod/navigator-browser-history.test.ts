import { test, expect, type Page } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

// NOTE: This is the production-mode half of the `navigator-browser-history` suite. It exports the
// fixture with async routes enabled (the web default) for both server-rendered outputs and serves
// the result with `expo serve`. The development-mode half lives in
// `../dev/navigator-browser-history.test.ts` and runs the same fixture with `expo start`. The test
// cases must be kept in sync between the two files by hand.

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'navigator-browser-history';

test.setTimeout(560 * 1000);

/**
 * The server-rendered HTML is interactive only once the client has committed, so wait for the
 * router to write its browser history entry before interacting with the page.
 */
async function waitForClientCommit(page: Page, previousEntryId?: string) {
  await expect
    .poll(() => page.evaluate(() => history.state?.id), { timeout: 120 * 1000 })
    .toEqual(expect.any(String));
  if (previousEntryId) {
    await expect
      .poll(() => page.evaluate(() => history.state?.id), { timeout: 120 * 1000 })
      .not.toBe(previousEntryId);
  }
}

for (const outputMode of ['static', 'server'] as const) {
  test.describe(`${inputDir} in production (${outputMode})`, () => {
    const outputDir = `dist-${inputDir}-${outputMode}-playwright`;
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
          EXPO_USE_STATIC: outputMode,
          E2E_ROUTER_SRC: inputDir,
          E2E_ROUTER_ASYNC: 'true',
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

    const baseUrl = () => expoServe.url.href;

    // Test expo router history by navigating through <Link>,
    // then using the browser back/forward actions
    test('navigator browser history', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(baseUrl());

      // <Stack> in the browser currently works by setting hidden
      // screens to `display: none`, so we could just use 'home-content'
      // for all these checks, but using separate ids in case that
      // behavior changes
      await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');

      // Reloading the same React tree must not reuse an ID stored by the previous page session.
      await waitForClientCommit(page);
      const previousEntryId = await page.evaluate(() => history.state.id);
      await page.reload();
      await expect(page.locator('[data-testid="home-content"]')).toHaveText('/');
      await waitForClientCommit(page, previousEntryId);

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

      await page.goto(baseUrl());
      await waitForClientCommit(page);
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

      const entryId = await page.evaluate(() => history.state.id);
      await page.reload();
      await waitForClientCommit(page, entryId);
      await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');
      await page.goBack();
      await expect(page.locator('[data-testid="details-content"]')).toHaveText('/explore/details');
      await page.goForward();
      await expect(page.locator('[data-testid="final-content"]')).toHaveText('/explore/final');

      expect(pageErrors.all).toEqual([]);
    });

    test('creates one browser entry per push in a batch', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(baseUrl());
      await waitForClientCommit(page);
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
      await page.goto(baseUrl());
      await waitForClientCommit(page);
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
      // The first push creates nested state, but the navigator registers its router only after
      // mounting. Before that commit, the second push replaces the nested state instead of
      // appending to its stack, losing the first destination and its browser history entry.
      // https://linear.app/expo/issue/ENG-26883/fix-state-synchronization-for-unmounted-navigators
      test.fail(
        true,
        'Batched pushes replace nested state until the destination navigator registers its router.'
      );
      const pageErrors = pageCollectErrors(page);
      await page.goto(baseUrl());
      await waitForClientCommit(page);
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

    test('keeps the browser tab title in sync after router and browser back', async ({
      page,
      context,
    }) => {
      const pageErrors = pageCollectErrors(page);
      const session = await context.newCDPSession(page);
      const expectTitle = async (title: string) => {
        await expect(page).toHaveTitle(title);
        // Check Chrome's browser-side target title too: the old workaround addressed a stale
        // tab title even when document.title already contained the correct value.
        await expect
          .poll(async () => (await session.send('Target.getTargetInfo')).targetInfo.title)
          .toBe(title);
      };

      await page.goto(baseUrl());
      await waitForClientCommit(page);
      await page.getByTestId('go-explore').click();
      await expectTitle('/explore');
      await page.getByTestId('go-details').click();
      await expectTitle('/explore/details');
      await page.getByTestId('go-final').click();
      await expectTitle('/explore/final');

      await page.getByTestId('final-back').click();
      await expect(page).toHaveURL(/\/explore\/details$/);
      await expectTitle('/explore/details');
      await page.goForward();
      await expectTitle('/explore/final');
      await page.goBack();
      await expectTitle('/explore/details');
      await page.getByTestId('details-back').click();
      await expect(page).toHaveURL(/\/explore$/);
      await expectTitle('/explore');
      await session.detach();
      expect(pageErrors.all).toEqual([]);
    });

    test('deep links into an anchored stack and goes back to the anchor', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/anchored/details', baseUrl()).href);
      await waitForClientCommit(page);
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

      await page.goto(baseUrl());
      await waitForClientCommit(page);
      await page.locator('[data-testid="go-anchored-details"]').click();
      await expect(page.locator('[data-testid="anchored-details-content"]')).toHaveText(
        '/anchored/details'
      );

      const entryId = await page.evaluate(() => history.state.id);
      await page.reload();
      await waitForClientCommit(page, entryId);
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

      await page.goto(baseUrl());
      await waitForClientCommit(page);
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
}
