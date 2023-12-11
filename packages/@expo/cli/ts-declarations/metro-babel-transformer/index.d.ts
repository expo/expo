declare module 'metro-babel-transformer' {
  import type { FBSourceFunctionMap } from 'metro-source-map';
  import type { Ast, PluginItem, BabelFileMetadata } from '@babel/core';

  export type CustomTransformOptions = {
    [key: string]: unknown;
    __proto__: null;
  };

  export type TransformProfile = 'default' | 'hermes-stable' | 'hermes-canary';

  export type BabelTransformerOptions = {
    customTransformOptions?: CustomTransformOptions;
    dev: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRCLookup?: boolean;
    enableBabelRuntime: boolean;
    experimentalImportSupport?: boolean;
    hot: boolean;
    inlineRequires?: boolean;
    minify: boolean;
    unstable_disableES6Transforms?: boolean;
    platform: string | null;
    projectRoot: string;
    publicPath: string;
    extendsBabelConfigPath?: string;
    hermesParser?: boolean;
    globalPrefix?: string;
  };

  export type BabelTransformerArgs = {
    filename: string;
    options: BabelTransformerOptions;
    plugins?: PluginItem[];
    src: string;
  };

  export type BabelTransformer = {
    transform: (args: BabelTransformerArgs) => {
      ast: Ast;
      metadata?: BabelFileMetadata & {
        metro?: {
          functionMap?: FBSourceFunctionMap | null;
        };
      };
      code?: string | null;
      functionMap?: FBSourceFunctionMap | null;
    };
    getCacheKey?: () => string;
  };
}
