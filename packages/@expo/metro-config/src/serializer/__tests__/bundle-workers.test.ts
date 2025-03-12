import { serializeShakingAsync } from '../fork/__tests__/serializer-test-utils';

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
    expect.objectContaining({
      absolutePath: '/app/c.js',
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
