import chalk from 'chalk';

import { getFileBasedHashSourceAsync } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';

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
