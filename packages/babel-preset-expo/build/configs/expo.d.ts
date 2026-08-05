import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';
import { type LazyDecoratorsOptions } from '../plugins/lazy-decorators-plugin';
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
    lazyDecorators: LazyDecoratorsOptions;
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
