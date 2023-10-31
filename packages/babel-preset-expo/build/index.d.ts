import { ConfigAPI, TransformOptions } from '@babel/core';
type BabelPresetExpoPlatformOptions = {
    /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
    useTransformReactJSXExperimental?: boolean;
    disableImportExportTransform?: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
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
