import { ExpoConfig } from '@expo/config';
import semver from 'semver';

export function ltSdkVersion(expJson: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean {
  if (!expJson.sdkVersion) {
    return false;
  }

  if (expJson.sdkVersion === 'UNVERSIONED') {
    return true;
  }
  try {
    return semver.lt(expJson.sdkVersion, sdkVersion);
  } catch (e) {
    throw new Error(
      //'INVALID_VERSION',
      `${expJson.sdkVersion} is not a valid version. Must be in the form of x.y.z`
    );
  }
}
