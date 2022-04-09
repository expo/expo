import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import semver from 'semver';

import * as Log from '../log';
import { EXPO_DEBUG } from './env';
import { SilentError } from './errors';
import { logNewSection } from './ora';

export type PackageManagerName = 'npm' | 'yarn';

export function resolvePackageManager(options: {
  yarn?: boolean;
  npm?: boolean;
  install?: boolean;
}): PackageManagerName {
  let packageManager: PackageManagerName = 'npm';
  if (options.yarn || (!options.npm && PackageManager.shouldUseYarn())) {
    packageManager = 'yarn';
  } else {
    packageManager = 'npm';
  }
  if (options.install) {
    Log.log(
      packageManager === 'yarn'
        ? `🧶 Using Yarn to install packages. ${chalk.dim('Pass --npm to use npm instead.')}`
        : '📦 Using npm to install packages.'
    );
  }

  return packageManager;
}

export async function installNodeDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { silent?: boolean; clean?: boolean } = {}
) {
  // Default to silent unless debugging.
  const isSilent = flags.silent ?? !EXPO_DEBUG;
  if (flags.clean && packageManager !== 'yarn') {
    // This step can take a couple seconds, if the installation logs are enabled (with EXPO_DEBUG) then it
    // ends up looking odd to see "Installing JavaScript dependencies" for ~5 seconds before the logs start showing up.
    const cleanJsDepsStep = logNewSection('Cleaning JavaScript dependencies');
    const time = Date.now();
    // nuke the node modules
    // TODO: this is substantially slower, we should find a better alternative to ensuring the modules are installed.
    await fs.promises.rm('node_modules', { recursive: true, force: true });
    cleanJsDepsStep.succeed(
      `Cleaned JavaScript dependencies ${chalk.gray(Date.now() - time + 'ms')}`
    );
  }

  const installJsDepsStep = logNewSection('Installing JavaScript dependencies');
  try {
    const time = Date.now();
    await installNodeDependenciesInternalAsync(projectRoot, packageManager, { silent: isSilent });
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

async function installNodeDependenciesInternalAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { silent: boolean }
) {
  const options = { cwd: projectRoot, silent: flags.silent };
  if (packageManager === 'yarn') {
    const yarn = new PackageManager.YarnPackageManager(options);
    const version = await yarn.versionAsync();
    const nodeLinker = await yarn.getConfigAsync('nodeLinker');
    if (semver.satisfies(version, '>=2.0.0-rc.24') && nodeLinker !== 'node-modules') {
      const yarnRc = path.join(projectRoot, '.yarnrc.yml');
      let yamlString = '';
      try {
        yamlString = fs.readFileSync(yarnRc, 'utf8');
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      const config = yamlString ? yaml.safeLoad(yamlString) : {};
      // @ts-ignore
      config.nodeLinker = 'node-modules';
      !flags.silent &&
        Log.warn(
          `Yarn v${version} detected, enabling experimental Yarn v2 support using the node-modules plugin.`
        );
      !flags.silent && Log.log(`Writing ${yarnRc}...`);
      fs.writeFileSync(yarnRc, yaml.safeDump(config));
    }
    await yarn.installAsync();
  } else {
    await new PackageManager.NpmPackageManager(options).installAsync();
  }
}
