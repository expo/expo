/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Metro module transform preset for babel-preset-expo.
 * Handles export namespace/default transforms and ES module to CommonJS conversion.
 *
 * This is a separate preset so that it runs after all other presets
 * (Babel applies presets in reverse order).
 */

import type { PluginItem } from '@babel/core';

import { lazyImports as expoLazyImports } from './utils/expo-lazy-imports';
import { lazyImports as rnLazyImports } from './utils/rn-lazy-imports';

type ModuleTransformOptions = {
  disableImportExportTransform?: boolean;
  lazyImportExportTransform?: any;
};

module.exports = function (_babel: unknown, options: ModuleTransformOptions) {
  const plugins: PluginItem[] = [];

  // The export-namespace-from transform must run after TypeScript plugins (which are at the
  // top level) to ensure namespace type exports (`export type * as Types from './module'`)
  // are stripped before the transform. Always included regardless of disableImportExportTransform.
  plugins.push(require('../plugins/babel-plugin-transform-export-namespace-from'));

  if (!options.disableImportExportTransform) {
    // Proposal must come before commonJS so it transforms `export default from`
    // before commonJS converts all imports/exports.
    plugins.push([require('@babel/plugin-proposal-export-default-from')]);
    plugins.push([
      require('@babel/plugin-transform-modules-commonjs'),
      {
        strict: false,
        strictMode: false, // prevent "use strict" injections
        lazy:
          options.lazyImportExportTransform != null && options.lazyImportExportTransform !== true
            ? options.lazyImportExportTransform
            : (importSpecifier: string) => {
                if (expoLazyImports.has(importSpecifier)) {
                  // Never lazy-initialize packages that have side-effects.
                  return false;
                } else if (rnLazyImports.has(importSpecifier)) {
                  // Always lazy-initialize `react-native` and the RN lazy imports set.
                  return true;
                } else if (options.lazyImportExportTransform === true) {
                  // Do not lazy-initialize local imports (similar to `lazy: true` behavior).
                  return !importSpecifier.includes('./');
                } else {
                  return false;
                }
              },
        allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
      },
    ]);
  }

  return { plugins };
};
