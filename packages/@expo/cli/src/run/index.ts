#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { Log } from '../log';
import { assertWithOptionsArgs } from '../utils/args';
import { CommandError } from '../utils/errors';
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
  {bold Description}
    Run the native app locally

  {bold Usage}
    $ npx expo run:android <dir>
    $ npx expo run:ios <dir>

  {bold Options}
    $ npx expo run:android --help    Output Android usage information
    $ npx expo run:ios --help        Output iOS usage information
    -p, --platform <android|ios>     Run the native app on this platform
    -h, --help                       Output usage information
`,
      0
    );
  }

  const platform =
    args['--platform'] ??
    (await selectAsync('Select the platform to run', [
      { title: 'Android', value: 'android' },
      { title: 'iOS', value: 'ios' },
    ]));

  logPlatformRunCommand(platform, argv);

  switch (platform) {
    case 'android': {
      const { expoRunAndroid } = await import('./android');
      return expoRunAndroid(argv);
    }

    case 'ios': {
      const { expoRunIos } = await import('./ios');
      return expoRunIos(argv);
    }

    default:
      throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
  }
};
