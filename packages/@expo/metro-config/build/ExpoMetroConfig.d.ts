import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import { INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { FileStore } from './file-store';
export interface DefaultConfigOptions {
    /** @deprecated */
    mode?: 'exotic';
    /**
     * **Experimental:** Enable CSS support for Metro web, and shim on native.
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change, and native support for CSS Modules may be added in the future during a non-major SDK release.
     */
    isCSSEnabled?: boolean;
    /**
     * **Experimental:** Modify premodules before a code asset is serialized
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change.
     */
    unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
        graph: ReadOnlyGraph<MixedOutput>;
        premodules: Module[];
        debugId?: string;
    }) => Module[])[];
}
export declare function createStableModuleIdFactory(root: string): (path: string, context?: {
    platform: string;
    environment?: string;
}) => number;
export declare function getDefaultConfig(projectRoot: string, { mode, isCSSEnabled, unstable_beforeAssetSerializationPlugins }?: DefaultConfigOptions): MetroConfig & {
    reporter: {
        update(): void;
    };
    watchFolders: string[];
    resolver: {
        unstable_conditionsByPlatform: {
            ios: string[];
            android: string[];
            web: string[];
        };
        resolverMainFields: string[];
        platforms: string[];
        assetExts: string[];
        sourceExts: string[];
        nodeModulesPaths: string[];
        blockList: RegExp[];
    };
    cacheStores: FileStore<any>[];
    watcher: {
        additionalExts: string[];
    };
    serializer: {
        isThirdPartyModule(module: {
            readonly path: string;
        }): boolean;
        createModuleIdFactory: () => (path: string, context?: {
            platform: string;
            environment?: string;
        }) => number;
        getModulesRunBeforeMainModule: () => string[];
        getPolyfills: ({ platform }: {
            platform?: null | string;
        }) => any;
    };
    server: {
        rewriteRequestUrl: (url: string) => string;
        port: number;
        unstable_serverRoot: string;
    };
    symbolicator: {
        customizeFrame: ($$PARAM_0$$: {
            readonly file?: null | string;
            readonly lineNumber?: null | number;
            readonly column?: null | number;
            readonly methodName?: null | string;
        }) => (null | undefined | {
            readonly collapse?: boolean;
        }) | Promise<null | undefined | {
            readonly collapse?: boolean;
        }>;
    };
    transformerPath: string;
    transformer: {
        unstable_renameRequire: false;
        _expoRouterPath: string | undefined;
        postcssHash: string | null;
        browserslistHash: string | null;
        sassVersion: string | null;
        reanimatedVersion: string | null;
        workletsVersion: string | null;
        _expoRelativeProjectRoot: string;
        unstable_allowRequireContext: true;
        allowOptionalDependencies: true;
        babelTransformerPath: string;
        asyncRequireModulePath: string;
        assetRegistryPath: string;
        enableBabelRuntime: string | undefined;
        getTransformOptions: () => Promise<{
            transform: {
                experimentalImportSupport: true;
                inlineRequires: false;
            };
        }>;
    };
};
/** Use to access the Expo Metro transformer path */
export declare const unstable_transformerPath: string;
export declare const internal_supervisingTransformerPath: string;
export { MetroConfig, INTERNAL_CALLSITES_REGEX };
export declare const EXPO_DEBUG: boolean;
