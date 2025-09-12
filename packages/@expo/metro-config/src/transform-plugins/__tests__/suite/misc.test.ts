import { makeEval } from './utils';

const exec = makeEval();

it('binding for new var', () => {
  expect(
    exec({
      foo: 'export const x = "x"',
      entry: `
        import { x } from 'foo';
        var y = true;
        function f() {
          return [x, y, console];
        }
      `,
    })
  ).toEqual({
    exports: {},
    requests: ['foo'],
  });
});

it('copy getters/setters', () => {
  const mod = exec({
    moduleWithGetter: `
      var Obj = {
        baz: 123,
        get boo() { throw new Error('Should never be triggered'); },
      };
      module.exports = Obj;
    `,
    entry: `
      import Foo, { baz } from "moduleWithGetter";
      export { Foo, baz };
    `,
  });
  expect(Object.keys(mod.exports)).toEqual(['Foo', 'baz']);
});

it('copy getters/setters (namespace import)', () => {
  const mod = exec({
    moduleWithGetter: `
      var Obj = {
        baz: 123,
        get boo() { throw new Error('Should never be triggered'); },
      };
      module.exports = Obj;
    `,
    entry: `
      import * as foo from "moduleWithGetter";
      export { foo };
    `,
  });
  expect(Object.keys(mod.exports)).toEqual(['foo']);
});

it('export expression with conflicting name', () => {
  const mod = exec({
    foo: `
      export function someFunction() {
        return 0;
      }
    `,
    entry: `
      import someFunction from "foo";
      export default (function someFunction () {
        return 42;
      });
    `,
  });
  expect(mod.exports.default()).toBe(42);
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: ['foo'],
  });
});

it('export let function name', () => {
  const mod = exec(`
    export let a = function () {};
    export let b = function X() {};
    export let c = () => {};
    export let d = class {};
    export let e = class Y {};
  `);
  expect(mod).toEqual({
    exports: {
      a: expect.any(Function),
      b: expect.any(Function),
      c: expect.any(Function),
      d: expect.any(Function),
      e: expect.any(Function),
    },
    requests: [],
  });
});

it('export var and modify', () => {
  const mod = exec(`
    var a;

    a += 1;
    a -= 1;
    a *= 1;
    a /= 1;
    a %= 1;
    a **= 1;
    a <<= 1;
    a >>= 1;
    a >>>= 1;
    a &= 1;
    a ^= 1;
    a |= 1;

    a &&= 1;
    a ||= 1;
    a ??= 1;

    export { a };
  `);
  expect(mod).toEqual({
    exports: { a: 1 },
    requests: [],
  });
});

it('for-of in export', () => {
  const mod = exec(`
    export let foo;
    export { foo as bar };

    for (foo of []) {}
    for (foo in []) {}
    for (foo of []) {
        let foo;
    }
    for ({foo} of []) {}
    for ({foo} of []) {
        let foo;
    }
    for ({test: {foo}} of []) {}
    for ([foo, [...foo]] of []) {}
    for ([foo, [...foo]] of []) {
        let foo;
    }

    for (foo of []) ;

    {
        let foo;
        for(foo of []) {}
    }
  `);
  expect(mod).toEqual({
    exports: { foo: undefined },
    requests: [],
  });
});

it('import const throw', () => {
  const mod = exec({
    foo: 'export default "Foo";',
    bar: 'export const bar = "bar";',
    baz: 'export const Baz = "Baz";',
    entry: `
      import Foo from "foo";

      import * as Bar from "bar";

      import { Baz } from "baz";

      Foo = 42;
      Bar = 43;
      Baz = 44;

      ({Foo} = {});
      ({Bar} = {});
      ({Baz} = {});

      ({prop: Foo} = {});
      ({prop: Bar} = {});
      ({prop: Baz} = {});

      Foo += 2;
      Bar += 2;
      Baz += 2;

      Foo >>>= 3;
      Bar >>>= 3;
      Baz >>>= 3;

      Foo &&= 4;
      Bar &&= 4;
      Baz &&= 4;

      --Foo;
      --Bar;
      --Baz;

      Foo++;
      Bar++;
      Baz++;

      for (Foo in {}) ;
      for (Bar in {}) {}
      for (Baz of []) {
        let Baz;
      }

      for ({Foo} in {}) {}
      for ([Bar] in {}) {}
      for ([...Baz] in {}) {}
    `,
  });
  expect(mod).toEqual({
    exports: { foo: undefined },
    requests: ['foo', 'bar', 'baz'],
  });
});

it('import shadow assign', () => {
  const mod = exec({
    foo: 'export const foo = "foo";',
    entry: `
      import { foo } from "foo";

      foo;

      function f(foo) {
        foo = 2;
        [foo] = [];
        ({ foo } = {});
      }

      foo = 2;
      [foo] = [];
      ({ foo } = {});
    `,
  });
  expect(mod).toEqual({
    // NOTE: In a stricter mode, this would remain "foo"
    exports: { foo: undefined },
    requests: ['foo'],
  });
});

it('shadow local exports', () => {
  const mod = exec({
    entry: `
      var exports = 1;
      export let x = 2;
    `,
  });
  expect(mod).toEqual({
    exports: { x: 2 },
    requests: [],
  });
});

it('local exports var declaration', () => {
  const mod = exec({
    entry: `
      export { A, B, C };
      {
        var A;
        switch (0) {
          case 1:
            var B;
            if (2) var C;
        }
      }
    `,
  });
  expect(mod).toEqual({
    exports: { A: undefined, B: undefined, C: undefined },
    requests: [],
  });
});

it('increment local', () => {
  const mod = exec({
    entry: `
      export { yy, zz };
      var yy = 0;
      var zz = yy++;
    `,
  });
  expect(mod).toEqual({
    exports: { yy: 1, zz: 0 },
    requests: [],
  });
});

it('shadow function argument', () => {
  const mod = exec({
    x: 'export default "x";',
    entry: `
      import x from 'x';
      export default function (x) { return x; }
      export { x };
    `,
  });
  expect(mod).toEqual({
    exports: { x: 'x', default: expect.any(Function) },
    requests: ['x'],
  });
  expect(mod.exports.default('input')).toBe('input');
});

it('function var exports', () => {
  const mod = exec({
    entry: `
      export var foo = function(gen, ctx = null) {};
      export var bar = (gen, ctx = null) => {};
    `,
  });
  expect(mod).toEqual({
    exports: { foo: expect.any(Function), bar: expect.any(Function) },
    requests: [],
  });
});

it('self-shadowed variables', () => {
  const mod = exec({
    entry: `
      export const state = (state) => state.a;
    `,
  });
  expect(mod).toEqual({
    exports: { state: expect.any(Function) },
    requests: [],
  });
  expect(mod.exports.state({ a: 'a' })).toBe('a');
});

it('shadowed namespace import', () => {
  const mod = exec({
    e: 'export const e = "e";',
    t: 'export default { format: x => x }',
    entry: `
      import * as e from 'e'
      import t from 't'
      export const foo = (e) => ({
        amount: t.format(1),
        e,
      });
    `,
  });
  expect(mod).toEqual({
    exports: { foo: expect.any(Function) },
    requests: ['e', 't'],
  });
  expect(mod.exports.foo('x')).toEqual({ amount: 1, e: 'x' });
});

it('shadowed namespace import (unused)', () => {
  const mod = exec({
    e: 'export const e = "e";',
    t: 'export default { format: x => x }',
    entry: `
      import * as e from 'e'
      import t from 't'
      export const foo = (e) => ({
        amount: t.format(1),
      });
    `,
  });
  expect(mod).toEqual({
    exports: { foo: expect.any(Function) },
    requests: ['e', 't'],
  });
  expect(mod.exports.foo()).toEqual({ amount: 1 });
});
