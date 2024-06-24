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

function getModules(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return graph.dependencies.get(name).output[0].data.modules;
}

function expectSideEffects(graph, name: string) {
  return expect(graph.dependencies.get(name).sideEffects);
}
function expectImports(graph, name: string) {
  return expect(getModules(graph, name).imports);
}

it(`circular`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
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

  expectImports(graph, '/app/index.js').toEqual([expect.objectContaining({ key: '/app/b.js' })]);
  expectImports(graph, '/app/b.js').toEqual([expect.objectContaining({ key: '/app/c.js' })]);
  expectImports(graph, '/app/c.js').toEqual([expect.objectContaining({ key: '/app/b.js' })]);
  expect(artifacts[0].source).toMatch('bar');
  expect(artifacts[0].source).toMatch('run');

  // TODO: Test orphans.
});

it(`renamed-export`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
import { run } from "./b";
console.log('keep', run);
            `,
    'b.js': `
const bar = 2;
export {bar as run};
export const foo = 3;
`,
  });

  expectImports(graph, '/app/index.js').toEqual([expect.objectContaining({ key: '/app/b.js' })]);
  expect(artifacts[0].source).not.toMatch('foo');
  expect(artifacts[0].source).toMatch('run');
});

it(`removes unused classes`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
import { gravity } from "./b";
console.log('keep', gravity);
            `,
    'b.js': `
export const gravity = 7;

export class Math {
	add() {
		console.log("add");
	}
}
`,
  });

  expectImports(graph, '/app/index.js').toEqual([expect.objectContaining({ key: '/app/b.js' })]);
  expect(artifacts[0].source).not.toMatch('Math');
  expect(artifacts[0].source).toMatch('gravity');
});

// TODO: Fix this...
xit(`preserves side-effecty import`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    // We need to respect the side-effecty import for now.
    'index.js': `
import "./b"
            `,
    // TODO: This should be removed in the future as nothing is used.
    'b.js': `
let inc = 1;
function unused() {
inc++;
}
`,
  });

  expectImports(graph, '/app/index.js').toEqual([expect.objectContaining({ key: '/app/b.js' })]);
});

// TODO: Add more tests for striping empty modules.
it(`removes empty import`, async () => {
  // TODO: Make a test which actually marks as a side-effect.
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import './side-effect.js';
        `,
    'side-effect.js': ``,
  });

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/side-effect.js' })],
  });
  expect(artifacts[0].source).not.toMatch('side-effect');
  expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";
        },"/app/index.js",[]);
        TEST_RUN_MODULE("/app/index.js");"
      `);
});

it(`preserves modules with side effects`, async () => {
  // TODO: Make a test which actually marks as a side-effect.
  const [[, , graph]] = await serializeShakingAsync({
    'index.js': `
import './node_modules/foo/index.js';
`,
    'node_modules/foo/package.json': JSON.stringify({ sideEffects: true, name: 'foo' }),
    'node_modules/foo/index.js': `
var hey = 0;
    `,
  });

  expectSideEffects(graph, '/app/node_modules/foo/index.js').toBe(true);
});

it(`supports async import()`, async () => {
  // TODO: Add actual support for eliminating code from async imports.
  const [[, , graph], artifacts] = await serializeShakingAsync(
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

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [
      {
        async: true,
        key: '/app/math.js',
        source: './math',
        specifiers: [],
      },
      // TODO: Parse these imports
    ],
  });
  expect(artifacts[0].source).toMatch('add');
  expect(artifacts[0].source).toMatch('subtract');
  // expect(artifacts[0].source).not.toMatch('subtract');
});

it(`barrel default as`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
    'barrel.js': `export { default as add } from './math';`,
    'math.js': `
          export default function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }

          export const multiply = (a, b) => a * b;
        `,
  });

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/barrel.js' })],
  });
  expect(getModules(graph, '/app/barrel.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/math.js' })],
  });
  expect(artifacts[0].source).not.toMatch('subtract');
});

describe('metro require', () => {
  // Not supported in the mini runner
  xit(`uses require.context`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
          const foo = require.context('./foo', false, /\.js$/);
          console.log('keep', foo);
        `,
      'foo/math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
  it(`require.resolveWeak`, async () => {
    // Basically just bundle splitting...
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [],
    });
    expect(artifacts[0].source).not.toMatch('subtract');
  });

  // TODO: require.resolveWeak
  // TODO: Async import()
});

describe('cjs', () => {
  it(`import from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });

  it(`requires all from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
  it(`requires some from module.exports`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
  it(`requires some from exports`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [
        {
          cjs: true,
          key: '/app/math.js',
          source: './math',
          specifiers: [],
        },
      ],
    });
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

// TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
describe('sanity', () => {
  // These tests do not optimize the graph but they ensure that tree shaking doesn't break anything.

  it(`makes the same bundle with tree shaking disabled`, async () => {
    // Compare the bundle across two runs with and without tree shaking.
    const fs = {
      'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
        `,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }`,
    } as const;
    const [, artifacts] = await serializeShakingAsync(fs);
    const [, artifacts2] = await serializeShakingAsync(fs, { treeshake: false });
    expect(artifacts[0].source).toMatch(artifacts2[0].source);
  });

  it(`using unreferenced import inside other module`, async () => {
    // Event though subtract is not imported inside any other module it is still
    // used inside of the math module, therefore it cannot be pruned.
    const [[, , graph], artifacts] = await serializeShakingAsync({
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
});

describe('Possible optimizations', () => {
  // TODO: Broken
  it(`require module`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
            const { add } = require('./math');
            console.log('keep', add(1, 2));
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

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });

  it(`double barrel`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
            import { add } from './barrel';
            console.log('keep', add(1, 2));
          `,
      'barrel.js': `export { add, subtract } from './barrel2';`,
      'barrel2.js': `export { add, subtract } from './math';`,
      'math.js': `
            export function add(a, b) {
              return a + b;
            }
  
            export function subtract(a, b) {
              return a - b;
            }
          `,
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel.js' })],
    });
    expect(getModules(graph, '/app/barrel.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel2.js' })],
    });
    expect(getModules(graph, '/app/barrel2.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });

  it(`barrel multiple`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
            import { add } from './barrel';
            console.log('keep', add(1, 2));
          `,
      'barrel.js': `export { add, subtract } from './math';`,
      'math.js': `
            export function add(a, b) {
              return a + b;
            }
  
            export function subtract(a, b) {
              return a - b;
            }
          `,
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel.js' })],
    });
    expect(getModules(graph, '/app/barrel.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });

  it(`barrel getters`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
      'barrel.js': `
          module.exports = {
            get add() {
              return require('./math').add;
            },
          };
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
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel.js' })],
    });
    expect(getModules(graph, '/app/barrel.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
  // TODO: Maybe extrapolate the star export for more shaking.
  it(`barrel star cannot shake`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
      'barrel.js': `export * from './math';`,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel.js' })],
    });
    expect(getModules(graph, '/app/barrel.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });

  // From React Navigation
  xit(`barrel star empty file`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
          import { foo } from './barrel';
          console.log('keep', foo);
        `,
      'barrel.js': `
      export const foo = 1;
      export * from './math';
      `,
      'math.js': `
          export {};
        `,
    });

    expect(getModules(graph, '/app/index.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/barrel.js' })],
    });
    expect(getModules(graph, '/app/barrel.js')).toEqual({
      exports: [],
      imports: [expect.objectContaining({ key: '/app/math.js' })],
    });
    expect(artifacts[0].source).toMatch('subtract');
  });
});

it(`import as`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import { add as other } from './math';
          console.log('keep', add(1, 2));
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

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/math.js' })],
  });
  expect(artifacts[0].source).not.toMatch('subtract');
});

it(`import star`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
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

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/math.js' })],
  });
  expect(artifacts[0].source).toMatch('subtract');
});

// TODO: split this up to make it more sane when things break.
it(`lucide example`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import { AArrowDown } from './lucide.js';
          console.log('keep', AArrowDown);
        `,
    'lucide.js': `
import * as index from './icons.js';
export { index as icons };
export { default as AArrowDown, default as AArrowDownIcon, default as LucideAArrowDown } from './a-arrow-down.js';
export { default as LucideWorm, default as Worm, default as WormIcon } from './worm.js';
export { default as createLucideIcon } from './createLucideIcon.js';
        `,
    'icons.js': `
        export { default as AArrowDown } from './a-arrow-down.js';
        export { default as LucideWorm } from './worm.js';
        `,
    'createLucideIcon.js': `
const createLucideIcon = (iconName, iconNode) => {};
export { createLucideIcon as default };
        `,
    'a-arrow-down.js': `
import createLucideIcon from './createLucideIcon.js';
const AArrowDown = createLucideIcon();
export { AArrowDown as default };
        `,
    'worm.js': `
import createLucideIcon from './createLucideIcon.js';
const Worm = createLucideIcon();
export { Worm as default };
        `,
  });

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [
      expect.objectContaining({ key: '/app/lucide.js' }),
      expect.objectContaining({ key: '/app/lucide.js' }),
    ],
  });
  expect(artifacts[0].source).not.toMatch('icons');
  expect(artifacts[0].source).not.toMatch('Worm');
  expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          var AArrowDown = _$$_REQUIRE(_dependencyMap[0]).AArrowDown;
          console.log('keep', AArrowDown);
        },"/app/index.js",["/app/lucide.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          var _default = _$$_IMPORT_DEFAULT(_dependencyMap[0]);
          exports.AArrowDown = _default;
        },"/app/lucide.js",["/app/a-arrow-down.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          var createLucideIcon = _$$_IMPORT_DEFAULT(_dependencyMap[0]);
          const AArrowDown = createLucideIcon();
          exports.default = AArrowDown;
        },"/app/a-arrow-down.js",["/app/createLucideIcon.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          const createLucideIcon = (iconName, iconNode) => {};
          exports.default = createLucideIcon;
        },"/app/createLucideIcon.js",[]);
        TEST_RUN_MODULE("/app/index.js");"
      `);
});

it(`barrel partial`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
    'barrel.js': `export { add } from './math';`,
    'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
  });

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/barrel.js' })],
  });
  expect(getModules(graph, '/app/barrel.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/math.js' })],
  });
  expect(artifacts[0].source).not.toMatch('subtract');
});

it(`removes unused exports`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
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

  expect(getModules(graph, '/app/index.js')).toEqual({
    exports: [],
    imports: [expect.objectContaining({ key: '/app/math.js' })],
  });
  // expect(graph.dependencies.get('/app/math.js').output[0].data.modules).toEqual({
  //   exports: [expect.objectContaining({ key: '/app/math.js' })],
  //   imports: [],
  // });
  // console.log(graph.dependencies.get('/app/index.js').output[0].data.modules);
  // console.log(graph.dependencies.get('/app/math.js').output[0].data.modules);

  expect(artifacts[0].source).not.toMatch('subtract');

  expect(artifacts).toMatchInlineSnapshot(`
        [
          {
            "filename": "_expo/static/js/web/index-3a0063b25db3705e1ae6a08c56d0e202.js",
            "metadata": {
              "isAsync": false,
              "modulePaths": [
                "/app/index.js",
                "/app/math.js",
              ],
              "paths": {},
              "reactClientReferences": [],
              "requires": [],
            },
            "originFilename": "index.js",
            "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          var add = _$$_REQUIRE(_dependencyMap[0]).add;
          console.log('keep', add(1, 2));
        },"/app/index.js",["/app/math.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          function add(a, b) {
            return a + b;
          }
          exports.add = add;
        },"/app/math.js",[]);
        TEST_RUN_MODULE("/app/index.js");",
            "type": "js",
          },
        ]
      `);
});
