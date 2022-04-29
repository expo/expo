import { BundleAssetWithFileHashes } from '@expo/dev-server';
import path from 'path';

import * as Log from '../log';
import { chunk } from '../utils/array';
import { copyAsync } from '../utils/dir';

const debug = require('debug')('expo:export:saveAssets') as typeof console.log;

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

function logAssetTask(projectRoot: string, action: 'uploading' | 'saving', pathName: string) {
  debug(`${action} ${pathName}`);

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

export async function saveAssetsAsync(
  projectRoot: string,
  { assets, outputDir }: { assets: Asset[]; outputDir: string }
) {
  // Collect paths by key, also effectively handles duplicates in the array
  const paths = collectAssetPaths(assets);

  // save files one chunk at a time
  for (const keys of chunk(Object.entries(paths), 5)) {
    await Promise.all(
      keys.map(([key, pathName]) => {
        logAssetTask(projectRoot, 'saving', pathName);
        // copy file over to assetPath
        return copyAsync(pathName, path.join(outputDir, 'assets', key));
      })
    );
  }
  Log.log('Files successfully saved.');
}
