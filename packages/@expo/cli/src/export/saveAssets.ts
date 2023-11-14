import fs from 'fs';
import path from 'path';

import { BundleAssetWithFileHashes } from './fork-bundleAsync';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export async function saveAssetsAsync({
  assets,
  files,
}: {
  assets: Asset[];
  files: Map<string, string | Buffer>;
}) {
  const hashes = new Set<string>();
  assets.forEach((asset) => {
    asset.files.forEach((fp: string, index: number) => {
      const hash = asset.fileHashes[index];
      if (hashes.has(hash)) return;
      hashes.add(hash);
      files.set(path.join('assets', hash), fs.readFileSync(fp));
    });
  });

  return files;
}
