// @ref llp/0018-interaction-commands.rfc.md
import { printCommandHelp } from '../../help/format';
import type { CommandHelp } from '../../help/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs } from '../../utils/args';

export const runtimeTreeHelp: CommandHelp = {
  command: 'runtime:tree',
  usage: `${PROGRAM_PREFIX} runtime:tree`,
  options: [
    `--testID <id>             Report this element and its subtree, instead of the screen`,
    `--all                     Every node with a testID, a label, a role, a handler or text`,
    `--all-screens             Every mounted screen, not only the focused one`,
    `--max-nodes <n>           Report at most this many nodes (default: 200)`,
    `--dev-server-url <url>    Dev server to talk to (default: the project's own, then 8081)`,
    `--port <number>           Dev server on this port, short for --dev-server-url`,
    `--ios, --android          Read the app on this platform (default: whichever is connected)`,
    `--platform <name>         The same, spelled the way smoke spells it`,
    `--json                    Print the result as JSON`,
    `--no-bundle-check         Read the app without building the entry bundle first`,
    `--no-followups            Skip the "Suggested next:" section`,
    `-h, --help                Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} runtime:tree`,
      gets: 'the focused screen’s testIDs and handlers — what a tap could find',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:tree --all --json`,
      gets: 'the full projection of that screen',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:tree --testID add-note`,
      gets: 'that element, its subtree, and the handler a tap on it would call',
    },
  ],
  next: ['runtime:tap', 'runtime:type', 'navigate'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'devServerUrl',
      'testID',
      'focusedScreen',
      'screensSeen',
      'allScreens',
      'projection',
      'fibersWalked',
      'nodes',
      'nodeCount',
      'nodesBeforeTruncation',
      'truncated',
      'maxNodes',
      'matched',
      'matches',
      'bundle',
      'reason',
      'ok',
      'followups',
      'untrusted',
    ],
  },
  notes: [
    `It reads React's component tree through the DevTools hook, not a screenshot and not the`,
    `native view hierarchy. It has no geometry: a button behind a modal reads like a visible one.`,
    `It defaults to the focused screen and to the nodes you can act on, so the answer stays a`,
    `fixed size as the app grows. --all-screens and --all ask for the rest.`,
    `One row is one element, not one fiber, which is the unit runtime:tap --index counts.`,
    `Exit codes: 0 the screen was read · 20 a --testID matched nothing, or the entry bundle does`,
    `not compile · 1 the app could not be read — no dev server, or no app connected.`,
    `Expo Go for Android ships no debugger: use a development build.`,
  ],
};

export const agentCliRuntimeTree: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveTreeOptions`.
      permissive: true,
      command: 'runtime:tree',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(runtimeTreeHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli runtime:tree -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrCwd } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveTreeOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { runtimeTreeAsync } = require('./interactAsync') as typeof import('./interactAsync');
  const { EXIT_OK, exitWithCodeAsync } =
    require('../../exitCodes') as typeof import('../../exitCodes');

  return (async () => {
    const options = resolveTreeOptions(argv ?? []);
    // The non-asserting lookup: these commands work against any dev server, so being outside a
    // project is not an error — it only means there is no dev-server lock to ask.
    const context = { projectRoot: findUpProjectRootOrCwd(process.cwd()) };
    const code = await runtimeTreeAsync(options, context);
    if (code !== EXIT_OK) {
      // An outcome, not an error: the command has already printed everything it has to say
      // (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
