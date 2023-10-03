import path from 'path';

import { BundleOutput } from './fork-bundleAsync';

export type BundlePlatform = 'android' | 'ios';

type PlatformMetadataAsset = { path: string; ext: string };

type PlatformMetadata = { bundle: string; assets: PlatformMetadataAsset[] };

type FileMetadata = {
  [key in BundlePlatform]: PlatformMetadata;
};

export function createMetadataJson({
  bundles,
  fileNames,
}: {
  bundles: Partial<Record<BundlePlatform, Pick<BundleOutput, 'assets'>>>;
  fileNames: Record<string, string | undefined>;
}): {
  version: 0;
  bundler: 'metro';
  fileMetadata: FileMetadata;
} {
  // Build metadata.json
  return {
    version: 0,
    bundler: 'metro',
    fileMetadata: Object.entries(bundles).reduce<Record<string, Partial<PlatformMetadata>>>(
      (metadata, [platform, bundle]) => {
        if (platform === 'web') return metadata;

        return {
          ...metadata,
          [platform]: {
            // Get the filename for each platform's bundle.
            bundle: path.join('bundles', fileNames[platform]!),
            // Collect all of the assets and convert them to the serial format.
            assets: bundle.assets
              .map(
                (asset) =>
                  // Each asset has multiple hashes which we convert and then flatten.
                  asset.fileHashes?.map((hash) => ({
                    path: path.join('assets', hash),
                    ext: asset.type,
                  }))
              )
              .filter(Boolean)
              .flat(),
          },
        };
      },
      {}
    ) as FileMetadata,
  };
}
