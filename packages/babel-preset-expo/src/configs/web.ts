/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * A fork of `@react-native/babel-preset` but with everything unrelated to web/ssr removed.
 * https://github.com/facebook/react-native/blob/2af1da42ff517232f1309efed7565fe9ddbbac77/packages/react-native-babel-preset/src/configs/main.js#L1
 */

import type { PluginItem } from '@babel/core';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

type ConfigOptions = {};

module.exports = function (_babel: unknown, _options: ConfigOptions) {
  const extraPlugins: PluginItem[] = [];

  // NOTE: We also remove `@react-native/babel-plugin-codegen` since it doesn't seem needed on web.

  return {
    comments: false,
    compact: true,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [
          [require('@babel/plugin-transform-class-static-block'), { loose }],
          [require('@babel/plugin-transform-private-methods'), { loose }],
          [require('@babel/plugin-transform-private-property-in-object'), { loose }],
        ],
      },
      {
        plugins: extraPlugins,
      },
    ],
  };
};
