import { ConfigAPI, TransformOptions } from '@babel/core';
type BabelPresetExpoPlatformOptions = {
    /** Enable or disable adding the Reanimated plugin by default. @default `true` */
    reanimated?: boolean;
    /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
    useTransformReactJSXExperimental?: boolean;
    /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
    jsxRuntime?: 'classic' | 'automatic';
    /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
    jsxImportSource?: string;
    lazyImports?: boolean;
    disableImportExportTransform?: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
};
export type BabelPresetExpoOptions = BabelPresetExpoPlatformOptions & {
    /** Web-specific settings. */
    web?: BabelPresetExpoPlatformOptions;
    /** Native-specific settings. */
    native?: BabelPresetExpoPlatformOptions;
};
declare function babelPresetExpo(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export default babelPresetExpo;
