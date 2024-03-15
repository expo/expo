import chalk from 'chalk';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getFileBasedHashSourceAsync } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';

const debug = require('debug')('expo:fingerprint:sourcer:Packages');

interface PackageSourcerParams {
  /**
   * The package name.
   *
   * Note that the package should be a direct dependency or devDependency of the project.
   * Otherwise on pnpm isolated mode the resolution will fail.
   */
  packageName: string;

  /**
   * Hashing **package.json** file for the package rather than the entire directory.
   * This is useful when the package contains a lot of files.
   */
  packageJsonOnly: boolean;
}

const DEFAULT_PACKAGES: PackageSourcerParams[] = [
  {
    packageName: 'react-native',
    packageJsonOnly: true,
  },
];

export async function getDefaultPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const results = await Promise.all(
    DEFAULT_PACKAGES.map((params) => getPackageSourceAsync(projectRoot, params))
  );
  return results.filter(Boolean) as HashSource[];
}

export async function getPackageSourceAsync(
  projectRoot: string,
  params: PackageSourcerParams
): Promise<HashSource | null> {
  const reason = `package:${params.packageName}`;
  const packageJsonPath = resolveFrom.silent(projectRoot, `${params.packageName}/package.json`);
  if (packageJsonPath == null) {
    return null;
  }

  debug(`Adding package - ${chalk.dim(params.packageName)}`);

  if (params.packageJsonOnly) {
    return {
      type: 'contents',
      id: reason,
      contents: JSON.stringify(require(packageJsonPath)), // keep the json collapsed by serializing/deserializing
      reasons: [reason],
    };
  }

  const packageRoot = path.relative(projectRoot, path.dirname(packageJsonPath));
  return await getFileBasedHashSourceAsync(projectRoot, packageRoot, reason);
}
