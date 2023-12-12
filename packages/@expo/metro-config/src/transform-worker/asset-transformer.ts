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
import { generateAssetCodeFileAst } from 'metro/src/Bundler/util';
import { BabelTransformerArgs } from 'metro-babel-transformer';
import path from 'node:path';

import { getUniversalAssetData } from './getAssets';

export async function transform(
  { filename, options }: BabelTransformerArgs,
  assetRegistryPath: string,
  assetDataPlugins: readonly string[]
) {
  options ??= options || {
    platform: '',
    projectRoot: '',
    inlineRequires: false,
    minify: false,
  };

  const absolutePath = path.resolve(options.projectRoot, filename);

  const data = await getUniversalAssetData(
    absolutePath,
    filename,
    assetDataPlugins,
    options.platform,
    options.publicPath
  );

  return {
    ast: generateAssetCodeFileAst(assetRegistryPath, data),
  };
}
