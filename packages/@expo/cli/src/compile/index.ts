#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { Log } from '../log';
import { assertWithOptionsArgs, printHelp } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';

export const expoCompile: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      '--help': Boolean,
      '-h': '--help',
    },
    {
      argv,
      permissive: true,
    }
  );

  try {
    let [platform] = args._ ?? [];

    if (platform?.startsWith('-')) {
      platform = '';
    }

    const argsWithoutPlatform = !platform ? argv : argv?.splice(1);

    if (!platform && args['--help']) {
      printHelp(
        'Build the native app binary locally',
        `npx expo compile <android|ios>`,
        chalk`{dim $} npx expo compile <android|ios> --help  Output usage information`
      );
    }

    if (!platform) {
      const { selectAsync } = await import('../utils/prompts.js');
      platform = await selectAsync('Select the platform to compile', [
        { title: 'Android', value: 'android' },
        { title: 'iOS', value: 'ios' },
      ]);
    }

    Log.log(chalk.dim(`› Using expo compile:${platform} ${(argsWithoutPlatform ?? []).join(' ')}`));

    switch (platform) {
      case 'android': {
        const { expoCompileAndroid } = await import('./android/index.js');
        return expoCompileAndroid(argsWithoutPlatform);
      }

      case 'ios': {
        const { expoCompileIos } = await import('./ios/index.js');
        return expoCompileIos(argsWithoutPlatform);
      }

      default:
        throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
