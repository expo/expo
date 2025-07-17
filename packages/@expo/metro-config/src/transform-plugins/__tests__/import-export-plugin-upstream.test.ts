/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Copy of the upstream test to ensure compatible behavior.

import { importExportPlugin } from '../import-export-plugin';
import { compare } from './__mocks__/test-helpers-upstream';
import { showTransformedDeps } from './utils';

const opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

it('correctly transforms and extracts "import" statements', () => {
  const code = `
    import v from 'foo';
    import * as w from 'bar';
    import {x} from 'baz';
    import {y as z} from 'qux';
    import 'side-effect';
  `;

  const expected = `
    var v = _$$_IMPORT_DEFAULT('foo');
    var w = _$$_IMPORT_ALL('bar');
    var x = require('baz').x;
    var z = require('qux').y;
    require('side-effect');
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     import v from 'foo';
        |     ^^^^^^^^^^^^^^^^^^^^ dep #0 (foo)
    > 3 |     import * as w from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (bar)
    > 4 |     import {x} from 'baz';
        |     ^^^^^^^^^^^^^^^^^^^^^^ dep #2 (baz)
    > 5 |     import {y as z} from 'qux';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #3 (qux)
    > 6 |     import 'side-effect';
        |     ^^^^^^^^^^^^^^^^^^^^^ dep #4 (side-effect)"
  `);
});

it('correctly transforms complex patterns', () => {
  const code = `
    import 'first-with-side-effect';
    import a, * as b from 'second';
    import c, {d as e, f} from 'third';
    import {g, h} from 'third';
    import 'fourth-with-side-effect';
    import {i} from 'fifth';
  `;

  // TODO: Check is creating unused identifiers an issue? Causes 2 change to 4 in the test below.
  const expected = `
    require('first-with-side-effect');
    var a = _$$_IMPORT_DEFAULT('second');
    var b = _$$_IMPORT_ALL('second');
    var _third = require('third'),
        e = _third.d,
        f = _third.f;
    var c = _$$_IMPORT_DEFAULT('third');
    var _third4 = require('third'),
        g = _third4.g,
        h = _third4.h;
    require('fourth-with-side-effect');
    var i = require('fifth').i;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     import 'first-with-side-effect';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (first-with-side-effect)
    > 3 |     import a, * as b from 'second';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (second)
    > 3 |     import a, * as b from 'second';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (second)
    > 4 |     import c, {d as e, f} from 'third';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (third)
    > 4 |     import c, {d as e, f} from 'third';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (third)
    > 5 |     import {g, h} from 'third';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (third)
    > 6 |     import 'fourth-with-side-effect';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #3 (fourth-with-side-effect)
    > 7 |     import {i} from 'fifth';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^ dep #4 (fifth)"
  `);
});

it('hoists declarations to the top', () => {
  const code = `
    foo();
    import {foo} from 'bar';
  `;

  const expected = `
    var foo = require('bar').foo;
    foo();
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 3 |     import {foo} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('exports members of another module directly from an import (as named)', () => {
  const code = `
    export {default as foo} from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _default = _$$_IMPORT_DEFAULT('bar');
    exports.foo = _default;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     export {default as foo} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('exports members of another module directly from an import (as default)', () => {
  const code = `
    export {foo as default, baz} from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _foo = require('bar').foo;
    var _baz = require('bar').baz;
    exports.default = _foo;
    exports.baz = _baz;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     export {foo as default, baz} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)
    > 2 |     export {foo as default, baz} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('exports named members', () => {
  const code = `
    export const foo = 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const foo = 'bar';
    exports.foo = foo;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('renames existing `exports` declarations in module scope', () => {
  const code = `
    const exports = 'foo';
    export const bar = 'bar';
    console.log(exports, bar);
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const _exports = 'foo';
    const bar = 'bar';
    console.log(_exports, bar);
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('handles an export named "exports"', () => {
  const code = `
    export const exports = {a: 'foo'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const _exports = {
      a: 'foo',
    };
    exports.exports = _exports;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('allows mixed esm and cjs exports', () => {
  const code = `
    export const foo = 'foo';
    exports.bar = 'bar';
    module.exports.baz = 'baz';
    export default class {}
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const foo = 'foo';
    exports.bar = 'bar';
    module.exports.baz = 'baz';
    class _default {}
    exports.default = _default;
    exports.foo = foo;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named object members', () => {
  const code = `
    export const {foo,bar} = {foo: 'bar',bar: 'baz'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const {foo,bar} = {foo: 'bar',bar: 'baz'};
    exports.foo = foo;
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named array members', () => {
  const code = `
    export const [foo,bar] = ['bar','baz'];
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const [foo,bar] = ['bar','baz'];
    exports.foo = foo;
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports members of another module directly from an import (as all)', () => {
  const code = `
    export * from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _bar = require("bar");

    for (var _key in _bar) {
      exports[_key] = _bar[_key];
    }
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     export * from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('enables module exporting when something is exported', () => {
  const code = `
    foo();
    import {foo} from 'bar';
    export default foo;
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var foo = require('bar').foo;
    foo();

    var _default = foo;
    exports.default = _default;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 3 |     import {foo} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('renames bindings', () => {
  const code = `
    const module = 'foo';
    let exports = 'bar';
    var global = 'baz';
    const require = {};
  `;

  const expected = `
    const _module = 'foo';
    let _exports = 'bar';
    var _global = 'baz';
    const _require = {};
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('supports `import {default as LocalName}`', () => {
  const code = `
    import {
      Platform,
      default as ReactNative,
    } from 'react-native';
  `;

  const expected = `
    var Platform = require('react-native').Platform;
    var ReactNative = _$$_IMPORT_DEFAULT('react-native');
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 2 |     import {
        |     ^^^^^^^^
    > 3 |       Platform,
        | ^^^^^^^^^^^^^^^
    > 4 |       default as ReactNative,
        | ^^^^^^^^^^^^^^^
    > 5 |     } from 'react-native';
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (react-native)
    > 2 |     import {
        |     ^^^^^^^^
    > 3 |       Platform,
        | ^^^^^^^^^^^^^^^
    > 4 |       default as ReactNative,
        | ^^^^^^^^^^^^^^^
    > 5 |     } from 'react-native';
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (react-native)"
  `);
});
