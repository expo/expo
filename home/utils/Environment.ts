import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as Kernel from '../kernel/Kernel';

const isProduction = !!(
  Constants.manifest.id === '@exponent/home' && Constants.manifest.publishedTime
);

const IOSClientReleaseType = Kernel.iosClientReleaseType;

const IsIOSRestrictedBuild =
  Platform.OS === 'ios' &&
  Kernel.iosClientReleaseType === Kernel.ExpoClientReleaseType.APPLE_APP_STORE;

function isIOS14(): boolean {
  if (Platform.OS !== 'ios') return false;
  const versionNumber = parseInt(String(Platform.Version), 10);
  return versionNumber >= 14;
}

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  isIOS14,
};
