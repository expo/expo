#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoExportWeb: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--dev': Boolean,
      // Aliases
      '-h': '--help',
      '-c': '--clear',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `(Deprecated) Bundle the static files of the web app with Webpack for hosting on a web server`,
      chalk`npx expo export:web {dim <dir>}`,
      [
        chalk`<dir>                         Directory of the Expo project. {dim Default: Current working directory}`,
        `--dev                         Bundle in development mode`,
        `-c, --clear                   Clear the bundler cache`,
        `-h, --help                    Usage info`,
      ].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  const { resolveOptionsAsync } = await import('./resolveOptions.js');
  const options = await resolveOptionsAsync(args).catch(logCmdError);

  const { exportWebAsync } = await import('./exportWebAsync.js');
  return exportWebAsync(projectRoot, options).catch(logCmdError);
};
