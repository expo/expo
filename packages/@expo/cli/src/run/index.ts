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
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow additional flags for both android and ios commands
      permissive: true,
    }
  );

  if (args['--help']) {
    Log.exit(
      chalk`
  {bold Info}
    Run the native app locally

  {bold Usage}
    {dim $} npx expo run android <dir>
    {dim $} npx expo run ios <dir>

  {bold Options}
    {dim $} npx expo run android --help    Output Android usage information
    {dim $} npx expo run ios --help        Output iOS usage information
`,
      0
    );
  }

  try {
    let [platform, ...argsWithoutPlatform] = args._ ?? [];

    if (!platform) {
      platform = await selectAsync('Select the platform to run', [
        { title: 'Android', value: 'android' },
        { title: 'iOS', value: 'ios' },
      ]);
    }

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
