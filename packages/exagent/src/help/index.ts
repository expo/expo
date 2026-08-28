// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// `exagent help`, `exagent help how-to`, and `exagent help <command>`.
//
// `help` is the word somebody types when they have been handed a CLI and nothing else, so it is a
// command rather than only a flag, and it answers three different questions under one name:
//
// - `help` — the same screen as `-h`, because that is what the word promises.
// - `help how-to` — the on-ramp: the loop, the exit codes, the `--json` contract, in one screen.
// - `help <command>` — that command's own help, so a caller who knows the name needs no flag.
//
// The third is a delegation, not a copy: it resolves the name through the same `resolveCommand` the
// launcher uses and runs that command with `--help`, so there is no second place for a help block
// to come from and no way for this command to answer with a stale one.

import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';
import { printCommandHelp } from './format';
import type { CommandHelp } from './types';

export const helpHelp: CommandHelp = {
  command: 'help',
  usage: 'npx exagent help <how-to | command>',
  options: [`-h, --help   Usage info`],
  examples: [
    {
      run: 'npx exagent help how-to',
      gets: 'the loop, the exit codes and the --json contract, in one screen',
    },
    {
      run: 'npx exagent help status',
      gets: 'one command: its options, its examples and its JSON keys',
    },
    { run: 'npx exagent help', gets: 'every command, grouped by the job it does' },
  ],
  next: ['status', 'dev'],
};

export const exagentHelp: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // The on-ramp answers to the flag as well as to the word, here as on the launcher: a caller
      // that has been told this CLI has a how-to should not have to learn which of the two
      // spellings it is (llp/0024 §The on-ramp).
      '--how-to': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'help', positionalArgs: 'own' }
  );

  if (args['--help']) {
    printCommandHelp(helpHelp);
  }

  // Load modules after the help prompt so `npx exagent help -h` shows as fast as possible.
  const Log = require('../log') as typeof import('../log');
  const { EXIT_OK } = require('../exitCodes') as typeof import('../exitCodes');
  const registry = require('../commandRegistry') as typeof import('../commandRegistry');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');

  return (async () => {
    const topic = args['--how-to'] ? 'how-to' : (args._.map(String)[0] ?? null);

    // `Log.exit` never returns, but it is reached through a `require`, which the type checker
    // cannot use for control-flow narrowing — so each branch says it is done.
    if (topic == null) {
      Log.exit(registry.formatTopLevelHelp(), EXIT_OK);
      return;
    }

    if (topic === 'how-to') {
      const { formatHowTo } = require('./howTo') as typeof import('./howTo');
      Log.exit(formatHowTo(), EXIT_OK);
      return;
    }

    // Everything else is a command name, answered by that command rather than about it.
    const resolution = registry.resolveCommand(topic, ['--help']);
    switch (resolution.kind) {
      case 'command': {
        const exec = await resolution.load();
        await exec(resolution.argv);
        return;
      }
      // A bare group is its listing, exactly as `exagent runtime --help` prints it, plus the
      // options of the action the bare name runs when it has one.
      case 'group-help': {
        Log.log(registry.formatGroupHelp(resolution.group));
        const { defaultAction, actions } = registry.commandGroups[resolution.group]!;
        if (!defaultAction) {
          process.exit(EXIT_OK);
        }
        const exec = await actions[defaultAction]!.load();
        await exec(['--help']);
        return;
      }
      // An `expo` command this CLI forwards: its help is that CLI's to print, so it prints it.
      case 'passthrough': {
        const { exagentPassthrough } = require('../passthrough') as typeof import('../passthrough');
        await exagentPassthrough(resolution.command)(['--help']);
        return;
      }
      // A group of ours asked about an action it does not have: the listing, then the error, the
      // same order `cli.ts` prints them in — the alternatives are on screen before the sentence
      // that says the name was wrong.
      case 'unknown-action': {
        const { CommandError } = require('../utils/errors') as typeof import('../utils/errors');
        Log.log(registry.formatGroupHelp(resolution.group));
        const error = new CommandError(
          'UNKNOWN_ACTION',
          registry.unknownActionMessage(resolution.group, resolution.action)
        );
        error.suggestedCommand = `npx exagent ${resolution.group} --help`;
        throw error;
      }
      default: {
        const { CommandError } = require('../utils/errors') as typeof import('../utils/errors');
        const error = new CommandError('UNKNOWN_COMMAND', registry.unknownCommandMessage(topic));
        error.suggestedCommand = registry.unknownCommandSuggestion(topic);
        throw error;
      }
    }
  })().catch(logCmdError);
};
