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
import type { AssetData } from '@expo/metro/metro';
import fs from 'fs';
import path from 'path';

import { Log } from '../log';
import { drawableFileTypes, getAssetLocalPath } from './metroAssetLocalPath';
import type { ExportAssetMap } from './saveAssets';

function cleanAssetCatalog(catalogDir: string): void {
  const files = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file));
  }
}

export async function persistMetroAssetsAsync(
  projectRoot: string,
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

  // For iOS, we need to ensure that the outputDirectory exists.
  // The bundle code and images build phase script always tries to access this folder
  if (platform === 'ios' && !fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
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
        writeImageSet(getImageSet(catalogDir, asset));
      } else {
        assetsToCopy.push(asset);
      }
    }
    Log.log('Done adding images to asset catalog');
  } else {
    assetsToCopy = [...assets];
  }
  if (platform === 'android') {
    await createKeepFileAsync(assetsToCopy, outputDirectory);
  }

  const batches: Record<string, string> = {};

  for (const asset of assetsToCopy) {
    const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));
    for (let idx = 0; idx < asset.scales.length; idx++) {
      const scale = asset.scales[idx]!;
      if (validScales.has(scale)) {
        const src = asset.files[idx]!;
        const dest = getAssetLocalPath(asset, { platform, scale, baseUrl });
        if (files) {
          const data = await fs.promises.readFile(src);
          files.set(dest, {
            contents: data,
            assetId: getAssetIdForLogGrouping(projectRoot, asset),
            targetDomain: platform === 'web' ? 'client' : undefined,
          });
        } else {
          batches[src] = path.join(outputDirectory, dest);
        }
      }
    }
  }

  if (!files) {
    await copyInBatchesAsync(batches);
  }
}

export async function createKeepFileAsync(
  assets: AssetData[],
  outputDirectory: string
): Promise<void> {
  if (!assets.length) {
    return;
  }
  const assetsList = [];
  for (const asset of assets) {
    const prefix = drawableFileTypes.has(asset.type) ? 'drawable' : 'raw';
    assetsList.push(`@${prefix}/${getResourceIdentifier(asset)}`);
  }
  const keepPath = path.join(outputDirectory, 'raw/keep.xml');
  const content = `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="${assetsList.join(',')}" />`;
  await fs.promises.mkdir(path.dirname(keepPath), { recursive: true });
  await fs.promises.writeFile(keepPath, content);
}

export function getAssetIdForLogGrouping(
  projectRoot: string,
  asset: Partial<Pick<AssetData, 'fileSystemLocation' | 'name' | 'type'>>
): string | undefined {
  return 'fileSystemLocation' in asset && asset.fileSystemLocation != null && asset.name != null
    ? path.relative(projectRoot, path.join(asset.fileSystemLocation, asset.name)) +
        (asset.type ? '.' + asset.type : '')
    : undefined;
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

type CatalogImage = { scale: number; src: string };

/**
 * Pairs each catalog-valid scale of the asset with its source file.
 *
 * If the asset has no valid scale at all (e.g. only a fractional @1.5x
 * variant), its closest variant is mapped into the nearest valid slot,
 * mirroring the "closest larger" fallback filterPlatformAssetScales applies
 * to loose files, so the imageset always contains at least one rendition
 * actool will compile.
 */
export function getCatalogImages(
  asset: Pick<AssetData, 'name' | 'scales' | 'files'>
): CatalogImage[] {
  const images: CatalogImage[] = [];
  asset.scales.forEach((scale, idx) => {
    const src = asset.files[idx];
    if (src && CATALOG_SCALES.includes(scale)) {
      images.push({ scale, src });
    }
  });
  if (images.length > 0) {
    return images;
  }

  let idx = asset.scales.findIndex((scale) => scale > MAX_CATALOG_SCALE);
  if (idx === -1) {
    idx = asset.scales.length - 1;
  }
  const assetScale = asset.scales[idx];
  const src = asset.files[idx];
  if (assetScale === undefined || src === undefined) {
    return images;
  }

  const scale = Math.min(MAX_CATALOG_SCALE, Math.max(1, Math.ceil(assetScale)));
  Log.warn(
    `Asset "${asset.name}" has no 1x/2x/3x variant; using its @${assetScale}x file as the ${scale}x catalog rendition.`
  );
  images.push({ scale, src });
  return images;
}

function getImageSet(
  catalogDir: string,
  asset: Pick<AssetData, 'httpServerLocation' | 'name' | 'type' | 'files' | 'scales'>
): ImageSet {
  const fileName = getResourceIdentifier(asset);
  return {
    baseUrl: path.join(catalogDir, `${fileName}.imageset`),
    files: getCatalogImages(asset).map(({ scale, src }) => {
      const suffix = scale === 1 ? '' : `@${scale}x`;
      return {
        name: `${fileName + suffix}.${asset.type}`,
        scale,
        src,
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
        const dest = filesToCopy[src]!;
        copy(src, dest, copyNext);
      } else {
        resolve();
      }
    };
    copyNext();
  });
}

function copy(src: string, dest: string, callback: (error?: NodeJS.ErrnoException) => void): void {
  fs.mkdir(path.dirname(dest), { recursive: true }, (err?) => {
    if (err) {
      callback(err);
      return;
    }
    fs.createReadStream(src).pipe(fs.createWriteStream(dest)).on('finish', callback);
  });
}

// Scales an iOS asset catalog imageset can hold. actool silently drops
// renditions at any other scale (e.g. a fractional @1.5x).
const CATALOG_SCALES = [1, 2, 3];
const MAX_CATALOG_SCALE = Math.max(...CATALOG_SCALES);

const ALLOWED_SCALES: { [key: string]: number[] } = {
  ios: CATALOG_SCALES,
};

export function filterPlatformAssetScales(platform: string, scales: number[]): number[] {
  const whitelist: number[] = ALLOWED_SCALES[platform]!;
  if (!whitelist) {
    return scales;
  }
  const result = scales.filter((scale) => whitelist.includes(scale));
  if (!result.length && scales.length) {
    // No matching scale found, but there are some available. Ideally we don't
    // want to be in this situation and should throw, but for now as a fallback
    // let's just use the closest larger image
    const maxScale = whitelist[whitelist.length - 1]!;
    for (const scale of scales) {
      if (scale > maxScale) {
        result.push(scale);
        break;
      }
    }

    // There is no larger scales available, use the largest we have
    if (!result.length) {
      result.push(scales[scales.length - 1]!);
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
