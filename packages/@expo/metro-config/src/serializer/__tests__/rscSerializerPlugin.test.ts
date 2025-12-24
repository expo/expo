/**
 * RSC Serializer Plugin Tests
 *
 * Tests deferred stable ID resolution during serialization.
 *
 * @see https://github.com/expo/expo/pull/41823#issuecomment-3689889651
 */

import { captureSpecifier, clearRegistry } from '../../rscRegistry';
import { createRscSerializerPlugin, getRscStableIdToModuleId } from '../rscSerializerPlugin';

// Mock module types
type MockModule = {
  output: Array<{
    data: {
      reactClientReference?: string;
      reactServerReference?: string;
    };
  }>;
};

type MockGraph = {
  dependencies: Map<string, MockModule>;
  transformOptions?: {
    customTransformOptions?: Record<string, any>;
  };
};

describe('rscSerializerPlugin', () => {
  const projectRoot = '/project';

  beforeEach(() => {
    clearRegistry();
  });

  function createMockGraph(modules: Record<string, MockModule>): MockGraph {
    return {
      dependencies: new Map(Object.entries(modules)),
      transformOptions: {
        customTransformOptions: {},
      },
    };
  }

  function createMockOptions() {
    let moduleIdCounter = 0;
    return {
      createModuleId: (path: string) => ++moduleIdCounter,
    };
  }

  describe('deferred ID resolution', () => {
    it('resolves deferred client reference to captured specifier', async () => {
      // Setup: capture the specifier during resolution
      captureSpecifier('/project/node_modules/pkg/client.js', 'pkg/client');

      const graph = createMockGraph({
        '/project/node_modules/pkg/client.js': {
          output: [
            {
              data: {
                reactClientReference: '__RSC_DEFERRED__:/project/node_modules/pkg/client.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      // Verify the deferred ID was resolved
      const module = graph.dependencies.get('/project/node_modules/pkg/client.js')!;
      expect(module.output[0].data.reactClientReference).toBe('pkg/client');
    });

    it('resolves deferred server reference to captured specifier', async () => {
      captureSpecifier('/project/node_modules/pkg/actions.js', 'pkg/actions');

      const graph = createMockGraph({
        '/project/node_modules/pkg/actions.js': {
          output: [
            {
              data: {
                reactServerReference: '__RSC_DEFERRED__:/project/node_modules/pkg/actions.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/node_modules/pkg/actions.js')!;
      expect(module.output[0].data.reactServerReference).toBe('pkg/actions');
    });

    it('falls back to relative path when specifier not captured', async () => {
      // No captureSpecifier call - simulates edge case

      const graph = createMockGraph({
        '/project/node_modules/unknown/client.js': {
          output: [
            {
              data: {
                reactClientReference: '__RSC_DEFERRED__:/project/node_modules/unknown/client.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/node_modules/unknown/client.js')!;
      // Falls back to relative path
      expect(module.output[0].data.reactClientReference).toBe(
        './node_modules/unknown/client.js'
      );
    });
  });

  describe('non-deferred ID handling', () => {
    it('preserves app-level relative paths', async () => {
      const graph = createMockGraph({
        '/project/src/Button.js': {
          output: [
            {
              data: {
                reactClientReference: './src/Button.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/src/Button.js')!;
      // Should not be modified
      expect(module.output[0].data.reactClientReference).toBe('./src/Button.js');
    });
  });

  describe('stable ID to module ID mapping', () => {
    it('builds correct mapping for SSR manifest', async () => {
      captureSpecifier('/project/node_modules/pkg/client.js', 'pkg/client');
      captureSpecifier('/project/node_modules/@scope/lib/Button.js', '@scope/lib/Button');

      const graph = createMockGraph({
        '/project/node_modules/pkg/client.js': {
          output: [
            {
              data: {
                reactClientReference: '__RSC_DEFERRED__:/project/node_modules/pkg/client.js',
              },
            },
          ],
        },
        '/project/node_modules/@scope/lib/Button.js': {
          output: [
            {
              data: {
                reactClientReference:
                  '__RSC_DEFERRED__:/project/node_modules/@scope/lib/Button.js',
              },
            },
          ],
        },
        '/project/src/MyComponent.js': {
          output: [
            {
              data: {
                reactClientReference: './src/MyComponent.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const mapping = getRscStableIdToModuleId(graph as any);

      expect(mapping['pkg/client']).toBeDefined();
      expect(mapping['@scope/lib/Button']).toBeDefined();
      expect(mapping['./src/MyComponent.js']).toBeDefined();
    });
  });

  // ============================================================================
  // Issue 1: Non-Hoisted Node Modules (pnpm)
  // ============================================================================
  describe('Issue 1: pnpm resolution', () => {
    it('resolves pnpm nested paths to correct specifier', async () => {
      const pnpmPath =
        '/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js';

      captureSpecifier(pnpmPath, 'react-dom/client');

      const graph = createMockGraph({
        [pnpmPath]: {
          output: [
            {
              data: {
                reactClientReference: `__RSC_DEFERRED__:${pnpmPath}`,
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(pnpmPath)!;
      expect(module.output[0].data.reactClientReference).toBe('react-dom/client');
    });

    it('handles multiple pnpm nested packages', async () => {
      const paths = {
        a: '/project/node_modules/.pnpm/a@1.0.0/node_modules/a/client.js',
        b: '/project/node_modules/.pnpm/b@2.0.0/node_modules/b/client.js',
        c: '/project/node_modules/.pnpm/c@3.0.0/node_modules/c/client.js',
      };

      captureSpecifier(paths.a, 'a/client');
      captureSpecifier(paths.b, 'b/client');
      captureSpecifier(paths.c, 'c/client');

      const graph = createMockGraph({
        [paths.a]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${paths.a}` } }],
        },
        [paths.b]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${paths.b}` } }],
        },
        [paths.c]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${paths.c}` } }],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      expect(graph.dependencies.get(paths.a)!.output[0].data.reactClientReference).toBe(
        'a/client'
      );
      expect(graph.dependencies.get(paths.b)!.output[0].data.reactClientReference).toBe(
        'b/client'
      );
      expect(graph.dependencies.get(paths.c)!.output[0].data.reactClientReference).toBe(
        'c/client'
      );
    });
  });

  // ============================================================================
  // Issue 2: package.json:exports
  // ============================================================================
  describe('Issue 2: package.json exports', () => {
    it('resolves exports-mapped path to specifier', async () => {
      // exports: { "./client": "./dist/esm/client/index.mjs" }
      const exportsPath = '/project/node_modules/pkg/dist/esm/client/index.mjs';

      captureSpecifier(exportsPath, 'pkg/client');

      const graph = createMockGraph({
        [exportsPath]: {
          output: [
            {
              data: {
                reactClientReference: `__RSC_DEFERRED__:${exportsPath}`,
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(exportsPath)!;
      // Should use specifier, not file path
      expect(module.output[0].data.reactClientReference).toBe('pkg/client');
    });

    it('handles conditional exports with same specifier', async () => {
      // Both paths map to same specifier but different conditions
      const rscPath = '/project/node_modules/pkg/dist/rsc/client.js';
      const defaultPath = '/project/node_modules/pkg/dist/default/client.js';

      captureSpecifier(rscPath, 'pkg/client');
      captureSpecifier(defaultPath, 'pkg/client');

      const graph = createMockGraph({
        [rscPath]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${rscPath}` } }],
        },
        [defaultPath]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${defaultPath}` } }],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      // Both should resolve to same specifier
      expect(graph.dependencies.get(rscPath)!.output[0].data.reactClientReference).toBe(
        'pkg/client'
      );
      expect(graph.dependencies.get(defaultPath)!.output[0].data.reactClientReference).toBe(
        'pkg/client'
      );
    });
  });

  // ============================================================================
  // Issue 3: Metro vs Node Resolution
  // ============================================================================
  describe('Issue 3: Metro vs Node resolution', () => {
    it('handles Metro react-native field resolution', async () => {
      // Metro resolved to react-native field instead of main
      const metroPath = '/project/node_modules/pkg/dist/native/index.js';

      captureSpecifier(metroPath, 'pkg');

      const graph = createMockGraph({
        [metroPath]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${metroPath}` } }],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(metroPath)!;
      expect(module.output[0].data.reactClientReference).toBe('pkg');
    });

    it('handles platform-specific resolution (.native.js)', async () => {
      const nativePath = '/project/node_modules/pkg/Button.native.js';

      captureSpecifier(nativePath, 'pkg/Button');

      const graph = createMockGraph({
        [nativePath]: {
          output: [{ data: { reactClientReference: `__RSC_DEFERRED__:${nativePath}` } }],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(nativePath)!;
      expect(module.output[0].data.reactClientReference).toBe('pkg/Button');
    });
  });

  // ============================================================================
  // Integration scenarios
  // ============================================================================
  describe('integration: mixed boundaries', () => {
    it('handles mix of app-level and node_modules boundaries', async () => {
      captureSpecifier('/project/node_modules/ui-lib/Button.js', 'ui-lib/Button');

      const graph = createMockGraph({
        // App-level (not deferred)
        '/project/src/components/Header.js': {
          output: [{ data: { reactClientReference: './src/components/Header.js' } }],
        },
        // Node module (deferred)
        '/project/node_modules/ui-lib/Button.js': {
          output: [
            {
              data: {
                reactClientReference:
                  '__RSC_DEFERRED__:/project/node_modules/ui-lib/Button.js',
              },
            },
          ],
        },
        // Another app-level
        '/project/src/components/Footer.js': {
          output: [{ data: { reactClientReference: './src/components/Footer.js' } }],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      // App-level preserved
      expect(
        graph.dependencies.get('/project/src/components/Header.js')!.output[0].data
          .reactClientReference
      ).toBe('./src/components/Header.js');

      // Node module resolved
      expect(
        graph.dependencies.get('/project/node_modules/ui-lib/Button.js')!.output[0].data
          .reactClientReference
      ).toBe('ui-lib/Button');

      // Another app-level preserved
      expect(
        graph.dependencies.get('/project/src/components/Footer.js')!.output[0].data
          .reactClientReference
      ).toBe('./src/components/Footer.js');

      // Mapping includes all
      const mapping = getRscStableIdToModuleId(graph as any);
      expect(Object.keys(mapping).length).toBe(3);
    });

    it('handles both client and server references in same module', async () => {
      captureSpecifier('/project/node_modules/pkg/boundary.js', 'pkg/boundary');

      const graph = createMockGraph({
        '/project/node_modules/pkg/boundary.js': {
          output: [
            {
              data: {
                reactClientReference:
                  '__RSC_DEFERRED__:/project/node_modules/pkg/boundary.js',
                reactServerReference:
                  '__RSC_DEFERRED__:/project/node_modules/pkg/boundary.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/node_modules/pkg/boundary.js')!;
      expect(module.output[0].data.reactClientReference).toBe('pkg/boundary');
      expect(module.output[0].data.reactServerReference).toBe('pkg/boundary');
    });
  });
});
