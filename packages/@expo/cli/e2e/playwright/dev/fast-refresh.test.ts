import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { mutateFile, openPageAndEagerlyLoadJS } from '../../utils/hmr';
import { pageCollectErrors } from '../page';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const projectRoot = getRouterE2ERoot();
const inputDir = 'fast-refresh';

const appDir = path.join(projectRoot, '__e2e__', inputDir, 'app');
const tempRoute = '/temp-route.tsx';

test.describe(inputDir, () => {
  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'single',
      E2E_ROUTER_JS_ENGINE: 'hermes',
      E2E_ROUTER_SRC: inputDir,
      E2E_ROUTER_ASYNC: 'development',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      return contents.replace(/ROUTE_VALUE_[\d\w]+/g, 'ROUTE_VALUE');
    });
    // Same for LAYOUT_VALUE
    await mutateFile(layoutFile, (contents) => {
      return contents.replace(/LAYOUT_VALUE_[\d\w]+/g, 'LAYOUT_VALUE');
    });

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/').then((response) => response.text());
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterEach(async () => {
    await expoStart.stopAsync();

    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      return contents.replace(/ROUTE_VALUE_[\d\w]+/g, 'ROUTE_VALUE');
    });
    await mutateFile(layoutFile, (contents) => {
      return contents.replace(/LAYOUT_VALUE_[\d\w]+/g, 'LAYOUT_VALUE');
    });

    if (fs.existsSync(appDir + tempRoute)) {
      await fsPromise.unlink(appDir + tempRoute);
    }
  });

  const targetDirectory = path.join(projectRoot, '__e2e__/fast-refresh/app');
  const indexFile = path.join(targetDirectory, 'index.tsx');
  const layoutFile = path.join(targetDirectory, '_layout.tsx');
  const cssFile = path.join(targetDirectory, 'FastRefresh.module.css');

  test('route updates with fast refresh', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    console.time('Press button');
    // Ensure the initial state is correct
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('0');

    // Trigger a state change by clicking a button, then check if the state is rendered to the screen.
    page.locator('[data-testid="index-increment"]').click();
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    // data-testid="index-text"
    const test = page.locator('[data-testid="index-text"]');
    await expect(test).toHaveText('ROUTE_VALUE');
    console.timeEnd('Press button');

    // Use a changing value to prevent caching.
    const nextValue = 'ROUTE_VALUE_' + Date.now();

    console.time('Mutate file');
    // Ensure `const ROUTE_VALUE = 'ROUTE_VALUE_1';` -> `const ROUTE_VALUE = 'ROUTE_VALUE';` before starting
    await mutateFile(indexFile, (contents) => {
      if (!contents.includes("'ROUTE_VALUE'")) {
        throw new Error(`Expected to find 'ROUTE_VALUE' in the file`);
      }
      console.log('Emulate writing to a file');
      return contents.replace(/ROUTE_VALUE/g, nextValue);
    });
    console.timeEnd('Mutate file');

    console.time('Observe update');
    await waitForFashRefresh();

    // Observe that our change has been rendered to the screen
    await expect(page.locator('[data-testid="index-text"]')).toHaveText(nextValue);

    // Ensure the state is preserved between updates
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');
    console.timeEnd('Observe update');

    expect(pageErrors.all).toEqual([]);
  });

  test('layout updates with fast refresh', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // Ensure the initial state is correct
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('0');
    await expect(page.locator('[data-testid="layout-value"]')).toHaveText('LAYOUT_VALUE');
    await expect(page.locator('[name="expo-nested-layout"]')).toHaveAttribute(
      'content',
      'LAYOUT_VALUE'
    );
    // Trigger a state change by clicking a button, then check if the state is rendered to the screen.
    page.locator('[data-testid="index-increment"]').click();

    const nextValue = 'LAYOUT_VALUE_' + Date.now();

    await mutateFile(layoutFile, (contents) => {
      // Use a unique value to prevent caching
      return contents.replace(/LAYOUT_VALUE/g, nextValue);
    });

    await waitForFashRefresh();

    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="layout-value"]')).toHaveText(nextValue);
    await expect(page.locator('[name="expo-nested-layout"]')).toHaveAttribute('content', nextValue);

    expect(pageErrors.all).toEqual([]);
  });

  test('supports adding new files', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // Ensure the initial state is correct
    await expect(page.locator('[name="expo-nested-layout"]')).toHaveAttribute(
      'content',
      'LAYOUT_VALUE'
    );

    // Ensure the React Navigation Tabs component is visible
    await expect(page.getByRole('tab', { name: '⏷ ⏷ index' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).not.toBeVisible();

    // If the file is added, a new tab should be visible
    await fsPromise.copyFile(appDir + '/index.tsx', appDir + tempRoute);
    await waitForFashRefresh();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('supports renaming files', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // Ensure the initial state is correct
    await expect(page.locator('[name="expo-nested-layout"]')).toHaveAttribute(
      'content',
      'LAYOUT_VALUE'
    );

    // Ensure the React Navigation Tabs component is visible
    await expect(page.getByRole('tab', { name: '⏷ ⏷ index' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).not.toBeVisible();

    // If the file is added, a new tab should be visible
    await fsPromise.copyFile(appDir + '/index.tsx', appDir + tempRoute);
    await waitForFashRefresh();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).toBeVisible();

    await fsPromise.rename(appDir + tempRoute, appDir + '/renamed.tsx');
    await waitForFashRefresh();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ renamed' })).toBeVisible();

    await fsPromise.rename(appDir + '/renamed.tsx', appDir + tempRoute);
    expect(pageErrors.all).toEqual([]);
  });

  test('supports deleting files', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    await fsPromise.copyFile(appDir + '/index.tsx', appDir + tempRoute);

    // Ensure the initial state is correct
    await expect(page.locator('[name="expo-nested-layout"]')).toHaveAttribute(
      'content',
      'LAYOUT_VALUE'
    );

    // Ensure the React Navigation Tabs component is visible
    await expect(page.getByRole('tab', { name: '⏷ ⏷ index' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).toBeVisible();

    // If a file is deleted, the tab should be removed
    await fsPromise.unlink(appDir + tempRoute);
    await waitForFashRefresh();
    await expect(page.getByRole('tab', { name: '⏷ ⏷ temp-route' })).not.toBeVisible();

    expect(pageErrors.all).toEqual([]);
  });

  test('css module updates with fast refresh', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // Ensure the initial state is correct
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('0');

    const moduleLocator = page.locator('[data-testid="css-module"]');
    const containerLocator = page.locator('[data-testid="css-module-container"]');

    // Verify initial style is red
    await expect(moduleLocator).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(containerLocator).toHaveCSS('background-color', 'rgb(136, 136, 136)');

    // Trigger a state change to verify it persists across refreshes
    page.locator('[data-testid="index-increment"]').click();
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    // Update the CSS module: change color from red to blue
    await mutateFile(cssFile, (contents) => {
      if (!contents.includes('color: red')) {
        throw new Error("Expected to find 'color: red' in the CSS file");
      }
      return contents.replace(/color:\s*red;/g, 'color: blue;');
    });

    // Wait for the fast refresh cycle to complete
    await waitForFashRefresh();

    // Ensure the style has updated to blue and state is preserved
    await expect(moduleLocator).toHaveCSS('color', 'rgb(0, 0, 255)');
    await expect(containerLocator).toHaveCSS('background-color', 'rgb(136, 136, 136)');
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    expect(pageErrors.all).toEqual([]);

    // Revert CSS changes to keep tests idempotent
    await mutateFile(cssFile, (contents) => contents.replace(/color:\s*blue;/g, 'color: red;'));
  });

  test('css module className swap updates with fast refresh', async ({ page }) => {
    // Listen for console logs and errors
    const pageErrors = pageCollectErrors(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(expoStart, page);

    // initial assertions
    const moduleLocator = page.locator('[data-testid="css-module"]');
    await expect(moduleLocator).toHaveCSS('color', 'rgb(255, 0, 0)');

    // Increment state to ensure preservation
    page.locator('[data-testid="index-increment"]').click();
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    // Swap the className from styles.test to styles.green in the component file
    await mutateFile(indexFile, (contents) => {
      if (!contents.includes('styles.test')) {
        throw new Error("Expected to find 'styles.test' in index.tsx");
      }
      return contents.replace(/styles\.test/g, 'styles.green');
    });

    // Wait for fast-refresh to complete
    await waitForFashRefresh();

    // Validate color update and state preservation
    await expect(moduleLocator).toHaveCSS('color', 'rgb(0, 128, 0)');
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    expect(pageErrors.all).toEqual([]);

    // Revert the change for test idempotency
    await mutateFile(indexFile, (contents) => contents.replace(/styles\.green/g, 'styles.test'));
  });
});
