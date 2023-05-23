/// <reference types="node" />
import { JsTransformerConfig, JsTransformOptions, TransformResponse } from 'metro-transform-worker';
/**
 * The staticCssTransform will convert a CSS to static style objects.
 */
export declare function staticCssTransform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
