import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { printPackageParcel } from '../helpers';
import { CommandOptions, Parcel, ReleaseType, TaskArgs } from '../types';
import { findUnpublished } from './findUnpublished';
import {
  resolveReleaseTypeAndVersion,
  resolveSuggestedVersion,
} from './resolveReleaseTypeAndVersion';

const { green, cyan, red } = chalk;
const CUSTOM_VERSION_CHOICE_VALUE = 'custom-version';

/**
 * Prompts which suggested packages are going to be published.
 */
export const selectPackagesToPublish = new Task<TaskArgs>(
  {
    name: 'selectPackagesToPublish',
    dependsOn: [findUnpublished, resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<symbol | TaskArgs> => {
    logger.info('\n👉 Selecting packages to publish...');

    const newParcels: Parcel[] = [];

    for (const parcel of parcels) {
      printPackageParcel(parcel);

      if (await selectPackageToPublishAsync(parcel, options)) {
        newParcels.push(parcel);
      }
    }
    if (newParcels.length === 0) {
      logger.success('🤷‍♂️ There is nothing to be published.');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);

/**
 * Prompts the user to confirm whether the package should be published.
 * It immediately returns `true` if it's run on the CI.
 */
async function selectPackageToPublishAsync(
  parcel: Parcel,
  options: CommandOptions
): Promise<boolean> {
  if (process.env.CI) {
    return true;
  }
  const packageName = parcel.pkg.packageName;
  const version = parcel.state.releaseVersion;
  const { selected } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'selected',
      prefix: '❔',
      message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(version!)}?`,
      default: true,
    },
  ]);
  if (!selected) {
    const incrementedVersions = incrementVersion(
      parcel.pkg.packageVersion,
      parcel.pkgView?.versions ?? [],
      options.prerelease === true ? 'rc' : options.prerelease || null
    );
    const { version, customVersion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'version',
        prefix: '❔',
        message: `What do you want to do with ${green.bold(packageName)}?`,
        choices: [
          {
            name: "Don't publish",
            value: null,
          },
          ...Object.keys(incrementedVersions).map((type) => {
            return {
              name: `Publish as ${cyan.bold(incrementedVersions[type])} (${type})`,
              value: incrementedVersions[type],
            };
          }),
          {
            name: 'Publish as custom version',
            value: CUSTOM_VERSION_CHOICE_VALUE,
          },
        ],
        validate: validateVersion(parcel),
      },
      {
        type: 'input',
        name: 'customVersion',
        prefix: '❔',
        message: 'Type in custom version to publish:',
        when(answers: Record<string, string>): boolean {
          return answers.version === CUSTOM_VERSION_CHOICE_VALUE;
        },
        validate: validateVersion(parcel),
      },
    ]);
    if (customVersion || version) {
      parcel.state.releaseVersion = customVersion || version;
      return true;
    }
  }
  return selected;
}

/**
 * Creates an object with possible incrementations of given version.
 */
function incrementVersion(
  version: string,
  otherVersions: string[],
  prerelease?: string | null
): Record<string, string> {
  const releaseTypes: ReleaseType[] = [ReleaseType.MAJOR, ReleaseType.MINOR, ReleaseType.PATCH];

  // Add more options for prerelease versions
  if (prerelease) {
    releaseTypes.push(ReleaseType.PREMAJOR, ReleaseType.PREMINOR, ReleaseType.PREPATCH);
  }
  return releaseTypes.reduce((acc, type) => {
    acc[type] = resolveSuggestedVersion(version, otherVersions, type, prerelease);
    return acc;
  }, {});
}

/**
 * Returns a function that validates the version for given parcel.
 */
function validateVersion(parcel: Parcel) {
  return (input: string) => {
    if (input) {
      if (!semver.valid(input)) {
        return red(`${cyan.bold(input)} is not a valid semver version.`);
      }
      if (parcel.pkgView && parcel.pkgView.versions.includes(input)) {
        return red(`${cyan.bold(input)} has already been published.`);
      }
    }
    return true;
  };
}
