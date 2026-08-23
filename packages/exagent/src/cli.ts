#!/usr/bin/env node
import { installEventLogger } from '2g';
import arg from 'arg';
import { boolish } from 'getenv';

import {
  formatGroupHelp,
  formatTopLevelHelp,
  resolveCommand,
  unknownActionMessage,
  unknownCommandMessage,
} from './commandRegistry';
import { EXIT_OK } from './exitCodes';
import * as Log from './log';

// Bridge the legacy `EXPO_DEBUG`/`DEBUG=expo:*` switches onto `2g`'s `LOG_DEBUG`, the same way
// `@expo/cli` does, so the two CLIs share one debug switch. This must run before
// `installEventLogger()` so the debug flag is honored when the session activates.
if (boolish('EXPO_DEBUG', false) || /(^|[,\s])expo(:|\*|$)/.test(process.env.DEBUG ?? '')) {
  process.env.EXPO_DEBUG = '1';
  process.env.LOG_DEBUG ??= '*';
}

const { version } = require('../package.json') as { version: string };

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

// Check if we are running `npx exagent <command>` or `npx exagent`.
const subcommand = args._[0] ?? null;

// Command arguments come from the raw argv, not from `args._`: `arg` drops the `--` separator,
// and `install`/`start` forward everything after it to the package manager.
const rawArgv = process.argv.slice(2);
const commandArgs = subcommand == null ? [] : rawArgv.slice(rawArgv.indexOf(subcommand) + 1);

// Push the help flag onto the command args, e.g. for `npx exagent --help skills`. This runs before
// the command is resolved, so `exagent --help runtime` is the same request as `exagent runtime -h`.
if (
  subcommand != null &&
  args['--help'] &&
  !commandArgs.includes('--help') &&
  !commandArgs.includes('-h')
) {
  commandArgs.push('--help');
}

// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher — the registry in
// `commandRegistry.ts` owns which names exist: its own commands, the actions of its groups, and
// the fixed set of `expo` commands it forwards. A name in none of them is an error, not a forward.
const resolution = subcommand == null ? null : resolveCommand(subcommand, commandArgs);

// Set up event logger output before any console output, so agents driving `exagent` read
// JSONL events instead of scraping the terminal. The canonical name of the command is logged,
// so `runtime eval` and `runtime:eval` are one command on the event stream.
installEventLogger({
  command: args['--version']
    ? 'exagent --version'
    : resolution == null
      ? 'exagent --help'
      : resolution.kind === 'command'
        ? `exagent ${resolution.name}`
        : `exagent ${subcommand}`,
  version,
});

if (args['--version']) {
  console.log(version);
  process.exit(EXIT_OK);
}

if (resolution == null) {
  Log.exit(formatTopLevelHelp(), EXIT_OK);
}

// No signal hooks are installed here. `install`, `start` and the `expo` passthrough hand the
// terminal to the `expo` subprocess and forward the signals to it, in `utils/expoCli.ts`.
switch (resolution.kind) {
  case 'command':
    resolution.load().then((exec) => exec(resolution.argv));
    break;

  case 'group-help':
    Log.exit(formatGroupHelp(resolution.group), EXIT_OK);
    break;

  // The listing comes first and the error last: the last line is what a driving agent acts on
  // (llp/0006 "errors are prompts").
  case 'unknown-action': {
    const { CommandError, logCmdError } =
      require('./utils/errors') as typeof import('./utils/errors');
    Log.log(formatGroupHelp(resolution.group));
    const error = new CommandError(
      'UNKNOWN_ACTION',
      unknownActionMessage(resolution.group, resolution.action)
    );
    error.suggestedCommand = `npx exagent ${resolution.group} --help`;
    logCmdError(error);
    break;
  }

  case 'unknown-command': {
    const { CommandError, logCmdError } =
      require('./utils/errors') as typeof import('./utils/errors');
    const error = new CommandError('UNKNOWN_COMMAND', unknownCommandMessage(resolution.command));
    error.suggestedCommand = 'npx exagent --help';
    logCmdError(error);
    break;
  }

  case 'passthrough':
    import('./passthrough').then((i) =>
      i.exagentExpoPassthrough(resolution.command)(resolution.argv)
    );
    break;
}
