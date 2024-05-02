// Types for the options passed into the command

export const validPlatforms = ['android', 'ios'];

export type Platform = (typeof validPlatforms)[number];

export const isValidPlatform = (p: any) => validPlatforms.includes(p);

export interface ValidatedOptions {
  exportedManifestPath: string;
  buildManifestPath: string;
  assetMapPath: string;
  platform: Platform;
}

// Types for the full asset map (npx expo export --dump-assets)

export type FullAssetDumpEntry = {
  files: string[];
  hash: string;
  name: string;
  type: string;
  fileHashes: string[];
};

export type FullAssetDump = Map<string, FullAssetDumpEntry>;

// Types for the embedded manifest created by expo-updates

export type BuildManifestAsset = {
  name: string;
  type: string;
  packagerHash: string;
};

export type BuildManifest = {
  assets: BuildManifestAsset[];
} & { [key: string]: any };

// Types for the metadata exported by npx expo export

export type ExportedMetadataAsset = {
  path: string;
  ext: string;
};

export type FileMetadata = {
  bundle: string;
  assets: ExportedMetadataAsset[];
};

export type ExportedMetadata = {
  fileMetadata: {
    ios?: FileMetadata;
    android?: FileMetadata;
  };
};

// Type for the missing asset array returned by getMissingAssetsAsync

export type MissingAsset = {
  hash: string;
  path: string;
};
