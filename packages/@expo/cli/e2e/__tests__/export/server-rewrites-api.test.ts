import type { RewriteConfig } from 'expo-router';

import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPRESS_SERVER,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPRESS_SERVER, RUNTIME_WORKERD], {
    app: 'server-tester',
    uniqueOutputKey: 'rewrites-api',
    export: {
      env: {
        E2E_ROUTER_ASYNC: 'development',
        E2E_ROUTER_REWRITES: JSON.stringify([
          { source: '/rewrites/methods', destination: '/api/methods' },
          { source: '/rewrites/dynamic/[slug]', destination: '/redirects/dynamic/[slug]' },
          {
            source: '/rewrites/dynamic/[other]/[slug]',
            destination: '/redirects/dynamic/[slug]/[other]',
          },
          {
            source: '/rewrites/dynamic/[slug]/to/[catchAll]',
            destination: '/redirects/dynamic/[...catchAll]',
          },
          {
            source: '/rewrites/dynamic/[slug]/[query]/[params]',
            destination: '/redirects/dynamic/[slug]',
          },
          {
            source: '/rewrites/catch-all/[...catchAll]',
            destination: '/redirects/dynamic/[...catchAll]',
          },
          {
            source: '/rewrites/catch-all-to-slug/[...slug]',
            destination: '/redirects/dynamic/[slug]',
          },
          { source: '/rewrites/only-post/[slug]', destination: '/api/methods', methods: ['POST'] },
        ] satisfies RewriteConfig[]),
      },
    },
  })
)('server API rewrites - $name', (config) => {
  const server = setupServer(config);

  ['POST', 'GET', 'PUT', 'DELETE'].forEach((method) => {
    it(`can make requests to rewritten ${method} routes`, async () => {
      const path = '/rewrites/methods';
      const response = await server.fetchAsync(path, { method });

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
      expect(await response.json()).toEqual({ method: method.toLowerCase() });
    });
  });

  it(`can rewrite [dynamic] routes`, async () => {
    const path = '/rewrites/dynamic/hello';
    const response = await server.fetchAsync(path);

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
  });

  it(`can rewrite [dynamic] routes`, async () => {
    const path = '/rewrites/dynamic/world/hello';
    const response = await server.fetchAsync(path);

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
  });

  it(`will preserve extra params as query params`, async () => {
    const response = await server.fetchAsync('/rewrites/dynamic/extra/my-query/my-params?foo=1');

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual('/rewrites/dynamic/extra/my-query/my-params');
    expect(new URL(response.url).search).toEqual('?foo=1');
  });

  it(`can rewrite [...catchAll] routes`, async () => {
    const path = '/rewrites/catch-all/hello/world';
    const response = await server.fetchAsync(path);

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
  });

  it(`can rewrite [...catchAll] routes with query params`, async () => {
    const response = await server.fetchAsync('/rewrites/catch-all/hello/world?hello=world&foo=bar');

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual('/rewrites/catch-all/hello/world');
    expect(new URL(response.url).search).toEqual('?hello=world&foo=bar');
  });

  it(`will match based upon variable names [slug] -> [...catchAll]`, async () => {
    const path = '/rewrites/dynamic/my-slug/to/this-is-the-catch-all';
    const response = await server.fetchAsync(path);

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
    expect(new URL(response.url).search).toEqual('');
  });

  it(`will match based upon variable names [...catchAll] -> [...slug]`, async () => {
    const path = '/rewrites/catch-all-to-slug/this/is/the/catch-all';
    const response = await server.fetchAsync(path);

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
    expect(new URL(response.url).search).toEqual('');
  });

  it(`will rewrite only if the method is post`, async () => {
    const path = '/rewrites/only-post/hello-world';
    let response = await server.fetchAsync(path);

    expect(response.status).toEqual(404);

    response = await server.fetchAsync(path, { method: 'POST' });

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(false);
    expect(new URL(response.url).pathname).toEqual(path);
    expect(new URL(response.url).search).toEqual('');
  });
});
