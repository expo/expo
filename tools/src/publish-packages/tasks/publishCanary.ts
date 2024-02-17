import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import { checkEnvironmentTask } from './checkEnvironmentTask';
import { checkPackageAccess } from './checkPackageAccess';
import { loadRequestedParcels } from './loadRequestedParcels';
import { packPackageToTarball } from './packPackageToTarball';
import { publishPackages } from './publishPackages';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateModuleTemplate } from './updateModuleTemplate';
import { updatePackageVersions } from './updatePackageVersions';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import Git from '../../Git';
import logger from '../../Logger';
import { sdkVersionAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { getSuggestedVersions, resolveReleaseTypeAndVersion, validateVersion } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, cyan } = chalk;

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
    const canarySuffix = await getCurrentCanaryVersionSuffix();
    const nextSdkVersion = await getNextSdkVersion();

    for (const parcel of parcels) {
      const releaseVersion = resolveReleaseTypeAndVersion(parcel, options);

      const { pkg, state, pkgView } = parcel;
      let baseVersion = SDK_CONSTRAINED_PACKAGES.includes(pkg.packageName)
        ? nextSdkVersion
        : releaseVersion;

      const { selected } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'selected',
          message: `Do you want to publish ${green.bold(
            pkg.packageName
          )} with base canary version ${cyan.bold(baseVersion)}?`,
          default: true,
        },
      ]);

      if (!selected) {
        const suggestedBaseVersions = getSuggestedVersions(
          parcel.pkg.packageVersion,
          parcel.pkgView?.versions ?? [],
          null
        );

        const customVersionId = 'custom-version';
        const { version, customVersion } = await inquirer.prompt([
          {
            type: 'list',
            name: 'version',
            message: `What do you want to do with ${green.bold(pkg.packageName)}?`,
            choices: [
              {
                name: "Don't publish",
                value: null,
              },
              ...suggestedBaseVersions.map((version) => {
                return {
                  name: `Publish with canary base version set to ${cyan.bold(version)}`,
                  value: version,
                };
              }),
              {
                name: 'Publish with custom canary base version',
                value: customVersionId,
              },
            ],
            validate: validateVersion(parcel),
          },
          {
            type: 'input',
            name: 'customVersion',
            message: 'Type in custom version to publish:',
            when(answers: Record<string, string>): boolean {
              return answers.version === customVersionId;
            },
            validate: validateVersion(parcel),
          },
        ]);

        if (customVersion || version) {
          baseVersion = customVersion ?? version;
        } else {
          throw new Error('Must select base canary version');
        }
      }

      const nextAvailableCanaryVersion = findNextAvailableCanaryVersion(
        `${baseVersion}-${canarySuffix}`,
        pkgView?.versions ?? []
      );

      state.releaseVersion = nextAvailableCanaryVersion;
    }

    // Override the tag option – canary releases should always use `canary` tag
    options.tag = 'canary';
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
      // packPackageToTarball,
      // publishPackages,
    ],
  },
  async (parcels: Parcel[]) => {
    const count = parcels.length;

    logger.success(
      `\n✅ Successfully published ${cyan.bold(count + '')} package${count > 1 ? 's' : ''}.\n`
    );
    logger.info(
      'The script has left some changes in your working directory, make sure to clean them up.'
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
