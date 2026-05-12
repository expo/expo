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

import { fixHermesV1AsyncArrowNonSimpleParams } from '../plugins/fix-hermes-v1-async-arrow-non-simple-params';
import { fixHermesV1ClassInFinally } from '../plugins/fix-hermes-v1-class-in-finally';
import { fixHermesV1SuperInObjectAccessor } from '../plugins/fix-hermes-v1-super-in-object-accessor';

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

export interface HermesV1ConfigOptions {
  dev: boolean | undefined;
}

/** The JS syntax preset used with Hermes v1 (SDK 56+) */
module.exports = function (_api: ConfigAPI, _options: HermesV1ConfigOptions) {
  const plugins: PluginItem[] = [
    // NOTE(@kitten): See individual plugins for which Hermes v1 fixes they correspond to
    [fixHermesV1AsyncArrowNonSimpleParams],
    [fixHermesV1SuperInObjectAccessor],
    [fixHermesV1ClassInFinally],

    [require('@babel/plugin-transform-block-scoping')],
    [require('@babel/plugin-transform-class-static-block'), { loose }],
    [require('@babel/plugin-transform-async-generator-functions')],
  ];

  return {
    comments: false,
    compact: true,
    plugins,
  };
};
