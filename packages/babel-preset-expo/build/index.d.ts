import { ConfigAPI, TransformOptions } from '@babel/core';
type BabelPresetExpoPlatformOptions = {
    useTransformReactJSXExperimental?: boolean;
    disableImportExportTransform?: boolean;
    withDevTools?: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-canary';
};
export type BabelPresetExpoOptions = {
    lazyImports?: boolean;
    reanimated?: boolean;
    jsxRuntime?: 'classic' | 'automatic';
    jsxImportSource?: string;
    web?: BabelPresetExpoPlatformOptions;
    native?: BabelPresetExpoPlatformOptions;
};
declare function babelPresetExpo(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export default babelPresetExpo;
