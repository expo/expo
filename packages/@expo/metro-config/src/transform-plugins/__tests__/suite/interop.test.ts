import { makeEval } from './utils';

const exec = makeEval();

it('export default number', () => {
  const mod = exec(`
    export default 42;
  `);
  expect(mod).toEqual({
    exports: { default: 42 },
    requests: [],
  });
});

it('export default object', () => {
  const mod = exec(`
    export default {};
  `);
  expect(mod).toEqual({
    exports: { default: {} },
    requests: [],
  });
});

it('export default array', () => {
  const mod = exec(`
    export default [];
  `);
  expect(mod).toEqual({
    exports: { default: [] },
    requests: [],
  });
});

it('export default global variable', () => {
  expect(() => {
    exec(`
      export default foo;
    `);
  }).toThrow(/foo is not defined/);
  globalThis.foo = 'foo';
  const mod = exec(`
    export default foo;
  `);
  expect(mod).toEqual({
    exports: { default: 'foo' },
    requests: [],
  });
});

it('export default anonymous function', () => {
  const mod = exec(`
    export default function() { return 42 };
  `);
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: [],
  });
  expect(mod.exports.default()).toBe(42);
});

it('export default anonymous class', () => {
  const mod = exec(`
    export default class { prop = 42 };
  `);
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: [],
  });
  expect(new mod.exports.default().prop).toBe(42);
});

it('export default named function', () => {
  const mod = exec(`
    export default function foo() { return 42; };
  `);
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: [],
  });
  expect(mod.exports.default.name).toBe('foo');
  expect(mod.exports.default()).toBe(42);
});

it('export default name class', () => {
  const mod = exec(`
    export default class Foo { prop = 42 };
  `);
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: [],
  });
  expect(mod.exports.default.name).toBe('Foo');
  expect(new mod.exports.default().prop).toBe(42);
});

it('export default assignable var (live-binding)', () => {
  const mod = exec(`
    var foo = 42;
    export { foo as default };
    foo = 43;
  `);
  expect(mod).toEqual({
    exports: { default: 43 },
    requests: [],
  });
});

it('export default IIFE', () => {
  const mod = exec(`
    export default (function(){ return 'foo'; })();
  `);
  expect(mod).toEqual({
    exports: { default: 'foo' },
    requests: [],
  });
});

it('export class instance', () => {
  const mod = exec(`
    export default new Cacher()
    export function Cacher() {
      this.prop = 42;
    }
  `);
  expect(mod).toEqual({
    exports: {
      default: { prop: 42 },
      Cacher: expect.any(Function),
    },
    requests: [],
  });
  expect(new mod.exports.Cacher().prop).toBe(42);
  expect(mod.exports.default).toBeInstanceOf(mod.exports.Cacher);
});

it('export destructured (live-binding)', () => {
  const mod = exec(`
    export let x = 0;
    export let y = 0;

    export function f1 () {
      ({x} = { x: 1 });
    }

    export function f2 () {
      ({x, y} = { x: 2, y: 3 });
    }

    export function f3 () {
      let z = 0;
      [x, y, z] = [3, 4, 5]
    }

    export function f4 () {
      [x, , y] = [3, 4, 5]
    }
  `);
  expect(mod).toEqual({
    exports: {
      x: 0,
      y: 0,
      f1: expect.any(Function),
      f2: expect.any(Function),
      f3: expect.any(Function),
      f4: expect.any(Function),
    },
    requests: [],
  });

  mod.exports.f1();
  expect([mod.exports.x, mod.exports.y]).toEqual([1, 0]);

  mod.exports.f2();
  expect([mod.exports.x, mod.exports.y]).toEqual([2, 3]);

  mod.exports.f3();
  expect([mod.exports.x, mod.exports.y]).toEqual([3, 4]);

  mod.exports.f4();
  expect([mod.exports.x, mod.exports.y]).toEqual([3, 5]);
});

it('export let (live-binding)', () => {
  const mod = exec(`
    let x = 0;

    export { x };

    export function update() {
      x++;
    }
  `);
  expect(mod).toEqual({
    exports: {
      x: 0,
      update: expect.any(Function),
    },
    requests: [],
  });

  mod.exports.update();
  expect(mod.exports.x).toEqual(1);
});

it('hoist function exports', () => {
  const mod = exec({
    evens: `
      export const isEven = (x) => x % 2 === 0;
    `,
    entry: `
      import { isEven } from "evens";

      export function nextOdd(n) {
        return isEven(n) ? n + 1 : n + 1;
      }

      export var isOdd = (function (isEven) {
        return function (n) {
          return !isEven(n);
        };
      })(isEven);
    `,
  });
  expect(mod).toEqual({
    exports: {
      nextOdd: expect.any(Function),
      isOdd: expect.any(Function),
    },
    requests: ['evens'],
  });

  expect(mod.exports.nextOdd(1)).toBe(2);
  expect(mod.exports.isOdd(1)).toBe(true);
});

it('illegal export __esModule', () => {
  expect(() => {
    exec('export var __esModule = false;');
  }).toThrow(/Cannot redefine/);
});

it('illegal export __esModule (2)', () => {
  expect(() => {
    exec(`
      var __esModule;
      export { __esModule };
    `);
  }).toThrow(/Cannot redefine/);
});

it('side-effect imports', () => {
  expect(
    exec({
      foo: 'export {}',
      'foo-bar': 'export {}',
      entry: `
      import "foo";
      import "foo-bar";
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo', 'foo-bar'],
  });
});

it('named import specifiers', () => {
  expect(
    exec({
      foo: 'export default "test";',
      entry: `
      import foo from "foo";
      import { default as foo2 } from "foo";

      foo;
      foo2;
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo'],
  });
});

it('namespace import specifiers', () => {
  expect(
    exec({
      foo: 'export default "test";',
      entry: `
      import * as foo from "foo";
      foo;
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo'],
  });
});

it('import mixing', () => {
  expect(
    exec({
      foo: `
      export default "test";
      export const baz = "baz";
    `,
      entry: `
      import foo, { baz as xyz } from "foo";
      foo;
      xyz;
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo'],
  });
});

it('import ordering', () => {
  expect(
    exec({
      foo: 'export const foo = "foo"',
      bar: 'export const bar = "bar"',
      baz: 'export const baz = "baz"',
      qux: 'export const qux = "qux"',
      entry: `
      import './foo';
      import bar from './bar';
      import './baz';
      import { qux } from './qux';
      bar;
      qux;
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo', 'bar', 'baz', 'qux'],
  });
});

it('import ordering (unreferenced)', () => {
  expect(
    exec({
      foo: 'export const foo = "foo"',
      bar: 'export const bar = "bar"',
      baz: 'export const baz = "baz"',
      qux: 'export const qux = "qux"',
      entry: `
      import './foo';
      import bar from './bar';
      import './baz';
      import { qux } from './qux';
    `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo', 'bar', 'baz', 'qux'],
  });
});

it('module shadowing', () => {
  expect(
    exec(`
    export function module() {}
  `)
  ).toEqual({
    exports: {
      module: expect.any(Function),
    },
    requests: [],
  });
});

it('overview', () => {
  expect(
    exec({
      foo: 'export {}',
      'foo-bar': 'export {}',
      foo2: 'export default "foo2";',
      foo3: 'export default "foo3";',
      foo4: 'export const bar = "bar";',
      foo5: 'export const foo = "foo5";',
      entry: `
      import "foo";
      import "foo-bar";
      import foo from "foo2";
      import * as foo2 from "foo3";
      import {bar} from "foo4";
      import {foo as bar2} from "foo5";

      var test;
      export {test};
      export var test2 = 5;

      bar;
      bar2;
      foo;
    `,
    })
  ).toEqual({
    exports: {
      test: undefined,
      test2: 5,
    },
    requests: ['foo', 'foo-bar', 'foo2', 'foo3', 'foo4', 'foo5'],
  });
});
