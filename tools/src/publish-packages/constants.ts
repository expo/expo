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
