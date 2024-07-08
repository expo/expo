/// <reference types="node" />
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
import { CollectedDependencies } from './collect-dependencies';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: CollectedDependencies['dependencies'];
    readonly output: readonly ExpoJsOutput[];
}
export type ExpoJsOutput = Pick<JsOutput, 'type'> & {
    readonly data: JsOutput['data'] & {
        readonly reactClientReference?: string;
    };
};
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
