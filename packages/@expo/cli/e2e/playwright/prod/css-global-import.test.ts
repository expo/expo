import { expect, test } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();

const MODES = [
  {
    name: 'static',
    outputDir: 'dist-css-global-import-static',
    exportEnv: { EXPO_USE_STATIC: 'static' },
  },
  {
    name: 'server',
    outputDir: 'dist-css-global-import-server',
    exportEnv: { EXPO_USE_STATIC: 'server', E2E_ROUTER_SERVER_RENDERING: 'true' },
  },
] as const;

for (const mode of MODES) {
  test.describe(`css-global-import (${mode.name})`, () => {
    const expoServe = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    test.beforeAll(async () => {
      console.time(`expo export (${mode.name})`);
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', mode.outputDir], {
        env: {
          NODE_ENV: 'production',
          E2E_ROUTER_SRC: 'css-global-import',
          ...mode.exportEnv,
        },
      });
      console.timeEnd(`expo export (${mode.name})`);

      console.time(`expo serve (${mode.name})`);
      await expoServe.startAsync([mode.outputDir]);
      console.timeEnd(`expo serve (${mode.name})`);
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    // Ensures the bundled (local) CSS still loads and the page hydrates cleanly.
    test('loads the index route without hydration errors and applies bundled CSS', async ({
      page,
    }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(expoServe.url.href);
      await page.waitForSelector('[data-testid="index-text"]');

      const indexText = await page.$('[data-testid="index-text"]');
      expect(indexText).not.toBeNull();
      expect(await indexText?.evaluate((node) => getComputedStyle(node).color)).toBe(
        'rgb(0, 0, 255)'
      );

      const betaText = await page.$('[data-testid="beta-text"]');
      expect(betaText).not.toBeNull();
      expect(await betaText?.evaluate((node) => getComputedStyle(node).color)).toBe(
        'rgb(255, 0, 0)'
      );

      expect(pageErrors.all).toEqual([]);
    });

    test('includes external stylesheet `<link>`s for a route that imports them', async ({
      page,
    }) => {
      const response = await page.goto(new URL('/second', expoServe.url).href);
      const html = (await response?.text()) ?? '';

      expect(html).toContain(
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap"'
      );

      expect(html).toMatch(
        /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Roboto:wght@300" media="screen and \(width (?:>|&gt;)= 900px\)"/
      );
    });
  });
}
