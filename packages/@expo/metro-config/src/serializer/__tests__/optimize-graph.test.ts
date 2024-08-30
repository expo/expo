import { expectImports, serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

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

it(`using unreferenced import inside other module`, async () => {
  // Event though subtract is not imported inside any other module it is still
  // used inside of the math module, therefore it cannot be pruned.
  const [[, , graph], artifacts] = await serializeOptimizeAsync({
    'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
        `,
    'math.js': `
          export function add(a, b) {
            return subtract(a, b);
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
  });

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
  expect(artifacts[0].source).toMatch('subtract');
});

it(`circular`, async () => {
  const [[, , graph], artifacts] = await serializeOptimizeAsync({
    'index.js': `
import { run } from "./b";
console.log('keep', run(1, 2));
            `,
    'b.js': `
export const bar = "bar";
export { run } from "./c";
`,
    'c.js': `
import { bar } from "./b";
export const run = () => 'c:' + bar;
            `,
  });

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/b.js' }),
  ]);
  expectImports(graph, '/app/b.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/c.js' }),
  ]);
  expectImports(graph, '/app/c.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/b.js' }),
  ]);
  expect(artifacts[0].source).toMatch('bar');
  expect(artifacts[0].source).toMatch('run');
});

it(`supports multiple imports to the same module`, async () => {
  // Based on expo-linking
  const [[, , graph], artifacts] = await serializeOptimizeAsync({
    'index.js': `
import * as Linking from "./a";
console.log('keep', Linking.parse());
            `,
    'a.js': `
    import { parse } from './b';
    console.log(parse);
    export { parse, createURL } from './b';
`,
    'b.js': `
    export function createURL() {
      // keep.createURL
    }
    export function parse() {
      // keep.parse
    }
`,
  });

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/a.js',
    }),
  ]);
  expectImports(graph, '/app/a.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/b.js',
    }),
  ]);
  expect(artifacts[0].source).toMatch('createURL');
  expect(artifacts[0].source).toMatch('parse');
  expect(artifacts[0].source).toMatch('keep.createURL');
  expect(artifacts[0].source).toMatch('keep.parse');
});

it(`supports async import()`, async () => {
  const [[, , graph], artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          const promise = import('./math');
          console.log('keep', promise);
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
      // Disable split chunks to ensure the async import is kept.
      splitChunks: false,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    {
      absolutePath: '/app/math.js',
      data: expect.objectContaining({
        data: expect.objectContaining({
          asyncType: 'async',
          exportNames: ['*'],
        }),
      }),
    },
    {
      absolutePath: '/app/expo-mock/async-require',
      data: expect.objectContaining({
        data: expect.objectContaining({}),
      }),
    },
  ]);
  expect(artifacts[0].source).toMatch('add');
  expect(artifacts[0].source).toMatch('subtract');
});

describe('metro require', () => {
  it(`uses missing optional require`, async () => {
    const [[, , graph]] = await serializeOptimizeAsync({
      'index.js': `
          try {
            require('@dotlottie/react-player').DotLottiePlayer;
          } catch (e) {}
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({
        absolutePath: '/app/node_modules/@dotlottie/react-player/index.js',
        data: expect.objectContaining({
          data: expect.objectContaining({
            isOptional: true,
          }),
        }),
      }),
    ]);
  });

  it(`require.resolveWeak`, async () => {
    // Basically just bundle splitting...
    const [[, , graph], artifacts] = await serializeOptimizeAsync({
      'index.js': `
          const Math = require.resolveWeak('./math');
          console.log('keep', Math.add(1, 2));
        `,
      'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([]);
    expect(artifacts[0].source).not.toMatch('subtract');
  });
});

describe('cjs', () => {
  it(`import from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeOptimizeAsync({
      'index.js': `
          import { add } from './math';
          console.log('add', add(1, 2));
        `,
      'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
    expect(artifacts[0].source).toMatch('subtract');
  });

  it(`requires all from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeOptimizeAsync({
      'index.js': `
          const Math = require('./math');
          console.log('keep', Math.add(1, 2));
        `,
      'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
    expect(artifacts[0].source).toMatch('subtract');
  });
  it(`requires some from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeOptimizeAsync({
      'index.js': `
          const { add } = require('./math');
          console.log('keep', add(1, 2));
        `,
      'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
    expect(artifacts[0].source).toMatch('subtract');
  });
  it(`requires some from exports`, async () => {
    const [[, , graph], artifacts] = await serializeOptimizeAsync({
      'index.js': `
          const { add } = require('./math');
          console.log('keep', add(1, 2));
        `,
      'math.js': `
          export function add(a, b) {
            return subtract(a, b);
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expectImports(graph, '/app/index.js').toEqual([
      {
        data: expect.objectContaining({
          data: expect.objectContaining({
            exportNames: ['*'],
          }),
        }),
        absolutePath: '/app/math.js',
      },
    ]);
    expect(artifacts[0].source).toMatch('subtract');
    expect(artifacts[0].source).toMatch('_$$_REQUIRE(_dependencyMap[0]);');

    expect(artifacts[0].source).toMatchInlineSnapshot(`
          "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
            const {
              add
            } = _$$_REQUIRE(_dependencyMap[0]);
            console.log('keep', add(1, 2));
          },"/app/index.js",["/app/math.js"]);
          __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
            "use strict";

            Object.defineProperty(exports, '__esModule', {
              value: true
            });
            function add(a, b) {
              return subtract(a, b);
            }
            function subtract(a, b) {
              return a - b;
            }
            exports.add = add;
            exports.subtract = subtract;
          },"/app/math.js",[]);
          TEST_RUN_MODULE("/app/index.js");"
        `);
  });
});

it(`import star`, async () => {
  const [[, , graph], artifacts] = await serializeOptimizeAsync({
    'index.js': `
          import * as Math from './math';
          console.log('keep', Math.add(1, 2));
        `,
    'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
  });

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);

  expect(artifacts[0].source).toMatch('subtract');
});

it(`cannot expands export all statements with cjs usage`, async () => {
  const [, [artifact]] = await serializeOptimizeAsync(
    {
      'index.js': `
          import { z1 } from './x0';
          console.log(z1);
        `,
      'x0.js': `
         export * from './x1';
        `,
      'x1.js': `
      export const z2 = 0;
      module.exports.z1 = 0;
      `,
    }
    // { minify: true }
  );
  expect(artifact.source).toMatch('z1');
  expect(artifact.source).toMatch('z2');
});
