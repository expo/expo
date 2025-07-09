import chalk from 'chalk';

import { ActionOptions } from './types';
import { formatCommitHash } from '../Formatter';
import Git from '../Git';
import logger from '../Logger';
import { getListOfPackagesAsync, Package } from '../Packages';

const { yellow } = chalk;

async function safeGetMergeBaseAsync(ref: string): Promise<string | null> {
  try {
    return await Git.mergeBaseAsync(ref);
  } catch (e) {
    logger.error(`🛑 Cannot get merge base for reference: ${yellow(ref)}\n`, e.stack);
    return null;
  }
}

/**
 * Resolves which packages should go through checks based on given options.
 */
export default async function getPackagesToCheckAsync(options: ActionOptions) {
  const { all, packageNames, core } = options;

  const allPackages = (await getListOfPackagesAsync()).filter((pkg) => {
    // If the package doesn't have build or test script, just skip it.
    return pkg.scripts.build || pkg.scripts.test;
  });

  if (all) {
    return allPackages;
  }

  const packagesToCheck: Set<Package> = new Set();

  if (core) {
    allPackages
      .filter((pkg) => pkg.packageName === 'expo' || pkg.packageName === 'expo-modules-core')
      .forEach((pkg) => packagesToCheck.add(pkg));
  }

  if (packageNames.length > 0) {
    allPackages
      .filter((pkg) => packageNames.includes(pkg.packageName))
      .forEach((pkg) => packagesToCheck.add(pkg));
    return packagesToCheck;
  }

  const sinceRef = options.since ?? 'main';
  const mergeBase = await safeGetMergeBaseAsync(sinceRef);

  if (!mergeBase) {
    logger.warn(
      `😿 Couldn't find merge base with ${yellow(sinceRef)}, falling back to all packages\n`
    );
    return allPackages;
  }
  logger.info(
    `😺 Using incremental checks since ${formatCommitHash(mergeBase)} commit. Use -a to check all packages.\n`
  );
  const changedFiles = await Git.logFilesAsync({ fromCommit: mergeBase });

  allPackages
    .filter((pkg) => {
      const pkgPath = pkg.path.replace(/([^\/])$/, '$1/');
      return changedFiles.some(({ path }) => path.startsWith(pkgPath));
    })
    .forEach((pkg) => packagesToCheck.add(pkg));
  return packagesToCheck;
}
