import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

import * as Log from '../log';
import type { Options } from './resolveOptions';
import { getRunningProcess } from '../utils/getRunningProcess';

/**
 * Given a list of incompatible packages, installs the correct versions of the packages with the package manager used for the project.
 * This exits immediately after spawning the install command, since the command shouldn't remain running while it is being updated.
 */
export async function installExpoPackageAsync(
  projectRoot: string,
  {
    packageManager,
    packageManagerArguments,
    expoPackageToInstall,
    followUpCommandArgs,
    dev,
  }: Pick<Options, 'dev'> & {
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
    expoPackageToInstall: string;
    followUpCommandArgs: string[];
  }
) {
  // Check if there's potentially a dev server running in the current folder and warn about it
  // (not guaranteed to be Expo CLI, and the CLI isn't always running on 8081, but it's a good guess)
  const isExpoMaybeRunningForProject = !!(await getRunningProcess(8081));

  if (isExpoMaybeRunningForProject) {
    Log.warn(
      'The Expo CLI appears to be running this project in another terminal window. Close and restart any Expo CLI instances after the installation to complete the update.'
    );
  }

  // Safe to use current process to upgrade Expo package- doesn't affect current process
  try {
    if (dev) {
      await packageManager.addDevAsync([...packageManagerArguments, expoPackageToInstall]);
    } else {
      await packageManager.addAsync([...packageManagerArguments, expoPackageToInstall]);
    }
  } catch (error) {
    Log.error(
      chalk`Cannot install the latest Expo package. Install {bold expo@latest} with ${packageManager.name} and then run {bold npx expo install} again.`
    );
    throw error;
  }

  // Spawn a new process to install the rest of the packages if there are any, as only then will the latest Expo package be used
  if (followUpCommandArgs.length) {
    let commandSegments = ['expo', 'install', dev ? '--dev' : '', ...followUpCommandArgs].filter(
      Boolean
    );
    if (packageManagerArguments.length) {
      commandSegments = [...commandSegments, '--', ...packageManagerArguments];
    }

    Log.log(chalk`\u203A Running {bold npx expo install} under the updated expo version`);
    Log.log('> ' + commandSegments.join(' '));

    await spawnAsync('npx', commandSegments, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env },
    });
  }
}
