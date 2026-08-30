// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// `@expo/agent-cli help`, `@expo/agent-cli help <topic>`, and `@expo/agent-cli help <command>`.
//
// `help` is the word somebody types when they have been handed a CLI and nothing else, so it is a
// command rather than a flag, and it answers three questions under one name:
//
// - `help` — the same screen as `-h`, because that is what the word promises.
// - `help workflow` — the on-ramp: what to run in order, the exit codes, the `--json` contract.
// - `help <command>` — that command's own help, which is `git help <command>` muscle memory.
//
// A **topic** is a positional argument, not a flag (`src/help/topics.ts`). Topics are looked up
// first, so a topic name can never be shadowed by a command that later takes the same word.
//
// The third case is a delegation, not a copy: it resolves the name through the same
// `resolveCommand` the launcher uses and runs that command with `--help`, so there is no second
// place for a help block to come from and no way for this command to answer with a stale one.

import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';
import { printCommandHelp } from './format';
import { helpTopics } from './topics';
import type { CommandHelp } from './types';

export const helpHelp: CommandHelp = {
  command: 'help',
  usage: `${PROGRAM_PREFIX} help <topic | command>`,
  options: [`-h, --help   Usage info`],
  examples: [
    {
      run: `${PROGRAM_PREFIX} help ${helpTopics[0]!.name}`,
      gets: 'what to run in order, the exit codes and the --json contract, in one screen',
    },
    {
      run: `${PROGRAM_PREFIX} help status`,
      gets: 'one command: its options, its examples and its JSON keys',
    },
    { run: `${PROGRAM_PREFIX} help`, gets: 'every command, grouped by the job it does' },
  ],
  next: ['status', 'dev'],
  // Built from the topic list rather than written out, so a topic added there is documented here
  // without anybody having to remember to.
  notes: [
    'Topics:',
    ...helpTopics.map((topic) => `  ${topic.name.padEnd(12)}${topic.summary}`),
    'Anything else is read as a command name, and answered by that command’s own --help.',
  ],
};

export const agentCliHelp: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'help', positionalArgs: 'own' }
  );

  if (args['--help']) {
    printCommandHelp(helpHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli help -h` shows as fast as possible.
  const Log = require('../log') as typeof import('../log');
  const { EXIT_OK } = require('../exitCodes') as typeof import('../exitCodes');
  const registry = require('../commandRegistry') as typeof import('../commandRegistry');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');

  return (async () => {
    const asked = args._.map(String)[0] ?? null;

    // `Log.exit` never returns, but it is reached through a `require`, which the type checker
    // cannot use for control-flow narrowing — so each branch says it is done.
    if (asked == null) {
      Log.exit(registry.formatTopLevelHelp(), EXIT_OK);
      return;
    }

    // Topics before commands: a topic is what this command is *for*, and a command that one day
    // takes the same word must not take the topic's answer with it.
    const { findHelpTopic } = require('./topics') as typeof import('./topics');
    const topic = findHelpTopic(asked);
    if (topic) {
      Log.exit(topic.render(), EXIT_OK);
      return;
    }

    // Everything else is a command name, answered by that command rather than about it.
    const resolution = registry.resolveCommand(asked, ['--help']);
    switch (resolution.kind) {
      case 'command': {
        const exec = await resolution.load();
        await exec(resolution.argv);
        return;
      }
      // A bare group is its listing, exactly as `@expo/agent-cli runtime --help` prints it, plus the
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
        const { agentCliPassthrough } =
          require('../passthrough') as typeof import('../passthrough');
        await agentCliPassthrough(resolution.command)(['--help']);
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
        error.suggestedCommand = `${PROGRAM_PREFIX} ${resolution.group} --help`;
        throw error;
      }
      default: {
        const { CommandError } = require('../utils/errors') as typeof import('../utils/errors');
        const error = new CommandError('UNKNOWN_COMMAND', registry.unknownCommandMessage(asked));
        error.suggestedCommand = registry.unknownCommandSuggestion(asked);
        throw error;
      }
    }
  })().catch(logCmdError);
};
