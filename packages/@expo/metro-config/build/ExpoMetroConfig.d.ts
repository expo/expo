import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import { FileStore } from './binary-file-store';
import { INTERNAL_CALLSITES_REGEX } from './customizeFrame';
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
    environment?: string | null;
}) => number;
export declare function getDefaultConfig(projectRoot: string, { mode, isCSSEnabled, unstable_beforeAssetSerializationPlugins }?: DefaultConfigOptions): Readonly<import("@expo/metro/metro-config/types").MetalConfigT & {
    cacheStores: import("@expo/metro/metro-config/types").CacheStoresConfigT;
    resolver: Readonly<import("@expo/metro/metro-config/types").ResolverConfigT>;
    server: Readonly<import("@expo/metro/metro-config/types").ServerConfigT>;
    serializer: Readonly<import("@expo/metro/metro-config/types").SerializerConfigT>;
    symbolicator: Readonly<import("@expo/metro/metro-config/types").SymbolicatorConfigT>;
    transformer: Readonly<import("@expo/metro/metro-config/types").TransformerConfigT>;
    watcher: Readonly<import("@expo/metro/metro-config/types").WatcherConfigT>;
}> & {
    reporter: {
        update(): void;
    };
    watchFolders: string[];
    resolver: {
        unstable_conditionsByPlatform: {
            ios: string[];
            android: string[];
            tvos: string[];
            macos: string[];
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
        isThirdPartyModule(module: Readonly<{
            path: string;
        }>): boolean;
        createModuleIdFactory: () => (path: string, context?: {
            platform: string;
            environment?: string | null;
        }) => number;
        getModulesRunBeforeMainModule: () => string[];
        getPolyfills: ({ platform }: {
            platform: null | undefined | string;
        }) => any;
    };
    server: {
        rewriteRequestUrl: (url: string) => string;
        port: number;
        unstable_serverRoot: string;
    };
    symbolicator: {
        customizeFrame: (frame: {
            readonly file: null | undefined | string;
            readonly lineNumber: null | undefined | number;
            readonly column: null | undefined | number;
            readonly methodName: null | undefined | string;
        }) => (null | undefined | {
            readonly collapse?: boolean;
        }) | Promise<null | undefined | {
            readonly collapse?: boolean;
        }>;
    };
    transformerPath: string;
    transformer: {
        unstable_workerThreads: true;
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
        enableBabelRCLookup: undefined;
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
