/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server api redirects', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-redirects';

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'static-redirects',
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            { source: '/redirect/methods', destination: '/methods' },
            { source: '/redirect/dynamic/[slug]', destination: '/dynamic/[slug]' },
            { source: '/redirect/dynamic/[other]/[slug]', destination: '/dynamic/[slug]/[other]' },
            {
              source: '/redirect/dynamic/[slug]/to/[catchAll]',
              destination: '/dynamic/[...catchAll]',
            },
            { source: '/redirect/dynamic/[slug]/[query]/[params]', destination: '/dynamic/[slug]' },
            { source: '/redirect/catch-all/[...catchAll]', destination: '/dynamic/[...catchAll]' },
            { source: '/redirect/catch-all-to-slug/[...slug]', destination: '/dynamic/[slug]' },
            { source: '/redirect/only-post/[slug]', destination: '/methods', methods: ['POST'] },
          ] as RedirectConfig[]),
        },
      }
    );
  });

  describe('requests', () => {
    const server = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    beforeAll(async () => {
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        // Request missing route
        const response = await server.fetchAsync('/redirect/methods', { method });

        expect(response.status).toEqual(200);
        expect(response.redirected).toEqual(true);
        expect(new URL(response.url).pathname).toEqual('/methods');
      });
    });

    it(`can rewrite [dynamic] routes`, async () => {
      // Request missing route
      const response = await server.fetchAsync('/redirect/dynamic/hello');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/hello');
    });

    it(`can restructure [dynamic] routes`, async () => {
      // Request missing route
      const response = await server.fetchAsync('/redirect/dynamic/world/hello');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/hello/world');
    });

    it(`will preserve extra params as query params`, async () => {
      const response = await server.fetchAsync('/redirect/dynamic/extra/my-query/my-params?foo=1');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/extra');
      expect(new URL(response.url).search).toEqual('?query=my-query&params=my-params&foo=1');
    });

    it(`can rewrite [...catchAll] routes`, async () => {
      const response = await server.fetchAsync('/redirect/catch-all/hello/world');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/hello/world');
    });

    it(`can rewrite [...catchAll] routes with query params`, async () => {
      const response = await server.fetchAsync(
        '/redirect/catch-all/hello/world?hello=world&foo=bar'
      );

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/hello/world');
      expect(new URL(response.url).search).toEqual('?hello=world&foo=bar');
    });

    it(`will match based upon variable names [slug] -> [...catchAll]`, async () => {
      const response = await server.fetchAsync(
        '/redirect/dynamic/my-slug/to/this-is-the-catch-all'
      );

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/this-is-the-catch-all');
      expect(new URL(response.url).search).toEqual('?slug=my-slug');
    });

    it(`will match based upon variable names [...catchAll] -> [...slug]`, async () => {
      const response = await server.fetchAsync('/redirect/catch-all-to-slug/this/is/the/catch-all');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/dynamic/this');
      expect(new URL(response.url).search).toEqual('');
    });

    it(`will redirect only if the method is post`, async () => {
      let response = await server.fetchAsync('/redirect/only-post/hello-world');

      expect(response.status).toEqual(404);

      response = await server.fetchAsync('/redirect/only-post/hello-world', { method: 'POST' });

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(true);
      expect(new URL(response.url).pathname).toEqual('/methods');
      expect(new URL(response.url).search).toEqual('?slug=hello-world');
    });
  });
});
