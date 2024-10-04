import Constants from 'expo-constants';
import { Platform } from 'react-native';
import semver from 'semver';

import * as Kernel from '../kernel/Kernel';

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
} ${sortedSupportedExpoSdks.map((sdk) => semver.major(sdk)).join(', ')}`;

export default {
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  lowestSupportedSdkVersion,
  supportedSdksString,
};
