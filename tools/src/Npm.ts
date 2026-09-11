import fs from 'fs-extra';
import { glob } from 'glob';
import os from 'os';
import path from 'path';

import { spawnAsync, spawnJSONCommandAsync, SpawnOptions } from './Utils';

export const EXPO_DEVELOPERS_TEAM_NAME = 'expo:developers';
export const EXPO_BOT_ACCOUNT_NAME = 'expo-bot';

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

export type ProfileType = null | {
  name: string;
  email: string;
  tfa: {
    pending: boolean;
    mode: string;
  };
  [key: string]: unknown;
};

/**
 * Represents an object returned by `pnpm pack --json`.
 */
export type PackResult = {
  name: string;
  version: string;
  /** Absolute path to the created tarball. */
  filePath: string;
  files: { path: string }[];
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
 * Runs `npm profile get`. Returns null if user is not authenticated.
 */
export async function getProfileAsync(): Promise<ProfileType> {
  try {
    return await spawnJSONCommandAsync('npm', ['profile', 'get', '--json']);
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
 * Creates a tarball from a package. The returned `filePath` points into a temporary directory.
 *
 * We deliberately don't use `pnpm pack --json` here: pnpm prefixes the JSON
 * output with `prepack`/`prepare` lifecycle script stdout, which breaks
 * `JSON.parse` for packages that define those scripts. Instead we pack into an empty
 * directory, so the tarball we just created is the only file we can find there.
 * Packing into the package directory would be ambiguous: publish runs that fail before
 * the cleanup step leave their tarballs behind, and we cannot tell those apart from a
 * fresh one.
 */
export async function packToTarballAsync(packageDir: string): Promise<PackResult> {
  const destination = await fs.mkdtemp(path.join(os.tmpdir(), 'expotools-pack-'));

  await spawnAsync('pnpm', ['pack', '--pack-destination', destination], {
    cwd: packageDir,
    stdio: 'ignore',
    // Prevent expo-module-scripts from auto-adding --watch during lifecycle scripts
    env: { ...process.env, EXPO_NONINTERACTIVE: '1' },
  });

  const tarballs = await glob('*.tgz', { cwd: destination, absolute: true });
  if (tarballs.length !== 1) {
    throw new Error(
      `Expected \`pnpm pack\` to produce exactly one tarball for ${packageDir} in ${destination}, found ${tarballs.length}.`
    );
  }

  const { name, version } = require(path.join(packageDir, 'package.json'));
  return { name, version, filePath: tarballs[0], files: [] };
}

type PublishOptions = {
  source?: string;
  tagName?: string;
  dryRun?: boolean;
  spawnOptions?: SpawnOptions;
};

/**
 * Publishes a package at given directory to the global npm registry.
 */
export async function publishPackageAsync(
  packageDir: string,
  options: PublishOptions = {}
): Promise<void> {
  const args = [
    'publish',
    options.source ?? '.',
    // omitting the tag parameter, will make pnpm publish and mark the as "latest"
    '--tag',
    options.tagName ?? 'latest',
    '--access',
    'public',
    '--no-git-checks',
  ];

  if (options.dryRun) {
    args.push('--dry-run');
  }
  args.push(...maybeNpmOtpFlag());
  await spawnAsync('pnpm', args, {
    cwd: packageDir,
    // Prevent expo-module-scripts from auto-adding --watch during lifecycle scripts
    env: { ...process.env, EXPO_NONINTERACTIVE: '1' },
    ...options.spawnOptions,
  });
}

function maybeNpmOtpFlag() {
  const { NPM_OTP } = process.env;
  if (NPM_OTP) {
    return ['--otp', NPM_OTP];
  } else {
    return [];
  }
}

/**
 * Adds dist-tag to a specific version of the package.
 */
export async function addTagAsync(
  packageName: string,
  version: string,
  tagName: string,
  spawnOptions?: SpawnOptions
): Promise<void> {
  await spawnAsync(
    'pnpm',
    ['dist-tag', 'add', `${packageName}@${version}`, tagName, ...maybeNpmOtpFlag()],
    spawnOptions
  );
}

/**
 * Removes package's tag with given name. Silently ignores errors when the tag doesn't exist.
 */
export async function removeTagAsync(
  packageName: string,
  tagName: string,
  spawnOptions?: SpawnOptions
): Promise<void> {
  try {
    await spawnAsync(
      'pnpm',
      ['dist-tag', 'rm', packageName, tagName, ...maybeNpmOtpFlag()],
      spawnOptions
    );
  } catch (error: any) {
    const stderr = String(error?.stderr ?? '');
    if (/is not a dist-tag on/i.test(stderr)) {
      // Tag doesn't exist, nothing to remove.
      return;
    }
    throw error;
  }
}

/**
 * Gets a list of user names in the team with given team name.
 */
export async function getTeamMembersAsync(teamName: string): Promise<string[]> {
  return await spawnJSONCommandAsync('npm', ['team', 'ls', teamName, '--json']);
}

type OrgMembersRecord = Record<string, string>;

/**
 * Resolves to a dictionary that maps members of the organization to their role.
 * Note that npm resolves to an empty dictionary when the request is not authenticated.
 */
export async function getOrgMembersAsync(orgName: string): Promise<OrgMembersRecord> {
  return await spawnJSONCommandAsync<OrgMembersRecord>('npm', ['org', 'ls', orgName, '--json']);
}

type TeamPackagesRecord = Record<string, 'read-only' | 'read-write'>;

/**
 * Resolves to a dictionary of packages and their access level added to the team.
 * Also accepts an organization or user name to list all packages they have access to.
 */
export async function getTeamPackagesAsync(
  teamName: string = EXPO_DEVELOPERS_TEAM_NAME
): Promise<TeamPackagesRecord> {
  return await spawnJSONCommandAsync<TeamPackagesRecord>('npm', [
    'access',
    'list',
    'packages',
    teamName,
    '--json',
  ]);
}

/**
 * Adds a package to organization team granting access to everyone in the team.
 */
export async function grantReadWriteAccessAsync(
  packageName: string,
  teamName: string
): Promise<void> {
  await spawnAsync('npm', [
    'access',
    'grant',
    'read-write',
    teamName,
    packageName,
    ...maybeNpmOtpFlag(),
  ]);
}

/**
 * Resolves to the raw output of `npm owner ls` with the current owners of the
 * package, one `name <email>` entry per line. Unlike the maintainers field
 * from `npm view`, it is not a snapshot from the time of the last publish.
 */
export async function listOwnersAsync(packageName: string): Promise<string> {
  const { stdout } = await spawnAsync('npm', ['owner', 'ls', packageName]);
  return stdout;
}

/**
 * Removes a user from the owners of the package.
 */
export async function removeOwnerAsync(packageName: string, owner: string): Promise<void> {
  await spawnAsync('npm', ['owner', 'rm', owner, packageName, ...maybeNpmOtpFlag()]);
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
