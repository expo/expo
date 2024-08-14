// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-worker/src/index.js (entry point)
declare module '@expo/metro/metro-transform-worker' {
  export {
    type BytecodeFileType,
    type BytecodeOutput,
    type CustomTransformOptions,
    getCacheKey,
    type JSFileType,
    type JsOutput,
    type JsTransformerConfig,
    type JsTransformOptions,
    type Minifier,
    type MinifierConfig,
    type MinifierOptions,
    type MinifierResult,
    transform,
    type TransformResponse,
    type Type,
  } from 'metro-transform-worker';
}

// #region /utils/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-worker/src/utils/assetTransformer.js
declare module '@expo/metro/metro-transform-worker/utils/assetTransformer' {
  import type { File as BabelFile } from '@babel/types';
  import type { BabelTransformerArgs } from '@expo/metro/metro-babel-transformer';

  export function transform(
    options: BabelTransformerArgs,
    assetRegistryPath: string,
    assetDataPlugins: readonly string[]
  ): Promise<{ ast: BabelFile }>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-worker/src/utils/getMinifier.js
declare module '@expo/metro/metro-transform-worker/utils/getMinifier' {
  import type { Minifier } from '@expo/metro/metro-transform-worker';

  export default function getMinifier(minifierPath: string): Minifier;
}
