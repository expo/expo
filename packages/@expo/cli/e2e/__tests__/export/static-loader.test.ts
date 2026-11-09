import fs from 'node:fs';
import path from 'node:path';

import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml, getPageAndLoaderData } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START], {
    app: 'server-tester',
    uniqueOutputKey: 'loaders-static',
    export: {
      env: {
        E2E_ROUTER_WEB_OUTPUT: 'static',
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
    expect(files).toContain('loaders/env.html');
    expect(files).toContain('loaders/index.html');
    expect(files).toContain('loaders/meta.html');
    expect(files).toContain('loaders/request.html');
    expect(files).toContain('loaders/response.html');
    expect(files).toContain('loaders/second.html');
    expect(files).toContain('loaders/slow.html');
    expect(files).toContain('loaders/nested/index.html');
    expect(files).toContain('loaders/nullish/[value].html');
    expect(files).toContain('loaders/nullish/null.html');
    expect(files).toContain('loaders/nullish/undefined.html');
    expect(files).toContain('loaders/posts/[postId].html');
    expect(files).toContain('loaders/posts/static-post-1.html');
    expect(files).toContain('loaders/posts/static-post-2.html');
    expect(files).toContain('loaders/groups/platform/alpha/beta.html');
    expect(files).toContain('loaders/static-helper.html');
    expect(files).toContain('loaders/server-helper.html');

    // Loader outputs are pre-generated JSON files
    expect(files).toContain('_expo/loaders/loaders/index');
    expect(files).toContain('_expo/loaders/loaders/env');
    expect(files).toContain('_expo/loaders/loaders/meta');
    expect(files).toContain('_expo/loaders/loaders/request');
    expect(files).toContain('_expo/loaders/loaders/response');
    expect(files).toContain('_expo/loaders/loaders/second');
    expect(files).toContain('_expo/loaders/loaders/slow');
    expect(files).toContain('_expo/loaders/loaders/nested/index');
    expect(files).toContain('_expo/loaders/loaders/nullish/[value]');
    expect(files).toContain('_expo/loaders/loaders/nullish/null');
    expect(files).toContain('_expo/loaders/loaders/nullish/undefined');
    expect(files).toContain('_expo/loaders/loaders/posts/[postId]');
    expect(files).toContain('_expo/loaders/loaders/posts/static-post-1');
    expect(files).toContain('_expo/loaders/loaders/posts/static-post-2');
    expect(files).toContain('_expo/loaders/loaders/groups/(group)/index');
    expect(files).toContain('_expo/loaders/loaders/groups/(group)/platform/alpha/beta');
    expect(files).toContain('_expo/loaders/loaders/static-helper');
  });

  it('returns 404 for loader endpoint when route has no loader', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/no-loader');
    expect(response.status).toBe(404);
  });

  it('returns 404 for loader endpoint when route does not exist', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/nonexistent');
    expect(response.status).toBe(404);
  });

  it.each(getPageAndLoaderData('/loaders', true))(
    'can access data for root index route $url ($name)',
    async ({ getData, name, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);

      if (name === 'loader') {
        // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
        // but the content is still valid JSON.
        // expect(response.headers.get('content-type')).toContain('application/json');
      }

      const data = await getData(response);
      expect(data).toEqual({ data: 'root-index' });
    }
  );

  it.each(getPageAndLoaderData('/loaders/groups/(group)', true))(
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

  it.each(getPageAndLoaderData('/loaders/nested', true))(
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

      expect(data).toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
      expect(data).not.toHaveProperty('TEST_SECRET_RUNTIME_KEY', 'runtime-secret-value');
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
    const response = await server.fetchAsync('/_expo/loaders/loaders/response');
    expect(response.status).toBe(200);
    // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
    // but the content is still valid JSON.
    // expect(response.headers.get('content-type')).toContain('application/json');

    expect(response.headers.get('cache-control')).toBe('public, max-age=604800');
    // Non-allowlisted headers are stripped in dev and static exports
    expect(response.headers.get('x-loader-header')).toBeNull();

    const data = await response.json();
    expect(data).toEqual({ foo: null });
  });

  (server.isExpoStart ? it.skip : it)(
    'applies the SSG default Cache-Control to a headerless loader',
    async () => {
      const response = await server.fetchAsync('/_expo/loaders/loaders/index');

      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, must-revalidate, max-age=0');
    }
  );

  it('passes a loader-declared no-store through verbatim', async () => {
    const response = await server.fetchAsync('/_expo/loaders/loaders/second');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  (server.isExpoStart ? it.skip : it)(
    'applies loader-declared `Cache-Control` to the pre-rendered page',
    async () => {
      const response = await server.fetchAsync('/loaders/response');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('public, max-age=604800');
    }
  );

  (server.isExpoStart ? it.skip : it)(
    'writes loader and page `Cache-Control` rules to the manifest subset',
    () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, '_expo/.routes.json'), 'utf8')
      );
      const SSG_DEFAULT = { 'Cache-Control': 'private, must-revalidate, max-age=0' };

      expect(routesJson.pageHeaders).toEqual([
        // Header-less loader routes: the SSG default, applied to each page and loader file.
        { namedRegex: '^/errors/loader(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/env(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/error(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/groups(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/groups/\\(group\\)(?:/)?$', headers: SSG_DEFAULT },
        {
          namedRegex: '^/loaders/groups/\\(group\\)/platform/\\[\\.\\.\\.slug\\](?:/)?$',
          headers: SSG_DEFAULT,
        },
        {
          namedRegex: '^/loaders/groups/\\(group\\)/platform/alpha/beta(?:/)?$',
          headers: SSG_DEFAULT,
        },
        {
          namedRegex: '^/loaders/groups/platform/\\[\\.\\.\\.slug\\](?:/)?$',
          headers: SSG_DEFAULT,
        },
        { namedRegex: '^/loaders/groups/platform/alpha/beta(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/large\\-suspense(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/meta(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/nested(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/nullish/\\[value\\](?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/nullish/null(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/nullish/undefined(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/posts/\\[postId\\](?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/posts/static\\-post\\-1(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/posts/static\\-post\\-2(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/request(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/slow(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/loaders/static\\-helper(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/errors/loader(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/env(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/error(?:/)?$', headers: SSG_DEFAULT },
        {
          namedRegex: '^/_expo/loaders/loaders/groups/\\(group\\)/index(?:/)?$',
          headers: SSG_DEFAULT,
        },
        {
          namedRegex:
            '^/_expo/loaders/loaders/groups/\\(group\\)/platform/\\[\\.\\.\\.slug\\](?:/)?$',
          headers: SSG_DEFAULT,
        },
        {
          namedRegex: '^/_expo/loaders/loaders/groups/\\(group\\)/platform/alpha/beta(?:/)?$',
          headers: SSG_DEFAULT,
        },
        { namedRegex: '^/_expo/loaders/loaders/index(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/large\\-suspense(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/meta(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/nested/index(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/nullish/\\[value\\](?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/nullish/null(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/nullish/undefined(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/posts/\\[postId\\](?:/)?$', headers: SSG_DEFAULT },
        {
          namedRegex: '^/_expo/loaders/loaders/posts/static\\-post\\-1(?:/)?$',
          headers: SSG_DEFAULT,
        },
        {
          namedRegex: '^/_expo/loaders/loaders/posts/static\\-post\\-2(?:/)?$',
          headers: SSG_DEFAULT,
        },
        { namedRegex: '^/_expo/loaders/loaders/request(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/slow(?:/)?$', headers: SSG_DEFAULT },
        { namedRegex: '^/_expo/loaders/loaders/static\\-helper(?:/)?$', headers: SSG_DEFAULT },
        // Loader-declared headers: appended last so they win, applied to page and loader file.
        {
          namedRegex: '^/headers/blog(?:/)?$',
          headers: { 'Cache-Control': 'public, max-age=86400' },
        },
        {
          namedRegex: '^/loaders/response(?:/)?$',
          headers: { 'Cache-Control': 'public, max-age=604800' },
        },
        {
          namedRegex: '^/loaders/second(?:/)?$',
          headers: { 'Cache-Control': 'private, no-store' },
        },
        {
          namedRegex: '^/_expo/loaders/headers/blog(?:/)?$',
          headers: { 'Cache-Control': 'public, max-age=86400' },
        },
        {
          namedRegex: '^/_expo/loaders/loaders/response(?:/)?$',
          headers: { 'Cache-Control': 'public, max-age=604800' },
        },
        {
          namedRegex: '^/_expo/loaders/loaders/second(?:/)?$',
          headers: { 'Cache-Control': 'private, no-store' },
        },
      ]);
    }
  );

  it('renders route metadata in HTML', async () => {
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

  it.each(getPageAndLoaderData('/loaders/static-helper'))(
    'can access data from `createStaticLoader()` for $url ($name)',
    async ({ getData, url }) => {
      const response = await server.fetchAsync(url);
      expect(response.status).toBe(200);
      const data = await getData(response);

      expect(data).toEqual({ source: 'static-helper' });
    }
  );
});
