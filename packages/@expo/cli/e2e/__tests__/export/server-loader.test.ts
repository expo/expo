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
import { findProjectFiles, getPageAndLoaderData } from '../utils';

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
        TEST_SECRET_RUNTIME_KEY: 'runtime-secret-value',
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
    expect(files).not.toContain('env.html');
    expect(files).not.toContain('index.html');
    expect(files).not.toContain('request.html');
    expect(files).not.toContain('response.html');
    expect(files).not.toContain('second.html');
    expect(files).not.toContain('nullish/[value].html');
    expect(files).not.toContain('nullish/null.html');
    expect(files).not.toContain('nullish/undefined.html');
    expect(files).not.toContain('posts/[postId].html');
    expect(files).not.toContain('posts/static-post-1.html');
    expect(files).not.toContain('posts/static-post-2.html');

    // Loader bundles should exist
    expect(files).toContain('_expo/loaders/env.js');
    expect(files).toContain('_expo/loaders/request.js');
    expect(files).toContain('_expo/loaders/response.js');
    expect(files).toContain('_expo/loaders/second.js');
    expect(files).toContain('_expo/loaders/nullish/[value].js');
    expect(files).toContain('_expo/loaders/posts/[postId].js');
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

  it('returns 404 for loader endpoint when route has no loader', async () => {
    const response = await server.fetchAsync('/_expo/loaders/index');
    expect(response.status).toBe(404);
  });

  it('returns 404 for loader endpoint when route does not exist', async () => {
    const response = await server.fetchAsync('/_expo/loaders/nonexistent');
    expect(response.status).toBe(404);
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

  (server.isExpoStart ? it.skip : it)(
    'loader can access server environment variables',
    async () => {
      const response = await server.fetchAsync('/_expo/loaders/env');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).not.toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
      expect(data).toHaveProperty('TEST_SECRET_RUNTIME_KEY', 'runtime-secret-value');
    }
  );

  it('loader endpoint returns `Response` with headers', async () => {
    const response = await server.fetchAsync('/_expo/loaders/response');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(response.headers.get('x-custom-header')).toBe('set-via-response');

    const data = await response.json();
    expect(data).toEqual({ foo: 'bar' });
  });

  it.each(getPageAndLoaderData('/nullish/undefined'))(
    'returns `null` for `undefined` loader data for $url ($name)',
    async ({ getData, name, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      // NOTE(@hassankhan): For HTML pages, the fixture component converts `null` to the
      // string `NULL` for display (see `nullish/[value].tsx`). The loader endpoint
      // returns the raw `null` value.
      if (name === 'page') {
        expect(data).toEqual('NULL');
      } else {
        expect(data).toBeNull();
      }
    }
  );

  it.each(getPageAndLoaderData('/nullish/null'))(
    'returns `null` for `null` loader data for $url ($name)',
    async ({ getData, name, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      // NOTE(@hassankhan): For HTML pages, the fixture component converts `null` to the
      // string `NULL` for display (see `nullish/[value].tsx`). The loader endpoint
      // returns the raw `null` value.
      if (name === 'page') {
        expect(data).toEqual('NULL');
      } else {
        expect(data).toBeNull();
      }
    }
  );

  it.each(getPageAndLoaderData('/request'))(
    'receives `Request` object for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(new URL(data.url).pathname).toBe('/request');
      expect(data.method).toBe('GET');
      expect(Array.isArray(data.headers)).toBe(true);
    }
  );

  it.each(getPageAndLoaderData('/request?foo=bar'))(
    '$name $url receives search params',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.url).toContain('/request?foo=bar');
      expect(data.method).toBe('GET');
      expect(Array.isArray(data.headers)).toBe(true);
    }
  );

  it.each(getPageAndLoaderData('/request?immutable=true'))(
    'request is immutable for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.immutable).toBe(true);
      expect(data.error).toContain('This operation is not allowed');
    }
  );

  it('sets custom headers on response using `setResponseHeaders()`', async () => {
    const response = await server.fetchAsync('/_expo/loaders/response?setresponseheaders=true');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response.headers.get('X-Custom-Header')).toBe('set-via-setResponseHeaders');

    const data = await response.json();
    expect(data).toEqual({ foo: 'bar' });
  });
});
