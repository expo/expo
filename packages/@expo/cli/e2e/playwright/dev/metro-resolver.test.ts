import { test, expect } from '@playwright/test';

import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { withTiming } from '../../utils/timing';
import { pageCollectErrors } from '../page';

const projectRoot = getRouterE2ERoot();
const inputDir = 'static-rendering';

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',
      // Explicitly turn off Expo fast resolver to test Metro's default resolver
      EXPO_USE_FAST_RESOLVER: 'false',
      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    await withTiming('expo start', () => expoStart.startAsync());
    await withTiming('eagerly bundle js', () => expoStart.fetchBundleAsync('/'));
  });
  test.afterEach(async () => {
    await expoStart.stopAsync();
  });

  test('metro resolver bundles the project', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    // Open the main page
    await withTiming('Open page', () => page.goto(expoStart.url.href));

    // Ensure the page is fully loaded
    await expect(page.locator('[data-testid="index-text"]')).toHaveText('Index');

    // Ensure no page errors are presented
    expect(pageErrors.all).toEqual([]);
  });
});
