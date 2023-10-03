import { ConfigAPI, TransformOptions } from '@babel/core';
type BabelPresetExpoPlatformOptions = {
    useTransformReactJSXExperimental?: boolean;
    disableImportExportTransform?: boolean;
    withDevTools?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
};
export type BabelPresetExpoOptions = {
    lazyImports?: boolean;
    reanimated?: boolean;
    jsxRuntime?: 'classic' | 'automatic';
    jsxImportSource?: string;
    web?: BabelPresetExpoPlatformOptions;
};
export declare function babelPresetExpoWeb(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export {};
