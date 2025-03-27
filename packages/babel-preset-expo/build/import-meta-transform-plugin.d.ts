import { ConfigAPI, types } from '@babel/core';
export declare function expoImportMetaTransformPlugin(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
