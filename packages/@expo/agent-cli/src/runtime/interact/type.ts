// @ref llp/0018-interaction-commands.rfc.md
import { printCommandHelp } from '../../help/format';
import type { CommandHelp } from '../../help/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs } from '../../utils/args';

export const runtimeTypeHelp: CommandHelp = {
  command: 'runtime:type',
  usage: `${PROGRAM_PREFIX} runtime:type <text> --testID <id>`,
  options: [
    `--testID <id>             The input the text goes into (required)`,
    `--submit                  Call onSubmitEditing after the text`,
    `--index <n>               Which of several matched inputs, from 0 (default: the only one)`,
    `--all-screens             Look on every mounted screen, not only the focused one`,
    `--force                   Type into an input the app reports as disabled or not editable`,
    `--dev-server-url <url>    Dev server to talk to (default: the project's own, then 8081)`,
    `--port <number>           Dev server on this port, short for --dev-server-url`,
    `--ios, --android          Drive the app on this platform (default: whichever is connected)`,
    `--platform <name>         The same, spelled the way smoke spells it`,
    `--json                    Print the result as JSON`,
    `--no-bundle-check         Type without building the entry bundle first`,
    `--no-followups            Skip the "Suggested next:" section`,
    `-h, --help                Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} runtime:type "a new note" --testID note-input`,
      gets: 'the app’s own onChangeText is called with that string',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:type "alice@example.com" --testID email --submit`,
      gets: 'the same, then onSubmitEditing with the text on nativeEvent.text',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:type "" --testID search`,
      gets: 'the input is cleared — that is what "delete what is in there" means here',
    },
  ],
  next: ['runtime:tap', 'runtime:tree', 'runtime:errors'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'devServerUrl',
      'testID',
      'matched',
      'index',
      'candidates',
      'component',
      'screen',
      'focusedScreen',
      'screensSeen',
      'allScreens',
      'groupSize',
      'handler',
      'handlerOn',
      'handlerOutsideMatch',
      'disabled',
      'disabledOn',
      'disabledComponent',
      'forced',
      'called',
      'threw',
      'reason',
      'bundle',
      'ok',
      'text',
      'submitted',
      'submitHandlerOn',
      'followups',
      'untrusted',
    ],
  },
  notes: [
    `It calls a prop; it does not type. The input is never focused, no keyboard opens, and no`,
    `keystroke is delivered — a component that only reacts to key events is not exercised.`,
    `An input the app marks editable={false} or disabled is refused with exit 20; --force`,
    `overrides that.`,
    `--submit on an element with no onSubmitEditing exits 20 and still reports the text went in,`,
    `so "nothing happened" and "half of it happened" are told apart.`,
    `Exit codes: 0 the text went in · 20 nothing was typed, the handler threw, or the entry`,
    `bundle does not compile · 1 the app could not be read at all.`,
  ],
};

export const agentCliRuntimeType: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveTypeOptions`, which also reads the text.
      permissive: true,
      command: 'runtime:type',
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(runtimeTypeHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli runtime:type -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrCwd } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveTypeOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { runtimeTypeAsync } = require('./interactAsync') as typeof import('./interactAsync');
  const { EXIT_OK, exitWithCodeAsync } =
    require('../../exitCodes') as typeof import('../../exitCodes');

  return (async () => {
    const options = resolveTypeOptions(argv ?? []);
    const context = { projectRoot: findUpProjectRootOrCwd(process.cwd()) };
    const code = await runtimeTypeAsync(options, context);
    if (code !== EXIT_OK) {
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
