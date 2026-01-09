import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
interface InlineManifestState extends PluginPass {
    projectRoot: string;
}
export declare function expoInlineManifestPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<InlineManifestState>;
export {};
