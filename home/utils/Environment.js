import Constants from 'expo-constants';
import { Platform } from 'react-native';

import ExponentKernel from './ExponentKernel';

const isProduction = !!(
  Constants.manifest.id === '@exponent/home' && Constants.manifest.publishedTime
);

const IOSClientReleaseType = ExponentKernel.IOSClientReleaseType;

const IsIOSRestrictedBuild =
  Platform.OS === 'ios' && ExponentKernel.IOSClientReleaseType === 'APPLE_APP_STORE';

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
};
