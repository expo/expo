import { boolish } from 'getenv';
import semver from 'semver';

import { ExpoConfig } from './Config.types';

/**
 * Should the bundler use .expo file extensions.
 *
 * @param exp
 */
export function isLegacyImportsEnabled(exp: Pick<ExpoConfig, 'sdkVersion'>) {
  if (boolish('EXPO_LEGACY_IMPORTS', false)) {
    console.warn(
      'Dangerously enabled the deprecated `.expo` extensions feature, this functionality may be removed between SDK cycles.'
    );
    return true;
  }
  // Only allow target if the SDK version is available and it's less 41.
  // This is optimized for making future projects work.
  return lteSdkVersion(exp, '40.0.0');
}

function lteSdkVersion(expJson: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean {
  if (!expJson.sdkVersion) {
    return false;
  }

  if (expJson.sdkVersion === 'UNVERSIONED') {
    return false;
  }

  try {
    return semver.lte(expJson.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${expJson.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}
