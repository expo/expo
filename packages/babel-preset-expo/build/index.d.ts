import type { ConfigAPI, TransformOptions } from '@babel/core';
import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';
interface BabelPresetExpoPlatformOptions {
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
    /** Enable or disable adding the `@expo/ui` Babel plugin when `@expo/ui` is
     * installed. The plugin rewrites `Icon.select({ ios, android })` to the
     * active platform's value (read from the babel caller) so per-platform
     * bundles only carry their own branch. @default `true`
     */
    expoUi?: boolean;
    /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
    jsxRuntime?: 'classic' | 'automatic';
    /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
    jsxImportSource?: string;
    lazyImports?: boolean;
    disableImportExportTransform?: boolean;
    disableDeepImportWarnings?: boolean;
    enableBabelRuntime?: boolean | string;
    unstable_transformProfile?: 'default' | 'hermes-v0' | 'hermes-stable' | 'hermes-canary';
    /** Settings to pass to `babel-plugin-react-compiler`. Set as `false` to disable the plugin. */
    'react-compiler'?: false | ReactCompilerOptions;
    /** Only set to `false` to disable `react-refresh/babel` forcefully, defaults to `undefined` */
    enableReactFastRefresh?: boolean;
    /** Enable `typeof window` runtime checks. The default behavior is to minify `typeof window` on web clients to `"object"` and `"undefined"` on servers. */
    minifyTypeofWindow?: boolean;
    /**
     * Enable that transform that converts `import.meta` to `globalThis.__ExpoImportMetaRegistry`.
     *
     * > **Note:** If the JavaScript engine supports `import.meta` natively, this transformation may interfere with the native implementation.
     *
     * @default `true`
     */
    transformImportMeta?: boolean;
    /**
     * Additional `node_modules` packages where `EXPO_PUBLIC_*` environment variables should be
     * inlined in production, the same way they are in your app code. Match by package name, e.g.
     * `['@acme/shared', 'my-internal-lib']`. A trailing `/*` matches a whole scope, e.g. `'@acme/*'`.
     * Useful for monorepo workspace packages or shared libraries that read `process.env.EXPO_PUBLIC_*`.
     *
     * Expo's own `expo` package is always included; this list extends that default.
     *
     * @default `[]`
     */
    inlineEnvVarsInPackages?: string[];
}
export interface BabelPresetExpoOptions extends BabelPresetExpoPlatformOptions {
    /** Web-specific settings. */
    web?: BabelPresetExpoPlatformOptions;
    /** Native-specific settings. */
    native?: BabelPresetExpoPlatformOptions;
    tvos?: BabelPresetExpoPlatformOptions;
    macos?: BabelPresetExpoPlatformOptions;
    ios?: BabelPresetExpoPlatformOptions;
    android?: BabelPresetExpoPlatformOptions;
}
declare function babelPresetExpo(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export default babelPresetExpo;
