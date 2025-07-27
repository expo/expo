/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with additional transforms moved to `babel-preset-expo` and modifications made for web support.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/index.js#L1
 */
import { types as t } from '@babel/core';
import type { ParseResult } from '@babel/core';
import type { MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';
import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';
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
export declare const minifyCode: (config: Pick<JsTransformerConfig, "minifierPath" | "minifierConfig">, filename: string, code: string, source: string, map: MetroSourceMapSegmentTuple[], reserved?: string[]) => Promise<{
    code: string;
    map: MetroSourceMapSegmentTuple[];
}>;
export declare function applyImportSupport<TFile extends t.File>(ast: TFile, { filename, options, importDefault, importAll, collectLocations, }: {
    filename: string;
    options: Pick<JsTransformOptions, 'experimentalImportSupport' | 'inlineRequires' | 'nonInlinedRequires' | 'customTransformOptions'>;
    importDefault: string;
    importAll: string;
    collectLocations?: boolean;
}): {
    ast: TFile;
    metadata?: any;
};
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function getCacheKey(config: JsTransformerConfig): string;
export declare function collectDependenciesForShaking(ast: ParseResult, options: CollectDependenciesOptions): Readonly<{
    ast: import("@babel/parser").ParseResult<t.File>;
    dependencyMapName: string;
    dependencies: readonly Readonly<{
        data: import("./collect-dependencies").DependencyData;
        name: string;
    }>[];
}>;
