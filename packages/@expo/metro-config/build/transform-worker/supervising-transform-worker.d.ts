import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import type { TransformResponse } from './transform-worker';
import type { ExpoJsTransformerConfig } from './types';
export declare function transform(config: ExpoJsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
