/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml } from '../utils';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START, RUNTIME_WORKERD], {
    fixtureName: 'server-loader',
    export: {
      env: {
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        E2E_ROUTER_SERVER_RENDERING: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
    serve: {
      env: {
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
  })
)('server loader - $name', (config) => {
  const server = setupServer(config);

  (server.isExpoStart ? it.skip : it)('has expected files', async () => {
    const files = findProjectFiles(path.join(server.outputDir, 'server'));

    // SSR mode should have `server/` directory with render module
    expect(files).toContain('_expo/server/render.js');
    expect(files).toContain('_expo/routes.json');

    // HTML routes should NOT be pre-rendered in SSR mode
    expect(files).not.toContain('index.html');
    expect(files).not.toContain('second.html');
    expect(files).not.toContain('posts/[postId].html');
    expect(files).not.toContain('posts/static-post-1.html');
    expect(files).not.toContain('posts/static-post-2.html');

    // Loader bundles should exist
    expect(files).toContain('_expo/loaders/env.js');
    expect(files).toContain('_expo/loaders/second.js');
    expect(files).toContain('_expo/loaders/posts/[postId].js');
    expect(files).toContain('_expo/loaders/nullish/[value].js');
  });

  (server.isExpoStart ? it.skip : it)('routes.json has loader paths', async () => {
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
    );

    const envRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/env');
    const secondRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/second');
    const postRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/posts/[postId]');
    const indexRoute = routesJson.htmlRoutes.find((r: any) => r.page === '/index');

    // Routes with loaders should have loader property
    expect(envRoute?.loader).toBe('_expo/loaders/env.js');
    expect(secondRoute?.loader).toBe('_expo/loaders/second.js');
    expect(postRoute?.loader).toBe('_expo/loaders/posts/[postId].js');

    // Route without loader should not have loader property
    expect(indexRoute?.loader).toBeUndefined();
  });

  it('loader endpoint returns JSON', async () => {
    const response = await server.fetchAsync('/_expo/loaders/second');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('loader endpoint returns JSON with params for dynamic route', async () => {
    const response = await server.fetchAsync('/_expo/loaders/posts/my-test-post');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data.params).toHaveProperty('postId', 'my-test-post');
  });

  it('loader can access server environment variables', async () => {
    const response = await server.fetchAsync('/_expo/loaders/env');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
  });

  it('returns `{}` for `undefined` loader data', async () => {
    const response = await server.fetchAsync('/_expo/loaders/nullish/undefined');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({});
  });

  it('returns `null` for `null` loader data', async () => {
    const response = await server.fetchAsync('/_expo/loaders/nullish/null');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeNull();
  });

  it.each([
    {
      name: 'loader endpoint',
      url: '/_expo/loaders/request',
      getData: (response: Response) => {
        return response.json();
      },
    },
    {
      name: 'page',
      url: '/request',
      getData: async (response: Response) => {
        const html = getHtml(await response.text());
        return JSON.parse(html.querySelector('[data-testid="loader-result"]')!.textContent);
      },
    },
  ])('$name $url does not receive `Request` object', async ({ getData, url }) => {
    const response = await server.fetchAsync(url);
    expect(response.status).toBe(200);
    const data = await getData(response);

    expect(new URL(data.url).pathname).toBe('/request');
    expect(data.method).toBe('GET');
    expect(Array.isArray(data.headers)).toBe(true);
  });

  it.each([
    {
      name: 'page',
      url: '/request?foo=bar',
      getData: async (response: Response) => {
        const html = getHtml(await response.text());
        return JSON.parse(html.querySelector('[data-testid="loader-result"]')!.textContent);
      },
    },
    {
      name: 'loader endpoint',
      url: '/_expo/loaders/request?foo=bar',
      getData: (response: Response) => {
        return response.json();
      },
    },
  ])('$name $url receives search params', async ({ getData, url }) => {
    const response = await server.fetchAsync(url);
    expect(response.status).toBe(200);
    const data = await getData(response);

    expect(data.url).toContain('/request?foo=bar');
    expect(data.method).toBe('GET');
    expect(Array.isArray(data.headers)).toBe(true);
  });
});
