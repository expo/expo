/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  setupServer,
  RUNTIME_EXPRESS_SERVER,
  RUNTIME_EXPO_START,
  RUNTIME_WORKERD,
} from '../../utils/runtime';
import { findProjectFiles } from '../utils';

runExportSideEffects();

describe('server-output', () => {
  describe.each(
    prepareServers([RUNTIME_EXPRESS_SERVER, RUNTIME_EXPO_START, RUNTIME_WORKERD], {
      fixtureName: 'server',
      export: {
        env: {
          E2E_ROUTER_ASYNC: 'development',
        },
      },
      serve: {
        env: {
          TEST_SECRET_KEY: 'test-secret-key',
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        expect(await server.fetchAsync('/methods', { method }).then((res) => res.json())).toEqual({
          method: method.toLowerCase(),
        });
      });
    });

    it.each([
      { path: '/blog-ssg/abc', value: 'abc' },
      { path: '/blog-ssg/123', value: '123' },
    ])(`can serve dynamic route at $path`, async ({ path, value }) => {
      const res = await server.fetchAsync(path);
      expect(res.status).toEqual(200);
      expect(await res.text()).toMatch(new RegExp(`Post: <!-- -->${value}`));
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
          .fetchAsync('/matching-route/alpha', { method: 'POST' })
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

    it(`can hit the 404 route`, async () => {
      expect(await server.fetchAsync('/clearly-missing').then((res) => res.text())).toMatch(
        /<div id="root">/
      );
    });

    it(`can serve up static html in array group`, async () => {
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
      expect(await server.fetchAsync('/multi-group-api').then((res) => res.json())).toEqual({
        value: 'multi-group-api-get',
      });
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

    it('supports multiple values headers in API routes', async () => {
      const res = await server.fetchAsync('/api/headers');
      expect(res.status).toBe(200);
      expect(res.headers.get('x-custom-header')).toBe('customValue');
      // Multiple headers with the same name are combined into a single comma-separated value
      expect(res.headers.get('x-multiple-header')).toBe('value1, value2');
      // Set-Cookie headers are also combined (they are special case which doesn't work with headers.entries())
      expect(res.headers.get('set-cookie')).toBe('key1=value1, key2=value2');
      expect(await res.json()).toEqual({ message: 'ok' });
    });

    describe('Response.json', () => {
      it('can POST json to a route', async () => {
        const res = await server.fetchAsync('/api/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hello: 'world' }),
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ hello: 'world' });
      });
    });

    describe('Response.error', () => {
      it('returns a 500 response', async () => {
        const res = await server.fetchAsync('/api/error', { method: 'GET' });
        expect(res.status).toBe(500);
        expect(await res.text()).toEqual(''); // Ensures 500 from Response.error() and not from another error
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
        const res = await server.fetchAsync('/api/redirect', { redirect: 'manual', method: 'GET' });
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

    // NOTE(@krystofwoldrich): Skipped for workerd, we can simulate prod by injecting the env vars
    (server.isWorkerd ? it.skip : it)('can use environment variables', async () => {
      expect(await server.fetchAsync('/api/env-vars').then((res) => res.json())).toEqual({
        // This is defined when we start the production server in `beforeAll`.
        var: 'test-secret-key',
      });
    });

    (server.isWorkerd ? it.skip : it)(
      'supports using Node.js externals to read local files',
      async () => {
        await expect(
          server.fetchAsync('/api/externals').then((r) => r.text())
        ).resolves.toMatchPath('a/b/c');
      }
    );

    (server.isWorkerd ? it.skip : it)('supports runtime API', async () => {
      await expect(server.fetchAsync('/api/runtime').then((r) => r.json())).resolves.toEqual({
        environment: expect.stringMatching(/production|development/),
        origin: 'null',
      });
    });

    // NOTE(@krystofwoldrich): There is no API to add the server callbacks in the dev server at the moment.
    (server.isExpoStart ? describe.skip : describe)('server callbacks', () => {
      ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
        it(`\`beforeAPIResponse\` and \`beforeResponse\` are executed for ${method}`, async () => {
          const headers = await server
            .fetchAsync('/api/abc')
            .then((r) => Object.fromEntries(r.headers.entries()));
          expect(headers).toEqual(
            expect.objectContaining({
              'custom-api-type': 'api',
              'custom-api-route': '/api/[dynamic]',
              'custom-all-type': 'api',
              'custom-all-route': '/api/[dynamic]',
            })
          );
          expect(headers).toEqual(
            expect.not.objectContaining({
              'custom-html-type': expect.anything(),
              'custom-html-route': expect.anything(),
              'custom-error-type': expect.anything(),
              'custom-error-route': expect.anything(),
            })
          );
        });
      });

      it('`beforeHTMLResponse` and `beforeResponse` are executed for index page', async () => {
        const headers = await server
          .fetchAsync('/')
          .then((r) => Object.fromEntries(r.headers.entries()));
        expect(headers).toEqual(
          expect.objectContaining({
            'custom-html-type': 'html',
            'custom-html-route': '/index',
            'custom-all-type': 'html',
            'custom-all-route': '/index',
          })
        );
        expect(headers).toEqual(
          expect.not.objectContaining({
            'custom-api-type': expect.anything(),
            'custom-api-route': expect.anything(),
            'custom-error-type': expect.anything(),
            'custom-error-route': expect.anything(),
          })
        );
      });

      it('`beforeErrorResponse` and `beforeResponse` are executed for missing page', async () => {
        const headers = await server
          .fetchAsync('/missing')
          .then((r) => Object.fromEntries(r.headers.entries()));
        expect(headers).toEqual(
          expect.objectContaining({
            'custom-error-type': 'notFoundHtml',
            'custom-error-route': '/+not-found',
            'custom-all-type': 'notFoundHtml',
            'custom-all-route': '/+not-found',
          })
        );
        expect(headers).toEqual(
          expect.not.objectContaining({
            'custom-html-type': expect.anything(), // is only for actual HTML pages, not 404s
            'custom-html-route': expect.anything(), // is only for actual HTML pages, not 404s
            'custom-api-type': expect.anything(),
            'custom-api-route': expect.anything(),
          })
        );
      });

      it('no callbacks are executed for unhandled api errors', async () => {
        await expect(
          server.fetchAsync('/api/problematic').then((r) => Object.fromEntries(r.headers.entries()))
        ).resolves.toEqual(
          expect.not.objectContaining({
            'custom-html-type': expect.anything(),
            'custom-html-route': expect.anything(),
            'custom-api-type': expect.anything(),
            'custom-api-route': expect.anything(),
            'custom-error-type': expect.anything(),
            'custom-error-route': expect.anything(),
            'custom-all-type': expect.anything(),
            'custom-all-route': expect.anything(),
          })
        );
      });

      it('no callbacks are executed for error responses from user code', async () => {
        await expect(
          server.fetchAsync('/api/error').then((r) => Object.fromEntries(r.headers.entries()))
        ).resolves.toEqual(
          expect.not.objectContaining({
            'custom-html-type': expect.anything(),
            'custom-html-route': expect.anything(),
            'custom-api-type': expect.anything(),
            'custom-api-route': expect.anything(),
            'custom-error-type': expect.anything(),
            'custom-error-route': expect.anything(),
            'custom-all-type': expect.anything(),
            'custom-all-route': expect.anything(),
          })
        );
      });
    });

    // Tests that require exported files (not available for dev server)
    (server.isExpoStart ? describe.skip : describe)('exported files', () => {
      it(`has expected API route from array group`, async () => {
        const files = findProjectFiles(path.join(server.outputDir, 'server'));
        expect(files).toContain('_expo/functions/(a,b)/multi-group-api+api.js');
        expect(files).toContain('_expo/functions/(a,b)/multi-group-api+api.js.map');
        expect(files).not.toContain('_expo/functions/(a)/multi-group-api+api.js');
        expect(files).not.toContain('_expo/functions/(b)/multi-group-api+api.js');

        // Load the sourcemap and check that the paths are relative
        const map = JSON.parse(
          await fs.readFile(
            path.join(server.outputDir, 'server/_expo/functions/(a,b)/multi-group-api+api.js.map'),
            { encoding: 'utf8' }
          )
        );

        expect(map.sources).toContain('__e2e__/server/app/(a,b)/multi-group-api+api.ts');
      });

      it('has expected files', async () => {
        const files = findProjectFiles(path.join(server.outputDir, 'server'));

        // Has functions
        expect(files).toContain('_expo/functions/methods+api.js');
        expect(files).toContain('_expo/functions/methods+api.js.map');
        expect(files).toContain('_expo/functions/api/[dynamic]+api.js');
        expect(files).toContain('_expo/functions/api/[dynamic]+api.js.map');
        expect(files).toContain('_expo/functions/api/externals+api.js');
        expect(files).toContain('_expo/functions/api/externals+api.js.map');

        // TODO: We shouldn't export this
        expect(files).toContain('_expo/functions/api/empty+api.js');
        expect(files).toContain('_expo/functions/api/empty+api.js.map');

        // In SSR mode, no HTML files are pre-rendered - they're rendered at request time
        const serverHtmlFiles = files.filter((f) => f.endsWith('.html'));
        expect(serverHtmlFiles.length).toEqual(0);

        // SSR-specific files
        expect(files).toContain('_expo/server/render.js');
        expect(files).toContain('_expo/assets.json');
        expect(files).toContain('_expo/routes.json');
      });

      // Ensure the `/server/_expo/routes.json` contains the right file paths and named regexes.
      // This test is created to avoid and detect regressions on Windows
      it('has expected routes manifest entries', async () => {
        expect(
          await JsonFile.readAsync(path.join(server.outputDir, 'server/_expo/routes.json'))
        ).toMatchSnapshot();
      });
    });
  });
});
