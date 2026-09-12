import { expect, test } from '@playwright/test';
import type { RawManifest } from 'expo-server/private';
import fs from 'node:fs/promises';
import path from 'node:path';

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

    test.beforeEach(async ({ page }) => {
      // Exported CSS is shared across routes, so fulfill these imports on the index page too.
      await page.route('https://expo-css.test/*.css', (route) =>
        route.fulfill({
          contentType: 'text/css',
          body: `.cascade-between, .cascade-bundled { color: ${route.request().url().endsWith('/a.css') ? 'red' : 'purple'}; }`,
        })
      );
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

    test('preserves interleaved external and bundled stylesheet cascade order', async ({
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

      const externalIndex = html.indexOf(
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap"'
      );
      const bundledIndex = html.search(
        /<link rel="stylesheet" href="\/_expo\/static\/css\/second-[0-9a-f]{32}\.css"/
      );
      expect(externalIndex).toBeGreaterThanOrEqual(0);
      expect(bundledIndex).toBeGreaterThan(externalIndex);

      const orderedCss = [
        'https://expo-css.test/a.css',
        expect.stringMatching(/^\/_expo\/static\/css\/cascade-a-[0-9a-f]{32}\.css$/),
        'https://expo-css.test/b.css',
        expect.stringMatching(/^\/_expo\/static\/css\/cascade-b-[0-9a-f]{32}\.css$/),
      ];
      const isCascadeAsset = (href: string) =>
        href.startsWith('https://expo-css.test/') || href.includes('/cascade-');
      const hrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
        (match) => match[1]!
      );
      expect(hrefs.filter(isCascadeAsset)).toEqual(orderedCss);

      if (mode.name === 'server') {
        const manifest: RawManifest = JSON.parse(
          await fs.readFile(
            path.join(projectRoot, mode.outputDir, 'server/_expo/routes.json'),
            'utf8'
          )
        );
        expect(manifest.assets?.externalCss).toBeUndefined();
        expect(
          manifest.assets?.css
            .filter((asset) => typeof asset !== 'string' && asset.type !== 'inline')
            .map((asset) => (typeof asset !== 'string' && 'href' in asset ? asset.href : ''))
            .filter(isCascadeAsset)
        ).toEqual(orderedCss);
      }

      await expect(page.getByTestId('cascade-between')).toHaveCSS('color', 'rgb(128, 0, 128)');
      await expect(page.getByTestId('cascade-bundled')).toHaveCSS('color', 'rgb(0, 128, 0)');
    });
  });
}
