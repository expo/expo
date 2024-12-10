/* eslint-env jest */
import fs from 'fs/promises';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { processFindPrefixedValue } from '../../utils/process';
import { createBackgroundServer } from '../../utils/server';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server-output', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server');

  beforeAll(async () => {
    console.time('export-server');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', 'dist-server'], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'server',
        E2E_ROUTER_ASYNC: 'development',
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });
    console.timeEnd('export-server');
  });

  describe('requests', () => {
    const server = createBackgroundServer({
      command: ['node', path.join(projectRoot, '__e2e__/server/express.js')],
      host: (chunk) =>
        processFindPrefixedValue(chunk, 'Express server listening') && 'http://localhost',
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    });

    beforeAll(async () => {
      await server.startAsync();
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        // Request missing route
        expect(await server.fetchAsync('/methods', { method }).then((res) => res.json())).toEqual({
          method: method.toLowerCase(),
        });
      });
    });

    it(`can serve build-time static dynamic route`, async () => {
      const res = await server.fetchAsync('/blog-ssg/abc');
      expect(res.status).toEqual(200);
      expect(await res.text()).toMatch(/Post: <!-- -->abc/);

      // This route is not pre-rendered and should show the default value for the dynamic parameter.
      const res2 = await server.fetchAsync('/blog-ssg/123');
      expect(res2.status).toEqual(200);
      expect(await res2.text()).toMatch(/Post: <!-- -->\[post\]/);
    });

    it(`can serve up custom not-found`, async () => {
      const res = await server.fetchAsync('/missing');
      expect(res.status).toEqual(404);
      expect(await res.text()).toMatch(/<div data-testid="custom-404">/);
    });
    it(`can serve HTML and a function from the same route`, async () => {
      expect(await server.fetchAsync('/matching-route/alpha').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-text">/
      );
      expect(
        await server
          .fetchAsync('/matching-route/alpha', {
            method: 'POST',
          })
          .then((res) => res.json())
      ).toEqual({ foo: 'bar' });
    });
    it(`can serve up index html`, async () => {
      expect(await server.fetchAsync('').then((res) => res.text())).toMatch(/<div id="root">/);
    });

    it(`can serve up group routes`, async () => {
      // Can access the same route from different paths
      expect(await server.fetchAsync('/beta').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-beta-text">/
      );
      expect(await server.fetchAsync('/(alpha)/').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-index">/
      );
      expect(await server.fetchAsync('/(alpha)/beta').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-beta-text">/
      );
    });
    it(`can serve up dynamic html routes`, async () => {
      expect(await server.fetchAsync('/blog/123').then((res) => res.text())).toMatch(/\[post\]/);
    });
    it(`can hit the 404 route`, async () => {
      expect(await server.fetchAsync('/clearly-missing').then((res) => res.text())).toMatch(
        /<div id="root">/
      );
    });

    it(`can serve up static html in array group`, async () => {
      const files = findProjectFiles(outputDir);
      expect(files).not.toContain('server/multi-group.html');
      expect(files).not.toContain('server/(a,b)/multi-group.html');
      expect(files).toContain('server/(a)/multi-group.html');
      expect(files).toContain('server/(b)/multi-group.html');
      expect(await server.fetchAsync('/multi-group').then((res) => res.text())).toMatch(
        /<div data-testid="multi-group">/
      );
    });

    it(`can serve up static html in specific array group`, async () => {
      expect(await server.fetchAsync('/(a)/multi-group').then((res) => res.text())).toMatch(
        /<div data-testid="multi-group">/
      );

      expect(await server.fetchAsync('/(b)/multi-group').then((res) => res.text())).toMatch(
        /<div data-testid="multi-group">/
      );
    });

    it(`can not serve up static html in retained array group syntax`, async () => {
      // Should not be able to match the array syntax
      expect(await server.fetchAsync('/(a,b)/multi-group').then((res) => res.status)).toEqual(404);
    });

    it(`can serve up API route in array group`, async () => {
      const files = findProjectFiles(outputDir);
      expect(files).toContain('server/_expo/functions/(a,b)/multi-group-api+api.js');
      expect(files).toContain('server/_expo/functions/(a,b)/multi-group-api+api.js.map');
      expect(files).not.toContain('server/_expo/functions/(a)/multi-group-api+api.js');
      expect(files).not.toContain('server/_expo/functions/(b)/multi-group-api+api.js');

      expect(await server.fetchAsync('/multi-group-api').then((res) => res.json())).toEqual({
        value: 'multi-group-api-get',
      });

      // Load the sourcemap and check that the paths are relative
      const map = JSON.parse(
        await fs.readFile(
          path.join(outputDir, 'server/_expo/functions/(a,b)/multi-group-api+api.js.map'),
          { encoding: 'utf8' }
        )
      );

      expect(map.sources).toContain('__e2e__/server/app/(a,b)/multi-group-api+api.ts');
    });

    it(`can serve up API route in specific array group`, async () => {
      // Should be able to match all the group variations
      expect(await server.fetchAsync('/(a)/multi-group-api').then((res) => res.json())).toEqual({
        value: 'multi-group-api-get',
      });
      expect(await server.fetchAsync('/(b)/multi-group-api').then((res) => res.json())).toEqual({
        value: 'multi-group-api-get',
      });
    });

    it(`can not serve up API route in retained array group syntax`, async () => {
      // Should not be able to match the array syntax
      expect(await server.fetchAsync('/(a,b)/multi-group-api').then((res) => res.status)).toEqual(
        404
      );
    });

    it('can use environment variables', async () => {
      expect(await server.fetchAsync('/api/env-vars').then((res) => res.json())).toEqual({
        // This is defined when we start the production server in `beforeAll`.
        var: 'test-secret-key',
      });
    });
    it('serves the empty route as 405', async () => {
      await expect(server.fetchAsync('/api/empty').then((r) => r.status)).resolves.toBe(405);
    });
    it('serves not-found routes as 404', async () => {
      await expect(server.fetchAsync('/missing').then((r) => r.status)).resolves.toBe(404);
    });
    it('automatically handles JS errors thrown inside of route handlers as 500', async () => {
      const res = await server.fetchAsync('/api/problematic');
      expect(res.status).toBe(500);
      expect(res.statusText).toBe('Internal Server Error');
    });
    describe('Response.json', () => {
      it('can POST json to a route', async () => {
        const res = await server.fetchAsync('/api/json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hello: 'world' }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ hello: 'world' });
      });
    });
    describe('Response.error', () => {
      it('returns a 500 response', async () => {
        const res = await server.fetchAsync('/api/error', {
          method: 'GET',
        });
        expect(res.status).toBe(500);
      });
    });
    describe('Response.redirect', () => {
      it('returns a 302 Location redirect', async () => {
        const res = await server.fetchAsync('/api/redirect', {
          redirect: 'manual',
          method: 'POST',
        });
        expect(res.status).toBe(302);
        expect(res.headers.get('Location')).toBe('http://test.com/redirect');
      });
      it('rejects invalid status codes with an internal error', async () => {
        const res = await server.fetchAsync('/api/redirect', {
          redirect: 'manual',
          method: 'GET',
        });
        expect(res.status).toBe(500);
        expect(res.statusText).toBe('Internal Server Error');
      });
    });
    it('handles pinging routes with unsupported methods with 405 "Method Not Allowed"', async () => {
      const res = await server.fetchAsync('/api/env-vars', { method: 'POST' });
      expect(res.status).toBe(405);
      expect(res.statusText).toBe('Method Not Allowed');
    });
    it('supports accessing dynamic parameters using same convention as client-side Expo Router', async () => {
      await expect(server.fetchAsync('/api/abc').then((r) => r.json())).resolves.toEqual({
        hello: 'abc',
      });
    });
    it('supports accessing deep dynamic parameters using different convention to client-side Expo Router', async () => {
      await expect(server.fetchAsync('/api/a/1/2/3').then((r) => r.json())).resolves.toEqual({
        results: '1/2/3',
      });
    });
    it('supports using Node.js externals to read local files', async () => {
      await expect(server.fetchAsync('/api/externals').then((r) => r.text())).resolves.toMatchPath(
        'a/b/c'
      );
    });
  });

  it('has expected files', async () => {
    // Request HTML
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('server/+html.html');
    expect(files).not.toContain('server/_layout.html');

    // Has routes.json
    expect(files).toContain('server/_expo/routes.json');

    // Has functions
    expect(files).toContain('server/_expo/functions/methods+api.js');
    expect(files).toContain('server/_expo/functions/methods+api.js.map');
    expect(files).toContain('server/_expo/functions/api/[dynamic]+api.js');
    expect(files).toContain('server/_expo/functions/api/[dynamic]+api.js.map');
    expect(files).toContain('server/_expo/functions/api/externals+api.js');
    expect(files).toContain('server/_expo/functions/api/externals+api.js.map');

    // TODO: We shouldn't export this
    expect(files).toContain('server/_expo/functions/api/empty+api.js');
    expect(files).toContain('server/_expo/functions/api/empty+api.js.map');

    // Has single variation of group file
    expect(files).toContain('server/(alpha)/index.html');
    expect(files).toContain('server/(alpha)/beta.html');
    expect(files).not.toContain('server/beta.html');

    // Injected by framework
    expect(files).toContain('server/_sitemap.html');
    expect(files).toContain('server/+not-found.html');

    // Normal routes
    expect(files).toContain('server/index.html');
    expect(files).toContain('server/blog/[post].html');
  });
});
