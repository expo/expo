import * as PackageManager from '@expo/package-manager';
import { spawn } from 'child_process';

import * as Log from '../log';
import { getRunningExpoProcessesForDirectory } from '../utils/getRunningProcess';
import { isInteractive } from '../utils/interactive';
import { confirmAsync } from '../utils/prompts';

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
  const runningExpoProcesses = await getRunningExpoProcessesForDirectory(projectRoot);

  if (runningExpoProcesses.length) {
    Log.warn(
      'The Expo CLI is running this project in another terminal window. It must be closed before installing.'
    );
    let killExpoProcesses = false;
    if (isInteractive()) {
      killExpoProcesses = await confirmAsync({ message: 'Kill Expo CLI processes?' });
    }

    if (killExpoProcesses) {
      runningExpoProcesses.forEach((pid) => {
        process.kill(pid);
      });
    } else {
      Log.exit(
        'Aborting install since the Expo CLI is running. Kill any open Expo CLI processes for this project and try again.',
        1
      );
    }
  }

  const expoInstallCommand = await packageManager.addDeferredAsync([
    ...packageManagerArguments,
    expoPackageToInstall,
  ]);

  followUpCommand && Log.log(`> ${followUpCommand}`);

  const detachedCommandToRun = followUpCommand
    ? `${expoInstallCommand} && ${followUpCommand}` /* && is critical here so we avoid an infinite loop in the case where the expo install command fails */
    : expoInstallCommand;

  spawn(detachedCommandToRun!, {
    ...packageManager.options,
    detached: true,
    shell: true,
  });
}
