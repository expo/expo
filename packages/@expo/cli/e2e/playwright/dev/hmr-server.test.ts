import { test, expect, type Page, type WebSocket } from '@playwright/test';
import path from 'node:path';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoStart } from '../../utils/expo';
import { mutateFile, openPageAndEagerlyLoadJS, raceOrFail } from '../../utils/hmr';
import { pageCollectErrors } from '../page';

const projectRoot = getRouterE2ERoot();
const indexFile = path.join(projectRoot, '__e2e__/server-features/app/index.tsx');
const postsFile = path.join(projectRoot, '__e2e__/server-features/app/posts/[postId].tsx');
const noLoaderFile = path.join(projectRoot, '__e2e__/server-features/app/no-loader.tsx');

const ORIGINAL_LOADER_VALUE = 'root-index';

test.beforeAll(() => clearEnv());
test.afterAll(() => restoreEnv());

const OPEN_PAGE_OPTS = { socketTimeout: 60_000 };

test.describe('server-loader HMR in streaming SSR', () => {
  // NOTE(@hassankhan): Needed to prevent file mutations from leaking into unrelated tests
  test.describe.configure({ mode: 'serial' });

  const expoStart = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'server',
      E2E_ROUTER_SRC: 'server-features',
      E2E_ROUTER_SERVER_LOADERS: 'true',
      E2E_ROUTER_SERVER_RENDERING: 'true',

      // Ensure CI is disabled otherwise the file watcher won't run.
      CI: '0',
    },
  });

  test.beforeEach(async () => {
    await resetAllFixtures();

    console.time('expo start');
    await expoStart.startAsync();
    console.timeEnd('expo start');

    console.time('Eagerly bundled JS');
    await expoStart.fetchBundleAsync('/').then((response) => response.text());
    console.timeEnd('Eagerly bundled JS');
  });
  test.afterEach(async ({ page }) => {
    await page.close();
    await expoStart.stopAsync();
    await resetAllFixtures();
  });

  test('editing a loader updates data without a full reload', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const messages = trackMessageSocket(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(
      expoStart,
      page,
      undefined,
      OPEN_PAGE_OPTS
    );
    expect(messages.socket).toBeDefined();

    await expect(page.locator('[data-testid="loader-result"]')).toContainText(
      ORIGINAL_LOADER_VALUE
    );

    await page.evaluate(() => {
      (window as any).__e2eMarker = 'still-here';
    });

    const loaderRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/_expo/loaders/')) {
        loaderRequests.push(request.url());
      }
    });

    const nextValue = `${ORIGINAL_LOADER_VALUE}-${Date.now()}`;
    await mutateFile(indexFile, (contents) => {
      if (!contents.includes(`'${ORIGINAL_LOADER_VALUE}'`)) {
        throw new Error(`Expected to find '${ORIGINAL_LOADER_VALUE}' in ${indexFile}`);
      }
      return contents.replace(`'${ORIGINAL_LOADER_VALUE}'`, `'${nextValue}'`);
    });

    await Promise.all([waitForLoaderInvalidate(messages.socket!), waitForFashRefresh()]);

    expect(messages.commands).not.toContain('reload');
    const marker = await page.evaluate(() => (window as any).__e2eMarker);
    expect(marker).toBe('still-here');
    expect(loaderRequests.some((url) => url.includes('/_expo/loaders/index'))).toBe(true);
    await expect(page.locator('[data-testid="loader-result"]')).toContainText(nextValue);

    expect(pageErrors.all).toEqual([]);
  });

  test('preserves React component state across a loader edit', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const messages = trackMessageSocket(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(
      expoStart,
      page,
      undefined,
      OPEN_PAGE_OPTS
    );
    expect(messages.socket).toBeDefined();

    await expect(page.locator('[data-testid="loader-result"]')).toContainText(
      ORIGINAL_LOADER_VALUE
    );

    await expect(page.locator('[data-testid="index-count"]')).toHaveText('0');
    await page.locator('[data-testid="index-increment"]').click();
    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    const nextValue = `${ORIGINAL_LOADER_VALUE}-state-${Date.now()}`;
    await mutateFile(indexFile, (contents) =>
      contents.replace(`'${ORIGINAL_LOADER_VALUE}'`, `'${nextValue}'`)
    );

    await Promise.all([waitForLoaderInvalidate(messages.socket!), waitForFashRefresh()]);

    await expect(page.locator('[data-testid="loader-result"]')).toContainText(nextValue);

    await expect(page.locator('[data-testid="index-count"]')).toHaveText('1');

    expect(pageErrors.all).toEqual([]);
  });

  test('two consecutive loader edits both apply', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const messages = trackMessageSocket(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(
      expoStart,
      page,
      undefined,
      OPEN_PAGE_OPTS
    );
    expect(messages.socket).toBeDefined();

    await expect(page.locator('[data-testid="loader-result"]')).toContainText(
      ORIGINAL_LOADER_VALUE
    );

    const firstValue = `${ORIGINAL_LOADER_VALUE}-A-${Date.now()}`;
    await mutateFile(indexFile, (contents) =>
      contents.replace(`'${ORIGINAL_LOADER_VALUE}'`, `'${firstValue}'`)
    );
    await Promise.all([waitForLoaderInvalidate(messages.socket!), waitForFashRefresh()]);
    await expect(page.locator('[data-testid="loader-result"]')).toContainText(firstValue);

    const secondValue = `${ORIGINAL_LOADER_VALUE}-B-${Date.now()}`;
    await mutateFile(indexFile, (contents) =>
      contents.replace(/root-index(?:-[\w\d]+)*/g, secondValue)
    );
    await Promise.all([waitForLoaderInvalidate(messages.socket!), waitForFashRefresh()]);
    await expect(page.locator('[data-testid="loader-result"]')).toContainText(secondValue);

    expect(messages.commands).not.toContain('reload');
    expect(pageErrors.all).toEqual([]);
  });

  test('editing a dynamic route loader propagates to its rendered data', async ({ page }) => {
    const pageErrors = pageCollectErrors(page);
    const messages = trackMessageSocket(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(
      expoStart,
      page,
      undefined,
      OPEN_PAGE_OPTS
    );
    expect(messages.socket).toBeDefined();

    await page.click('a[href="/posts/static-post-1"]');
    await page.waitForSelector('[data-testid="loader-result"]', { timeout: 30_000 });
    await expect(page.locator('[data-testid="loader-result"]')).toContainText('static-post-1');

    const marker = `dynamic-marker-${Date.now()}`;
    await mutateFile(postsFile, (contents) => {
      return contents.replace(
        /return Promise\.resolve\(\{\s*\n(\s*)params,\s*\n\s*\}\);/,
        `return Promise.resolve({\n$1params,\n$1marker: '${marker}',\n  });`
      );
    });

    await Promise.all([waitForLoaderInvalidate(messages.socket!), waitForFashRefresh()]);

    await expect(page.locator('[data-testid="loader-result"]')).toContainText(marker);

    expect(messages.commands).not.toContain('reload');
    expect(pageErrors.all).toEqual([]);
  });

  // NOTE(@hassankhan): The loader HMR path intentionally broadcasts `loader-invalidate` for any
  // filesystem change while at least one loader graph is registered, because Metro's
  // `DeltaCalculator` emits a `change` event globally and we don't yet filter against the
  // per-loader graph.
  //
  // To fix this, we should gate the broadcast on
  // 1. graphs whose route module is confirmed to export a loader
  // 2. a per-graph delta showing actual added/modified/deleted modules
  test.skip('editing a non-loader route does not broadcast `loader-invalidate`', async ({
    page,
  }) => {
    const pageErrors = pageCollectErrors(page);
    const messages = trackMessageSocket(page);

    const { waitForFashRefresh } = await openPageAndEagerlyLoadJS(
      expoStart,
      page,
      new URL('/no-loader', expoStart.url.href).toString(),
      OPEN_PAGE_OPTS
    );
    expect(messages.socket).toBeDefined();

    const editedLabel = `Pathname edited-${Date.now()}`;
    await mutateFile(noLoaderFile, (contents) =>
      contents.replace('label="Pathname"', `label="${editedLabel}"`)
    );

    await waitForFashRefresh();
    await page.waitForTimeout(750);

    expect(messages.commands).not.toContain('loader-invalidate');
    expect(messages.commands).not.toContain('reload');
    expect(pageErrors.all).toEqual([]);
  });
});

const resetIndexLoader = () =>
  mutateFile(indexFile, (contents) =>
    // `*` instead of `?` so the reset strips multi-segment suffixes like `-state-<timestamp>`
    // and `-A-<timestamp>`, not just the single-segment `-<timestamp>` form.
    contents.replace(/root-index(?:-[\w\d]+)*/g, ORIGINAL_LOADER_VALUE)
  );

const resetPostsLoader = () =>
  mutateFile(postsFile, (contents) => contents.replace(/\n\s*marker: '[^']*',?/g, ''));

const resetNoLoaderFile = () =>
  mutateFile(noLoaderFile, (contents) =>
    contents.replace(/label="Pathname(?: edited-[\w\d]+)?"/g, 'label="Pathname"')
  );

const resetAllFixtures = async () => {
  await resetIndexLoader();
  await resetPostsLoader();
  await resetNoLoaderFile();
};

function parseDevCommand(payload: string | Buffer): string | null {
  try {
    const event = JSON.parse(typeof payload === 'string' ? payload : payload.toString());
    if (event.method === 'sendDevCommand' && typeof event.params?.name === 'string') {
      return event.params.name;
    }
  } catch {
    // ignore non-JSON frames
  }
  return null;
}

function trackMessageSocket(page: Page) {
  const state: { socket?: WebSocket; commands: string[] } = { commands: [] };
  page.on('websocket', (ws) => {
    if (!ws.url().endsWith('/message')) return;
    state.socket = ws;
    ws.on('framereceived', ({ payload }) => {
      const name = parseDevCommand(payload);
      if (name) state.commands.push(name);
    });
  });
  return state;
}

function waitForLoaderInvalidate(socket: WebSocket, timeout = 8_000) {
  return raceOrFail(
    socket.waitForEvent('framereceived', {
      predicate: ({ payload }) => parseDevCommand(payload) === 'loader-invalidate',
    }),
    timeout,
    "Did not receive 'loader-invalidate' dev command on /message socket."
  );
}
