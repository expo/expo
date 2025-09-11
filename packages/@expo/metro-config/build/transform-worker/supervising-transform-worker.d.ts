import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
import type { TransformResponse } from './transform-worker';
declare module '@expo/metro/metro-transform-worker' {
    interface JsTransformerConfig {
        expo_customTransformerPath?: string;
    }
}
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
