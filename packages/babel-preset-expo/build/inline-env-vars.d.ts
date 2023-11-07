import { ConfigAPI, PluginObj, types } from '@babel/core';
export declare function expoInlineEnvVars(api: ConfigAPI & {
    types: typeof types;
}): PluginObj;
