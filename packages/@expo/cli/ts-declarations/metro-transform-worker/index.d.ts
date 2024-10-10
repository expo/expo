// #region metro-transform-worker
declare module 'metro-transform-worker' {
  export * from 'metro-transform-worker/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-worker/src/index.js
declare module 'metro-transform-worker/src/index' {
  import type * as _babel_types from '@babel/types';
  import type { CustomTransformOptions, TransformProfile } from 'metro-babel-transformer';
  import type {
    BasicSourceMap,
    FBSourceFunctionMap,
    MetroSourceMapSegmentTuple,
  } from 'metro-source-map';
  import type { TransformResultDependency } from 'metro/src/DeltaBundler';
  import type { AllowOptionalDependencies } from 'metro/src/DeltaBundler/types.flow.js';
  import type { DynamicRequiresBehavior } from 'metro/src/ModuleGraph/worker/collectDependencies';
  export type MinifierConfig = Readonly<{
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
    /** Enable `require.context` statements which can be used to import multiple files in a directory. */
    unstable_allowRequireContext: boolean;
    /** Whether to rename scoped `require` functions to `_$$_REQUIRE`, usually an extraneous operation when serializing to iife (default). */
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
    unstable_transformProfile: TransformProfile;
  }>;
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
  export type JsOutput = Readonly<{
    data: Readonly<{
      code: string;
      lineCount: number;
      map: MetroSourceMapSegmentTuple[];
      functionMap?: null | FBSourceFunctionMap;
    }>;
    type: JSFileType;
  }>;
  export type TransformResponse = Readonly<{
    dependencies: readonly TransformResultDependency[];
    output: readonly JsOutput[];
  }>;
  export { default as getCacheKey } from 'metro-cache-key';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-worker/src/utils/assetTransformer.js
declare module 'metro-transform-worker/src/utils/assetTransformer' {
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

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-worker/src/utils/getMinifier.js
declare module 'metro-transform-worker/src/utils/getMinifier' {
  import type { Minifier } from 'metro-transform-worker/src/index';
  function getMinifier(minifierPath: string): Minifier;
  export default getMinifier;
}
