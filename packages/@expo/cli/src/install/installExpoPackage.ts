import { spawnAsync } from '@expo/osascript';
import * as PackageManager from '@expo/package-manager';

import * as Log from '../log';
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
    followUpCommand,
  }: {
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
    expoPackageToInstall: string;
    followUpCommand: string | undefined;
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
  await packageManager.addAsync([expoPackageToInstall]);

  // TODO: error handling

  // But, we need to spawn a new process to install the rest of the packages, as only then will the latest Expo package be used
  if (followUpCommand) {
    // TODO: need to split up follow-up command into arguments
    await spawnAsync([followUpCommand]);
  }

  // TODO: possible conclusion message
}
