import type { ConfigT } from 'metro-config';
export declare function withTailwind(config: ConfigT, { input, output, }?: {
    input?: string | undefined;
    output?: string | undefined;
}): {
    resolver: {
        sourceExts: string[];
        assetExts: readonly string[];
        assetResolutions: readonly string[];
        blacklistRE?: RegExp | RegExp[] | undefined;
        blockList: RegExp | RegExp[];
        dependencyExtractor?: string | undefined;
        disableHierarchicalLookup: boolean;
        extraNodeModules: {
            [name: string]: string;
        };
        emptyModulePath: string;
        hasteImplModulePath?: string | undefined;
        nodeModulesPaths: readonly string[];
        platforms: readonly string[];
        resolveRequest?: import("metro-resolver").CustomResolver | undefined;
        resolverMainFields: readonly string[];
        unstable_enableSymlinks: boolean;
        unstable_conditionNames: readonly string[];
        unstable_conditionsByPlatform: Readonly<{
            [platform: string]: readonly string[];
        }>;
        unstable_enablePackageExports: boolean;
        useWatchman: boolean;
        requireCycleIgnorePatterns: readonly RegExp[];
    };
    transformerPath: string;
    transformer: {
        getTransformOptions: (entryPoints: any, options: any, getDependenciesOf: any) => Promise<Partial<import("metro-config").ExtraTransformOptions>>;
        externallyManagedCss: {
            [x: string]: string;
        };
        transformVariants: Readonly<{
            [name: string]: unknown;
        }>;
        workerPath: string;
        publicPath: string;
        assetPlugins: readonly string[];
        assetRegistryPath: string;
        asyncRequireModulePath: string;
        babelTransformerPath: string;
        dynamicDepsInPackages: import("metro").DynamicRequiresBehavior;
        enableBabelRCLookup: boolean;
        enableBabelRuntime: boolean;
        experimentalImportBundleSupport: boolean;
        globalPrefix: string;
        hermesParser: boolean;
        minifierConfig: Readonly<Record<string, unknown>>;
        minifierPath: string;
        optimizationSizeLimit: number;
        allowOptionalDependencies: import("metro").AllowOptionalDependencies;
        unstable_collectDependenciesPath: string;
        unstable_dependencyMapReservedName?: string | undefined;
        unstable_disableModuleWrapping: boolean;
        unstable_disableNormalizePseudoGlobals: boolean;
        unstable_compactOutput: boolean;
    };
    server: Readonly<import("metro-config").ServerConfigT>;
    serializer: Readonly<import("metro-config").SerializerConfigT>;
    symbolicator: Readonly<import("metro-config").SymbolicatorConfigT>;
    watcher: Readonly<import("metro-config").WatcherConfigT>;
    cacheStores: readonly import("metro-cache").CacheStore<TransformResult>[];
    cacheVersion: string;
    fileMapCacheDirectory?: string | undefined;
    hasteMapCacheDirectory?: string | undefined;
    maxWorkers: number;
    unstable_perfLoggerFactory?: import("metro-config").PerfLoggerFactory | null | undefined;
    projectRoot: string;
    stickyWorkers: boolean;
    reporter: Reporter;
    resetCache: boolean;
    watchFolders: readonly string[];
};
//# sourceMappingURL=tailwind.d.ts.map