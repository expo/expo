/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Copy of the upstream test to ensure compatible behavior.

import { importExportLiveBindingsPlugin as importExportPlugin } from '../index';
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

    v; w; x; z;
  `;

  const expected = `
    function _interopDefault(e) {
      return e && e.__esModule ? e : {
        default: e
      };
    }
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
    var _foo = require('foo');
    var v = _interopDefault(_foo);
    var _bar = require('bar');
    var w = _interopNamespace(_bar);
    var _baz = require('baz');
    var _qux = require('qux');
    require('side-effect');
    v.default;
    w;
    _baz.x;
    _qux.y;
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

    a; b; c; e; f; g; h; i;
  `;

  const expected = `
    function _interopDefault(e) {
      return e && e.__esModule ? e : {
        default: e
      };
    }
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
    require('first-with-side-effect');
    var _second = require('second');
    var a = _interopDefault(_second);
    var b = _interopNamespace(_second);
    var _third = require('third');
    var c = _interopDefault(_third);
    require('fourth-with-side-effect');
    var _fifth = require('fifth');
    a.default;
    b;
    c.default;
    _third.d;
    _third.f;
    _third.g;
    _third.h;
    _fifth.i;
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
    var _bar = require('bar');
    (0, _bar.foo)();
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
    function _interopDefault(e) {
      return e && e.__esModule ? e : {
        default: e
      };
    }
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return _bar2.default;
      }
    });
    var _bar = require('bar');
    var _bar2 = _interopDefault(_bar);
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
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function () {
        return _bar.foo;
      }
    });
    Object.defineProperty(exports, "baz", {
      enumerable: true,
      get: function () {
        return _bar.baz;
      }
    });
    var _bar = require('bar');
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

it('allows mixed esm and cjs exports', () => {
  const code = `
    export const foo = 'foo';
    exports.bar = 'bar';
    module.exports.baz = 'baz';
    export default class {}
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function () {
        return _ref;
      }
    });
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return foo;
      }
    });
    const foo = 'foo';
    exports.bar = 'bar';
    module.exports.baz = 'baz';
    class _ref {}
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named object members', () => {
  const code = `
    export const {foo,bar} = {foo: 'bar',bar: 'baz'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return foo;
      }
    });
    Object.defineProperty(exports, "bar", {
      enumerable: true,
      get: function () {
        return bar;
      }
    });
    const {foo,bar} = {foo: 'bar',bar: 'baz'};
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named array members', () => {
  const code = `
    export const [foo,bar] = ['bar','baz'];
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return foo;
      }
    });
    Object.defineProperty(exports, "bar", {
      enumerable: true,
      get: function () {
        return bar;
      }
    });
    const [foo, bar] = ['bar', 'baz'];
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports members of another module directly from an import (as all)', () => {
  const code = `
    export * from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _bar = require('bar');

    Object.keys(_bar).forEach(function (k) {
      if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) {
        Object.defineProperty(exports, k, {
          enumerable: true,
          get: function () {
            return _bar[k];
          }
        });
      }
    });
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

    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function () {
        return _default;
      }
    });

    var _bar = require('bar');
    (0, _bar.foo)();
    var _default = _bar.foo;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code)).toMatchInlineSnapshot(`
    "
    > 3 |     import {foo} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('supports `import {default as LocalName}`', () => {
  const code = `
    import {
      Platform,
      default as ReactNative,
    } from 'react-native';
    Platform;
    ReactNative;
  `;

  const expected = `
    function _interopDefault(e) {
      return e && e.__esModule ? e : {
        default: e
      };
    }
    var _reactNative = require('react-native');
    var ReactNative = _interopDefault(_reactNative);
    _reactNative.Platform;
    ReactNative.default;
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
