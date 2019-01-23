export type PackagerAsset = any;
const drawableFileTypes = new Set(['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp', 'xml']);

enum AndroidAssetSuffix {
  LDPI = 'ldpi',
  MDPI = 'mdpi',
  HDPI = 'hdpi',
  XHDPI = 'xhdpi',
  XXHDPI = 'xxhdpi',
  XXXHDPI = 'xxxhdpi',
}

export function getAndroidAssetSuffix(scale: number): AndroidAssetSuffix {
  switch (scale) {
    case 0.75:
      return AndroidAssetSuffix.LDPI;
    case 1:
      return AndroidAssetSuffix.MDPI;
    case 1.5:
      return AndroidAssetSuffix.HDPI;
    case 2:
      return AndroidAssetSuffix.XHDPI;
    case 3:
      return AndroidAssetSuffix.XXHDPI;
    case 4:
      return AndroidAssetSuffix.XXXHDPI;
  }
  throw new Error('no such scale');
}

export function getAndroidResourceFolderName(asset: PackagerAsset, scale: number): 'raw' | string {
  if (!drawableFileTypes.has(asset.type)) {
    return 'raw';
  }
  const suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      `Don't know which android drawable suffix to use for asset: ${JSON.stringify(asset)}`
    );
  }
  return `drawable-${suffix}`;
}

export function getAndroidResourceIdentifier(asset: PackagerAsset): string {
  const folderPath = getBasePath(asset);
  return `${folderPath}/${asset.name}`
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

export function getBasePath({ httpServerLocation }: PackagerAsset): string {
  if (httpServerLocation[0] === '/') {
    return httpServerLocation.substr(1);
  }
  return httpServerLocation;
}
