/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { executeAsync, processFindPrefixedValue } from '../../utils/process';
import { BackgroundServer, createBackgroundServer } from '../../utils/server';
import { findProjectFiles, getHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

const EXPRESS_SERVER = 'expo serve server';
const WORKERD_SERVER = 'workerd server';

describe('exports middleware', () => {
  const projectRoot = getRouterE2ERoot();

  describe.each([
    {
      name: EXPRESS_SERVER,
      prepareDist: async () => {
        const outputName = 'dist-server-middleware-async-expo-serve';
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(
          projectRoot,
          ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
          {
            env: {
              NODE_ENV: 'production',
              EXPO_USE_STATIC: 'server',
              E2E_ROUTER_SRC: 'server-middleware-async',
              E2E_ROUTER_REDIRECTS: JSON.stringify([
                { source: '/redirect', destination: 'https://expo.dev' },
              ]),
              E2E_ROUTER_REWRITES: JSON.stringify([{ source: '/rewrite', destination: '/second' }]),
              E2E_ROUTER_SERVER_MIDDLEWARE: 'true',
            },
          }
        );

        return [outputDir, outputName];
      },
      createServer: () =>
        createExpoServe({
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            TEST_SECRET_KEY: 'test-secret-key',
          },
        }),
    },
    {
      name: WORKERD_SERVER,
      prepareDist: async () => {
        const outputName = 'dist-server-middleware-async-workerd';
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(
          projectRoot,
          ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
          {
            env: {
              NODE_ENV: 'production',
              EXPO_USE_STATIC: 'server',
              E2E_ROUTER_SRC: 'server-middleware-async',
              E2E_ROUTER_REDIRECTS: JSON.stringify([
                { source: '/redirect', destination: 'https://expo.dev' },
              ]),
              E2E_ROUTER_REWRITES: JSON.stringify([{ source: '/rewrite', destination: '/second' }]),
              E2E_ROUTER_SERVER_MIDDLEWARE: 'true',
            },
          }
        );

        await executeAsync(projectRoot, [
          'node_modules/.bin/esbuild',
          '--bundle',
          '--format=esm',
          `--outfile=${path.join(outputDir, 'server/workerd.js')}`,
          path.join(projectRoot, '__e2e__/server-middleware-async/workerd/workerd.mjs'),
        ]);
        fs.copyFileSync(
          path.join(projectRoot, '__e2e__/server-middleware-async/workerd/config.capnp'),
          path.join(outputDir, 'server/config.capnp')
        );

        return [outputDir];
      },
      createServer: () =>
        createBackgroundServer({
          command: [
            'node_modules/.bin/workerd',
            'serve',
            path.join(
              path.join(projectRoot, 'dist-server-middleware-async-workerd'),
              'server/config.capnp'
            ),
          ],
          host: (chunk: any) => processFindPrefixedValue(chunk, 'Workerd server listening'),
          port: 8787,
          cwd: projectRoot,
        }),
    },
  ] as {
    name: string;
    createServer: () => BackgroundServer;
    prepareDist: () => Promise<[string, string?]>;
  }[])('$name requests', ({ name: _name, createServer, prepareDist }) => {
    let outputDir: string | undefined;
    let server: BackgroundServer;
    beforeAll(async () => {
      const [newOutputDir, outputName] = await prepareDist();
      outputDir = newOutputDir;
      server = createServer();
      // Start a server instance that we can test against then kill it.
      if (outputName) {
        await server.startAsync([outputName]);
      } else {
        await server.startAsync();
      }
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    const serverFetchAsync = (url: string, init?: RequestInit) => {
      return server.fetchAsync(url, init, { attempts: 7 });
    };

    it(`can serve up index html`, async () => {
      expect(await serverFetchAsync('/').then((res) => res.text())).toMatch(/<div id="root">/);
    });

    it(`gets a 404`, async () => {
      expect(await serverFetchAsync('/missing-route').then((res) => res.status)).toBe(404);
    });

    if (_name !== WORKERD_SERVER) {
      // NOTE(@krystofwoldrich): Bare workerd doesn't support process.env
      it('can use environment variables', async () => {
        const response = await serverFetchAsync('/?e2e=read-env').then((res) => res.json());
        expect(response['TEST_SECRET_KEY']).toEqual('test-secret-key');
      });
    }

    it('can perform dynamic redirects', async () => {
      const html = await server
        .fetchAsync('/?e2e=redirect')
        .then((res) => res.text())
        .then(getHtml);
      const title = html.querySelector('[data-testid="title"]')?.textContent;
      expect(title).toEqual('Second');
    });

    it('can perform dynamic redirects with a status code', async () => {
      const response = await serverFetchAsync('/?e2e=redirect-301', {
        redirect: 'manual',
      });
      expect(response.status).toBe(301);

      const url = new URL(response.headers.get('location')!);
      expect(url.pathname).toEqual('/second');
    });

    it('returns HTTP status 500 when middleware throws for a HTML route', async () => {
      const response = await serverFetchAsync('/?e2e=error');
      expect(response.status).toBe(500);
    });

    it('returns HTTP status 500 when middleware throws for an API route', async () => {
      const response = await serverFetchAsync('/api?e2e=error');
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

    if (_name !== WORKERD_SERVER) {
      // NOTE(@krystofwoldrich): Importing jose in workerd crashes the server
      // Illegal invocation: function called with incorrect `this` reference.
      it('runs third-party libraries like jose', async () => {
        const signJwtResponse = await serverFetchAsync('/?e2e=sign-jwt').then((res) => res.json());
        expect(signJwtResponse).toHaveProperty('token');

        const verifyJwtResponse = await server
          .fetchAsync('/?e2e=verify-jwt', {
            headers: {
              Authorization: signJwtResponse.token,
            },
          })
          .then((res) => res.json());

        expect(verifyJwtResponse.payload).toHaveProperty('foo', 'bar');
      });
    }

    it('has expected files', async () => {
      const files = findProjectFiles(outputDir!);

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
        fs.readFileSync(path.join(outputDir!, 'server/_expo/routes.json'), 'utf8')
      );
      expect(routesJson.middleware).toBeDefined();
      expect(routesJson.middleware.file).toBe('_expo/functions/+middleware.js');
    });

    it('has source maps', async () => {
      const files = findProjectFiles(outputDir!);

      const middlewareMapFile = 'server/_expo/functions/+middleware.js.map';
      expect(files).toContain(middlewareMapFile);

      // Load the sourcemap and check that the paths are relative
      const sourceMap = JSON.parse(
        fs.readFileSync(path.join(outputDir!, middlewareMapFile), 'utf8')
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
