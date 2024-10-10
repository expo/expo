// #region metro-config
declare module 'metro-config' {
  export * from 'metro-config/src/index';
  export { default } from 'metro-config/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/configTypes.flow.js
declare module 'metro-config/src/configTypes.flow' {
  import type { IntermediateStackFrame } from 'metro/src/Server/symbolicate';
  import type { HandleFunction, Server } from 'connect';
  import type { CacheStore } from 'metro-cache';
  import type $$IMPORT_TYPEOF_1$$ from 'metro-cache';
  type MetroCache = typeof $$IMPORT_TYPEOF_1$$;
  import type { CacheManagerFactory } from 'metro-file-map';
  import type { CustomResolver } from 'metro-resolver';
  import type { JsTransformerConfig } from 'metro-transform-worker';
  import type { TransformResult } from 'metro/src/DeltaBundler';
  import type {
    DeltaResult,
    Module,
    ReadOnlyGraph,
    SerializerOptions,
  } from 'metro/src/DeltaBundler/types.flow.js';
  import type { Reporter } from 'metro/src/lib/reporting';
  import type MetroServer from 'metro/src/Server';
  export type ExtraTransformOptions = {
    readonly preloadedModules?:
      | {
          [path: string]: true;
        }
      | false;
    readonly ramGroups?: string[];
    readonly transform?: {
      readonly experimentalImportSupport?: boolean;
      readonly inlineRequires?:
        | {
            readonly blockList: {
              [$$Key$$: string]: true;
            };
          }
        | boolean;
      readonly nonInlinedRequires?: readonly string[];
      readonly unstable_disableES6Transforms?: boolean;
    };
  };
  export type GetTransformOptionsOpts = {
    dev: boolean;
    hot: boolean;
    platform?: null | string;
  };
  export type GetTransformOptions = (
    entryPoints: readonly string[],
    options: GetTransformOptionsOpts,
    getDependenciesOf: ($$PARAM_0$$: string) => Promise<string[]>
  ) => Promise<Partial<ExtraTransformOptions>>;
  export type Middleware = HandleFunction;
  type PerfAnnotations = Partial<{
    string: Readonly<{
      [key: string]: string;
    }>;
    int: Readonly<{
      [key: string]: number;
    }>;
    double: Readonly<{
      [key: string]: number;
    }>;
    bool: Readonly<{
      [key: string]: boolean;
    }>;
    string_array: Readonly<{
      [key: string]: readonly string[];
    }>;
    int_array: Readonly<{
      [key: string]: readonly number[];
    }>;
    double_array: Readonly<{
      [key: string]: readonly number[];
    }>;
    bool_array: Readonly<{
      [key: string]: readonly boolean[];
    }>;
  }>;
  type PerfLoggerPointOptions = Readonly<{
    timestamp?: number;
  }>;
  export interface PerfLogger {
    point(name: string, opts?: PerfLoggerPointOptions): void;
    annotate(annotations: PerfAnnotations): void;
    subSpan(label: string): PerfLogger;
  }
  export interface RootPerfLogger extends PerfLogger {
    start(opts?: PerfLoggerPointOptions): void;
    end(status: 'SUCCESS' | 'FAIL' | 'CANCEL', opts?: PerfLoggerPointOptions): void;
  }
  export type PerfLoggerFactoryOptions = Readonly<{
    key?: number;
  }>;
  export type PerfLoggerFactory = (
    type: 'START_UP' | 'BUNDLING_REQUEST' | 'HMR',
    opts?: PerfLoggerFactoryOptions
  ) => RootPerfLogger;
  type ResolverConfigT = {
    assetExts: readonly string[];
    assetResolutions: readonly string[];
    blacklistRE?: RegExp | RegExp[];
    blockList?: RegExp | RegExp[];
    disableHierarchicalLookup: boolean;
    dependencyExtractor?: null | string;
    emptyModulePath: string;
    enableGlobalPackages: boolean;
    unstable_enableSymlinks: boolean;
    extraNodeModules: {
      [name: string]: string;
    };
    hasteImplModulePath?: null | string;
    nodeModulesPaths: readonly string[];
    platforms: readonly string[];
    resolveRequest?: null | CustomResolver;
    resolverMainFields: readonly string[];
    sourceExts: readonly string[];
    unstable_conditionNames: readonly string[];
    unstable_conditionsByPlatform: Readonly<{
      [platform: string]: readonly string[];
    }>;
    unstable_enablePackageExports: boolean;
    useWatchman: boolean;
    requireCycleIgnorePatterns: readonly RegExp[];
  };
  type SerializerConfigT = {
    createModuleIdFactory: () => (path: string) => number;
    customSerializer?:
      | null
      | ((
          entryPoint: string,
          preModules: readonly Module[],
          graph: ReadOnlyGraph,
          options: SerializerOptions
        ) => Promise<
          | string
          | {
              code: string;
              map: string;
            }
        >);
    experimentalSerializerHook: (graph: ReadOnlyGraph, delta: DeltaResult) => any;
    getModulesRunBeforeMainModule: (entryFilePath: string) => string[];
    getPolyfills: ($$PARAM_0$$: { platform?: null | string }) => readonly string[];
    getRunModuleStatement: ($$PARAM_0$$: number | string) => string;
    polyfillModuleNames: readonly string[];
    processModuleFilter: (modules: Module) => boolean;
    isThirdPartyModule: (
      module: Readonly<{
        path: string;
      }>
    ) => boolean;
  };
  type TransformerConfigT = {
    getTransformOptions: GetTransformOptions;
    transformVariants: {
      readonly [name: string]: object;
    };
    workerPath: string;
    publicPath: string;
    unstable_workerThreads: boolean;
  } & JsTransformerConfig;
  type MetalConfigT = {
    cacheStores: readonly CacheStore<TransformResult>[];
    cacheVersion: string;
    fileMapCacheDirectory?: string;
    hasteMapCacheDirectory?: string;
    unstable_fileMapCacheManagerFactory?: CacheManagerFactory;
    maxWorkers: number;
    unstable_perfLoggerFactory?: null | undefined | PerfLoggerFactory;
    projectRoot: string;
    stickyWorkers: boolean;
    transformerPath: string;
    reporter: Reporter;
    resetCache: boolean;
    watchFolders: readonly string[];
  };
  type ServerConfigT = {
    /** @deprecated */
    enhanceMiddleware: ($$PARAM_0$$: Middleware, $$PARAM_1$$: MetroServer) => Middleware | Server;
    forwardClientLogs: boolean;
    port: number;
    rewriteRequestUrl: ($$PARAM_0$$: string) => string;
    unstable_serverRoot?: null | string;
    useGlobalHotkey: boolean;
    verifyConnections: boolean;
  };
  type SymbolicatorConfigT = {
    customizeFrame: ($$PARAM_0$$: {
      readonly file?: null | string;
      readonly lineNumber?: null | number;
      readonly column?: null | number;
      readonly methodName?: null | string;
    }) =>
      | (
          | null
          | undefined
          | {
              readonly collapse?: boolean;
            }
        )
      | Promise<
          | null
          | undefined
          | {
              readonly collapse?: boolean;
            }
        >;
    customizeStack: (
      $$PARAM_0$$: IntermediateStackFrame[],
      $$PARAM_1$$: any
    ) => IntermediateStackFrame[] | Promise<IntermediateStackFrame[]>;
  };
  type WatcherConfigT = {
    additionalExts: readonly string[];
    healthCheck: {
      enabled: boolean;
      interval: number;
      timeout: number;
      filePrefix: string;
    };
    unstable_workerThreads: boolean;
    watchman: {
      deferStates: readonly string[];
    };
  };
  export type InputConfigT = Partial<
    {} & MetalConfigT &
      Readonly<{
        cacheStores?:
          | readonly CacheStore<TransformResult>[]
          | (($$PARAM_0$$: MetroCache) => readonly CacheStore<TransformResult>[]);
        resolver: Readonly<Partial<ResolverConfigT>>;
        server: Readonly<Partial<ServerConfigT>>;
        serializer: Readonly<Partial<SerializerConfigT>>;
        symbolicator: Readonly<Partial<SymbolicatorConfigT>>;
        transformer: Readonly<Partial<TransformerConfigT>>;
        watcher: Readonly<
          Partial<
            {
              healthCheck?: Readonly<Partial<WatcherConfigT['healthCheck']>>;
            } & WatcherConfigT
          >
        >;
      }>
  >;
  export type MetroConfig = InputConfigT;
  export type IntermediateConfigT = {} & MetalConfigT & {
      resolver: ResolverConfigT;
      server: ServerConfigT;
      serializer: SerializerConfigT;
      symbolicator: SymbolicatorConfigT;
      transformer: TransformerConfigT;
      watcher: WatcherConfigT;
    };
  export type ConfigT = Readonly<
    {} & Readonly<MetalConfigT> &
      Readonly<{
        resolver: Readonly<ResolverConfigT>;
        server: Readonly<ServerConfigT>;
        serializer: Readonly<SerializerConfigT>;
        symbolicator: Readonly<SymbolicatorConfigT>;
        transformer: Readonly<TransformerConfigT>;
        watcher: Readonly<WatcherConfigT>;
      }>
  >;
  export type YargArguments = Readonly<{
    config?: string;
    cwd?: string;
    port?: string | number;
    host?: string;
    projectRoot?: string;
    watchFolders?: string[];
    assetExts?: string[];
    sourceExts?: string[];
    platforms?: string[];
    'max-workers'?: string | number;
    maxWorkers?: string | number;
    transformer?: string;
    'reset-cache'?: boolean;
    resetCache?: boolean;
    verbose?: boolean;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/defaults/defaults.js
declare module 'metro-config/src/defaults/defaults' {
  import type { RootPerfLogger } from 'metro-config/src/configTypes.flow';
  export const assetExts: any;
  export const assetResolutions: any;
  export const sourceExts: any;
  export const additionalExts: any;
  export const moduleSystem: string;
  export const platforms: any;
  export const DEFAULT_METRO_MINIFIER_PATH: 'metro-minify-terser';
  export { default as defaultCreateModuleIdFactory } from 'metro/src/lib/createModuleIdFactory';
  export const noopPerfLoggerFactory: () => RootPerfLogger;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/defaults/index.js
declare module 'metro-config/src/defaults/index' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/defaults/index.js

  // NOTE(cedric): This file can't be typed properly due to complex CJS structures

  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  export default interface getDefaultConfig {
    (rootPath: string | null): Promise<ConfigT>;
    getDefaultValues: (rootPath: string | null) => ConfigT;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/defaults/validConfig.js
declare module 'metro-config/src/defaults/validConfig' {
  const $$EXPORT_DEFAULT_DECLARATION$$: () => any;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/index.js
declare module 'metro-config/src/index' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/index.js

  // NOTE(cedric): Metro uses this weird Flow syntax /*:: */ to override the exported types...
  export type * from 'metro-config/src/configTypes.flow';
  export { default as getDefaultConfig } from 'metro-config/src/defaults';
  export { loadConfig, mergeConfig, resolveConfig } from 'metro-config/src/loadConfig';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-config/src/loadConfig.js
declare module 'metro-config/src/loadConfig' {
  import type { ConfigT, InputConfigT, YargArguments } from 'metro-config/src/configTypes.flow';
  type CosmiConfigResult = {
    filepath: string;
    isEmpty: boolean;
    config?:
      | (($$PARAM_0$$: ConfigT) => Promise<ConfigT>)
      | (($$PARAM_0$$: ConfigT) => ConfigT)
      | InputConfigT;
  };
  /**
   * Load the metro configuration from disk
   * @param  {object} argv                    Arguments coming from the CLI, can be empty
   * @param  {object} defaultConfigOverrides  A configuration that can override the default config
   * @return {object}                         Configuration returned
   */
  export function loadConfig(
    argvInput?: YargArguments,
    defaultConfigOverrides?: InputConfigT
  ): Promise<ConfigT>;
  export function resolveConfig(filePath?: string, cwd?: string): Promise<CosmiConfigResult>;
  export function mergeConfig<T extends Readonly<InputConfigT>>(
    defaultConfig: T,
    ...configs: InputConfigT[]
  ): T;
}
