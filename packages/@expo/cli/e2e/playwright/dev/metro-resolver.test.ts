import { test, expect } from '@playwright/test';

import { getServerTesterRoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { withTiming } from '../../utils/timing';
import { pageCollectErrors } from '../page';

const projectRoot = getServerTesterRoot();
test.describe('server-tester', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      E2E_ROUTER_WEB_OUTPUT: 'single',
      E2E_ROUTER_ASYNC: 'development',
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
    await expect(page.locator('[data-testid="platform-result"]')).toHaveText('"web"');

    // Ensure no page errors are presented
    expect(pageErrors.all).toEqual([]);
  });
});
