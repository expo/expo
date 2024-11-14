/// <reference types="node" />
import * as babylon from '@babel/parser';
import * as t from '@babel/types';
import type { MetroSourceMapSegmentTuple } from 'metro-source-map';
import { JsTransformerConfig, JsTransformOptions } from 'metro-transform-worker';
import { InvalidRequireCallError as InternalInvalidRequireCallError, CollectedDependencies, Options as CollectDependenciesOptions } from './collect-dependencies';
import { ExpoJsOutput } from '../serializer/jsOutput';
export { JsTransformOptions };
interface TransformResponse {
    readonly dependencies: CollectedDependencies['dependencies'];
    readonly output: readonly ExpoJsOutput[];
}
export declare class InvalidRequireCallError extends Error {
    innerError: InternalInvalidRequireCallError;
    filename: string;
    constructor(innerError: InternalInvalidRequireCallError, filename: string);
}
export declare const minifyCode: (config: Pick<JsTransformerConfig, 'minifierPath' | 'minifierConfig'>, filename: string, code: string, source: string, map: MetroSourceMapSegmentTuple[], reserved?: string[]) => Promise<{
    code: string;
    map: MetroSourceMapSegmentTuple[];
}>;
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
            css?: {
                url: string;
                supports: string | null;
                media: string | null;
            } | undefined;
        }>;
        name: string;
    }>[];
}>;
