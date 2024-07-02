/// <reference types="metro" />
/// <reference types="node" />
import * as babylon from '@babel/parser';
import * as types from '@babel/types';
import type { TransformResultDependency } from 'metro/src/DeltaBundler';
import type { Options as CollectDependenciesOptions } from 'metro/src/ModuleGraph/worker/collectDependencies';
import type { MetroSourceMapSegmentTuple } from 'metro-source-map';
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: readonly TransformResultDependency[];
    readonly output: readonly ExpoJsOutput[];
}
export type ExpoJsOutput = Pick<JsOutput, 'type'> & {
    readonly data: JsOutput['data'] & {
        readonly hasCjsExports?: boolean;
        readonly reactClientReference?: string;
        readonly reconcile?: ReconcileTransformSettings;
    };
};
export type ReconcileTransformSettings = {
    inlineRequires: boolean;
    importDefault: string;
    importAll: string;
    globalPrefix: string;
    unstable_renameRequire?: boolean;
    unstable_compactOutput?: boolean;
    minify?: {
        minifierPath: string;
        minifierConfig: JsTransformerConfig['minifierConfig'];
    };
    collectDependenciesOptions?: CollectDependenciesOptions;
    unstable_dependencyMapReservedName?: string;
    optimizationSizeLimit?: number;
    unstable_disableNormalizePseudoGlobals?: boolean;
    normalizePseudoGlobals: boolean;
};
export declare const minifyCode: (config: Pick<JsTransformerConfig, 'minifierPath' | 'minifierConfig'>, filename: string, code: string, source: string, map: MetroSourceMapSegmentTuple[], reserved?: string[]) => Promise<{
    code: string;
    map: MetroSourceMapSegmentTuple[];
}>;
export declare function renameTopLevelModuleVariables(): {
    visitor: {
        Program(path: any): void;
    };
};
export declare function applyImportSupport(ast: babylon.ParseResult<types.File>, { filename, options, importDefault, importAll, }: {
    filename: string;
    options: Pick<JsTransformOptions, 'experimentalImportSupport' | 'inlineRequires' | 'nonInlinedRequires'>;
    importDefault: string;
    importAll: string;
}): babylon.ParseResult<types.File>;
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
