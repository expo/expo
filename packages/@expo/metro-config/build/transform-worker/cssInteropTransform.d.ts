/// <reference types="node" />
import { JsTransformerConfig, JsTransformOptions, TransformResponse } from 'metro-transform-worker';
export declare function cssInteropTransform(config: JsTransformerConfig & {
    externallyManagedCss?: Record<string, string>;
}, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
