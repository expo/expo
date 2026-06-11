import type { PluginItem } from '@babel/core';
/**
 * Returns the Flow/Hermes config fragment to be composed into environment configs.
 * - `overrides`: flow-strip-types override (must precede class properties)
 * - `plugins`: hermes-parser and flow-enums plugins
 */
export declare function getConfig(options: {
    disableFlowStripTypesTransform: boolean;
}): {
    overrides: {
        plugins: PluginItem[];
    }[];
    plugins: PluginItem[];
};
