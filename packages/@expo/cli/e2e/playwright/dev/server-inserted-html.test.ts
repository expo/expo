import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-server-inserted-html';

test.describe(inputDir, () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.beforeAll('bundle and serve', async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'server-inserted-html',
        E2E_ROUTER_SERVER_RENDERING: 'true',
      },
    });
    console.timeEnd('expo export');

    console.time('expo serve');
    await expoServe.startAsync([inputDir]);
    console.timeEnd('expo serve');
  });
  test.afterAll(async () => {
    await expoServe.stopAsync();
  });

  test('hydrates suspense boundaries from the server-inserted data without refetching', async ({
    page,
  }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    console.time('Open page');
    await page.goto(expoServe.url.href);
    console.timeEnd('Open page');

    console.time('hydrate');
    // Server-rendered suspense content is streamed with the data already applied
    await expect(page.getByTestId('fast-value')).toHaveText('fast-data');
    await expect(page.getByTestId('slow-value')).toHaveText('slow-data');

    // After hydration, the client read the values from the server-inserted scripts
    // instead of fetching them again
    await expect(page.getByTestId('fast-source')).toHaveText('stream');
    await expect(page.getByTestId('slow-source')).toHaveText('stream');
    console.timeEnd('hydrate');

    // The inserted data transport scripts were injected into the streamed HTML
    const insertedData = await page.evaluate('globalThis.__E2E_STREAMED_DATA__');
    expect(insertedData).toEqual(
      expect.arrayContaining([
        ['fast', 'fast-data'],
        ['slow', 'slow-data'],
      ])
    );

    expect(pageErrors.all).toEqual([]);
  });
});
