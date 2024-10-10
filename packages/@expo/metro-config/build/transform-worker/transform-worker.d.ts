/// <reference types="node" />
import type { JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
import * as worker from './metro-transform-worker';
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<worker.ExpoTransformResponse>;
