import { styleText } from 'node:util';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { isIgnoredPathWithMatchObjects } from '../utils/Path';
import { getFileBasedHashSourceAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

export async function getPatchPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (isIgnoredPathWithMatchObjects('patches', options.ignoreDirMatchObjects)) {
    debug(`Skipping dir - ${styleText('dim', 'patches')} (ignored by ignoreDirMatchObjects)`);
    return [];
  }
  const result = await getFileBasedHashSourceAsync(projectRoot, 'patches', 'patchPackage');
  if (result != null) {
    debug(`Adding dir - ${styleText('dim', 'patches')}`);
    return [result];
  }
  return [];
}
