/* eslint-env jest */
import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml } from '../utils';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START], {
    fixtureName: 'server-loader',
    export: {
      env: {
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SERVER_LOADERS: 'true',
        TEST_SECRET_KEY: 'test-secret-key',
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

  it('loader endpoint returns JSON', async () => {
    const response = await server.fetchAsync('/_expo/loaders/second');
    expect(response.status).toBe(200);
    // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
    // but the content is still valid JSON.
    // expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('loader endpoint returns JSON with params for static route', async () => {
    const response = await server.fetchAsync('/_expo/loaders/posts/static-post-1');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.params).toHaveProperty('postId', 'static-post-1');
  });

  it('loader can access server environment variables during build time', async () => {
    const response = await server.fetchAsync('/_expo/loaders/env');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('TEST_SECRET_KEY', 'test-secret-key');
  });

  it('loader endpoint returns `Response` body', async () => {
    const response = await server.fetchAsync('/_expo/loaders/response');
    expect(response.status).toBe(200);
    // NOTE(@hassankhan): expo-server returns `application/octet-stream` for extensionless files,
    // but the content is still valid JSON.
    // expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).not.toBe('public, max-age=3600');
    expect(response.headers.get('x-custom-header')).not.toBe('test-value');

    const data = await response.json();
    expect(data).toEqual({ foo: 'bar' });
  });

  it('loader endpoint returns `null` for `undefined` loader data', async () => {
    const response = await server.fetchAsync('/_expo/loaders/nullish/undefined');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeNull();
  });

  it('loader endpoint returns `null` for `null` loader data', async () => {
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

    expect(data.url).toBeNull();
    expect(data.method).toBeNull();
    expect(data.headers).toBeNull();
  });
});
