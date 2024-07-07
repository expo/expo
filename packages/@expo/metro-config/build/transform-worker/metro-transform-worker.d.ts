/// <reference types="node" />
import * as babylon from '@babel/parser';
import * as t from '@babel/types';
import type { MetroSourceMapSegmentTuple } from 'metro-source-map';
import { JsOutput, JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
import { CollectedDependencies, Options as CollectDependenciesOptions } from './collect-dependencies';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: CollectedDependencies['dependencies'];
    readonly output: readonly ExpoJsOutput[];
}
export type ExpoJsOutput = Pick<JsOutput, 'type'> & {
    readonly data: JsOutput['data'] & {
        readonly hasCjsExports?: boolean;
        readonly reactClientReference?: string;
        readonly ast?: t.File;
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
export declare function applyImportSupport<TFile extends t.File>(ast: TFile, { filename, options, importDefault, importAll, }: {
    filename: string;
    options: Pick<JsTransformOptions, 'experimentalImportSupport' | 'inlineRequires' | 'nonInlinedRequires'>;
    importDefault: string;
    importAll: string;
}): TFile;
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
export declare function collectDependenciesForShaking(ast: babylon.ParseResult<t.File>, options: CollectDependenciesOptions): Readonly<{
    ast: babylon.ParseResult<t.File>;
    dependencyMapName: string;
    dependencies: readonly Readonly<{
        data: Readonly<{
            key: string;
            asyncType: import("./collect-dependencies").AsyncDependencyType | null;
            isOptional?: boolean | undefined;
            locs: readonly t.SourceLocation[];
            contextParams?: Readonly<{
                recursive: boolean;
                filter: Readonly<Readonly<{
                    pattern: string;
                    flags: string;
                }>>;
                mode: "sync" | "eager" | "lazy" | "lazy-once";
            }> | undefined;
            exportNames: string[];
        }>;
        name: string;
    }>[];
}>;
