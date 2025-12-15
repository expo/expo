import { parse } from '@babel/core';

import { serializeShakingAsync } from '../fork/__tests__/serializer-test-utils';
import { isModuleEmptyFor } from '../treeShakeSerializerPlugin';

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

function expectSideEffects(graph, name: string) {
  return expect(graph.dependencies.get(name).sideEffects);
}
function expectImports(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return expect([...graph.dependencies.get(name).dependencies.values()]);
}

it(`doesn't unlink if a single import chain is removed`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
import {run} from "./b";
console.log(run);
            `,
    // When we remove the import for `DEFAULT_ICON_COLOR` we need to ensure that we don't delete
    // the `c` module because it still has another link in the same module.
    'b.js': `
import createIconButtonComponent from './c';
export { DEFAULT_ICON_COLOR, } from './c';

export function run() {
  console.log(createIconButtonComponent)
}
`,
    'c.js': `
export const DEFAULT_ICON_COLOR = "bar";
export default function createIconButtonComponent() {
console.log("MARK")
}
`,
  });

  expectImports(graph, '/app/b.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/c.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('DEFAULT_ICON_COLOR');
  expect(artifacts[0].source).toMatch('MARK');
});

it(`does unlink if a multiple import chains are removed`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
import {run} from "./b";
console.log(run);
            `,
    'b.js': `
import createIconButtonComponent from './c';
export { DEFAULT_ICON_COLOR, } from './c';

export function run() {
}
`,
    'c.js': `
export const DEFAULT_ICON_COLOR = "bar";
export default function createIconButtonComponent() {
console.log("MARK")
}
`,
  });

  expectImports(graph, '/app/b.js').toEqual([]);
  expect(artifacts[0].source).not.toMatch('DEFAULT_ICON_COLOR');
  expect(artifacts[0].source).not.toMatch('MARK');
});

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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/b.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('foo');
  expect(artifacts[0].source).toMatch('run');
});

it(`supports multiple imports to the same module`, async () => {
  // Based on expo-linking
  const [[, , graph], artifacts] = await serializeShakingAsync({
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/b.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('Math');
  expect(artifacts[0].source).toMatch('gravity');
});

// TODO: We could possibly use a special transform to convert `import "./foo"` to something like `IMPORT_SIDE_EFFECT("./foo")` but we'd need to ensure the import order is preserved.
describe('side-effecty imports', () => {
  // TODO: Fix this...
  it(`preserves side-effecty import`, async () => {
    const [[, , graph]] = await serializeShakingAsync({
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/b.js' }),
    ]);
  });
  it(`preserves empty non-side-effecty import with no specifiers`, async () => {
    const [[, , graph]] = await serializeShakingAsync({
      // This type of import is not side-effecty.
      'index.js': `
  import {} from "./b"
              `,
      // TODO: This should be removed in the future as nothing is used.
      'b.js': `
  let inc = 1;
  function unused() {
  inc++;
  }
  `,
    });

    // TODO: This is a bug, we should (maybe) remove this import.
    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/b.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual(
      []
      // [expect.objectContaining({ key: '/app/side-effect.js' })]
    );
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
    const [[, , graph], [artifact]] = await serializeShakingAsync({
      'index.js': `
import './node_modules/foo/index.js';
`,
      'node_modules/foo/package.json': JSON.stringify({ sideEffects: true, name: 'foo' }),
      'node_modules/foo/index.js': `
var hey = 0;
    `,
    });

    expectSideEffects(graph, '/app/node_modules/foo/index.js').toBe(true);
    expect(artifact.source).toMatchInlineSnapshot(`
          "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
            "use strict";

            _$$_REQUIRE(_dependencyMap[0]);
          },"/app/index.js",["/app/node_modules/foo/index.js"]);
          __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
            var hey = 0;
          },"/app/node_modules/foo/index.js",[]);
          TEST_RUN_MODULE("/app/index.js");"
      `);
  });

  it(`removes node modules that are explicitly marked as side-effect-free`, async () => {
    // TODO: Make a test which actually marks as a side-effect.
    const [[, , graph], [artifact]] = await serializeShakingAsync({
      'index.js': `
import {} from './node_modules/foo/index.js';
`,
      'node_modules/foo/package.json': JSON.stringify({ sideEffects: false, name: 'foo' }),
      'node_modules/foo/index.js': `
var hey = 0;
    `,
    });

    expectImports(graph, '/app/index.js').toEqual([]);

    expect(artifact.source).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";
      },"/app/index.js",[]);
      TEST_RUN_MODULE("/app/index.js");"
    `);
  });
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
        data: expect.objectContaining({
          // exportNames: undefined,
        }),
      }),
      // cjs: true,
      // exportNames: ['*'],
      // source: 'expo-mock/async-require',
      // specifiers: [],
    },
    // TODO: Parse these imports
  ]);
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/barrel.js' }),
  ]);
  expectImports(graph, '/app/barrel.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('subtract');
});

describe(isModuleEmptyFor, () => {
  [
    ``,
    `// comment`,
    `"use strict"`,
    // `true`,
    [
      'directives',
      `
    "use client"
    // Hey
    `,
    ],
    [
      'multi-line comment',
      `
      /** 
       * multi-line comment 
       */`,
    ],
  ].forEach((source) => {
    const [title, src] = Array.isArray(source) ? source : [source, source];
    it(`returns true for: ${title}`, () => {
      expect(isModuleEmptyFor(parse(src, { sourceType: 'unambiguous' }))).toBe(true);
    });
  });
  [`export {}`, `const foo = 'bar'`, `3`, `{}`, `true`, `console.log('hey')`].forEach((source) => {
    const [title, src] = Array.isArray(source) ? source : [source, source];
    it(`returns false for: ${title}`, () => {
      expect(isModuleEmptyFor(parse(src, { sourceType: 'unambiguous' }))).toBe(false);
    });
  });
});

describe('metro require', () => {
  it(`uses missing optional require`, async () => {
    const [[, , graph]] = await serializeShakingAsync({
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

  // Not supported in the mini runner
  xit(`uses require.context`, async () => {
    const [[, , graph], artifacts] = await serializeShakingAsync({
      'index.js': `
          const foo = require.context('./foo', false, /\\.js$/);
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({
        absolutePath: '/app/math.js',
        data: expect.objectContaining({
          data: expect.objectContaining({
            asyncType: 'weak',
            exportNames: ['*'],
          }),
        }),
      }),
    ]);
    expect(artifacts[0].source).not.toMatch('subtract');
    expect(artifacts[1].source).toMatch('subtract');
  });

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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual([
      {
        data: expect.objectContaining({
          data: expect.objectContaining({
            exportNames: ['*'],
          }),
        }),
        absolutePath: '/app/math.js',
        // source: './math',
        // specifiers: [],
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
        exports.add = add;
        exports.subtract = subtract;
        function add(a, b) {
          return subtract(a, b);
        }
        function subtract(a, b) {
          return a - b;
        }
      },"/app/math.js",[]);
      TEST_RUN_MODULE("/app/index.js");"
    `);
  });
});

// Based on code in @amplitude/analytics-browser.
it(`export var with trailing exports`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
      import { add, } from './lib';
      console.log('keep', add(1, 2));
    `,
    'lib.js': `
      import client from './b';
      export var add = client.add, track = client.track;
    `,
    'b.js': `
      var createInstance = function () {
        return {
          add() {},
          track() {},
        };
      };
      export default createInstance();
      `,
  });
  expect(artifacts[0].source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log('keep', (0, _$$_REQUIRE(_dependencyMap[0]).add)(1, 2));
    },"/app/index.js",["/app/lib.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      Object.defineProperty(exports, "add", {
        enumerable: true,
        get: function () {
          return add;
        }
      });
      var client = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
      var add = client.default.add;
    },"/app/lib.js",["/app/b.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      var createInstance = function () {
        return {
          add() {},
          track() {}
        };
      };
      var _default = createInstance();
    },"/app/b.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/lib.js' }),
  ]);
  expectImports(graph, '/app/lib.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/b.js' }),
  ]);
  expect(artifacts[0].source).toMatch(/\.add|"add"/);
  expect(artifacts[0].source).toMatch('createInstance');
  expect(artifacts[0].source).not.toMatch('track ');
});

it(`export var with trailing exports (const and function)`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync({
    'index.js': `
      import { add, } from './lib';
      console.log('keep', add(1, 2));
    `,
    'lib.js': `
      export const track = true, add = function () {
      }, other = true;
    `,
  });
  expect(artifacts[0].source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log('keep', (0, _$$_REQUIRE(_dependencyMap[0]).add)(1, 2));
    },"/app/index.js",["/app/lib.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "add", {
        enumerable: true,
        get: function () {
          return add;
        }
      });
      const add = function () {};
    },"/app/lib.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/lib.js' }),
  ]);
  expect(artifacts[0].source).toMatch(/|\.add|"add"/);
  expect(artifacts[0].source).not.toMatch('other');
  expect(artifacts[0].source).not.toMatch('track');
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/barrel.js' }),
  ]);
  expectImports(graph, '/app/barrel.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/barrel2.js' }),
  ]);
  expectImports(graph, '/app/barrel2.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('subtract');
});

// TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
describe('sanity', () => {
  // These tests do not optimize the graph but they ensure that tree shaking doesn't break anything.

  // TODO: Add ability to disable inline requires and reenable this test.
  xit(`makes the same bundle with tree shaking disabled`, async () => {
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
    expect(artifacts[0].source).toMatch('subtract');
  });
});

it(`does not remove CSS`, async () => {
  const [[, , graph]] = await serializeShakingAsync(
    {
      'index.js': `
          import "./styles.css";
          import styles from "./styles.module.css";
          
        `,
      'styles.css': `.container {}`,
      'styles.module.css': `.container {}`,
    },
    {
      treeshake: true,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/styles.css' }),
    expect.objectContaining({ absolutePath: '/app/styles.module.css' }),
  ]);
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/barrel.js' }),
  ]);
  expectImports(graph, '/app/barrel.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
  expect(artifacts[0].source).not.toMatch('subtract');
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
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

    expectImports(graph, '/app/index.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/barrel.js' }),
    ]);
    expectImports(graph, '/app/barrel.js').toEqual([
      expect.objectContaining({ absolutePath: '/app/math.js' }),
    ]);
    expect(artifacts[0].source).toMatch('subtract');
  });
});

it(`import as`, async () => {
  const [[, , graph], artifacts] = await serializeShakingAsync(
    {
      'index.js': `
          import { add as other } from './math';
          console.log('keep', other(1, 2));
        `,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
    },
    {
      treeshake: true,
    }
  );

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);

  expect(artifacts[0].source).toMatch('add');
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);

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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/lucide.js',
    }),
  ]);
  expect(artifacts[0].source).not.toMatch('icons');
  expect(artifacts[0].source).not.toMatch('Worm');
  expect(artifacts[0].source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log('keep', _$$_REQUIRE(_dependencyMap[0]).AArrowDown);
    },"/app/index.js",["/app/lucide.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      Object.defineProperty(exports, "AArrowDown", {
        enumerable: true,
        get: function () {
          return _aArrowDownJs2.default;
        }
      });
      var _aArrowDownJs2 = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
    },"/app/lucide.js",["/app/a-arrow-down.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return AArrowDown;
        }
      });
      var createLucideIcon = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
      const AArrowDown = (0, createLucideIcon.default)();
    },"/app/a-arrow-down.js",["/app/createLucideIcon.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return createLucideIcon;
        }
      });
      const createLucideIcon = (iconName, iconNode) => {};
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/barrel.js' }),
  ]);
  expectImports(graph, '/app/barrel.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({ absolutePath: '/app/math.js' }),
  ]);
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
        "filename": "_expo/static/js/web/index-d1e560ce32dfe033241094be8aa906e6.js",
        "metadata": {
          "expoDomComponentReferences": [],
          "isAsync": false,
          "modulePaths": [
            "/app/index.js",
            "/app/math.js",
          ],
          "paths": {},
          "reactClientReferences": [],
          "reactServerReferences": [],
          "requires": [],
        },
        "originFilename": "index.js",
        "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log('keep', (0, _$$_REQUIRE(_dependencyMap[0]).add)(1, 2));
    },"/app/index.js",["/app/math.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      exports.add = add;
      function add(a, b) {
        return a + b;
      }
    },"/app/math.js",[]);
    TEST_RUN_MODULE("/app/index.js");",
        "type": "js",
      },
    ]
  `);
});

// This test accounts for removing an unused export that references another unused export.
it(`removes deeply nested unused exports`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
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

          export function divide(a, b) {
            subtract();
            return a - b;
          }
        `,
    }
    // { minify: true }
  );
  // 1. divide should be removed.
  // 2. subtract, which is no longer used by divide, should also be removed.

  expect(artifact.source).not.toMatch('divide');
  expect(artifact.source).not.toMatch('subtract');
});

it(`removes deeply nested unused exports (variables)`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { add } from './math';
          add(1, 2);
        `,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export const x1 = () => 0;
          export const x2 = () => x1();
          export const x3 = () => x2();
        `,
    }
    // { minify: true }
  );
  // 1. divide should be removed.
  // 2. subtract, which is no longer used by divide, should also be removed.

  expect(artifact.source).not.toMatch('x1');
  expect(artifact.source).not.toMatch('x2');
  expect(artifact.source).not.toMatch('x3');
});

it(`removes deeply nested unused exports (classes)`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { add } from './math';
          add(1, 2);
        `,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export const x1 = () => 0;
          export class x2 {
            constructor() {
              x1()  
            }
          }
          export class x3 {
            constructor() {
              new x2();
            }
          }
          
        `,
    }
    // { minify: true }
  );
  // 1. divide should be removed.
  // 2. subtract, which is no longer used by divide, should also be removed.

  expect(artifact.source).not.toMatch('x1');
  expect(artifact.source).not.toMatch('x2');
  expect(artifact.source).not.toMatch('x3');
});

it(`removes deeply nested unused exports until max depth`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { add } from './math';
          add(1, 2);
        `,
      'math.js': `
          export function add(a, b) {
            return a + b;
          }
          export function x1() {
            return;
          }
          export function x2() {
            x1();
          }
          export function x3() {
            x2();
          }
          export function x4() {
            x3();
          }
          export function x5() {
            x4();
          }
          export function x6() {
            x5();
          }
          export function x7() {
            x6();
          }
          
        `,
    }
    // { minify: true }
  );

  // Tests that the maximum optimization limit cannot be exceeded.
  expect(artifact.source).not.toMatch('x7');
  expect(artifact.source).not.toMatch('x6');
  expect(artifact.source).not.toMatch('x2');
  // The last export that couldn't be reached should still be there.
  expect(artifact.source).toMatch('x1');
});

it(`preserves remapped imports when an import with the same name is removed`, async () => {
  const [, [artifact]] = await serializeShakingAsync({
    'index.js': `
        import Platform from "./lib";
        import {Platform as OtherPlatform} from "./x0";
        console.log(OtherPlatform.KIOSK);
        `,

    'lib.js': `
        export default {
          OS: 'web',
        }
        `,
    'x0.ts': `
        export enum Platform {
          KIOSK = 'kiosk',
        }
        `,
  });

  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log(_$$_REQUIRE(_dependencyMap[0]).Platform.KIOSK);
    },"/app/index.js",["/app/x0.ts"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "Platform", {
        enumerable: true,
        get: function () {
          return Platform;
        }
      });
      let Platform = /*#__PURE__*/function (Platform) {
        Platform["KIOSK"] = "kiosk";
        return Platform;
      }({});
    },"/app/x0.ts",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
  expect(artifact.source).toMatch('_$$_REQUIRE(_dependencyMap[0]).Platform');
});

it(`recursively expands export all statements (shallow)`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
        import { z1, DDD } from './x0';
        console.log(z1, DDD);
        `,
      'x0.js': `
        export * from './x1';
        `,
      'x1.js': `
        export const z1 = 0;
        `,
    }
    // { minify: true }
  );
  expect(artifact.source).toMatch('z1');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log(_$$_REQUIRE(_dependencyMap[0]).z1, _$$_REQUIRE(_dependencyMap[0]).DDD);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z1;
        }
      });
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return z1;
        }
      });
      const z1 = 0;
    },"/app/x1.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});

it(`recursively expands unused with overlapping exports`, async () => {
  const [, [artifact]] = await serializeShakingAsync({
    'index.js': `
        import m from './x0';
        console.log(m.z1, DDD);
        `,
    'x0.js': `
        export * from './x1';
        import X from './x1';
        export default X;
        `,
    'x1.js': `
        export default {};
        `,
  });

  expect(artifact.source).toMatch('z1');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      var m = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
      console.log(m.default.z1, DDD);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      var X = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
      var _default = X.default;
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      var _default = {};
    },"/app/x1.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});

it(`removes all overlapping exports (export-all and default)`, async () => {
  // Because we have a special condition to leave the default export in place when extracting export-all, we should test that export all is removed correctly.
  const [, [artifact]] = await serializeShakingAsync({
    'index.js': `
        import m from './x0';
        
        `,
    'x0.js': `
        export * from './x1';
        import X from './x1';
        export default X;
        `,
    'x1.js': `
        export default {};
        `,
  });

  expect(artifact.source).not.toMatch('z1');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";
    },"/app/index.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});

it(`TODO: removes default export with overlapping exports (export-all and default)`, async () => {
  // We should be able to expand the unused default from the overlapping export-all and remove it.
  const [, [artifact]] = await serializeShakingAsync({
    'index.js': `
        import { z1 } from './x0';
        consol.log(z1);
        `,
    'x0.js': `
        export * from './x1';
        import X from './x1';
        export default X;
        `,
    'x1.js': `
        export const z1 = 0;
        export default {};
        `,
  });

  expect(artifact.source).toMatch('z1');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      consol.log(_$$_REQUIRE(_dependencyMap[0]).z1);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      function _interopDefault(e) {
        return e && e.__esModule ? e : {
          default: e
        };
      }
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z1;
        }
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      var X = _interopDefault(_$$_REQUIRE(_dependencyMap[0]));
      var _default = X.default;
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return z1;
        }
      });
      const z1 = 0;
      var _default = {};
    },"/app/x1.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});

it(`recursively expands export all statements with require cycles`, async () => {
  await expect(() =>
    serializeShakingAsync({
      'index.js': `
        import { z1, DDD } from './x0';
        console.log(z1, DDD);
        `,
      'x0.js': `
        export * from './x1';
        `,
      'x1.js': `
        export const z1 = 0;
        export * from './x0';
        `,
    })
  ).rejects.toThrow('Circular dependency detected while tree-shaking: /app/x0.js');
});

it(`recursively expands export all statements`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { z1, DDD } from './x0';
          console.log(z1, DDD);
        `,
      'x0.js': `
         export * from './x1';
        `,
      'x1.js': `
         export * from './x2';
        `,
      'x2.js': `
          export const z1 = 0;
          export const z2 = 0;
          export const z3 = 0;
        `,
    }
    // { minify: true }
  );
  expect(artifact.source).toMatch('z1');
  expect(artifact.source).not.toMatch('z3');
  expect(artifact.source).not.toMatch('z2');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log(_$$_REQUIRE(_dependencyMap[0]).z1, _$$_REQUIRE(_dependencyMap[0]).DDD);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z1;
        }
      });
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z1;
        }
      });
    },"/app/x1.js",["/app/x2.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return z1;
        }
      });
      const z1 = 0;
    },"/app/x2.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});
it(`recursively expands export all statements with nested statements`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { z1, DDD } from './x0';
          console.log(z1, DDD);
        `,
      'x0.js': `
         export * from './x1';
         export * from './x2';
        `,
      'x1.js': `
      export const z1 = 0;
      export * from './x2';
      
      `,
      'x2.js': `
      export const z2 = 0;
      export const z3 = 0;
        `,
    }
    // { minify: true }
  );
  expect(artifact.source).toMatch('z1');
  expect(artifact.source).not.toMatch('z3');
  expect(artifact.source).not.toMatch('z2');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      console.log(_$$_REQUIRE(_dependencyMap[0]).z1, _$$_REQUIRE(_dependencyMap[0]).DDD);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z1;
        }
      });
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return z1;
        }
      });
      const z1 = 0;
    },"/app/x1.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});
it(`cannot expands export all statements with cjs usage`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
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
xit(`recursively expands renamed export all statements`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import { z1, DDD } from './x0';
          console.log(z1, DDD);
        `,
      'x0.js': `
         export * as DDD from './x1';
        `,
      'x1.js': `
         export * from './x2';
        `,
      'x2.js': `
          export const z1 = 0;
          export const z2 = 0;
          export const z3 = 0;
        `,
    }
    // { minify: true }
  );

  expect(artifact.source).toMatch('z1');

  expect(artifact.source).not.toMatch('z3');
  expect(artifact.source).not.toMatch('z2');
  expect(artifact.source).toMatch('FFFFFz2');
});

// NOTE(@kitten): See https://github.com/expo/expo/pull/39420
// This previously had an issue where the expansion would clobber non-export-all specifiers which take precedence
// It also previously failed to ignore default exports, as per the spec
it(`recursively expands export all statements while omitting existing and default specifiers`, async () => {
  const [, [artifact]] = await serializeShakingAsync(
    {
      'index.js': `
          import * as _all from './x0';
          console.log(_all);
        `,
      'x0.js': `
         export const z1 = 0;
         export * from './x1';
         export * from './x2';
        `,
      'x1.js': `
      export const z1 = 0;
      export * from './x2';
      export default 0;
      
      `,
      'x2.js': `
      export const z2 = 0;
      export const z3 = 0;
      export default 0;
        `,
    }
    // { minify: true }
  );
  expect(artifact.source).toMatch('z1');
  expect(artifact.source).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = {};
        if (e) Object.keys(e).forEach(function (k) {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () {
              return e[k];
            }
          });
        });
        n.default = e;
        return n;
      }
      var _all = _interopNamespace(_$$_REQUIRE(_dependencyMap[0]));
      console.log(_all);
    },"/app/index.js",["/app/x0.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z2", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z2;
        }
      });
      Object.defineProperty(exports, "z3", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z3;
        }
      });
      Object.defineProperty(exports, "z1", {
        enumerable: true,
        get: function () {
          return z1;
        }
      });
      const z1 = 0;
    },"/app/x0.js",["/app/x1.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "z2", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z2;
        }
      });
      Object.defineProperty(exports, "z3", {
        enumerable: true,
        get: function () {
          return _$$_REQUIRE(_dependencyMap[0]).z3;
        }
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      var _default = 0;
    },"/app/x1.js",["/app/x2.js"]);
    __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "default", {
        enumerable: true,
        get: function () {
          return _default;
        }
      });
      Object.defineProperty(exports, "z2", {
        enumerable: true,
        get: function () {
          return z2;
        }
      });
      Object.defineProperty(exports, "z3", {
        enumerable: true,
        get: function () {
          return z3;
        }
      });
      const z2 = 0;
      const z3 = 0;
      var _default = 0;
    },"/app/x2.js",[]);
    TEST_RUN_MODULE("/app/index.js");"
  `);
});

// From React Navigation
it(`barrel star empty file`, async () => {
  const [[, , graph]] = await serializeShakingAsync({
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

  expectImports(graph, '/app/index.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/barrel.js',
    }),
  ]);
  expectImports(graph, '/app/barrel.js').toEqual([]);
});
