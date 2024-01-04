/// <reference types="node" />
/// <reference types="metro" />
import type { TransformResultDependency } from 'metro/src/DeltaBundler';
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: readonly TransformResultDependency[];
    readonly output: readonly JsOutput[];
}
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
