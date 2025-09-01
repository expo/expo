import { makeEval } from './utils';

const exec = makeEval();

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
