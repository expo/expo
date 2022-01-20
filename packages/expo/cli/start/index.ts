#!/usr/bin/env node
import assert from 'assert';
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';

export const expoStart: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--max-workers': Number,
      '--no-dev': Boolean,
      '--minify': Boolean,
      '--https': Boolean,
      '--force-manifest-type': String,
      '--port': Number,
      '--dev-client': Boolean,
      '--scheme': String,
      '--android': Boolean,
      '--ios': Boolean,
      '--web': Boolean,
      '--host': String,
      '--tunnel': Boolean,
      '--lan': Boolean,
      '--localhost': Boolean,
      '--offline': Boolean,
      // Aliases
      '-h': '--help',
      '-c': '--clear',
      '-p': '--port',
      '-a': '--android',
      '-i': '--ios',
      '-w': '--web',
      '-m': '--host',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Start a local dev server for the app

      {bold Usage}
        $ npx expo start <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
      -c, --clear                            Clear the Metro bundler cache
      --max-workers <num>                    Maximum number of tasks to allow Metro to spawn.
      --no-dev                               Turn development mode off
      --minify                               Minify code
      --https                                To start webpack with https protocol
      --force-manifest-type <manifest-type>  Override auto detection of manifest type
      -p, --port <port>                      Port to start the native Metro bundler on (does not apply to web or tunnel). Default: 19000
      --dev-client                           Experimental: Starts the bundler for use with the expo-development-client
      --scheme <scheme>                      Custom URI protocol to use with a development build
      -a, --android                          Opens your app in Expo Go on a connected Android device
      -i, --ios                              Opens your app in Expo Go in a currently running iOS simulator on your computer
      -w, --web                              Opens your app in a web browser
      -m, --host [mode]                      lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks
      --tunnel                               Same as --host tunnel
      --lan                                  Same as --host lan
      --localhost                            Same as --host localhost
      --offline                              Allows this command to run while offline
      -h, --help                             output usage information
  

    `,
      0
    );
  }

  const projectRoot = getProjectRoot(args);
  const { persistOptionsAsync, resolveOptionsAsync } = await import('./resolveOptions');

  const options = await resolveOptionsAsync(projectRoot, args);
  await persistOptionsAsync(projectRoot, options);

  const { startAsync } = await import('./startAsync');
  return startAsync(projectRoot, options, { webOnly: false }).catch(logCmdError);
};
