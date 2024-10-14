/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { AssetData, Module } from 'metro';
import { getAssetData } from 'metro/src/Assets';
import { getJsOutput, isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import assert from 'node:assert';
import crypto from 'node:crypto';
import path from 'node:path';

import { ReadOnlyDependencies } from '../serializer/getCssDeps';

type Options = {
  processModuleFilter: (modules: Module) => boolean;
  assetPlugins: readonly string[];
  platform?: string | null;
  projectRoot: string;
  publicPath: string;
};

function md5Hash(data: string[]) {
  if (data.length === 1) return data[0];
  const hash = crypto.createHash('md5');
  hash.update(data.join(''));
  return hash.digest('hex');
}

function assertHashedAssetData(data: AssetData): asserts data is HashedAssetData {
  assert(
    'fileHashes' in data,
    'Assets must have hashed files. Ensure the expo-asset plugin is installed.'
  );
}

export async function getUniversalAssetData(
  assetPath: string,
  localPath: string,
  assetDataPlugins: readonly string[],
  platform: string | null | undefined,
  publicPath: string,
  assetPrefix?: string
): Promise<HashedAssetData> {
  const data = await getAssetData(assetPath, localPath, assetDataPlugins, platform, publicPath);
  assertHashedAssetData(data);

  // NOTE(EvanBacon): This is where we modify the asset to include a hash in the name for web cache invalidation.
  if (platform === 'web' && publicPath.includes('?export_path=')) {
    // `local-image.[contenthash]`. Using `.` but this won't work if we ever apply to Android because Android res files cannot contain `.`.
    // TODO: Prevent one multi-res image from updating the hash in all images.
    // @ts-expect-error: name is typed as readonly.
    data.name = `${data.name}.${md5Hash(data.fileHashes)}`;
  }

  // Support assets hosted remotely on a different server
  if (assetPrefix) {
    // @ts-expect-error: httpServerLocation is typed as readonly.
    data.httpServerLocation = `${assetPrefix}${data.httpServerLocation}`;
  }

  return data;
}

export type HashedAssetData = AssetData & { fileHashes: string[]; _name?: string };

export default async function getAssets(
  dependencies: ReadOnlyDependencies,
  options: Options
): Promise<HashedAssetData[]> {
  const promises: Promise<HashedAssetData>[] = [];
  const { processModuleFilter } = options;

  for (const module of dependencies.values()) {
    if (
      isJsModule(module) &&
      processModuleFilter(module) &&
      getJsOutput(module).type === 'js/module/asset' &&
      path.relative(options.projectRoot, module.path) !== 'package.json'
    ) {
      promises.push(
        getUniversalAssetData(
          module.path,
          path.relative(options.projectRoot, module.path),
          options.assetPlugins,
          options.platform,
          options.publicPath
        )
      );
    }
  }

  return await Promise.all(promises);
}
