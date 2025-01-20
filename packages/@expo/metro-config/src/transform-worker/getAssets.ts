/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { AssetData, Module } from 'metro';
import { getAssetData } from 'metro/src/Assets';
import { getJsOutput, isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { ReadOnlyDependencies } from '../serializer/getCssDeps';

const debug = require('debug')('expo:metro-config:assets') as typeof console.log;

type ExpoAssetData = AssetData & {
  fileHashes?: string[];
};

type Options = {
  processModuleFilter: (modules: Module) => boolean;
  assetPlugins: readonly string[];
  platform?: string | null;
  projectRoot: string;
  publicPath: string;
};

function getMD5ForData(data: string[]) {
  if (data.length === 1) return data[0];
  const hash = crypto.createHash('md5');
  hash.update(data.join(''));
  return hash.digest('hex');
}

function getMD5ForFilePathAsync(path: string) {
  return new Promise<string>((resolve, reject) => {
    const output = crypto.createHash('md5');
    const input = fs.createReadStream(path);
    input.on('error', (err) => reject(err));
    output.on('error', (err) => reject(err));
    output.once('readable', () => resolve(output.read().toString('hex')));
    input.pipe(output);
  });
}

function isHashedAssetData(asset: ExpoAssetData): asset is HashedAssetData {
  if ('fileHashes' in asset && Array.isArray(asset.fileHashes)) {
    return true;
  }
  return false;
}

async function ensureOtaAssetHashesAsync(asset: ExpoAssetData): Promise<HashedAssetData> {
  // Legacy cases where people have the `expo-asset/tools/hashAssetFiles` set still.
  if (isHashedAssetData(asset)) {
    debug('fileHashes already added, skipping injection for: ' + asset.name);
    return asset;
  }

  const hashes = await Promise.all(asset.files.map(getMD5ForFilePathAsync));
  // New version where we run the asset plugin every time.

  asset.fileHashes = hashes;

  // Convert the `../` segments of the server URL to `_` to support monorepos.
  // This same transformation takes place in `AssetSourceResolver.web` (expo-assets, expo-image) and `persistMetroAssets` of Expo CLI,
  // this originally came from the Metro opinion https://github.com/react-native-community/cli/blob/2204d357379e2067cebe2791e90388f7e97fc5f5/packages/cli-plugin-metro/src/commands/bundle/getAssetDestPathIOS.ts#L19C5-L19C10
  if (asset.httpServerLocation.includes('?export_path=')) {
    // @ts-expect-error: marked as read-only
    asset.httpServerLocation = asset.httpServerLocation
      .match(/\?export_path=(.*)/)[1]
      .replace(/\.\.\//g, '_');
  }

  // URL encode asset paths defined as `?export_path` or `?unstable_path` query parameters.
  // Decoding should be done automatically when parsing the URL through Node or the browser.
  const assetPathQueryParameter = asset.httpServerLocation.match(
    /\?(export_path|unstable_path)=(.*)/
  );
  if (assetPathQueryParameter && assetPathQueryParameter[2]) {
    const assetPath = assetPathQueryParameter[2];
    // @ts-expect-error: marked as read-only
    asset.httpServerLocation = asset.httpServerLocation.replace(
      assetPath,
      encodeURIComponent(assetPath)
    );
  }

  return asset as HashedAssetData;
}

export async function getUniversalAssetData(
  assetPath: string,
  localPath: string,
  assetDataPlugins: readonly string[],
  platform: string | null | undefined,
  publicPath: string
): Promise<HashedAssetData> {
  const metroAssetData = await getAssetData(
    assetPath,
    localPath,
    assetDataPlugins,
    platform,
    publicPath
  );
  const data = await ensureOtaAssetHashesAsync(metroAssetData);

  // NOTE(EvanBacon): This is where we modify the asset to include a hash in the name for web cache invalidation.
  if (platform === 'web' && publicPath.includes('?export_path=')) {
    // `local-image.[contenthash]`. Using `.` but this won't work if we ever apply to Android because Android res files cannot contain `.`.
    // TODO: Prevent one multi-res image from updating the hash in all images.
    // @ts-expect-error: name is typed as readonly.
    data.name = `${data.name}.${getMD5ForData(data.fileHashes)}`;
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
