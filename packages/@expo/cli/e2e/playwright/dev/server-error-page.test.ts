import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getServerTesterRoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getServerTesterRoot();

test.describe('server error page', () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      E2E_ROUTER_WEB_OUTPUT: 'server',
      E2E_ROUTER_THROW_ON_LOAD: 'true',
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
    await page.goto(new URL('/errors/throw-on-load', expoStart.url).href);

    await expect(page.getByText('Server Error')).toBeVisible();
    await expect(
      page.getByText('server-tester: route module threw while loading', { exact: true })
    ).toBeVisible();
  });
});
