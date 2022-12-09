import chalk from 'chalk';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { getFileBasedHashSourceAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

export async function getPatchPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const result = await getFileBasedHashSourceAsync(projectRoot, 'patches', 'patchPackage');
  if (result != null) {
    debug(`Adding dir - ${chalk.dim('patches')}`);
    return [result];
  }
  return [];
}
