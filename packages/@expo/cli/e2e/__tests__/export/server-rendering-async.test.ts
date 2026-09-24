import type { RoutesManifest } from 'expo-server/private';
import fs from 'node:fs';
import path from 'node:path';

import { prepareServers, RUNTIME_EXPO_SERVE, setupServer } from '../../utils/runtime';
import { findProjectFiles } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('server rendering with async routes', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE], {
      fixtureName: 'static-rendering',
      uniqueOutputKey: 'server-rendering-async',
      export: {
        env: {
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_ASYNC: 'true',
          E2E_ROUTER_SPLIT_STRATEGY: 'bitset',
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

    it('keeps only the runtime in top-level JavaScript assets', async () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      ) as RoutesManifest<string>;

      expect(routesJson.assets).toBeDefined();

      const jsFilenames = routesJson.assets!.js.map((path: string) => {
        const filename = path.split('/').pop()!;
        return filename.replace(/-[a-f0-9]{20,}\.js$/, '-<HASH>.js');
      });

      expect(jsFilenames).toEqual(['__expo-metro-runtime-<HASH>.js']);
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

        const routeName = path.basename(route.page);
        expect(jsFilenames).not.toContain('__expo-metro-runtime-<HASH>.js');
        expect(jsFilenames.at(-1)).toBe('entry-<HASH>.js');
        expect(jsFilenames).toEqual(
          expect.arrayContaining(['_layout-<HASH>.js', `${routeName}-<HASH>.js`])
        );
        expect(jsFilenames.some((filename) => filename.startsWith('__shared-'))).toBe(true);
        expect(new Set(jsFilenames).size).toBe(jsFilenames.length);
      }
    });

    it('provides entry scripts for every HTML and not-found route', async () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      ) as RoutesManifest<string>;

      expect(routesJson.notFoundRoutes.length).toBeGreaterThan(0);
      for (const route of [...routesJson.htmlRoutes, ...routesJson.notFoundRoutes]) {
        expect(route.assets?.js.at(-1)).toMatch(/\/entry-[a-f0-9]+\.js$/);
        const scripts = [...routesJson.assets!.js, ...route.assets!.js];
        expect(new Set(scripts).size).toBe(scripts.length);
      }
    });

    it.each([
      ['/about', 200],
      ['/welcome-to-the-universe', 200],
      ['/catch-all/hello/world', 200],
      ['/missing/deep', 404],
    ])('serves %s with runtime first and entry last', async (pathname, status) => {
      const response = await server.fetchAsync(pathname);
      expect(response.status).toBe(status);
      const html = await response.text();
      const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((match) => match[1]!);
      expect(scripts[0]).toMatch(/\/__expo-metro-runtime-[a-f0-9]+\.js$/);
      expect(scripts.at(-1)).toMatch(/\/entry-[a-f0-9]+\.js$/);
      expect(new Set(scripts).size).toBe(scripts.length);
    });
  });
});
