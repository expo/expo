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

type ConfigOptions = {
  disableDeepImportWarnings?: boolean;
  dev?: boolean;
};

const EXCLUDED_FIRST_PARTY_PATHS = [/[/\\]node_modules[/\\]/];

function isFirstParty(fileName: string | undefined | null) {
  return !!fileName && !EXCLUDED_FIRST_PARTY_PATHS.some((regex) => regex.test(fileName));
}

module.exports = function (_api: ConfigAPI, options: ConfigOptions) {
  const extraPlugins: PluginItem[] = [];
  const firstPartyPlugins: PluginItem[] = [];

  extraPlugins.push([require('@react-native/babel-plugin-codegen'), {}, 'react-native-codegen']);

  // Classes are always transformed in hermes-v0
  extraPlugins.push([require('@babel/plugin-transform-classes')]);

  extraPlugins.push([require('@babel/plugin-transform-named-capturing-groups-regex')]);
  extraPlugins.push([require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }]);

  // Async transforms (always included, equivalent to src === null in the original)
  extraPlugins.push([require('@babel/plugin-transform-async-generator-functions')]);
  extraPlugins.push([require('@babel/plugin-transform-async-to-generator')]);

  // This is added back on hermes to ensure the react-jsx-dev plugin (`@babel/preset-react`) works as expected when
  // JSX is used in a function body. This is technically not required in production, but we
  // should retain the same behavior since it's hard to debug the differences.
  extraPlugins.push(require('@babel/plugin-transform-parameters'));

  // React display name (always included, equivalent to src === null in the original)
  extraPlugins.push([require('@babel/plugin-transform-react-display-name')]);

  // Deep import warnings (first-party only, dev only)
  if (options.dev && !options.disableDeepImportWarnings) {
    firstPartyPlugins.push([require('../plugins/plugin-warn-on-deep-imports')]);
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
          [require('@babel/plugin-transform-class-properties'), { loose }],
          [require('@babel/plugin-transform-private-methods'), { loose }],
          [require('@babel/plugin-transform-private-property-in-object'), { loose }],
          [require('@babel/plugin-transform-unicode-regex')],
        ],
      },
      {
        test: isFirstParty,
        plugins: firstPartyPlugins,
      },
      {
        plugins: extraPlugins,
      },
      {
        plugins: [
          // These plugins are required to support the older JavaScript environment of Android factory WebViews.
          // For example Android 9 and Chromium 66.
          [require('@babel/plugin-transform-optional-chaining'), { loose: true }],
          [require('@babel/plugin-transform-nullish-coalescing-operator'), { loose: true }],
          [require('@babel/plugin-transform-logical-assignment-operators'), { loose: true }],
        ] as PluginItem[],
      },
    ],
  };
};
