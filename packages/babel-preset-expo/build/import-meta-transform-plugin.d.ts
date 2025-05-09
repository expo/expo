import { ConfigAPI, types } from '@babel/core';
export declare function expoImportMetaTransformPluginFactory(pluginEnabled: boolean): (api: ConfigAPI & {
    types: typeof types;
}) => babel.PluginObj;
