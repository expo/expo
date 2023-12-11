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
    arg2: (...args: string[]) => void
  ): Promise<unknown>;
}

declare module 'metro/src/HmrServer' {
  export class MetroHmrServer {
    constructor(...args: any[]);
  }

  export default MetroHmrServer;
}

declare module 'metro/src/ModuleGraph/worker/collectDependencies' {
  import { NodePath } from '@babel/traverse';
  import { SourceLocation, CallExpression, Identifier, StringLiteral } from '@babel/types';
  import { AsyncDependencyType } from 'metro/src/DeltaBundler';

  export type Dependency = readonly {
    data: DependencyData;
    name: string;
  };

  export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
  };

  export type DynamicRequiresBehavior = 'throwAtRuntime' | 'reject';

  export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;

  type BabelNodeFile = any;

  export type CollectedDependencies = readonly {
    ast: BabelNodeFile;
    dependencyMapName: string;
    dependencies: readonly Dependency[];
  };

  export type Options = readonly {
    asyncRequireModulePath: string;
    dependencyMapName?: string;
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer?: DependencyTransformer;
    /** Enable `require.context` statements which can be used to import multiple files in a directory. */
    unstable_allowRequireContext: boolean;
  };

  type DependencyData = Readonly<{
    key: string;
    asyncType: AsyncDependencyType | null;
    isOptional?: boolean;
    locs: readonly SourceLocation[];
    contextParams?: RequireContextParams;
  }>;

  export type MutableInternalDependency = DependencyData & {
    locs: SourceLocation[];
    index: number;
    name: string;
  };

  export type InternalDependency = Readonly<MutableInternalDependency>;

  type DependencyRegistry = unknown;

  export type State = {
    asyncRequireModulePathStringLiteral: StringLiteral | null;
    dependencyCalls: Set<string>;
    dependencyRegistry: DependencyRegistry;
    dependencyTransformer: DependencyTransformer;
    dynamicRequires: DynamicRequiresBehavior;
    dependencyMapIdentifier: Identifier | null;
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    unstable_allowRequireContext: boolean;
  };

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

  function collectDependencies(ast: BabelNodeFile, options: Options): CollectedDependencies;

  export class InvalidRequireCallError extends Error {
    constructor(node: NodePath, message?: string);
  }

  export default collectDependencies;
}

declare module 'metro/src/DeltaBundler/types.flow' {
  export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
  };

  export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
}
declare module 'metro/src/ModuleGraph/worker/generateImportNames' {
  import * as t from '@babel/types';

  export default function generateImportNames(ast: t.File): {
    importAll: string;
    importDefault: string;
  };
}
declare module 'metro/src/ModuleGraph/worker/JsFileWrapping' {
  // Assuming the types for these imports are defined in their respective type declaration files
  import * as t from '@babel/types';

  // Example of how to declare types for a simple function
  function wrapModule(
    fileAst: t.File, // assuming t.File is a type from @babel/types
    importDefaultName: string,
    importAllName: string,
    dependencyMapName: string,
    globalPrefix: string
  ): { ast: t.File; requireName: string };

  declare function jsonToCommonJS(source: string): string;

  declare function wrapJson(source: string, globalPrefix: string): string;

  declare function wrapPolyfill(fileAst: t.File): t.File;

  // Constants
  declare const WRAP_NAME: string;

  // Module exports
  export { WRAP_NAME, wrapJson, jsonToCommonJS, wrapModule, wrapPolyfill };
}
declare module 'metro/src/DeltaBundler' {
  import { SourceLocation } from '@babel/types';
  export type AsyncDependencyType = 'async' | 'prefetch';
  export type TransformResultDependency = {
    /**
     * The literal name provided to a require or import call. For example 'foo' in
     * case of `require('foo')`.
     */
    name: string;

    /**
     * Extra data returned by the dependency extractor.
     */
    data: {
      /**
       * A locally unique key for this dependency within the current module.
       */
      key: string;
      /**
       * If not null, this dependency is due to a dynamic `import()` or `__prefetchImport()` call.
       */
      asyncType: AsyncDependencyType | null;
      /**
       * The condition for splitting on this dependency edge.
       */
      splitCondition?: {
        mobileConfigName: string;
      };
      /**
       * The dependency is enclosed in a try/catch block.
       */
      isOptional?: boolean;

      locs: readonly SourceLocation[];

      /** Context for requiring a collection of modules. */
      contextParams?: RequireContextParams;
    };
  };
}

declare module 'metro/src/lib/countLines' {
  const countLines = (string: string) => number;

  module.exports = countLines;
  export default countLines;
}

declare module 'metro/src/lib/createWebsocketServer' {
  export function createWebsocketServer<TClient extends object>({
    websocketServer,
  }: HMROptions<TClient>): typeof import('ws').Server;

  module.exports = createWebsocketServer;
}

declare module 'metro/src/DeltaBundler/Serializers/sourceMapGenerator' {
  import type { Module } from 'metro';

  export type SourceMapGeneratorOptions = {
    excludeSource: boolean;
    processModuleFilter: (module: Module) => boolean;
    shouldAddToIgnoreList: (module: Module) => boolean;
  };
}
declare module 'metro/src/DeltaBundler/Serializers/sourceMapString' {
  import type { SourceMapGeneratorOptions } from 'metro/src/DeltaBundler/Serializers/sourceMapGenerator';
  import type { Module } from 'metro';

  function sourceMapString(
    modules: readonly Array<Module>,
    options: SourceMapGeneratorOptions
  ): string;

  export default sourceMapString;
}

declare module 'metro/src/DeltaBundler/Serializers/getAssets' {
  import { ConfigT } from 'metro-config';

  function getMetroAssets(
    dependencies: ReadOnlyDependencies,
    options: {
      processModuleFilter: ConfigT['serializer']['processModuleFilter'];
      assetPlugins: ConfigT['transformer']['assetPlugins'];
      platform: string;
      projectRoot: string;
      publicPath: string;
    }
  );

  export default getMetroAssets;
}

declare module 'metro/src/lib/splitBundleOptions' {
  import type { SplitBundleOptions } from 'metro/src/shared/types';

  function splitBundleOptions(options: BundleOptions): SplitBundleOptions;

  export default splitBundleOptions;
}

declare module 'metro/src/DeltaBundler/Serializers/helpers/js' {
  import type { JsOutput } from 'metro-transform-worker';
  import type { MixedOutput, Module } from 'metro';

  export function getJsOutput(
    module: readonly {
      output: readonly MixedOutput[];
      path?: string;
    }
  ): JsOutput;

  export function isJsModule(module: Module<unknown>): boolean;
}

declare module 'metro/src/Bundler/util' {
  import type { ParseResult } from '@babel/core';
  import { AssetData } from 'metro/src/Assets';
  export function generateAssetCodeFileAst(
    assetRegistryPath: string,
    assetDescriptor: AssetData
  ): ParseResult;
}

declare module 'metro/src/Assets' {
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
    height: number | null;
    httpServerLocation: string;
    name: string;
    scales: number[];
    type: string;
    width: number | null;
  };

  import { AssetData, AssetDataWithoutFiles } from 'metro';

  export { AssetData, AssetDataWithoutFiles };

  export type AssetDataPlugin = (assetData: AssetData) => AssetData | Promise<AssetData>;

  export async function getAsset(
    relativePath: string,
    projectRoot: string,
    watchFolders: readonly string[],
    platform: string | null | undefined,
    assetExts: readonly string[]
  ): Promise<Buffer>;

  export async function getAssetData(
    assetPath: string,
    localPath: string,
    assetDataPlugins: readonly string[],
    platform: string | null | undefined,
    publicPath: string
  ): Promise<AssetData>;
}

declare module 'metro' {
  export * from 'metro/src/index.d.ts';

  // Exports `Server` from 'metro' since TypeScript re-exporting doesn't work for default exports.
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/types/index.d.ts#L14
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/types/Server.d.ts#L89
  export { default as Server } from 'metro/src/Server';

  // Exports `createConnectMiddleware` from 'metro' as a typo fix.
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/types/index.d.ts#L129
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/src/index.flow.js#L199
  export { createConnectMiddleWare as createConnectMiddleware } from 'metro/src/index.d';
}

declare module 'metro/src/DeltaBundler/Serializers/baseJSBundle' {
  import { ReadOnlyGraph, MixedOutput, Module, Graph, SerializerOptions } from 'metro';

  type ModuleMap = readonly [number, string][];

  type Bundle = {
    readonly modules: ModuleMap;
    readonly post: string;
    readonly pre: string;
  };

  export default function baseJSBundle(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Bundle;
}

declare module 'metro/src/lib/bundleToString' {
  type ModuleMap = readonly [number, string][];

  type Bundle = {
    readonly modules: ModuleMap;
    readonly post: string;
    readonly pre: string;
  };

  type BundleMetadata = {
    readonly pre: number;
    readonly post: number;
    readonly modules: readonly [number, number][];
  };

  export default function bundleToString(bundle: Bundle): {
    readonly code: string;
    readonly metadata: BundleMetadata;
  };
}

declare module 'metro/src/lib/getAppendScripts' {
  function getAppendScripts(
    entryPoint: string,
    modules: readonly Module<MixedOutput>[],
    options: SerializerOptions
  ): Module<MixedOutput>[];

  export default getAppendScripts;
  module.exports = getAppendScripts;
}

declare module 'metro/src/IncrementalBundler' {
  import type OriginalIncrementalBundler from 'metro/src/IncrementalBundler.d';

  // Overrides the `IncrementalBundler.getDependencies` returned type for inconsistent
  // ReadOnlyDependencies<void> <-> ReadOnlyDependencies<> type.
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/src/IncrementalBundler.js#L159
  // https://github.com/facebook/metro/blob/40f9f068109f27ccd80f45f861501a8839f36d85/packages/metro/types/IncrementalBundler.d.ts#L66
  export default class IncrementalBundler extends OriginalIncrementalBundler {
    getDependencies(
      entryFiles: readonly string[],
      transformOptions: TransformInputOptions,
      resolverOptions: ResolverInputOptions,
      otherOptions?: OtherOptions
    ): Promise<ReadOnlyDependencies>;
  }
}
