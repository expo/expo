// #region metro-transform-worker
declare module 'metro-transform-worker' {
  export * from 'metro-transform-worker/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-worker/src/index.js
declare module 'metro-transform-worker/private/index' {
  import type { CustomTransformOptions, TransformProfile } from 'metro-babel-transformer';
  import type {
    BasicSourceMap,
    FBSourceFunctionMap,
    MetroSourceMapSegmentTuple,
  } from 'metro-source-map';
  import type { AllowOptionalDependencies } from 'metro/private/DeltaBundler/types.flow';
  import type { DynamicRequiresBehavior } from 'metro/private/ModuleGraph/worker/collectDependencies';
  type MinifierConfig = Readonly<{
    [$$Key$$: string]: any;
  }>;
  export type MinifierOptions = {
    code: string;
    map?: null | BasicSourceMap;
    filename: string;
    reserved: readonly string[];
    config: MinifierConfig;
  };
  export type MinifierResult = {
    code: string;
    map?: BasicSourceMap;
  };
  export type Minifier = ($$PARAM_0$$: MinifierOptions) => MinifierResult | Promise<MinifierResult>;
  export type Type = 'script' | 'module' | 'asset';
  export type JsTransformerConfig = Readonly<{
    assetPlugins: readonly string[];
    assetRegistryPath: string;
    asyncRequireModulePath: string;
    babelTransformerPath: string;
    dynamicDepsInPackages: DynamicRequiresBehavior;
    enableBabelRCLookup: boolean;
    enableBabelRuntime?: boolean | string;
    globalPrefix: string;
    hermesParser: boolean;
    minifierConfig: MinifierConfig;
    minifierPath: string;
    optimizationSizeLimit: number;
    publicPath: string;
    allowOptionalDependencies: AllowOptionalDependencies;
    unstable_dependencyMapReservedName?: null | string;
    unstable_disableModuleWrapping: boolean;
    unstable_disableNormalizePseudoGlobals: boolean;
    unstable_compactOutput: boolean;
    unstable_allowRequireContext: boolean;
    unstable_memoizeInlineRequires?: boolean;
    unstable_nonMemoizedInlineRequires?: readonly string[];
    unstable_renameRequire?: boolean;
  }>;
  export type { CustomTransformOptions } from 'metro-babel-transformer';
  export type JsTransformOptions = Readonly<{
    customTransformOptions?: CustomTransformOptions;
    dev: boolean;
    experimentalImportSupport?: boolean;
    hot: boolean;
    inlinePlatform: boolean;
    inlineRequires: boolean;
    minify: boolean;
    nonInlinedRequires?: readonly string[];
    platform?: null | string;
    type: Type;
    unstable_disableES6Transforms?: boolean;
    unstable_memoizeInlineRequires?: boolean;
    unstable_nonMemoizedInlineRequires?: readonly string[];
    unstable_staticHermesOptimizedRequire?: boolean;
    unstable_transformProfile: TransformProfile;
  }>;
  // NOTE(cedric): this is a manual change exporting these existing Flow types for reuse in Expo
  // See: https://github.com/facebook/metro/blob/3eeba3d459592aa5128995c8224933f6a23a43f1/packages/metro-transform-worker/src/index.js#L136-L168
  export type Path = string;
  export type BaseFile = Readonly<{
    code: string;
    filename: Path;
    inputFileSize: number;
  }>;
  export type AssetFile = Readonly<
    {
      type: 'asset';
    } & BaseFile
  >;
  export type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';
  export type JSFile = Readonly<
    {
      ast?: null | undefined | _babel_types.File;
      type: JSFileType;
      functionMap?: FBSourceFunctionMap | null;
      unstable_importDeclarationLocs?: ReadonlySet<string>;
    } & BaseFile
  >;
  export type JSONFile = {
    type: Type;
  } & BaseFile;
  export type TransformationContext = Readonly<{
    config: JsTransformerConfig;
    projectRoot: Path;
    options: JsTransformOptions;
  }>;
  // See: https://github.com/facebook/metro/blob/3eeba3d459592aa5128995c8224933f6a23a43f1/packages/metro-transform-worker/src/index.js#L180-L183
  export type TransformResponse = Readonly<{
    dependencies: readonly TransformResultDependency[];
    output: readonly JsOutput[];
  }>;
  // NOTE(cedric): this is a manual change exporting these existing Flow types for reuse in Expo
  export type JsOutput = Readonly<{
    data: Readonly<{
      code: string;
      lineCount: number;
      map: MetroSourceMapSegmentTuple[];
      functionMap?: null | FBSourceFunctionMap;
    }>;
    type: JSFileType;
  }>;
  export { getCacheKey } from 'metro-transform-worker/metro-cache-key';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-worker/src/utils/assetTransformer.js
declare module 'metro-transform-worker/private/utils/assetTransformer' {
  import type { File } from '@babel/types';
  import type { BabelTransformerArgs } from 'metro-babel-transformer';
  export function transform(
    $$PARAM_0$$: BabelTransformerArgs,
    assetRegistryPath: string,
    assetDataPlugins: readonly string[]
  ): Promise<{
    ast: File;
  }>;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-worker/src/utils/getMinifier.js
declare module 'metro-transform-worker/private/utils/getMinifier' {
  import type { Minifier } from 'metro-transform-worker/private/index';
  function getMinifier(minifierPath: string): Minifier;
  export default getMinifier;
}
