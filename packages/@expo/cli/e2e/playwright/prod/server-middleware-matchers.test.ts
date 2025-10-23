import { test, expect } from '@playwright/test';

import { clearEnv, restoreEnv } from '../../__tests__/export/export-side-effects';
import { getRouterE2ERoot } from '../../__tests__/utils';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { pageCollectErrors } from '../page';

const projectRoot = getRouterE2ERoot();
const inputDir = 'server-middleware-matcher-async';
const outputDir = 'dist-server-middleware-matcher-async-prod';

type MiddlewareMatcherOptions = {
  methods?: string[];
  patterns?: string[];
};

const createProdServer = (opts?: MiddlewareMatcherOptions) => {
  const options = {
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
    },
  };

  if (opts?.methods) {
    // @ts-expect-error TypeScript doesn't know about our custom environment variables.
    options.env['E2E_MIDDLEWARE_MATCHER_METHODS'] = JSON.stringify(opts.methods);
  }

  if (opts?.patterns) {
    // @ts-expect-error TypeScript doesn't know about our custom environment variables.
    options.env['E2E_MIDDLEWARE_MATCHER_PATTERNS'] = JSON.stringify(opts.patterns);
  }

  return createExpoServe(options);
};

test.describe('middleware matchers', () => {
  // Configure this describe block to run serially on a single worker so we don't bundle multiple times to the same on-disk location.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => clearEnv());
  test.afterAll(() => restoreEnv());

  test.beforeAll('bundle for production', async () => {
    console.time('expo export');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputDir], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: inputDir,
        E2E_ROUTER_SERVER_MIDDLEWARE: 'true',
      },
    });
    console.timeEnd('expo export');
  });

  test.describe('pattern matching', () => {
    const expoServe = createProdServer({
      patterns: ['/api', '/posts/[postId]', '/catch-all/[...everything]'],
    });

    test.beforeAll(async () => {
      console.time('expo serve');
      await expoServe.startAsync([outputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('runs middleware when pattern matches an exact route', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await page.goto(new URL('/api', expoServe.url).href);
      expect(response?.status()).toBe(200);
      const json = await response?.json();
      expect(json).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });

    test('runs middleware when pattern matches a named parameter route', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await page.goto(new URL('/posts/1', expoServe.url).href);
      expect(response?.status()).toBe(200);
      const json = await response?.json();
      expect(json).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });

    test('runs middleware when pattern matches a catch-all route', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await page.goto(new URL('/catch-all/everything/1/2/3', expoServe.url).href);
      expect(response?.status()).toBe(200);
      const json = await response?.json();
      expect(json).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });

    test('does not run middleware when pattern does not match', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      await page.goto(new URL('/', expoServe.url).href);
      await expect(page.locator('[data-testid="title"]')).toHaveText('Index');

      expect(pageErrors.all).toEqual([]);
    });
  });

  test.describe('method matching', () => {
    const expoServe = createProdServer({
      methods: ['POST'],
    });

    test.beforeAll(async () => {
      console.time('expo serve');
      await expoServe.startAsync([outputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('runs middleware when method matches', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await expoServe.fetchAsync('/api', {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });

    test('does not run middleware when method does not match', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await page.goto(new URL('/api', expoServe.url).href);
      expect(response?.status()).toBe(200);
      const json = await response?.json();
      expect(json).toEqual({ method: 'get', route: 'api' });

      expect(pageErrors.all).toEqual([]);
    });
  });

  test.describe('combined method and pattern matching', () => {
    const expoServe = createProdServer({
      methods: ['POST'],
      patterns: ['/api'],
    });

    test.beforeAll(async () => {
      console.time('expo serve');
      await expoServe.startAsync([outputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('runs middleware when both method and pattern match', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      const response = await expoServe.fetchAsync('/api', {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });

    test('does not run middleware when only one condition matches', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      // Pattern matches but method doesn't
      const getResponse = await page.goto(new URL('/api', expoServe.url).href);
      expect(getResponse?.status()).toBe(200);
      const getJson = await getResponse?.json();
      expect(getJson).toEqual({ method: 'get', route: 'api' });

      // Method matches but pattern doesn't
      const postResponse = await expoServe.fetchAsync('/data', {
        method: 'POST',
      });
      expect(postResponse.status).toBe(200);
      const postJson = await postResponse.json();
      expect(postJson).toEqual({ method: 'post', route: 'data' });

      expect(pageErrors.all).toEqual([]);
    });
  });

  test.describe('no matchers (should run on all requests)', () => {
    const expoServe = createProdServer();

    test.beforeAll(async () => {
      console.time('expo serve');
      await expoServe.startAsync([outputDir]);
      console.timeEnd('expo serve');
    });

    test.afterAll(async () => {
      await expoServe.stopAsync();
    });

    test('runs middleware on all routes when no matchers defined', async ({ page }) => {
      const pageErrors = pageCollectErrors(page);

      // Test multiple routes to verify middleware runs everywhere
      const rootResponse = await page.goto(new URL('/', expoServe.url).href);
      expect(rootResponse?.status()).toBe(200);
      const rootJson = await rootResponse?.json();
      expect(rootJson).toEqual({ match: true });

      const apiResponse = await page.goto(new URL('/api', expoServe.url).href);
      expect(apiResponse?.status()).toBe(200);
      const apiJson = await apiResponse?.json();
      expect(apiJson).toEqual({ match: true });

      expect(pageErrors.all).toEqual([]);
    });
  });
});
