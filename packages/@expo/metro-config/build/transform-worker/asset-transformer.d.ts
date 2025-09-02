/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the upstream transformer, but with modifications made for web production hashing.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/utils/assetTransformer.js#L1
 */
import { type ParseResult } from '@babel/core';
import type { BabelTransformerArgs } from '@expo/metro/metro-babel-transformer';
export declare function transform({ filename, options, }: {
    filename: string;
    options: Pick<BabelTransformerArgs['options'], 'platform' | 'projectRoot' | 'customTransformOptions' | 'publicPath'>;
}, assetRegistryPath: string, assetDataPlugins: readonly string[]): Promise<{
    ast: ParseResult;
    reactClientReference?: string;
}>;
