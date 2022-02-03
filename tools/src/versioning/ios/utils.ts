import path from 'path';

import { IOS_DIR, VERSIONED_RN_IOS_DIR } from '../../Constants';

/**
 * Returns the prefix that we add to filenames and symbols for given SDK number.
 */
export function getVersionPrefix(sdkNumber: number): string {
  return `ABI${sdkNumber}_0_0`;
}

/**
 * Returns the target directory with versioned code for given SDK number.
 */
export function getVersionedDirectory(sdkNumber: number): string {
  return path.join(IOS_DIR, 'versioned', `sdk${sdkNumber}`);
}

/**
 * Returns the path to versioned ExpoKit lib.
 */
export function getVersionedExpoKitPath(versionName: string): string {
  return path.join(VERSIONED_RN_IOS_DIR, versionName, 'Expo', 'ExpoKit');
}
