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
  embeddedHashSet,
}: {
  bundles: Partial<Record<BundlePlatform, Pick<BundleOutput, 'assets'>>>;
  fileNames: Record<string, string[]>;
  embeddedHashSet?: Set<string>;
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
            // TODO: Add multi-bundle support to EAS Update!!
            bundle: fileNames[platform][0],
            // Collect all of the assets and convert them to the serial format.
            assets: bundle.assets
              .filter((asset) => !embeddedHashSet || !embeddedHashSet.has(asset.hash))
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
