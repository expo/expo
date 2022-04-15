import { BundleAssetWithFileHashes } from '@expo/dev-server';
import path from 'path';

import * as Log from '../../log';
import { chunk } from '../../utils/array';
import { copyAsync } from '../../utils/dir';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

function logAssetTask(projectRoot: string, action: 'uploading' | 'saving', pathName: string) {
  Log.debug(`${action} ${pathName}`);

  const relativePath = pathName.replace(projectRoot, '');
  Log.log(`${action} ${relativePath}`);
}

function collectAssetPaths(assets: Asset[]): Record<string, string> {
  // Collect paths by key, also effectively handles duplicates in the array
  const paths: { [fileHash: string]: string } = {};
  assets.forEach((asset) => {
    asset.files.forEach((path: string, index: number) => {
      paths[asset.fileHashes[index]] = path;
    });
  });
  return paths;
}

export async function saveAssetsAsync(projectRoot: string, assets: Asset[], outputDir: string) {
  // Collect paths by key, also effectively handles duplicates in the array
  const paths = collectAssetPaths(assets);

  // save files one chunk at a time
  const keyChunks = chunk(Object.keys(paths), 5);
  for (const keys of keyChunks) {
    const promises = [];
    for (const key of keys) {
      const pathName = paths[key];

      logAssetTask(projectRoot, 'saving', pathName);

      const assetPath = path.resolve(outputDir, 'assets', key);

      // copy file over to assetPath
      promises.push(copyAsync(pathName, assetPath));
    }
    await Promise.all(promises);
  }
  Log.log('Files successfully saved.');
}
