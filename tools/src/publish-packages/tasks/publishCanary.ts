import chalk from 'chalk';
import semver from 'semver';

import Git from '../../Git';
import logger from '../../Logger';
import { sdkVersionAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { checkEnvironmentTask } from './checkEnvironmentTask';
import { loadRequestedParcels } from './loadRequestedParcels';
import { packPackageToTarball } from './packPackageToTarball';
import { publishPackages } from './publishPackages';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateModuleTemplate } from './updateModuleTemplate';
import { updatePackageVersions } from './updatePackageVersions';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';

const { cyan } = chalk;

/**
 * An array of packages whose version is constrained to the SDK version.
 */
const SDK_CONSTRAINED_PACKAGES = ['expo', 'jest-expo', '@expo/config-types'];

/**
 * Prepare packages to be published as canaries.
 */
export const prepareCanaries = new Task<TaskArgs>(
  {
    name: 'prepareCanaries',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const canaryVersion = await generateCanaryVersion();
    const nextSdkVersion = await getNextSdkVersion();

    for (const { pkg, state, pkgView } of parcels) {
      const version = findNextAvailableCanaryVersion(canaryVersion, pkgView?.versions ?? []);

      if (SDK_CONSTRAINED_PACKAGES.includes(pkg.packageName)) {
        state.releaseVersion = version.replace('0.0.0', nextSdkVersion);
      } else {
        state.releaseVersion = version;
      }
    }

    // Override the tag option – canary releases should always use `canary` tag
    options.tag = 'canary';
    options.dry = true;
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
      updatePackageVersions,
      updateBundledNativeModulesFile,
      updateModuleTemplate,
      updateWorkspaceProjects,
      packPackageToTarball,
      publishPackages,
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
 * Generates a canary version for the current date and HEAD commit hash.
 */
async function generateCanaryVersion() {
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

  return `0.0.0-canary-${year}${month}${day}-${shortCommitHash}`;
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

    if (publishedCanaryVersions.includes(canaryRevision)) {
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
