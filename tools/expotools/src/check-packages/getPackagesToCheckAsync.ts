import chalk from 'chalk';

import Git from '../Git';
import logger from '../Logger';
import { formatCommitHash } from '../Formatter';
import { getListOfPackagesAsync } from '../Packages';
import { ActionOptions } from './types';

const { yellow } = chalk;

async function safeGetMergeBaseAsync(ref: string): Promise<string | null> {
  try {
    return Git.mergeBaseAsync(ref);
  } catch (e) {
    logger.error(`🛑 Cannot get merge base for reference: ${yellow(ref)}\n`, e.stack);
    return null;
  }
}

/**
 * Resolves which packages should go through checks based on given options.
 */
export default async function getPackagesToCheckAsync(options: ActionOptions) {
  const { all, packageNames } = options;

  const allPackages = (await getListOfPackagesAsync()).filter((pkg) => {
    // If the package doesn't have build or test script, just skip it.
    return pkg.scripts.build || pkg.scripts.test;
  });

  if (all) {
    return allPackages;
  }
  if (packageNames.length > 0) {
    return allPackages.filter((pkg) => {
      return packageNames.length === 0 || packageNames.includes(pkg.packageName);
    });
  }

  const sinceRef = options.since ?? 'master';
  const mergeBase = await safeGetMergeBaseAsync(sinceRef);

  if (!mergeBase) {
    logger.warn(
      `😿 Couldn't find merge base with ${yellow(sinceRef)}, falling back to all packages\n`
    );
    return allPackages;
  }

  logger.info(`😺 Using incremental checks since ${formatCommitHash(mergeBase)} commit\n`);
  const changedFiles = await Git.logFilesAsync({ fromCommit: mergeBase });

  return allPackages.filter((pkg) => {
    const pkgPath = pkg.path.replace(/([^\/])$/, '$1/');
    return changedFiles.some(({ path }) => path.startsWith(pkgPath));
  });
}
