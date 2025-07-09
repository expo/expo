import chalk from 'chalk';

import { getFileBasedHashSourceAsync } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { isIgnoredPathWithMatchObjects } from '../utils/Path';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

export async function getPatchPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (isIgnoredPathWithMatchObjects('patches', options.ignoreDirMatchObjects)) {
    debug(`Skipping dir - ${chalk.dim('patches')} (ignored by ignoreDirMatchObjects)`);
    return [];
  }
  const result = await getFileBasedHashSourceAsync(projectRoot, 'patches', 'patchPackage');
  if (result != null) {
    debug(`Adding dir - ${chalk.dim('patches')}`);
    return [result];
  }
  return [];
}
