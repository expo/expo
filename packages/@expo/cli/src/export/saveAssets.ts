import path from 'path';
import fs from 'fs';
import { BundleAssetWithFileHashes } from './fork-bundleAsync';
import { copyInBatchesAsync } from './persistMetroAssets';

export type ManifestAsset = { fileHashes: string[]; files: string[]; hash: string };

export type Asset = ManifestAsset | BundleAssetWithFileHashes;

export async function saveAssetsAsync({
  assets,
  // outputDir,
  files,
}: {
  assets: Asset[];
  // outputDir: string;
  files: Map<string, string | Buffer>;
}) {
  const paths: Record<string, string> = {};
  const hashes = new Set<string>();
  assets.forEach((asset) => {
    asset.files.forEach((fp: string, index: number) => {
      const hash = asset.fileHashes[index];
      if (hashes.has(hash)) return;
      hashes.add(hash);
      files.set(path.join('assets', hash), fs.readFileSync(fp));
      // paths[fp] = path.join(outputDir, 'assets', hash);
    });
  });

  return files;
  // await copyInBatchesAsync(paths);
}
