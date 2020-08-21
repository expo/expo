import Constants from 'expo-constants';
import { Platform } from 'react-native';
import semver from 'semver';

import * as Kernel from '../kernel/Kernel';

const isProduction = !!(
  Constants.manifest.id === '@exponent/home' && Constants.manifest.publishedTime
);

const IOSClientReleaseType = Kernel.iosClientReleaseType;

const IsIOSRestrictedBuild =
  Platform.OS === 'ios' &&
  Kernel.iosClientReleaseType === Kernel.ExpoClientReleaseType.APPLE_APP_STORE;

const SupportedExpoSdks = Constants.supportedExpoSdks || [];

let lowestSupportedSdkVersion: number = -1;

if (SupportedExpoSdks.length > 0) {
  lowestSupportedSdkVersion = semver.major(SupportedExpoSdks[0]);
}

const supportedSdksString = `SDK${
  SupportedExpoSdks.length === 1 ? ':' : 's:'
} ${SupportedExpoSdks.map(semver.major)
  .sort((a, b) => a - b)
  .join(', ')}`;

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  lowestSupportedSdkVersion,
  supportedSdksString,
};
