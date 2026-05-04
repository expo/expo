/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Flow and Hermes parser plugins for babel-preset-expo.
 */

import type { PluginItem } from '@babel/core';

/**
 * Returns the Flow/Hermes config fragment to be composed into environment configs.
 * - `overrides`: flow-strip-types override (must precede class properties)
 * - `plugins`: hermes-parser and flow-enums plugins
 */
export function getConfig(options: { disableFlowStripTypesTransform?: boolean }) {
  return {
    overrides: (
      options.disableFlowStripTypesTransform
        ? []
        : [{ plugins: [require('@babel/plugin-transform-flow-strip-types')] as PluginItem[] }]
    ) as { plugins: PluginItem[] }[],
    plugins: [[require('babel-plugin-transform-flow-enums')]] as PluginItem[],
  };
}
