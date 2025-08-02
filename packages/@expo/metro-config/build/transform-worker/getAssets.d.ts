/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type AssetData } from '@expo/metro/metro/Assets';
import type { Module, ReadOnlyDependencies } from '@expo/metro/metro/DeltaBundler/types.flow';
type Options = {
    processModuleFilter: (modules: Module) => boolean;
    assetPlugins: readonly string[];
    platform?: string | null;
    projectRoot: string;
    publicPath: string;
    isHosted?: boolean;
};
export declare function getUniversalAssetData(assetPath: string, localPath: string, assetDataPlugins: readonly string[], platform: string | null | undefined, publicPath: string, isHosted?: boolean): Promise<HashedAssetData>;
export type HashedAssetData = AssetData & {
    fileHashes: string[];
    _name?: string;
};
export default function getAssets(dependencies: ReadOnlyDependencies, options: Options): Promise<HashedAssetData[]>;
export {};
