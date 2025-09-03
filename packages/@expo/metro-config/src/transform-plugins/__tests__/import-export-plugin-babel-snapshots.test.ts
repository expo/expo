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
  test('importInterop-node export-default-from')`
    export { default } from 'dep';
  `,
  test('importInterop-node export-named-and-default-from')`
    export { default, name } from 'dep';
  `,
  test('importInterop-node export-named-from')`
    export { name } from 'dep';
  `,
  test('importInterop-node import-default')`
    import foo from "foo";

    foo();
  `,
  test('importInterop-node import-named-and-default')`
    import foo, { named } from "foo";

    foo();
    named();
  `,
  test('importInterop-node import-named')`
    import { named } from "foo";

    named();
  `,
  test('importInterop-node import-wildcard')`
    import * as foo from 'foo';

    foo.bar();
    foo.baz();
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
  test('lazy-dep import-default')`
    import foo from "foo";

    console.log(foo);
  `,
  test('lazy-dep import-named')`
    import { foo } from "foo";

    console.log(foo);
  `,
  test('lazy-dep import-namespace-and-named')`
    import * as foo from "foo";
    import { bar } from "foo";

    console.log(foo, bar);
  `,
  test('lazy-dep import-namespace-multiple')`
    import * as foo from "foo";
    import * as foo2 from "foo";

    console.log(foo, foo2);
  `,
  test('lazy-dep import-namespace')`
    import * as foo from "foo";

    console.log(foo);
  `,
  test('lazy-dep reexport-all')`
    export * from "foo";
  `,
  test('lazy-dep reexport-default')`
    import foo from "foo";
    export { foo as default };
  `,
  test('lazy-dep reexport-named')`
    import { named } from "foo";
    export { named };
  `,
  test('lazy-dep reexport-namespace')`
    import * as namespace from "foo";
    export { namespace };
  `,
  test('lazy-dep sideeffect')`
    import "foo";
  `,
  test('lazy-dep unused')`
    import { a } from "a";
    import b from "b";
    import * as c from "c";

    // This is included explicitly for the side effects, so we keep it
    import "d";

    // Only f is unused, we must keep the require call
    import { e, f } from "e";
    e;

    // The first import is unused, but we keep the require call
    // because of the second one
    import { g } from "g";
    import { h } from "g";
    h;
  `,
  test('lazy-local import-default')`
    import foo from "./foo";

    console.log(foo);
  `,
  test('lazy-local import-named')`
    import { foo } from "./foo";

    console.log(foo);
  `,
  test('lazy-local import-namespace')`
    import * as foo from "./foo";

    console.log(foo);
  `,
  test('lazy-local reexport-all')`
    export * from "./foo";
  `,
  test('lazy-local reexport-default')`
    import foo from "./foo";
    export { foo as default };
  `,
  test('lazy-local reexport-named')`
    import { named } from "./foo";
    export { named };
  `,
  test('lazy-local reexport-namespace')`
    import * as namespace from "./foo";
    export { namespace };
  `,
  test('lazy-local sideeffect')`
    import "./a";
  `,
  test('lazy-whitelist import-default')`
    import foo1 from "white";

    console.log(foo1);

    import foo2 from "black";

    console.log(foo2);
  `,
  test('lazy-whitelist import-named')`
    import { foo1 } from "white";

    console.log(foo1);

    import { foo2 } from "black";

    console.log(foo2);
  `,
  test('lazy-whitelist import-namespace')`
    import * as foo1 from "white";

    console.log(foo1);

    import * as foo2 from "black";

    console.log(foo2);
  `,
  test('lazy-whitelist reexport-all')`
    export * from "white";

    export * from "black";
  `,
  test('lazy-whitelist reexport-default')`
    import foo from "white";
    export { foo as default };
  `,
  test('lazy-whitelist reexport-named')`
    import { named1 } from "white";
    export { named1 };

    import { named2 } from "black";
    export { named2 };
  `,
  test('lazy-whitelist reexport-namespace')`
    import * as namespace1 from "white";
    export { namespace1 };

    import * as namespace2 from "black";
    export { namespace2 };
  `,
  test('lazy-whitelist sideeffect')`
    import "white";
    import "black";
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
  test('misc export-expr-with-same-name')`
    import someFunction from './b';

    export default (function someFunction () {
    });
  `,
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
  test('misc undefined-this-arrow-function')`
    var foo = () => this;

  `,
  test('misc undefined-this-computed-class-method-1')`
    export class C { [this.name]() {} }
  `,
  test('misc undefined-this-computed-class-method-2')`
    class A {
      [() => this.name]() {}
    }
  `,
  test('misc undefined-this-computed-class-method-3')`
    class A {
      [function () { this.name; }]() {}
    }
  `,
  test('misc undefined-this-computed-class-property-name')`
    export class C { [this.name] = 42 }
  `,
  test('misc undefined-this-root-call')`
    this.foo();
  `,
  test('misc undefined-this-root-declaration')`
    var self = this;
  `,
  test('misc undefined-this-root-reference')`
    this;
  `,
  test('regression 4462-T7565')`
    export { yy, zz };

    var yy = 0;
    var zz = yy++;
  `,
  test('regression es3-compatibility-class')`
    export default class {}
  `,
  test('regression es3-compatibility-function')`
    export default function () {}
  `,
  test('regression es3-compatibility-named-class')`
    export default class Foo {}
  `,
  test('regression es3-compatibility-named-function')`
    export default function bat () {}
  `,
  test('regression es3-compatibility')`

    import foo from 'foo';
    console.log(foo);

    export default 5;
  `,
  test('regression issue-9155')`
    export {};
  `,
  test('regression issue-9611')`
    import x from './x';

    export default function(x) {}
  `,
  test('regression lazy-7176')`
    import * as mod from "mod";
    import { named } from "mod";

    named;
    mod;
  `,
  test('regression many-exports-chunked')`
    export const a000 = 0;
    export const a001 = 1;
    export const a002 = 2;
    export const a003 = 3;
    export const a004 = 4;
    export const a005 = 5;
    export const a006 = 6;
    export const a007 = 7;
    export const a008 = 8;
    export const a009 = 9;
    export const a010 = 10;
    export const a011 = 11;
    export const a012 = 12;
    export const a013 = 13;
    export const a014 = 14;
    export const a015 = 15;
    export const a016 = 16;
    export const a017 = 17;
    export const a018 = 18;
    export const a019 = 19;
    export const a020 = 20;
    export const a021 = 21;
    export const a022 = 22;
    export const a023 = 23;
    export const a024 = 24;
    export const a025 = 25;
    export const a026 = 26;
    export const a027 = 27;
    export const a028 = 28;
    export const a029 = 29;
    export const a030 = 30;
    export const a031 = 31;
    export const a032 = 32;
    export const a033 = 33;
    export const a034 = 34;
    export const a035 = 35;
    export const a036 = 36;
    export const a037 = 37;
    export const a038 = 38;
    export const a039 = 39;
    export const a040 = 40;
    export const a041 = 41;
    export const a042 = 42;
    export const a043 = 43;
    export const a044 = 44;
    export const a045 = 45;
    export const a046 = 46;
    export const a047 = 47;
    export const a048 = 48;
    export const a049 = 49;
    export const a050 = 50;
    export const a051 = 51;
    export const a052 = 52;
    export const a053 = 53;
    export const a054 = 54;
    export const a055 = 55;
    export const a056 = 56;
    export const a057 = 57;
    export const a058 = 58;
    export const a059 = 59;
    export const a060 = 60;
    export const a061 = 61;
    export const a062 = 62;
    export const a063 = 63;
    export const a064 = 64;
    export const a065 = 65;
    export const a066 = 66;
    export const a067 = 67;
    export const a068 = 68;
    export const a069 = 69;
    export const a070 = 70;
    export const a071 = 71;
    export const a072 = 72;
    export const a073 = 73;
    export const a074 = 74;
    export const a075 = 75;
    export const a076 = 76;
    export const a077 = 77;
    export const a078 = 78;
    export const a079 = 79;
    export const a080 = 80;
    export const a081 = 81;
    export const a082 = 82;
    export const a083 = 83;
    export const a084 = 84;
    export const a085 = 85;
    export const a086 = 86;
    export const a087 = 87;
    export const a088 = 88;
    export const a089 = 89;
    export const a090 = 90;
    export const a091 = 91;
    export const a092 = 92;
    export const a093 = 93;
    export const a094 = 94;
    export const a095 = 95;
    export const a096 = 96;
    export const a097 = 97;
    export const a098 = 98;
    export const a099 = 99;
    export const a100 = 100;
    export const a101 = 101;
    export const a102 = 102;
    export const a103 = 103;
    export const a104 = 104;
    export const a105 = 105;
    export const a106 = 106;
    export const a107 = 107;
    export const a108 = 108;
    export const a109 = 109;
    export const a110 = 110;
    export const a111 = 111;
    export const a112 = 112;
    export const a113 = 113;
    export const a114 = 114;
    export const a115 = 115;
    export const a116 = 116;
    export const a117 = 117;
    export const a118 = 118;
    export const a119 = 119;
    export const a120 = 120;
    export const a121 = 121;
    export const a122 = 122;
    export const a123 = 123;
    export const a124 = 124;
    export const a125 = 125;
    export const a126 = 126;
    export const a127 = 127;
    export const a128 = 128;
    export const a129 = 129;
    export const a130 = 130;
    export const a131 = 131;
    export const a132 = 132;
    export const a133 = 133;
    export const a134 = 134;
    export const a135 = 135;
    export const a136 = 136;
    export const a137 = 137;
    export const a138 = 138;
    export const a139 = 139;
    export const a140 = 140;
    export const a141 = 141;
    export const a142 = 142;
    export const a143 = 143;
    export const a144 = 144;
    export const a145 = 145;
    export const a146 = 146;
    export const a147 = 147;
    export const a148 = 148;
    export const a149 = 149;
    export const a150 = 150;
    export const a151 = 151;
    export const a152 = 152;
    export const a153 = 153;
    export const a154 = 154;
    export const a155 = 155;
    export const a156 = 156;
    export const a157 = 157;
    export const a158 = 158;
    export const a159 = 159;
    export const a160 = 160;
    export const a161 = 161;
    export const a162 = 162;
    export const a163 = 163;
    export const a164 = 164;
    export const a165 = 165;
    export const a166 = 166;
    export const a167 = 167;
    export const a168 = 168;
    export const a169 = 169;
    export const a170 = 170;
    export const a171 = 171;
    export const a172 = 172;
    export const a173 = 173;
    export const a174 = 174;
    export const a175 = 175;
    export const a176 = 176;
    export const a177 = 177;
    export const a178 = 178;
    export const a179 = 179;
    export const a180 = 180;
    export const a181 = 181;
    export const a182 = 182;
    export const a183 = 183;
    export const a184 = 184;
    export const a185 = 185;
    export const a186 = 186;
    export const a187 = 187;
    export const a188 = 188;
    export const a189 = 189;
    export const a190 = 190;
    export const a191 = 191;
    export const a192 = 192;
    export const a193 = 193;
    export const a194 = 194;
    export const a195 = 195;
    export const a196 = 196;
    export const a197 = 197;
    export const a198 = 198;
    export const a199 = 199;
    export const a200 = 200;
    export const a201 = 201;
    export const a202 = 202;
    export const a203 = 203;
    export const a204 = 204;
    export const a205 = 205;
    export const a206 = 206;
    export const a207 = 207;
    export const a208 = 208;
    export const a209 = 209;
    export const a210 = 210;
    export const a211 = 211;
    export const a212 = 212;
    export const a213 = 213;
    export const a214 = 214;
    export const a215 = 215;
    export const a216 = 216;
    export const a217 = 217;
    export const a218 = 218;
    export const a219 = 219;
    export const a220 = 220;
    export const a221 = 221;
    export const a222 = 222;
    export const a223 = 223;
    export const a224 = 224;
    export const a225 = 225;
    export const a226 = 226;
    export const a227 = 227;
    export const a228 = 228;
    export const a229 = 229;
    export const a230 = 230;
    export const a231 = 231;
    export const a232 = 232;
    export const a233 = 233;
    export const a234 = 234;
    export const a235 = 235;
    export const a236 = 236;
    export const a237 = 237;
    export const a238 = 238;
    export const a239 = 239;
    export const a240 = 240;
    export const a241 = 241;
    export const a242 = 242;
    export const a243 = 243;
    export const a244 = 244;
    export const a245 = 245;
    export const a246 = 246;
    export const a247 = 247;
    export const a248 = 248;
    export const a249 = 249;
  `,
  test('regression T7160')`
    export var foo = function(gen, ctx = null) {

    }

    export var bar = (gen, ctx = null) => {

    }
  `,
  test('regression T7165')`
    import foo from 'foo';
    import { something } from 'bar';

    const anything = {};

    export * from 'bar';
  `,
  test('regression T7199')`
    import foo from 'foo';
    const [x] = bar;
  `,
  test('regression T7272')`
    export const state = (state) => state.a
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
  test('strict export-1')`
    export default foo;
  `,
  test('strict export-2')`
    var foo;
    export { foo as default };
  `,
  test('strict export-3')`
    export {};

    export {} from 'foo';
  `,
  test('strict export-all')`
    export let z = 100;
    export * from 'mod';
    export class a {}
    export function b() {}
    export { c } from 'mod';
    export let d = 42;
    export let e = 1, f = 2;
    export default function() {}
  `,
  test('strict export-const-destructuring-array-default-params')`
    export const [foo, bar = 2] = [];
  `,
  test('strict export-const-destructuring-array-rest')`
    export const [foo, bar, ...baz] = [];
  `,
  test('strict export-const-destructuring-array')`
    export const [foo, bar] = [];
  `,
  test('strict export-const-destructuring-deep')`
    export const { foo: { bar: [baz, qux] } } = {};
  `,
  test('strict export-const-destructuring-object-default-params')`
    export const { foo, bar = 1 } = {};
  `,
  test('strict export-const-destructuring-object-rest')`
    export const { foo, ...bar } = {};
  `,
  test('strict export-const-destructuring-object')`
    export const { foo: bar, baz } = {};
  `,
  test('strict export')`
    export function foo() {}
  `,
  test('strict import-wildcard')`
    import * as foo from 'foo';

    foo.bar();
    foo.baz();
  `,
  test('strict import')`
    import foo from "foo";
    import { default as foo2 } from "foo";
    import { foo3 } from "foo";
    import * as foo4 from "foo";

    foo;
    foo2;
    foo3;
    foo3();
    foo3\`\`;
    foo3?.();
  `,
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
  test('update-expression negative-suffix')`
    export let diffLevel = 0;

    export function diff() {
      if (!--diffLevel) {
        console.log("hey");
      }
    }
  `,
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
  generate(transformToAst([importExportPlugin], code, { ...opts, liveBindings: true })).code;

it.each(cases)('%s', (_name, code) => {
  expect(getExpected(code)).toMatchSnapshot();
});
