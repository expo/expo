/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Babel preset for DOM components. Based on the default (Hermes V0) transform profile
 * with additional downlevel transforms for older Android factory WebView environments
 * (e.g. Android 9 / Chromium 66).
 */

import type { ConfigAPI, PluginItem } from '@babel/core';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

export interface WebviewConfigOptions {
  dev?: boolean;
}

module.exports = function (_api: ConfigAPI, _options: WebviewConfigOptions) {
  return {
    comments: false,
    compact: true,
    plugins: [
      [require('@babel/plugin-transform-block-scoping')],
      [require('@babel/plugin-transform-class-properties'), { loose }],
      [require('@babel/plugin-transform-class-static-block'), { loose }],
      [require('@babel/plugin-transform-classes')],
      [require('@babel/plugin-transform-private-methods'), { loose }],
      [require('@babel/plugin-transform-private-property-in-object'), { loose }],
      [require('@babel/plugin-transform-unicode-regex')],
      [require('@babel/plugin-transform-named-capturing-groups-regex')],
      [require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }],
      [require('@babel/plugin-transform-async-generator-functions')],
      [require('@babel/plugin-transform-async-to-generator')],
      // Ensure the react-jsx-dev plugin works as expected when JSX is used in a function body.
      require('@babel/plugin-transform-parameters'),
      [require('@babel/plugin-transform-react-display-name')],
      // These plugins are required to support the older JavaScript environment of Android factory WebViews.
      // For example Android 9 and Chromium 66.
      [require('@babel/plugin-transform-optional-chaining'), { loose: true }],
      [require('@babel/plugin-transform-nullish-coalescing-operator'), { loose: true }],
      [require('@babel/plugin-transform-logical-assignment-operators'), { loose: true }],
    ] as PluginItem[],
  };
};
