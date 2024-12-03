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

const supportedSdksString = `${sortedSupportedExpoSdks.map((sdk) => semver.major(sdk)).join('')}`;

const isSupportedSdkVersion = (sdkVersion: string | undefined) => {
  if (!sdkVersion) {
    return false;
  }
  for (const supportedSdk of sortedSupportedExpoSdks) {
    if (semver.satisfies(sdkVersion, `~${supportedSdk}`)) {
      return true;
    }
  }
  return false;
};

export default {
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  isSupportedSdkVersion,
  supportedSdksString,
};
