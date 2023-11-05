/// <reference types="node" />
/// <reference types="metro" />
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
import type { TransformResultDependency } from 'metro/src/DeltaBundler';
interface TransformResponse {
    readonly dependencies: ReadonlyArray<TransformResultDependency>;
    readonly output: ReadonlyArray<JsOutput>;
}
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
export {};
