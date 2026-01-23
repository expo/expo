/* eslint-env jest */
import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getPageAndLoaderData } from '../utils';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START], {
    fixtureName: 'server-loader',
    uniqueOutputKey: 'static',
    export: {
      env: {
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    },
    serve: {
      env: {
        TEST_SECRET_RUNTIME_KEY: 'runtime-secret-value',
      },
    },
  })
)('static loader - $name', (config) => {
  const server = setupServer(config);

  (server.isExpoStart ? it.skip : it)('has expected files', async () => {
    const files = findProjectFiles(server.outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // HTML routes should be pre-rendered in SSR mode
    expect(files).toContain('env.html');
    expect(files).toContain('index.html');
    expect(files).toContain('request.html');
    expect(files).toContain('response.html');
    expect(files).toContain('second.html');
    expect(files).toContain('nullish/[value].html');
    expect(files).toContain('nullish/null.html');
    expect(files).toContain('nullish/undefined.html');
    expect(files).toContain('posts/[postId].html');
    expect(files).toContain('posts/static-post-1.html');
    expect(files).toContain('posts/static-post-2.html');

    // Loader outputs are pre-generated JSON files
    expect(files).toContain('_expo/loaders/env');
    expect(files).toContain('_expo/loaders/request');
    expect(files).toContain('_expo/loaders/response');
    expect(files).toContain('_expo/loaders/second');
    expect(files).toContain('_expo/loaders/nullish/[value]');
    expect(files).toContain('_expo/loaders/nullish/null');
    expect(files).toContain('_expo/loaders/nullish/undefined');
    expect(files).toContain('_expo/loaders/posts/[postId]');
    expect(files).toContain('_expo/loaders/posts/static-post-1');
    expect(files).toContain('_expo/loaders/posts/static-post-2');
  });

  it('returns 404 for loader endpoint when route has no loader', async () => {
    const response = await server.fetchAsync('/_expo/loaders/index');
    expect(response.status).toBe(404);
  });

  it('returns 404 for loader endpoint when route does not exist', async () => {
    const response = await server.fetchAsync('/_expo/loaders/nonexistent');
    expect(response.status).toBe(404);
  });

  it.each(getPageAndLoaderData('/second'))(
    'can access data for $url ($name)',
    async ({ getData, name, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      if (name === 'loader') {
        // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
        // but the content is still valid JSON.
        // expect(response.headers.get('content-type')).toContain('application/json');
        // expect(response.headers.get('content-type')).toContain('application/json');
      }

      const data = await getData(response);
      expect(data).toEqual({ data: 'second' });
    }
  );

  it.each(getPageAndLoaderData('/posts/static-post-1'))(
    'can access data with dynamic params for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.params).toHaveProperty('postId', 'static-post-1');
    }
  );

  (server.isExpoStart ? it.skip : it).each(getPageAndLoaderData('/env'))(
    'can access server environment variables for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data).toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
      expect(data).not.toHaveProperty('TEST_SECRET_RUNTIME_KEY', 'runtime-secret-value');
    }
  );

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
    'does not receive `Request` object for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.url).toBeNull();
      expect(data.method).toBeNull();
      expect(data.headers).toBeNull();
    }
  );

  it('loader endpoint returns `Response`', async () => {
    const response = await server.fetchAsync('/_expo/loaders/response');
    expect(response.status).toBe(200);
    // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
    // but the content is still valid JSON.
    // expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).not.toBe('public, max-age=3600');
    expect(response.headers.get('x-custom-header')).not.toBe('test-value');

    const data = await response.json();
    expect(data).toEqual({ foo: null });
  });
});
