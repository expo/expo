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

  module.exports = MetroHmrServer;
}

declare module 'metro/src/ModuleGraph/worker/collectDependencies' {
  export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
  };

  export type DynamicRequiresBehavior = 'throwAtRuntime' | 'reject';

  export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
}

declare module 'metro/src/DeltaBundler/types.flow' {
  export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
  };

  export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
}
declare module 'metro/src/DeltaBundler' {
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

      locs: $ReadOnlyArray<BabelSourceLocation>;

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

declare module 'metro/src/Assets' {
  export type AssetInfo = {
    files: string[];
    hash: string;
    name: string;
    scales: number[];
    type: string;
  };

  export type AssetDataWithoutFiles = {
    __packager_asset: boolean;
    fileSystemLocation: string;
    hash: string;
    height: number | null;
    httpServerLocation: string;
    name: string;
    scales: number[];
    type: string;
    width: number | null;
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

  export type AssetData = AssetDataWithoutFiles & { files: string[] };

  export type AssetDataPlugin = (assetData: AssetData) => AssetData | Promise<AssetData>;

  export async function getAsset(
    relativePath: string,
    projectRoot: string,
    watchFolders: readonly string[],
    platform: string | null | undefined,
    assetExts: readonly string[]
  ): Promise<Buffer>;

  async function getAssetData(
    assetPath: string,
    localPath: string,
    assetDataPlugins: readonly string[],
    platform: string | null | undefined,
    publicPath: string
  ): Promise<AssetData>;
}

declare module 'metro' {
  export * from 'metro/src/index.d';

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
  import { Module, Graph, SerializerOptions } from 'metro';

  type ModuleMap = readonly [number, string][];

  type Bundle = {
    readonly modules: ModuleMap;
    readonly post: string;
    readonly pre: string;
  };

  export default function baseJSBundle(
    entryPoint: string,
    preModules: readonly Module[],
    graph: Graph,
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
