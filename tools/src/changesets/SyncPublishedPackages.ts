import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { SpawnOptions, spawnAsync, spawnJSONCommandAsync } from '../Utils';
import * as Versions from '../Versions';
import { syncBundledNativeModulesAsync } from '../commands/SyncBundledNativeModules';

type PackageVersion = { name: string; version: string };
export type PublishedPackagesPlan = {
  sdkVersion: string;
  tag: string;
  expoVersion: string;
  templates: PackageVersion[];
  packages: PackageVersion[];
};

export async function getPublishedPackagesPlanAsync(
  root = EXPO_DIR
): Promise<PublishedPackagesPlan> {
  const workspaces = await spawnJSONCommandAsync<(PackageVersion & { private: boolean })[]>(
    'pnpm',
    ['--filter', 'expo', '--filter', './templates/*', 'list', '--depth', '-1', '--json'],
    { cwd: root }
  );
  const expo = workspaces.find((pkg) => pkg.name === 'expo');
  if (!expo) throw new Error('The expo workspace was not found');
  const templates = workspaces
    .filter((pkg) => pkg.name !== 'expo' && !pkg.private)
    .map(({ name, version }) => ({ name, version }));
  const bundled: Record<string, string> = JSON.parse(
    await fs.readFile(path.join(root, 'packages/expo/bundledNativeModules.json'), 'utf8')
  );
  const packages: PackageVersion[] = [{ name: 'expo', version: expo.version }, ...templates];
  for (const [name, range] of Object.entries(bundled)) {
    // Check the version required by this commit, not a newer version satisfying its range.
    const minimum = semver.minVersion(range);
    if (!minimum) throw new Error(`Invalid bundled version for ${name}: ${range}`);
    packages.push({ name, version: minimum.version });
  }
  for (const pkg of packages) {
    if (!pkg.name || !semver.valid(pkg.version)) {
      throw new Error(`Invalid package version: ${pkg.name}@${pkg.version}`);
    }
  }
  const major = semver.major(expo.version);
  return {
    sdkVersion: `${major}.0.0`,
    tag: `sdk-${major}`,
    expoVersion: `~${expo.version}`,
    templates: templates.sort((a, b) => a.name.localeCompare(b.name)),
    packages,
  };
}

type SyncOptions = { env: 'staging' | 'production'; dryRun: boolean };
const defaultDependencies = {
  spawn: async (command: string, args: string[], options?: SpawnOptions) =>
    await spawnAsync(command, args, options),
  view: (pkg: PackageVersion) =>
    spawnJSONCommandAsync<string | string[]>('npm', [
      'view',
      `${pkg.name}@${pkg.version}`,
      'version',
      '--json',
      '--registry=https://registry.npmjs.org/',
      '--prefer-online',
      '--fetch-timeout=10000',
    ]),
  syncModules: syncBundledNativeModulesAsync,
  getVersions: Versions.getVersionsAsync,
  setVersions: Versions.setVersionsAsync,
};

export async function syncPublishedPackagesAsync(
  plan: PublishedPackagesPlan,
  options: SyncOptions,
  dependencies = defaultDependencies
): Promise<void> {
  logger.info(`Sync ${options.env}: SDK ${plan.sdkVersion}${options.dryRun ? ' (dry run)' : ''}`);
  if (options.env === 'production') {
    const { stdout } = await dependencies.spawn('npm', ['--version']);
    if (!semver.satisfies(stdout.trim(), '^11.21.0 || >=12.2.0')) {
      throw new Error('OIDC dist-tags require npm 11.21.0+ (or 12.2.0+ for npm 12).');
    }
  }
  if (!options.dryRun) {
    for (const key of ['EXPO_VERSIONS_SECRET', 'EXPO_SDK_NATIVE_MODULES_SECRET']) {
      if (!process.env[key]) throw new Error(`${key} is not set`);
    }
  }

  if (options.env === 'production') {
    // Finish registry validation before changing any tags or endpoint data.
    logger.info(`Checking ${plan.packages.length} versions on public npm.`);
    for (let index = 0; index < plan.packages.length; index += 8) {
      await Promise.all(
        plan.packages.slice(index, index + 8).map(async (pkg) => {
          const published = await dependencies.view(pkg);
          if (!(Array.isArray(published) ? published : [published]).includes(pkg.version)) {
            throw new Error(`${pkg.name}@${pkg.version} is not published on public npm`);
          }
        })
      );
      const checked = Math.min(index + 8, plan.packages.length);
      if (checked % 32 === 0 || checked === plan.packages.length) {
        logger.info(`npm versions verified: ${checked}/${plan.packages.length}`);
      }
    }
  }
  const host =
    options.env === 'production'
      ? Versions.VersionsApiHost.PRODUCTION
      : Versions.VersionsApiHost.STAGING;
  const versions = await dependencies.getVersions(host);
  if (options.env === 'production') {
    for (const pkg of plan.templates) {
      logger.info(`${pkg.name}@${pkg.version} -> ${plan.tag}${options.dryRun ? ' (dry run)' : ''}`);
      if (!options.dryRun) {
        // npm, rather than pnpm, performs the OIDC exchange for dist-tag writes.
        await dependencies.spawn(
          'npm',
          [
            'dist-tag',
            'add',
            `${pkg.name}@${pkg.version}`,
            plan.tag,
            '--registry=https://registry.npmjs.org/',
          ],
          { stdio: 'inherit' }
        );
      }
    }
  }
  await dependencies.syncModules({ env: options.env, yes: true, dryRun: options.dryRun });
  logger.info(`Syncing SDK ${plan.sdkVersion} expoVersion ${plan.expoVersion} to ${options.env}.`);
  if (!options.dryRun) {
    versions.sdkVersions[plan.sdkVersion] = {
      ...versions.sdkVersions[plan.sdkVersion],
      expoVersion: plan.expoVersion,
    };
    await dependencies.setVersions(versions, host);
  }
  logger.success(
    `${options.dryRun ? 'Dry run' : 'Sync'} complete: ${options.env}, SDK ${plan.sdkVersion}.`
  );
}
