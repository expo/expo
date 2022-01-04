import chalk from 'chalk';
import fs from 'fs-extra';

import { SilentError } from '../utils/errors';
import { logNewSection } from '../utils/ora';
import * as CreateApp from '../utils/CreateApp';

/**
 * Wraps PackageManager to install node modules and adds CLI logs.
 *
 * @param projectRoot
 */
export async function installNodeDependenciesAsync(
  projectRoot: string,
  packageManager: 'yarn' | 'npm',
  { clean = true }: { clean: boolean }
) {
  if (clean && packageManager !== 'yarn') {
    // This step can take a couple seconds, if the installation logs are enabled (with EXPO_DEBUG) then it
    // ends up looking odd to see "Installing JavaScript dependencies" for ~5 seconds before the logs start showing up.
    const cleanJsDepsStep = logNewSection('Cleaning JavaScript dependencies');
    const time = Date.now();
    // nuke the node modules
    // TODO: this is substantially slower, we should find a better alternative to ensuring the modules are installed.
    await fs.remove('node_modules');
    cleanJsDepsStep.succeed(
      `Cleaned JavaScript dependencies ${chalk.gray(Date.now() - time + 'ms')}`
    );
  }

  const installJsDepsStep = logNewSection('Installing JavaScript dependencies');
  try {
    const time = Date.now();
    await CreateApp.installNodeDependenciesAsync(projectRoot, packageManager);
    installJsDepsStep.succeed(
      `Installed JavaScript dependencies ${chalk.gray(Date.now() - time + 'ms')}`
    );
  } catch {
    const message = `Something went wrong installing JavaScript dependencies, check your ${packageManager} logfile or run ${chalk.bold(
      `${packageManager} install`
    )} again manually.`;
    installJsDepsStep.fail(chalk.red(message));
    // TODO: actually show the error message from the package manager! :O
    throw new SilentError(message);
  }
}
