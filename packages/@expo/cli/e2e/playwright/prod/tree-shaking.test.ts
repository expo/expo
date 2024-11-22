import { expect, test } from '@playwright/test';
import execa from 'execa';
import fs from 'fs';
import path from 'path';
import klawSync from 'klaw-sync';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { bin, ServeStaticCommand } from '../../utils/command-instance';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'dist-tree-shaking';

test.describe(inputDir, () => {
  test.beforeAll(async () => {
    // Could take 45s depending on how fast the bundler resolves
    test.setTimeout(560 * 1000);
  });

  let serveCmd: ServeStaticCommand;

  test.beforeEach('bundle and serve', async () => {
    console.time('expo export');
    await execa('node', [bin, 'export', '-p', 'web', '--output-dir', inputDir], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'tree-shaking',
        EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH: 'true',
        EXPO_UNSTABLE_TREE_SHAKING: 'true',
        EXPO_USE_METRO_REQUIRE: 'true',
      },
    });
    console.timeEnd('expo export');

    serveCmd = new ServeStaticCommand(projectRoot, {
      NODE_ENV: 'production',
    });
  });

  // This test generally ensures no errors are thrown during an export loading.
  test('loads without hydration errors', async ({ page }) => {
    // Ensure the JS code has string module IDs
    const jsFile = klawSync(path.join(projectRoot, inputDir, '_expo/static/js'), {
      nodir: true,
    });

    const largest = [...jsFile].sort((a, b) => b.stats.size - a.stats.size)[0].path;
    const largestFile = fs.readFileSync(largest, 'utf8');

    // Sanity
    expect(largestFile).toMatch(/__r\("packages\/expo-router\/entry.js"\);/);
    // This icon has been removed.
    expect(largestFile).not.toMatch(/test-icon-apple/);
    // This icon remains.
    expect(largestFile).toMatch(/test-icon-banana/);

    largestFile.split('\n').forEach((line, i) => {
      if (line.startsWith('__d(')) {
        const contents = line.match(/__d\(\(function\([^)]+\){(.*)}\),"/)?.[1];
        // Multi-line comments are skipped.
        if (!contents) return;
        // Ensure no empty modules are included
        if (contents!.length < 5) {
          console.log(contents);
          throw new Error(`Module is empty: ${line} at line ${i}`);
        }
      }
    });

    console.time('npx serve');
    await serveCmd.startAsync([inputDir]);
    console.timeEnd('npx serve');
    console.log('Server running:', serveCmd.url);

    console.time('Open page');
    // Navigate to the app
    await page.goto(serveCmd.url);

    console.timeEnd('Open page');

    // Listen for console errors
    const errorLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    // Listen for uncaught exceptions and console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait for the app to load
    await page.waitForSelector('[data-testid="async-chunk"]');
    await page.waitForSelector('[data-testid="test-icon-banana"]');
    // await page.waitForSelector('[data-testid="optional-existing"]');

    expect(errorLogs).toEqual([]);
    expect(errors).toEqual([]);
  });
});
