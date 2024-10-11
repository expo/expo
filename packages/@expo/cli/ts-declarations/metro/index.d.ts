// #region metro
declare module 'metro' {
  export * from 'metro/src/index';
  export { default } from 'metro/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Assets.js
declare module 'metro/src/Assets' {
  export type AssetInfo = {
    readonly files: string[];
    readonly hash: string;
    readonly name: string;
    readonly scales: number[];
    readonly type: string;
  };
  export type AssetDataWithoutFiles = {
    readonly __packager_asset: boolean;
    readonly fileSystemLocation: string;
    readonly hash: string;
    readonly height?: null | number;
    readonly httpServerLocation: string;
    readonly name: string;
    readonly scales: number[];
    readonly type: string;
    readonly width?: null | number;
  };
  export type AssetDataFiltered = {
    readonly __packager_asset: boolean;
    readonly hash: string;
    readonly height?: null | number;
    readonly httpServerLocation: string;
    readonly name: string;
    readonly scales: number[];
    readonly type: string;
    readonly width?: null | number;
  };
  export type AssetData = AssetDataWithoutFiles & {
    readonly files: string[];
  };
  export type AssetDataPlugin = (assetData: AssetData) => AssetData | Promise<AssetData>;
  export function getAsset(
    relativePath: string,
    projectRoot: string,
    watchFolders: readonly string[],
    platform: null | undefined | string,
    assetExts: readonly string[]
  ): Promise<Buffer>;
  export function getAssetSize(
    type: string,
    content: Buffer,
    filePath: string
  ):
    | null
    | undefined
    | {
        readonly width: number;
        readonly height: number;
      };
  export function getAssetData(
    assetPath: string,
    localPath: string,
    assetDataPlugins: readonly string[],
    platform: null | undefined | string,
    publicPath: string
  ): Promise<AssetData>;
  export function getAssetFiles(
    assetPath: string,
    platform?: null | undefined | string
  ): Promise<string[]>;
  export function isAssetTypeAnImage(type: string): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Bundler.js
declare module 'metro/src/Bundler' {
  import type { TransformResultWithSource } from 'metro/src/DeltaBundler';
  import type { TransformOptions } from 'metro/src/DeltaBundler/Worker';
  import type EventEmitter from 'events';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import Transformer from 'metro/src/DeltaBundler/Transformer';
  import DependencyGraph from 'metro/src/node-haste/DependencyGraph';
  export type BundlerOptions = Readonly<{
    hasReducedPerformance?: boolean;
    watch?: boolean;
  }>;
  class Bundler {
    _depGraph: DependencyGraph;
    _readyPromise: Promise<void>;
    _transformer: Transformer;
    constructor(config: ConfigT, options?: BundlerOptions);
    getWatcher(): EventEmitter;
    end(): Promise<void>;
    getDependencyGraph(): Promise<DependencyGraph>;
    transformFile(
      filePath: string,
      transformOptions: TransformOptions,
      fileBuffer?: Buffer
    ): Promise<TransformResultWithSource>;
    ready(): Promise<void>;
  }
  export default Bundler;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Bundler/util.js
declare module 'metro/src/Bundler/util' {
  import type { AssetDataWithoutFiles } from 'metro/src/Assets';
  import type { ModuleTransportLike } from 'metro/src/shared/types.flow';
  import type { File } from '@babel/types';
  type SubTree<T extends ModuleTransportLike> = (
    moduleTransport: T,
    moduleTransportsByPath: Map<string, T>
  ) => Iterable<number>;
  export function createRamBundleGroups<T extends ModuleTransportLike>(
    ramGroups: readonly string[],
    groupableModules: readonly T[],
    subtree: SubTree<T>
  ): Map<number, Set<number>>;
  export function generateAssetCodeFileAst(
    assetRegistryPath: string,
    assetDescriptor: AssetDataWithoutFiles
  ): File;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/cli-utils.js
declare module 'metro/src/cli-utils' {
  export const watchFile: (filename: string, callback: () => any) => Promise<void>;
  export const makeAsyncCommand: <T>(command: (argv: T) => Promise<void>) => (argv: T) => void;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/cli.js
declare module 'metro/src/cli' {
  // This has no exports
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/cli/parseKeyValueParamArray.js
declare module 'metro/src/cli/parseKeyValueParamArray' {
  function coerceKeyValueArray(keyValueArray: readonly string[]): {
    [key: string]: string;
  };
  export default coerceKeyValueArray;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/commands/build.js
// NOTE(cedric): yargs is custom-typed in metro
// declare module 'metro/src/commands/build' {
//   import type { ModuleObject } from "yargs";
//   const $$EXPORT_DEFAULT_DECLARATION$$: () => Omit<ModuleObject, keyof ({
//     handler: Function;
//   })> & {
//     handler: Function;
//   };
//   export default $$EXPORT_DEFAULT_DECLARATION$$;
// }

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/commands/dependencies.js
// NOTE(cedric): yargs is custom-typed in metro
// declare module 'metro/src/commands/dependencies' {
//   import type { ModuleObject } from "yargs";
//   const $$EXPORT_DEFAULT_DECLARATION$$: () => Omit<ModuleObject, keyof ({
//     handler: Function;
//   })> & {
//     handler: Function;
//   };
//   export default $$EXPORT_DEFAULT_DECLARATION$$;
// }

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/commands/serve.js
// NOTE(cedric): yargs is custom-typed in metro
// declare module 'metro/src/commands/serve' {
//   import type { ModuleObject } from "yargs";
//   const $$EXPORT_DEFAULT_DECLARATION$$: () => Omit<ModuleObject, keyof ({
//     handler: Function;
//   })> & {
//     handler: Function;
//   };
//   export default $$EXPORT_DEFAULT_DECLARATION$$;
// }

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler.js
declare module 'metro/src/DeltaBundler' {
  import type {
    DeltaResult,
    Graph,
    MixedOutput,
    Options,
    ReadOnlyGraph,
  } from 'metro/src/DeltaBundler/types.flow';
  import type EventEmitter from 'events';
  import DeltaCalculator from 'metro/src/DeltaBundler/DeltaCalculator';
  export type {
    DeltaResult,
    Graph,
    Dependencies,
    MixedOutput,
    Module,
    ReadOnlyGraph,
    TransformFn,
    TransformResult,
    TransformResultDependency,
    TransformResultWithSource,
  } from 'metro/src/DeltaBundler/types.flow';
  /**
   * `DeltaBundler` uses the `DeltaTransformer` to build bundle deltas. This
   * module handles all the transformer instances so it can support multiple
   * concurrent clients requesting their own deltas. This is done through the
   * `clientId` param (which maps a client to a specific delta transformer).
   */
  class DeltaBundler<T = MixedOutput> {
    _changeEventSource: EventEmitter;
    _deltaCalculators: Map<Graph<T>, DeltaCalculator<T>>;
    constructor(changeEventSource: EventEmitter);
    end(): void;
    getDependencies(
      entryPoints: readonly string[],
      options: Options<T>
    ): Promise<ReadOnlyGraph<T>['dependencies']>;
    buildGraph(entryPoints: readonly string[], options: Options<T>): Promise<Graph<T>>;
    getDelta(
      graph: Graph<T>,
      $$PARAM_1$$: {
        reset: boolean;
        shallow: boolean;
      }
    ): Promise<DeltaResult<T>>;
    listen(graph: Graph<T>, callback: () => Promise<void>): () => void;
    endGraph(graph: Graph<T>): void;
  }
  export default DeltaBundler;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/buildSubgraph.js
declare module 'metro/src/DeltaBundler/buildSubgraph' {
  import type { RequireContext } from 'metro/src/lib/contextModule';
  import type {
    Dependency,
    ModuleData,
    ResolveFn,
    TransformFn,
  } from 'metro/src/DeltaBundler/types.flow';
  type Parameters<T> = Readonly<{
    resolve: ResolveFn;
    transform: TransformFn<T>;
    shouldTraverse: ($$PARAM_0$$: Dependency) => boolean;
  }>;
  export function buildSubgraph<T>(
    entryPaths: ReadonlySet<string>,
    resolvedContexts: ReadonlyMap<string, null | undefined | RequireContext>,
    $$PARAM_2$$: Parameters<T>
  ): Promise<{
    moduleData: Map<string, ModuleData<T>>;
    errors: Map<string, Error>;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/DeltaCalculator.js
declare module 'metro/src/DeltaBundler/DeltaCalculator' {
  import type { DeltaResult, Options } from 'metro/src/DeltaBundler/types.flow';
  import { Graph } from 'metro/src/DeltaBundler/Graph';
  import { EventEmitter } from 'events';
  /**
   * This class is in charge of calculating the delta of changed modules that
   * happen between calls. To do so, it subscribes to file changes, so it can
   * traverse the files that have been changed between calls and avoid having to
   * traverse the whole dependency tree for trivial small changes.
   */
  class DeltaCalculator<T> extends EventEmitter {
    _changeEventSource: EventEmitter;
    _options: Options<T>;
    _currentBuildPromise: null | undefined | Promise<DeltaResult<T>>;
    _deletedFiles: Set<string>;
    _modifiedFiles: Set<string>;
    _addedFiles: Set<string>;
    _requiresReset: any;
    _graph: Graph<T>;
    constructor(
      entryPoints: ReadonlySet<string>,
      changeEventSource: EventEmitter,
      options: Options<T>
    );
    end(): void;
    getDelta($$PARAM_0$$: { reset: boolean; shallow: boolean }): Promise<DeltaResult<T>>;
    getGraph(): Graph<T>;
    _handleMultipleFileChanges: any;
    _handleFileChange: any;
    _getChangedDependencies(
      modifiedFiles: Set<string>,
      deletedFiles: Set<string>,
      addedFiles: Set<string>
    ): Promise<DeltaResult<T>>;
  }
  export default DeltaCalculator;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/getTransformCacheKey.js
declare module 'metro/src/DeltaBundler/getTransformCacheKey' {
  import type { TransformerConfig } from 'metro/src/DeltaBundler/Worker';
  function getTransformCacheKey(opts: {
    readonly cacheVersion: string;
    readonly projectRoot: string;
    readonly transformerConfig: TransformerConfig;
  }): string;
  export default getTransformCacheKey;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Graph.js
declare module 'metro/src/DeltaBundler/Graph' {
  /**
   * Portions of this code are based on the Synchronous Cycle Collection
   * algorithm described in:
   *
   * David F. Bacon and V. T. Rajan. 2001. Concurrent Cycle Collection in
   * Reference Counted Systems. In Proceedings of the 15th European Conference on
   * Object-Oriented Programming (ECOOP '01). Springer-Verlag, Berlin,
   * Heidelberg, 207–235.
   *
   * Notable differences from the algorithm in the paper:
   * 1. Our implementation uses the inverseDependencies set (which we already
   *    have to maintain) instead of a separate refcount variable. A module's
   *    reference count is equal to the size of its inverseDependencies set, plus
   *    1 if it's an entry point of the graph.
   * 2. We keep the "root buffer" (possibleCycleRoots) free of duplicates by
   *    making it a Set, instead of storing a "buffered" flag on each node.
   * 3. On top of tracking edges between nodes, we also count references between
   *    nodes and entries in the importBundleNodes set.
   */

  import type { RequireContext } from 'metro/src/lib/contextModule';
  import type {
    Dependencies,
    Dependency,
    GraphInputOptions,
    MixedOutput,
    Module,
    ModuleData,
    Options,
    TransformInputOptions,
  } from 'metro/src/DeltaBundler/types.flow';
  import CountingSet from 'metro/src/lib/CountingSet';
  export type Result<T> = {
    added: Map<string, Module<T>>;
    modified: Map<string, Module<T>>;
    deleted: Set<string>;
  };
  /**
   * Internal data structure that the traversal logic uses to know which of the
   * files have been modified. This allows to return the added modules before the
   * modified ones (which is useful for things like Hot Module Reloading).
   **/
  /**
   * Internal data structure that the traversal logic uses to know which of the
   * files have been modified. This allows to return the added modules before the
   * modified ones (which is useful for things like Hot Module Reloading).
   **/
  type Delta<T> = Readonly<{
    added: Set<string>;
    touched: Set<string>;
    deleted: Set<string>;
    updatedModuleData: ReadonlyMap<string, ModuleData<T>>;
    baseModuleData: Map<string, ModuleData<T>>;
    errors: ReadonlyMap<string, Error>;
  }>;
  type InternalOptions<T> = Readonly<{
    lazy: boolean;
    onDependencyAdd: () => any;
    onDependencyAdded: () => any;
    resolve: Options<T>['resolve'];
    transform: Options<T>['transform'];
    shallow: boolean;
  }>;
  export class Graph<T = MixedOutput> {
    readonly entryPoints: ReadonlySet<string>;
    readonly transformOptions: TransformInputOptions;
    readonly dependencies: Dependencies<T>;
    constructor(options: GraphInputOptions);
    traverseDependencies(paths: readonly string[], options: Options<T>): Promise<Result<T>>;
    initialTraverseDependencies(options: Options<T>): Promise<Result<T>>;
    _buildDelta(
      pathsToVisit: ReadonlySet<string>,
      options: InternalOptions<T>,
      moduleFilter?: (path: string) => boolean
    ): Promise<Delta<T>>;
    _recursivelyCommitModule(
      path: string,
      delta: Delta<T>,
      options: InternalOptions<T>,
      commitOptions: Readonly<{
        onlyRemove: boolean;
      }>
    ): Module<T>;
    _addDependency(
      parentModule: Module<T>,
      key: string,
      dependency: Dependency,
      requireContext: null | undefined | RequireContext,
      delta: Delta<T>,
      options: InternalOptions<T>
    ): void;
    _removeDependency(
      parentModule: Module<T>,
      key: string,
      dependency: Dependency,
      delta: Delta<T>,
      options: InternalOptions<T>
    ): void;
    markModifiedContextModules(
      filePath: string,
      modifiedPaths: Set<string> | CountingSet<string>
    ): void;
    getModifiedModulesForDeletedPath(filePath: string): Iterable<string>;
    reorderGraph(options: { shallow: boolean }): void;
    _reorderDependencies(
      module: Module<T>,
      orderedDependencies: Map<string, Module<T>>,
      options: {
        shallow: boolean;
      }
    ): void;
    _incrementImportBundleReference(dependency: Dependency, parentModule: Module<T>): void;
    _decrementImportBundleReference(dependency: Dependency, parentModule: Module<T>): void;
    _markModuleInUse(module: Module<T>): void;
    _children(module: Module<T>, options: InternalOptions<T>): Iterator<Module<T>>;
    _moduleSnapshot(module: Module<T>): ModuleData<T>;
    _releaseModule(module: Module<T>, delta: Delta<T>, options: InternalOptions<T>): void;
    _freeModule(module: Module<T>, delta: Delta<T>): void;
    _markAsPossibleCycleRoot(module: Module<T>): void;
    _collectCycles(delta: Delta<T>, options: InternalOptions<T>): void;
    _markGray(module: Module<T>, options: InternalOptions<T>): void;
    _scan(module: Module<T>, options: InternalOptions<T>): void;
    _scanBlack(module: Module<T>, options: InternalOptions<T>): void;
    _collectWhite(module: Module<T>, delta: Delta<T>): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/mergeDeltas.js
declare module 'metro/src/DeltaBundler/mergeDeltas' {
  import type { DeltaBundle } from 'metro-runtime/src/modules/types.flow';
  function mergeDeltas(delta1: DeltaBundle, delta2: DeltaBundle): DeltaBundle;
  export default mergeDeltas;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js
declare module 'metro/src/DeltaBundler/Serializers/baseJSBundle' {
  import type { Module, ReadOnlyGraph, SerializerOptions } from 'metro/src/DeltaBundler/types.flow';
  import type { Bundle } from 'metro-runtime/src/modules/types.flow';
  function baseJSBundle(
    entryPoint: string,
    preModules: readonly Module[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Bundle;
  export default baseJSBundle;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/getAllFiles.js
declare module 'metro/src/DeltaBundler/Serializers/getAllFiles' {
  import type { Module, ReadOnlyGraph } from 'metro/src/DeltaBundler/types.flow';
  type Options = {
    platform?: null | string;
    readonly processModuleFilter: (module: Module) => boolean;
  };
  function getAllFiles(
    pre: readonly Module[],
    graph: ReadOnlyGraph,
    options: Options
  ): Promise<readonly string[]>;
  export default getAllFiles;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/getAssets.js
declare module 'metro/src/DeltaBundler/Serializers/getAssets' {
  import type { AssetData } from 'metro/src/Assets';
  import type { Module, ReadOnlyDependencies } from 'metro/src/DeltaBundler/types.flow';
  type Options = {
    readonly processModuleFilter: (module: Module) => boolean;
    assetPlugins: readonly string[];
    platform?: null | string;
    projectRoot: string;
    publicPath: string;
  };
  function getAssets(
    dependencies: ReadOnlyDependencies,
    options: Options
  ): Promise<readonly AssetData[]>;
  export default getAssets;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/getExplodedSourceMap.js
declare module 'metro/src/DeltaBundler/Serializers/getExplodedSourceMap' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  import type { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
  export type ExplodedSourceMap = readonly {
    readonly map: MetroSourceMapSegmentTuple[];
    readonly firstLine1Based: number;
    readonly functionMap?: null | FBSourceFunctionMap;
    readonly path: string;
  }[];
  export function getExplodedSourceMap(
    modules: readonly Module[],
    options: {
      readonly processModuleFilter: (module: Module) => boolean;
    }
  ): ExplodedSourceMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/getRamBundleInfo.js
declare module 'metro/src/DeltaBundler/Serializers/getRamBundleInfo' {
  import type { ModuleTransportLike } from 'metro/src/shared/types.flow';
  import type { Module, ReadOnlyGraph, SerializerOptions } from 'metro/src/DeltaBundler/types.flow';
  import type { SourceMapGeneratorOptions } from 'metro/src/DeltaBundler/Serializers/sourceMapGenerator';
  import type { GetTransformOptions } from 'metro-config/src/configTypes.flow';
  type Options = Readonly<
    {
      getTransformOptions?: null | GetTransformOptions;
      platform?: null | string;
    } & SerializerOptions &
      SourceMapGeneratorOptions
  >;
  export type RamBundleInfo = {
    getDependencies: ($$PARAM_0$$: string) => Set<string>;
    startupModules: readonly ModuleTransportLike[];
    lazyModules: readonly ModuleTransportLike[];
    groups: Map<number, Set<number>>;
  };
  function getRamBundleInfo(
    entryPoint: string,
    pre: readonly Module[],
    graph: ReadOnlyGraph,
    options: Options
  ): Promise<RamBundleInfo>;
  export default getRamBundleInfo;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL.js
declare module 'metro/src/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL' {
  function getInlineSourceMappingURL(sourceMap: string): string;
  export default getInlineSourceMappingURL;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/helpers/getSourceMapInfo.js
declare module 'metro/src/DeltaBundler/Serializers/helpers/getSourceMapInfo' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  import type { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
  function getSourceMapInfo(
    module: Module,
    options: {
      readonly excludeSource: boolean;
      readonly shouldAddToIgnoreList: ($$PARAM_0$$: Module) => boolean;
      getSourceUrl?: null | ((module: Module) => string);
    }
  ): {
    readonly map: MetroSourceMapSegmentTuple[];
    readonly functionMap?: null | FBSourceFunctionMap;
    readonly code: string;
    readonly path: string;
    readonly source: string;
    readonly lineCount: number;
    readonly isIgnored: boolean;
  };
  export default getSourceMapInfo;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/helpers/getTransitiveDependencies.js
declare module 'metro/src/DeltaBundler/Serializers/helpers/getTransitiveDependencies' {
  import type { ReadOnlyGraph } from 'metro/src/DeltaBundler/types.flow';
  function getTransitiveDependencies<T>(path: string, graph: ReadOnlyGraph<T>): Set<string>;
  export default getTransitiveDependencies;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/helpers/js.js
declare module 'metro/src/DeltaBundler/Serializers/helpers/js' {
  import type { MixedOutput, Module } from 'metro/src/DeltaBundler/types.flow';
  import type { JsOutput } from 'metro-transform-worker';
  export type Options = Readonly<{
    createModuleId: ($$PARAM_0$$: string) => number | string;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl?: null | string;
  }>;
  export function getJsOutput(
    module: Readonly<{
      output: readonly MixedOutput[];
      path?: string;
    }>
  ): JsOutput;
  export function getModuleParams(module: Module, options: Options): any[];
  export function isJsModule(module: Module): boolean;
  export function wrapModule(module: Module, options: Options): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/helpers/processModules.js
declare module 'metro/src/DeltaBundler/Serializers/helpers/processModules' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  function processModules(
    modules: readonly Module[],
    $$PARAM_1$$: Readonly<{
      filter?: (module: Module) => boolean;
      createModuleId: ($$PARAM_0$$: string) => number;
      dev: boolean;
      includeAsyncPaths: boolean;
      projectRoot: string;
      serverRoot: string;
      sourceUrl?: null | string;
    }>
  ): readonly [Module, string][];
  export default processModules;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js
declare module 'metro/src/DeltaBundler/Serializers/hmrJSBundle' {
  import type { EntryPointURL } from 'metro/src/HmrServer';
  import type { DeltaResult, ReadOnlyGraph } from 'metro/src/DeltaBundler/types.flow';
  import type { HmrModule } from 'metro-runtime/src/modules/types.flow';
  type Options = Readonly<{
    clientUrl: EntryPointURL;
    createModuleId: ($$PARAM_0$$: string) => number;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
  }>;
  function hmrJSBundle(
    delta: DeltaResult,
    graph: ReadOnlyGraph,
    options: Options
  ): {
    readonly added: readonly HmrModule[];
    readonly deleted: readonly number[];
    readonly modified: readonly HmrModule[];
  };
  export default hmrJSBundle;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/sourceMapGenerator.js
declare module 'metro/src/DeltaBundler/Serializers/sourceMapGenerator' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  import { fromRawMappings, fromRawMappingsNonBlocking } from 'metro-source-map';
  export type SourceMapGeneratorOptions = Readonly<{
    excludeSource: boolean;
    processModuleFilter: (module: Module) => boolean;
    shouldAddToIgnoreList: (module: Module) => boolean;
    getSourceUrl?: null | ((module: Module) => string);
  }>;
  export function sourceMapGenerator(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): ReturnType<typeof fromRawMappings>;
  export function sourceMapGeneratorNonBlocking(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): ReturnType<typeof fromRawMappingsNonBlocking>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/sourceMapObject.js
declare module 'metro/src/DeltaBundler/Serializers/sourceMapObject' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  import type { SourceMapGeneratorOptions } from 'metro/src/DeltaBundler/Serializers/sourceMapGenerator';
  import type { MixedSourceMap } from 'metro-source-map';
  export function sourceMapObject(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): MixedSourceMap;
  export function sourceMapObjectNonBlocking(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): Promise<MixedSourceMap>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Serializers/sourceMapString.js
declare module 'metro/src/DeltaBundler/Serializers/sourceMapString' {
  import type { Module } from 'metro/src/DeltaBundler/types.flow';
  import type { SourceMapGeneratorOptions } from 'metro/src/DeltaBundler/Serializers/sourceMapGenerator';
  export function sourceMapString(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): string;
  export function sourceMapStringNonBlocking(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): Promise<string>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Transformer.js
declare module 'metro/src/DeltaBundler/Transformer' {
  import type { TransformResult, TransformResultWithSource } from 'metro/src/DeltaBundler';
  import type { TransformOptions } from 'metro/src/DeltaBundler/Worker';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import WorkerFarm from 'metro/src/DeltaBundler/WorkerFarm';
  import { Cache } from 'metro-cache';
  class Transformer {
    _config: ConfigT;
    _cache: Cache<TransformResult>;
    _baseHash: string;
    _getSha1: ($$PARAM_0$$: string) => string;
    _workerFarm: WorkerFarm;
    constructor(config: ConfigT, getSha1Fn: ($$PARAM_0$$: string) => string);
    transformFile(
      filePath: string,
      transformerOptions: TransformOptions,
      fileBuffer?: Buffer
    ): Promise<TransformResultWithSource>;
    end(): void;
  }
  export default Transformer;
}

// NOTE(cedric): this is a manual change, to avoid having to import `../types.flow`
declare module 'metro/src/DeltaBundler/types' {
  export * from 'metro/src/DeltaBundler/types.flow';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/types.flow.js
declare module 'metro/src/DeltaBundler/types.flow' {
  import type * as _babel_types from '@babel/types';
  import type { RequireContext } from 'metro/src/lib/contextModule';
  import type { RequireContextParams } from 'metro/src/ModuleGraph/worker/collectDependencies';
  import type { Graph } from 'metro/src/DeltaBundler/Graph';
  import type { JsTransformOptions } from 'metro-transform-worker';
  import CountingSet from 'metro/src/lib/CountingSet';
  export type MixedOutput = {
    readonly data: any;
    readonly type: string;
  };
  export type AsyncDependencyType = 'async' | 'maybeSync' | 'prefetch' | 'weak';
  export type TransformResultDependency = Readonly<{
    /**
     * The literal name provided to a require or import call. For example 'foo' in
     * case of `require('foo')`.
     */
    name: string;
    /**
     * Extra data returned by the dependency extractor.
     */
    data: Readonly<{
      /**
       * A locally unique key for this dependency within the current module.
       */
      key: string;
      /**
       * If not null, this dependency is due to a dynamic `import()` or `__prefetchImport()` call.
       */
      asyncType?: AsyncDependencyType | null;
      /**
       * The dependency is enclosed in a try/catch block.
       */
      isOptional?: boolean;
      locs: readonly _babel_types.SourceLocation[];
      /** Context for requiring a collection of modules. */
      contextParams?: RequireContextParams;
    }>;
  }>;
  export type Dependency = Readonly<{
    absolutePath: string;
    data: TransformResultDependency;
  }>;
  export type Module<T = MixedOutput> = Readonly<{
    dependencies: Map<string, Dependency>;
    inverseDependencies: CountingSet<string>;
    output: readonly T[];
    path: string;
    getSource: () => Buffer;
    unstable_transformResultKey?: null | undefined | string;
  }>;
  export type ModuleData<T = MixedOutput> = Readonly<{
    dependencies: ReadonlyMap<string, Dependency>;
    resolvedContexts: ReadonlyMap<string, RequireContext>;
    output: readonly T[];
    getSource: () => Buffer;
    unstable_transformResultKey?: null | undefined | string;
  }>;
  export type Dependencies<T = MixedOutput> = Map<string, Module<T>>;
  export type ReadOnlyDependencies<T = MixedOutput> = ReadonlyMap<string, Module<T>>;
  export type TransformInputOptions = Pick<
    JsTransformOptions,
    Exclude<
      keyof JsTransformOptions,
      keyof {
        inlinePlatform: boolean;
        inlineRequires: boolean;
      }
    >
  >;
  export type GraphInputOptions = Readonly<{
    entryPoints: ReadonlySet<string>;
    transformOptions: TransformInputOptions;
  }>;
  export interface ReadOnlyGraph<T = MixedOutput> {
    readonly entryPoints: ReadonlySet<string>;
    readonly transformOptions: Readonly<TransformInputOptions>;
    readonly dependencies: ReadOnlyDependencies<T>;
  }
  export type { Graph };
  export type TransformResult<T = MixedOutput> = Readonly<{
    dependencies: readonly TransformResultDependency[];
    output: readonly T[];
    unstable_transformResultKey?: null | undefined | string;
  }>;
  export type TransformResultWithSource<T = MixedOutput> = Readonly<
    {
      getSource: () => Buffer;
    } & TransformResult<T>
  >;
  export type TransformFn<T = MixedOutput> = (
    $$PARAM_0$$: string,
    $$PARAM_1$$: null | undefined | RequireContext
  ) => Promise<TransformResultWithSource<T>>;
  export type ResolveFn = (
    from: string,
    dependency: TransformResultDependency
  ) => BundlerResolution;
  export type AllowOptionalDependenciesWithOptions = {
    readonly exclude: string[];
  };
  export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
  export type BundlerResolution = Readonly<{
    type: 'sourceFile';
    filePath: string;
  }>;
  export type Options<T = MixedOutput> = {
    readonly resolve: ResolveFn;
    readonly transform: TransformFn<T>;
    readonly transformOptions: TransformInputOptions;
    readonly onProgress?: null | ((numProcessed: number, total: number) => any);
    readonly lazy: boolean;
    readonly unstable_allowRequireContext: boolean;
    readonly unstable_enablePackageExports: boolean;
    readonly shallow: boolean;
  };
  export type DeltaResult<T = MixedOutput> = {
    readonly added: Map<string, Module<T>>;
    readonly modified: Map<string, Module<T>>;
    readonly deleted: Set<string>;
    readonly reset: boolean;
  };
  export type SerializerOptions<T = MixedOutput> = Readonly<{
    asyncRequireModulePath: string;
    createModuleId: ($$PARAM_0$$: string) => number;
    dev: boolean;
    getRunModuleStatement: ($$PARAM_0$$: number | string) => string;
    includeAsyncPaths: boolean;
    inlineSourceMap?: null | boolean;
    modulesOnly: boolean;
    processModuleFilter: (module: Module<T>) => boolean;
    projectRoot: string;
    runBeforeMainModule: readonly string[];
    runModule: boolean;
    serverRoot: string;
    shouldAddToIgnoreList: ($$PARAM_0$$: Module<T>) => boolean;
    sourceMapUrl?: null | string;
    sourceUrl?: null | string;
    getSourceUrl?: null | (($$PARAM_0$$: Module<T>) => string);
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Worker.js
declare module 'metro/src/DeltaBundler/Worker' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Worker.js

  // NOTE(cedric): Metro uses this weird Flow syntax /*:: */ to override the exported types...
  export * from 'metro/src/DeltaBundler/Worker.flow';
  export { default } from 'metro/src/DeltaBundler/Worker.flow';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/Worker.flow.js
declare module 'metro/src/DeltaBundler/Worker.flow' {
  import type { TransformResult } from 'metro/src/DeltaBundler/types.flow';
  import type { LogEntry } from 'metro-core/src/Logger';
  import type { JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
  export type { JsTransformOptions as TransformOptions } from 'metro-transform-worker';
  export type Worker = {
    readonly transform: typeof transform;
  };
  export type TransformerConfig = {
    transformerPath: string;
    transformerConfig: JsTransformerConfig;
  };
  type Data = Readonly<{
    result: TransformResult;
    sha1: string;
    transformFileStartLogEntry: LogEntry;
    transformFileEndLogEntry: LogEntry;
  }>;
  function transform(
    filename: string,
    transformOptions: JsTransformOptions,
    projectRoot: string,
    transformerConfig: TransformerConfig,
    fileBuffer?: Buffer
  ): Promise<Data>;
  const $$EXPORT_DEFAULT_DECLARATION$$: Worker;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/DeltaBundler/WorkerFarm.js
declare module 'metro/src/DeltaBundler/WorkerFarm' {
  import type { TransformResult } from 'metro/src/DeltaBundler';
  import type { TransformerConfig, TransformOptions, Worker } from 'metro/src/DeltaBundler/Worker';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import type { Readable } from 'stream';
  type WorkerInterface = {
    getStdout(): Readable;
    getStderr(): Readable;
    end(): void;
  } & Worker;
  type TransformerResult = Readonly<{
    result: TransformResult;
    sha1: string;
  }>;
  class WorkerFarm {
    _config: ConfigT;
    _transformerConfig: TransformerConfig;
    _worker: WorkerInterface | Worker;
    constructor(config: ConfigT, transformerConfig: TransformerConfig);
    kill(): Promise<void>;
    transform(
      filename: string,
      options: TransformOptions,
      fileBuffer?: Buffer
    ): Promise<TransformerResult>;
    _makeFarm(
      absoluteWorkerPath: string,
      exposedMethods: readonly string[],
      numWorkers: number
    ): any;
    _computeWorkerKey(method: string, filename: string): null | undefined | string;
    _formatGenericError(err: any, filename: string): TransformError;
    _formatBabelError(err: any, filename: string): TransformError;
  }
  class TransformError extends SyntaxError {
    type: string;
    constructor(message: string);
  }
  export default WorkerFarm;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/HmrServer.js
declare module 'metro/src/HmrServer' {
  import type { GraphOptions } from 'metro/src/shared/types.flow';
  import type { ConfigT, RootPerfLogger } from 'metro-config';
  import type { HmrErrorMessage, HmrUpdateMessage } from 'metro-runtime/src/modules/types.flow';
  import type { UrlWithParsedQuery } from 'url';
  import type IncrementalBundler from 'metro/src/IncrementalBundler';
  import type { RevisionId } from 'metro/src/IncrementalBundler';
  export type EntryPointURL = UrlWithParsedQuery;
  export type Client = {
    optedIntoHMR: boolean;
    revisionIds: RevisionId[];
    readonly sendFn: ($$PARAM_0$$: string) => void;
  };
  type ClientGroup = {
    readonly clients: Set<Client>;
    clientUrl: EntryPointURL;
    revisionId: RevisionId;
    readonly unlisten: () => void;
    readonly graphOptions: GraphOptions;
  };
  /**
   * The HmrServer (Hot Module Reloading) implements a lightweight interface
   * to communicate easily to the logic in the React Native repository (which
   * is the one that handles the Web Socket connections).
   *
   * This interface allows the HmrServer to hook its own logic to WS clients
   * getting connected, disconnected or having errors (through the
   * `onClientConnect`, `onClientDisconnect` and `onClientError` methods).
   */
  class HmrServer<TClient extends Client = Client> {
    _config: ConfigT;
    _bundler: IncrementalBundler;
    _createModuleId: (path: string) => number;
    _clientGroups: Map<RevisionId, ClientGroup>;
    constructor(
      bundler: IncrementalBundler,
      createModuleId: (path: string) => number,
      config: ConfigT
    );
    onClientConnect: (requestUrl: string, sendFn: (data: string) => void) => Promise<Client>;
    _registerEntryPoint(
      client: Client,
      requestUrl: string,
      sendFn: (data: string) => void
    ): Promise<void>;
    onClientMessage: (
      client: TClient,
      message: string | Buffer | ArrayBuffer | Buffer[],
      sendFn: (data: string) => void
    ) => Promise<void>;
    onClientError: (client: TClient, e: ErrorEvent) => void;
    onClientDisconnect: (client: TClient) => void;
    _handleFileChange(
      group: ClientGroup,
      options: {
        isInitialUpdate: boolean;
      },
      changeEvent:
        | null
        | undefined
        | {
            logger?: null | RootPerfLogger;
          }
    ): Promise<void>;
    _prepareMessage(
      group: ClientGroup,
      options: {
        isInitialUpdate: boolean;
      },
      changeEvent:
        | null
        | undefined
        | {
            logger?: null | RootPerfLogger;
          }
    ): Promise<HmrUpdateMessage | HmrErrorMessage>;
  }
  export default HmrServer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/IncrementalBundler.js
declare module 'metro/src/IncrementalBundler' {
  import type { DeltaResult, Graph, Module } from 'metro/src/DeltaBundler';
  import type {
    Options as DeltaBundlerOptions,
    ReadOnlyDependencies,
    TransformInputOptions,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { GraphId } from 'metro/src/lib/getGraphId';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import Bundler from 'metro/src/Bundler';
  import DeltaBundler from 'metro/src/DeltaBundler';
  export type RevisionId = string;
  export type OutputGraph = Graph;
  type OtherOptions = Readonly<{
    onProgress: DeltaBundlerOptions['onProgress'];
    shallow: boolean;
    lazy: boolean;
  }>;
  export type GraphRevision = {
    readonly id: RevisionId;
    readonly date: Date;
    readonly graphId: GraphId;
    readonly graph: OutputGraph;
    readonly prepend: readonly Module[];
  };
  export type IncrementalBundlerOptions = Readonly<{
    hasReducedPerformance?: boolean;
    watch?: boolean;
  }>;
  class IncrementalBundler {
    _config: ConfigT;
    _bundler: Bundler;
    _deltaBundler: DeltaBundler;
    _revisionsById: Map<RevisionId, Promise<GraphRevision>>;
    _revisionsByGraphId: Map<GraphId, Promise<GraphRevision>>;
    static revisionIdFromString: (str: string) => RevisionId;
    constructor(config: ConfigT, options?: IncrementalBundlerOptions);
    end(): void;
    getBundler(): Bundler;
    getDeltaBundler(): DeltaBundler;
    getRevision(revisionId: RevisionId): null | undefined | Promise<GraphRevision>;
    getRevisionByGraphId(graphId: GraphId): null | undefined | Promise<GraphRevision>;
    buildGraphForEntries(
      entryFiles: readonly string[],
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<OutputGraph>;
    getDependencies(
      entryFiles: readonly string[],
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<ReadOnlyDependencies>;
    buildGraph(
      entryFile: string,
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<{
      readonly graph: OutputGraph;
      readonly prepend: readonly Module[];
    }>;
    initializeGraph(
      entryFile: string,
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<{
      delta: DeltaResult;
      revision: GraphRevision;
    }>;
    updateGraph(
      revision: GraphRevision,
      reset: boolean
    ): Promise<{
      delta: DeltaResult;
      revision: GraphRevision;
    }>;
    endGraph(graphId: GraphId): Promise<void>;
    _getAbsoluteEntryFiles(entryFiles: readonly string[]): Promise<readonly string[]>;
    ready(): Promise<void>;
  }
  export default IncrementalBundler;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/IncrementalBundler/GraphNotFoundError.js
declare module 'metro/src/IncrementalBundler/GraphNotFoundError' {
  import type { GraphId } from 'metro/src/lib/getGraphId';
  class GraphNotFoundError extends Error {
    graphId: GraphId;
    constructor(graphId: GraphId);
  }
  export default GraphNotFoundError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/IncrementalBundler/ResourceNotFoundError.js
declare module 'metro/src/IncrementalBundler/ResourceNotFoundError' {
  class ResourceNotFoundError extends Error {
    resourcePath: string;
    constructor(resourcePath: string);
  }
  export default ResourceNotFoundError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/IncrementalBundler/RevisionNotFoundError.js
declare module 'metro/src/IncrementalBundler/RevisionNotFoundError' {
  import type { RevisionId } from 'metro/src/IncrementalBundler';
  class RevisionNotFoundError extends Error {
    revisionId: RevisionId;
    constructor(revisionId: RevisionId);
  }
  export default RevisionNotFoundError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/index.js
declare module 'metro/src/index' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/index.js

  // NOTE(cedric): Metro uses this weird Flow syntax /*:: */ to override the exported types...
  export * from 'metro/src/index.flow';

  // NOTE(cedric): these are exported in Metro's own custom `index.d.ts`
  export * from 'metro/src/Assets'; // lmao, the typo
  export * from 'metro/src/DeltaBundler/types.flow';
  // NOTE(cedric): only exporting select types due to type conflicts
  export {
    Dependency,
    ContextMode,
    RequireContextParams,
    MutableInternalDependency,
    InternalDependency,
    State,
    Options,
    CollectedDependencies,
    DependencyTransformer,
    DynamicRequiresBehavior,
    ImportQualifier,
  } from 'metro/src/ModuleGraph/worker/collectDependencies';
  export * from 'metro/src/Server';
  export * from 'metro/src/lib/reporting';

  // NOTE(cedric): add this since we had this already, might be nice to deprecate
  export { default as Server } from 'metro/src/Server';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/index.flow.js
declare module 'metro/src/index.flow' {
  import type * as _ws from 'ws';
  import type { ReadOnlyGraph } from 'metro/src/DeltaBundler';
  import type { ServerOptions } from 'metro/src/Server';
  import type { OutputOptions, RequestOptions } from 'metro/src/shared/types.flow';
  import type { HandleFunction } from 'connect';
  import type { Server as HttpServer } from 'http';
  import type { Server as HttpsServer } from 'https';
  import type {
    ConfigT,
    InputConfigT,
    MetroConfig,
    Middleware,
  } from 'metro-config/src/configTypes.flow';
  import type { CustomResolverOptions } from 'metro-resolver';
  import type { CustomTransformOptions } from 'metro-transform-worker';
  import type $$IMPORT_TYPEOF_1$$ from 'yargs';
  type Yargs = typeof $$IMPORT_TYPEOF_1$$;
  import MetroServer from 'metro/src/Server';
  type MetroMiddleWare = {
    attachHmrServer: (httpServer: HttpServer | HttpsServer) => void;
    end: () => void;
    metroServer: MetroServer;
    middleware: Middleware;
  };
  export type RunMetroOptions = {
    waitForBundler?: boolean;
  } & ServerOptions;
  export type RunServerOptions = Readonly<{
    hasReducedPerformance?: boolean;
    host?: string;
    onError?: (
      $$PARAM_0$$: Error & {
        code?: string;
      }
    ) => void;
    onReady?: (server: HttpServer | HttpsServer) => void;
    secureServerOptions?: object;
    secure?: boolean;
    secureCert?: string;
    secureKey?: string;
    unstable_extraMiddleware?: readonly HandleFunction[];
    waitForBundler?: boolean;
    watch?: boolean;
    websocketEndpoints?: Readonly<{
      [path: string]: _ws.WebSocketServer;
    }>;
  }>;
  type BuildGraphOptions = {
    entries: readonly string[];
    customTransformOptions?: CustomTransformOptions;
    dev?: boolean;
    minify?: boolean;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
    platform?: string;
    type?: 'module' | 'script';
  };
  export type RunBuildOptions = {
    entry: string;
    dev?: boolean;
    out?: string;
    onBegin?: () => void;
    onComplete?: () => void;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
    minify?: boolean;
    output?: {
      build: (
        $$PARAM_0$$: MetroServer,
        $$PARAM_1$$: RequestOptions
      ) => Promise<{
        code: string;
        map: string;
      }>;
      save: (
        $$PARAM_0$$: {
          code: string;
          map: string;
        },
        $$PARAM_1$$: OutputOptions,
        $$PARAM_2$$: (...args: string[]) => void
      ) => Promise<any>;
    };
    platform?: string;
    sourceMap?: boolean;
    sourceMapUrl?: string;
    customResolverOptions?: CustomResolverOptions;
    customTransformOptions?: CustomTransformOptions;
  };
  type BuildCommandOptions = object | null;
  type ServeCommandOptions = object | null;
  export type { MetroConfig };
  type AttachMetroCLIOptions = {
    build?: BuildCommandOptions;
    serve?: ServeCommandOptions;
    dependencies?: any;
  };
  export { Terminal } from 'metro-core';
  export { default as TerminalReporter } from 'metro/src/lib/TerminalReporter';
  export function runMetro(config: InputConfigT, options?: RunMetroOptions): void;
  export { loadConfig } from 'metro-config';
  export { mergeConfig } from 'metro-config';
  export { resolveConfig } from 'metro-config';
  export let createConnectMiddleware: (
    config: ConfigT,
    options?: RunMetroOptions
  ) => Promise<MetroMiddleWare>;
  export const runServer: (
    config: ConfigT,
    $$PARAM_1$$: RunServerOptions
  ) => Promise<HttpServer | HttpsServer>;
  export const runBuild: (
    config: ConfigT,
    $$PARAM_1$$: RunBuildOptions
  ) => Promise<{
    code: string;
    map: string;
  }>;
  export const buildGraph: (
    config: InputConfigT,
    $$PARAM_1$$: BuildGraphOptions
  ) => Promise<ReadOnlyGraph>;
  export const attachMetroCli: (yargs: Yargs, options?: AttachMetroCLIOptions) => Yargs;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/BatchProcessor.js
declare module 'metro/src/lib/BatchProcessor' {
  type ProcessBatch<TItem, TResult> = (batch: TItem[]) => Promise<TResult[]>;
  type BatchProcessorOptions = {
    maximumDelayMs: number;
    maximumItems: number;
    concurrency: number;
  };
  type QueueItem<TItem, TResult> = {
    item: TItem;
    reject: (error: any) => any;
    resolve: (result: TResult) => any;
  };
  /**
   * We batch items together trying to minimize their processing, for example as
   * network queries. For that we wait a small moment before processing a batch.
   * We limit also the number of items we try to process in a single batch so that
   * if we have many items pending in a short amount of time, we can start
   * processing right away.
   */
  class BatchProcessor<TItem, TResult> {
    _currentProcessCount: number;
    _options: BatchProcessorOptions;
    _processBatch: ProcessBatch<TItem, TResult>;
    _queue: QueueItem<TItem, TResult>[];
    _timeoutHandle: null | undefined | NodeJS.Timeout;
    constructor(options: BatchProcessorOptions, processBatch: ProcessBatch<TItem, TResult>);
    _onBatchFinished(): void;
    _onBatchResults(jobs: QueueItem<TItem, TResult>[], results: TResult[]): void;
    _onBatchError(jobs: QueueItem<TItem, TResult>[], error: any): void;
    _processQueue(): void;
    _processQueueOnceReady(): void;
    queue(item: TItem): Promise<TResult>;
    getQueueLength(): number;
  }
  export default BatchProcessor;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/bundleToString.js
declare module 'metro/src/lib/bundleToString' {
  import type { Bundle, BundleMetadata } from 'metro-runtime/src/modules/types.flow';
  /**
   * Serializes a bundle into a plain JS bundle.
   */
  function bundleToString(bundle: Bundle): {
    readonly code: string;
    readonly metadata: BundleMetadata;
  };
  export default bundleToString;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/contextModule.js
declare module 'metro/src/lib/contextModule' {
  import type {
    ContextMode,
    RequireContextParams,
  } from 'metro/src/ModuleGraph/worker/collectDependencies';
  export type RequireContext = Readonly<{
    recursive: boolean;
    filter: RegExp;
    /** Mode for resolving dynamic dependencies. Defaults to `sync` */
    mode: ContextMode;
    /** Absolute path of the directory to search in */
    from: string;
  }>;
  /** Given a fully qualified require context, return a virtual file path that ensures uniqueness between paths with different contexts. */
  export function deriveAbsolutePathFromContext(
    from: string,
    context: RequireContextParams
  ): string;
  /** Match a file against a require context. */
  export function fileMatchesContext(testPath: string, context: RequireContext): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/contextModuleTemplates.js
declare module 'metro/src/lib/contextModuleTemplates' {
  import type { ContextMode } from 'metro/src/ModuleGraph/worker/collectDependencies';
  /**
   * Generate a context module as a virtual file string.
   *
   * @prop {ContextMode} mode indicates how the modules should be loaded.
   * @prop {string} modulePath virtual file path for the virtual module. Example: `require.context('./src')` -> `'/path/to/project/src'`.
   * @prop {string[]} files list of absolute file paths that must be exported from the context module. Example: `['/path/to/project/src/index.js']`.
   *
   * @returns a string representing a context module (virtual file contents).
   */
  export function getContextModuleTemplate(
    mode: ContextMode,
    modulePath: string,
    files: string[]
  ): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/CountingSet.js
declare module 'metro/src/lib/CountingSet' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/CountingSet.js

  export interface ReadOnlyCountingSet<T> extends Iterable<T> {
    get size(): number;
    has(item: T): boolean;
    [Symbol.iterator](): Iterator<T>; // NOTE(cedric): Flow doesn't like this, and causes failures when converting to TSD
    count(item: T): number;
    forEach<ThisT>(
      callbackFn: (this: ThisT, value: T, key: T, set: ReadOnlyCountingSet<T>) => any,
      // NOTE: Should be optional, but Flow seems happy to infer undefined here
      // which is what we want.
      thisArg: ThisT
    ): void;
  }

  /**
   * A Set that only deletes a given item when the number of delete(item) calls
   * matches the number of add(item) calls. Iteration and `size` are in terms of
   * *unique* items.
   */
  export default class CountingSet<T> implements ReadOnlyCountingSet<T> {
    constructor(items?: Iterable<T>);
    has(item: T): boolean;
    add(item: T): void;
    delete(item: T): void;
    keys(): Iterator<T>;
    values(): Iterator<T>;
    entries(): Iterator<[T, T]>;
    [Symbol.iterator](): Iterator<T>; // NOTE(cedric): Flow doesn't like this, and causes failures when converting to TSD
    get size(): number;
    count(item: T): number;
    clear(): void;
    forEach<ThisT>(
      callbackFn: (this: ThisT, value: T, key: T, set: CountingSet<T>) => any,
      thisArg: ThisT
    ): void;
    /**
     * For Jest purposes. Ideally a custom serializer would be enough, but in
     * practice there is hardcoded magic for Set in toEqual (etc) that we cannot
     * extend to custom collection classes. Instead let's assume values are
     * sortable ( = strings) and make this look like an array with some stable
     * order.
     */
    toJSON(): any;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/countLines.js
declare module 'metro/src/lib/countLines' {
  const countLines: (string: string) => number;
  export default countLines;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/createModuleIdFactory.js
declare module 'metro/src/lib/createModuleIdFactory' {
  function createModuleIdFactory(): (path: string) => number;
  export default createModuleIdFactory;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/createWebsocketServer.js
declare module 'metro/src/lib/createWebsocketServer' {
  import ws from 'ws';
  type WebsocketServiceInterface<T> = {
    readonly onClientConnect: (
      url: string,
      sendFn: (data: string) => void
    ) => Promise<null | undefined | T>;
    readonly onClientDisconnect?: (client: T) => any;
    readonly onClientError?: (client: T, e: ErrorEvent) => any;
    readonly onClientMessage?: (
      client: T,
      message: string | Buffer | ArrayBuffer | Buffer[],
      sendFn: (data: string) => void
    ) => any;
  };
  type HMROptions<TClient> = {
    websocketServer: WebsocketServiceInterface<TClient>;
  };
  /**
   * Returns a WebSocketServer to be attached to an existing HTTP instance. It forwards
   * the received events on the given "websocketServer" parameter. It must be an
   * object with the following fields:
   *
   *   - onClientConnect
   *   - onClientError
   *   - onClientMessage
   *   - onClientDisconnect
   */
  const $$EXPORT_DEFAULT_DECLARATION$$: <TClient extends object>(
    $$PARAM_0$$: HMROptions<TClient>
  ) => ws.Server;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/debounceAsyncQueue.js
declare module 'metro/src/lib/debounceAsyncQueue' {
  function debounceAsyncQueue<T>(fn: () => Promise<T>, delay: number): () => Promise<T>;
  export default debounceAsyncQueue;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/formatBundlingError.js
declare module 'metro/src/lib/formatBundlingError' {
  import type { FormattedError } from 'metro-runtime/src/modules/types.flow';
  export type CustomError = Error & {
    type?: string;
    filename?: string;
    lineNumber?: number;
    errors?: {
      description: string;
      filename: string;
      lineNumber: number;
    }[];
  };
  function formatBundlingError(error: CustomError): FormattedError;
  export default formatBundlingError;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/getAppendScripts.js
declare module 'metro/src/lib/getAppendScripts' {
  import type { Module } from 'metro/src/DeltaBundler';
  type Options<T extends number | string> = Readonly<{
    asyncRequireModulePath: string;
    createModuleId: ($$PARAM_0$$: string) => T;
    getRunModuleStatement: ($$PARAM_0$$: T) => string;
    inlineSourceMap?: null | boolean;
    runBeforeMainModule: readonly string[];
    runModule: boolean;
    shouldAddToIgnoreList: ($$PARAM_0$$: Module) => boolean;
    sourceMapUrl?: null | string;
    sourceUrl?: null | string;
    getSourceUrl?: null | (($$PARAM_0$$: Module) => string);
  }>;
  function getAppendScripts<T extends number | string>(
    entryPoint: string,
    modules: readonly Module[],
    options: Options<T>
  ): readonly Module[];
  export default getAppendScripts;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/getGraphId.js
declare module 'metro/src/lib/getGraphId' {
  import type { TransformInputOptions } from 'metro/src/DeltaBundler/types.flow';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  export type GraphId = string;
  function getGraphId(
    entryFile: string,
    options: TransformInputOptions,
    $$PARAM_2$$: Readonly<{
      shallow: boolean;
      lazy: boolean;
      unstable_allowRequireContext: boolean;
      resolverOptions: ResolverInputOptions;
    }>
  ): GraphId;
  export default getGraphId;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/getMaxWorkers.js
declare module 'metro/src/lib/getMaxWorkers' {
  const $$EXPORT_DEFAULT_DECLARATION$$: (workers: null | undefined | number) => number;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/getPreludeCode.js
declare module 'metro/src/lib/getPreludeCode' {
  function getPreludeCode($$PARAM_0$$: {
    readonly extraVars?: {
      [$$Key$$: string]: any;
    };
    readonly isDev: boolean;
    readonly globalPrefix: string;
    readonly requireCycleIgnorePatterns: readonly RegExp[];
  }): string;
  export default getPreludeCode;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/getPrependedScripts.js
declare module 'metro/src/lib/getPrependedScripts' {
  import type Bundler from 'metro/src/Bundler';
  import type { TransformInputOptions } from 'metro/src/DeltaBundler/types.flow';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import type DeltaBundler from 'metro/src/DeltaBundler';
  import type { Module } from 'metro/src/DeltaBundler';
  function getPrependedScripts(
    config: ConfigT,
    options: Pick<
      TransformInputOptions,
      Exclude<
        keyof TransformInputOptions,
        keyof {
          type: TransformInputOptions['type'];
        }
      >
    >,
    resolverOptions: ResolverInputOptions,
    bundler: Bundler,
    deltaBundler: DeltaBundler
  ): Promise<readonly Module[]>;
  export default getPrependedScripts;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/JsonReporter.js
declare module 'metro/src/lib/JsonReporter' {
  import type { Writable } from 'stream';
  export type SerializedError = {
    message: string;
    stack: string;
    errors?: readonly SerializedError[];
    cause?: SerializedError;
  };
  export type SerializedEvent<
    TEvent extends {
      [$$Key$$: string]: any;
    },
  > = any;
  class JsonReporter<
    TEvent extends {
      [$$Key$$: string]: any;
    },
  > {
    _stream: Writable;
    constructor(stream: Writable);
    update(event: TEvent): void;
  }
  export default JsonReporter;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/logToConsole.js
declare module 'metro/src/lib/logToConsole' {
  import type { Terminal } from 'metro-core';
  const $$EXPORT_DEFAULT_DECLARATION$$: (
    terminal: Terminal,
    level: string,
    mode: 'BRIDGE' | 'NOBRIDGE',
    ...data: unknown[]
  ) => void;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/parseCustomResolverOptions.js
declare module 'metro/src/lib/parseCustomResolverOptions' {
  import type { CustomResolverOptions } from 'metro-resolver/src/types';
  const $$EXPORT_DEFAULT_DECLARATION$$: (urlObj: {
    readonly query?: {
      [$$Key$$: string]: string;
    };
  }) => CustomResolverOptions;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/parseCustomTransformOptions.js
declare module 'metro/src/lib/parseCustomTransformOptions' {
  import type { CustomTransformOptions } from 'metro-transform-worker';
  const $$EXPORT_DEFAULT_DECLARATION$$: (urlObj: {
    readonly query?: {
      [$$Key$$: string]: string;
    };
  }) => CustomTransformOptions;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/parseOptionsFromUrl.js
declare module 'metro/src/lib/parseOptionsFromUrl' {
  import type { BundleOptions } from 'metro/src/shared/types.flow';
  const $$EXPORT_DEFAULT_DECLARATION$$: (
    normalizedRequestUrl: string,
    platforms: Set<string>
  ) => BundleOptions;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/RamBundleParser.js
declare module 'metro/src/lib/RamBundleParser' {
  /**
   * Implementation of a RAM bundle parser in JS.
   *
   * It receives a Buffer as an input and implements two main methods, which are
   * able to run in constant time no matter the size of the bundle:
   *
   * getStartupCode(): returns the runtime and the startup code of the bundle.
   * getModule(): returns the code for the specified module.
   */
  class RamBundleParser {
    _buffer: Buffer;
    _numModules: number;
    _startupCodeLength: number;
    _startOffset: number;
    constructor(buffer: Buffer);
    _readPosition(pos: number): number;
    getStartupCode(): string;
    getModule(id: number): string;
  }
  export default RamBundleParser;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/relativizeSourceMap.js
declare module 'metro/src/lib/relativizeSourceMap' {
  import type { MixedSourceMap } from 'metro-source-map';
  function relativizeSourceMapInline(sourceMap: MixedSourceMap, sourcesRoot: string): void;
  export default relativizeSourceMapInline;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/reporting.js
declare module 'metro/src/lib/reporting' {
  import type { Terminal } from 'metro-core';
  import type { HealthCheckResult, WatcherStatus } from 'metro-file-map';
  import type { CustomResolverOptions } from 'metro-resolver';
  import type { CustomTransformOptions } from 'metro-transform-worker';
  export type BundleDetails = {
    bundleType: string;
    customResolverOptions: CustomResolverOptions;
    customTransformOptions: CustomTransformOptions;
    dev: boolean;
    entryFile: string;
    minify: boolean;
    platform?: null | string;
  };
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
        type: 'initialize_done';
        port: number;
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
        isPrefetch?: boolean;
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
    | {
        type: 'dep_graph_loaded';
      }
    | {
        buildID: string;
        type: 'bundle_transform_progressed';
        transformedFileCount: number;
        totalFileCount: number;
      }
    | {
        type: 'cache_read_error';
        error: Error;
      }
    | {
        type: 'cache_write_error';
        error: Error;
      }
    | {
        type: 'transform_cache_reset';
      }
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
        level?:
          | 'trace'
          | 'info'
          | 'warn'
          | 'log'
          | 'group'
          | 'groupCollapsed'
          | 'groupEnd'
          | 'debug';
        data: any[];
        mode?: 'BRIDGE' | 'NOBRIDGE';
      }
    | {
        type: 'resolver_warning';
        message: string;
      }
    | {
        type: 'server_listening';
        port: number;
        address: string;
        family: string;
      }
    | {
        type: 'transformer_load_started';
      }
    | {
        type: 'transformer_load_done';
      }
    | {
        type: 'transformer_load_failed';
        error: Error;
      }
    | {
        type: 'watcher_health_check_result';
        result: HealthCheckResult;
      }
    | {
        type: 'watcher_status';
        status: WatcherStatus;
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
  export type Reporter = {
    update(event: ReportableEvent): void;
  };
  /**
   * A standard way to log a warning to the terminal. This should not be called
   * from some arbitrary Metro logic, only from the reporters. Instead of
   * calling this, add a new type of ReportableEvent instead, and implement a
   * proper handler in the reporter(s).
   */

  /**
   * Similar to `logWarning`, but for messages that require the user to act.
   */

  /**
   * A reporter that does nothing. Errors and warnings will be swallowed, that
   * is generally not what you want.
   */
  export function logWarning(terminal: Terminal, format: string, ...args: any[]): void;
  export function logError(terminal: Terminal, format: string, ...args: any[]): void;
  export const nullReporter: {
    update(): void;
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/splitBundleOptions.js
declare module 'metro/src/lib/splitBundleOptions' {
  import type { BundleOptions, SplitBundleOptions } from 'metro/src/shared/types.flow';
  /**
   * Splits a BundleOptions object into smaller, more manageable parts.
   */
  function splitBundleOptions(options: BundleOptions): SplitBundleOptions;
  export default splitBundleOptions;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/TerminalReporter.js
declare module 'metro/src/lib/TerminalReporter' {
  import type { BundleDetails, ReportableEvent } from 'metro/src/lib/reporting';
  import type { Terminal } from 'metro-core';
  import type { HealthCheckResult, WatcherStatus } from 'metro-file-map';
  type BundleProgress = {
    bundleDetails: BundleDetails;
    transformedFileCount: number;
    totalFileCount: number;
    ratio: number;
    isPrefetch?: boolean;
  };
  export type TerminalReportableEvent =
    | ReportableEvent
    | {
        buildID: string;
        type: 'bundle_transform_progressed_throttled';
        transformedFileCount: number;
        totalFileCount: number;
      }
    | {
        type: 'unstable_set_interaction_status';
        status?: null | string;
      };
  type BuildPhase = 'in_progress' | 'done' | 'failed';
  // NOTE(cedric): manually corrected, its an internal Flow type
  type ErrnoError = {
    errno: number;
    code: string;
    path: string;
    syscall: string;
  };
  type SnippetError = ErrnoError & {
    filename?: string;
    snippet?: string;
  };
  /**
   * We try to print useful information to the terminal for interactive builds.
   * This implements the `Reporter` interface from the './reporting' module.
   */
  class TerminalReporter {
    _activeBundles: Map<string, BundleProgress>;
    _interactionStatus: null | undefined | string;
    _scheduleUpdateBundleProgress: {
      cancel(): void;
      (data: { buildID: string; transformedFileCount: number; totalFileCount: number }): void;
    };
    _prevHealthCheckResult: null | undefined | HealthCheckResult;
    readonly terminal: Terminal;
    constructor(terminal: Terminal);
    _getBundleStatusMessage($$PARAM_0$$: BundleProgress, phase: BuildPhase): string;
    _logBundleBuildDone(buildID: string): void;
    _logBundleBuildFailed(buildID: string): void;
    _logInitializing(port: number, hasReducedPerformance: boolean): void;
    _logInitializingFailed(port: number, error: SnippetError): void;
    _log(event: TerminalReportableEvent): void;
    _logBundlingError(error: SnippetError): void;
    _logWorkerChunk(origin: 'stdout' | 'stderr', chunk: string): void;
    _updateBundleProgress($$PARAM_0$$: {
      buildID: string;
      transformedFileCount: number;
      totalFileCount: number;
    }): void;
    _updateState(event: TerminalReportableEvent): void;
    _getStatusMessage(): string;
    _logHmrClientError(e: Error): void;
    _logWarning(message: string): void;
    _logWatcherHealthCheckResult(result: HealthCheckResult): void;
    _logWatcherStatus(status: WatcherStatus): void;
    update(event: TerminalReportableEvent): void;
  }
  export default TerminalReporter;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/lib/transformHelpers.js
declare module 'metro/src/lib/transformHelpers' {
  import type Bundler from 'metro/src/Bundler';
  import type {
    BundlerResolution,
    TransformInputOptions,
    TransformResultDependency,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import type DeltaBundler from 'metro/src/DeltaBundler';
  import type { TransformFn } from 'metro/src/DeltaBundler';
  export function getTransformFn(
    entryFiles: readonly string[],
    bundler: Bundler,
    deltaBundler: DeltaBundler,
    config: ConfigT,
    options: TransformInputOptions,
    resolverOptions: ResolverInputOptions
  ): Promise<TransformFn>;
  export function getResolveDependencyFn(
    bundler: Bundler,
    platform: null | undefined | string,
    resolverOptions: ResolverInputOptions
  ): Promise<(from: string, dependency: TransformResultDependency) => BundlerResolution>;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/ModuleGraph/worker/collectDependencies.js
declare module 'metro/src/ModuleGraph/worker/collectDependencies' {
  import type { NodePath } from '@babel/traverse';
  import type {
    CallExpression,
    File,
    Identifier,
    StringLiteral,
    SourceLocation,
  } from '@babel/types';
  import type {
    AllowOptionalDependencies,
    AsyncDependencyType,
  } from 'metro/src/DeltaBundler/types.flow';
  export type Dependency = Readonly<{
    data: DependencyData;
    name: string;
  }>;
  export type ContextMode = 'sync' | 'eager' | 'lazy' | 'lazy-once';
  type ContextFilter = Readonly<{
    pattern: string;
    flags: string;
  }>;
  export type RequireContextParams = Readonly<{
    recursive: boolean;
    filter: Readonly<ContextFilter>;
    mode: ContextMode;
  }>;
  type DependencyData = Readonly<{
    key: string;
    asyncType?: AsyncDependencyType | null;
    isOptional?: boolean;
    locs: readonly SourceLocation[];
    contextParams?: RequireContextParams;
  }>;
  export type MutableInternalDependency = {
    locs: SourceLocation[];
    index: number;
    name: string;
  } & DependencyData;
  export type InternalDependency = Readonly<MutableInternalDependency>;
  export type State = {
    asyncRequireModulePathStringLiteral?: null | StringLiteral;
    dependencyCalls: Set<string>;
    dependencyRegistry: DependencyRegistry;
    dependencyTransformer: DependencyTransformer;
    dynamicRequires: DynamicRequiresBehavior;
    dependencyMapIdentifier?: null | Identifier;
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    unstable_allowRequireContext: boolean;
  };
  export type Options = Readonly<{
    asyncRequireModulePath: string;
    dependencyMapName?: null | string;
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer?: DependencyTransformer;
    unstable_allowRequireContext: boolean;
  }>;
  export type CollectedDependencies = Readonly<{
    ast: File;
    dependencyMapName: string;
    dependencies: readonly Dependency[];
  }>;
  export interface DependencyTransformer {
    transformSyncRequire(
      path: NodePath<CallExpression>,
      dependency: InternalDependency,
      state: State
    ): void;
    transformImportCall(path: NodePath, dependency: InternalDependency, state: State): void;
    transformImportMaybeSyncCall(
      path: NodePath,
      dependency: InternalDependency,
      state: State
    ): void;
    transformPrefetch(path: NodePath, dependency: InternalDependency, state: State): void;
    transformIllegalDynamicRequire(path: NodePath, state: State): void;
  }
  export type DynamicRequiresBehavior = 'throwAtRuntime' | 'reject';
  function collectDependencies(ast: File, options: Options): CollectedDependencies;
  export type ImportQualifier = Readonly<{
    name: string;
    asyncType?: AsyncDependencyType | null;
    optional: boolean;
    contextParams?: RequireContextParams;
  }>;
  class DependencyRegistry {
    _dependencies: Map<string, InternalDependency>;
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
  }
  export default collectDependencies;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/ModuleGraph/worker/generateImportNames.js
declare module 'metro/src/ModuleGraph/worker/generateImportNames' {
  import type * as _babel_types from '@babel/types';
  /**
   * Select unused names for "metroImportDefault" and "metroImportAll", by
   * calling "generateUid".
   */
  function generateImportNames(ast: _babel_types.Node): {
    importAll: string;
    importDefault: string;
  };
  export default generateImportNames;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/ModuleGraph/worker/JsFileWrapping.js
declare module 'metro/src/ModuleGraph/worker/JsFileWrapping' {
  import type * as _babel_types from '@babel/types';
  export const WRAP_NAME: '$$_REQUIRE';
  export function wrapJson(source: string, globalPrefix: string): string;
  export function jsonToCommonJS(source: string): string;
  export function wrapModule(
    fileAst: _babel_types.File,
    importDefaultName: string,
    importAllName: string,
    dependencyMapName: string,
    globalPrefix: string,
    skipRequireRename: boolean
  ): {
    ast: _babel_types.File;
    requireName: string;
  };
  export function wrapPolyfill(fileAst: _babel_types.File): _babel_types.File;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/DependencyGraph.js
declare module 'metro/src/node-haste/DependencyGraph' {
  import type {
    BundlerResolution,
    TransformResultDependency,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  import type Package from 'metro/src/node-haste/Package';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import { ModuleResolver } from 'metro/src/node-haste/DependencyGraph/ModuleResolution';
  import ModuleCache from 'metro/src/node-haste/ModuleCache';
  import { EventEmitter } from 'events';
  import type MetroFileMap from 'metro-file-map';
  import type {
    ChangeEvent,
    FileSystem,
    HasteMap,
    HealthCheckResult,
    WatcherStatus,
  } from 'metro-file-map';
  class DependencyGraph extends EventEmitter {
    _config: ConfigT;
    _haste: MetroFileMap;
    _fileSystem: FileSystem;
    _moduleCache: ModuleCache;
    _hasteMap: HasteMap;
    _moduleResolver: ModuleResolver<Package>;
    _resolutionCache: Map<
      string | symbol,
      Map<string | symbol, Map<string | symbol, Map<string | symbol, BundlerResolution>>>
    >;
    _readyPromise: Promise<void>;
    constructor(
      config: ConfigT,
      options?: {
        readonly hasReducedPerformance?: boolean;
        readonly watch?: boolean;
      }
    );
    _onWatcherHealthCheck(result: HealthCheckResult): void;
    _onWatcherStatus(status: WatcherStatus): void;
    ready(): Promise<void>;
    static load(
      config: ConfigT,
      options?: {
        readonly hasReducedPerformance?: boolean;
        readonly watch?: boolean;
      }
    ): Promise<DependencyGraph>;
    _onHasteChange($$PARAM_0$$: ChangeEvent): void;
    _createModuleResolver(): void;
    _getClosestPackage(absoluteModulePath: string):
      | null
      | undefined
      | {
          packageJsonPath: string;
          packageRelativePath: string;
        };
    _createModuleCache(): ModuleCache;
    getAllFiles(): string[];
    getSha1(filename: string): string;
    getWatcher(): EventEmitter;
    end(): void;
    matchFilesWithContext(
      from: string,
      context: Readonly<{
        recursive: boolean;
        filter: RegExp;
      }>
    ): Iterable<string>;
    resolveDependency(
      from: string,
      dependency: TransformResultDependency,
      platform: string | null,
      resolverOptions: ResolverInputOptions,
      $$PARAM_4$$: {
        assumeFlatNodeModules: boolean;
      }
    ): BundlerResolution;
    _doesFileExist: any;
    getHasteName(filePath: string): string;
    getDependencies(filePath: string): string[];
  }
  export default DependencyGraph;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/DependencyGraph/createFileMap.js
declare module 'metro/src/node-haste/DependencyGraph/createFileMap' {
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  import MetroFileMap from 'metro-file-map';
  function createFileMap(
    config: ConfigT,
    options?: Readonly<{
      extractDependencies?: boolean;
      watch?: boolean;
      throwOnModuleCollision?: boolean;
      cacheFilePrefix?: string;
    }>
  ): MetroFileMap;
  export default createFileMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/DependencyGraph/ModuleResolution.js
declare module 'metro/src/node-haste/DependencyGraph/ModuleResolution' {
  import type {
    BundlerResolution,
    TransformResultDependency,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { Reporter } from 'metro/src/lib/reporting';
  import type { ResolverInputOptions } from 'metro/src/shared/types.flow';
  import type {
    CustomResolver,
    DoesFileExist,
    FileCandidates,
    FileSystemLookup,
    Resolution,
    ResolveAsset,
  } from 'metro-resolver';
  import type { PackageJson } from 'metro-resolver/src/types';
  export type DirExistsFn = (filePath: string) => boolean;
  export type Packageish = {
    path: string;
    read(): PackageJson;
  };
  export type Moduleish = {
    readonly path: string;
    getPackage(): null | undefined | Packageish;
  };
  export type ModuleishCache<TPackage> = {
    getPackage(name: string, platform?: string, supportsNativePlatform?: boolean): TPackage;
    getPackageOf(absolutePath: string):
      | null
      | undefined
      | {
          pkg: TPackage;
          packageRelativePath: string;
        };
  };
  type Options<TPackage> = Readonly<{
    assetExts: ReadonlySet<string>;
    dirExists: DirExistsFn;
    disableHierarchicalLookup: boolean;
    doesFileExist: DoesFileExist;
    emptyModulePath: string;
    extraNodeModules?: null | object;
    getHasteModulePath: (
      name: string,
      platform: null | undefined | string
    ) => null | undefined | string;
    getHastePackagePath: (
      name: string,
      platform: null | undefined | string
    ) => null | undefined | string;
    mainFields: readonly string[];
    moduleCache: ModuleishCache<TPackage>;
    nodeModulesPaths: readonly string[];
    preferNativePlatform: boolean;
    projectRoot: string;
    reporter: Reporter;
    resolveAsset: ResolveAsset;
    resolveRequest?: null | CustomResolver;
    sourceExts: readonly string[];
    unstable_conditionNames: readonly string[];
    unstable_conditionsByPlatform: Readonly<{
      [platform: string]: readonly string[];
    }>;
    unstable_enablePackageExports: boolean;
    unstable_fileSystemLookup?: null | FileSystemLookup;
  }>;
  export class ModuleResolver<TPackage extends Packageish> {
    _options: Options<TPackage>;
    _projectRootFakeModule: Moduleish;
    _cachedEmptyModule: null | undefined | BundlerResolution;
    constructor(options: Options<TPackage>);
    _getEmptyModule(): BundlerResolution;
    resolveDependency(
      fromModule: Moduleish,
      dependency: TransformResultDependency,
      allowHaste: boolean,
      platform: string | null,
      resolverOptions: ResolverInputOptions
    ): BundlerResolution;
    _getPackage: any;
    _getPackageForModule: any;
    _getFileResolvedModule(resolution: Resolution): BundlerResolution;
    _logWarning: any;
    _removeRoot(candidates: FileCandidates): FileCandidates;
  }
  export class UnableToResolveError extends Error {
    originModulePath: string;
    targetModuleName: string;
    cause: null | undefined | Error;
    constructor(
      originModulePath: string,
      targetModuleName: string,
      message: string,
      options?: Readonly<{
        dependency?: null | undefined | TransformResultDependency;
        cause?: Error;
      }>
    );
    buildCodeFrameMessage(
      dependency: null | undefined | TransformResultDependency
    ): null | undefined | string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/lib/AssetPaths.js
declare module 'metro/src/node-haste/lib/AssetPaths' {
  export type AssetPath = {
    assetName: string;
    name: string;
    platform?: null | string;
    resolution: number;
    type: string;
  };
  /**
   * Return `null` if the `filePath` doesn't have a valid extension, required
   * to describe the type of an asset.
   */
  export function parse(filePath: string, platforms: ReadonlySet<string>): AssetPath;
  export function tryParse(
    filePath: string,
    platforms: ReadonlySet<string>
  ): null | undefined | AssetPath;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/lib/parsePlatformFilePath.js
declare module 'metro/src/node-haste/lib/parsePlatformFilePath' {
  type PlatformFilePathParts = {
    dirPath: string;
    baseName: string;
    platform?: null | string;
    extension?: null | string;
  };
  /**
   * Extract the components of a file path that can have a platform specifier: Ex.
   * `index.ios.js` is specific to the `ios` platform and has the extension `js`.
   */
  function parsePlatformFilePath(
    filePath: string,
    platforms: ReadonlySet<string>
  ): PlatformFilePathParts;
  export default parsePlatformFilePath;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/Module.js
declare module 'metro/src/node-haste/Module' {
  import type ModuleCache from 'metro/src/node-haste/ModuleCache';
  import type Package from 'metro/src/node-haste/Package';
  class Module {
    path: string;
    _moduleCache: ModuleCache;
    _sourceCode: null | undefined | string;
    constructor(file: string, moduleCache: ModuleCache);
    getPackage(): null | undefined | Package;
    invalidate(): void;
  }
  export default Module;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/ModuleCache.js
declare module 'metro/src/node-haste/ModuleCache' {
  import Module from 'metro/src/node-haste/Module';
  import Package from 'metro/src/node-haste/Package';
  type GetClosestPackageFn = (absoluteFilePath: string) =>
    | null
    | undefined
    | {
        packageJsonPath: string;
        packageRelativePath: string;
      };
  class ModuleCache {
    _getClosestPackage: GetClosestPackageFn;
    _moduleCache: {
      [filePath: string]: Module;
    };
    _packageCache: {
      [filePath: string]: Package;
    };
    _packagePathAndSubpathByModulePath: {
      [filePath: string]:
        | null
        | undefined
        | {
            packageJsonPath: string;
            packageRelativePath: string;
          };
    };
    _modulePathsByPackagePath: {
      [filePath: string]: Set<string>;
    };
    constructor(options: { getClosestPackage: GetClosestPackageFn });
    getModule(filePath: string): Module;
    getPackage(filePath: string): Package;
    getPackageForModule(module: Module):
      | null
      | undefined
      | {
          pkg: Package;
          packageRelativePath: string;
        };
    getPackageOf(absoluteModulePath: string):
      | null
      | undefined
      | {
          pkg: Package;
          packageRelativePath: string;
        };
    invalidate(filePath: string): void;
  }
  export default ModuleCache;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/node-haste/Package.js
declare module 'metro/src/node-haste/Package' {
  import type { PackageJson } from 'metro-resolver/src/types';
  class Package {
    path: string;
    _root: string;
    _content: null | undefined | PackageJson;
    constructor($$PARAM_0$$: { file: string });
    invalidate(): void;
    read(): PackageJson;
  }
  export default Package;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Server.js
declare module 'metro/src/Server' {
  import type { AssetData } from 'metro/src/Assets';
  import type { ExplodedSourceMap } from 'metro/src/DeltaBundler/Serializers/getExplodedSourceMap';
  import type { RamBundleInfo } from 'metro/src/DeltaBundler/Serializers/getRamBundleInfo';
  import type {
    Module,
    ReadOnlyGraph,
    TransformInputOptions,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { RevisionId } from 'metro/src/IncrementalBundler';
  import type { GraphId } from 'metro/src/lib/getGraphId';
  import type { Reporter } from 'metro/src/lib/reporting';
  import type {
    BundleOptions,
    GraphOptions,
    ResolverInputOptions,
    SplitBundleOptions,
  } from 'metro/src/shared/types.flow';
  import type { IncomingMessage } from 'connect';
  import type { ServerResponse } from 'http';
  import type { ConfigT, RootPerfLogger } from 'metro-config/src/configTypes.flow';
  import type { ActionLogEntryData, ActionStartLogEntry, LogEntry } from 'metro-core/src/Logger';
  import type { CustomResolverOptions } from 'metro-resolver/src/types';
  import type { CustomTransformOptions } from 'metro-transform-worker';
  import { SourcePathsMode } from 'metro/src/shared/types.flow';
  import IncrementalBundler from 'metro/src/IncrementalBundler';
  import MultipartResponse from 'metro/src/Server/MultipartResponse';
  import { Logger } from 'metro-core';
  export type SegmentLoadData = {
    [$$Key$$: number]: [number[], null | undefined | number];
  };
  export type BundleMetadata = {
    hash: string;
    otaBuildNumber?: null | string;
    mobileConfigs: string[];
    segmentHashes: string[];
    segmentLoadData: SegmentLoadData;
  };
  type ProcessStartContext = {
    readonly buildNumber: number;
    readonly bundleOptions: BundleOptions;
    readonly graphId: GraphId;
    readonly graphOptions: GraphOptions;
    readonly mres?: MultipartResponse | ServerResponse;
    readonly req: IncomingMessage;
    readonly revisionId?: null | undefined | RevisionId;
    readonly bundlePerfLogger: RootPerfLogger;
    readonly requestStartTimestamp: number;
  } & SplitBundleOptions;
  type ProcessDeleteContext = {
    readonly graphId: GraphId;
    readonly req: IncomingMessage;
    readonly res: ServerResponse;
  };
  type ProcessEndContext<T> = {
    readonly result: T;
  } & ProcessStartContext;
  export type ServerOptions = Readonly<{
    hasReducedPerformance?: boolean;
    onBundleBuilt?: (bundlePath: string) => void;
    watch?: boolean;
  }>;
  class Server {
    _bundler: IncrementalBundler;
    _config: ConfigT;
    _createModuleId: (path: string) => number;
    _isEnded: boolean;
    _logger: typeof Logger;
    _nextBundleBuildNumber: number;
    _platforms: Set<string>;
    _reporter: Reporter;
    _serverOptions: ServerOptions | void;
    _allowedSuffixesForSourceRequests: readonly string[];
    _sourceRequestRoutingMap: readonly [any, any][];
    constructor(config: ConfigT, options?: ServerOptions);
    end(): void;
    getBundler(): IncrementalBundler;
    getCreateModuleId(): (path: string) => number;
    build(options: BundleOptions): Promise<{
      code: string;
      map: string;
    }>;
    getRamBundleInfo(options: BundleOptions): Promise<RamBundleInfo>;
    getAssets(options: BundleOptions): Promise<readonly AssetData[]>;
    getOrderedDependencyPaths(options: {
      readonly dev: boolean;
      readonly entryFile: string;
      readonly minify: boolean;
      readonly platform?: null | string;
    }): Promise<string[]>;
    _rangeRequestMiddleware(
      req: IncomingMessage,
      res: ServerResponse,
      data: string | Buffer,
      assetPath: string
    ): Buffer | string;
    _processSingleAssetRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
    processRequest: (
      $$PARAM_0$$: IncomingMessage,
      $$PARAM_1$$: ServerResponse,
      $$PARAM_2$$: (e: null | undefined | Error) => void
    ) => void;
    _parseOptions(url: string): BundleOptions;
    _rewriteAndNormalizeUrl(requestUrl: string): string;
    _processRequest(
      req: IncomingMessage,
      res: ServerResponse,
      next: ($$PARAM_0$$: null | undefined | Error) => void
    ): void;
    _processSourceRequest(
      relativePathname: string,
      rootDir: string,
      res: ServerResponse
    ): Promise<void>;
    _createRequestProcessor<T>($$PARAM_0$$: {
      readonly createStartEntry: (context: ProcessStartContext) => ActionLogEntryData;
      readonly createEndEntry: (
        context: ProcessEndContext<T>
      ) => Pick<ActionStartLogEntry, Exclude<keyof ActionStartLogEntry, keyof LogEntry>>;
      readonly build: (context: ProcessStartContext) => Promise<T>;
      readonly delete?: (context: ProcessDeleteContext) => Promise<void>;
      readonly finish: (context: ProcessEndContext<T>) => void;
    }): (
      req: IncomingMessage,
      res: ServerResponse,
      bundleOptions: BundleOptions,
      buildContext: Readonly<{
        buildNumber: number;
        bundlePerfLogger: RootPerfLogger;
      }>
    ) => Promise<void>;
    _processBundleRequest: (
      req: IncomingMessage,
      res: ServerResponse,
      bundleOptions: BundleOptions,
      buildContext: Readonly<{
        buildNumber: number;
        bundlePerfLogger: RootPerfLogger;
      }>
    ) => Promise<void>;
    _getSortedModules(graph: ReadOnlyGraph): readonly Module[];
    _processSourceMapRequest: (
      req: IncomingMessage,
      res: ServerResponse,
      bundleOptions: BundleOptions,
      buildContext: Readonly<{
        buildNumber: number;
        bundlePerfLogger: RootPerfLogger;
      }>
    ) => Promise<void>;
    _processAssetsRequest: (
      req: IncomingMessage,
      res: ServerResponse,
      bundleOptions: BundleOptions,
      buildContext: Readonly<{
        buildNumber: number;
        bundlePerfLogger: RootPerfLogger;
      }>
    ) => Promise<void>;
    _symbolicate(req: IncomingMessage, res: ServerResponse): void;
    _explodedSourceMapForBundleOptions(bundleOptions: BundleOptions): Promise<ExplodedSourceMap>;
    _resolveRelativePath(
      filePath: string,
      $$PARAM_1$$: Readonly<{
        relativeTo?: 'project' | 'server';
        resolverOptions: ResolverInputOptions;
        transformOptions: TransformInputOptions;
      }>
    ): Promise<string>;
    getNewBuildNumber(): number;
    getPlatforms(): readonly string[];
    getWatchFolders(): readonly string[];
    static DEFAULT_GRAPH_OPTIONS: Readonly<{
      customResolverOptions: CustomResolverOptions;
      customTransformOptions: CustomTransformOptions;
      dev: boolean;
      hot: boolean;
      minify: boolean;
      unstable_transformProfile: 'default';
    }>;
    static DEFAULT_BUNDLE_OPTIONS: {
      excludeSource: false;
      inlineSourceMap: false;
      lazy: false;
      modulesOnly: false;
      onProgress: null;
      runModule: true;
      shallow: false;
      sourceMapUrl: null;
      sourceUrl: null;
      sourcePaths: SourcePathsMode.Absolute;
    } & typeof Server.DEFAULT_GRAPH_OPTIONS;
    _getServerRootDir(): string;
    _getEntryPointAbsolutePath(entryFile: string): string;
    ready(): Promise<void>;
    _shouldAddModuleToIgnoreList(module: Module): boolean;
    _getModuleSourceUrl(module: Module, mode: SourcePathsMode): string;
  }
  export default Server;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Server/MultipartResponse.js
declare module 'metro/src/Server/MultipartResponse' {
  import type { IncomingMessage, ServerResponse } from 'http';
  type Data = string | Buffer | Uint8Array;
  type Headers = {
    [$$Key$$: string]: string | number;
  };
  class MultipartResponse {
    static wrapIfSupported(
      req: IncomingMessage,
      res: ServerResponse
    ): MultipartResponse | ServerResponse;
    static serializeHeaders(headers: Headers): string;
    res: ServerResponse;
    headers: Headers;
    constructor(res: ServerResponse);
    writeChunk(headers: Headers | null, data?: Data, isLast?: boolean): void;
    writeHead(status: number, headers?: Headers): void;
    setHeader(name: string, value: string | number): void;
    end(data?: Data): void;
    once(name: string, fn: () => any): this;
  }
  export default MultipartResponse;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/Server/symbolicate.js
declare module 'metro/src/Server/symbolicate' {
  import type { ExplodedSourceMap } from 'metro/src/DeltaBundler/Serializers/getExplodedSourceMap';
  import type { ConfigT } from 'metro-config/src/configTypes.flow';
  export type StackFrameInput = {
    readonly file?: null | string;
    readonly lineNumber?: null | number;
    readonly column?: null | number;
    readonly methodName?: null | string;
  };
  export type IntermediateStackFrame = {
    collapse?: boolean;
  } & StackFrameInput;
  export type StackFrameOutput = Readonly<{} & IntermediateStackFrame>;
  function symbolicate(
    stack: readonly StackFrameInput[],
    maps: Iterable<[string, ExplodedSourceMap]>,
    config: ConfigT,
    extraData: any
  ): Promise<readonly StackFrameOutput[]>;
  export default symbolicate;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/bundle.js
declare module 'metro/src/shared/output/bundle' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/bundle.js

  // NOTE(cedric): Metro uses this weird Flow syntax /*:: */ to override the exported types...
  export * from 'metro/src/shared/output/bundle.flow';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/bundle.flow.js
declare module 'metro/src/shared/output/bundle.flow' {
  import type { OutputOptions, RequestOptions } from 'metro/src/shared/types.flow';
  import Server from 'metro/src/Server';
  export function build(packagerClient: Server, requestOptions: RequestOptions): void;
  export function save(
    bundle: {
      code: string;
      map: string;
    },
    options: OutputOptions,
    log: (...args: string[]) => void
  ): void;
  export const formatName: 'bundle';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/meta.js
declare module 'metro/src/shared/output/meta' {
  const $$EXPORT_DEFAULT_DECLARATION$$: (
    code: Buffer | string,
    encoding: 'ascii' | 'utf16le' | 'utf8'
  ) => Buffer;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle.js
declare module 'metro/src/shared/output/RamBundle' {
  import type { RamBundleInfo } from 'metro/src/DeltaBundler/Serializers/getRamBundleInfo';
  import type { OutputOptions, RequestOptions } from 'metro/src/shared/types.flow';
  import Server from 'metro/src/Server';
  export function build(packagerClient: Server, requestOptions: RequestOptions): void;
  export function save(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (x: string) => void
  ): void;
  export const formatName: 'bundle';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/as-assets.js
declare module 'metro/src/shared/output/RamBundle/as-assets' {
  import type { RamBundleInfo } from 'metro/src/DeltaBundler/Serializers/getRamBundleInfo';
  import type { OutputOptions } from 'metro/src/shared/types.flow';
  /**
   * Saves all JS modules of an app as single files
   * The startup code (prelude, polyfills etc.) are written to the file
   * designated by the `bundleOuput` option.
   * All other modules go into a 'js-modules' folder that in the same parent
   * directory as the startup file.
   */
  function saveAsAssets(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (...args: string[]) => void
  ): Promise<any>;
  export default saveAsAssets;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/as-indexed-file.js
declare module 'metro/src/shared/output/RamBundle/as-indexed-file' {
  import type { RamBundleInfo } from 'metro/src/DeltaBundler/Serializers/getRamBundleInfo';
  import type {
    ModuleGroups,
    ModuleTransportLike,
    OutputOptions,
  } from 'metro/src/shared/types.flow';
  export function save(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (...args: string[]) => void
  ): void;
  export function buildTableAndContents(
    startupCode: string,
    modules: readonly ModuleTransportLike[],
    moduleGroups: ModuleGroups,
    encoding?: 'utf8' | 'utf16le' | 'ascii'
  ): void;
  export function createModuleGroups(
    groups: Map<number, Set<number>>,
    modules: readonly ModuleTransportLike[]
  ): void;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/buildSourcemapWithMetadata.js
declare module 'metro/src/shared/output/RamBundle/buildSourcemapWithMetadata' {
  import type { ModuleGroups, ModuleTransportLike } from 'metro/src/shared/types.flow';
  import type { IndexMap } from 'metro-source-map';
  type Params = {
    fixWrapperOffset: boolean;
    lazyModules: readonly ModuleTransportLike[];
    moduleGroups?: null | ModuleGroups;
    startupModules: readonly ModuleTransportLike[];
  };
  const $$EXPORT_DEFAULT_DECLARATION$$: ($$PARAM_0$$: Params) => IndexMap;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/magic-number.js
declare module 'metro/src/shared/output/RamBundle/magic-number' {
  const $$EXPORT_DEFAULT_DECLARATION$$: 0xfb0bd1e5;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/util.js
declare module 'metro/src/shared/output/RamBundle/util' {
  import type { ModuleGroups, ModuleTransportLike } from 'metro/src/shared/types.flow';
  import type { BasicSourceMap, IndexMap } from 'metro-source-map';
  type CombineOptions = {
    fixWrapperOffset: boolean;
  };
  export function combineSourceMaps(
    modules: readonly ModuleTransportLike[],
    moduleGroups?: ModuleGroups,
    options?: null | undefined | CombineOptions
  ): IndexMap;
  export function combineSourceMapsAddingOffsets(
    modules: readonly ModuleTransportLike[],
    x_metro_module_paths: string[],
    moduleGroups?: null | undefined | ModuleGroups,
    options?: null | undefined | CombineOptions
  ): IndexMap;
  export { default as countLines } from 'metro/src/lib/countLines';
  export const joinModules: (
    modules: readonly {
      readonly code: string;
    }[]
  ) => string;
  export function lineToLineSourceMap(source: string, filename?: string): BasicSourceMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/RamBundle/write-sourcemap.js
declare module 'metro/src/shared/output/RamBundle/write-sourcemap' {
  function writeSourcemap(
    fileName: string,
    contents: string,
    log: (...args: string[]) => void
  ): Promise<any>;
  export default writeSourcemap;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/unbundle.js
declare module 'metro/src/shared/output/unbundle' {
  export { default } from 'metro/src/shared/output/RamBundle';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/output/writeFile.js
declare module 'metro/src/shared/output/writeFile' {
  type WriteFn = (
    file: string,
    data: string | Buffer,
    encoding?: null | undefined | string
  ) => Promise<any>;
  const writeFile: WriteFn;
  export default writeFile;
}

// NOTE(cedric): this is a manual change, to avoid having to import `../types.flow`
declare module 'metro/src/shared/types' {
  export * from 'metro/src/shared/types.flow';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro/src/shared/types.flow.js
declare module 'metro/src/shared/types.flow' {
  import type {
    Options as DeltaBundlerOptions,
    TransformInputOptions,
  } from 'metro/src/DeltaBundler/types.flow';
  import type { TransformProfile } from 'metro-babel-transformer';
  import type { CustomResolverOptions } from 'metro-resolver';
  import type { MetroSourceMapSegmentTuple, MixedSourceMap } from 'metro-source-map';
  import type { CustomTransformOptions, MinifierOptions } from 'metro-transform-worker';
  type BundleType = 'bundle' | 'delta' | 'meta' | 'map' | 'ram' | 'cli' | 'hmr' | 'todo' | 'graph';
  type MetroSourceMapOrMappings = MixedSourceMap | MetroSourceMapSegmentTuple[];
  export enum SourcePathsMode {
    Absolute = 'absolute',
    ServerUrl = 'url-server',
  }
  export namespace SourcePathsMode {
    export function cast(value: string | null | undefined): SourcePathsMode;
    export function isValid(value: string | null | undefined): value is SourcePathsMode;
    export function members(): IterableIterator<SourcePathsMode>;
    export function getName(value: SourcePathsMode): string;
  }
  export type BundleOptions = {
    bundleType: BundleType;
    readonly customResolverOptions: CustomResolverOptions;
    customTransformOptions: CustomTransformOptions;
    dev: boolean;
    entryFile: string;
    readonly excludeSource: boolean;
    readonly hot: boolean;
    readonly inlineSourceMap: boolean;
    readonly lazy: boolean;
    minify: boolean;
    readonly modulesOnly: boolean;
    onProgress?: null | ((doneCont: number, totalCount: number) => any);
    readonly platform?: null | string;
    readonly runModule: boolean;
    readonly shallow: boolean;
    sourceMapUrl?: null | string;
    sourceUrl?: null | string;
    createModuleIdFactory?: () => (path: string) => number;
    readonly unstable_transformProfile: TransformProfile;
    readonly sourcePaths: SourcePathsMode;
  };
  export type ResolverInputOptions = Readonly<{
    customResolverOptions?: CustomResolverOptions;
    dev: boolean;
  }>;
  export type SerializerOptions = {
    readonly sourceMapUrl?: null | string;
    readonly sourceUrl?: null | string;
    readonly runModule: boolean;
    readonly excludeSource: boolean;
    readonly inlineSourceMap: boolean;
    readonly modulesOnly: boolean;
    readonly sourcePaths: SourcePathsMode;
  };
  export type GraphOptions = {
    readonly lazy: boolean;
    readonly shallow: boolean;
  };
  export type SplitBundleOptions = {
    readonly entryFile: string;
    readonly resolverOptions: ResolverInputOptions;
    readonly transformOptions: TransformInputOptions;
    readonly serializerOptions: SerializerOptions;
    readonly graphOptions: GraphOptions;
    readonly onProgress: DeltaBundlerOptions['onProgress'];
  };
  export type ModuleGroups = {
    groups: Map<number, Set<number>>;
    modulesById: Map<number, ModuleTransportLike>;
    modulesInGroups: Set<number>;
  };
  export type ModuleTransportLike = {
    readonly code: string;
    readonly id: number;
    readonly map?: null | MetroSourceMapOrMappings;
    readonly name?: string;
    readonly sourcePath: string;
  };
  export type ModuleTransportLikeStrict = {
    readonly code: string;
    readonly id: number;
    readonly map?: null | MetroSourceMapOrMappings;
    readonly name?: string;
    readonly sourcePath: string;
  };
  export type RamModuleTransport = {
    readonly source: string;
    readonly type: string;
  } & ModuleTransportLikeStrict;
  export type OutputOptions = {
    bundleOutput: string;
    bundleEncoding?: 'utf8' | 'utf16le' | 'ascii';
    dev?: boolean;
    indexedRamBundle?: boolean;
    platform: string;
    sourcemapOutput?: string;
    sourcemapSourcesRoot?: string;
    sourcemapUseAbsolutePath?: boolean;
  };
  export type RequestOptions = {
    entryFile: string;
    inlineSourceMap?: boolean;
    sourceMapUrl?: string;
    dev?: boolean;
    minify: boolean;
    platform: string;
    createModuleIdFactory?: () => (path: string) => number;
    onProgress?: (transformedFileCount: number, totalFileCount: number) => void;
    readonly customResolverOptions?: CustomResolverOptions;
    readonly customTransformOptions?: CustomTransformOptions;
  };
  export type { MinifierOptions };
}
