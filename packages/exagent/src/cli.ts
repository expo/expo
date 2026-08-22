#!/usr/bin/env node
import { installEventLogger } from '2g';
import arg from 'arg';
import chalk from 'chalk';
import { boolish } from 'getenv';

import type { Command } from './types';

// Bridge the legacy `EXPO_DEBUG`/`DEBUG=expo:*` switches onto `2g`'s `LOG_DEBUG`, the same way
// `@expo/cli` does, so the two CLIs share one debug switch. This must run before
// `installEventLogger()` so the debug flag is honored when the session activates.
if (boolish('EXPO_DEBUG', false) || /(^|[,\s])expo(:|\*|$)/.test(process.env.DEBUG ?? '')) {
  process.env.EXPO_DEBUG = '1';
  process.env.LOG_DEBUG ??= '*';
}

const { version } = require('../package.json') as { version: string };

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here.
  context: () => import('./context').then((i) => i.exagentContext),
  install: () => import('./install').then((i) => i.exagentInstall),
  navigate: () => import('./navigate').then((i) => i.exagentNavigate),
  runtime: () => import('./runtime').then((i) => i.exagentRuntime),
  start: () => import('./start').then((i) => i.exagentStart),
  skills: () => import('./skills').then((i) => i.exagentSkills),
  status: () => import('./status').then((i) => i.exagentStatus),
};

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,

    // Aliases
    '-v': '--version',
    '-h': '--help',
  },
  {
    permissive: true,
  }
);

// Check if we are running `npx exagent <subcommand>` or `npx exagent`.
const command = args._[0] && commands[args._[0]] ? args._[0]! : null;

// Subcommand arguments come from the raw argv, not from `args._`: `arg` drops the `--`
// separator, and `install`/`start` forward everything after it to the package manager.
const rawArgv = process.argv.slice(2);
const commandArgs = command == null ? [] : rawArgv.slice(rawArgv.indexOf(command) + 1);

// Set up event logger output before any console output, so agents driving `exagent` read
// JSONL events instead of scraping the terminal.
installEventLogger({
  command: args['--version']
    ? 'exagent --version'
    : command == null
      ? 'exagent --help'
      : `exagent ${command}`,
  version,
});

if (args['--version']) {
  console.log(version);
  process.exit(0);
}

if (command == null) {
  const unknown = args._[0];
  console.log(chalk`
  {bold Usage}
    {dim $} npx exagent <command>

  {bold Commands}
    ${Object.keys(commands).join(', ')}

  {bold Options}
    --version, -v   Version number
    --help, -h      Usage info

  For more info run a command with the {bold --help} flag
    {dim $} npx exagent skills --help
`);

  if (unknown) {
    console.error(
      chalk.red(
        `Unknown command: ${unknown}. Expected one of: ${Object.keys(commands).join(', ')}.`
      )
    );
  }
  process.exit(unknown ? 1 : 0);
}

// Push the help flag to the subcommand args, e.g. for `npx exagent --help skills`.
if (args['--help'] && !commandArgs.includes('--help') && !commandArgs.includes('-h')) {
  commandArgs.push('--help');
}

// No signal hooks are installed here. `install` and `start` hand the terminal to the
// `expo` subprocess and forward the signals to it, in `utils/expoCli.ts`.
commands[command]!().then((exec) => exec(commandArgs));
