import vm from 'node:vm';

import { serializeShakingAsync } from '../fork/__tests__/serializer-test-utils';
import type { SerialAsset } from '../serializerAssets';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

jest.mock('../findUpPackageJsonPath', () => ({
  findUpPackageJsonPath: jest.fn(() => null),
}));

function expectImports(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return expect([...graph.dependencies.get(name).dependencies.values()]);
}

const workerAsyncOverlapFiles = {
  'index.js': `
    import('./lib');
    import('./other');
  `,
  'lib.js': `
    const worker = require.unstable_resolveWorker('./worker');
    console.log(worker);
  `,
  'worker.js': `
    import { shared } from './shared';
    self.workerResult = shared;
  `,
  'other.js': `
    import { shared } from './shared';
    console.log(shared);
  `,
  'shared.js': `
    export const shared = 'shared-module-value';
  `,
};

function getChunkContaining(artifacts: SerialAsset[], modulePath: string): SerialAsset {
  const chunk = artifacts.find((artifact) => artifact.metadata.modulePaths?.includes(modulePath));
  expect(chunk).toBeDefined();
  return chunk!;
}

function runWorkerChunkInIsolatedContext(workerChunk: SerialAsset): unknown {
  type ModuleRecord = {
    dependencies: unknown[];
    exports: Record<string, unknown>;
    factory: (...args: any[]) => void;
    initialized: boolean;
  };

  const modules = new Map<unknown, ModuleRecord>();
  const context = vm.createContext({});
  const metroRequire = (moduleId: unknown): Record<string, unknown> => {
    const record = modules.get(moduleId);
    if (!record) {
      throw new Error(`Requiring unknown module "${String(moduleId)}".`);
    }
    if (!record.initialized) {
      record.initialized = true;
      const module = { exports: record.exports };
      const importDefault = (id: unknown) => {
        const exports = metroRequire(id);
        return exports.__esModule ? exports.default : exports;
      };
      record.factory(
        context,
        metroRequire,
        importDefault,
        metroRequire,
        module,
        module.exports,
        record.dependencies
      );
      record.exports = module.exports;
    }
    return record.exports;
  };

  Object.assign(context, {
    __d(factory: ModuleRecord['factory'], moduleId: unknown, dependencies: unknown[]) {
      modules.set(moduleId, { dependencies, exports: {}, factory, initialized: false });
    },
    TEST_RUN_MODULE: metroRequire,
  });
  context.global = context;
  context.globalThis = context;
  context.self = context;

  vm.runInContext(workerChunk.source, context, { filename: workerChunk.filename });
  return context.workerResult;
}

it(`supports worker bundle`, async () => {
  // TODO: Add actual support for eliminating code from async imports.
  const [[, , graph], artifacts] = await serializeShakingAsync(
    {
      'index.js': `
          const workerId = require.unstable_resolveWorker('./math');
          console.log('keep', worker);
        `,
      'math.js': `
          export default function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }

          export const multiply = (a, b) => a * b;
        `,
    },
    {
      splitChunks: true,
      mockRuntime: true,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    {
      absolutePath: '/app/math.js',
      data: expect.objectContaining({
        data: expect.objectContaining({
          asyncType: 'worker',
          exportNames: ['*'],
        }),
      }),
    },
    expect.objectContaining({
      absolutePath: '/app/expo-mock/async-require',
    }),
  ]);
  expect(artifacts[0].source).toMatch('runtime');
  expect(artifacts[0].source).toMatch('TEST_RUN_MODULE');
  expect(artifacts[0].source).toMatch('"paths":{"/app/math.js":"/_expo/');
  expect(artifacts[1].source).toMatch('runtime');
  expect(artifacts[1].source).toMatch('TEST_RUN_MODULE');
});

it('emits workers as standalone bundles when ordinary chunk splitting is disabled', async () => {
  const [, artifacts] = await serializeShakingAsync(
    {
      'index.js': `
        import('./async');
        const worker = require.unstable_resolveWorker('./worker');
        console.log(worker);
      `,
      'async.js': `
        console.log('ordinary async module');
      `,
      'worker.js': `
        console.log('worker module');
      `,
    },
    {
      splitChunks: false,
      mockRuntime: true,
    }
  );
  const serialAssets = artifacts as SerialAsset[];
  const entryChunk = getChunkContaining(serialAssets, '/app/index.js');
  const ordinaryAsyncChunk = getChunkContaining(serialAssets, '/app/async.js');
  const workerChunk = getChunkContaining(serialAssets, '/app/worker.js');

  expect(ordinaryAsyncChunk).toBe(entryChunk);
  expect(workerChunk.metadata.modulePaths).toEqual(['/app/worker.js']);
  expect(workerChunk).not.toBe(entryChunk);
});

it(`supports worker bundle with nested async chunk`, async () => {
  // TODO: Add actual support for eliminating code from async imports.
  const [[, , graph], artifacts] = await serializeShakingAsync(
    {
      'index.js': `
          const promise = import('./b');
          console.log('keep', promise);
        `,
      'b.js': `
          const promise = require.unstable_resolveWorker('./c');
        `,
      'c.js': `
          export const multiply = (a, b) => a * b;
        `,
    },
    {
      splitChunks: true,
      mockRuntime: true,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    {
      absolutePath: '/app/b.js',
      data: expect.objectContaining({
        data: expect.objectContaining({
          asyncType: 'async',
          exportNames: ['*'],
        }),
      }),
    },
    expect.objectContaining({
      data: expect.objectContaining({
        name: 'expo-mock/async-require',
      }),
    }),
  ]);
  expectImports(graph, '/app/b.js').toEqual([
    {
      absolutePath: '/app/c.js',
      data: expect.objectContaining({
        data: expect.objectContaining({
          asyncType: 'worker',
          exportNames: ['*'],
        }),
      }),
    },
    expect.objectContaining({
      data: expect.objectContaining({
        name: 'expo-mock/async-require',
      }),
    }),
  ]);
  expect(artifacts[0].source).toMatch('runtime');
  expect(artifacts[0].source).toMatch('TEST_RUN_MODULE');
  expect(artifacts[1].source).not.toMatch('runtime');
  expect(artifacts[1].source).not.toMatch('TEST_RUN_MODULE');
  expect(artifacts[1].source).toMatch('"paths":{"/app/c.js":"/_expo/');

  expect(artifacts[2].source).toMatch('runtime');
  expect(artifacts[2].source).toMatch('TEST_RUN_MODULE');
});

it(`supports worker bundle with shared deps`, async () => {
  // TODO: Add actual support for eliminating code from async imports.
  const [[, , graph], artifacts] = await serializeShakingAsync(
    {
      'index.js': `
        import foo from './c';
        const worker = require.unstable_resolveWorker('./b');
        console.log('keep', worker, foo);
        `,
      'b.js': `
      import foo from './c';
      console.log(foo);
        `,
      'c.js': `
          export default function add(a, b) {}
        `,
    },
    {
      splitChunks: true,
      mockRuntime: true,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/c.js',
    }),
    {
      absolutePath: '/app/b.js',
      data: expect.objectContaining({
        data: expect.objectContaining({
          asyncType: 'worker',
          exportNames: ['*'],
        }),
      }),
    },
    expect.objectContaining({
      data: expect.objectContaining({
        name: 'expo-mock/async-require',
      }),
    }),
  ]);
  expectImports(graph, '/app/b.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/c.js',
    }),
  ]);

  expect(artifacts.length).toBe(2);

  expect(artifacts[0].source).toMatch('runtime');
  expect(artifacts[0].source).toMatch('TEST_RUN_MODULE');
  expect(artifacts[0].source).toMatch('function add(a, b) {}');

  expect(artifacts[1].source).toMatch('runtime');
  expect(artifacts[1].source).toMatch('TEST_RUN_MODULE');
  expect(artifacts[1].source).toMatch('function add(a, b) {}');
});

describe('sealed worker chunks', () => {
  it('keeps a dependency shared with a page async chunk inside the worker', async () => {
    const [, artifacts] = await serializeShakingAsync(workerAsyncOverlapFiles, {
      splitChunks: true,
      mockRuntime: true,
    });
    const serialAssets = artifacts as SerialAsset[];
    const workerChunk = getChunkContaining(serialAssets, '/app/worker.js');
    const otherChunk = getChunkContaining(serialAssets, '/app/other.js');

    expect(workerChunk.metadata.modulePaths).toEqual(['/app/worker.js', '/app/shared.js']);
    expect(otherChunk.metadata.modulePaths).toEqual(['/app/other.js', '/app/shared.js']);
    expect(serialAssets.map((artifact) => artifact.filename)).not.toContainEqual(
      expect.stringContaining('__common-')
    );
  });

  it('still extracts common dependencies shared by page async chunks', async () => {
    const [, artifacts] = await serializeShakingAsync(
      {
        ...workerAsyncOverlapFiles,
        'index.js': `
          import('./lib');
          import('./other');
          import('./third');
        `,
        'third.js': `
          import { shared } from './shared';
          console.log(shared);
        `,
      },
      {
        splitChunks: true,
        mockRuntime: true,
      }
    );
    const serialAssets = artifacts as SerialAsset[];
    const workerChunk = getChunkContaining(serialAssets, '/app/worker.js');
    const otherChunk = getChunkContaining(serialAssets, '/app/other.js');
    const thirdChunk = getChunkContaining(serialAssets, '/app/third.js');
    const commonChunk = serialAssets.find((artifact) => artifact.filename.includes('__common-'));

    expect(workerChunk.metadata.modulePaths).toEqual(['/app/worker.js', '/app/shared.js']);
    expect(otherChunk.metadata.modulePaths).toEqual(['/app/other.js']);
    expect(thirdChunk.metadata.modulePaths).toEqual(['/app/third.js']);
    expect(commonChunk?.metadata.modulePaths).toEqual(['/app/shared.js']);
  });

  it('executes the emitted worker with an isolated module registry', async () => {
    const [, artifacts] = await serializeShakingAsync(workerAsyncOverlapFiles, {
      splitChunks: true,
    });
    const workerChunk = getChunkContaining(artifacts as SerialAsset[], '/app/worker.js');

    expect(runWorkerChunkInIsolatedContext(workerChunk)).toBe('shared-module-value');
  });
});
