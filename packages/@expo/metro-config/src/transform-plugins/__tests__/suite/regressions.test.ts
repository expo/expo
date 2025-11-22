import { makeEval } from './utils';

const exec = makeEval();

// See: https://github.com/expo/expo/issues/39277
it('side-effect import order (#39277)', () => {
  expect(
    exec({
      sideEffect: 'export {}',
      default: 'export default "default";',
      exports: 'export const foo = "foo";',
      entry: `
        import "sideEffect";
        export { default } from "default";
        export * from "exports";
      `,
    })
  ).toEqual({
    exports: {
      foo: 'foo',
      default: 'default',
    },
    requests: ['sideEffect', 'default', 'exports'],
  });
});

// See: https://github.com/expo/expo/pull/39276
it('double import-default shadowed by export specifier (#39276)', () => {
  expect(
    exec({
      react: 'export default "react";',
      entry: `
        import A from "react";
        import B from "react";
        A;
        B;
        var x = "x";
        export { x as A };
      `,
    })
  ).toEqual({
    exports: {
      A: 'x',
    },
    requests: ['react'],
  });
});

// See: https://github.com/expo/expo/pull/38976
it('live-bound re-export default (#38976)', () => {
  const mod = exec({
    default: `
      let test = 0;
      export { test as default };
      export function inc() {
        test++;
      }
    `,
    entry: `
      export { default, inc } from './default';
    `,
  });
  expect(mod).toEqual({
    exports: { default: 0, inc: expect.any(Function) },
    requests: ['default'],
  });
  mod.exports.inc();
  expect(mod.exports.default).toBe(1);
});

// See: https://github.com/expo/expo/pull/38951
it('prevents default and namespace conflicts (#38951)', () => {
  expect(
    exec({
      a: `
      export const a = "a";
      export default "A";
    `,
      entry: `
      import A from "a";
      import * as a from "a";
      export { A, a };
    `,
    })
  ).toEqual({
    exports: { A: 'A', a: { a: 'a', default: 'A' } },
    requests: ['a'],
  });
});

// See: https://github.com/expo/expo/pull/38111
it('supports cicular deps initialization (#38111)', () => {
  expect(
    exec({
      a: `
      export const a = "a";
    `,
      b: `
      import { a } from "entry";
      export const b = "b" + a;
    `,
      entry: `
      export { a } from "a";
      export { b } from "b";
    `,
    })
  ).toEqual({
    exports: { a: 'a', b: 'ba' },
    requests: ['a', 'b'],
  });
});

// See: https://github.com/expo/expo/pull/39362
it('supports unbound function calls without implicit bound member-expression call (#39362)', () => {
  expect(
    exec({
      foo: `
        globalThis.x = 1;
        function fn() {
          return this.x;
        }
        export default fn;
      `,
      entry: `
        import fn from "foo";
        export const test = fn();
      `,
    })
  ).toEqual({
    exports: { test: 1 },
    requests: ['foo'],
  });
});
