import { test, expect } from '@playwright/test';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { pageCollectErrors } from '../page';
import { mutateFile, openPageAndEagerlyLoadJS } from '../../utils/hmr';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const testName = 'web-workers';
const inputDir = 'dist-' + testName;

test.describe(inputDir, () => {
  test.describe.configure({ mode: 'serial' });
  const targetDirectory = path.join(projectRoot, `__e2e__/${testName}/app`);
  const indexFile = path.join(targetDirectory, 'index.tsx');

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: testName,
      E2E_ROUTER_ASYNC: 'development',
      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach('bundle and serve', async () => {
    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      return contents.replace(/ROUTE_VALUE_[\d\w]+/g, 'ROUTE_VALUE');
    });

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/');
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterEach(async () => {
    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      return contents.replace(/ROUTE_VALUE_[\d\w]+/g, 'ROUTE_VALUE');
    });

    await expoStart.stopAsync();
  });

  // This test is needed because the HMR serializer is different to the main serializer and we inject webworker-specific code in the serializer.
  test('support HMR with web workers', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);
    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    console.time('button');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="test-anchor"]');
    console.timeEnd('button');

    // Click the button
    await page.click('[data-testid="test-anchor"]');

    expect(await page.textContent('[data-testid="data-1"]')).toBe('20');

    const nextValue = 'ROUTE_VALUE_' + Math.random().toString(36).substring(7);
    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      if (!contents.includes("'ROUTE_VALUE'")) {
        throw new Error(`Expected to find 'ROUTE_VALUE' in the file`);
      }
      console.log('Emulate writing to a file');
      return contents.replace(/ROUTE_VALUE/g, nextValue);
    });

    await waitForFashRefresh();

    // Click the button
    await page.click('[data-testid="test-anchor"]');

    expect(await page.textContent('[data-testid="data-2"]')).toBe('20');

    expect(pageErrors.all.length).toEqual(0);
  });
});
