/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on the community asset persisting for Metro but with base path and web support:
 * https://github.com/facebook/react-native/blob/d6e0bc714ad4d215ede4949d3c4f44af6dea5dd3/packages/community-cli-plugin/src/commands/bundle/saveAssets.js#L1
 */
import type { AssetData } from 'metro';
import path from 'path';

export function getAssetLocalPath(
  asset: Pick<AssetData, 'type' | 'httpServerLocation' | 'name'>,
  {
    baseUrl,
    scale,
    platform,
    hash,
  }: { baseUrl?: string; scale: number; platform: string; hash: string }
): string {
  if (platform === 'android') {
    return getAssetLocalPathAndroid(asset, { baseUrl, scale, hash });
  }
  return getAssetLocalPathDefault(asset, { baseUrl, scale, hash });
}

function getAssetLocalPathAndroid(
  asset: Pick<AssetData, 'type' | 'httpServerLocation' | 'name'>,
  {
    baseUrl,
    hash,
    scale,
  }: {
    // TODO: baseUrl support
    baseUrl?: string;
    hash: string;
    scale: number;
  }
): string {
  const androidFolder = getAndroidResourceFolderName(asset, scale);
  const fileName = getResourceIdentifier(asset);
  return path.join(androidFolder, `${fileName}_${hash}.${asset.type}`);
}

function getAssetLocalPathDefault(
  asset: Pick<AssetData, 'type' | 'httpServerLocation' | 'name'>,
  { baseUrl, scale, hash }: { baseUrl?: string; scale: number; hash: string }
): string {
  const suffix = scale === 1 ? '' : `@${scale}x`;
  const fileName = `${getOriginalName(asset)}_${hash}${suffix}.${asset.type}`;

  const adjustedHttpServerLocation = stripAssetPrefix(asset.httpServerLocation, baseUrl);

  return path.join(
    // Assets can have relative paths outside of the project root.
    // Replace `../` with `_` to make sure they don't end up outside of
    // the expected assets directory.
    adjustedHttpServerLocation.replace(/^\/+/g, '').replace(/\.\.\//g, '_'),
    fileName
  );
}

export function stripAssetPrefix(path: string, baseUrl?: string) {
  path = path.replace(/\/assets\?export_path=(.*)/, '$1');

  // TODO: Windows?
  if (baseUrl) {
    return path.replace(/^\/+/g, '').replace(
      new RegExp(
        `^${baseUrl
          .replace(/^\/+/g, '')
          .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
          .replace(/-/g, '\\x2d')}`,
        'g'
      ),
      ''
    );
  }
  return path;
}

/**
 * FIXME: using number to represent discrete scale numbers is fragile in essence because of
 * floating point numbers imprecision.
 */
function getAndroidAssetSuffix(scale: number): string | null {
  switch (scale) {
    case 0.75:
      return 'ldpi';
    case 1:
      return 'mdpi';
    case 1.5:
      return 'hdpi';
    case 2:
      return 'xhdpi';
    case 3:
      return 'xxhdpi';
    case 4:
      return 'xxxhdpi';
    default:
      return null;
  }
}

// See https://developer.android.com/guide/topics/resources/drawable-resource.html
const drawableFileTypes = new Set<string>(['gif', 'jpeg', 'jpg', 'png', 'webp', 'xml']);

function getAndroidResourceFolderName(asset: Pick<AssetData, 'type'>, scale: number): string {
  if (!drawableFileTypes.has(asset.type)) {
    return 'raw';
  }
  const suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      `Asset "${JSON.stringify(asset)}" does not use a supported Android resolution suffix`
    );
  }
  return `drawable-${suffix}`;
}

function getResourceIdentifier(asset: Pick<AssetData, 'httpServerLocation' | 'name'>): string {
  const folderPath = getBaseUrl(asset);
  return `${folderPath}/${getOriginalName(asset)}`
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getBaseUrl(asset: Pick<AssetData, 'httpServerLocation'>): string {
  let baseUrl = asset.httpServerLocation;
  if (baseUrl[0] === '/') {
    baseUrl = baseUrl.substring(1);
  }
  return baseUrl;
}

export function getOriginalName(asset: { name: string; _name?: string }): string {
  // We inject the `_name` property in the expo-asset/tools/hashAssetFiles.js plugin to preserve a reference to the
  // original file name before it was hashed for the bundle. Web doesn't contain this property because it uses the more refined
  // multi-bundle serializer.
  return asset._name ?? asset.name;
}
