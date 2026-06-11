import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { checkPackageAccess } from './checkPackageAccess';
import { selectPackagesToPublish } from './selectPackagesToPublish';
import Git from '../../Git';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { promptOtp, withOtpRetry } from '../../NpmOtp';
import { Task } from '../../TasksRunner';
import { sleepAsync } from '../../Utils';
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

    // Prompt for OTP up front if requested; sets env var read by Npm commands.
    if (options.promptOtp) {
      process.env.NPM_OTP = await promptOtp();
    }

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

      // Update `gitHead` property so it will be available to read using `npm view --json`.
      // Next publish will depend on this to properly get changes made after that.
      if (!pkg.isTemplate()) {
        await JsonFile.setAsync(packageJsonPath, 'gitHead', gitHead);
      }

      // Publish the package directly from its directory. pnpm publish handles
      // pack-and-publish atomically and resolves `workspace:` specs at pack
      // time. We deliberately don't pass a pre-packed tarball: when the
      // directory contains multiple .tgz files (e.g. the embedded
      // template.tgz inside packages/expo/), pnpm picks the wrong one
      // (pnpm/pnpm#7950 and variants), causing publishes to be misdirected.
      try {
        await withOtpRetry(() =>
          Npm.publishPackageAsync(pkg.path, {
            tagName: options.tag,
            dryRun: options.dry,
          })
        );
        // Assign SDK tag when package is a template
        if (pkg.isTemplate() && !options.canary) {
          const sdkTag = `sdk-${semver.major(releaseVersion)}`;
          logger.log('  ', `Assigning ${yellow(sdkTag)} tag to ${green(pkg.packageName)}`);
          if (!options.dry) {
            await sleepAsync(1000); // wait for npm to process the package
            await withOtpRetry(() => Npm.addTagAsync(pkg.packageName, releaseVersion, sdkTag));
          }
        }
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
