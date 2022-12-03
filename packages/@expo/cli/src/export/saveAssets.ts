import { BundleAssetWithFileHashes } from '@expo/dev-server';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { chunk } from '../utils/array';
import { copyAsync } from '../utils/dir';

const debug = require('debug')('expo:export:saveAssets') as typeof console.log;

export type ManifestAsset = {
  fileSystemLocation: string;
  name: string;
  type: string;
  fileHashes: string[];
  files: string[];
  hash: string;
};

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
    asset.files.forEach((_path: string, index: number) => {
      paths[asset.fileHashes[index]] = _path;
    });
  });
  return paths;
}

export async function getAssetsManifestAsync(
  projectRoot: string,
  { assets }: { assets: Asset[] }
): Promise<Record<string, string>> {
  // path -> hash
  const assetsManifest: Record<string, string> = {};

  // Collect paths by key, also effectively handles duplicates in the array
  assets.forEach((asset) => {
    asset.files.forEach((_path: string, index: number) => {
      const realPath = path.relative(
        projectRoot,
        path.join(asset.fileSystemLocation, [asset.name, asset.type].filter(Boolean).join('.'))
      );
      const hashName = 'assets/' + asset.fileHashes[index];
      assetsManifest[realPath] = hashName;
    });
  });

  return assetsManifest;
}

export async function writeAssetsManifestAsync(
  projectRoot: string,
  { assets, outputDir }: { assets: Asset[]; outputDir: string }
): Promise<void> {
  await fs.promises.writeFile(
    path.join(outputDir, 'assets-manifest.json'),
    JSON.stringify(await getAssetsManifestAsync(projectRoot, { assets }), null, 2)
  );
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
