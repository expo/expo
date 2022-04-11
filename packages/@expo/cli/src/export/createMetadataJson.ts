import type { BundleOutput } from '@expo/dev-server';
import assert from 'assert';
import path from 'path';

export type BundlePlatform = 'android' | 'ios';

type PlatformMetadata = { bundle: string; assets: { path: string; ext: string }[] };

type FileMetadata = {
  [key in BundlePlatform]: PlatformMetadata;
};

type Metadata = {
  version: 0;
  bundler: 'metro';
  fileMetadata: FileMetadata;
};

export function createMetadataJson({
  bundles,
  fileNames,
}: {
  bundles: Record<string, Pick<BundleOutput, 'assets'>>;
  fileNames: Record<string, string>;
}): Metadata {
  // Build metadata.json
  const fileMetadata: {
    [platform: string]: Partial<PlatformMetadata>;
  } = {};
  Object.keys(bundles).forEach((platform) => {
    const filename = fileNames[platform];
    assert(filename, `Expected filename for ${platform}`);

    fileMetadata[platform] = {
      bundle: path.join('bundles', filename),
      assets: [],
    };

    bundles[platform].assets.forEach((asset: { type: string; fileHashes: string[] }) => {
      fileMetadata[platform].assets = [
        ...fileMetadata[platform].assets!,
        ...asset.fileHashes.map((hash) => {
          return { path: path.join('assets', hash), ext: asset.type };
        }),
      ];
    });
  });
  const metadata: Metadata = {
    version: 0,
    bundler: 'metro',
    fileMetadata: fileMetadata as FileMetadata,
  };

  return metadata;
}
