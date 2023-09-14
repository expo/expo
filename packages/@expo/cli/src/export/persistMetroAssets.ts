import fs from 'fs';
import type { AssetData, AssetDataWithoutFiles } from 'metro';
import path from 'path';

import { Log } from '../log';

export function persistMetroAssetsAsync(
  assets: readonly AssetData[],
  {
    platform,
    outputDirectory,
    basePath,
  }: {
    platform: string;
    outputDirectory: string;
    basePath?: string;
  }
) {
  const files = assets.reduce<Record<string, string>>((acc, asset) => {
    const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));

    asset.scales.forEach((scale, idx) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(outputDirectory, getAssetLocalPath(asset, { scale, basePath }));
      acc[src] = dest;
    });
    return acc;
  }, {});

  return copyAll(files);
}

function copyAll(filesToCopy: Record<string, string>) {
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

function filterPlatformAssetScales(platform: string, scales: readonly number[]): readonly number[] {
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

function getAssetLocalPath(
  asset: AssetDataWithoutFiles,
  { basePath, scale }: { basePath?: string; scale: number }
): string {
  const suffix = scale === 1 ? '' : `@${scale}x`;
  const fileName = `${asset.name + suffix}.${asset.type}`;

  const adjustedHttpServerLocation = stripAssetPrefix(asset.httpServerLocation, basePath);
  return path.join(
    // Assets can have relative paths outside of the project root.
    // Replace `../` with `_` to make sure they don't end up outside of
    // the expected assets directory.
    adjustedHttpServerLocation.replace(/^\/+/g, '').replace(/\.\.\//g, '_'),
    fileName
  );
}

export function stripAssetPrefix(path: string, basePath?: string) {
  path = path.replace(/\/assets\?export_path=(.*)/, '$1');

  // TODO: Windows?
  if (basePath) {
    return path.replace(/^\/+/g, '').replace(
      new RegExp(
        `^${basePath
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
