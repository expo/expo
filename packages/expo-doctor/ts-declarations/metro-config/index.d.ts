declare module 'metro-config' {
  import { IncomingMessage, ServerResponse } from 'http';
  import type {
    DeltaResult,
    Graph,
    JsTransformerConfig,
    Module,
    Reporter,
    SerializerOptions,
    Server,
    TransformVariants,
  } from 'metro';

  type CacheStore = unknown;
  type CustomResolver = unknown;

  import type { BasicSourceMap, MixedSourceMap } from 'metro-source-map';

  //#region metro/packages/metro-config/src/configTypes.flow.js

  export type PostMinifyProcess = (arg: {
    code: string;
    map: BasicSourceMap | null | undefined;
  }) => {
    code: string;
    map: BasicSourceMap | null | undefined;
  };

  export type PostProcessBundleSourcemap = (arg: {
    code: Buffer | string;
    map: MixedSourceMap;
    outFileName: string;
  }) => {
    code: Buffer | string;
    map: MixedSourceMap | string;
  };

  interface ExtraTransformOptions {
    readonly preloadedModules:
      | {
          [path: string]: true;
        }
      | false;
    readonly ramGroups: string[];
    readonly transform: {
      readonly experimentalImportSupport: boolean;
      readonly inlineRequires:
        | {
            readonly blacklist: {
              [key: string]: true;
            };
          }
        | boolean;
      readonly nonInlinedRequires?: string[];
      readonly unstable_disableES6Transforms?: boolean;
    };
  }

  export interface GetTransformOptionsOpts {
    dev: boolean;
    hot: boolean;
    platform: string | null | undefined;
  }

  export type GetTransformOptions = (
    entryPoints: readonly string[],
    options: GetTransformOptionsOpts,
    getDependenciesOf: (path: string) => Promise<string[]>
  ) => Promise<ExtraTransformOptions>;

  export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (e: Error | null | undefined) => unknown
  ) => unknown;

  interface ResolverConfigT {
    assetExts: readonly string[];
    assetResolutions: readonly string[];
    blacklistRE: RegExp;
    dependencyExtractor: string | null | undefined;
    extraNodeModules: {
      [name: string]: string;
    };
    hasteImplModulePath: string | null | undefined;
    platforms: readonly string[];
    resolverMainFields: readonly string[];
    resolveRequest: CustomResolver | null | undefined;
    sourceExts: readonly string[];
    useWatchman: boolean;
  }

  interface SerializerConfigT {
    createModuleIdFactory: () => (path: string) => number;
    customSerializer: (
      entryPoint: string,
      preModules: Module[],
      graph: Graph,
      options: SerializerOptions
    ) => string | { code: string; map: string } | null | undefined;
    experimentalSerializerHook: (graph: Graph, delta: DeltaResult) => unknown;
    getModulesRunBeforeMainModule: (entryFilePath: string) => string[];
    getPolyfills: (arg: { platform: string | null | undefined }) => readonly string[];
    getRunModuleStatement: (moduleId: number | string) => string;
    polyfillModuleNames: readonly string[];
    postProcessBundleSourcemap: PostProcessBundleSourcemap;
    processModuleFilter: (modules: Module) => boolean;
  }

  type TransformerConfigT = JsTransformerConfig & {
    getTransformOptions: GetTransformOptions;
    postMinifyProcess: PostMinifyProcess;
    transformVariants: TransformVariants;
    workerPath: string;
    publicPath: string;
    experimentalImportBundleSupport: false;
  };

  interface MetalConfigT {
    cacheStores: readonly any[];
    cacheVersion: string;
    hasteMapCacheDirectory?: string;
    maxWorkers: number;
    projectRoot: string;
    stickyWorkers: boolean;
    transformerPath: string;
    reporter: Reporter;
    resetCache: boolean;
    watchFolders: readonly string[];
  }

  interface ServerConfigT {
    enhanceMiddleware: (middleware: Middleware, server: Server) => Middleware;
    useGlobalHotkey: boolean;
    port: number;
    runInspectorProxy: boolean;
    verifyConnections: boolean;
  }

  type StackFrameCustomizations = undefined | { collapse?: boolean };

  interface SymbolicatorConfigT {
    customizeFrame: (
      frame: Readonly<{
        file: string | null;
        lineNumber: number | null;
        column: number | null;
        methodName: string | null;
      }>
    ) => StackFrameCustomizations | Promise<StackFrameCustomizations>;
  }

  export type InputConfigT = Partial<
    MetalConfigT &
      Readonly<{
        resolver: Partial<ResolverConfigT>;
        server: Partial<ServerConfigT>;
        serializer: Partial<SerializerConfigT>;
        symbolicator: Partial<SymbolicatorConfigT>;
        transformer: Partial<TransformerConfigT>;
      }>
  >;

  export type IntermediateConfigT = MetalConfigT & {
    resolver: ResolverConfigT;
    server: ServerConfigT;
    serializer: SerializerConfigT;
    symbolicator: SymbolicatorConfigT;
    transformer: TransformerConfigT;
  };

  export type ConfigT = Readonly<
    Readonly<MetalConfigT> &
      Readonly<{
        resolver: Readonly<ResolverConfigT>;
        server: Readonly<ServerConfigT>;
        serializer: Readonly<SerializerConfigT>;
        symbolicator: Readonly<SymbolicatorConfigT>;
        transformer: Readonly<TransformerConfigT>;
      }>
  >;

  //#endregion
  //#region metro/packages/metro-config/src/index.js

  interface CosmiConfigResult {
    filepath: string;
    isEmpty: boolean;
    config: ((arg: ConfigT) => Promise<ConfigT>) | ((arg: ConfigT) => ConfigT) | InputConfigT;
  }

  interface YargArguments {
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
    runInspectorProxy?: boolean;
    verbose?: boolean;
  }

  export function resolveConfig(path?: string, cwd?: string): Promise<CosmiConfigResult>;

  export function mergeConfig<T extends InputConfigT>(
    defaultConfig: T,
    ...configs: InputConfigT[]
  ): T;

  export function loadConfig(
    argv: YargArguments,
    defaultConfigOverrides: InputConfigT
  ): Promise<ConfigT>;

  export function getDefaultConfig(rootPath?: string): Promise<ConfigT>;

  namespace getDefaultConfig {
    function getDefaultValues(rootPath?: string): ConfigT;
  }

  //#endregion
}
