import type { PluginItem } from '@babel/core';

/**
 * Returns the Flow/Hermes config fragment to be composed into environment configs.
 * - `overrides`: flow-strip-types override (must precede class properties)
 * - `plugins`: hermes-parser and flow-enums plugins
 */
export function getConfig(options: { disableFlowStripTypesTransform: boolean }) {
  return {
    overrides: (options.disableFlowStripTypesTransform
      ? []
      : [{ plugins: [require('@babel/plugin-transform-flow-strip-types')] as PluginItem[] }]) as {
      plugins: PluginItem[];
    }[],
    plugins: [[require('babel-plugin-transform-flow-enums')]] as PluginItem[],
  };
}
