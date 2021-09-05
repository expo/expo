import Constants from 'expo-constants';
import { Platform } from 'react-native';
import semver from 'semver';

import * as Kernel from '../kernel/Kernel';

const PRODUCTION_EXPONENT_HOME_PROJECT_ID = '6b6c6660-df76-11e6-b9b4-59d1587e6774';

const isProduction = !!(
  (Constants.manifest?.originalFullName === '@exponent/home' ||
    Constants.manifest?.id === '@exponent/home' ||
    Constants.manifest?.projectId === PRODUCTION_EXPONENT_HOME_PROJECT_ID ||
    Constants.manifest2?.extra?.eas?.projectId === PRODUCTION_EXPONENT_HOME_PROJECT_ID) &&
  (Constants.manifest?.publishedTime || Constants.manifest2?.extra?.expoClient?.publishedTime)
);

const IOSClientReleaseType = Kernel.iosClientReleaseType;

const IsIOSRestrictedBuild =
  Platform.OS === 'ios' &&
  Kernel.iosClientReleaseType === Kernel.ExpoClientReleaseType.APPLE_APP_STORE;

const SupportedExpoSdks = Constants.supportedExpoSdks || [];

// Constants.supportedExpoSdks is not guaranteed to be sorted!
const sortedSupportedExpoSdks = SupportedExpoSdks.sort();

let lowestSupportedSdkVersion: number = -1;

if (SupportedExpoSdks.length > 0) {
  lowestSupportedSdkVersion = semver.major(sortedSupportedExpoSdks[0]);
}

const supportedSdksString = `SDK${
  SupportedExpoSdks.length === 1 ? ':' : 's:'
} ${sortedSupportedExpoSdks.map(semver.major).join(', ')}`;

export default {
  isProduction,
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  lowestSupportedSdkVersion,
  supportedSdksString,
};
