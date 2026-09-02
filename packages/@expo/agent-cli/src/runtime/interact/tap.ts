// @ref llp/0018-interaction-commands.rfc.md
import { printCommandHelp } from '../../help/format';
import type { CommandHelp } from '../../help/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs } from '../../utils/args';

export const runtimeTapHelp: CommandHelp = {
  command: 'runtime:tap',
  usage: `${PROGRAM_PREFIX} runtime:tap <testID>`,
  options: [
    `--index <n>               Which of several matched elements, from 0 (default: the only one)`,
    `--all-screens             Look on every mounted screen, not only the focused one`,
    `--verify                  Walk the tree again afterwards and report what changed`,
    `--force                   Tap an element the app reports as disabled`,
    `--max-nodes <n>           Nodes per --verify walk (default: 200)`,
    `--dev-server-url <url>    Dev server to talk to (default: the project's own, then 8081)`,
    `--port <number>           Dev server on this port, short for --dev-server-url`,
    `--ios, --android          Drive the app on this platform (default: whichever is connected)`,
    `--platform <name>         The same, spelled the way smoke spells it`,
    `--json                    Print the result as JSON`,
    `--no-bundle-check         Tap without building the entry bundle first`,
    `--no-followups            Skip the "Suggested next:" section`,
    `-h, --help                Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} runtime:tap add-note`,
      gets: 'the app’s own onPress for that testID is called',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:tap add-note --verify --json`,
      gets: 'the same, plus the nodes that appeared, vanished or changed text',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:tap row --index 2`,
      gets: 'the third element carrying that testID, when several do',
    },
  ],
  next: ['runtime:tree', 'runtime:errors', 'smoke'],
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
      'verify',
      'followups',
      'untrusted',
    ],
  },
  notes: [
    `It calls a prop; it does not touch the screen. No press timing, no responder chain, no`,
    `gesture recognition, and the synthetic event's coordinates are all zero.`,
    `A disabled element is refused with exit 20 — calling onPress would report a pass for`,
    `something a user cannot do. --force calls it anyway and says so.`,
    `--verify is the only proof offered. Without it, the claim is that a tap was made.`,
    `An invisible button is still tapped: this walks the component tree and has no geometry, so`,
    `a button behind a modal or at zero opacity is indistinguishable from a visible one.`,
    `Nothing works on Expo Go for Android, which ships no debugger: use a development build.`,
    `Exit codes: 0 the handler was called · 20 nothing was called, or the app's handler threw,`,
    `or the entry bundle does not compile · 1 the app could not be read at all.`,
    `Run "${PROGRAM_PREFIX} runtime:tree" for the testIDs this screen carries.`,
  ],
};

export const agentCliRuntimeTap: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveTapOptions`, which also reads the testID.
      permissive: true,
      command: 'runtime:tap',
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(runtimeTapHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli runtime:tap -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrCwd } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveTapOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { runtimeTapAsync } = require('./interactAsync') as typeof import('./interactAsync');
  const { EXIT_OK, exitWithCodeAsync } =
    require('../../exitCodes') as typeof import('../../exitCodes');

  return (async () => {
    const options = resolveTapOptions(argv ?? []);
    const context = { projectRoot: findUpProjectRootOrCwd(process.cwd()) };
    const code = await runtimeTapAsync(options, context);
    if (code !== EXIT_OK) {
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
