/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { executeAsync, processFindPrefixedValue } from '../../utils/process';
import { BackgroundServer, createBackgroundServer } from '../../utils/server';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

const EXPRESS_SERVER = 'expo serve server';
const WORKERD_SERVER = 'workerd server';
const inputDir = 'server-headers';

describe('export server with custom headers', () => {
  const projectRoot = getRouterE2ERoot();

  describe.each([
    {
      name: EXPRESS_SERVER,
      prepareDist: async () => {
        const outputName = `dist-${inputDir}-expo-serve`;
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'server',
            E2E_ROUTER_SRC: inputDir,
            E2E_ROUTER_HEADERS: JSON.stringify({
              'X-Powered-By': 'expo-server',
              'Set-Cookie': ['hello=world', 'foo=bar'],
              'Content-Type': 'application/pdf',
            }),
            E2E_ROUTER_REWRITES: JSON.stringify([
              {
                source: '/rewrite/api',
                destination: '/api',
              },
            ]),
          },
        });

        return [outputDir, outputName];
      },
      createServer: () =>
        createExpoServe({
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
          },
        }),
    },
    {
      name: WORKERD_SERVER,
      prepareDist: async () => {
        const outputName = `dist-${inputDir}-workerd`;
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'server',
            E2E_ROUTER_SRC: inputDir,
            E2E_ROUTER_HEADERS: JSON.stringify({
              'X-Powered-By': 'expo-server',
              'Set-Cookie': ['hello=world', 'foo=bar'],
              'Content-Type': 'application/pdf',
            }),
            E2E_ROUTER_REWRITES: JSON.stringify([
              {
                source: '/rewrite/api',
                destination: '/api',
              },
            ]),
          },
        });

        await executeAsync(projectRoot, [
          'node_modules/.bin/esbuild',
          '--bundle',
          '--format=esm',
          '--platform=node',
          `--outfile=${path.join(outputDir, 'server/workerd.js')}`,
          path.join(projectRoot, '__e2e__/server-headers/workerd/workerd.mjs'),
        ]);
        fs.copyFileSync(
          path.join(projectRoot, '__e2e__/server-headers/workerd/config.capnp'),
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
              path.join(projectRoot, `dist-${inputDir}-workerd`),
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

    it('includes headers in routes.json manifest', () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.resolve(outputDir!, 'server/_expo/routes.json'), 'utf8')
      );
      expect(routesJson.headers).toEqual({
        'X-Powered-By': 'expo-server',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      });
    });

    it.each([
      {
        path: '/',
        status: 200,
        contentType: 'text/html',
      },
      {
        path: '/api',
        status: 200,
        contentType: 'application/json',
      },
      {
        path: '/rewrite/api',
        status: 200,
        contentType: 'application/json',
      },
      {
        path: '/not-a-route',
        status: 404,
        contentType: 'text/html',
      },
    ])('applies custom headers to $path', async ({ path, status, contentType }) => {
      const response = await serverFetchAsync(path);

      expect(response.status).toBe(status);

      // Check that existing Content-Type header is not overridden
      expect(response.headers.get('Content-Type')).toBe(contentType);

      // Check single-value custom header
      expect(response.headers.get('X-Powered-By')).toBe('expo-server');

      // Check array-value custom headers
      expect(response.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
    });
  });
});
