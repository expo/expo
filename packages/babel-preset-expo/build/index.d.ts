import type { ConfigAPI, TransformOptions } from '@babel/core';
import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';
type BabelPresetExpoPlatformOptions = {
    /** Disable or configure the `@babel/plugin-proposal-decorators` plugin. */
    decorators?: false | {
        legacy?: boolean;
        version?: number;
    };
    /** Enable or disable adding the Reanimated plugin by default. @default `true` */
    reanimated?: boolean;
    /** Enable or disable adding the Worklets plugin by default. Only applies when
     * using `react-native-worklets` or Reanimated 4. @default `true`
     */
    worklets?: boolean;
    /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
    useTransformReactJSXExperimental?: boolean;
    /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
    jsxRuntime?: 'classic' | 'automatic';
    /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
    jsxImportSource?: string;
    lazyImports?: boolean;
    disableImportExportTransform?: boolean;
    disableDeepImportWarnings?: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRuntime?: boolean | string;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
    /** Settings to pass to `babel-plugin-react-compiler`. Set as `false` to disable the plugin. */
    'react-compiler'?: false | ReactCompilerOptions;
    /** Enable `typeof window` runtime checks. The default behavior is to minify `typeof window` on web clients to `"object"` and `"undefined"` on servers. */
    minifyTypeofWindow?: boolean;
    /**
     * Enable that transform that converts `import.meta` to `globalThis.__ExpoImportMetaRegistry`.
     *
     * > **Note:** Use this option at your own risk. If the JavaScript engine supports `import.meta` natively, this transformation may interfere with the native implementation.
     *
     * @default `false` on client and `true` on server.
     */
    unstable_transformImportMeta?: boolean;
};
export type BabelPresetExpoOptions = BabelPresetExpoPlatformOptions & {
    /** Web-specific settings. */
    web?: BabelPresetExpoPlatformOptions;
    /** Native-specific settings. */
    native?: BabelPresetExpoPlatformOptions;
};
declare function babelPresetExpo(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export default babelPresetExpo;
