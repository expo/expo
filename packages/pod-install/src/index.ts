#!/usr/bin/env node

import { CocoaPodsPackageManager } from '@expo/package-manager/build/CocoaPodsPackageManager';
import chalk from 'chalk';
import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

import shouldUpdate from './update';
import { learnMore } from './utils';

const packageJSON = require('../package.json');

let projectRoot: string = '';

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .description('Install pods in your project')
  .option('--quiet', 'Only print errors')
  .option('--non-interactive', 'Disable interactive prompts')
  .action((inputProjectRoot: string) => (projectRoot = inputProjectRoot))
  .allowUnknownOption()
  .parse(process.argv);

const info = (message: string) => {
  if (!program.quiet) {
    console.log(message);
  }
};

async function runAsync(): Promise<void> {
  projectRoot = resolve(projectRoot.trim());

  if (process.platform !== 'darwin') {
    info(chalk.red('CocoaPods is only supported on darwin machines'));
    return;
  }

  const possibleProjectRoot = CocoaPodsPackageManager.getPodProjectRoot(projectRoot);
  if (!possibleProjectRoot) {
    const packageJsonPath = join(projectRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      const jsonData = JSON.parse(readFileSync(packageJsonPath).toString());
      const hasExpoPackage = jsonData.dependencies?.hasOwnProperty('expo');

      if (hasExpoPackage) {
        info(
          chalk.yellow(
            `No 'ios' directory found, skipping installing pods. Pods will be automatically installed when the 'ios' directory is generated with 'npx expo prebuild' or 'npx expo run:ios'.`,
            learnMore('https://docs.expo.dev/workflow/prebuild/')
          )
        );
        return;
      }
    }

    info(chalk.yellow('CocoaPods is not supported in this project'));
    return;
  } else {
    projectRoot = possibleProjectRoot;
  }

  if (!(await CocoaPodsPackageManager.isCLIInstalledAsync())) {
    await CocoaPodsPackageManager.installCLIAsync({ nonInteractive: program.nonInteractive });
  }
  const manager = new CocoaPodsPackageManager({ cwd: projectRoot });
  try {
    await manager.installAsync();
  } catch (error: any) {
    if (error.isPackageManagerError) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
    // throw unhandled
    throw error;
  }
}

(async () => {
  program.parse(process.argv);
  info('Scanning for pods...');
  try {
    await runAsync();
    if (!program.quiet) {
      await shouldUpdate();
    }
  } catch (reason: any) {
    console.log();
    console.log('Aborting run');
    if (reason.command) {
      console.log(`  ${chalk.magenta(reason.command)} has failed.`);
    } else {
      console.log(chalk.red`An unexpected error was encountered. Please report it as a bug:`);
      console.log(reason);
    }
    console.log();
    if (!program.quiet) {
      await shouldUpdate();
    }
    process.exit(1);
  }
})();
