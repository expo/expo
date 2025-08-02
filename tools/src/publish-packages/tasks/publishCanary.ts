import chalk from 'chalk';
import semver from 'semver';

import { checkEnvironmentTask } from './checkEnvironmentTask';
import { checkPackageAccess } from './checkPackageAccess';
import { loadRequestedParcels } from './loadRequestedParcels';
import { packPackageToTarball } from './packPackageToTarball';
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
import { updateAndroidProjects } from './updateAndroidProjects';

const { cyan } = chalk;

/**
 * An array of packages whose version is constrained to the SDK version.
 */
const SDK_CONSTRAINED_PACKAGES = ['expo', 'jest-expo', '@expo/config-types'];
const TEMPLATE_PREFIX = 'expo-template-';
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
    const nextSdkVersion = await getNextSdkVersion();

    for (const parcel of parcels) {
      const { pkg, state, pkgView } = parcel;
      const baseVersion =
        SDK_CONSTRAINED_PACKAGES.includes(pkg.packageName) ||
        pkg.packageName.startsWith(TEMPLATE_PREFIX)
          ? nextSdkVersion
          : (await resolveReleaseTypeAndVersion(parcel, options)).releaseVersion;

      // Strip any pre-release tag from the baseVersion
      // For example, convert "5.0.0-rc.0" or "5.0.0-preview.0" to "5.0.0"
      // This is to ensure we don't stack the canary suffix on top of another
      const cleanBaseVersion = semver.coerce(baseVersion)?.version ?? baseVersion;

      state.releaseVersion = findNextAvailableCanaryVersion(
        `${cleanBaseVersion}-${canarySuffix}`,
        pkgView?.versions ?? []
      );
    }

    // Override the tag option – canary releases should always use `canary` tag
    options.tag = 'canary';
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
            'templates/*/package.json',
          ],
        });

        // Remove tarballs created by `npm pack`.
        await Git.cleanAsync({
          recursive: true,
          force: true,
          paths: ['packages/**/*.tgz', 'packages/**/local-maven-repo/**', 'templates/**/*.tgz'],
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
      packPackageToTarball,
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
