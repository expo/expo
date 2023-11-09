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
import fs from 'fs';
import type { AssetData } from 'metro';
import path from 'path';

import { getAssetLocalPath } from './metroAssetLocalPath';
import { Log } from '../log';

function cleanAssetCatalog(catalogDir: string): void {
  const files = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file));
  }
}

export function persistMetroAssetsAsync(
  assets: readonly AssetData[],
  {
    platform,
    outputDirectory,
    basePath,
    iosAssetCatalogDirectory,
  }: {
    platform: string;
    outputDirectory: string;
    basePath?: string;
    iosAssetCatalogDirectory?: string;
  }
) {
  if (outputDirectory == null) {
    Log.warn('Assets destination folder is not set, skipping...');
    return;
  }

  let assetsToCopy: AssetData[] = [];

  if (platform === 'ios' && iosAssetCatalogDirectory != null) {
    // Use iOS Asset Catalog for images. This will allow Apple app thinning to
    // remove unused scales from the optimized bundle.
    const catalogDir = path.join(iosAssetCatalogDirectory, 'RNAssets.xcassets');
    if (!fs.existsSync(catalogDir)) {
      Log.error(
        `Could not find asset catalog 'RNAssets.xcassets' in ${iosAssetCatalogDirectory}. Make sure to create it if it does not exist.`
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
        assetsToCopy.push(asset);
      }
    }
    Log.log('Done adding images to asset catalog');
  } else {
    assetsToCopy = [...assets];
  }

  const files = assetsToCopy.reduce<Record<string, string>>((acc, asset) => {
    const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));

    asset.scales.forEach((scale, idx) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(
        outputDirectory,
        getAssetLocalPath(asset, { platform, scale, basePath })
      );
      acc[src] = dest;
    });
    return acc;
  }, {});

  return copyInBatchesAsync(files);
}

function writeImageSet(imageSet: ImageSet): void {
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
        author: 'expo',
        version: 1,
      },
    })
  );
}

function isCatalogAsset(asset: Pick<AssetData, 'type'>): boolean {
  return asset.type === 'png' || asset.type === 'jpg' || asset.type === 'jpeg';
}

type ImageSet = {
  basePath: string;
  files: { name: string; src: string; scale: number }[];
};

function getImageSet(
  catalogDir: string,
  asset: Pick<AssetData, 'httpServerLocation' | 'name' | 'type' | 'files'>,
  scales: number[]
): ImageSet {
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

export function copyInBatchesAsync(filesToCopy: Record<string, string>) {
  const queue = Object.keys(filesToCopy);
  if (queue.length === 0) {
    return;
  }

  Log.log(`Copying ${queue.length} asset files`);
  return new Promise<void>((resolve, reject) => {
    const copyNext = (error?: NodeJS.ErrnoException) => {
      if (error) {
        return reject(error);
      }
      if (queue.length) {
        // queue.length === 0 is checked in previous branch, so this is string
        const src = queue.shift() as string;
        const dest = filesToCopy[src];
        copy(src, dest, copyNext);
      } else {
        Log.log('Persisted assets');
        resolve();
      }
    };
    copyNext();
  });
}

function copy(src: string, dest: string, callback: (error: NodeJS.ErrnoException) => void): void {
  fs.mkdir(path.dirname(dest), { recursive: true }, (err?) => {
    if (err) {
      callback(err);
      return;
    }
    fs.createReadStream(src).pipe(fs.createWriteStream(dest)).on('finish', callback);
  });
}

const ALLOWED_SCALES: { [key: string]: number[] } = {
  ios: [1, 2, 3],
};

export function filterPlatformAssetScales(platform: string, scales: number[]): number[] {
  const whitelist: number[] = ALLOWED_SCALES[platform];
  if (!whitelist) {
    return scales;
  }
  const result = scales.filter((scale) => whitelist.includes(scale));
  if (!result.length && scales.length) {
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
    if (!result.length) {
      result.push(scales[scales.length - 1]);
    }
  }
  return result;
}

function getResourceIdentifier(asset: Pick<AssetData, 'httpServerLocation' | 'name'>): string {
  const folderPath = getBasePath(asset);
  return `${folderPath}/${asset.name}`
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getBasePath(asset: Pick<AssetData, 'httpServerLocation'>): string {
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substring(1);
  }
  return basePath;
}
