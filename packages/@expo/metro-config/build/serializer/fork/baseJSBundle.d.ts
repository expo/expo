/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and better source map support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js#L1
 */
import type { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
export type ModuleMap = [number, string][];
export type Bundle = {
    modules: ModuleMap;
    post: string;
    pre: string;
    _expoSplitBundlePaths: [number, Record<string, string>][];
};
export declare function getPlatformOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: SerializerOptions): string | null;
export declare function getSplitChunksOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: SerializerOptions): boolean;
export declare function getBaseUrlOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: SerializerOptions): string;
export declare function baseJSBundle(entryPoint: string, preModules: readonly Module[], graph: Pick<ReadOnlyGraph, 'dependencies' | 'transformOptions'>, options: SerializerOptions): Bundle;
export declare function baseJSBundleWithDependencies(entryPoint: string, preModules: readonly Module[], dependencies: Module<MixedOutput>[], options: SerializerOptions & {
    platform: string;
    baseUrl: string;
    splitChunks: boolean;
}): Bundle;
