import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import * as path from 'path';
import semver from 'semver';

import * as Log from '../log';
import { EXPO_DEBUG } from './env';
import { logNewSection } from './ora';
import { hasPackageJsonDependencyListChangedAsync } from './Podfile';

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
  flags: { silent: boolean } = {
    // default to silent
    silent: !EXPO_DEBUG,
  }
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
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      const config = yamlString ? yaml.safeLoad(yamlString) : {};
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

export async function installCocoaPodsAsync(projectRoot: string) {
  let step = logNewSection('Installing CocoaPods...');
  if (process.platform !== 'darwin') {
    step.succeed('Skipped installing CocoaPods because operating system is not on macOS.');
    return false;
  }

  const packageManager = new PackageManager.CocoaPodsPackageManager({
    cwd: path.join(projectRoot, 'ios'),
    silent: !EXPO_DEBUG,
  });

  if (!(await packageManager.isCLIInstalledAsync())) {
    try {
      // prompt user -- do you want to install cocoapods right now?
      step.text = 'CocoaPods CLI not found in your PATH, installing it now.';
      step.stopAndPersist();
      await PackageManager.CocoaPodsPackageManager.installCLIAsync({
        nonInteractive: true,
        spawnOptions: {
          ...packageManager.options,
          // Don't silence this part
          stdio: ['inherit', 'inherit', 'pipe'],
        },
      });
      step.succeed('Installed CocoaPods CLI.');
      step = logNewSection('Running `pod install` in the `ios` directory.');
    } catch (e) {
      step.stopAndPersist({
        symbol: '⚠️ ',
        text: chalk.red('Unable to install the CocoaPods CLI.'),
      });
      if (e instanceof PackageManager.CocoaPodsError) {
        Log.log(e.message);
      } else {
        Log.log(`Unknown error: ${e.message}`);
      }
      return false;
    }
  }

  try {
    await packageManager.installAsync({ spinner: step });
    // Create cached list for later
    await hasPackageJsonDependencyListChangedAsync(projectRoot).catch(() => null);
    step.succeed('Installed pods and initialized Xcode workspace.');
    return true;
  } catch (e) {
    step.stopAndPersist({
      symbol: '⚠️ ',
      text: chalk.red('Something went wrong running `pod install` in the `ios` directory.'),
    });
    if (e instanceof PackageManager.CocoaPodsError) {
      Log.log(e.message);
    } else {
      Log.log(`Unknown error: ${e.message}`);
    }
    return false;
  }
}
