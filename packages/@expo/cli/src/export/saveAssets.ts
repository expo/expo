import path from 'path';

import { BundleAssetWithFileHashes } from './fork-bundleAsync';
import { copyInBatchesAsync } from './persistMetroAssets';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export async function saveAssetsAsync({
  assets,
  outputDir,
}: {
  assets: Asset[];
  outputDir: string;
}) {
  const paths: Record<string, string> = {};
  const hashes = new Set<string>();
  assets.forEach((asset) => {
    asset.files.forEach((fp: string, index: number) => {
      const hash = asset.fileHashes[index];
      if (hashes.has(hash)) return;
      hashes.add(hash);
      paths[fp] = path.join(outputDir, 'assets', hash);
    });
  });

  await copyInBatchesAsync(paths);
}
