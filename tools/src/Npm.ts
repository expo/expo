import fs from 'fs-extra';
import glob from 'glob-promise';

import { spawnAsync, spawnJSONCommandAsync } from './Utils';

export const EXPO_DEVELOPERS_TEAM_NAME = 'expo:developers';

export type PackageViewType = null | {
  name: string;
  version: string;
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  versions: string[];
  time: {
    created: string;
    modified: string;
    [time: string]: string;
  };
  maintainers: string[];
  description: string;
  author: string;
  gitHead: string;
  dist: {
    tarball: string;
  };
  // and more but these are the basic ones, we shouldn't need more.
  [key: string]: unknown;
};

/**
 * Runs `npm view` for package with given name. Returns null if package is not published yet.
 */
export async function getPackageViewAsync(
  packageName: string,
  version?: string
): Promise<PackageViewType> {
  try {
    return await spawnJSONCommandAsync('npm', [
      'view',
      version ? `${packageName}@${version}` : packageName,
      '--json',
    ]);
  } catch {
    return null;
  }
}

/**
 * Download npm tarball
 */
export async function downloadPackageTarballAsync(
  targetDir: string,
  packageName: string,
  version?: string
): Promise<string> {
  await fs.ensureDir(targetDir);
  await spawnAsync('npm', ['pack', version ? `${packageName}@${version}` : packageName], {
    cwd: targetDir,
    stdio: 'ignore',
  });
  const result = await glob('*.tgz', { cwd: targetDir });
  if (result.length === 0) {
    throw new Error('Download tarball not found');
  }
  return result[0];
}

/**
 * Publishes a package at given directory to the global npm registry.
 */
export async function publishPackageAsync(
  packageDir: string,
  tagName: string = 'latest',
  dryRun: boolean = false
): Promise<void> {
  const args = ['publish', '--tag', tagName, '--access', 'public'];

  if (dryRun) {
    args.push('--dry-run');
  }
  await spawnAsync('npm', args, {
    cwd: packageDir,
    stdio: 'inherit',
  });
}

/**
 * Adds dist-tag to a specific version of the package.
 */
export async function addTagAsync(
  packageName: string,
  version: string,
  tagName: string
): Promise<void> {
  await spawnAsync('npm', ['dist-tag', 'add', `${packageName}@${version}`, tagName]);
}

/**
 * Removes package's tag with given name.
 */
export async function removeTagAsync(packageName: string, tagName: string): Promise<void> {
  await spawnAsync('npm', ['dist-tag', 'rm', packageName, tagName]);
}

/**
 * Gets a list of user names in the team with given team name.
 */
export async function getTeamMembersAsync(teamName: string): Promise<string[]> {
  return await spawnJSONCommandAsync('npm', ['team', 'ls', teamName, '--json']);
}

/**
 * Adds a package to organization team granting access to everyone in the team.
 */
export async function grantReadWriteAccessAsync(
  packageName: string,
  teamName: string
): Promise<void> {
  await spawnAsync('npm', ['access', 'grant', 'read-write', teamName, packageName]);
}

/**
 * Returns a name of the currently logged in user or `null` if logged out.
 */
export async function whoamiAsync(): Promise<string | null> {
  try {
    const { stdout } = await spawnAsync('npm', ['whoami']);
    return stdout.trim();
  } catch {
    return null;
  }
}
