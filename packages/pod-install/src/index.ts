#!/usr/bin/env node

import { CocoaPodsPackageManager } from '@expo/package-manager/build/ios/CocoaPodsPackageManager';
import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { styleText } from 'node:util';
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
    info(styleText('yellow', '⚠️ CocoaPods is only supported on darwin machines'));
    process.exit(0);
  }

  const hasProjectDirectory = maybeProjectDirectory && !maybeProjectDirectory.startsWith('--');
  const possibleProjectRoot = resolve(hasProjectDirectory ? maybeProjectDirectory : process.cwd());

  if (!existsSync(possibleProjectRoot)) {
    info(styleText('red', `\n💥 Target directory does not exist: ${possibleProjectRoot}\n`));
    process.exit(1);
  }

  const projectRoot = CocoaPodsPackageManager.getPodProjectRoot(possibleProjectRoot);

  if (!projectRoot) {
    const packageJsonPath = join(possibleProjectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) {
      info(styleText('red', `\n💥 'package.json' file does not exist: ${packageJsonPath}\n`));
      process.exit(1);
    }

    const jsonData = JSON.parse(readFileSync(packageJsonPath).toString());
    const hasExpoPackage = jsonData.dependencies?.hasOwnProperty('expo');

    if (hasExpoPackage) {
      info(
        styleText(
          'yellow',
          `⚠️ No 'ios' directory found, skipping installing pods.\nPods will be automatically installed when the 'ios' directory is generated with 'npx expo prebuild' or 'npx expo run:ios'. ${learnMore('https://docs.expo.dev/workflow/prebuild/')}`
        )
      );
      process.exit(0);
    }

    if (hasProjectDirectory) {
      info(
        styleText('yellow', `⚠️ CocoaPods is not supported in project at ${possibleProjectRoot}`)
      );
    } else {
      info(styleText('yellow', '⚠️ CocoaPods is not supported in this project'));
    }
    process.exit(0);
  }

  info('🔍️ Scanning for pods...');

  try {
    const manager = new CocoaPodsPackageManager({ cwd: projectRoot });
    if (!(await manager.isCLIInstalledAsync())) {
      await manager.installCLIAsync({
        nonInteractive: program.opts().nonInteractive,
      });
    }

    await manager.installAsync();
  } catch (error: any) {
    if (error.isPackageManagerError) {
      console.error(styleText('red', error.message));
      process.exit(1);
    }
    // throw unhandled
    throw error;
  }
}

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('[project-directory]')
  .usage(`${styleText('green', '[project-directory]')} [options]`)
  .description(
    'A fast, zero-dependency package for cutting down on common issues developers have when running pod install.'
  )
  .option('--quiet', 'only print errors')
  .option('--non-interactive', 'disable interactive prompts')
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
        console.log(`  ${styleText('magenta', reason.command)} has failed.`);
      } else {
        console.log(
          styleText(
            'red',
            `💥 An unexpected error was encountered. Report it on GitHub: https://github.com/expo/expo/issues`
          )
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
