/// <reference types="node" />
import { JsTransformerConfig, JsTransformOptions, TransformResponse } from 'metro-transform-worker';
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
