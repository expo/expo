import { makeEval } from './utils';

const exec = makeEval();

it('export constant', () => {
  expect(
    exec({
      foo: 'export const foo = "foo";',
      entry: 'export {foo} from "foo";',
    })
  ).toEqual({
    exports: { foo: 'foo' },
    requests: ['foo'],
  });
});

it('export default', () => {
  expect(
    exec({
      foo: 'export const foo = "foo";',
      entry: 'export {foo as default} from "foo";',
    })
  ).toEqual({
    exports: { default: 'foo' },
    requests: ['foo'],
  });
});

it('export constant as default and constant', () => {
  expect(
    exec({
      foo: `
        export const foo = "foo";
        export const bar = "bar";
      `,
      entry: 'export {foo as default, bar} from "foo";',
    })
  ).toEqual({
    exports: { default: 'foo', bar: 'bar' },
    requests: ['foo'],
  });
});

it('export constant with alias', () => {
  expect(
    exec({
      foo: `
        export const foo = "foo";
      `,
      entry: 'export {foo as bar} from "foo";',
    })
  ).toEqual({
    exports: { bar: 'foo' },
    requests: ['foo'],
  });
});

it('export two constants', () => {
  expect(
    exec({
      foo: `
        export const foo = "foo";
        export const bar = "bar";
      `,
      entry: 'export {foo, bar} from "foo";',
    })
  ).toEqual({
    exports: { foo: 'foo', bar: 'bar' },
    requests: ['foo'],
  });
});

it('export all constants', () => {
  expect(
    exec({
      foo: `
        export const foo = "foo";
        export const bar = "bar";
      `,
      entry: 'export * from "foo";',
    })
  ).toEqual({
    exports: { foo: 'foo', bar: 'bar' },
    requests: ['foo'],
  });
});

it('import then export constant', () => {
  expect(
    exec({
      foo: `
        export const foo = "foo";
      `,
      entry: `
        import { foo } from "foo";
        export { foo };
      `,
    })
  ).toEqual({
    exports: { foo: 'foo' },
    requests: ['foo'],
  });
});

it('export var', () => {
  expect(
    exec({
      foo: `
        export var foo = "foo";
      `,
      entry: `
        export { foo } from "foo";
      `,
    })
  ).toEqual({
    exports: { foo: 'foo' },
    requests: ['foo'],
  });
});

it('auxiliary comment', () => {
  expect(
    exec({
      foo: '',
      'foo-bar': '',
      foo2: 'export default "foo2";',
      foo3: 'export const foo3 = "foo2";',
      foo4: 'export function bar() { /*noop*/ }',
      foo5: 'export const foo = "foo5-bar2";',
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

        bar(foo, bar2);

        /* my comment */
        bar2;
        foo;
      `,
    })
  ).toEqual({
    exports: {
      test: undefined,
      test2: 5,
    },
    requests: ['foo', 'foo-bar', 'foo2', 'foo4', 'foo5'],
  });
});
