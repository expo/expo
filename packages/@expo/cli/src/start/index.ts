#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';

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
      '--private-key-path': String,
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
      // Alias for adding interop with the Metro docs and RedBox errors.
      '--reset-cache': '--clear',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Start a local dev server for the app`,
      chalk`npx expo start {dim <dir>}`,
      [
        chalk`<dir>                                  Directory of the Expo project. {dim Default: Current working directory}`,
        `-a, --android                          Opens your app in Expo Go on a connected Android device`,
        `-i, --ios                              Opens your app in Expo Go in a currently running iOS simulator on your computer`,
        `-w, --web                              Opens your app in a web browser`,
        ``,
        `-c, --clear                            Clear the bundler cache`,
        `--max-workers <num>                    Maximum number of tasks to allow Metro to spawn`,
        `--no-dev                               Bundle in production mode`,
        `--minify                               Minify JavaScript`,
        ``,
        chalk`-m, --host <mode>                      Dev server hosting type. {dim Default: lan}`,
        chalk`                                       {bold lan}: Use the local network`,
        chalk`                                       {bold tunnel}: Use any network by tunnel through ngrok`,
        chalk`                                       {bold localhost}: Connect to the dev server over localhost`,
        `--tunnel                               Same as --host tunnel`,
        `--lan                                  Same as --host lan`,
        `--localhost                            Same as --host localhost`,
        ``,
        `--offline                              Skip network requests and use anonymous manifest signatures`,
        `--https                                Start the dev server with https protocol`,
        `--scheme <scheme>                      Custom URI protocol to use when launching an app`,
        chalk`-p, --port <port>                      Port to start the dev server on (does not apply to web or tunnel). {dim Default: 8081}`,
        ``,
        chalk`--dev-client                           {yellow Experimental:} Starts the bundler for use with the expo-development-client`,
        `--force-manifest-type <manifest-type>  Override auto detection of manifest type`,
        `--private-key-path <path>              Path to private key for code signing. Default: "private-key.pem" in the same directory as the certificate specified by the expo-updates configuration in app.json.`,
        `-h, --help                             Usage info`,
      ].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  const { resolveOptionsAsync } = await import('./resolveOptions');
  const options = await resolveOptionsAsync(projectRoot, args).catch(logCmdError);

  const { APISettings } = await import('../api/settings');
  APISettings.isOffline = options.offline;

  const { startAsync } = await import('./startAsync');
  return startAsync(projectRoot, options, { webOnly: false }).catch(logCmdError);
};
