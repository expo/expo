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

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
};
