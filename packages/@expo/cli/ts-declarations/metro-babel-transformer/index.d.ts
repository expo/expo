// #region metro-babel-transformer
declare module 'metro-babel-transformer' {
  export * from 'metro-babel-transformer/src/index';
  export { default } from 'metro-babel-transformer/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-babel-transformer/src/index.js
declare module 'metro-babel-transformer/src/index' {
  import type * as _babel_types from '@babel/types';
  import type { BabelFileMetadata, TransformOptions } from '@babel/core';
  export type CustomTransformOptions = {
    [$$Key$$: string]: any;
  };
  export type TransformProfile = 'default' | 'hermes-stable' | 'hermes-canary';
  type BabelTransformerOptions = Readonly<{
    customTransformOptions?: CustomTransformOptions;
    dev: boolean;
    enableBabelRCLookup?: boolean;
    enableBabelRuntime?: boolean | string;
    extendsBabelConfigPath?: string;
    experimentalImportSupport?: boolean;
    hermesParser?: boolean;
    hot: boolean;
    minify: boolean;
    unstable_disableES6Transforms?: boolean;
    platform?: null | string;
    projectRoot: string;
    publicPath: string;
    unstable_transformProfile?: TransformProfile;
    globalPrefix: string;
    inlineRequires?: void;
  }>;
  export type BabelTransformerArgs = Readonly<{
    filename: string;
    options: BabelTransformerOptions;
    plugins?: TransformOptions['plugins'];
    src: string;
  }>;
  export type BabelFileFunctionMapMetadata = Readonly<{
    names: readonly string[];
    mappings: string;
  }>;
  export type MetroBabelFileMetadata = {
    metro?:
      | null
      | undefined
      | {
          functionMap?: null | undefined | BabelFileFunctionMapMetadata;
        };
  } & BabelFileMetadata;
  export type BabelTransformer = {
    transform: ($$PARAM_0$$: BabelTransformerArgs) => {
      ast: _babel_types.File;
      functionMap?: BabelFileFunctionMapMetadata;
      metadata?: MetroBabelFileMetadata & {
        // NOTE(cedric): manual change, see: babel-preset-expo/src/{client-module-proxy-plugin.ts,server-actions-plugin.ts}
        reactServerReference?: string;
        // NOTE(cedric): manual change, see: babel-preset-expo/src/client-module-proxy-plugin.ts
        reactClientReference?: string;
        // NOTE(cedric): manual change, see: babel-preset-expo/src/use-dom-directive-plugin.ts
        expoDomComponentReference?: string;
        // NOTE(cedric): manual change, see: babel-preset-expo/src/detect-dynamic-exports.ts
        hasCjsExports?: boolean;
      };
    };
    getCacheKey?: () => string;
  };
  const $$EXPORT_DEFAULT_DECLARATION$$: BabelTransformer;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}
