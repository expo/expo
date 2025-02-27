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

const packagesToCheck: Package[] = [];

/**
 * Adds packages to the list of packages to check. Ignores duplicates.
 */
function addPackages(packagesToAdd: Package[]) {
  for (const pkg of packagesToAdd) {
    if (!packagesToCheck.includes(pkg)) {
      packagesToCheck.push(pkg);
    }
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

  if (core) {
    addPackages(
      allPackages.filter(
        (pkg) => pkg.packageName === 'expo' || pkg.packageName === 'expo-modules-core'
      )
    );
  }

  if (packageNames.length > 0) {
    addPackages(allPackages.filter((pkg) => packageNames.includes(pkg.packageName)));
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
  logger.info(`😺 Using incremental checks since ${formatCommitHash(mergeBase)} commit\n`);
  const changedFiles = await Git.logFilesAsync({ fromCommit: mergeBase });

  addPackages(
    allPackages.filter((pkg) => {
      const pkgPath = pkg.path.replace(/([^\/])$/, '$1/');
      return changedFiles.some(({ path }) => path.startsWith(pkgPath));
    })
  );
  return packagesToCheck;
}
