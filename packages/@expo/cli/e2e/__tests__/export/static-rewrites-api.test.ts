/* eslint-env jest */
import { RewriteConfig } from 'expo-router/build/getRoutesCore';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { processFindPrefixedValue } from '../../utils/process';
import { createBackgroundServer } from '../../utils/server';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server api rewrites', () => {
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
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
          E2E_ROUTER_REWRITES: JSON.stringify([
            { source: '/rewrite/methods', destination: '/methods' },
            { source: '/rewrite/dynamic/[slug]', destination: '/dynamic/[slug]' },
            { source: '/rewrite/dynamic/[other]/[slug]', destination: '/dynamic/[slug]/[other]' },
            {
              source: '/rewrite/dynamic/[slug]/to/[catchAll]',
              destination: '/dynamic/[...catchAll]',
            },
            { source: '/rewrite/dynamic/[slug]/[query]/[params]', destination: '/dynamic/[slug]' },
            { source: '/rewrite/catch-all/[...catchAll]', destination: '/dynamic/[...catchAll]' },
            { source: '/rewrite/catch-all-to-slug/[...slug]', destination: '/dynamic/[slug]' },
            { source: '/rewrite/only-post/[slug]', destination: '/methods', methods: ['POST'] },
          ] as RewriteConfig[]),
        },
      }
    );
  });

  describe('requests', () => {
    const server = createBackgroundServer({
      command: ['node', path.join(projectRoot, '__e2e__/static-redirects/express.js')],
      host: (chunk) =>
        processFindPrefixedValue(chunk, 'Express server listening') && 'http://localhost',
      cwd: projectRoot,
      env: { NODE_ENV: 'production', TEST_SECRET_KEY: 'test-secret-key' },
    });

    beforeAll(async () => {
      await server.startAsync();
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        const path = '/rewrite/methods';
        const response = await server.fetchAsync(path, { method });

        expect(response.status).toEqual(200);
        expect(response.redirected).toEqual(false);
        expect(new URL(response.url).pathname).toEqual(path);
      });
    });

    it(`can rewrite [dynamic] routes`, async () => {
      const path = '/rewrite/dynamic/hello';
      const response = await server.fetchAsync(path);

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
    });

    it(`can restructure [dynamic] routes`, async () => {
      const path = '/rewrite/dynamic/world/hello';
      const response = await server.fetchAsync(path);

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
    });

    it(`will preserve extra params as query params`, async () => {
      const response = await server.fetchAsync('/rewrite/dynamic/extra/my-query/my-params?foo=1');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual('/rewrite/dynamic/extra/my-query/my-params');
      expect(new URL(response.url).search).toEqual('?foo=1');
    });

    it(`can rewrite [...catchAll] routes`, async () => {
      const response = await server.fetchAsync('/rewrite/catch-all/hello/world');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual('/rewrite/catch-all/hello/world');
    });

    it(`can rewrite [...catchAll] routes with query params`, async () => {
      const response = await server.fetchAsync(
        '/rewrite/catch-all/hello/world?hello=world&foo=bar'
      );

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual('/rewrite/catch-all/hello/world');
      expect(new URL(response.url).search).toEqual('?hello=world&foo=bar');
    });

    it(`will match based upon variable names [slug] -> [...catchAll]`, async () => {
      const response = await server.fetchAsync('/rewrite/dynamic/my-slug/to/this-is-the-catch-all');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(
        '/rewrite/dynamic/my-slug/to/this-is-the-catch-all'
      );
      expect(new URL(response.url).search).toEqual('');
    });

    it(`will match based upon variable names [...catchAll] -> [...slug]`, async () => {
      const response = await server.fetchAsync('/rewrite/catch-all-to-slug/this/is/the/catch-all');

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual('/rewrite/catch-all-to-slug/this/is/the/catch-all');
      expect(new URL(response.url).search).toEqual('');
    });

    it(`will redirect only if the method is post`, async () => {
      let response = await server.fetchAsync('/rewrite/only-post/hello-world');

      expect(response.status).toEqual(404);

      response = await server.fetchAsync('/rewrite/only-post/hello-world', { method: 'POST' });

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual('/rewrite/only-post/hello-world');
      expect(new URL(response.url).search).toEqual('');
    });
  });
});
