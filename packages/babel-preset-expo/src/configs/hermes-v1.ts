/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset` for the Hermes V1 (hermes-stable/hermes-canary)
 * transform profile. This profile preserves classes and conditionally enables regenerator in dev.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/configs/main.js
 */

import type { ConfigAPI, PluginItem } from '@babel/core';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

type ConfigOptions = {
  dev?: boolean;
};

module.exports = function (_api: ConfigAPI, options: ConfigOptions) {
  // We enable regenerator in dev builds for the time being because
  // Hermes V1 doesn't yet fully support debugging native generators.
  // Use native generators in release mode because it has already yielded perf wins.
  const enableRegenerator = options.dev ?? false;

  const extraPlugins: PluginItem[] = [];

  // NOTE: Hermes V1 preserves classes — no transform-classes or class-properties plugins.

  extraPlugins.push([require('@babel/plugin-transform-named-capturing-groups-regex')]);

  // Needed for regenerator
  if (enableRegenerator) {
    extraPlugins.push([require('@babel/plugin-transform-optional-catch-binding')]);
  }

  extraPlugins.push([require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }]);

  // Async transforms (always included, equivalent to src === null in the original)
  extraPlugins.push([require('@babel/plugin-transform-async-generator-functions')]);
  extraPlugins.push([require('@babel/plugin-transform-async-to-generator')]);

  // React display name (always included, equivalent to src === null in the original)
  extraPlugins.push([require('@babel/plugin-transform-react-display-name')]);

  // Needed for regenerator (always included since src === null in the original)
  if (enableRegenerator) {
    extraPlugins.push([require('@babel/plugin-transform-optional-chaining'), { loose: true }]);
  }

  // Needed for regenerator (always included since src === null in the original)
  if (enableRegenerator) {
    extraPlugins.push([
      require('@babel/plugin-transform-nullish-coalescing-operator'),
      { loose: true },
    ]);
  }

  // Needed for regenerator (always included since src === null in the original)
  if (enableRegenerator) {
    extraPlugins.push([require('@babel/plugin-transform-for-of'), { loose: true }]);
  }

  return {
    comments: false,
    compact: true,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [
          [require('@babel/plugin-transform-block-scoping')],
          // NOTE: Hermes V1 preserves classes, so no class-properties plugin here.
          [require('@babel/plugin-transform-private-methods'), { loose }],
          [require('@babel/plugin-transform-private-property-in-object'), { loose }],
          [require('@babel/plugin-transform-unicode-regex')],
        ],
      },
      {
        plugins: extraPlugins,
      },
    ],
  };
};
