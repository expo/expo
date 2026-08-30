import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const newHelp: CommandHelp = {
  command: 'new',
  usage: `${PROGRAM_PREFIX} new <directory>`,
  options: [
    `--name <name>   Display name of the app, written into app.json`,
    `--no-install    Skip installing the dependencies`,
    `--no-git        Skip initializing a git repository`,
    `--json          Print the result as JSON`,
    `--no-followups  Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help      Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} new my-app`,
      gets: 'a project in ./my-app, dependencies installed, git initialized',
    },
    {
      run: `${PROGRAM_PREFIX} new my-app --name "My App"`,
      gets: 'the same, with a display name set',
    },
    {
      run: `${PROGRAM_PREFIX} new my-app --json --no-install`,
      gets: 'one object, and the scaffold without the dependency install',
    },
  ],
  next: ['status', 'dev', 'agents:setup'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'the create-expo output, progress and errors',
    keys: ['projectRoot', 'name', 'created', 'installed', 'gitInitialized', 'followups'],
  },
  notes: [
    `Runs create-expo in a subprocess with every prompt answered, so it works with no TTY`,
    `attached — the shape an agent runs it in.`,
  ],
};

export const agentCliNew: Command = async (argv) => {
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
      command: 'new',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(newHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli new -h` shows as fast as possible.
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
