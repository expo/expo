import type { ConfigAPI, PluginObj } from '@babel/core';
export declare function expoImportMetaTransformPluginFactory(pluginEnabled: boolean): (api: ConfigAPI & typeof import("@babel/core")) => PluginObj;
