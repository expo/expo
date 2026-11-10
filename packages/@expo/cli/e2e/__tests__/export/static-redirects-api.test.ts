import type { RedirectConfig } from 'expo-router';

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
    uniqueOutputKey: 'redirects-api',
    export: {
      env: {
        E2E_ROUTER_ASYNC: 'development',
        E2E_ROUTER_REDIRECTS: JSON.stringify([
          {
            source: '/redirects/from/permanent/methods',
            destination: '/api/methods',
            permanent: true,
          },
          { source: '/redirects/from/methods', destination: '/api/methods' },
          { source: '/redirects/from/dynamic/[slug]', destination: '/redirects/dynamic/[slug]' },
          {
            source: '/redirects/from/dynamic/[other]/[slug]',
            destination: '/redirects/dynamic/[slug]/[other]',
          },
          {
            source: '/redirects/from/dynamic/[slug]/to/[catchAll]',
            destination: '/redirects/dynamic/[...catchAll]',
          },
          {
            source: '/redirects/from/dynamic/[slug]/[query]/[params]',
            destination: '/redirects/dynamic/[slug]',
          },
          {
            source: '/redirects/from/catch-all/[...catchAll]',
            destination: '/redirects/dynamic/[...catchAll]',
          },
          {
            source: '/redirects/from/catch-all-to-slug/[...slug]',
            destination: '/redirects/dynamic/[slug]',
          },
          {
            source: '/redirects/from/only-post/[slug]',
            destination: '/api/methods',
            methods: ['POST'],
          },
        ] satisfies RedirectConfig[]),
      },
    },
  })
)('server API redirects - $name', (config) => {
  const server = setupServer(config);

  ['POST', 'GET', 'PUT', 'DELETE'].forEach((method) => {
    it(`can make requests to ${method} routes`, async () => {
      // Request missing route
      const response = await server.fetchAsync('/redirects/from/methods', { method });

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/api/methods');
      expect(await response.json()).toEqual({ method: method.toLowerCase() });
    });
  });

  (
    [
      ['POST', 307, 308],
      ['GET', 302, 301],
      ['HEAD', 302, 301],
      ['PUT', 307, 308],
      ['DELETE', 307, 308],
    ] satisfies [string, number, number][]
  ).forEach(([method, status, permanentStatus]) => {
    it(`returns appropriate redirect status for ${method} routes`, async () => {
      // Request missing route
      const response = await server.fetchAsync('/redirects/from/methods', {
        method,
        redirect: 'manual',
      });

      expect(response.status).toEqual(status);
    });

    it(`returns appropriate permanent redirect status for ${method} routes`, async () => {
      // Request missing route
      const response = await server.fetchAsync('/redirects/from/permanent/methods', {
        method,
        redirect: 'manual',
      });

      expect(response.status).toEqual(permanentStatus);
    });
  });

  it(`can redirect [dynamic] routes`, async () => {
    // Request missing route
    const response = await server.fetchAsync('/redirects/from/dynamic/hello');

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/hello');
  });

  it(`can restructure [dynamic] routes`, async () => {
    // Request missing route
    const response = await server.fetchAsync('/redirects/from/dynamic/world/hello');

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/hello/world');
  });

  it(`will preserve extra params as query params`, async () => {
    const response = await server.fetchAsync(
      '/redirects/from/dynamic/extra/my-query/my-params?foo=1'
    );

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/extra');
    expect(new URL(response.url).search).toEqual('?query=my-query&params=my-params&foo=1');
  });

  it(`can redirect [...catchAll] routes`, async () => {
    const response = await server.fetchAsync('/redirects/from/catch-all/hello/world');

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/hello/world');
  });

  it(`can redirect [...catchAll] routes with query params`, async () => {
    const response = await server.fetchAsync(
      '/redirects/from/catch-all/hello/world?hello=world&foo=bar'
    );

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/hello/world');
    expect(new URL(response.url).search).toEqual('?hello=world&foo=bar');
  });

  it(`will match based upon variable names [slug] -> [...catchAll]`, async () => {
    const response = await server.fetchAsync(
      '/redirects/from/dynamic/my-slug/to/this-is-the-catch-all'
    );

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/this-is-the-catch-all');
    expect(new URL(response.url).search).toEqual('?slug=my-slug');
  });

  it(`will match based upon variable names [...catchAll] -> [...slug]`, async () => {
    const response = await server.fetchAsync(
      '/redirects/from/catch-all-to-slug/this/is/the/catch-all'
    );

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/redirects/dynamic/this');
    expect(new URL(response.url).search).toEqual('');
  });

  it(`will redirect only if the method is post`, async () => {
    let response = await server.fetchAsync('/redirects/from/only-post/hello-world');

    expect(response.status).toEqual(404);

    response = await server.fetchAsync('/redirects/from/only-post/hello-world', { method: 'POST' });

    expect(response.status).toEqual(200);
    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual('/api/methods');
    expect(new URL(response.url).search).toEqual('?slug=hello-world');
  });
});
