import generate from '@babel/generator';

import { importExportLiveBindingsPlugin } from '../importExportLiveBindings';
import { transformToAst } from './__mocks__/test-helpers-upstream';

const opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

const test =
  (name: string) =>
  ([code]: readonly string[]) => [name, code];

const cases = [
  test('class-properties live-rewrite')`
    import {test1, test2, test3, test4, test5, test6, test7, test8, test9} from 'anywhere';

    class Example {
      #test1 = test1;
      test2 = test2;
      #test3() { return test3; }
      test4() { return test4; }
      get #test5() { return test5; }
      get test6() { return test6; }

      #test7 = this.#test1;
      #test8() { return this.#test3(); }
      get #test9() { return this.#test5(); }
    }
  `,
  test('class-properties private-method')`
    class Example {
      #method() {
        console.log(this);
      }
    }
  `,
  test('class-properties private')`
    class Example {
      #property = this;
    }
  `,
  test('class-properties public')`
    class Example {
      property = this;
    }
  `,
  test('disable-strict-mode strictMode-false')`
    import "foo";
    import "foo-bar";
    import "./directory/foo-bar";
  `,
  test('importInterop-none export-from')`
    export { default } from 'foo';
  `,
  test('importInterop-none import-default-only')`
    import foo from "foo";

    foo();
  `,
  test('importInterop-none import-wildcard')`
    import * as foo from 'foo';

    foo.bar();
    foo.baz();
  `,
  test('interop export-all')`
    // The fact that this exports both a normal default, and all of the names via
    // re-export is an edge case that is important not to miss. See
    // https://github.com/babel/babel/issues/8306 as an example.
    import _default from 'react';
    export default _default;
    export * from 'react';
  `,
  test('interop export-default-10')`
    export default (function(){return "foo"})();
  `,
  test('interop export-default-11')`
    export default new Cacher()

    export function Cacher(databaseName) {}
  `,
  test('interop export-default-2')`
    export default {};
  `,
  test('interop export-default-3')`
    export default [];
  `,
  test('interop export-default-4')`
    export default foo;
  `,
  test('interop export-default-5')`
    export default function () {}
  `,
  test('interop export-default-6')`
    export default class {}
  `,
  test('interop export-default-7')`
    export default function foo () {}
  `,
  test('interop export-default-8')`
    export default class Foo {}
  `,
  test('interop export-default-9')`
    var foo;
    export { foo as default };
  `,
  test('interop export-default')`
    export default 42;
  `,
  test('interop export-destructured')`
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
  test('interop export-from-2')`
    export {foo} from "foo";
  `,
  test('interop export-from-3')`
    export {foo, bar} from "foo";
  `,
  test('interop export-from-4')`
    export {foo as bar} from "foo";
  `,
  test('interop export-from-5')`
    export {foo as default} from "foo";
  `,
  test('interop export-from-6')`
    export {foo as default, bar} from "foo";
  `,
  test('interop export-from-7')`
    export {default as foo} from "foo";
  `,
  test('interop export-from-8')`
    import { foo, foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9, foo10, foo11, foo12, foo13, foo14, foo15, foo16, foo17, foo18, foo19, foo20, foo21, foo22, foo23, foo24, foo25, foo26, foo27, foo28, foo29, foo30, foo31, foo32, foo33, foo34, foo35, foo36, foo37, foo38, foo39, foo40, foo41, foo42, foo43, foo44, foo45, foo46, foo47, foo48, foo49, foo50, foo51, foo52, foo53, foo54, foo55, foo56, foo57, foo58, foo59, foo60, foo61, foo62, foo63, foo64, foo65, foo66, foo67, foo68, foo69, foo70, foo71, foo72, foo73, foo74, foo75, foo76, foo77, foo78, foo79, foo80, foo81, foo82, foo83, foo84, foo85, foo86, foo87, foo88, foo89, foo90, foo91, foo92, foo93, foo94, foo95, foo96, foo97, foo98, foo99, foo100 } from "foo";
    export { foo, foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9, foo10, foo11, foo12, foo13, foo14, foo15, foo16, foo17, foo18, foo19, foo20, foo21, foo22, foo23, foo24, foo25, foo26, foo27, foo28, foo29, foo30, foo31, foo32, foo33, foo34, foo35, foo36, foo37, foo38, foo39, foo40, foo41, foo42, foo43, foo44, foo45, foo46, foo47, foo48, foo49, foo50, foo51, foo52, foo53, foo54, foo55, foo56, foo57, foo58, foo59, foo60, foo61, foo62, foo63, foo64, foo65, foo66, foo67, foo68, foo69, foo70, foo71, foo72, foo73, foo74, foo75, foo76, foo77, foo78, foo79, foo80, foo81, foo82, foo83, foo84, foo85, foo86, foo87, foo88, foo89, foo90, foo91, foo92, foo93, foo94, foo95, foo96, foo97, foo98, foo99, foo100 }
  `,
  test('interop export-from-9')`
    export { __proto__ } from "xyz";
  `,
  test('interop export-from')`
    export * from "foo";
  `,
  test('interop export-named-2')`
    var foo, bar;
    export {foo, bar};
  `,
  test('interop export-named-3')`
    var foo;
    export {foo as bar};
  `,
  test('interop export-named-4')`
    var foo;
    export {foo as default};
  `,
  test('interop export-named-5')`
    var foo, bar;
    export {foo as default, bar};
  `,
  test('interop export-named-6')`
    export const __proto__ = null;
    export const a = 1;
    export const _ = 2;

    import { __proto__ as p } from "./input.js";

    console.log(p);
  `,
  test('interop export-named')`
    var foo;
    export {foo};
  `,
  test('interop exports-variable')`
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
  test('interop hoist-function-exports')`
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
  test('interop illegal-export-esmodule-2')`
    var __esModule;
    export { __esModule };
  `,
  test('interop illegal-export-esmodule')`
    export var __esModule = false;
  `,
  test('interop imports-default')`
    import foo from "foo";
    import {default as foo2} from "foo";

    foo;
    foo2;
  `,
  test('interop imports-glob')`
    import * as foo from "foo";
  `,
  test('interop imports-hoisting')`
    tag\`foo\`;
  `,
  test('interop imports-mixing')`
    import foo, {baz as xyz} from "foo";

    foo;
    xyz;
  `,
  test('interop imports-named')`
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
  test('interop imports-ordering')`
    import './foo';
    import bar from './bar';
    import './derp';
    import { qux } from './qux';
  `,
  test('interop imports')`
    import "foo";
    import "foo-bar";
    import "./directory/foo-bar";
  `,
  test('interop module-shadow')`
    export function module() {
      
    }
  `,
  test('interop multi-load')`
    export {};

    console.log(helper);
  `,
  test('interop overview')`
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
  test('interop remap')`
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
  test('misc binding-for-new-vars')`
    import {x} from './foo.js';
    var y = true;
    function f() {
      return [x, y, console];
    }
  `,
  test('misc class-static-block')`
    class foo {
        static {
            this // should not be replaced by undefined
        }
    }
  `,
  test('misc copy-getters-setters-star')`
    import * as foo from "./moduleWithGetter";

    export { foo };
  `,
  test('misc copy-getters-setters')`
    import Foo, { baz } from "./moduleWithGetter";

    export { Foo, baz };
  `,
  // NOTE(krystofwoldrich): Causes duplicate Identifier node in the output error
  // test('misc export-expr-with-same-name')`
  //   import someFunction from './b';

  //   export default (function someFunction () {
  //   });
  // `,
  test('misc export-let-function-name-with-fn-name-transform')`
    export let a = function () {};
    export let b = function X() {};
    export let c = () => {};
    export let d = class {};
    export let e = class Y {};
  `,
  test('misc export-let-function-name')`
    export let a = function () {};
    export let b = function X() {};
    export let c = () => {};
    export let d = class {};
    export let e = class Y {};
  `,
  test('misc export-var-and-modify')`
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
  `,
  test('misc for-of-in-export')`
    export let foo;
    export {foo as bar}

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
  `,
  test('misc import-const-throw')`
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
  // NOTE(krystofwoldrich): Babel creates a runtime error when reassigning imported value
  // Rollup throws during bundling
  test('misc import-shadowed-assign')`
    import { foo } from "x";

    function f(foo) {
      foo = 2;
      [foo] = [];
      ({ foo } = {});
    }


    foo = 2;
    [foo] = [];
    ({ foo } = {});
  `,
  test('misc local-exports-decl-top-level')`
    import "foo";

    var exports = "local exports";
    var module = "local module";

    console.log(exports);
    console.log(exports.prop);
    exports++;
    exports += 4;
    ({ exports } = {});
    [ exports ] = [];
    exports = {};
    exports.prop = "";


    console.log(module);
    console.log(module.exports);
    module++;
    module += 4;
    ({ module } = {});
    [ module ] = [];
    module = {};
    module.prop = "";
  `,
  test('misc local-exports-decl-with-esm-exports')`
    var exports = 1;

    export let x = 2;

    function fn() {
        x = 3;
        var exports = 4;
    }
  `,
  test('misc local-exports-inject-var-declarations')`
  `,
  test('misc local-exports-invalid-inject-undefined')`
  `,
  test('misc local-exports-var-declarations')`
    export { A, B, C }

    {
      var A;
      switch (0) {
        case 1:
          var B;
          if (2) var C;
      }
    }
  `,
  test('misc module-exports')`
    import "foo";

    console.log(exports);
    console.log(exports.prop);
    exports++;
    exports += 4;
    ({ exports } = {});
    [ exports ] = [];
    exports = {};
    exports.prop = "";


    console.log(module);
    console.log(module.exports);
    module++;
    module += 4;
    ({ module } = {});
    [ module ] = [];
    module = {};
    module.prop = "";
  `,
  test('misc reference-source-map')`
    import aDefault from "one";
    import { aNamed } from "two";
    import { orig as anAliased } from "three";
    import * as aNamespace from "four";

    console.log(aDefault);
    console.log(aNamed);
    console.log(anAliased);
    console.log(aNamespace);

    console.log(aDefault());
    console.log(aNamed());
    console.log(anAliased());
    console.log(aNamespace());
  `,
  test('misc keep-this-arrow-function')`
    var foo = () => this;

  `,
  test('misc keep-this-computed-class-method-1')`
    export class C { [this.name]() {} }
  `,
  test('misc keep-this-computed-class-method-2')`
    class A {
      [() => this.name]() {}
    }
  `,
  test('misc keep-this-computed-class-method-3')`
    class A {
      [function () { this.name; }]() {}
    }
  `,
  test('misc keep-this-computed-class-property-name')`
    export class C { [this.name] = 42 }
  `,
  test('misc keep-this-root-call')`
    this.foo();
  `,
  test('misc keep-this-root-declaration')`
    var self = this;
  `,
  test('misc keep-this-root-reference')`
    this;
  `,
  test('shadowed-namespace-import transformed-name')`
    import * as e from "mod";
    import t from "mod";

    const foo = (e) => {
      return {
        amount: t.format(1),
      };
    };
  `,
  // TODO(krystofwoldrich): updates to foo, bar and baz are technically done before the export,
  // but Babel and Rollup do the updates directly on exports
  test('update-expression bigint')`
    export let foo = 1n;

    export let bar = foo++;

    export let baz = ++bar;

    expect(foo).toBe(2n);
    expect(bar).toBe(2n);
    expect(baz).toBe(2n);

    export { foo as foofoo, bar as barbar };
    export { baz as bazbaz };

    --foo;
    bar--;
    baz--;
  `,
  // TODO(krystofwoldrich): --diffLevel should update the exported value
  test('update-expression negative-suffix')`
    export let diffLevel = 0;

    export function diff() {
      if (!--diffLevel) {
        console.log("hey");
      }
    }
  `,
  // TODO(krystofwoldrich): ++diffLevel should update the exported value
  test('update-expression positive-suffix')`
    export let diffLevel = 0;

    export function diff() {
      if (!++diffLevel) {
        console.log("hey");
      }
    }
  `,
];

const getExpected = (code: string) =>
  generate(transformToAst([importExportLiveBindingsPlugin], code, { ...opts, liveBindings: true }))
    .code;

it.each(cases)('%s', (_name, code) => {
  expect(getExpected(code)).toMatchSnapshot();
});
