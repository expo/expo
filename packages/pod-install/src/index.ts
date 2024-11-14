#!/usr/bin/env node

import { CocoaPodsPackageManager } from '@expo/package-manager/build/ios/CocoaPodsPackageManager';
import chalk from 'chalk';
import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

import shouldUpdate from './update';
import { learnMore } from './utils';

const packageJSON = require('../package.json');

function info(message: string) {
  if (!program.opts().quiet) {
    console.log(message);
  }
}

async function runAsync(maybeProjectDirectory?: string): Promise<void> {
  if (process.platform !== 'darwin') {
    info(chalk.yellow('CocoaPods is only supported on darwin machines'));
    process.exit(0);
  }

  const hasProjectDirectory = maybeProjectDirectory && !maybeProjectDirectory.startsWith('--');
  const possibleProjectRoot = resolve(hasProjectDirectory ? maybeProjectDirectory : process.cwd());

  if (!existsSync(possibleProjectRoot)) {
    info(chalk.red(`\nTarget directory does not exist: ${possibleProjectRoot}\n`));
    process.exit(1);
  }

  const projectRoot = CocoaPodsPackageManager.getPodProjectRoot(possibleProjectRoot);

  if (!projectRoot) {
    const packageJsonPath = join(possibleProjectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) {
      info(chalk.red(`\n'package.json' file does not exist: ${packageJsonPath}\n`));
      process.exit(1);
    }

    const jsonData = JSON.parse(readFileSync(packageJsonPath).toString());
    const hasExpoPackage = jsonData.dependencies?.hasOwnProperty('expo');

    if (hasExpoPackage) {
      info(
        chalk.yellow(
          `No 'ios' directory found, skipping installing pods.`,
          `\nPods will be automatically installed when the 'ios' directory is generated with 'npx expo prebuild' or 'npx expo run:ios'.`,
          learnMore('https://docs.expo.dev/workflow/prebuild/')
        )
      );
      process.exit(0);
    }

    if (hasProjectDirectory) {
      info(chalk.yellow(`CocoaPods is not supported in project at ${possibleProjectRoot}`));
    } else {
      info(chalk.yellow('CocoaPods is not supported in this project'));
    }
    process.exit(0);
  }

  info('Scanning for pods...');

  if (!(await CocoaPodsPackageManager.isCLIInstalledAsync())) {
    await CocoaPodsPackageManager.installCLIAsync({
      nonInteractive: program.opts().nonInteractive,
    });
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

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('[project-directory]')
  .usage(`${chalk.green('[project-directory]')} [options]`)
  .description('Install pods in your project')
  .option('--quiet', 'Only print errors')
  .option('--non-interactive', 'Disable interactive prompts')
  .allowUnknownOption()
  .parse(process.argv)
  .action(async (maybeProjectDirectory?: string) => {
    try {
      await runAsync(maybeProjectDirectory);
      if (!program.opts().quiet) {
        await shouldUpdate();
      }
    } catch (reason: any) {
      console.log('\nAborting run');
      if (reason.command) {
        console.log(`  ${chalk.magenta(reason.command)} has failed.`);
      } else {
        console.log(
          chalk.red`An unexpected error was encountered. Report it on GitHub: https://github.com/expo/expo/issues`
        );
        console.log(reason);
      }
      console.log();
      if (!program.opts().quiet) {
        await shouldUpdate();
      }
      process.exit(1);
    }
  });

(async () => {
  await program.parseAsync(process.argv);
})();
