import type { PluginItem } from '@babel/core';

/** Syntax/parser plugins applied at top-level */
export const syntaxPlugins: PluginItem[] = [
  [require('babel-plugin-syntax-hermes-parser'), { parseLangTypes: 'flow' }],
  [require('@babel/plugin-syntax-export-default-from')],
  [require('@babel/plugin-syntax-dynamic-import')],
  [require('@babel/plugin-syntax-nullish-coalescing-operator')],
  [require('@babel/plugin-syntax-optional-chaining')],
];
