declare module 'metro-config' {
  import { IncomingMessage, ServerResponse } from 'http';
  import {
    DeltaResult,
    Graph,
    Module,
    SerializerOptions,
    JsTransformerConfig,
    Reporter,
    TransformResult,
    Server,
    TransformVariants,
  } from 'metro';

  // TODO: import { CacheStore } from 'metro-cache';
  type CacheStore = unknown;
  // TODO: import { CustomResolver } from 'metro-resolver';
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
    readonly ramGroups: Array<string>;
    readonly transform: {
      readonly experimentalImportSupport: boolean;
      readonly inlineRequires:
        | {
            readonly blacklist: {
              [key: string]: true;
            };
          }
        | boolean;
      readonly nonInlinedRequires?: ReadonlyArray<string>;
      readonly unstable_disableES6Transforms?: boolean;
    };
  }

  export interface GetTransformOptionsOpts {
    dev: boolean;
    hot: boolean;
    platform: string | null | undefined;
  }

  export type GetTransformOptions = (
    entryPoints: ReadonlyArray<string>,
    options: GetTransformOptionsOpts,
    getDependenciesOf: (path: string) => Promise<Array<string>>
  ) => Promise<ExtraTransformOptions>;

  export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (e: Error | null | undefined) => unknown
  ) => unknown;

  interface ResolverConfigT {
    assetExts: ReadonlyArray<string>;
    assetResolutions: ReadonlyArray<string>;
    blacklistRE: RegExp;
    dependencyExtractor: string | null | undefined;
    extraNodeModules: {
      [name: string]: string;
    };
    nodeModulesPaths?: readonly string[];
    hasteImplModulePath: string | null | undefined;
    platforms: ReadonlyArray<string>;
    resolverMainFields: ReadonlyArray<string>;
    resolveRequest: CustomResolver | null | undefined;
    sourceExts: ReadonlyArray<string>;
    useWatchman: boolean;
  }

  interface SerializerConfigT {
    createModuleIdFactory: () => (path: string) => number;
    customSerializer: (
      entryPoint: string,
      preModules: ReadonlyArray<Module>,
      graph: Graph,
      options: SerializerOptions
    ) => string | { code: string; map: string } | null | undefined;
    experimentalSerializerHook: (graph: Graph, delta: DeltaResult) => unknown;
    getModulesRunBeforeMainModule: (entryFilePath: string) => Array<string>;
    getPolyfills: (arg: { platform: string | null | undefined }) => ReadonlyArray<string>;
    getRunModuleStatement: (moduleId: number | string) => string;
    polyfillModuleNames: ReadonlyArray<string>;
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
    cacheStores: ReadonlyArray<CacheStore<TransformResult>>;
    cacheVersion: string;
    hasteMapCacheDirectory?: string;
    maxWorkers: number;
    projectRoot: string;
    stickyWorkers: boolean;
    transformerPath: string;
    reporter: Reporter;
    resetCache: boolean;
    watchFolders: ReadonlyArray<string>;
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
    watchFolders?: Array<string>;
    assetExts?: Array<string>;
    sourceExts?: Array<string>;
    platforms?: Array<string>;
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
    ...configs: Array<InputConfigT>
  ): T;

  export function loadConfig(
    argv: YargArguments = {},
    defaultConfigOverrides: InputConfigT = {}
  ): Promise<ConfigT>;

  export function getDefaultConfig(rootPath?: string): Promise<ConfigT>;

  namespace getDefaultConfig {
    function getDefaultValues(rootPath?: string): ConfigT;
  }

  //#endregion
}
