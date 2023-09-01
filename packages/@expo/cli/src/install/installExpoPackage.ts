import * as PackageManager from '@expo/package-manager';
import { spawn } from 'child_process';

import * as Log from '../log';

/**
 * Given a list of incompatible packages, installs the correct versions of the packages with the package manager used for the project.
 */
export async function installExpoPackage(
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
  const expoInstallCommand = `${packageManager.bin} ${packageManager
    .getAddCommandOptions([...packageManagerArguments, expoPackageToInstall])
    .join(' ')}`;
  Log.log(`> ${expoInstallCommand}`);
  followUpCommand && Log.log(`> ${followUpCommand}`);

  const detachedCommandToRun = followUpCommand
    ? `${expoInstallCommand} && ${followUpCommand}`
    : expoInstallCommand;

  spawn(detachedCommandToRun, {
    ...packageManager.options,
    detached: true,
    shell: true,
  });
}
