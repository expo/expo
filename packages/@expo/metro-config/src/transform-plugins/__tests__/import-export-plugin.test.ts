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

it('exports members of another module directly from an import (as default) with live bindings', () => {
  const code = `
    export {foo as default, baz} from 'bar';
  `;

  // TODO: Improve this to avoid duplicate requires
  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _bar = require('bar');
    var _bar2 = require('bar');
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function () {
        return _bar.foo;
      }
    });
    Object.defineProperty(exports, "baz", {
      enumerable: true,
      get: function () {
        return _bar2.baz;
      }
    });
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     export {foo as default, baz} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)
    > 2 |     export {foo as default, baz} from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
  `);
});

it('imports members from another module and export them in separate statement with live bindings', () => {
  const code = `
    import { foo } from 'bar';

    export { foo };
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {value: true});

    var _bar = require('bar');
    Object.defineProperty(exports, "foo", {
      enumerable: true,
      get: function () {
        return _bar.foo;
      }
    });
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     import { foo } from 'bar';
        |     ^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (bar)"
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

it('transforms export all as live bindings', () => {
  const code = `
    export * from 'foo';
  `;

  const expected = `
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    var _foo = require("foo");
    for (var _key in _foo) {
      Object.defineProperty(exports, _key, {
        enumerable: true,
        get: function () {
          return _foo[_key];
        }
      });
    }
  `;

  compare([importExportPlugin], code, expected, { ...opts, liveBindings: true });

  expect(showTransformedDeps(code, [importExportPlugin], { liveBindings: true }))
    .toMatchInlineSnapshot(`
    "
    > 2 |     export * from 'foo';
        |     ^^^^^^^^^^^^^^^^^^^^ dep #0 (foo)"
  `);
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

it('does not transform export default as live binding', () => {
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
