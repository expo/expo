// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-babel-transformer/src/index.js (entry point)
declare module '@expo/metro/metro-babel-transformer' {
  import type {
    BabelFileMetadata,
    ParseResult as BabelParseResult,
    PluginItem as BabelPluginItem,
  } from '@babel/core';
  import type { BabelTransformerArgs as OriginalBabelTransformerArgs } from 'metro-babel-transformer';
  import type { FBSourceFunctionMap } from 'metro-source-map';

  export {
    // BabelTransformer, - Overriden with babel types
    // BabelTransformerArgs, - Overriden with babel types
    BabelTransformerOptions,
    CustomTransformOptions,
    TransformProfile,
    // transform, - Overriden with babel types
  } from 'metro-babel-transformer';

  // Override the plugin from `unknown` to `BabelPluginItem`
  export type BabelTransformerArgs = OriginalBabelTransformerArgs & {
    plugins?: BabelPluginItem[];
  };

  // Override the transformer metadata from `unknown` to `BabelFileMetadata`
  export interface BabelTransformer {
    getCacheKey?: () => string;
    transform: (args: BabelTransformerArgs) => {
      ast: BabelParseResult;
      metadata: BabelFileMetadata & {
        reactClientReference?: string;
        hasCjsExports?: boolean;
        metro?: {
          functionMap?: FBSourceFunctionMap | null;
        };
      };
      code?: string | null;
      functionMap?: FBSourceFunctionMap | null;
    };
  }

  export const transform: BabelTransformer['transform'];
}
