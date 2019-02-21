import { UnavailabilityError } from 'expo-errors';

export type PackagerAsset = any;

enum AndroidAssetSuffix {
  LDPI = 'ldpi',
  MDPI = 'mdpi',
  HDPI = 'hdpi',
  XHDPI = 'xhdpi',
  XXHDPI = 'xxhdpi',
  XXXHDPI = 'xxxhdpi',
}

export function getAndroidAssetSuffix(scale: number): AndroidAssetSuffix {
  throw new UnavailabilityError('react-native', 'getAndroidAssetSuffix');
}

export function getAndroidResourceFolderName(asset: PackagerAsset, scale: number): 'raw' | string {
  throw new UnavailabilityError('react-native', 'getAndroidResourceFolderName');
}

export function getAndroidResourceIdentifier(asset: PackagerAsset): string {
  throw new UnavailabilityError('react-native', 'getAndroidResourceIdentifier');
}

export function getBasePath({ httpServerLocation }: PackagerAsset): string {
  if (httpServerLocation[0] === '/') {
    return httpServerLocation.substr(1);
  }
  return httpServerLocation;
}
