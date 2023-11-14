import { ConfigAPI, PluginObj, types } from '@babel/core';
export declare function expoInlineEnvVars(api: ConfigAPI & {
    types: typeof types;
}): PluginObj;
/**
 * Given a set of options like `{ EXPO_BASE_URL: '/' }`, inline the values into the bundle.
 * This is used for build settings that are always available and not configurable at runtime.
 *
 * Webpack uses DefinePlugin for similar functionality.
 */
export declare function expoInlineTransformEnvVars(api: ConfigAPI & {
    types: typeof types;
}): PluginObj;
