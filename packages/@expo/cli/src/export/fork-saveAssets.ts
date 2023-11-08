/**
 *
 * Copyright © 2023 650 Industries, Inc. All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

import { Log } from '../log';
import { copyAll } from './persistMetroAssets';
import type { AssetData } from 'metro/src/Assets';
import type { PackagerAsset } from '@react-native/assets/registry';

const ALLOWED_SCALES: { [key: string]: number[] } = {
  ios: [1, 2, 3],
};

/**
 * FIXME: using number to represent discrete scale numbers is fragile in essence because of
 * floating point numbers imprecision.
 */
function getAndroidAssetSuffix(scale: number): string {
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
      return '';
  }
}

// See https://developer.android.com/guide/topics/resources/drawable-resource.html
const drawableFileTypes = new Set<string>(['gif', 'jpeg', 'jpg', 'png', 'webp', 'xml']);

function getAndroidResourceFolderName(asset: PackagerAsset, scale: number): string {
  if (!drawableFileTypes.has(asset.type)) {
    return 'raw';
  }
  const suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      `Don't know which android drawable suffix to use for asset: ${JSON.stringify(asset)}`
    );
  }
  const androidFolder = `drawable-${suffix}`;
  return androidFolder;
}

function getResourceIdentifier(asset: PackagerAsset): string {
  const folderPath = getBasePath(asset);
  return `${folderPath}/${asset.name}`
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getBasePath(asset: PackagerAsset): string {
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}

function filterPlatformAssetScales(platform: string, scales: number[]): number[] {
  const whitelist: number[] = ALLOWED_SCALES[platform];
  if (!whitelist) {
    return scales;
  }
  const result = scales.filter((scale) => whitelist.indexOf(scale) > -1);
  if (result.length === 0 && scales.length > 0) {
    // No matching scale found, but there are some available. Ideally we don't
    // want to be in this situation and should throw, but for now as a fallback
    // let's just use the closest larger image
    const maxScale = whitelist[whitelist.length - 1];
    for (const scale of scales) {
      if (scale > maxScale) {
        result.push(scale);
        break;
      }
    }

    // There is no larger scales available, use the largest we have
    if (result.length === 0) {
      result.push(scales[scales.length - 1]);
    }
  }
  return result;
}

export function cleanAssetCatalog(catalogDir: string): void {
  const files = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file));
  }
}

type ImageSet = {
  basePath: string;
  files: { name: string; src: string; scale: number }[];
};

export function getImageSet(catalogDir: string, asset: AssetData, scales: number[]): ImageSet {
  const fileName = getResourceIdentifier(asset);
  return {
    basePath: path.join(catalogDir, `${fileName}.imageset`),
    files: scales.map((scale, idx) => {
      const suffix = scale === 1 ? '' : `@${scale}x`;
      return {
        name: `${fileName + suffix}.${asset.type}`,
        scale,
        src: asset.files[idx],
      };
    }),
  };
}

export function isCatalogAsset(asset: AssetData): boolean {
  return asset.type === 'png' || asset.type === 'jpg' || asset.type === 'jpeg';
}

export function writeImageSet(imageSet: ImageSet): void {
  fs.mkdirSync(imageSet.basePath, { recursive: true });

  for (const file of imageSet.files) {
    const dest = path.join(imageSet.basePath, file.name);
    fs.copyFileSync(file.src, dest);
  }

  fs.writeFileSync(
    path.join(imageSet.basePath, 'Contents.json'),
    JSON.stringify({
      images: imageSet.files.map((file) => ({
        filename: file.name,
        idiom: 'universal',
        scale: `${file.scale}x`,
      })),
      info: {
        author: 'xcode',
        version: 1,
      },
    })
  );
}

function getAssetDestPathAndroid(asset: PackagerAsset, scale: number): string {
  const androidFolder = getAndroidResourceFolderName(asset, scale);
  const fileName = getResourceIdentifier(asset);
  return path.join(androidFolder, `${fileName}.${asset.type}`);
}

function getAssetDestPathIOS(asset: PackagerAsset, scale: number): string {
  const suffix = scale === 1 ? '' : `@${scale}x`;
  const fileName = `${asset.name + suffix}.${asset.type}`;
  return path.join(
    // Assets can have relative paths outside of the project root.
    // Replace `../` with `_` to make sure they don't end up outside of
    // the expected assets directory.
    asset.httpServerLocation.substr(1).replace(/\.\.\//g, '_'),
    fileName
  );
}

export async function saveAssets(
  assets: readonly AssetData[],
  platform: string,
  assetsDest?: string,
  assetCatalogDest?: string
): Promise<void> {
  if (assetsDest == null) {
    Log.warn('Assets destination folder is not set, skipping...');
    return;
  }

  const filesToCopy: Record<string, string> = {};

  const getAssetDestPath = platform === 'android' ? getAssetDestPathAndroid : getAssetDestPathIOS;

  const addAssetToCopy = (asset: AssetData) => {
    const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));

    asset.scales.forEach((scale, idx) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
      filesToCopy[src] = dest;
    });
  };

  if (platform === 'ios' && assetCatalogDest != null) {
    // Use iOS Asset Catalog for images. This will allow Apple app thinning to
    // remove unused scales from the optimized bundle.
    const catalogDir = path.join(assetCatalogDest, 'RNAssets.xcassets');
    if (!fs.existsSync(catalogDir)) {
      Log.error(
        `Could not find asset catalog 'RNAssets.xcassets' in ${assetCatalogDest}. Make sure to create it if it does not exist.`
      );
      return;
    }

    Log.log('Adding images to asset catalog', catalogDir);
    cleanAssetCatalog(catalogDir);
    for (const asset of assets) {
      if (isCatalogAsset(asset)) {
        const imageSet = getImageSet(
          catalogDir,
          asset,
          filterPlatformAssetScales(platform, asset.scales)
        );
        writeImageSet(imageSet);
      } else {
        addAssetToCopy(asset);
      }
    }
    Log.log('Done adding images to asset catalog');
  } else {
    assets.forEach(addAssetToCopy);
  }

  return copyAll(filesToCopy);
}
