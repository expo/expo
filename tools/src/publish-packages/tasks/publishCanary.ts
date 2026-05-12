import chalk from 'chalk';
import semver from 'semver';

import { checkEnvironmentTask } from './checkEnvironmentTask';
import { checkPackageAccess } from './checkPackageAccess';
import { loadRequestedParcels } from './loadRequestedParcels';
import { publishAndroidArtifacts } from './publishAndroidPackages';
import { publishPackages } from './publishPackages';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateModuleTemplate } from './updateModuleTemplate';
import { updatePackageVersions } from './updatePackageVersions';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import Git from '../../Git';
import logger from '../../Logger';
import { sdkVersionAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { resolveReleaseTypeAndVersion } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { addTemplateTarball } from './addTemplateTarball';
import { bundleIOSPrebuilds } from './bundleIOSPrebuilds';
import { updateAndroidProjects } from './updateAndroidProjects';

const { cyan } = chalk;

/**
 * Prepare packages to be published as canaries.
 */
export const prepareCanaries = new Task<TaskArgs>(
  {
    name: 'prepareCanaries',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const canarySuffix = await getCurrentCanaryVersionSuffix();
    const currentSdkVersion = await sdkVersionAsync();
    const currentSdkMajor = semver.major(currentSdkVersion);
    const currentBranch = await Git.getCurrentBranchNameAsync();
    const isMain = currentBranch === 'main';

    for (const parcel of parcels) {
      const { pkg, state, pkgView } = parcel;
      // On `main`, SDK-versioned packages are bumped to the next major for canary releases
      // (e.g. 55.0.2 → 56.0.0-canary-...) since main represents next-SDK development.
      // On `sdk-*` branches, they get a patch bump (e.g. 55.0.2 → 55.0.3-canary-...)
      // since these are fixes for an already-released SDK.
      const sdkBaseVersion = computeCanaryVersion(
        pkg.packageVersion,
        currentSdkMajor,
        isMain,
        await getNextSdkVersion()
      );
      const baseVersion =
        sdkBaseVersion ?? (await resolveReleaseTypeAndVersion(parcel, options)).releaseVersion;

      // Strip any pre-release tag from the baseVersion
      // For example, convert "5.0.0-rc.0" or "5.0.0-preview.0" to "5.0.0"
      // This is to ensure we don't stack the canary suffix on top of another
      const cleanBaseVersion = semver.coerce(baseVersion)?.version ?? baseVersion;

      state.releaseVersion = findNextAvailableCanaryVersion(
        `${cleanBaseVersion}-${canarySuffix}`,
        pkgView?.versions ?? []
      );
    }

    // Only use the `canary` tag when publishing from `main` or the latest `sdk-*` branch.
    // Other branches publish canary versions without the `canary` dist-tag so they
    // don't overwrite the canary tag that points at main/latest-sdk builds.
    if (await shouldUseCanaryTag(currentBranch)) {
      options.tag = 'canary';
    } else {
      options.tag = `canary-sdk-${currentSdkMajor}`;
    }
  }
);

/**
 * Cleans up all the changes that were made by previously run tasks.
 */
export const cleanWorkingTree = new Task<TaskArgs>(
  {
    name: 'cleanWorkingTree',
    dependsOn: [],
  },
  async () => {
    await runWithSpinner(
      'Cleaning up the working tree',
      async () => {
        // JSON files are automatically added to the index after previous tasks.
        await Git.checkoutAsync({
          ref: 'HEAD',
          paths: [
            'apps/*/package.json',
            'packages/**/package.json',
            'packages/expo-module-template/$package.json',
            'packages/expo/bundledNativeModules.json',
            'packages/**/expo-module.config.json',
            'packages/**/build.gradle',
            'pnpm-lock.yaml',
            'templates/*/package.json',
          ],
        });

        // Remove tarballs created by `npm pack`.
        await Git.cleanAsync({
          recursive: true,
          force: true,
          paths: [
            'packages/**/*.tgz',
            'packages/**/local-maven-repo/**',
            'packages/**/prebuilds/**',
            'templates/**/*.tgz',
          ],
        });
      },
      'Cleaned up the working tree'
    );
  }
);

/**
 * Pipeline with a bunch of tasks required to publish canaries.
 */
export const publishCanaryPipeline = new Task<TaskArgs>(
  {
    name: 'publishCanaryPipeline',
    dependsOn: [
      checkEnvironmentTask,
      loadRequestedParcels,
      prepareCanaries,
      checkPackageAccess,
      updatePackageVersions,
      updateBundledNativeModulesFile,
      updateModuleTemplate,
      updateWorkspaceProjects,
      updateAndroidProjects,
      publishAndroidArtifacts,
      addTemplateTarball,
      bundleIOSPrebuilds,
      publishPackages,
      cleanWorkingTree,
    ],
  },
  async (parcels: Parcel[]) => {
    const count = parcels.length;

    logger.success(
      `\n✅ Successfully published ${cyan.bold(count + '')} package${count > 1 ? 's' : ''}.\n`
    );
  }
);

/**
 * Returns `true` if the current branch should publish with the `canary` dist-tag.
 * Only `main` and the latest `sdk-*` branch qualify.
 */
async function shouldUseCanaryTag(currentBranch: string): Promise<boolean> {
  if (currentBranch === 'main') {
    return true;
  }
  const sdkMatch = currentBranch.match(/^sdk-(\d+)$/);
  if (!sdkMatch) {
    return false;
  }
  const latestSdkBranch = await getLatestRemoteSdkBranchAsync();
  return currentBranch === latestSdkBranch;
}

/**
 * Lists remote `sdk-*` branches and returns the name of the one with the highest number.
 */
async function getLatestRemoteSdkBranchAsync(): Promise<string | null> {
  const { stdout } = await Git.runAsync(['branch', '-r', '--list', 'origin/sdk-*']);
  let maxSdk = -1;
  let latestBranch: string | null = null;

  for (const line of stdout.split('\n')) {
    const match = line.trim().match(/^origin\/sdk-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSdk) {
        maxSdk = num;
        latestBranch = `sdk-${num}`;
      }
    }
  }
  return latestBranch;
}

/**
 * Returns a canary version suffix for the current date and HEAD commit hash.
 */
async function getCurrentCanaryVersionSuffix() {
  const shortCommitHash = (await Git.getHeadCommitHashAsync()).slice(0, 7);
  const date = new Date();
  const year = date.toLocaleString('default', {
    year: 'numeric',
  });
  const month = date.toLocaleString('default', {
    month: '2-digit',
  });
  const day = date.toLocaleString('default', {
    day: '2-digit',
  });

  return `canary-${year}${month}${day}-${shortCommitHash}`;
}

/**
 * Computes the base version for a canary release of an SDK-versioned package.
 * Returns `null` if the package is not SDK-versioned.
 *
 * - On `main`: bumps to the next major SDK version (e.g. 55.0.2 → 56.0.0)
 * - On SDK branches: bumps the patch version (e.g. 55.0.2 → 55.0.3)
 */
export function computeCanaryVersion(
  packageVersion: string,
  currentSdkMajor: number,
  isMainBranch: boolean,
  nextSdkVersion: string
): string | null {
  if (semver.major(packageVersion) !== currentSdkMajor) {
    return null;
  }
  if (isMainBranch) {
    return nextSdkVersion;
  }
  const patchVersion = semver.inc(packageVersion, 'patch');
  if (!patchVersion) {
    throw new Error(`Unable to compute patch version for ${packageVersion}`);
  }
  return patchVersion;
}

/**
 * Finds the next available revision if the current canary version was already published.
 */
function findNextAvailableCanaryVersion(
  canaryVersion: string,
  publishedVersions: string[]
): string {
  // Filter versions that start with the original version
  const publishedCanaryVersions = publishedVersions.filter((version) => {
    return version.startsWith(canaryVersion);
  });

  // If the original canary version was not published yet, just use it
  if (publishedCanaryVersions.length === 0) {
    return canaryVersion;
  }

  // Otherwise look for the next available revision number
  for (let i = 1; i <= publishedCanaryVersions.length; i++) {
    const canaryRevision = `${canaryVersion}-${i}`;

    if (!publishedCanaryVersions.includes(canaryRevision)) {
      return canaryRevision;
    }
  }
  throw new Error(`Unable to find an available canary revision for ${canaryVersion}`);
}

/**
 * Reads the current SDK version and increments its major version following semver rules,
 * that is, if the current version is already a prerelease, the major number stays the same.
 */
async function getNextSdkVersion(): Promise<string> {
  const currentSdkVersion = await sdkVersionAsync();
  const nextMajorVersion = semver.inc(currentSdkVersion, 'major');

  if (!nextMajorVersion) {
    throw new Error('Unable to obtain the next major SDK version');
  }
  return nextMajorVersion;
}
