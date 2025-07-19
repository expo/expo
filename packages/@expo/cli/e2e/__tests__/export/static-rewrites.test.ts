/* eslint-env jest */
import { RewriteConfig } from 'expo-router/build/getRoutesCore';
import * as htmlParser from 'node-html-parser';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server rewrites', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rewrites';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'static-redirects',
        E2E_ROUTER_REWRITES: JSON.stringify([
          { source: '/rewrite', destination: '/' },
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
    });
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

    it(`correctly shows the destination contents after a rewrite`, async () => {
      const getIndexText = (htmlString: string) => {
        return htmlParser.parse(htmlString).querySelector('[data-testid=index-text]')!.textContent;
      };

      const indexResponse = await server.fetchAsync('/');

      const path = '/rewrite';
      const rewriteResponse = await server.fetchAsync(path);
      expect(rewriteResponse.status).toBe(200);
      expect(new URL(rewriteResponse.url).pathname).toBe(path);

      const actual = getIndexText(await rewriteResponse.text());
      const expected = getIndexText(await indexResponse.text());
      expect(actual).toEqual(expected);
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to rewritten ${method} routes`, async () => {
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

    it(`can rewrite [dynamic] routes`, async () => {
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
      const path = '/rewrite/catch-all/hello/world';
      const response = await server.fetchAsync(path);

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
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
      const path = '/rewrite/dynamic/my-slug/to/this-is-the-catch-all';
      const response = await server.fetchAsync(path);

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
      expect(new URL(response.url).search).toEqual('');
    });

    it(`will match based upon variable names [...catchAll] -> [...slug]`, async () => {
      const path = '/rewrite/catch-all-to-slug/this/is/the/catch-all';
      const response = await server.fetchAsync(path);

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
      expect(new URL(response.url).search).toEqual('');
    });

    it(`will rewrite only if the method is post`, async () => {
      const path = '/rewrite/only-post/hello-world';
      let response = await server.fetchAsync(path);

      expect(response.status).toEqual(404);

      response = await server.fetchAsync(path, { method: 'POST' });

      expect(response.status).toEqual(200);
      expect(response.redirected).toEqual(false);
      expect(new URL(response.url).pathname).toEqual(path);
      expect(new URL(response.url).search).toEqual('');
    });
  });
});
