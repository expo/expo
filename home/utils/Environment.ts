import Constants from 'expo-constants';
import { Platform } from 'react-native';

import ExponentKernel from '../universal/ExponentKernel';

let isProduction = false;
let IOSClientReleaseType = 'SIMULATOR';
let IsIOSRestrictedBuild = false;

if (ExponentKernel) {
  isProduction = !!(
    Constants.manifest.id === '@exponent/home' && Constants.manifest.publishedTime
  );

  IOSClientReleaseType = ExponentKernel.IOSClientReleaseType;

  IsIOSRestrictedBuild =
    Platform.OS === 'ios' && ExponentKernel.IOSClientReleaseType === 'APPLE_APP_STORE';
}

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
};
