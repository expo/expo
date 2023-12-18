import { test, expect } from '@playwright/test';
import execa from 'execa';
import path from 'path';

import { clearEnv, restoreEnv } from '../export/export-side-effects';
import { bin, getRouterE2ERoot, getPlaywrightTest } from '../utils';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'static-rendering';
const outputName = 'dist-static-splitting';
const outputDir = path.join(projectRoot, outputName);

test.beforeAll(async () => {
  // Could take 45s depending on how fast the bundler resolves
  test.setTimeout(560 * 1000);
  await execa('node', [bin, 'export', '-p', 'web', '--clear', '--output-dir', outputName], {
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });
});

test.describe(inputDir, () => {
  const test = getPlaywrightTest(outputDir, {
    single: true,
  });

  test('exports', async ({ page }) => {
    await page.goto('/');
    const homeText = page.locator('[data-testid=index-text]');
    await expect(homeText).toHaveCSS('font-family', 'sweet');

    await page.goto('/about');
    const aboutText = page.locator('[data-testid=content]');
    await expect(aboutText).toHaveText('About');
  });
});
