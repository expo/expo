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
  const { releaseVersion } = parcel.state;
  const { selected } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'selected',
      prefix: '❔',
      message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(releaseVersion)}?`,
      default: true,
    },
  ]);

  if (selected) {
    return true;
  }

  const suggestedVersions = getSuggestedVersions(
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
        ...suggestedVersions.map((version) => {
          return {
            name: `Publish as ${cyan.bold(version)}`,
            value: version,
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
    parcel.state.releaseVersion = customVersion ?? version;
    return true;
  }
  return false;
}

/**
 * Returns a list of suggested versions to publish.
 */
function getSuggestedVersions(
  version: string,
  otherVersions: string[],
  prerelease?: string | null
): string[] {
  const [currentPrereleaseId] = semver.prerelease(version) ?? [];

  // The current version is a prerelease version
  if (typeof currentPrereleaseId === 'string') {
    const prereleaseIds = ['alpha', 'beta', 'rc'];

    if (!prereleaseIds.includes(currentPrereleaseId)) {
      prereleaseIds.unshift(currentPrereleaseId);
    }
    return prereleaseIds
      .slice(prereleaseIds.indexOf(currentPrereleaseId))
      .map((identifier) => {
        return resolveSuggestedVersion(version, otherVersions, ReleaseType.PRERELEASE, identifier);
      })
      .concat(version.replace(/\-.*$/, ''));
  }
  return [ReleaseType.MAJOR, ReleaseType.MINOR, ReleaseType.PATCH].map((type) => {
    return resolveSuggestedVersion(version, otherVersions, type, prerelease);
  });
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
