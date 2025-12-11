/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports middleware', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
      fixtureName: 'server-middleware-async',
      export: {
        env: {
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            { source: '/redirect', destination: 'https://expo.dev' },
          ]),
          E2E_ROUTER_REWRITES: JSON.stringify([{ source: '/rewrite', destination: '/second' }]),
          E2E_ROUTER_SERVER_MIDDLEWARE: 'true',
        },
        cliFlags: ['--source-maps'],
      },
      serve: {
        env: { TEST_SECRET_KEY: 'test-secret-key' },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it(`can serve up index html`, async () => {
      expect(await server.fetchAsync('/').then((res) => res.text())).toMatch(/<div id="root">/);
    });

    it(`gets a 404`, async () => {
      expect(await server.fetchAsync('/missing-route').then((res) => res.status)).toBe(404);
    });

    // NOTE(@krystofwoldrich): Bare workerd doesn't support process.env
    (server.isWorkerd ? it.skip : it)('can use environment variables', async () => {
      const response = await server.fetchAsync('/?e2e=read-env').then((res) => res.json());
      expect(response['TEST_SECRET_KEY']).toEqual('test-secret-key');
    });

    it('can perform dynamic redirects', async () => {
      const html = await server
        .fetchAsync('/?e2e=redirect')
        .then((res) => res.text())
        .then(getHtml);
      const title = html.querySelector('[data-testid="title"]')?.textContent;
      expect(title).toEqual('Second');
    });

    it('can perform dynamic redirects with a status code', async () => {
      const response = await server.fetchAsync('/?e2e=redirect-301', { redirect: 'manual' });
      expect(response.status).toBe(301);
      const url = new URL(response.headers.get('location')!);
      expect(url.pathname).toEqual('/second');
    });

    it('returns HTTP status 500 when middleware throws for a HTML route', async () => {
      const response = await server.fetchAsync('/?e2e=error');
      expect(response.status).toBe(500);
    });

    it('returns HTTP status 500 when middleware throws for an API route', async () => {
      const response = await server.fetchAsync('/api?e2e=error');
      expect(response.status).toBe(500);
    });

    it('can override responses', async () => {
      const html = await server
        .fetchAsync('/?e2e=custom-response')
        .then((res) => res.text())
        .then(getHtml);
      const title = html.querySelector('[data-testid="title"]')?.textContent;
      expect(title).toBe('Custom response from middleware');
    });

    it('runs the middleware before redirects', async () => {
      const html = await server
        .fetchAsync('/redirect?e2e=custom-response')
        .then((res) => res.text())
        .then(getHtml);
      const title = html.querySelector('[data-testid="title"]')?.textContent;
      expect(title).toBe('Custom response from middleware');
    });

    it('runs the middleware before rewrites', async () => {
      const html = await server
        .fetchAsync('/rewrite?e2e=custom-response')
        .then((res) => res.text())
        .then(getHtml);
      const title = html.querySelector('[data-testid="title"]')?.textContent;
      expect(title).toBe('Custom response from middleware');
    });

    // NOTE(@krystofwoldrich): Importing jose in workerd crashes the server
    // Illegal invocation: function called with incorrect `this` reference.
    (server.isWorkerd ? it.skip : it)('runs third-party libraries like jose', async () => {
      const signJwtResponse = await server.fetchAsync('/?e2e=sign-jwt').then((res) => res.json());
      expect(signJwtResponse).toHaveProperty('token');

      const verifyJwtResponse = await server
        .fetchAsync('/?e2e=verify-jwt', {
          headers: { Authorization: signJwtResponse.token },
        })
        .then((res) => res.json());

      expect(verifyJwtResponse.payload).toHaveProperty('foo', 'bar');
    });

    it('has expected files', async () => {
      const files = findProjectFiles(server.outputDir);

      // The wrapper should not be included as a route.
      expect(files).not.toContain('+html.html');
      expect(files).not.toContain('_layout.html');

      // In server mode, HTML files are in the server directory
      expect(files).toContain('server/_sitemap.html');
      expect(files).toContain('server/+not-found.html');
      expect(files).toContain('server/index.html');

      // Middleware should be bundled and referenced in routes.json
      expect(files).toContain('server/_expo/functions/+middleware.js');
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      );
      expect(routesJson.middleware).toBeDefined();
      expect(routesJson.middleware.file).toBe('_expo/functions/+middleware.js');
    });

    it('has source maps', async () => {
      const files = findProjectFiles(server.outputDir);

      const middlewareMapFile = 'server/_expo/functions/+middleware.js.map';
      expect(files).toContain(middlewareMapFile);

      // Load the sourcemap and check that the paths are relative
      const sourceMap = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, middlewareMapFile), 'utf8')
      );
      expect(sourceMap.sources).toContain('__e2e__/server-middleware-async/app/+middleware.ts');
    });
  });
});

describe('skips middleware when flag is disabled', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-server-middleware-disabled';
  const outputDir = path.join(projectRoot, outputName);

  it('does not export middleware when unstable_useServerMiddleware is not enabled', async () => {
    const results = await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server-middleware-async',
        },
      }
    );

    expect(results.stderr).toContain('Server middleware is not enabled.');

    const files = findProjectFiles(outputDir);

    // Middleware should not be bundled or referenced in routes.json
    expect(files).not.toContain('server/_expo/functions/+middleware.js');
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(outputDir, 'server/_expo/routes.json'), 'utf8')
    );
    expect(routesJson.middleware).not.toBeDefined();
  });
});
