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
import { ExportAssetMap } from './saveAssets';
import { Log } from '../log';

function cleanAssetCatalog(catalogDir: string): void {
  const files = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file));
  }
}

export async function persistMetroAssetsAsync(
  assets: readonly AssetData[],
  {
    platform,
    outputDirectory,
    baseUrl,
    iosAssetCatalogDirectory,
    files,
  }: {
    platform: string;
    outputDirectory: string;
    baseUrl?: string;
    iosAssetCatalogDirectory?: string;
    files?: ExportAssetMap;
  }
) {
  if (outputDirectory == null) {
    Log.warn('Assets destination folder is not set, skipping...');
    return;
  }

  let assetsToCopy: AssetData[] = [];

  // TODO: Use `files` as below to defer writing files
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

  const batches: Record<string, string> = {};

  async function write(src: string, dest: string) {
    if (files) {
      const data = await fs.promises.readFile(src);
      files.set(dest, {
        contents: data,
        targetDomain: platform === 'web' ? 'client' : undefined,
      });
    } else {
      batches[src] = path.join(outputDirectory, dest);
    }
  }

  for (const asset of assetsToCopy) {
    const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));
    for (let idx = 0; idx < asset.scales.length; idx++) {
      const scale = asset.scales[idx];
      if (validScales.has(scale)) {
        await write(asset.files[idx], getAssetLocalPath(asset, { platform, scale, baseUrl }));
      }
    }
  }

  if (!files) {
    await copyInBatchesAsync(batches);
  }
}

function writeImageSet(imageSet: ImageSet): void {
  fs.mkdirSync(imageSet.baseUrl, { recursive: true });

  for (const file of imageSet.files) {
    const dest = path.join(imageSet.baseUrl, file.name);
    fs.copyFileSync(file.src, dest);
  }

  fs.writeFileSync(
    path.join(imageSet.baseUrl, 'Contents.json'),
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
  baseUrl: string;
  files: { name: string; src: string; scale: number }[];
};

function getImageSet(
  catalogDir: string,
  asset: Pick<AssetData, 'httpServerLocation' | 'name' | 'type' | 'files'>,
  scales: number[]
): ImageSet {
  const fileName = getResourceIdentifier(asset);
  return {
    baseUrl: path.join(catalogDir, `${fileName}.imageset`),
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
  const folderPath = getBaseUrl(asset);
  return `${folderPath}/${asset.name}`
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
