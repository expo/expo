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

export default {
  IOSClientReleaseType,
  IsIOSRestrictedBuild,
  supportedSdksString,
};
