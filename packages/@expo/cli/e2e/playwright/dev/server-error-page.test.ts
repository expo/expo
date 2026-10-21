import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();

test.describe('server error page', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'server',
      E2E_ROUTER_SRC: 'server-error-page',
      CI: '0',
    },
  });

  test.beforeAll(async () => {
    await expoStart.startAsync();
  });

  test.afterAll(async () => {
    await expoStart.stopAsync();
  });

  test('shows the error overlay when a route throws while loading', async ({ page }) => {
    await page.goto(expoStart.url.href);

    await expect(page.getByText('Server Error')).toBeVisible();
    await expect(
      page.getByText('server-error-page: route module threw while loading', { exact: true })
    ).toBeVisible();
  });
});
