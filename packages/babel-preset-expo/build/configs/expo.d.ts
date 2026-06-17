import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';
export interface ExpoConfigOptions {
    platform: string | null;
    engine: string;
    isDev: boolean;
    isProduction: boolean;
    isServerEnv: boolean;
    isReactServer: boolean;
    isNodeModule: boolean;
    isFastRefreshEnabled: boolean;
    isReactCompilerEnabled: boolean;
    isModernEngine: boolean;
    baseUrl: string;
    bundler: 'metro' | 'webpack' | null;
    inlineEnvironmentVariables?: boolean;
    /** Whether `EXPO_PUBLIC_*` may be inlined inside `node_modules` for this bundle (production, non-server). */
    inlineEnvVarsInNodeModules?: boolean;
    /** `node_modules` package names where `EXPO_PUBLIC_*` is inlined. */
    inlineEnvVarsInPackages?: string[];
    decorators: {
        legacy?: boolean;
        version?: number;
    } | false | undefined;
    reanimated: boolean | undefined;
    worklets: boolean | undefined;
    expoUi: boolean | undefined;
    reactCompiler: ReactCompilerOptions | false | undefined;
    enableReactFastRefresh: boolean | undefined;
    minifyTypeofWindow: boolean | undefined;
    transformImportMeta: boolean | undefined;
    disableImportExportTransform: boolean | undefined;
    disableDeepImportWarnings: boolean | undefined;
    jsxRuntime: 'classic' | 'automatic' | undefined;
    jsxImportSource: string | undefined;
}
