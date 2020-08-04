import chalk from 'chalk';
import inquirer from 'inquirer';
import semver from 'semver';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { printPackageParcel } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { findUnpublished } from './findUnpublished';
import { resolveReleaseTypeAndVersion } from './resolveReleaseTypeAndVersion';

const { green, cyan, red, gray } = chalk;

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

      if (await selectPackageToPublishAsync(parcel)) {
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
async function selectPackageToPublishAsync(parcel: Parcel): Promise<boolean> {
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
    const { version } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        prefix: '❔',
        message: `Do you want to use different version? ${gray('(leave empty to skip)')}`,
        validate(input: string) {
          if (input) {
            if (!semver.valid(input)) {
              return red(`${cyan.bold(input)} is not a valid semver version.`);
            }
            if (parcel.pkgView && parcel.pkgView.versions.includes(input)) {
              return red(`${cyan.bold(input)} has already been published.`);
            }
          }
          return true;
        },
      },
    ]);
    if (version) {
      parcel.state.releaseVersion = version;
      return true;
    }
  }
  return selected;
}
