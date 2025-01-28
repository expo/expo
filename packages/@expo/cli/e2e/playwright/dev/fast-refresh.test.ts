import { test, Page, WebSocket, expect } from '@playwright/test';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
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

    await fsPromise.unlink(appDir + tempRoute);
  });

  const targetDirectory = path.join(projectRoot, '__e2e__/fast-refresh/app');
  const indexFile = path.join(targetDirectory, 'index.tsx');
  const layoutFile = path.join(targetDirectory, '_layout.tsx');

  const mutateFile = async (file: string, mutator: (contents: string) => string) => {
    const indexContents = await fs.promises.readFile(file, 'utf8');
    await fs.promises.writeFile(file, mutator(indexContents), 'utf8');
  };

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
});

function makeHotPredicate(predicate: (data: Record<string, any>) => boolean) {
  return ({ payload }: { payload: string | Buffer }) => {
    const event = JSON.parse(typeof payload === 'string' ? payload : payload.toString());
    return predicate(event);
  };
}

async function openPageAndEagerlyLoadJS(
  expo: ReturnType<typeof createExpoStart>,
  page: Page,
  url?: string
) {
  // Keep track of the `/message` socket, which is used to control the device programatically
  const messageSocketPromise = page.waitForEvent('websocket', (ws) =>
    ws.url().endsWith('/message')
  );
  // Keep track of the `/hot` socket, which is used for HMR - and validate HMR fully initializes
  const hotSocketPromise = page
    .waitForEvent('websocket', (ws) => ws.url().endsWith('/hot'))
    .then((ws) => waitForHmrRegistration(ws));

  // Navigate to the page
  console.time('Open page');
  await page.goto(url || expo.url.href);
  console.timeEnd('Open page');

  // Ensure the sockets are registered
  const [hotSocket] = await Promise.all([
    raceOrFail(hotSocketPromise, 500, 'HMR on client took too long to connect.'),
    raceOrFail(messageSocketPromise, 500, 'Message socket on client took too long to connect.'),
  ]);

  return {
    waitForFashRefresh: () => waitForFashRefresh(hotSocket),
  };
}

async function waitForHmrRegistration(ws: WebSocket): Promise<WebSocket> {
  // Ensure the entry point is registered
  await ws.waitForEvent('framesent', {
    predicate: makeHotPredicate(
      (event) => event.type === 'register-entrypoints' && !!event.entryPoints.length
    ),
  });

  // Observe the handshake with Metro
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => event.type === 'bundle-registered'),
  });

  return ws;
}

async function waitForFashRefresh(ws: WebSocket): Promise<WebSocket> {
  // Metro begins the HMR process
  await raceOrFail(
    ws.waitForEvent('framereceived', {
      predicate: makeHotPredicate((event) => {
        return event.type === 'update-start';
      }),
    }),
    1000,
    'Metro took too long to detect the file change and start the HMR process.'
  );

  // Metro sends the HMR mutation
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => {
      return event.type === 'update' && !!event.body.modified.length;
    }),
  });

  // Metro completes the HMR update
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => {
      return event.type === 'update-done';
    }),
  });

  return ws;
}

function raceOrFail<T>(promise: Promise<T>, timeout: number, message: string) {
  return Promise.race<T>([
    // Wrap promise with profile logging
    (async () => {
      const start = Date.now();
      const value = await promise;
      const end = Date.now();
      console.log('Resolved:', end - start + 'ms');
      return value;
    })(),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Test was too slow (${timeout}ms): ${message}`));
      }, timeout);
    }),
  ]);
}
