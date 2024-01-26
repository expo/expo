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
};
export type ExpoSerializerOptions = SerializerOptions & {
    serializerOptions?: {
        baseUrl?: string;
        skipWrapping?: boolean;
        output?: string;
        includeBytecode?: boolean;
        includeSourceMaps?: boolean;
    };
    debugId?: string;
};
export declare function getPlatformOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: Pick<SerializerOptions, 'sourceUrl'>): string | null;
export declare function getSplitChunksOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: Pick<SerializerOptions, 'includeAsyncPaths' | 'sourceUrl'>): boolean;
export declare function getBaseUrlOption(graph: Pick<ReadOnlyGraph, 'transformOptions'>, options: Pick<ExpoSerializerOptions, 'serializerOptions'>): string;
export declare function baseJSBundle(entryPoint: string, preModules: readonly Module[], graph: Pick<ReadOnlyGraph, 'dependencies' | 'transformOptions'>, options: ExpoSerializerOptions): Bundle;
export declare function baseJSBundleWithDependencies(entryPoint: string, preModules: readonly Module[], dependencies: Module<MixedOutput>[], options: ExpoSerializerOptions & {
    platform: string;
    baseUrl: string;
    splitChunks: boolean;
    skipWrapping: boolean;
    computedAsyncModulePaths: Record<string, string> | null;
    debugId?: string;
}): Bundle;
