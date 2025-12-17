/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { transformFromAstSync, transformSync } from '@babel/core';

import normalizePseudoGlobals, { type Options } from '../normalizePseudoGlobals';

function normalizePseudoGlobalsCall(source: string, options?: Options) {
  const ast = transformSync(source, {
    ast: true,
    babelrc: false,
    browserslistConfigFile: false,
    code: false,
    compact: false,
    configFile: false,
    sourceType: 'module',
  })!.ast!;

  const reserved = normalizePseudoGlobals(ast, options);

  const { code } = transformFromAstSync(ast, source, {
    ast: false,
    babelrc: false,
    browserslistConfigFile: false,
    code: true,
    compact: false,
    configFile: false,
    sourceType: 'module',
  })!;

  return { code, reserved };
}

test('minimizes arguments given', () => {
  const result = normalizePseudoGlobalsCall(`
    __d(function (global, _$_REQUIRE, module, exports, _dependencyMap) {
      _$_REQUIRE(27).foo();

      (function() {
        {
          const r = 1; // _$_REQUIRE will be renamed to "_r".
          return r++;
        }
      })();

      (function() {
        var global = 'potato';
        return global + 'tomato';
      })();
    })
  `);

  expect(result.reserved).toEqual(['g', '_r', 'm', 'e', 'd']);
  expect(result.code).toMatchInlineSnapshot(`
    "__d(function (g, _r, m, e, d) {
      _r(27).foo();
      (function () {
        {
          const r = 1; // _$_REQUIRE will be renamed to "_r".
          return r++;
        }
      })();
      (function () {
        var global = 'potato';
        return global + 'tomato';
      })();
    });"
  `);
});

test('throws if two variables collapse to the same name', () => {
  expect(() =>
    normalizePseudoGlobalsCall('__d(function (global, golf) {})')
  ).toThrow(ReferenceError);
});

test('avoids renaming parameters appearing in reservedNames', () => {
  const result = normalizePseudoGlobalsCall(
    `
      __d(function (renameMe, doNotRenameMe) {
        renameMe();
        doNotRenameMe();
      })
    `,
    { reservedNames: ['doNotRenameMe'] }
  );

  expect(result.reserved).toMatchInlineSnapshot(`
    [
      "r",
    ]
  `);
  expect(result.code).toMatchInlineSnapshot(`
    "__d(function (r, doNotRenameMe) {
      r();
      doNotRenameMe();
    });"
  `);
});

test('throws if a reserved name collides with a short name', () => {
  expect(() =>
    normalizePseudoGlobalsCall(
      `
        __d(function (require, r) {
          require();
          r();
        })
      `,
      { reservedNames: ['r'] }
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"Could not reserve the identifier r because it is the short name for require"`
  );
});
