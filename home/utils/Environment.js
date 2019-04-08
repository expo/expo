import { Constants } from 'expo';
import { NativeModules, Platform } from 'react-native';

const { ExponentKernel } = NativeModules;

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
