/* eslint-env jest */
import type { RoutesManifest } from 'expo-server/private';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles } from '../utils';

runExportSideEffects();

describe('server rendering with async routes', () => {
  describe.each(
    // NOTE: This test only looks at the exported files, so there's no need for multiple runtimes
    prepareServers([RUNTIME_EXPO_SERVE], {
      fixtureName: 'static-rendering',
      uniqueOutputKey: 'server-rendering-async',
      export: {
        env: {
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_ASYNC: 'true',
          E2E_ROUTER_SERVER_RENDERING: 'true',
        },
      },
      serve: {
        env: {
          TEST_SECRET_KEY: 'test-secret-key',
        },
      },
    })
  )('$name', (config) => {
    const server = setupServer(config);

    it('has expected files', async () => {
      const files = findProjectFiles(path.join(server.outputDir, 'server'));

      // SSR mode should have server directory with render module
      expect(files).toContain('_expo/server/render.js');
      expect(files).toContain('_expo/routes.json');

      // HTML routes should NOT be pre-rendered in SSR mode
      expect(files).not.toContain('index.html');
      expect(files).not.toContain('about.html');
      expect(files).not.toContain('styled.html');
    });

    it('has top-level assets for sync chunks', async () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      ) as RoutesManifest<string>;

      expect(routesJson.assets).toBeDefined();

      const jsFilenames = routesJson.assets!.js.map((path: string) => {
        const filename = path.split('/').pop()!;
        return filename.replace(/-[a-f0-9]{20,}\.js$/, '-<HASH>.js');
      });

      expect(jsFilenames).toEqual([
        '__expo-metro-runtime-<HASH>.js',
        '__common-<HASH>.js',
        'entry-<HASH>.js',
      ]);
    });

    it('has per-route assets for async chunks', async () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      ) as RoutesManifest<string>;

      const routesWithAssets = routesJson.htmlRoutes.filter(
        (route) => route.assets && route.assets.js.length > 0 && !route.generated
      );
      expect(routesWithAssets.length).toBeGreaterThan(0);

      for (const route of routesWithAssets) {
        const jsFilenames = route.assets!.js.map((path: string) => {
          const filename = path.split('/').pop()!;
          return filename.replace(/-[a-f0-9]{20,}\.js$/, '-<HASH>.js');
        });

        const routeName = route.page.replace('/', '');
        expect(jsFilenames).toEqual(
          expect.arrayContaining(['_layout-<HASH>.js', `${routeName}-<HASH>.js`])
        );
      }
    });
  });
});
