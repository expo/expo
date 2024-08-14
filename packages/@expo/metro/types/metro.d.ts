// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Assets.js
declare module '@expo/metro/metro/Assets' {
  // NOTE(cedric): this is a typo, the types are defined under `metro/src/Asset.d.ts`
  import type { AssetData } from 'metro/src/Asset';

  export type { AssetData, AssetDataWithoutFiles } from 'metro/src/Asset';

  export type AssetInfo = {
    files: string[];
    hash: string;
    name: string;
    scales: number[];
    type: string;
  };

  export type AssetDataFiltered = {
    __packager_asset: boolean;
    hash: string;
    height?: number | null; // ?number
    httpServerLocation: string;
    name: string;
    scales: number[];
    type: string;
    width: number | null; // ?number
    [key: string]: any; // ...
  };

  export type AssetDataPlugin = (assetData: AssetData) => AssetData | Promise<AssetData>;

  /**
   * Return a buffer with the actual image given a request for an image by path.
   * The relativePath can contain a resolution postfix, in this case we need to
   * find that image (or the closest one to it's resolution) in one of the
   * project roots:
   *
   * 1. We first parse the directory of the asset
   * 2. We then build a map of all assets and their scales in this directory
   * 3. Then try to pick platform-specific asset records
   * 4. Then pick the closest resolution (rounding up) to the requested one
   */
  export function getAsset(
    relativePath: string,
    projectRoot: string,
    watchFolders: readonly string[],
    platform: string | null | undefined, // ?string
    assetExts: readonly string[]
  ): Promise<Buffer>;

  export function getAssetSize(
    type: string,
    content: Buffer,
    filePath: string
  ):
    | {
        width: number;
        height: number;
      }
    | null
    | undefined; // ?{ width: number; height: number }

  export function getAssetData(
    assetPath: string,
    localPath: string,
    assetDataPlugins: readonly string[],
    platform: string | null | undefined, // ?string
    publicPath: string
  ): Promise<AssetData>;

  /** Returns all the associated files (for different resolutions) of an asset. */
  export function getAssetFiles(
    assetPath: string,
    platform?: string | null // ?string
  ): Promise<string[]>;

  /**
   * Test extension against all types supported by image-size module.
   * If it's not one of these, we won't treat it as an image.
   */
  export function isAssetTypeAnImage(type: string): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/HmrServer.js
declare module '@expo/metro/metro/HmrServer' {
  // TODO: double-check
  import {
    type default as IncrementalBundler,
    type RevisionId,
  } from '@expo/metro/metro/IncrementalBundler';
  import type { GraphOptions } from '@expo/metro/metro/shared/types';
  import type { ConfigT, RootPerfLogger } from '@expo/metro/metro-config';
  import type {
    HmrErrorMessage,
    HmrUpdateMessage,
  } from '@expo/metro/metro-runtime/modules/types.flow';
  import type { UrlWithParsedQuery } from 'node:url';

  export type EntryPointURL = UrlWithParsedQuery;

  type SendMessageFunction = (data: string) => void;

  export type Client = {
    optedIntoHMR: boolean;
    revisionIds: RevisionId[];
    sendFn: SendMessageFunction;
  };

  type ClientGroup = {
    clients: Set<Client>;
    clientUrl: EntryPointURL;
    revisionId: RevisionId;
    unlisten: () => void;
    graphOptions: GraphOptions;
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
  export default class HmrServer<TClient extends Client = Client> {
    _config: ConfigT;
    _bundler: IncrementalBundler;
    _createModuleId: (path: string) => number;
    _clientGroups: Map<RevisionId, ClientGroup>;

    constructor(
      bundler: IncrementalBundler,
      createModuleId: (path: string) => number,
      config: ConfigT
    );

    onClientConnect(requestUrl: string, sendFn: SendMessageFunction): Promise<Client>;

    onClientMessage(
      client: TClient,
      message: string | Buffer | ArrayBuffer | Buffer[],
      sendFn: SendMessageFunction
    ): Promise<void>;

    onClientError(client: TClient, error: ErrorEvent): void;

    onClientDisconnect(client: TClient): void;

    _registerEntryPoint(
      client: Client,
      requestUrl: string,
      sendFn: SendMessageFunction
    ): Promise<void>;

    _handleFileChange(
      group: ClientGroup,
      options: { isInitialUpdate: boolean },
      changeEvent?: { logger?: RootPerfLogger | null } | null // ?{ logger: ?RootPerfLogger }
    ): Promise<void>;

    _prepareMessage(
      group: ClientGroup,
      options: { isInitialUpdate: boolean },
      changeEvent?: { logger?: RootPerfLogger | null } | null // ?{ logger: ?RootPerfLogger }
    ): Promise<HmrUpdateMessage | HmrErrorMessage>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/index.js
declare module '@expo/metro/metro/index.js' {
  // TODO: re-export all types, but also override some of them (deltabundler/types)
}

// #region Bundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Bundler.js
declare module '@expo/metro/metro/Bundler' {
  export { default, BundlerOptions } from 'metro/src/Bundler';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Bundler/util.js
declare module '@expo/metro/metro/Bundler/util' {
  import type { File as BabelFile } from '@babel/types';
  import type { AssetDataWithoutFiles } from '@expo/metro/metro/Assets.js';
  import type { ModuleTransportLike } from '@expo/metro/metro/shared/types';

  type SubTree<T extends ModuleTransportLike> = (
    moduleTransport: T,
    moduleTransportsByPath: Map<string, T>
  ) => Iterable<number>;

  export function generateAssetCodeFileAst(
    assetRegistryPath: string,
    assetDescriptor: AssetDataWithoutFiles
  ): BabelFile;

  export function createRamBundleGroups<T extends ModuleTransportLike>(
    ramGroups: readonly string[],
    groupableModules: readonly T[],
    subtree: SubTree<T>
  ): Map<number, Set<number>>;
}

// #region cli/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/cli.js
// declare module '@expo/metro/metro/cli' {
//   // NOTE(cedric): this is a self-executing file that doesn't export anything
// }
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/cli-utils.js
// declare module '@expo/metro/metro/cli-utils' {
//   export function watchFile(filename: string, callback: () => any): Promise<void>;
//   export function makeAsyncCommand<T>(command: (argv: T) => Promise<void>): ((argv: T) => void);
// }
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/cli/parseKeyValueParamArray.js
// declare module '@expo/metro/metro/cli/parseKeyValueParamArray' {
//   export default function coerceKeyValueArray(keyValueArray: readonly string[]): {
//     [key: string]: string,
//     __proto__: null,
//   };
// }
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// #region commands/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/commands/build.js
// declare module '@expo/metro/metro/commands/build' {}
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/commands/dependencies.js
// declare module '@expo/metro/metro/commands/dependencies' {}
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/commands/serve.js
// declare module '@expo/metro/metro/commands/serve.js' {}
// NOTE(cedric): this is part of the Metro CLI, which is ignored in this package

// #region DeltaBundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler.js
declare module '@expo/metro/metro/DeltaBundler' {
  export type { default } from 'metro/src/DeltaBundler';

  // NOTE(cedric): these are using `@expo/metro/...` to augment types properly
  export type {
    DeltaResult,
    Graph,
    DeltaResult,
    Dependencies,
    MixedOutput,
    Module,
    ReadOnlyGraph,
    TransformFn,
    TransformResult,
    TransformResultDependency,
    TransformResultWithSource,
  } from '@expo/metro/metro/DeltaBundler/types';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/types.flow.js
declare module '@expo/metro/metro/DeltaBundler/types' {
  import type {
    Dependency,
    MixedOutput,
    Module as PartialModule,
  } from 'metro/src/DeltaBundler/types';
  import type { RequireContext } from 'metro/src/lib/contextModule';

  export type {
    AllowOptionalDependencies,
    AllowOptionalDependenciesWithOptions,
    AsyncDependencyType,
    BundlerResolution,
    DeltaResult,
    Dependencies,
    Dependency,
    Graph,
    GraphInputOptions,
    MixedOutput,
    Module,
    Options,
    ReadOnlyDependencies,
    ReadOnlyGraph,
    SerializerOptions,
    TransformFn,
    TransformInputOptions,
    TransformResult,
    TransformResultDependency,
    TransformResultWithSource,
  } from 'metro/src/DeltaBundler/types';

  // NOTE(cedric): `Module` is missing the `unstable_transformResultKey` property
  export interface Module<T = MixedOutput> extends PartialModule<T> {
    unstable_transformResultKey?: string | null; // ?string
  }

  // NOTE(cedric): `ModuleData` is missing from typescript definitions
  export interface ModuleData<T = MixedOutput> {
    dependencies: readonly Map<string, Dependency>;
    resolvedContexts: readonly Map<string, RequireContext>;
    output: readonly T[];
    getSource: () => Buffer;
    unstable_transformResultKey?: string | null; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/buildSubgraph.js
declare module '@expo/metro/metro/DeltaBundler/buildSubgraph' {
  import type {
    Dependency,
    ModuleData,
    ResolveFn,
    TransformFn,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type { RequireContext } from 'metro/src/lib/contextModule';

  type Parameters<T> = $ReadOnly<{
    resolve: ResolveFn;
    transform: TransformFn<T>;
    shouldTraverse: (dependency: Dependency) => boolean;
  }>;

  export function buildSubgraph<T>(
    entryPaths: readonly string[],
    resolvedContexts: readonly Map<string, RequireContext | null | undefined>, // Map<string, ?RequireContext>
    parameters: Parameters<T>
  ): Promise<{
    moduleData: Map<string, ModuleData<T>>;
    errors: Map<string, Error>;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/DeltaCalculator.js
declare module '@expo/metro/metro/DeltaBundler/DeltaCalculator' {
  import { DeltaResult, Graph, Options } from '@expo/metro/metro/DeltaBundler/types';
  import type { EventEmitter } from 'node:events';

  export default class DeltaCalculator<T> {
    constructor(
      entryPoints: readonly Set<string>,
      changeEventSource: EventEmitter,
      options: Options<T>
    );

    end(): void;

    /**
     * Main method to calculate the delta of modules. It returns a DeltaResult,
     * which contain the modified/added modules and the removed modules.
     */
    getDelta(options: {
      reset: boolean;
      shallow: boolean;
      [key: string]: any; // ...
    }): Promise<DeltaResult<T>>;

    /**
     * Returns the graph with all the dependencies. Each module contains the
     * needed information to do the traversing (dependencies, inverseDependencies)
     * plus some metadata.
     */
    getGraph(): Graph<T>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/getTransformCacheKey.js
declare module '@expo/metro/metro/DeltaBundler/getTransformCacheKey' {
  import type { TransformerConfig } from '@metro/src/DeltaBundler/Worker';

  export default function getTransformCacheKey(options: {
    cacheVersion: string;
    projectRoot: string;
    transformerConfg: TransformerConfig;
  }): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Graph.js
declare module '@expo/metro/metro/DeltaBundler/Graph' {
  export { Graph, Result } from 'metro/src/DeltaBundler/Graph';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/mergeDeltas.js
declare module '@expo/metro/metro/DeltaBundler/mergeDeltas' {
  import type { DeltaBundle } from '@expo/metro/metro-runtime/modules/types';

  export default function mergeDeltas(delta1: DeltaBundle, delta2: DeltaBundle): DeltaBundle;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Transformer.js
declare module '@expo/metro/metro/DeltaBundler/Transformer' {
  import type { TransformResultWithSource } from '@expo/metro/metro/DeltaBundler/types';
  import type { ConfigT } from '@expo/metro/metro-config/configTypes';

  export default class Transformer {
    constructor(config: ConfigT, getSha1Fn: (filePath: string) => string);

    async transformFile(
      filePath: string,
      transformerOptions: TransformOptions,
      fileBuffer?: Buffer
    ): Promise<TransformResultWithSource>;

    end(): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Worker.js
declare module '@expo/metro/metro/DeltaBundler/Worker' {
  export {
    default,
    type TransformerConfig,
    type TransformOptions,
    type Worker,
  } from 'metro/src/DeltaBundler/Worker';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/WorkerFarm.js
declare module '@expo/metro/metro/DeltaBundler/WorkerFarm' {
  import type { TransformResult } from '@expo/metro/metro/DeltaBundler/types';
  import type { TransformerConfig } from '@expo/metro/metro/DeltaBundler/Worker';
  import type { ConfigT } from '@expo/metro/metro-config/configTypes';

  type TransformerResult = readonly {
    result: TransformResult;
    sha1: string;
  };

  export default class WorkerFarm {
    constructor(config: ConfigT, transformerConfig: TransformerConfig);

    kill(): Promise<void>;
    transform(
      filename: string,
      options: TransformOptions,
      fileBuffer?: Buffer
    ): Promise<TransformerResult>;
  }
}

// #region DeltaBundler/Serializers/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/baseJSBundle' {
  import type {
    Module,
    ReadOnlyGraph,
    SerializerOptions,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type { Bundle } from '@expo/metro/metro-runtime/modules/types';

  export default function baseJSBundle(
    entryPoint: string,
    preModules: readonly Module[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Bundle;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/getAllFiles.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/getAllFiles' {
  import type { Graph, Module } from '@expo/metro/metro/DeltaBundler/types';

  type Options = {
    platform?: string | null; // ?string
    processModuleFilter: (module: Module) => boolean;
  };

  export default function getAllFiles(
    pre: readonly Module[],
    graph: readonly Graph,
    options: Options
  ): Promise<readonly string[]>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/getAssets.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/getAssets' {
  import type { AssetData } from '@expo/metro/metro/Assets';
  import type { Module, ReadOnlyDependencies } from '@expo/metro/metro/DeltaBundler/types';

  type Options = {
    processModuleFilter: (module: Module) => boolean;
    assetPlugins: readonly string[];
    platform: string | null; // ?string
    projectRoot: string;
    publicPath: string;
  };

  export default function getAssets(
    dependencies: ReadOnlyDependencies,
    options: Options
  ): Promise<readonly AssetData[]>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/getExplodedSourceMap.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/getExplodedSourceMap' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';
  import type {
    MetroSourceMapSegmentTuple,
    FBSourceFunctionMap,
  } from '@expo/metro/metro-source-map';

  export type ExplodedSourceMap = readonly {
    map: MetroSourceMapSegmentTuple[];
    firstLine1Based: number;
    functionMap: FBSourceFunctionMap | null; // ?FBSourceFunctionMap
    path: string;
  }[];

  export function getExplodedSourceMap(
    modules: readonly Module[],
    options: {
      processModuleFilter: (module: Module) => boolean;
    }
  ): ExplodedSourceMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/getRamBundleInfo.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/getRamBundleInfo' {
  import type {
    Module,
    ReadOnlyGraph,
    SerializerOptions,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type { SourceMapGeneratorOptions } from '@expo/metro/metr/DeltaBundle/Serializers/sourceMapGenerator';
  import type { RamBundleInfo } from 'metro/src/DeltaBundler/Serializers/getRamBundleInfo';

  export type { RamBundleInfo };

  type Options = Readonly<
    SerializerOptions &
      SourceMapGeneratorOptions & {
        getTransformOptions?: GetTransformOptions | null; // ?GetTransformOptions
        platform?: string | null; // ?string
      }
  >;

  export default function getRamBundleInfo(
    entryPoint: string,
    pre: readonly Module[],
    graph: ReadOnlyGraph,
    options: Options
  ): Promise<RamBundleInfo>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/hmrJSBundle' {
  import type { DeltaResult, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
  import type { HmrModule } from '@expo/metro/metro-runtime/modules/types';

  type Options = readonly {
    clientUrl: EntryPointURL;
    createModuleId: (modulePath: string) => number;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    [key: string]: any; // ...
  };

  export default function hmrJSBundle(
    delta: DeltaResult,
    graph: ReadOnlyGraph,
    options: Options
  ): {
    added: readonly HmrModule[];
    deleted: readonly number[];
    modified: readonly HmrModule[];
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/sourceMapGenerator.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';
  import type { fromRawMappings, fromRawMappingsNonBlocking } from '@expo/metro/metro-source-map';

  export type SourceMapGeneratorOptions = Readonly<{
    excludeSource: boolean;
    processModuleFilter: (module: Module) => boolean;
    shouldAddToIgnoreList: (module: Module) => boolean;
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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/sourceMapObject.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/sourceMapObject' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';
  import type { SourceMapGeneratorOptions } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator';
  import type { MixedSourceMap } from '@expo/metro/metro-source-map';

  export function sourceMapObject(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): MixedSourceMap;

  export function sourceMapObjectNonBlocking(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): Promise<MixedSourceMap>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/sourceMapString.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/sourceMapString' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';
  import type { SourceMapGeneratorOptions } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator';

  export default function sourceMapString(
    modules: readonly Module[],
    options: SourceMapGeneratorOptions
  ): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL' {
  export default function getInlineSourceMappingURL(sourceMap: string): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/getSourceMapInfo.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/helpers/getSourceMapInfo' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';
  import type {
    FBSourceFunctionMap,
    MetroSourceMapSegmentTuple,
  } from '@expo/metro/metro-source-map';

  export default function getSourceMapInfo(
    module: Module,
    options: {
      excludeSource: boolean;
      shouldAddToIgnoreList: (module: Module) => boolean;
    }
  ): {
    map: MetroSourceMapSegmentTuple[];
    functionMap: FBSourceFunctionMap | null; // ?FBSourceFunctionMap
    code: string;
    path: string;
    source: string;
    lineCount: number;
    isIgnored: boolean;
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/getTransitiveDependencies.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/helpers/getTransitiveDependencies' {
  import type { ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';

  export default function getTransitiveDependencies<T>(
    path: string,
    graph: ReadOnlyGraph<T>
  ): Set<string>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/js.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/helpers/js' {
  import type { MixedOutput, Module } from '@expo/metro/metro/DeltaBundler/types';
  import type { JsOutput } from '@expo/metro/metro-transform-worker';

  export type Options = Readonly<{
    createModuleId: (path: string) => number | string;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl?: string | null; // ?string
    [key: string]: any; // ...
  }>;

  export function wrapModule(module: Module, options: Options): string;

  export function getModuleParams(module: Module, options: Options): any[];

  export function getJsOutput(
    module: Readonly<{
      output: readonly MixedOutput[];
      path?: string;
      [key: string]: any; // ...
    }>
  ): JsOutput;

  export function isJsModule(module: Module): boolean;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/processModules.js
declare module '@expo/metro/metro/DeltaBundler/Serializers/helpers/processModules' {
  import type { Module } from '@expo/metro/metro/DeltaBundler/types';

  export default function processModules(
    modules: readonly Module[],
    options: readonly {
      filter?: (module: Module) => boolean;
      createModuleId: (modulePath: string) => number;
      dev: boolean;
      includeAsyncPaths: boolean;
      projectRoot: string;
      serverRoot: string;
      sourceUrl: string | null; // ?string
    }
  ): readonly [Module, string][];
}

// #region IncrementalBundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/IncrementalBundler.js
declare module '@expo/metro/metro/IncrementalBundler' {
  // TODO
  import type {
    default as OriginalIncrementalBundler,
    OtherOptions,
  } from 'metro/src/IncrementalBundler';
  import type { ResolverInputOptions } from 'metro/src/shared/types';
  import type {
    ReadOnlyDependencies,
    TransformInputOptions,
  } from '@expo/metro/metro/DeltaBundler/types';

  // Overrides the `IncrementalBundler.getDependencies` returned type for inconsistent
  // ReadOnlyDependencies<void> <-> ReadOnlyDependencies<> type.
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/src/IncrementalBundler.js#L159
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/types/IncrementalBundler.d.ts#L66
  class IncrementalBundler extends OriginalIncrementalBundler {
    getDependencies(
      entryFiles: readonly string[],
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<ReadOnlyDependencies<void>>;
  }

  // This is actually `module.exports = IncrementalBundler`, but we also export types
  export default IncrementalBundler;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/IncrementalBundler/GraphNotFoundError.js
declare module '@expo/metro/metro/IncrementalBundler/GraphNotFoundError' {
  import type { GraphId } from '@expo/metro/metro/lib/getGraphId';

  export default class GraphNotFoundError extends Error {
    graphId: GraphId;
    constructor(graphId: GraphId);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/IncrementalBundler/ResourceNotFoundError.js
declare module '@expo/metro/metro/IncrementalBundler/ResourceNotFoundError' {
  export default class ResourceNotFoundError extends Error {
    resourcePath: string;
    constructor(resourcePath: string);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/IncrementalBundler/RevisionNotFoundError.js
declare module '@expo/metro/metro/IncrementalBundler/RevisionNotFoundError' {
  import type { RevisionId } from '@expo/metro/metro/IncrementalBundler';

  export default class RevisionNotFoundError extends Error {
    revisionId: RevisionId;
    constructor(revisionId: RevisionId);
  }
}

// #region /ModuleGraph/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/test-helpers.js
// declare module '@expo/metro/metro/ModuleGraph/test-helpers' {}
// NOTE(cedric): this file seems to be related to testing, so it's ignored in this package

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/worker/JsFileWrapping.js
declare module '@expo/metro/metro/ModuleGraph/worker/JsFileWrapping' {
  import type { File as BabelFile } from '@babel/types';

  export const WRAP_NAME: '$$_REQUIRE'; // note: babel will prefix this with _
  export function jsonToCommonJS(source: string): string;
  export function wrapPolyfill(fileAst: BabelFile): BabelFile;
  export function wrapJson(source: string, globalPrefix: string): string;
  export function wrapModule(
    fileAst: BabelFile,
    importDefaultName: string,
    importAllName: string,
    dependencyMapName: string,
    globalPrefix: string,
    skipRequireRename: boolean
  ): {
    ast: BabelFile;
    requireName: string;
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/worker/collectDependencies.js
declare module '@expo/metro/metro/ModuleGraph/worker/collectDependencies' {
  import type { BabelFile, types as BabelTypes } from '@babel/core';
  import type { NodePath } from '@babel/traverse';
  import type { CallExpression, Identifier, StringLiteral } from '@babel/types';
  import type {
    AllowOptionalDependencies,
    AsyncDependencyType,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type {
    DynamicRequiresBehavior,
    RequireContextParams,
  } from 'metro/src/ModuleGraph/worker/collectDependencies';

  export type {
    ContextFilter,
    ContextMode,
    DynamicRequiresBehavior,
    RequireContextParams,
  } from 'metro/src/ModuleGraph/worker/collectDependencies';

  type DependencyData = Readonly<{
    // A locally unique key for this dependency within the current module.
    key: string;
    // If null, then the dependency is synchronous. (ex. `require('foo')`)
    asyncType: AsyncDependencyType | null;
    isOptional?: boolean;
    locs: readonly BabelTypes.SourceLocation[];
    /** Context for requiring a collection of modules. */
    contextParams?: RequireContextParams;
  }>;

  export interface DependencyTransformer {
    transformSyncRequire(
      path: NodePath<CallExpression>,
      dependency: InternalDependency,
      state: State
    ): void;
    transformImportCall(path: NodePath, dependency: InternalDependency, state: State): void;
    transformPrefetch(path: NodePath, dependency: InternalDependency, state: State): void;
    transformIllegalDynamicRequire(path: NodePath, state: State): void;
  }

  export type Dependency = Readonly<{
    data: DependencyData;
    name: string;
  }>;

  export type Options = Readonly<{
    asyncRequireModulePath: string;
    dependencyMapName: string | null; // ?string
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer?: DependencyTransformer;
    /** Enable `require.context` statements which can be used to import multiple files in a directory. */
    unstable_allowRequireContext: boolean;
  }>;

  export type CollectedDependencies = Readonly<{
    ast: BabelFile;
    dependencyMapName: string;
    dependencies: readonly Dependency[];
  }>;

  export type MutableInternalDependency = DependencyData & {
    locs: BabelTypes.SourceLocation[];
    index: number;
    name: string;
  };

  export type InternalDependency = Readonly<MutableInternalDependency>;

  export interface DependencyTransformer {
    transformSyncRequire(
      path: NodePath<CallExpression>,
      dependency: InternalDependency,
      state: State
    ): void;
    transformImportCall(path: NodePath<>, dependency: InternalDependency, state: State): void;
    transformPrefetch(path: NodePath<>, dependency: InternalDependency, state: State): void;
    transformIllegalDynamicRequire(path: NodePath<>, state: State): void;
  }

  export type State = {
    asyncRequireModulePathStringLiteral: StringLiteral | null; // ?StringLiteral
    dependencyCalls: Set<string>;
    dependencyRegistry: DependencyRegistry;
    dependencyTransformer: DependencyTransformer;
    dynamicRequires: DynamicRequiresBehavior;
    dependencyMapIdentifier: Identifier | null; // ?Identifier
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    /** Enable `require.context` statements which can be used to import multiple files in a directory. */
    unstable_allowRequireContext: boolean;
  };

  export type ImportQualifier = Readonly<{
    name: string;
    asyncType: AsyncDependencyType | null;
    optional: boolean;
    contextParams?: RequireContextParams;
  }>;

  class DependencyRegistry {
    constructor();
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
  }

  export default function collectDependencies(
    ast: BabelFile,
    options: Options
  ): CollectedDependencies;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/worker/generateImportNames.js
declare module '@expo/metro/metro/ModuleGraph/worker/generateImportNames' {
  import type { Node as BabelNode } from '@babel/core';

  export default function generateImportNames(ast: BabelNode): {
    importAll: string;
    importDefault: string;
  };
}

// #region /Server/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Server.js
declare module '@expo/metro/metro/Server' {
  export {
    default,
    type BundleMetadata,
    type DefaultBundleOptions,
    type DefaultGraphOptions,
    type ProcessDeleteContext,
    type ProcessEndContext,
    type ProcessStartContext,
    type ProcessStartContext,
    type SegmentLoadData,
    type ServerOptions,
  } from 'metro/src/Server';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Server/MultipartResponse.js
declare module '@expo/metro/metro/Server/MultipartResponse' {
  export { default, type Data, type Headers } from 'metro/src/Server/MultipartResponse';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Server/symbolicate.js
declare module '@expo/metro/metro/Server/symbolicate' {
  import type { ExplodedSourceMap } from '@expo/metro/metro/DeltaBundler/Serializers/getExplodedSourceMap';
  import type { ConfigT } from '@expo/metro/metro-config';

  export type StackFrameInput = {
    file: string | null; // ?string
    lineNumber: number | null; // ?number
    column: number | null; // ?number
    methodName: string | null; // ?string
    [key: string]: any; // ...
  };

  export type IntermediateStackFrame = StackFrameInput & {
    collapse?: boolean;
  };

  export type StackFrameOutput = Readonly<IntermediateStackFrame>;

  export default function symbolicate(
    stack: readonly StackFrameInput[],
    maps: Iterable<[string, ExplodedSourceMap]>,
    config: ConfigT,
    extraData: any
  ): Promise<readonly StackFrameOutput[]>;
}

// #region /lib/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/BatchProcessor.js
declare module '@expo/metro/metro/lib/BatchProcessor' {
  type ProcessBatch<TItem, TResult> = (batch: Array<TItem>) => Promise<Array<TResult>>;

  type BatchProcessorOptions = {
    maximumDelayMs: number;
    maximumItems: number;
    concurrency: number;
    [key: string]: any; // ...
  };

  type QueueItem<TItem, TResult> = {
    item: TItem;
    reject: (error: mixed) => mixed;
    resolve: (result: TResult) => mixed;
    [key: string]: any; // ...
  };

  export default class BatchProcessor<TItem, TResult> {
    constructor(options: BatchProcessorOptions, processBatch: ProcessBatch<TItem, TResult>);
    queue(item: TItem): Promise<TResult>;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/CountingSet.js
declare module '@expo/metro/metro/lib/CountingSet' {
  export interface ReadOnlyCountingSet<T> extends Iterable<T> {
    get size(): number;
    has(item: T): boolean;
    [Symbol.iterator](): Iterator<T>;
    count(item: T): number;
    forEach<ThisT>(
      callbackFn: (this: ThisT, value: T, key: T, set: ReadOnlyCountingSet<T>) => mixed,
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
    [Symbol.iterator](): Iterator<T>;
    get size(): number;
    count(item: T): number;
    clear(): void;
    forEach<ThisT>(
      callbackFn: (this: ThisT, value: T, key: T, set: CountingSet<T>) => mixed,
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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/JsonReporter.js
declare module '@expo/metro/metro/lib/JsonReporter' {
  import type { Writable } from 'node:stream';

  export type SerializedEvent<TEvent extends Record<string, any>> = TEvent extends {
    error: Error;
  }
    ? Omit<TEvent, 'error'> & {
        message: string;
        stack: string;
      } & Record<string, any>
    : TEvent;

  export default class JsonReporter<TEvent extends { [key: string]: any }> {
    constructor(stream: Writable);

    /**
     * There is a special case for errors because they have non-enumerable fields.
     * (Perhaps we should switch in favor of plain object?)
     */
    update(event: TEvent): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/RamBundleParser.js
declare module '@expo/metro/metro/lib/RamBundleParser' {
  /**
   * Implementation of a RAM bundle parser in JS.
   *
   * It receives a Buffer as an input and implements two main methods, which are
   * able to run in constant time no matter the size of the bundle:
   *
   * getStartupCode(): returns the runtime and the startup code of the bundle.
   * getModule(): returns the code for the specified module.
   */
  export default class RamBundleParser {
    constructor(buffer: Buffer);

    getStartupCode(): string;
    getModule(id: number): string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/TerminalReporter.js
declare module '@expo/metro/metro/lib/TerminalReporter' {
  import type { ReportableEvent } from '@expo/metro/metro/lib/reporting';
  import type { Terminal } from '@expo/metro/metro-core';

  export type TerminalReportableEvent =
    | ReportableEvent
    | {
        buildID: string;
        type: 'bundle_transform_progressed_throttled';
        transformedFileCount: number;
        totalFileCount: number;
        [key: string]: any; // ...
      };

  /**
   * We try to print useful information to the terminal for interactive builds.
   * This implements the `Reporter` interface from the './reporting' module.
   */
  export default class TerminalReporter {
    terminal: Terminal;
    constructor(terminal: Terminal);
    /**
     * Single entry point for reporting events. That allows us to implement the
     * corresponding JSON reporter easily and have a consistent reporting.
     */
    update(event: TerminalReportableEvent): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/bundleToString.js
declare module '@expo/metro/metro/lib/bundleToString' {
  import type { Bundle, BundleMetadata } from '@expo/metro/metro-runtime/modules/types';

  export default function bundleToString(bundle: Bundle): {
    code: string;
    metadata: BundleMetadata;
  };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/contextModule.js
declare module '@expo/metro/metro/lib/contextModule' {
  import type {
    ContextMode,
    RequireContextParams,
  } from '@expo/metro/metro/ModuleGraph/worker/collectDependencies';

  export type RequireContext = Readonly<{
    /** Should search for files recursively. Optional, default `true` when `require.context` is used */
    recursive: boolean;
    /** Filename filter pattern for use in `require.context`. Optional, default `.*` (any file) when `require.context` is used */
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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/contextModuleTemplates.js
declare module '@expo/metro/metro/lib/contextModuleTemplates' {
  import type { ContextMode } from '@expo/metro/metro/ModuleGraph/worker/collectDependencies';

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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/countLines.js
declare module '@expo/metro/metro/lib/countLines' {
  export default function countLines(string: string): number;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/createModuleIdFactory.js
declare module '@expo/metro/metro/lib/createModuleIdFactory' {
  export default function createModuleIdFactory(): (path: string) => number;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/createWebsocketServer.js
declare module '@expo/metro/metro/lib/createWebsocketServer' {
  import type { WebSocketServer } from 'ws';

  type HMROptions<TClient extends object> = {
    websocketServer: WebsocketServiceInterface<TClient>;
  };

  interface WebsocketServiceInterface<T> {
    onClientConnect(): Promise<T | undefined>;
    onClientDisconnect?: (client: T) => any;
    onClientError?: (client: T, error: ErrorEvent) => any;
    onClientMessage?: (
      client: T,
      message: string | Buffer | ArrayBuffer | Buffer[],
      sendFn: (data: string) => void
    ) => any;
  }

  /**
   * Returns a WebSocketServer to be attached to an existing HTTP instance. It forwards
   * the received events on the given "websocketServer" parameter. It must be an
   * object with the following fields:
   *   - onClientConnect
   *   - onClientError
   *   - onClientMessage
   *   - onClientDisconnect
   */
  export default function createWebsocketServer<TClient extends object>(
    service: HMROptions<TClient>
  ): WebSocketServer;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/debounceAsyncQueue.js
declare module '@expo/metro/metro/lib/debounceAsyncQueue' {
  /**
   * Debounces calls with the given delay, and queues the next call while the
   * previous one hasn't completed so that no two calls can execute concurrently.
   */
  export default function debounceAsyncQueue<T>(
    fn: () => Promise<T>,
    delay: number
  ): () => Promise<T>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/formatBundlingError.js
declare module '@expo/metro/metro/lib/formatBundlingError' {
  import type { FormattedError } from '@expo/metro/metro-runtime/modules/types';

  export type CustomError = Error & {
    type?: string;
    filename?: string;
    lineNumber?: number;
    errors?: {
      description: string;
      filename: string;
      lineNumber: number;
      [key: string]: any; // ...
    }[];
  };

  export default function formatBundlingError(error: CustomError): FormattedError;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getAppendScripts.js
declare module '@expo/metro/metro/lib/getAppendScripts' {
  import type { Module } from '@expo/metro/metro/DeltaBundler';

  type Options<T extends number | string> = Readonly<{
    asyncRequireModulePath: string;
    createModuleId: (path: string) => T;
    getRunModuleStatement: (moduleId: T) => string;
    inlineSourceMap: boolean | null; // ?boolean
    runBeforeMainModule: readonly string[];
    runModule: boolean;
    shouldAddToIgnoreList: (module: Module) => boolean;
    sourceMapUrl: string | null; // ?string
    sourceUrl: string | null; // ?string
    [key: string]: any; // ...
  }>;

  export default function getAppendScripts<T extends number | string>(
    entryPoint: string,
    modules: readonly Module[],
    options: Options<T>
  ): readonly Module[];
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getGraphId.js
declare module '@expo/metro/metro/lib/getGraphId' {
  import type { TransformInputOptions } from '@expo/metro/metro/DeltaBundler/types';
  import type { ResolverInputOptions } from '@expo/metro/metro/shared/types';

  export type GraphId = string;

  function getGraphId(
    entryFile: string,
    options: TransformInputOptions,
    {
      shallow,
      lazy,
      unstable_allowRequireContext,
      resolverOptions,
    }: Readonly<{
      shallow: boolean;
      lazy: boolean;
      unstable_allowRequireContext: boolean;
      resolverOptions: ResolverInputOptions;
    }>
  ): GraphId;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getMaxWorkers.js
declare module '@expo/metro/metro/lib/getMaxWorkers' {
  export default function getMaxWorkers(workers: number | null): number;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getPreludeCode.js
declare module '@expo/metro/metro/lib/getPreludeCode' {
  export default function getPreludeCode(options: {
    extraVars?: { [key: string]: any };
    isDev: boolean;
    globalPrefix: string;
    requireCycleIgnorePatterns: readonly RegExp[];
  }): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getPrependedScripts.js
declare module '@expo/metro/metro/lib/getPrependedScripts' {
  import type Bundler from '@expo/metro/metro/Bundler';
  import type DeltaBundler, { Module } from '@expo/metro/metro/DeltaBundler';
  import type { TransformInputOptions } from '@expo/metro/metro/DeltaBundler/types';
  import type { ResolverInputOptions } from '@expo/metro/metro/shared/types';
  import type { ConfigT } from '@expo/metro/metro-config';

  type Diff<T, U> = Omit<T, keyof U>;

  export default function getPrependedScripts(
    config: ConfigT,
    options: Diff<
      TransformInputOptions,
      { type: TransformInputOptions['type'] } & Record<string, any>
    >,
    resolverOptions: ResolverInputOptions,
    bundler: Bundler,
    deltaBundler: DeltaBundler
  ): Promise<readonly Module[]>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/logToConsole.js
declare module '@expo/metro/metro/lib/logToConsole' {
  import type { Terminal } from '@expo/metro/metro-core';

  export default function logToConsole(
    terminal: Terminal,
    level: string,
    mode: 'BRIDGE' | 'NOBRIDGE',
    ...data: any[]
  ): void;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/parseCustomResolverOptions.js
declare module '@expo/metro/metro/lib/parseCustomResolverOptions' {
  import type { CustomResolverOptions } from '@expo/metro/metro-resolver';

  export default function parseCustomResolverOptions(url: {
    query?: Record<string, any>;
  }): CustomResolverOptions;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/parseCustomTransformOptions.js
declare module '@expo/metro/metro/lib/parseCustomTransformOptions' {
  import type { CustomTransformOptions } from '@expo/metro/metro-transform-worker';

  export default function parseCustomTransformOptions(url: {
    query?: Record<string, any>;
  }): CustomTransformOptions;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/parseOptionsFromUrl.js
declare module '@expo/metro/metro/lib/parseOptionsFromUrl' {
  import type { BundleOptions } from '@expo/metro/metro/shared/types';

  export default function parseOptionsFromUrl(
    normalizedRequestUrl: string,
    platforms: Set<string>
  ): BundleOptions;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/relativizeSourceMap.js
declare module '@expo/metro/metro/lib/relativizeSourceMap' {
  import type { MixedSourceMap } from '@expo/metro/metro-source-map';

  export default function relativizeSourceMapInline(
    sourceMap: MixedSourceMap,
    sourcesRoot: string
  ): void;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/reporting.js
declare module '@expo/metro/metro/lib/reporting' {
  import type { Terminal } from '@expo/metro/metro-core';
  import type { HealthCheckResult, WatcherStatus } from '@expo/metro/metro-file-map';
  import type { CustomResolverOptions } from '@expo/metro/metro-resolver';
  import type { CustomTransformOptions } from '@expo/metro/metro-transform-worker';

  export type BundleDetails = {
    bundleType: string;
    customResolverOptions: CustomResolverOptions;
    customTransformOptions: CustomTransformOptions;
    dev: boolean;
    entryFile: string;
    minify: boolean;
    platform: string | null; // ?string
    [key: string]: any; // ...
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
        [key: string]: any; // ...
      }
    | {
        type: 'initialize_failed';
        port: number;
        error: Error;
        [key: string]: any; // ...
      }
    | {
        type: 'initialize_done';
        port: number;
      }
    | {
        buildID: string;
        type: 'bundle_build_done';
        [key: string]: any; // ...
      }
    | {
        buildID: string;
        type: 'bundle_build_failed';
        [key: string]: any; // ...
      }
    | {
        buildID: string;
        bundleDetails: BundleDetails;
        isPrefetch?: boolean;
        type: 'bundle_build_started';
        [key: string]: any; // ...
      }
    | {
        error: Error;
        type: 'bundling_error';
        [key: string]: any; // ...
      }
    | {
        type: 'dep_graph_loading';
        hasReducedPerformance: boolean;
        [key: string]: any; // ...
      }
    | {
        type: 'dep_graph_loaded';
        [key: string]: any; // ...
      }
    | {
        buildID: string;
        type: 'bundle_transform_progressed';
        transformedFileCount: number;
        totalFileCount: number;
        [key: string]: any; // ...
      }
    | {
        type: 'cache_read_error';
        error: Error;
        [key: string]: any; // ...
      }
    | {
        type: 'cache_write_error';
        error: Error;
        [key: string]: any; // ...
      }
    | {
        type: 'transform_cache_reset';
        [key: string]: any; // ...
      }
    | {
        type: 'worker_stdout_chunk';
        chunk: string;
        [key: string]: any; // ...
      }
    | {
        type: 'worker_stderr_chunk';
        chunk: string;
        [key: string]: any; // ...
      }
    | {
        type: 'hmr_client_error';
        error: Error;
        [key: string]: any; // ...
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
        data: any[];
        mode: 'BRIDGE' | 'NOBRIDGE';
        [key: string]: any; // ...
      }
    | {
        type: 'resolver_warning';
        message: string;
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
  export type Reporter = { update(event: ReportableEvent): void };

  /**
   * A standard way to log a warning to the terminal. This should not be called
   * from some arbitrary Metro logic, only from the reporters. Instead of
   * calling this, add a new type of ReportableEvent instead, and implement a
   * proper handler in the reporter(s).
   */
  export function logWarning(terminal: Terminal, format: string, ...args: any[]): void;

  /**
   * Similar to `logWarning`, but for messages that require the user to act.
   */
  export function logError(terminal: Terminal, format: string, ...args: any[]): void;

  /**
   * A reporter that does nothing. Errors and warnings will be swallowed, that
   * is generally not what you want.
   */
  export const nullReporter: Reporter = { update(): void {} };
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/splitBundleOptions.js
declare module '@expo/metro/metro/lib/splitBundleOptions' {
  import type { BundleOptions, SplitBundleOptions } from '@expo/metro/metro/shared/types';

  /**
   * Splits a BundleOptions object into smaller, more manageable parts.
   */
  export default function splitBundleOptions(options: BundleOptions): SplitBundleOptions;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/transformHelpers.js
declare module '@expo/metro/metro/lib/transformHelpers' {
  import type Bundler from '@expo/metro/metro/Bundler';
  import type DeltaBundler, { TransformFn } from '@expo/metro/metro/DeltaBundler';
  import type {
    BundlerResolution,
    TransformInputOptions,
    TransformResultDependency,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type { ResolverInputOptions } from '@expo/metro/metro/shared/types';
  import type { ConfigT } from '@expo/metro/metro-config';

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
    platform: string | null, // ?string
    resolverOptions: ResolverInputOptions
  ): Promise<(from: string, dependency: TransformResultDependency) => BundlerResolution>;
}

// #region /node-haste/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/DependencyGraph.js
declare module '@expo/metro/metro/node-haste/DependencyGraph' {
  import {
    BundlerResolution,
    TransformResultDependency,
  } from '@expo/metro/metro/DeltaBundler/types';
  import { ResolverInputOptions } from '@expo/metro/metro/shared/types';
  import type { ConfigT } from '@expo/metro/metro-config';
  import type { EventEmitter } from 'node:events';

  export default class DependencyGraph extends EventEmitter {
    constructor(
      config: ConfigT,
      options?: Readonly<{
        hasReducedPerformance?: boolean;
        watch?: boolean;
      }>
    );

    ready(): Promise<void>;

    /** @deprecated Use the constructor + `ready()` directly */
    load(
      config: ConfigT,
      options?: Readonly<{ hasReducedPerformance?: boolean; watch?: boolean }>
    ): Promise<DependencyGraph>;

    getAllFiles(): string[];
    getSha1(filename: string): string;
    getWatcher(): EventEmitter;
    end(): void;

    /** Given a search context, return a list of file paths matching the query. */
    matchFilesWithContext(
      from: string,
      context: Readonly<{
        /* Should search for files recursively. */
        recursive: boolean;
        /* Filter relative paths against a pattern. */
        filter: RegExp;
      }>
    ): string[];

    resolveDependency(
      from: string,
      to: TransformResultDependency,
      platform: string | null,
      resolverOptions: ResolverInputOptions,
      options: { assumeFlatNodeModules: boolean }
    ): BundlerResolution;

    getHasteName(filePath: string): string;
    getDependencies(filePath: string): string[];
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/Module.js
declare module '@expo/metro/metro/node-haste/Module' {
  import type ModuleCache from '@expo/metro/metro/node-haste/ModuleCache';
  import type Package from '@expo/metro/metro/node-haste/Package';

  export default class Module {
    path: string;
    constructor(file: string, moduleCache: ModuleCache);
    getPackage(): Package | null; // ?Packages
    invalidate(): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/ModuleCache.js
declare module '@expo/metro/metro/node-haste/ModuleCache' {
  import type Module from '@expo/metro/metro/node-haste/Module';
  import type Package from '@expo/metro/metro/node-haste/Package';

  type GetClosestPackageFn = (filePath: string) => string | null; // ?string

  export default class ModuleCache {
    constructor(options: {
      getClosestPackage: GetClosestPackageFn;
      [key: string]: any; // ...
    });

    getModule(filePath: string): Module;
    getPackage(filePath: string): Package;
    getPackageForModule(module: Module): Package | null; // ?Package
    getPackageOf(modulePath: string): Package | null; // ?Package
    invalidate(filePath: string): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/Package.js
declare module '@expo/metro/metro/node-haste/Package' {
  import type { PackageJson } from '@expo/metro/metro-resolver';

  export default class Package {
    path: string;
    constructor(options: {
      file: string;
      [key: string]: any; // ...
    });
    invalidate(): void;
    read(): PackageJson;
  }
}

// #region /node-haste/DependencyGraph/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/DependencyGraph/ModuleResolution.js
declare module '@expo/metro/metro/node-haste/DependencyGraph/ModuleResolution' {
  import type {
    BundlerResolution,
    TransformResultDependency,
  } from '@expo/metro/metro/DeltaBundler/types';
  import type { Reporter } from '@expo/metro/metro/lib/reporting';
  import type { ResolverInputOptions } from '@expo/metro/metro/shared/types';
  import type {
    CustomResolver,
    DoesFileExist,
    GetRealPath,
    ResolveAsset,
  } from '@expo/metro/metro-resolver';

  export type DirExistsFn = (filePath: string) => boolean;

  export type Packageish = {
    path: string;
    read(): PackageJson;
  };

  export type Moduleish = {
    path: string;
    getPackage(): Packageish | null; // ?Packageish
  };

  export type ModuleishCache<TPackage> = {
    getPackage(name: string, platform?: string, supportsNativePlatform?: boolean): TPackage;
    getPackageOf(modulePath: string): TPackage | null; // ?TPackage
  };

  type Options<TPackage> = Readonly<{
    assetExts: ReadonlySet<string>;
    dirExists: DirExistsFn;
    disableHierarchicalLookup: boolean;
    doesFileExist: DoesFileExist;
    emptyModulePath: string;
    extraNodeModules: Object | null; // ?Object
    getHasteModulePath: (name: string, platform: string | null) => string | null; // ?string
    getHastePackagePath: (name: string, platform: string | null) => string | null; // ?string
    mainFields: readonly string[];
    moduleCache: ModuleishCache<TPackage>;
    nodeModulesPaths: readonly string[];
    preferNativePlatform: boolean;
    projectRoot: string;
    reporter: Reporter;
    resolveAsset: ResolveAsset;
    resolveRequest: CustomResolver | null; // ?CustomResolver
    sourceExts: readonly string[];
    unstable_conditionNames: readonly string[];
    unstable_conditionsByPlatform: Readonly<{
      [platform: string]: readonly string[];
    }>;
    unstable_enablePackageExports: boolean;
    unstable_getRealPath: GetRealPath | null; // ?GetRealPath
  }>;

  export class ModuleResolver<TPackage extends Packageish> {
    constructor(options: Options<TPackage>);
    resolveDependency(
      fromModule: Moduleish,
      dependency: TransformResultDependency,
      allowHaste: boolean,
      platform: string | null,
      resolverOptions: ResolverInputOptions
    ): BundlerResolution;
  }

  export class UnableToResolveError extends Error {
    /** File path of the module that tried to require a module, ex. `/js/foo.js`. */
    originModulePath: string;
    /** The name of the module that was required, no necessarily a path, ex. `./bar`, or `invariant`. */
    targetModuleName: string;
    /** Original error that causes this error */
    cause: ?Error;

    constructor(
      originModulePath: string,
      targetModuleName: string,
      message: string,
      options?: Readonly<{
        dependency?: TransformResultDependency | null; // ?TransformResultDependency
        cause?: Error;
      }>
    );

    buildCodeFrameMessage(
      dependency: TransformResultDependency | null // ?TransformResultDependency
    ): string | null; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/DependencyGraph/createFileMap.js
declare module '@expo/metro/metro/node-haste/DependencyGraph/createFileMap' {
  import type { ConfigT } from '@expo/metro/metro-config';
  import type MetroFileMap from '@expo/metro/metro-file-map';

  export default function createFileMap(
    config: ConfigT,
    options?: Readonly<{
      extractDependencies?: boolean;
      watch?: boolean;
      throwOnModuleCollision?: boolean;
      cacheFilePrefix?: string;
    }>
  ): MetroFileMap;
}

// #region /node-haste/lib/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/lib/AssetPaths.js
declare module '@expo/metro/metro/node-haste/lib/AssetPaths' {
  export type AssetPath = {
    assetName: string;
    name: string;
    platform: string | null; // ?string
    resolution: number;
    type: string;
  };

  export function parse(filePath: string, platforms: ReadonlySet<string>): AssetPath;

  /**
   * Return `null` if the `filePath` doesn't have a valid extension, required
   * to describe the type of an asset.
   */
  export function tryParse(filePath: string, platforms: ReadonlySet<string>): AssetPath | null; // ?AssetPath
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/node-haste/lib/parsePlatformFilePath.js
declare module '@expo/metro/metro/node-haste/lib/parsePlatformFilePath' {
  type PlatformFilePathParts = {
    dirPath: string;
    baseName: string;
    platform: string | null; // ?string
    extension: string | null; // ?string
  };

  /**
   * Extract the components of a file path that can have a platform specifier: Ex.
   * `index.ios.js` is specific to the `ios` platform and has the extension `js`.
   */
  export default function parsePlatformFilePath(
    filePath: string,
    platforms: ReadonlySet<string>
  ): PlatformFilePathParts;
}

// #region /shared/output/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle.js
declare module '@expo/metro/metro/shared/output/RamBundle' {
  import type Server from '@expo/metro/metro/Server';
  import type { RamBundleInfo } from '@expo/metro/metro/DeltaBundler/Serializers/getRamBundleInfo';
  import type { OutputOptions, RequestOptions } from '@expo/metro/metro/shared/types';

  export function build(
    packagerClient: Server,
    requestOptions: RequestOptions
  ): Promise<RamBundleInfo>;

  export function save(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (x: string) => void
  ): Promise<mixed>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/bundle.js
declare module '@expo/metro/metro/shared/output/bundle' {
  import type { OutputOptions, RequestOptions } from '@expo/metro/metro/shared/types';

  export const formatName: 'bundle';

  export function build(
    packagerClient: Server,
    requestOptions: RequestOptions
  ): Promise<{
    code: string;
    map: string;
    [key: string]: any; // ...
  }>;

  export function save(
    bundle: {
      code: string;
      map: string;
      [key: string]: any; // ...
    },
    options: OutputOptions,
    log: (...args: string[]) => void
  ): Promise<any>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/meta.js
declare module '@expo/metro/metro/shared/output/meta' {
  export function meta(
    code: Buffer | string,
    encoding: 'ascii' | 'utf16le' | 'utf8' = 'utf8'
  ): Buffer;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/unbundle.js
declare module '@expo/metro/metro/shared/output/unbundle' {
  export { build, save } from '@expo/metro/metro/shared/output/RamBundle';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/writeFile.js
declare module '@expo/metro/metro/shared/output/writeFile' {
  export function writeFile(
    file: string,
    data: string | Buffer,
    encoding?: string | null // ?string
  ): Promise<any>;
}

// #region /shared/output/RamBundle/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/as-assets.js
declare module '@expo/metro/metro/shared/output/RamBundle/as-assets' {
  import type { RamBundleInfo } from '@expo/metro/metro/DeltaBundler/Serializers/getRamBundleInfo';
  import type { OutputOptions } from '@expo/metro/metro/shared/types';

  /**
   * Saves all JS modules of an app as single files
   * The startup code (prelude, polyfills etc.) are written to the file
   * designated by the `bundleOuput` option.
   * All other modules go into a 'js-modules' folder that in the same parent
   * directory as the startup file.
   */
  export default function saveAsAssets(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (...args: string[]) => void
  ): Promise<any>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/as-indexed-file.js
declare module '@expo/metro/metro/shared/output/RamBundle/as-indexed-file' {
  import type { RamBundleInfo } from '@expo/metro/metro/DeltaBundler/Serializers/getRamBundleInfo';
  import type { OutputOptions } from '@expo/metro/metro/shared/types';

  /**
   * Saves all JS modules of an app as a single file, separated with null bytes.
   * The file begins with an offset table that contains module ids and their
   * lengths/offsets.
   * The module id for the startup code (prelude, polyfills etc.) is the
   * empty string.
   */
  export default function saveAsIndexedFile(
    bundle: RamBundleInfo,
    options: OutputOptions,
    log: (...args: string[]) => void
  ): Promise<any>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/buildSourcemapWithMetadata.js
declare module '@expo/metro/metro/shared/output/RamBundle/buildSourcemapWithMetadata' {
  import type { ModuleGroups, ModuleTransportLike } from '@expo/metro/metro/shared/types';
  import type { IndexMap } from '@expo/metro/metro-source-map';

  type Params = {
    fixWrapperOffset: boolean;
    lazyModules: readonly ModuleTransportLike[];
    moduleGroups: ModuleGroups | null; // ?ModuleGroups
    startupModules: readonly ModuleTransportLike[];
  };

  export default function buildSourcemapWithMetadata(options: Params): IndexMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/magic-number.js
declare module '@expo/metro/metro/shared/output/RamBundle/magic-number' {
  const magicNumber: 0xfb0bd1e5;
  export default magicNumber;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/util.js
declare module '@expo/metro/metro/shared/output/RamBundle/util' {
  import type { ModuleGroups, ModuleTransportLike } from '@expo/metro/metro/shared/types';
  import type { BasicSourceMap, IndexMap } from '@expo/metro/metro-source-map';

  type CombineOptions = {
    fixWrapperOffset: boolean;
    [key: string]: any; // ...
  };

  export { default as countLines } from '@expo/metro/metro/lib/countLines';

  export function combineSourceMaps(
    modules: readonly ModuleTransportLike[],
    moduleGroups?: ModuleGroups,
    options?: CombineOptions | null // ?CombineOptions
  ): IndexMap;

  export function combineSourceMapsAddingOffsets(
    modules: readonly ModuleTransportLike[],
    x_metro_module_paths: string[],
    moduleGroups?: ModuleGroups | null, // ?ModuleGroups
    options?: CombineOptions | null // ?CombineOptions
  ): IndexMap;

  export function joinModules(
    modules: readonly {
      code: string;
      [key: string]: any; // ...
    }[]
  ): string;

  export function lineToLineSourceMap(source: string, filename: string = ''): BasicSourceMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/shared/output/RamBundle/write-sourcemap.js
declare module '@expo/metro/metro/shared/output/RamBundle/write-sourcemap' {
  export default function writeSourcemap(
    fileName: string,
    contents: string,
    log: (...args: string[]) => void
  ): Promise<any>;
}
