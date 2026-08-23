import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentNew: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveNewOptions`, which reports a bad flag as a CommandError.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Create a new Expo project without a terminal: scaffold, git, and what to run next`,
      chalk`npx exagent new {dim <directory>}`,
      [
        `--name <name>   Display name of the app, written into app.json`,
        `--no-install    Skip installing the dependencies`,
        `--no-git        Skip initializing a git repository`,
        `--json          Print the result as JSON`,
        `--no-followups  Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help      Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Runs {bold create-expo} in a subprocess with every prompt answered, so the command`,
        chalk`  works with no TTY attached — the shape an agent runs it in.`,
        '',
        chalk`    {dim $} npx exagent new my-app --name "My App"`,
        chalk`    {dim $} npx exagent new my-app --json --no-install`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent new -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveNewOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { createNewProjectAsync } = require('./newAsync') as typeof import('./newAsync');

  return (async () => {
    // No project root is resolved here: `new` is the one command that runs before a project
    // exists, so the working directory is only the place the new directory goes.
    const exitCode = await createNewProjectAsync(process.cwd(), resolveNewOptions(argv ?? []));
    process.exitCode = exitCode;
  })().catch(logCmdError);
};
