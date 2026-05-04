/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset` for the default (Hermes V0) transform profile.
 * This profile transforms classes, class properties, and does not enable regenerator.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/configs/main.js
 */

import type { ConfigAPI, PluginItem } from '@babel/core';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

export interface HermesV0ConfigOptions {
  dev?: boolean;
}

module.exports = function (_api: ConfigAPI, _options: HermesV0ConfigOptions) {
  return {
    comments: false,
    compact: true,
    plugins: [
      [require('@babel/plugin-transform-block-scoping')],
      [require('@babel/plugin-transform-class-properties'), { loose }],
      [require('@babel/plugin-transform-private-methods'), { loose }],
      [require('@babel/plugin-transform-private-property-in-object'), { loose }],
      [require('@babel/plugin-transform-unicode-regex')],
      [require('@babel/plugin-transform-classes')],
      [require('@babel/plugin-transform-named-capturing-groups-regex')],
      [require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }],
      [require('@babel/plugin-transform-async-generator-functions')],
      [require('@babel/plugin-transform-async-to-generator')],
      // Ensure the react-jsx-dev plugin works as expected when JSX is used in a function body.
      require('@babel/plugin-transform-parameters'),
      [require('@babel/plugin-transform-react-display-name')],
    ] as PluginItem[],
  };
};
