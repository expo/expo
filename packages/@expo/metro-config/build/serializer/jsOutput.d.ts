/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { types as t } from '@babel/core';
import type { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';
import type { JsTransformerConfig } from '@expo/metro/metro-transform-worker';
import { Options as CollectDependenciesOptions } from '../transform-worker/collect-dependencies';
export type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';
export type JsOutput = {
    data: {
        code: string;
        lineCount: number;
        map: MetroSourceMapSegmentTuple[];
        functionMap: FBSourceFunctionMap | null;
        css?: {
            code: string;
            lineCount: number;
            map: MetroSourceMapSegmentTuple[];
            functionMap: FBSourceFunctionMap | null;
        };
        ast?: t.File;
        hasCjsExports?: boolean;
        readonly reconcile?: ReconcileTransformSettings;
        readonly reactServerReference?: string;
        readonly reactClientReference?: string;
        readonly expoDomComponentReference?: string;
    };
    type: JSFileType;
};
export type CSSMetadata = {
    code: string;
    lineCount: number;
    map: unknown[];
    functionMap: null;
    skipCache?: boolean;
    externalImports: {
        url: string;
        supports: string | null;
        media: string | null;
    }[];
};
export type ExpoJsOutput = Omit<JsOutput, 'data'> & {
    data: JsOutput['data'] & {
        profiling?: {
            start: number;
            end: number;
            duration: number;
        };
        css?: CSSMetadata;
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
    collectDependenciesOptions: CollectDependenciesOptions;
    unstable_dependencyMapReservedName?: string | null;
    optimizationSizeLimit?: number;
    unstable_disableNormalizePseudoGlobals?: boolean;
    normalizePseudoGlobals: boolean;
};
export declare function isExpoJsOutput(output: any): output is ExpoJsOutput;
export declare function isTransformOptionTruthy(option: any): boolean;
