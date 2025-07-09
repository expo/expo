#!/usr/bin/env node
import chalk from 'chalk';

import { logPlatformRunCommand } from './hints';
import { Command } from '../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';

export const expoRun: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow additional flags for both android and ios commands
      permissive: true,
    }
  );

  try {
    let [platform] = args._ ?? [];

    // Workaround, filter `--flag` as platform
    if (platform?.startsWith('-')) {
      platform = '';
    }

    // Remove the platform from raw arguments, when provided
    const argsWithoutPlatform = !platform ? argv : argv?.splice(1);

    // Do not capture `--help` when platform is provided
    if (!platform && args['--help']) {
      printHelp(
        'Run the native app locally',
        `npx expo run <android|ios>`,
        chalk`{dim $} npx expo run <android|ios> --help  Output usage information`
      );
    }

    if (!platform) {
      const { selectAsync } = await import('../utils/prompts.js');
      platform = await selectAsync('Select the platform to run', [
        { title: 'Android', value: 'android' },
        { title: 'iOS', value: 'ios' },
      ]);
    }

    logPlatformRunCommand(platform, argsWithoutPlatform);

    switch (platform) {
      case 'android': {
        const { expoRunAndroid } = await import('./android/index.js');
        return expoRunAndroid(argsWithoutPlatform);
      }

      case 'ios': {
        const { expoRunIos } = await import('./ios/index.js');
        return expoRunIos(argsWithoutPlatform);
      }

      default:
        throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
