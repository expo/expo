import generate from '@babel/generator';

import { importExportPlugin } from '../import-export-plugin';
import { transformToAst } from './__mocks__/test-helpers-upstream';

const opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

const test =
  (name: string) =>
  ([code]: readonly string[]) => [name, code];

const cases = [
  test('interop-loose export-default-10')`
    export default (function(){return "foo"})();
  `,
  test('interop-loose export-default-11')`
    export default new Cacher()

    export function Cacher(databaseName) {}
  `,
  test('interop-loose export-default-2')`
    export default {};
  `,
  test('interop-loose export-default-3')`
    export default [];
  `,
  test('interop-loose export-default-4')`
    export default foo;
  `,
  test('interop-loose export-default-5')`
    export default function () {}
  `,
  test('interop-loose export-default-6')`
    export default class {}
  `,
  test('interop-loose export-default-7')`
    export default function foo () {}
  `,
  test('interop-loose export-default-8')`
    export default class Foo {}
  `,
  test('interop-loose export-default-9')`
    var foo;
    export { foo as default };
  `,
  test('interop-loose export-default')`
    export default 42;
  `,
  test('interop-loose export-destructured')`
    export let x = 0;
    export let y = 0;

    export function f1 () {
      ({x} = { x: 1 });
    }

    export function f2 () {
      ({x, y} = { x: 2, y: 3 });
    }

    export function f3 () {
      [x, y, z] = [3, 4, 5]
    }

    export function f4 () {
      [x, , y] = [3, 4, 5]
    }
  `,
  test('interop-loose export-from-2')`
    export {foo} from "foo";
  `,
  test('interop-loose export-from-3')`
    export {foo, bar} from "foo";
  `,
  test('interop-loose export-from-4')`
    export {foo as bar} from "foo";
  `,
  test('interop-loose export-from-5')`
    export {foo as default} from "foo";
  `,
  test('interop-loose export-from-6')`
    export {foo as default, bar} from "foo";
  `,
  test('interop-loose export-from-7')`
    export {default as foo} from "foo";
  `,
  test('interop-loose export-from-8')`
    import { foo, foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9, foo10, foo11, foo12, foo13, foo14, foo15, foo16, foo17, foo18, foo19, foo20, foo21, foo22, foo23, foo24, foo25, foo26, foo27, foo28, foo29, foo30, foo31, foo32, foo33, foo34, foo35, foo36, foo37, foo38, foo39, foo40, foo41, foo42, foo43, foo44, foo45, foo46, foo47, foo48, foo49, foo50, foo51, foo52, foo53, foo54, foo55, foo56, foo57, foo58, foo59, foo60, foo61, foo62, foo63, foo64, foo65, foo66, foo67, foo68, foo69, foo70, foo71, foo72, foo73, foo74, foo75, foo76, foo77, foo78, foo79, foo80, foo81, foo82, foo83, foo84, foo85, foo86, foo87, foo88, foo89, foo90, foo91, foo92, foo93, foo94, foo95, foo96, foo97, foo98, foo99, foo100 } from "foo";
    export { foo, foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9, foo10, foo11, foo12, foo13, foo14, foo15, foo16, foo17, foo18, foo19, foo20, foo21, foo22, foo23, foo24, foo25, foo26, foo27, foo28, foo29, foo30, foo31, foo32, foo33, foo34, foo35, foo36, foo37, foo38, foo39, foo40, foo41, foo42, foo43, foo44, foo45, foo46, foo47, foo48, foo49, foo50, foo51, foo52, foo53, foo54, foo55, foo56, foo57, foo58, foo59, foo60, foo61, foo62, foo63, foo64, foo65, foo66, foo67, foo68, foo69, foo70, foo71, foo72, foo73, foo74, foo75, foo76, foo77, foo78, foo79, foo80, foo81, foo82, foo83, foo84, foo85, foo86, foo87, foo88, foo89, foo90, foo91, foo92, foo93, foo94, foo95, foo96, foo97, foo98, foo99, foo100 }
  `,
  test('interop-loose export-from')`
    export * from "foo";
  `,
  test('interop-loose export-named-2')`
    var foo, bar;
    export {foo, bar};
  `,
  test('interop-loose export-named-3')`
    var foo;
    export {foo as bar};
  `,
  test('interop-loose export-named-4')`
    var foo;
    export {foo as default};
  `,
  test('interop-loose export-named-5')`
    var foo, bar;
    export {foo as default, bar};
  `,
  test('interop-loose export-named')`
    var foo;
    export {foo};
  `,
  test('interop-loose exports-variable')`
    export var foo = 1;
    export var foo2 = 1, bar = 2;
    export var foo3 = function () {};
    export var foo4;
    export let foo5 = 2;
    export let foo6;
    export const foo7 = 3;
    export function foo8 () {}
    export class foo9 {}
  `,
  test('interop-loose hoist-function-exports')`
    import { isEven } from "./evens";

    export function nextOdd(n) {
      return isEven(n) ? n + 1 : n + 2;
    }

    export var isOdd = (function (isEven) {
      return function (n) {
        return !isEven(n);
      };
    })(isEven);
  `,
  test('interop-loose illegal-export-esmodule-2')`
    var __esModule;
    export { __esModule };
  `,
  test('interop-loose illegal-export-esmodule')`
    export var __esModule = false;
  `,
  test('interop-loose imports-default')`
    import foo from "foo";
    import {default as foo2} from "foo";

    foo;
    foo2;
  `,
  test('interop-loose imports-glob')`
    import * as foo from "foo";
  `,
  test('interop-loose imports-hoisting')`
    tag\`foo\`;
  `,
  test('interop-loose imports-mixing')`
    import foo, {baz as xyz} from "foo";

    foo;
    xyz;
  `,
  test('interop-loose imports-named')`
    import {bar} from "foo";
    import {bar2, baz} from "foo";
    import {bar as baz2} from "foo";
    import {bar as baz3, xyz} from "foo";

    bar;
    bar2;
    baz;
    baz2;
    baz3;
    xyz;
  `,
  test('interop-loose imports-ordering')`
    import './foo';
    import bar from './bar';
    import './derp';
    import { qux } from './qux';
  `,
  test('interop-loose imports')`
    import "foo";
    import "foo-bar";
    import "./directory/foo-bar";
  `,
  test('interop-loose module-shadow')`
    export function module() {
      
    }
  `,
  test('interop-loose multi-load')`
    export {};

    console.log(helper);
  `,
  test('interop-loose overview')`
    import "foo";
    import "foo-bar";
    import "./directory/foo-bar";
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
  test('interop-loose remap')`
    export var test = 2;
    test = 5;
    test++;

    (function () {
      var test = 2;
      test = 3;
      test++;
    })();

    var a = 2;
    export { a };
    a = 3;

    var b = 2;
    export { b as c };
    b = 3;

    var d = 3;
    export { d as e, d as f };
    d = 4;
  `,
];

const getExpected = (code: string) =>
  generate(transformToAst([importExportPlugin], code, { ...opts, liveBindings: false })).code;

it.each(cases)('%s', (_name, code) => {
  expect(getExpected(code)).toMatchSnapshot();
});
