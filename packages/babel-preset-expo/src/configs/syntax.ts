/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Syntax plugins for parser compatibility, applied at the top level.
 */

import type { PluginItem } from '@babel/core';

export const syntaxPlugins: PluginItem[] = [
  [require('babel-plugin-syntax-hermes-parser'), { parseLangTypes: 'flow' }],
  [require('@babel/plugin-syntax-export-default-from')],
  [require('@babel/plugin-syntax-dynamic-import')],
  [require('@babel/plugin-syntax-nullish-coalescing-operator')],
  [require('@babel/plugin-syntax-optional-chaining')],
];
