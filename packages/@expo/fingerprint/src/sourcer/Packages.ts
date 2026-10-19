import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { toPosixPath } from '../utils/Path';
import { getFileBasedHashSourceAsync } from './Utils';

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
   * How the package is hashed.
   * - `package`: by its `package.json` name+version, ignoring unrelated churn inside the package.
   * - `files`: by its entire directory.
   */
  sourceType: 'files' | 'package';
}

const DEFAULT_PACKAGES: PackageSourcerParams[] = [
  {
    packageName: 'react-native',
    sourceType: 'package',
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

  if (params.sourceType === 'package') {
    let packageJson: { name?: string; version?: string };
    try {
      packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    } catch (error: any) {
      // A resolved package.json that can't be read shouldn't crash fingerprinting; skip the source.
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
    return {
      type: 'package',
      name: packageJson.name ?? '',
      version: packageJson.version ?? '',
      filePath: toPosixPath(path.relative(projectRoot, packageJsonPath)),
      reasons: [reason],
    };
  }

  const packageRoot = path.relative(projectRoot, path.dirname(packageJsonPath));
  return await getFileBasedHashSourceAsync(projectRoot, packageRoot, reason);
}
