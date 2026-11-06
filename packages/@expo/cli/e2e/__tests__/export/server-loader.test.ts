import fs from 'node:fs';
import path from 'node:path';

import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml, getPageAndLoaderData } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START, RUNTIME_WORKERD], {
    app: 'server-tester',
    serve: {
      env: {
        E2E_ROUTER_WEB_OUTPUT: 'server',
        TEST_SECRET_RUNTIME_KEY: 'runtime-secret-value',
        TEST_THROW_ERROR: 'true',
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
    expect(files).not.toContain('loaders/env.html');
    expect(files).not.toContain('loaders/index.html');
    expect(files).not.toContain('loaders/request.html');
    expect(files).not.toContain('loaders/response.html');
    expect(files).not.toContain('loaders/second.html');
    expect(files).not.toContain('loaders/slow.html');
    expect(files).not.toContain('loaders/nested/index.html');
    expect(files).not.toContain('loaders/nullish/[value].html');
    expect(files).not.toContain('loaders/nullish/null.html');
    expect(files).not.toContain('loaders/nullish/undefined.html');
    expect(files).not.toContain('loaders/posts/[postId].html');
    expect(files).not.toContain('loaders/posts/static-post-1.html');
    expect(files).not.toContain('loaders/posts/static-post-2.html');
    expect(files).not.toContain('loaders/groups/platform/alpha/beta.html');

    // Loader bundles should exist
    expect(files).toContain('_expo/loaders/loaders/index.js');
    expect(files).toContain('_expo/loaders/loaders/env.js');
    expect(files).toContain('_expo/loaders/loaders/error.js');
    expect(files).toContain('_expo/loaders/loaders/meta.js');
    expect(files).toContain('_expo/loaders/loaders/nested/index.js');
    expect(files).toContain('_expo/loaders/loaders/request.js');
    expect(files).toContain('_expo/loaders/loaders/response.js');
    expect(files).toContain('_expo/loaders/loaders/second.js');
    expect(files).toContain('_expo/loaders/loaders/slow.js');
    expect(files).toContain('_expo/loaders/loaders/nullish/[value].js');
    expect(files).toContain('_expo/loaders/loaders/posts/[postId].js');
    expect(files).toContain('_expo/loaders/loaders/groups/(group)/index.js');
    expect(files).toContain('_expo/loaders/loaders/groups/(group)/platform/[...slug].js');
    expect(files).toContain('_expo/loaders/loaders/static-helper.js');
    expect(files).toContain('_expo/loaders/loaders/server-helper.js');
  });

  (server.isExpoStart ? it.skip : it)('routes.json has loader paths', async () => {
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
    );

    for (const route of routesJson.htmlRoutes) {
      if (route.loader) {
        expect(route.loader).toBe(`_expo/loaders${route.page}.js`);
      }
    }
  });

  it('returns 404 for loader endpoint when route has no loader', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/no-loader');
    expect(response.status).toBe(404);
  });

  it('returns 404 for loader endpoint when route does not exist', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/nonexistent');
    expect(response.status).toBe(404);
  });

  it.each(getPageAndLoaderData('/loaders/error'))(
    'returns error when loader throws for $url ($name)',
    async ({ url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(500);
    }
  );

  it.each(getPageAndLoaderData('/loaders', true))(
    'can access data for root index route $url ($name)',
    async ({ getData, name, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      if (name === 'loader') {
        expect(response.headers.get('content-type')).toContain('application/json');
      }

      const data = await getData(response);
      expect(data).toEqual({ data: 'root-index' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/groups/(group)'))(
    'can access data for group index route $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      const data = await getData(response);
      expect(data).toEqual({ data: 'grouped-index' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/groups/(group)/platform/alpha/beta'))(
    'can access platform-specific catch-all data for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      const data = await getData(response);
      expect(data).toEqual({ data: 'platform-catch-all' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/second'))(
    'can access data for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      const data = await getData(response);
      expect(data).toEqual({ data: 'second' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/nested'))(
    'can access data for nested index route $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      const data = await getData(response);
      expect(data).toEqual({ data: 'nested-index' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/posts/static-post-1'))(
    'can access data with dynamic params for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.params).toHaveProperty('postId', 'static-post-1');
    }
  );

  (server.isExpoStart ? it.skip : it).each(getPageAndLoaderData('/loaders/env'))(
    'can access server environment variables for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data).not.toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
      expect(data).toHaveProperty('TEST_SECRET_RUNTIME_KEY', 'runtime-secret-value');
    }
  );

  it.each(getPageAndLoaderData('/loaders/nullish/undefined'))(
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

  it.each(getPageAndLoaderData('/loaders/nullish/null'))(
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

  it.each(getPageAndLoaderData('/loaders/request'))(
    'receives `Request` object for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(new URL(data.url).pathname).toBe('/loaders/request');
      expect(data.method).toBe('GET');
      expect(Array.isArray(data.headers)).toBe(true);
    }
  );

  it.each(getPageAndLoaderData('/loaders/request?foo=bar'))(
    '$name $url receives search params',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.url).toContain('/loaders/request?foo=bar');
      expect(data.method).toBe('GET');
      expect(Array.isArray(data.headers)).toBe(true);
    }
  );

  it.each(getPageAndLoaderData('/loaders/request?immutable=true'))(
    'request is immutable for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.immutable).toBe(true);
      expect(data.error).toContain('This operation is not allowed');
    }
  );

  it('loader endpoint returns `Response`', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/response');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(response.headers.get('x-custom-header')).toBe('set-via-response');

    const data = await response.json();
    expect(data).toEqual({ foo: 'bar' });
  });

  it('defaults a headerless server loader to no-store', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/index');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('sets custom headers on response using `setResponseHeaders()`', async () => {
    const response = await server.fetchAsync(
      '/_expo/loaders/loaders/response?setresponseheaders=true'
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response.headers.get('X-Custom-Header')).toBe('set-via-setResponseHeaders');

    const data = await response.json();
    expect(data).toEqual({ foo: 'bar' });
  });

  it('renders meta tags from loader data in HTML', async () => {
    const response = await server.fetchAsync('/loaders/meta');
    expect(response.status).toBe(200);
    const html = getHtml(await response.text());

    expect(html.querySelector('title')?.textContent).toBe('Meta page');
    expect(html.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Meta tag testing'
    );
    expect(html.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe(
      'expo-router,loaders,meta'
    );
    expect(html.querySelector('meta[name="author"]')?.getAttribute('content')).toBe('Expo');
  });

  it.each(getPageAndLoaderData('/loaders/server-helper'))(
    'can access data from `createServerLoader()` for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data.source).toBe('server-helper');
      expect(new URL(data.url).pathname).toBe('/loaders/server-helper');
      expect(data.method).toBe('GET');
    }
  );
});
