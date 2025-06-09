import { ConfigAPI, PluginObj, types as t } from '@babel/core';
export declare function expoInlineEnvVars(api: ConfigAPI & {
    types: typeof t;
}): PluginObj;
