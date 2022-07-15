declare module 'metro/src/shared/output/bundle' {
  export function build(
    arg0: Server,
    arg1: RequestOptions
  ): Promise<{
    code: string;
    map: string;
  }>;
  export function save(
    arg0: {
      code: string;
      map: string;
    },
    arg1: OutputOptions,
    arg2: (...args: Array<string>) => void
  ): Promise<unknown>;
}
declare module 'metro' {
  //#region metro/src/Assets.js

  type AssetDataWithoutFiles = {
    readonly __packager_asset: true;
    readonly fileSystemLocation: string;
    readonly hash: string;
    readonly height: number | null | undefined;
    readonly httpServerLocation: string;
    readonly name: string;
    readonly scales: Array<number>;
    readonly type: string;
    readonly width: number | null | undefined;
  };

  export type AssetData = AssetDataWithoutFiles & { readonly files: Array<string> };

  //#endregion
  //#region metro/src/DeltaBundler/types.flow.js

  interface MixedOutput {
    readonly data: unknown;
    readonly type: string;
  }

  interface BabelSourceLocation {
    start: { line: number; column: number };
    end: { line: number; column: number };
    identifierName?: string;
  }

  interface TransformResultDependency {
    /**
     * The literal name provided to a require or import call. For example 'foo' in
     * case of `require('foo')`.
     */
    readonly name: string;

    /**
     * Extra data returned by the dependency extractor. Whatever is added here is
     * blindly piped by Metro to the serializers.
     */
    readonly data: {
      /**
       * If `true` this dependency is due to a dynamic `import()` call. If `false`,
       * this dependency was pulled using a synchronous `require()` call.
       */
      readonly isAsync: boolean;

      /**
       * The dependency is actually a `__prefetchImport()` call.
       */
      readonly isPrefetchOnly?: true;

      /**
       * The condition for splitting on this dependency edge.
       */
      readonly splitCondition?: {
        readonly mobileConfigName: string;
      };

      /**
       * The dependency is enclosed in a try/catch block.
       */
      readonly isOptional?: boolean;

      readonly locs: ReadonlyArray<BabelSourceLocation>;
    };
  }

  interface Dependency {
    readonly absolutePath: string;
    readonly data: TransformResultDependency;
  }

  export interface Module<T = MixedOutput> {
    readonly dependencies: Map<string, Dependency>;
    readonly inverseDependencies: Set<string>;
    readonly output: ReadonlyArray<T>;
    readonly path: string;
    readonly getSource: () => Buffer;
  }

  export interface Graph<T = MixedOutput> {
    dependencies: Map<string, Module<T>>;
    importBundleNames: Set<string>;
    readonly entryPoints: ReadonlyArray<string>;
  }

  export type TransformResult<T = MixedOutput> = Readonly<{
    dependencies: ReadonlyArray<TransformResultDependency>;
    output: ReadonlyArray<T>;
  }>;

  interface AllowOptionalDependenciesWithOptions {
    readonly exclude: Array<string>;
  }
  type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;

  export interface DeltaResult<T = MixedOutput> {
    readonly added: Map<string, Module<T>>;
    readonly modified: Map<string, Module<T>>;
    readonly deleted: Set<string>;
    readonly reset: boolean;
  }

  export interface SerializerOptions {
    readonly asyncRequireModulePath: string;
    readonly createModuleId: (arg0: string) => number;
    readonly dev: boolean;
    readonly getRunModuleStatement: (arg0: number | string) => string;
    readonly inlineSourceMap: boolean | null | undefined;
    readonly modulesOnly: boolean;
    readonly processModuleFilter: (module: Module) => boolean;
    readonly projectRoot: string;
    readonly runBeforeMainModule: ReadonlyArray<string>;
    readonly runModule: boolean;
    readonly sourceMapUrl: string | null | undefined;
    readonly sourceUrl: string | null | undefined;
  }

  //#endregion
  //#region metro/src/DeltaBundler/Serializers/getRamBundleInfo.js

  interface RamBundleInfo {
    getDependencies: (filePath: string) => Set<string>;
    startupModules: ReadonlyArray<ModuleTransportLike>;
    lazyModules: ReadonlyArray<ModuleTransportLike>;
    groups: Map<number, Set<number>>;
  }

  //#endregion
  //#region metro/src/index.js

  import { Server as HttpServer } from 'http';
  import { Server as HttpsServer } from 'https';
  import { loadConfig, ConfigT, InputConfigT, Middleware } from 'metro-config';

  type MetroMiddleWare = {
    attachHmrServer: (httpServer: HttpServer | HttpsServer) => void;
    end: () => void;
    metroServer: Server;
    middleware: Middleware;
  };

  type RunServerOptions = {
    hasReducedPerformance?: boolean;
    hmrEnabled?: boolean;
    host?: string;
    onError?: (arg0: Error & { code?: string }) => void;
    onReady?: (server: HttpServer | HttpsServer) => void;
    runInspectorProxy?: boolean;
    secure?: boolean;
    secureCert?: string;
    secureKey?: string;
    websocketEndpoints?: object;
  };

  type BuildGraphOptions = {
    entries: ReadonlyArray<string>;
    customTransformOptions?: CustomTransformOptions;
    dev?: boolean;
    minify?: boolean;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
    platform?: string;
    type?: 'module' | 'script';
  };

  type RunBuildOptions = {
    entry: string;
    dev?: boolean;
    out?: string;
    onBegin?: () => void;
    onComplete?: () => void;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
    minify?: boolean;
    output?: {
      build: (
        arg0: Server,
        arg1: RequestOptions
      ) => Promise<{
        code: string;
        map: string;
      }>;
      save: (
        arg0: {
          code: string;
          map: string;
        },
        arg1: OutputOptions,
        arg2: (...args: Array<string>) => void
      ) => Promise<unknown>;
    };
    platform?: string;
    sourceMap?: boolean;
    sourceMapUrl?: string;
  };

  export function runMetro(config: InputConfigT, options?: ServerOptions): Promise<Server>;

  export { loadConfig };

  export function createConnectMiddleware(
    config: ConfigT,
    options?: ServerOptions
  ): Promise<MetroMiddleWare>;

  export function runServer(
    config: ConfigT,
    options: RunServerOptions
  ): Promise<HttpServer | HttpsServer>;

  export function runBuild(
    config: ConfigT,
    options: RunBuildOptions
  ): Promise<{
    code: string;
    map: string;
  }>;

  export function buildGraph(config: InputConfigT, options: BuildGraphOptions): Promise<Graph>;
  //#endregion
  //#region metro/src/JSTransformer/worker.js

  type CustomTransformOptions = {
    [key: string]: unknown;
  };

  export type JsTransformerConfig = Readonly<{
    assetPlugins: ReadonlyArray<string>;
    assetRegistryPath: string;
    asyncRequireModulePath: string;
    babelTransformerPath: string;
    dynamicDepsInPackages: DynamicRequiresBehavior;
    enableBabelRCLookup: boolean;
    enableBabelRuntime: boolean;
    experimentalImportBundleSupport: boolean;
    minifierConfig: MinifierConfig;
    minifierPath: string;
    optimizationSizeLimit: number;
    publicPath: string;
    allowOptionalDependencies: AllowOptionalDependencies;
  }>;

  //#endregion
  //#region metro/src/lib/reporting.js

  /**
   * A tagged union of all the actions that may happen and we may want to
   * report to the tool user.
   */
  export type ReportableEvent =
    | {
        port: number;
        hasReducedPerformance: boolean;
        type: 'initialize_started';
      }
    | {
        type: 'initialize_failed';
        port: number;
        error: Error;
      }
    | {
        buildID: string;
        type: 'bundle_build_done';
      }
    | {
        buildID: string;
        type: 'bundle_build_failed';
      }
    | {
        buildID: string;
        bundleDetails: BundleDetails;
        type: 'bundle_build_started';
      }
    | {
        error: Error;
        type: 'bundling_error';
      }
    | {
        type: 'dep_graph_loading';
        hasReducedPerformance: boolean;
      }
    | { type: 'dep_graph_loaded' }
    | {
        buildID: string;
        type: 'bundle_transform_progressed';
        transformedFileCount: number;
        totalFileCount: number;
      }
    | {
        type: 'global_cache_error';
        error: Error;
      }
    | {
        type: 'global_cache_disabled';
        reason: GlobalCacheDisabledReason;
      }
    | { type: 'transform_cache_reset' }
    | {
        type: 'worker_stdout_chunk';
        chunk: string;
      }
    | {
        type: 'worker_stderr_chunk';
        chunk: string;
      }
    | {
        type: 'hmr_client_error';
        error: Error;
      }
    | {
        type: 'client_log';
        level:
          | 'trace'
          | 'info'
          | 'warn'
          | 'log'
          | 'group'
          | 'groupCollapsed'
          | 'groupEnd'
          | 'debug';
        data: unknown[];
      };

  /**
   * Code across the application takes a reporter as an option and calls the
   * update whenever one of the ReportableEvent happens. Code does not directly
   * write to the standard output, because a build would be:
   *
   *   1. ad-hoc, embedded into another tool, in which case we do not want to
   *   pollute that tool's own output. The tool is free to present the
   *   warnings/progress we generate any way they want, by specifing a custom
   *   reporter.
   *   2. run as a background process from another tool, in which case we want
   *   to expose updates in a way that is easily machine-readable, for example
   *   a JSON-stream. We don't want to pollute it with textual messages.
   *
   * We centralize terminal reporting into a single place because we want the
   * output to be robust and consistent. The most common reporter is
   * TerminalReporter, that should be the only place in the application should
   * access the `terminal` module (nor the `console`).
   */
  export interface Reporter {
    update(event: ReportableEvent): void;
  }

  //#endregion
  //#region metro/src/ModuleGraph/types.flow.js

  export type TransformVariants = {
    readonly [name: string]: {};
  };

  //#endregion
  //#region metro/src/Server.js

  type ServerOptions = Readonly<{
    watch?: boolean;
  }>;

  //#endregion
  //#region metro/src/Server/index.js

  import { IncomingMessage, ServerResponse } from 'http';

  // TODO: type declaration
  type IncrementalBundler = unknown;

  export class Server {
    constructor(config: ConfigT, options?: ServerOptions);

    end(): void;

    getBundler(): IncrementalBundler;

    getCreateModuleId(): (path: string) => number;

    build(
      options: BundleOptions
    ): Promise<{
      code: string;
      map: string;
    }>;

    getRamBundleInfo(options: BundleOptions): Promise<RamBundleInfo>;

    getAssets(options: BundleOptions): Promise<ReadonlyArray<AssetData>>;

    getOrderedDependencyPaths(options: {
      readonly dev: boolean;
      readonly entryFile: string;
      readonly minify: boolean;
      readonly platform: string;
    }): Promise<Array<string>>;

    processRequest(
      req: IncomingMessage,
      res: ServerResponse,
      next: (arg0: Error | null | undefined) => unknown
    ): void;

    getNewBuildID(): string;

    getPlatforms(): ReadonlyArray<string>;

    getWatchFolders(): ReadonlyArray<string>;

    static DEFAULT_GRAPH_OPTIONS: {
      customTransformOptions: any;
      dev: boolean;
      hot: boolean;
      minify: boolean;
    };

    static DEFAULT_BUNDLE_OPTIONS: typeof Server.DEFAULT_GRAPH_OPTIONS & {
      excludeSource: false;
      inlineSourceMap: false;
      modulesOnly: false;
      onProgress: null;
      runModule: true;
      shallow: false;
      sourceMapUrl: null;
      sourceUrl: null;
    };
  }

  //#endregion
  //#region metro/src/shared/types.flow.js

  type BundleType = 'bundle' | 'delta' | 'meta' | 'map' | 'ram' | 'cli' | 'hmr' | 'todo' | 'graph';

  type MetroSourceMapOrMappings = MixedSourceMap | Array<MetroSourceMapSegmentTuple>;

  export interface BundleOptions {
    bundleType: BundleType;
    customTransformOptions: CustomTransformOptions;
    dev: boolean;
    entryFile: string;
    readonly excludeSource: boolean;
    readonly hot: boolean;
    readonly inlineSourceMap: boolean;
    minify: boolean;
    readonly modulesOnly: boolean;
    onProgress: (doneCont: number, totalCount: number) => unknown | null | undefined;
    readonly platform: string | null | undefined;
    readonly runModule: boolean;
    readonly shallow: boolean;
    sourceMapUrl: string | null | undefined;
    sourceUrl: string | null | undefined;
    createModuleIdFactory?: () => (path: string) => number;
  }

  type ModuleTransportLike = {
    readonly code: string;
    readonly id: number;
    readonly map: MetroSourceMapOrMappings | null | undefined;
    readonly name?: string;
    readonly sourcePath: string;
  };

  export interface OutputOptions {
    bundleOutput: string;
    bundleEncoding?: 'utf8' | 'utf16le' | 'ascii';
    dev?: boolean;
    indexedRamBundle?: boolean;
    platform: string;
    sourcemapOutput?: string;
    sourcemapSourcesRoot?: string;
    sourcemapUseAbsolutePath?: boolean;
  }

  export interface RequestOptions {
    entryFile: string;
    inlineSourceMap?: boolean;
    sourceMapUrl?: string;
    dev?: boolean;
    minify: boolean;
    platform: string;
    createModuleIdFactory?: () => (path: string) => number;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
  }

  //#endregion
}
