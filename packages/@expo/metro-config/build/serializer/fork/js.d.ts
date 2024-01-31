/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the metro helper, but with bundle splitting support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/helpers/js.js#L1
 */
import type { MixedOutput, Module } from 'metro';
import type { JsOutput } from 'metro-transform-worker';
export type Options = {
    createModuleId: (module: string) => number | string;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl: string | undefined;
    splitChunks: boolean;
    skipWrapping: boolean;
    computedAsyncModulePaths: Record<string, string> | null;
};
export declare function wrapModule(module: Module, options: Options): {
    src: string;
    paths: Record<string, string>;
};
export declare function getModuleParams(module: Module, options: Pick<Options, 'createModuleId' | 'sourceUrl' | 'includeAsyncPaths' | 'serverRoot' | 'splitChunks' | 'dev' | 'projectRoot' | 'computedAsyncModulePaths'>): {
    params: any[];
    paths: Record<string, string>;
};
export declare function getJsOutput(module: {
    output: readonly MixedOutput[];
    path?: string;
}): JsOutput;
export declare function isJsModule(module: Module): boolean;
export declare function isJsOutput(output: MixedOutput): output is MixedOutput;
