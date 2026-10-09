import { expect, test } from '@playwright/test';
import klawSync from 'klaw-sync';
import fs from 'node:fs';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();

for (const transformer of ['babel', 'noxcturnal']) {
  test.describe(`server loader tree shaking with ${transformer}`, () => {
    test.describe.configure({ mode: 'serial' });
    const outputDir = `dist-server-loader-tree-shaking-${transformer}`;
    const expoServe = createExpoServe({
      cwd: projectRoot,
      env: { NODE_ENV: 'production', EXPO_USE_STATIC: 'server' },
    });

    test.beforeAll(async () => {
      await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--clear', '--output-dir', outputDir],
        {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'server',
            E2E_ROUTER_SRC: 'server-loader-tree-shaking',
            E2E_ROUTER_ASYNC: 'false',
            E2E_FORCE_BABEL: transformer === 'babel' ? '1' : '0',
            EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH: 'true',
            EXPO_UNSTABLE_TREE_SHAKING: 'true',
            EXPO_USE_METRO_REQUIRE: 'true',
          },
        }
      );
      await expoServe.startAsync([outputDir]);
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('excludes server dependencies and hydrates loader data', async ({ page }) => {
      const clientFiles = klawSync(path.join(projectRoot, outputDir, 'client'), {
        nodir: true,
        filter: (file) => file.path.endsWith('.js'),
        traverseAll: true,
      });
      expect(clientFiles.length).toBeGreaterThan(0);
      for (const file of clientFiles) {
        expect(fs.readFileSync(file.path, 'utf8')).not.toContain(
          'SERVER_LOADER_TREE_SHAKING_SECRET'
        );
      }

      const pageErrors = pageCollectErrors(page);
      await page.goto(expoServe.url.href);
      await expect(page.getByTestId('loader-result')).toHaveText('server loader data');
      await expect(page.getByTestId('count')).toHaveText('0');
      await page.getByRole('button', { name: 'Increment' }).click();
      await expect(page.getByTestId('count')).toHaveText('1');
      expect(pageErrors.all).toEqual([]);
    });
  });
}
