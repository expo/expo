#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { Log } from '../log';
import { assertWithOptionsArgs } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';
import { selectAsync } from '../utils/prompts';
import { logPlatformRunCommand } from './hints';

export const expoRun: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      // Aliases
      '-h': '--help',
      // All other flags are handled by `expoRunAndroid` or `expoRunIos`
    },
    {
      argv,
      permissive: true,
    }
  );

  if (args['--help']) {
    Log.exit(
      chalk`
  {bold Info}
    Run the native app locally

  {bold Usage}
    {dim $} npx expo run:android <dir>
    {dim $} npx expo run:ios <dir>

  {bold Options}
    -p, --platform <android|ios>     Run the native app on this platform
    -h, --help                       Output usage information

    {dim $} npx expo run:android --help    Output Android usage information
    {dim $} npx expo run:ios --help        Output iOS usage information
`,
      0
    );
  }

  try {
    const platform =
      args['--platform'] ??
      (await selectAsync('Select the platform to run', [
        { title: 'Android', value: 'android' },
        { title: 'iOS', value: 'ios' },
      ]));

    // Filter `--platform=android|ios` or `--platform android|ios` from the args for `run:android|ios`
    const argsWithoutPlatform = Object.values(args._).filter(
      (flag) => !flag.startsWith('--platform') || ['android', 'ios'].includes(flag)
    );

    logPlatformRunCommand(platform, argsWithoutPlatform);

    switch (platform) {
      case 'android': {
        const { expoRunAndroid } = await import('./android');
        return expoRunAndroid(argsWithoutPlatform);
      }

      case 'ios': {
        const { expoRunIos } = await import('./ios');
        return expoRunIos(argsWithoutPlatform);
      }

      default:
        throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
