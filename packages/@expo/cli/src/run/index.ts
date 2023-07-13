#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { Log } from '../log';
import { assertWithOptionsArgs } from '../utils/args';
import { CommandError } from '../utils/errors';
import { selectAsync } from '../utils/prompts';

export const expoRun: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
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
    --no-build-cache                 Clear the native build cache
    --no-install                     Skip installing dependencies
    --no-bundler                     Skip starting the bundler
    --configuration <configuration>  {underline iOS} Xcode configuration to use. Debug or Release. {dim Default: Debug}
    --variant <name>                 {underline Android} build variant to use. {dim Default: debug}
    -d, --device [device]            Device name to run the app on
    -p, --port <port>                Port to start the dev server on. {dim Default: 8081}
    -h, --help                       Output usage information
`,
      0
    );
  }

  const platform = await selectAsync('Platform to run your app on', [
    { title: 'Android', value: 'android' },
    { title: 'iOS', value: 'ios' },
  ]);

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
