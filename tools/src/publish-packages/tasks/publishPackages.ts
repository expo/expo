import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import { checkPackageAccess } from './checkPackageAccess';
import { selectPackagesToPublish } from './selectPackagesToPublish';
import Git from '../../Git';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, cyan, yellow } = chalk;

/**
 * Publishes all packages that have been selected to publish.
 */
export const publishPackages = new Task<TaskArgs>(
  {
    name: 'publishPackages',
    dependsOn: [selectPackagesToPublish, checkPackageAccess],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🚀 Publishing packages...');

    const gitHead = await Git.getHeadCommitHashAsync();

    // check if two factor auth is required for publishing
    const npmProfile = await Npm.getProfileAsync();
    const requiresOTP = npmProfile?.tfa?.mode === 'auth-and-writes';

    for (const { pkg, state } of parcels) {
      const packageJsonPath = path.join(pkg.path, 'package.json');
      const releaseVersion = state.releaseVersion;

      if (!releaseVersion) {
        continue;
      }

      logger.log(
        '  ',
        `${green(pkg.packageName)} version ${cyan(releaseVersion)} as ${yellow(options.tag)}`
      );

      // If there is a tarball already built, use it instead of packing it again
      const packageSource = await findPackageSource(pkg, state.packageTarballFilename);

      // Update `gitHead` property so it will be available to read using `npm view --json`.
      // Next publish will depend on this to properly get changes made after that.
      await JsonFile.setAsync(packageJsonPath, 'gitHead', gitHead);

      // Publish the package.
      try {
        await Npm.publishPackageAsync(pkg.path, {
          source: packageSource,
          tagName: options.tag,
          dryRun: options.dry,
          spawnOptions: {
            stdio: requiresOTP ? 'inherit' : undefined,
          },
        });
      } catch (error) {
        if (error.stderr.includes('You cannot publish over the previously published versions:')) {
          const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
            {
              type: 'confirm',
              name: 'confirmed',
              message: `Package ${pkg.packageName}@${releaseVersion} has already been published. Do you want to skip?`,
              default: true,
            },
          ]);
          if (!confirmed) {
            throw error;
          }
        } else {
          throw error;
        }
      }

      // Delete `gitHead` from `package.json` – no need to clutter it.
      await JsonFile.deleteKeyAsync(packageJsonPath, 'gitHead');

      // Update stored package.json
      pkg.packageJson.version = releaseVersion;

      state.published = true;
    }
  }
);

/**
 * Finds the package source to publish from. If the tarball filename is provided and the file exists, it's returned.
 * Otherwise the source is the current directory.
 */
async function findPackageSource(pkg: Package, tarballFilename?: string): Promise<string> {
  if (tarballFilename) {
    const tarballPath = path.join(pkg.path, tarballFilename);

    if (await fs.pathExists(tarballPath)) {
      return tarballFilename;
    }
  }
  return '.';
}
