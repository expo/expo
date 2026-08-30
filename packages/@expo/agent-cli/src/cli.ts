#!/usr/bin/env node
import { installEventLogger } from '2g';
import arg from 'arg';
import { boolish } from 'getenv';

import {
  commandGroups,
  flagsWithoutActionMessage,
  flagsWithoutActionSuggestion,
  formatGroupHelp,
  formatTopLevelHelp,
  resolveCommand,
  unknownActionMessage,
  unknownCommandMessage,
  unknownCommandSuggestion,
} from './commandRegistry';
import { EXIT_OK } from './exitCodes';
import * as Log from './log';
import { PROGRAM_NAME, PROGRAM_PREFIX } from './programName';
import { configureColor } from './utils/color';
import { argvRequestsJson, setJsonRequested } from './utils/jsonMode';

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

// Check if we are running `npx @expo/agent-cli <command>` or `npx @expo/agent-cli`.
const subcommand = args._[0] ?? null;

// Command arguments come from the raw argv, not from `args._`: `arg` drops the `--` separator,
// and `install`/`start` forward everything after it to the package manager.
const rawArgv = process.argv.slice(2);
const commandArgs = subcommand == null ? [] : rawArgv.slice(rawArgv.indexOf(subcommand) + 1);

// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — the error path is one
// function shared by every command, and it runs after (often instead of) the command's own
// argument parsing, so the launcher answers "was JSON asked for" once, from the raw argv.
setJsonRequested(argvRequestsJson(commandArgs));

// @ref llp/0024-cli-ui.rfc.md §Colors are for humans — decided once, for the whole process, before
// any command builds a string. A `--json` run and a piped run print no escape sequences at all.
configureColor({
  json: argvRequestsJson(rawArgv),
  isTty: process.stdout.isTTY === true,
});

// Push the help flag onto the command args, e.g. for `npx @expo/agent-cli --help skills`. This runs before
// the command is resolved, so `@expo/agent-cli --help runtime` is the same request as `@expo/agent-cli runtime -h`.
if (
  subcommand != null &&
  args['--help'] &&
  !commandArgs.includes('--help') &&
  !commandArgs.includes('-h')
) {
  commandArgs.push('--help');
}

// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher — the registry in
// `commandRegistry.ts` owns which names exist: its own commands, the actions of its groups, and
// the fixed set of `expo` commands it forwards. A name in none of them is an error, not a forward.
const resolution = subcommand == null ? null : resolveCommand(subcommand, commandArgs);

// Set up event logger output before any console output, so agents driving `@expo/agent-cli` read
// JSONL events instead of scraping the terminal. The canonical name of the command is logged,
// so `runtime eval` and `runtime:eval` are one command on the event stream.
installEventLogger({
  command: args['--version']
    ? `${PROGRAM_NAME} --version`
    : resolution == null
      ? `${PROGRAM_NAME} --help`
      : resolution.kind === 'command'
        ? `${PROGRAM_NAME} ${resolution.name}`
        : `${PROGRAM_NAME} ${subcommand}`,
  version,
});

if (args['--version']) {
  console.log(version);
  process.exit(EXIT_OK);
}

if (resolution == null) {
  Log.exit(formatTopLevelHelp(), EXIT_OK);
}

/**
 * Print a listing that accompanies an error.
 *
 * On stdout for a person, on stderr for a `--json` run: there the only thing that may be on stdout
 * is the error envelope, or the caller's `JSON.parse` gets a help page (llp/0010 §The `--json`
 * error envelope).
 */
function logErrorListing(text: string): void {
  if (argvRequestsJson(commandArgs)) {
    Log.error(text);
  } else {
    Log.log(text);
  }
}

// No signal hooks are installed here. `install`, `start` and the `expo` passthrough hand the
// terminal to the `expo` subprocess and forward the signals to it, in `utils/expoCli.ts`.
switch (resolution.kind) {
  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
  // The outermost catch of the CLI. A command's own body already ends in `.catch(logCmdError)`,
  // but its **argument parsing** runs before that chain is built — so a bad flag rejected here,
  // with nobody listening, and Node printed an `ArgError` stack trace and exited 1 with no event,
  // no `Try:` line and, under `--json`, nothing at all on stdout. Every command funnels through
  // this one line, so the envelope is guaranteed rather than per command.
  case 'command':
    resolution
      .load()
      .then((exec) => exec(resolution.argv))
      .catch((error: unknown) => {
        const { logCmdError } = require('./utils/errors') as typeof import('./utils/errors');
        logCmdError(error);
      });
    break;

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — the listing, and then the options of
  // the action the bare name runs. `@expo/agent-cli dev --help` used to print only the two action names,
  // so a caller checking the help of the command it was about to run never learned that `--plan`
  // exists — the one flag that makes `@expo/agent-cli dev` safe to run unattended. A group whose bare name
  // does something has to document what that something takes.
  case 'group-help': {
    Log.log(formatGroupHelp(resolution.group));
    const { defaultAction, actions } = commandGroups[resolution.group]!;
    if (!defaultAction) {
      process.exit(EXIT_OK);
    }
    // The action's own `--help` path prints its block and exits 0, so nothing follows this.
    actions[defaultAction]!.load().then((exec) => exec(['--help']));
    break;
  }

  // The listing comes first and the error last: the last line is what a driving agent acts on
  // (llp/0006 "errors are prompts").
  case 'unknown-action': {
    const { CommandError, logCmdError } =
      require('./utils/errors') as typeof import('./utils/errors');
    logErrorListing(formatGroupHelp(resolution.group));
    const error = new CommandError(
      'UNKNOWN_ACTION',
      unknownActionMessage(resolution.group, resolution.action)
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} ${resolution.group} --help`;
    logCmdError(error);
    break;
  }

  // Options with no action used to print this listing and exit 0, which reads as success to an
  // agent that then waits for output that never comes (llp/0010 §Registry rules).
  case 'flags-without-action': {
    const { CommandError, logCmdError } =
      require('./utils/errors') as typeof import('./utils/errors');
    logErrorListing(formatGroupHelp(resolution.group));
    const error = new CommandError(
      'UNKNOWN_ACTION',
      flagsWithoutActionMessage(resolution.group, resolution.flags)
    );
    // For a group named after another CLI's verb this is that CLI's command, with these flags on
    // it: `@expo/agent-cli build --platform ios` recovers with `npx eas build --platform ios`.
    error.suggestedCommand = flagsWithoutActionSuggestion(resolution.group, resolution.flags);
    logCmdError(error);
    break;
  }

  case 'unknown-command': {
    const { CommandError, logCmdError } =
      require('./utils/errors') as typeof import('./utils/errors');
    const error = new CommandError('UNKNOWN_COMMAND', unknownCommandMessage(resolution.command));
    // One close name is a recovery to run; several are a choice, and the message lists them.
    error.suggestedCommand = unknownCommandSuggestion(resolution.command);
    logCmdError(error);
    break;
  }

  case 'passthrough':
    import('./passthrough').then((i) => i.agentCliPassthrough(resolution.command)(resolution.argv));
    break;
}
