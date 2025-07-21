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
