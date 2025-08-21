import { importExportPlugin } from '../import-export-plugin';
import { compare } from './__mocks__/test-helpers-upstream';
import { showTransformedDeps } from './utils';

// This file includes test for functionality that was added to the import-export-plugin
// and has not been upstreamed yet.

const opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

it('correctly transforms "export * as" namespace from import', () => {
  const code = `
    export * as AppleIcons from 'apple-icons';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _AppleIcons = _$$_IMPORT_ALL('apple-icons');
    exports.AppleIcons = _AppleIcons;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code, [importExportPlugin])).toMatchInlineSnapshot(`
    "
    > 2 |     export * as AppleIcons from 'apple-icons';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (apple-icons)"
  `);
});

it('correctly transforms "export * as" combined with other ESM imports and exports', () => {
  const code = `
    import React from 'react';
    import { Component } from 'react';
    export * as Icons from 'icons';
    export { default as Button } from 'button';
    export const MyComponent = () => React.createElement('div');
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var React = _$$_IMPORT_DEFAULT('react');
    var Component = require('react').Component;
    var _Icons = _$$_IMPORT_ALL('icons');
    var _default = _$$_IMPORT_DEFAULT('button');
    const MyComponent = () => React.createElement('div');
    exports.Icons = _Icons;
    exports.Button = _default;
    exports.MyComponent = MyComponent;
  `;

  compare([importExportPlugin], code, expected, opts);

  expect(showTransformedDeps(code, [importExportPlugin])).toMatchInlineSnapshot(`
    "
    > 2 |     import React from 'react';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (react)
    > 3 |     import { Component } from 'react';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (react)
    > 4 |     export * as Icons from 'icons';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (icons)
    > 5 |     export { default as Button } from 'button';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (button)"
  `);
});

it('exports destructured named object renamed member', () => {
  const code = `
    export const {foo: bar} = {foo: 'bar'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const {foo: bar} = {foo: 'bar'};
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named object renamed and direct member', () => {
  const code = `
    export const {foo: bar, baz} = {foo: 'bar', baz: 'bar'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const {foo: bar,baz} = {foo: 'bar', baz: 'bar'};
    exports.bar = bar;
    exports.baz = baz;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named object with rest member', () => {
  const code = `
    export const {foo, ...bar} = {foo: 'bar', baz: 'bar'};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const {foo, ...bar} = {foo: 'bar', baz: 'bar'};
    exports.foo = foo;
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports destructured named array rest members', () => {
  const code = `
    export const [foo, ...bar] = ['foo', 'bar','baz'];
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    const [foo,...bar] = ['foo','bar','baz'];
    exports.foo = foo;
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, opts);
});

it('exports members of another module directly from an import (as bax) with live bindings', () => {
  const code = `
    export {foo as bax, baz} from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "bax", {
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

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     export {foo as bax, baz} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('imports members from another module and export them in separate statement with live bindings', () => {
  const code = `
    import { foo } from 'bar';

    export { foo };
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return _bar.foo;
      }
    });
    var _bar = require('bar');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     import { foo } from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('imports multiple members from another module and export them in separate statement with live bindings', () => {
  const code = `
    import bar, { foo, baz } from 'bar';

    export { bar, foo, baz };
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});
    Object.defineProperty(exports, "foo", {
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
    var bar = _$$_IMPORT_DEFAULT('bar');
    exports.bar = bar;
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     import bar, { foo, baz } from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)
    > 2 |     import bar, { foo, baz } from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('transforms and import statements to require live bindings', () => {
  const code = `
    import {x} from 'baz';
    import {y as z} from 'qux';
    console.log(x);
    console.log(z);
  `;

  const expected = `
    var _baz = require('baz');
    var _qux = require('qux');
    console.log(_baz.x);
    console.log(_qux.y);
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     import {x} from 'baz';
        |     ^^^^^^^^^^^^^^^^^^^^^^ dep #0 (baz)
    > 3 |     import {y as z} from 'qux';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (qux)"
  `);
});

it('transforms and extracts "import" statements as live bindings', () => {
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
    var _baz = require('baz');
    var _qux = require('qux');
    require('side-effect');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
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

it('transforms export all as live bindings (no named exports)', () => {
  const code = `
    export * from 'foo';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var _exportedNames = {};
    var _foo = require("foo");
    Object.keys(_foo).forEach(function (_key) {
      if (_key === "default" || _key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportedNames, _key)) return;
      if (_key in exports && exports[_key] === _foo[_key]) return;
      Object.defineProperty(exports, _key, {
        enumerable: true,
        get: function () {
          return _foo[_key];
        }
      });
    });
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     export * from 'foo';
        |     ^^^^^^^^^^^^^^^^^^^^ dep #0 (foo)"
  `);
});

it('places export all with live bindings above export default and named', () => {
  const code = `
    export * from 'foo';
    export { baz } from 'bar';
    const bax = 'bax';
    export default bax;
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var _exportedNames = {
      "baz": true
    };
    Object.defineProperty(exports, "baz", {
      enumerable: true,
      get: function () {
        return _bar.baz;
      }
    });
    var _foo = require("foo");
    Object.keys(_foo).forEach(function (_key) {
      if (_key === "default" || _key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportedNames, _key)) return;
      if (_key in exports && exports[_key] === _foo[_key]) return;
      Object.defineProperty(exports, _key, {
        enumerable: true,
        get: function () {
          return _foo[_key];
        }
      });
    });
    var _bar = require('bar');
    const bax = 'bax';
    var _default = bax;
    exports.default = _default;
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('places export all above export default and named', () => {
  const code = `
    export * from 'foo';
    export { baz } from 'bar';
    const bax = 'bax';
    export default bax;
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var _baz = require('bar').baz;
    const bax = 'bax';
    var _default = bax;
    var _foo = require("foo");
    for (var _key in _foo) {
      exports[_key] = _foo[_key];
    }
    exports.default = _default;
    exports.baz = _baz;
  `;

  compare([importExportPlugin], code, expected, { ...opts });
});

it('does not transform import all as export as live bindings', () => {
  const code = `
    import * as foo from 'bar';

    export {
      foo
    }
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var foo = _$$_IMPORT_ALL('bar');

    exports.foo = foo;
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     import * as foo from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('does not transform export default class as live bindings', () => {
  const code = `
    export default class foo {};
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    class foo {};

    exports.default = foo;
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('does not transform direct export default as live binding', () => {
  const code = `
    import foo from 'bar';

    export default foo;
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var foo = _$$_IMPORT_DEFAULT('bar');
    var _default = foo;
    exports.default = _default;
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms export as default as live binding', () => {
  const code = `
    export { foo as default } from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function () {
        return _bar.foo;
      }
    });
    var _bar = require('bar');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms export as default as live binding with shared module', () => {
  const code = `
    export { foo as default, baz } from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
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

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms export default as local with live binding', () => {
  const code = `
    export { default as foo } from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return function (m) {
          return m && m.__esModule ? m.default : m;
        }(_bar);
      }
    });
    var _bar = require('bar');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms export default as local then >1 locals with live binding', () => {
  // NOTE: A bug here reproduces if there's more than one additional named export after a `default as`
  // The `default as` may be preceded by more exports that won't matter for reproduction
  const code = `
    export { default as b, c, d } from 'bar';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    Object.defineProperty(exports, "b", {
      enumerable: true,
      get: function () {
        return function (m) {
          return m && m.__esModule ? m.default : m;
        }(_bar);
      }
    });
    Object.defineProperty(exports, "c", {
      enumerable: true,
      get: function () {
        return _bar.c;
      }
    });
    Object.defineProperty(exports, "d", {
      enumerable: true,
      get: function () {
        return _bar.d;
      }
    });
    var _bar = require('bar');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms import default as local with live binding', () => {
  const code = `
    import { default as foo } from 'bar';
  `;

  const expected = `
    var foo = _$$_IMPORT_DEFAULT('bar');
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms import default as local then >1 locals with live binding', () => {
  const code = `
    import { default as b, c, d } from 'bar';

    test(b, c, d);
  `;

  const expected = `
    var _bar = require('bar');
    var b = _$$_IMPORT_DEFAULT('bar');

    test(b, _bar.c, _bar.d)
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('transforms import default and named as local with live binding', () => {
  const code = `
    import foo, { baz as bax } from 'bar';
    console.log(foo, bax);
  `;

  const expected = `
    var foo = _$$_IMPORT_DEFAULT('bar');
    var _bar = require('bar');
    console.log(foo, _bar.baz);
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});

it('hoists declarations to the top with live bindings', () => {
  const code = `
    foo();
    import {foo} from 'bar';
  `;

  const expected = `
    var _bar = require('bar');
    _bar.foo();
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });
});
