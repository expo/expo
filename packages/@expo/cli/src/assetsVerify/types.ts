// Types for the options passed into the command

export const validPlatforms = ['android', 'ios'];

export type Platform = (typeof validPlatforms)[number];

export const isValidPlatform = (p: any) => validPlatforms.includes(p);

export interface Options {
  exportPath?: string;
  buildPath?: string;
  platform: Platform;
}

export interface ValidatedOptions {
  exportPath: string;
  buildPath: string;
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

export type ExportedMetadata = {
  fileMetadata: {
    ios?: {
      bundle: string;
      assets: ExportedMetadataAsset[];
    };
    android?: {
      bundle: string;
      assets: ExportedMetadataAsset[];
    };
  };
};
