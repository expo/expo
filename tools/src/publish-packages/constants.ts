import path from 'path';

import { ReleaseType } from './types';
import { EXPOTOOLS_DIR } from '../Constants';

/**
 * File name of the backup file.
 */
export const BACKUP_FILE_NAME = 'publish-packages.backup.json';

/**
 * Absolute path to the backup file.
 */
export const BACKUP_PATH = path.join(EXPOTOOLS_DIR, 'cache', BACKUP_FILE_NAME);

/**
 * Time in milliseconds after which the backup is treated as no longer valid.
 */
export const BACKUP_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * An array of option names that are stored in the backup and
 * are required to stay the same to use the backup at next call.
 */
export const BACKUPABLE_OPTIONS_FIELDS = [
  'packageNames',
  'prerelease',
  'tag',
  'commitMessage',
  'dry',
] as const;

/**
 * An array of release types in the order from patch to major.
 */
export const RELEASE_TYPES_ASC_ORDER = [ReleaseType.PATCH, ReleaseType.MINOR, ReleaseType.MAJOR];

/**
 * Shared tooling packages that should not trigger the "publish dependents?" cascade.
 * These packages are depended on by nearly every package in the monorepo, so any change
 * to them would otherwise prompt to republish dozens of packages unnecessarily.
 *
 * They are still published normally when they have changes — they just don't cascade.
 * Use `--cascade-all` to override this filter.
 */
export const NON_CASCADING_PACKAGES = new Set([
  'expo-module-scripts',
  'babel-preset-expo',
  'eslint-config-universe',
  'jest-expo',
  '@expo/config',
  '@expo/json-file',
]);
