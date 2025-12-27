/**
 * RSC Serializer Plugin Tests
 *
 * Tests output key resolution and module map building during serialization.
 */

import { clearRegistry } from '../../rscRegistry';
import { createRscSerializerPlugin, getRscOutputKeyToModuleId } from '../rscSerializerPlugin';

// Mock module types
type MockModule = {
  output: {
    data: {
      code?: string;
      reactClientReference?: string;
      reactServerReference?: string;
    };
  }[];
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

  describe('file:// URL to output key conversion', () => {
    it('converts file:// URL client reference to output key', async () => {
      const graph = createMockGraph({
        '/project/node_modules/pkg/client.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/node_modules/pkg/client.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/node_modules/pkg/client.js')!;
      expect(module.output[0].data.reactClientReference).toBe('./node_modules/pkg/client.js');
    });

    it('converts file:// URL server reference to output key', async () => {
      const graph = createMockGraph({
        '/project/node_modules/pkg/actions.js': {
          output: [
            {
              data: {
                reactServerReference: 'file:///project/node_modules/pkg/actions.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/node_modules/pkg/actions.js')!;
      expect(module.output[0].data.reactServerReference).toBe('./node_modules/pkg/actions.js');
    });

    it('keeps existing output keys unchanged', async () => {
      const graph = createMockGraph({
        '/project/src/Button.js': {
          output: [
            {
              data: {
                // Already an output key (relative path)
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
      expect(module.output[0].data.reactClientReference).toBe('./src/Button.js');
    });
  });

  describe('app-level files', () => {
    it('converts app-level file:// URLs to relative paths', async () => {
      const graph = createMockGraph({
        '/project/src/Button.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/src/Button.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get('/project/src/Button.js')!;
      expect(module.output[0].data.reactClientReference).toBe('./src/Button.js');
    });
  });

  describe('output key to module ID mapping', () => {
    it('builds correct mapping for SSR manifest', async () => {
      const graph = createMockGraph({
        '/project/node_modules/pkg/client.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/node_modules/pkg/client.js',
              },
            },
          ],
        },
        '/project/node_modules/@scope/lib/Button.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/node_modules/@scope/lib/Button.js',
              },
            },
          ],
        },
        '/project/src/MyComponent.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/src/MyComponent.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const mapping = getRscOutputKeyToModuleId(graph as any);

      expect(mapping['./node_modules/pkg/client.js']).toBeDefined();
      expect(mapping['./node_modules/@scope/lib/Button.js']).toBeDefined();
      expect(mapping['./src/MyComponent.js']).toBeDefined();
    });
  });

  describe('pnpm normalization', () => {
    it('normalizes pnpm nested paths to standard node_modules paths', async () => {
      const pnpmPath =
        '/project/node_modules/.pnpm/react-dom@18.2.0/node_modules/react-dom/client.js';

      const graph = createMockGraph({
        [pnpmPath]: {
          output: [
            {
              data: {
                reactClientReference: `file://${pnpmPath}`,
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(pnpmPath)!;
      // pnpm path should be normalized
      expect(module.output[0].data.reactClientReference).toBe('./node_modules/react-dom/client.js');
    });

    it('handles scoped packages in pnpm', async () => {
      const pnpmPath =
        '/project/node_modules/.pnpm/@scope+pkg@1.0.0/node_modules/@scope/pkg/index.js';

      const graph = createMockGraph({
        [pnpmPath]: {
          output: [
            {
              data: {
                reactClientReference: `file://${pnpmPath}`,
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const module = graph.dependencies.get(pnpmPath)!;
      expect(module.output[0].data.reactClientReference).toBe('./node_modules/@scope/pkg/index.js');
    });
  });

  describe('virtual rsc.js module placeholder', () => {
    it('replaces __RSC_BOUNDARIES_PLACEHOLDER__ with module map', async () => {
      const graph = createMockGraph({
        '/project/node_modules/expo/virtual/rsc.js': {
          output: [
            {
              data: {
                code: 'module.exports = {__RSC_BOUNDARIES_PLACEHOLDER__: true, __BOUNDARY_PATHS__: []}',
              },
            },
          ],
        },
        '/project/src/Button.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/src/Button.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const rscModule = graph.dependencies.get('/project/node_modules/expo/virtual/rsc.js')!;
      const code = rscModule.output[0].data.code!;

      // Should contain the module map
      expect(code).not.toContain('__RSC_BOUNDARIES_PLACEHOLDER__');
      expect(code).toContain('./src/Button.js');
      expect(code).toContain('__r(');
    });
  });

  describe('mixed references', () => {
    it('handles modules with both client and server references', async () => {
      const graph = createMockGraph({
        '/project/src/actions.js': {
          output: [
            {
              data: {
                reactServerReference: 'file:///project/src/actions.js',
              },
            },
          ],
        },
        '/project/src/Button.js': {
          output: [
            {
              data: {
                reactClientReference: 'file:///project/src/Button.js',
              },
            },
          ],
        },
      });

      const plugin = createRscSerializerPlugin({ projectRoot });
      const options = createMockOptions();

      await plugin('entry.js', [], graph as any, options as any);

      const mapping = getRscOutputKeyToModuleId(graph as any);
      expect(Object.keys(mapping).length).toBe(2);
      expect(mapping['./src/actions.js']).toBeDefined();
      expect(mapping['./src/Button.js']).toBeDefined();
    });
  });
});
