import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
import type { TransformResponse } from './transform-worker';
declare module 'module' {
    namespace Module {
        interface ModuleExtensionFunction {
            (module: NodeJS.Module, filename: string): void;
        }
        const _extensions: {
            [ext: string]: ModuleExtensionFunction;
        };
        function _resolveFilename(request: string, parent: {
            id: string;
            filename: string;
            paths: string[];
        } | string | null, isMain?: boolean, options?: {
            paths?: string[];
        }): string;
    }
}
declare module '@expo/metro/metro-transform-worker' {
    interface JsTransformerConfig {
        expo_customTransformerPath?: string;
    }
}
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
