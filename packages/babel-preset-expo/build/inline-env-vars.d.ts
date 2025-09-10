import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
interface ExpoInlineEnvVarsOpts extends PluginPass {
    opts: {
        polyfillImportMeta?: boolean;
    };
}
export declare function expoInlineEnvVars(api: ConfigAPI & typeof import('@babel/core')): PluginObj<ExpoInlineEnvVarsOpts>;
export {};
