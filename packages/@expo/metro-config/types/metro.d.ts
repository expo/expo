// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Assets.js
declare module '@expo/metro-config/metro/Assets' {
  // Note(cedric): this seems like a typo in the type definitions
  import type { AssetData, AssetDataWithoutFiles } from 'metro/src/Asset';

  export { AssetData, AssetDataWithoutFiles };

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
declare module '@expo/metro-config/metro/HmrServer' {
  import {
    type default as IncrementalBundler,
    type RevisionId,
  } from '@expo/metro-config/metro/IncrementalBundler';
  import type { GraphOptions } from '@expo/metro-config/metro/shared/types';
  import type { ConfigT, RootPerfLogger } from '@expo/metro-config/metro-config';
  import type {
    HmrErrorMessage,
    HmrUpdateMessage,
  } from '@expo/metro-config/metro-runtime/modules/types.flow';
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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/HmrServer.js
declare module '@expo/metro-config/metro/Server' {
  export * from 'metro/src/Server';
  export { default } from 'metro/src/Server'; // Temporary workaround to export defaults
}

// #region Bundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/Bundler/util.js
declare module '@expo/metro-config/metro/Bundler/util' {
  import type { File as BabelFile } from '@babel/types';
  import { AssetDataWithoutFiles } from '@expo/metro-config/metro/Assets';
  import type { ModuleTransportLike } from 'metro/src/shared/types';

  type SubTree<T extends ModuleTransportLike> = (
    moduleTransport: T,
    moduleTransportsByPath: Map<string, T>
  ) => Iterable<number>;

  function generateAssetCodeFileAst(
    assetRegistryPath: string,
    assetDescriptor: AssetDataWithoutFiles
  ): BabelFile;

  function createRamBundleGroups<T extends ModuleTransportLike>(
    ramGroups: readonly string[],
    groupableModules: readonly T[],
    subtree: SubTree<T>
  ): Map<number, Set<number>>;
}

// #region DeltaBundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/types.flow.js
declare module '@expo/metro-config/metro/DeltaBundler/types.flow' {
  // TODO(cedric): check if we can drop this types.flow, as the actual typescript types exist
  export type * from 'metro/src/DeltaBundler/types';
}

// #region DeltaBundler/Serializers/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js
declare module 'metro/src/DeltaBundler/Serializers/baseJSBundle' {
  import type { Module, ReadOnlyGraph, SerializerOptions } from 'metro/src/DeltaBundler/types';
  import type { Bundle } from '@expo/metro-config/metro-runtime/modules/types.flow';

  function baseJSBundle(
    entryPoint: string,
    preModules: readonly Module[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Bundle;

  export = baseJSBundle;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/sourceMapGenerator.js
declare module '@expo/metro-config/metro/DeltaBundler/Serializers/sourceMapGenerator' {
  import type { Module } from '@expo/metro-config/metro/DeltaBundler/types';
  import type {
    fromRawMappings,
    fromRawMappingsNonBlocking,
  } from '@expo/metro-config/metro-source-map';

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

// #region DeltaBundler/Serializers/helpers/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/DeltaBundler/Serializers/helpers/js.js
declare module '@expo/metro-config/metro/DeltaBundler/Serializers/helpers/js' {
  import type { JsOutput } from 'metro-transform-worker';
  import type { AssetDataWithoutFiles, MixedOutput, Module } from 'metro';

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

// #region IncrementalBundler/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/IncrementalBundler.js
declare module '@expo/metro-config/metro/IncrementalBundler' {
  import type {
    default as OriginalIncrementalBundler,
    OtherOptions,
  } from 'metro/src/IncrementalBundler';
  import type { ResolverInputOptions } from 'metro/src/shared/types';
  import type {
    ReadOnlyDependencies,
    TransformInputOptions,
  } from '@expo/metro-config/metro/DeltaBundler/types';

  export type * from 'metro/src/IncrementalBundler';

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

// #region lib/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/bundleToString.js
declare module '@expo/metro-config/metro/lib/bundleToString' {
  import type { Bundle, BundleMetadata } from '@expo/metro-config/metro-runtime/modules/types.flow';

  function bundleToString(bundle: Bundle): {
    code: string;
    metadata: BundleMetadata;
  };

  export = bundleToString;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/countLines.js
declare module '@expo/metro-config/metro/lib/countLines' {
  function countLines(string: string): number;

  export = countLines;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/createWebsocketServer.js
declare module '@expo/metro-config/metro/lib/createWebsocketServer' {
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
  function createWebsocketServer<TClient extends object>(
    service: HMROptions<TClient>
  ): WebSocketServer;

  export = createWebsocketServer;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/getAppendScripts.js
declare module '@expo/metro-config/metro/lib/getAppendScripts' {
  import type { Module } from 'metro/src/DeltaBundler';

  type Options<T extends number | string> = Readonly<{
    asyncRequireModulePath: string;
    createModuleId: (path: string) => T;
    getRunModuleStatement: (moduleId: T) => string;
    inlineSourceMap?: boolean | null; // ?boolean
    runBeforeMainModule: readonly string[];
    runModule: boolean;
    shouldAddToIgnoreList: (module: Module) => boolean;
    sourceMapUrl?: string | null; // ?string
    sourceUrl?: string | null; // ?string
    [key: string]: any; // ...
  }>;

  function getAppendScripts<T extends number | string>(
    entryPoint: string,
    modules: readonly Module[],
    options: Options<T>
  ): readonly Module[];

  export = getAppendScripts;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/lib/splitBundleOptions.js
declare module '@expo/metro-config/metro/lib/splitBundleOptions' {
  import type { BundleOptions, SplitBundleOptions } from 'metro/src/shared/types';

  /**
   * Splits a BundleOptions object into smaller, more manageable parts.
   */
  function splitBundleOptions(options: BundleOptions): SplitBundleOptions;

  export = splitBundleOptions;
}

// #region ModuleGraph/worker/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/worker/generateImportNames.js
declare module '@expo/metro-config/metro/ModuleGraph/worker/generateImportNames' {
  import type { Node } from '@babel/types';

  /**
   * Select unused names for "metroImportDefault" and "metroImportAll", by calling "generateUid".
   */
  function generateImportNames(ast: Node): {
    importAll: string;
    importDefault: string;
  };

  export = generateImportNames;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro/src/ModuleGraph/worker/JsFileWrapping.js
declare module '@expo/metro-config/metro/ModuleGraph/worker/JsFileWrapping' {
  import type { File as BabelFile } from '@babel/types';

  export const WRAP_NAME: '$$_REQUIRE'; // note: babel will prefix this with _

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

  export function wrapPolyfill(fileAst: BabelFile): BabelFile;

  export function wrapJson(source: string, globalPrefix: string): string;

  export function jsonToCommonJS(source: string): string;
}
