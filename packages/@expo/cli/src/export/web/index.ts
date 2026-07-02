#!/usr/bin/env node

import { styleText } from 'node:util';

import type { Command } from '../../index';
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
      `npx expo export:web ${styleText('dim', `<dir>`)}`,
      [
        `<dir>                         Directory of the Expo project. ${styleText('dim', `Default: Current working directory`)}`,
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
