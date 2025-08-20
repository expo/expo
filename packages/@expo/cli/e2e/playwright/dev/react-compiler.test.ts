import { expect, test } from '@playwright/test';
import klawSync from 'klaw-sync';
import fs from 'node:fs';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';
import { assert } from 'node:console';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const baseDir = 'dist-react-compiler';

test.describe(baseDir, () => {
  const expoServe = createExpoServe({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  });

  test.describe('default', () => {
    const inputDir = 'dist-react-compiler-default';

    test.beforeEach('bundle and serve', async () => {
      console.time('expo export');
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', inputDir], {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'compiler',
          E2E_ROUTER_COMPILER: 'true',
        },
      });
      console.timeEnd('expo export');

      console.time('npx serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('npx serve');
    });
    test.afterEach(async () => {
      await expoServe.stopAsync();
    });

    test('bundle contains live bindings', async () => {
      const jsFiles = klawSync(path.join(projectRoot, inputDir, '_expo/static/js'), {
        nodir: true,
      });
      const bundleFile = jsFiles[0]?.path;

      // Sanity check
      assert(jsFiles.length === 1, 'This test expects a single JS bundle file to be generated.');
      assert(bundleFile, 'No JS bundle file found.');

      const bundleContent = fs.readFileSync(bundleFile, 'utf8');

      // The useBananas code which otherwise causes the app to crash uses live bindings.
      expect(bundleContent).toContain(
        'Object.defineProperty(e,"useBananas",{enumerable:!0,get:function(){return n.useBananas}})'
      );
    });

    // This test generally ensures no errors are thrown during an export loading.
    test('loads compiler', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      // Navigate to the app
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      console.time('hydrate');
      // Wait for the app to load
      await expect(page.locator('[data-testid="react-compiler"]')).toHaveText('2');
      console.timeEnd('hydrate');

      expect(pageErrors.all).toEqual([]);
    });
  });

  test.describe('without live bindings', () => {
    const inputDir = 'dist-react-compiler-no-live-bindings';

    test.beforeEach('bundle and serve', async () => {
      console.time('expo export');
      const res = await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--output-dir', inputDir],
        {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_SRC: 'compiler',
            E2E_ROUTER_COMPILER: 'true',
            EXPO_UNSTABLE_LIVE_BINDINGS: 'false',
          },
        }
      );
      console.timeEnd('expo export');

      console.log('expo export result:', res.stdout, res.stderr);

      console.time('npx serve');
      await expoServe.startAsync([inputDir]);
      console.timeEnd('npx serve');
    });
    test.afterEach(async () => {
      await expoServe.stopAsync();
    });

    test('bundle does not have live bindings', async () => {
      const jsFiles = klawSync(path.join(projectRoot, inputDir, '_expo/static/js'), {
        nodir: true,
      });
      const bundleFile = jsFiles[0]?.path;

      // Sanity check
      assert(jsFiles.length === 1, 'This test expects a single JS bundle file to be generated.');
      assert(bundleFile, 'No JS bundle file found.');

      const bundleContent = fs.readFileSync(bundleFile, 'utf8');

      // The useBananas code which causes the application to crash uses static bindings.
      expect(bundleContent).not.toContain(
        'Object.defineProperty(e,"useBananas",{enumerable:!0,get:function(){return n.useBananas}})'
      );
      expect(bundleContent).toContain('e.useBananas=function()');
    });

    // This test generally ensures no errors are thrown during an export loading.
    test('fails to load', async ({ page }) => {
      // Listen for console logs and errors
      const pageErrors = pageCollectErrors(page);

      console.time('Open page');
      // Navigate to the app
      await page.goto(expoServe.url.href);
      console.timeEnd('Open page');

      // Check for errors up to 4 times
      for (let i = 0; i < 4; i++) {
        if (pageErrors.errors.length > 0) {
          break;
        }
        console.log(`Waiting for errors, attempt ${i + 1}/4`);
        await page.waitForTimeout(500);
      }

      expect(pageErrors.errors).toContainEqual(new Error('Prefix is not defined.'));
    });
  });
});
