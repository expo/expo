/// <reference types="metro" />
/// <reference types="node" />
import type { TransformResultDependency } from 'metro/src/DeltaBundler';
import type { Options as CollectDependenciesOptions } from 'metro/src/ModuleGraph/worker/collectDependencies';
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: readonly TransformResultDependency[];
    readonly output: readonly ExpoJsOutput[];
}
export type ExpoJsOutput = Pick<JsOutput, 'type'> & {
    readonly data: JsOutput['data'] & {
        readonly collectDependenciesOptions?: CollectDependenciesOptions;
        readonly reactClientReference?: string;
    };
};
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
