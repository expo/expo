import type { ConfigAPI, PluginItem, PluginObj, PluginPass } from '@babel/core';
interface LazyDecoratorsState extends PluginPass {
    decoratorsDetected: boolean;
}
export declare function _lazyDecoratorsPlugin(api: ConfigAPI & typeof import('@babel/core'), options: Record<string, unknown>): PluginObj<LazyDecoratorsState>;
export interface LazyDecoratorsOptions {
    presetOptions: {
        legacy?: boolean;
        version?: number;
    } | false | undefined;
    transformClassProperties: boolean;
    transformPrivateMethods: boolean;
    transformPrivateProperties: boolean;
}
export declare function lazyDecoratorsPlugins(options: LazyDecoratorsOptions): PluginItem[];
export {};
