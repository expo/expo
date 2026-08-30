import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR } from '../utils/args';

export const smokeHelp: CommandHelp = {
  command: 'smoke',
  usage: `${PROGRAM_PREFIX} smoke`,
  options: [
    `--route <route>            Open this route before the error window`,
    `--ios, --android           Platform to drive; the host decides when none is named`,
    `--platform <ios|android>   The same, spelled the way --json reports it`,
    `--cloud                    Drive this project's EAS Simulator session, not a local device`,
    `--start                    Start a dev server when none is running`,
    `--window ${DURATION_METAVAR}        How long to watch for errors (default: 3s)`,
    `--timeout ${DURATION_METAVAR}       Total budget (default: 1m, 3m with --start)`,
    `--screenshot <path>        Where to write the picture (default: under .expo/agent-cli/)`,
    `--no-screenshot            Take no picture`,
    `--dev-server-url <url>     Dev server to use (default: the project's own, then 8081)`,
    `--port <number>            Dev server on this port, short for --dev-server-url`,
    `--no-route-check           Open --route without checking it against the project's routes`,
    `--json                     Print the result as JSON`,
    `--no-followups             Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help                 Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} smoke`,
      gets: 'the whole gate: bundle, boot, error window, screenshot, and one exit code',
    },
    {
      run: `${PROGRAM_PREFIX} smoke --route /notes --json`,
      gets: 'the same on that route, as one object with a phase-by-phase record',
    },
    {
      run: `${PROGRAM_PREFIX} smoke --start --window 5s`,
      gets: 'the same, starting a dev server first and watching five seconds for errors',
    },
  ],
  next: ['runtime:errors', 'runtime:reload', 'typecheck'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'ok',
      'outcome',
      'phases',
      'devServerUrl',
      'source',
      'projectRootMatched',
      'started',
      'appsConnected',
      'bundle',
      'route',
      'routeCheck',
      'platform',
      'deviceId',
      'deviceBackend',
      'runtimeSupported',
      'errors',
      'screenshot',
      'durationMs',
      'untrusted',
      'followups',
    ],
  },
  notes: [
    `Eight phases, one exit code: find the dev server, wait for its bundler, build the entry`,
    `bundle, get an app connected, open the route, evaluate 1, collect errors, photograph.`,
    `Exit codes: 0 passed · 20 failed · 22 inconclusive · 1 the command itself was wrong.`,
    `A runtime that cannot be read never passes. Expo Go for Android has no debugger, so its`,
    `error window is empty whatever the app is doing: that is 22, never a pass.`,
    `The window is a window: an error thrown before it opened is not in it. --window buys more.`,
    `--start is opt-in. Without it, a run that finds no dev server exits 20 and says so.`,
    `web is not a platform here — a browser registers no debugger target. Use typecheck for the`,
    `part of this that web can answer.`,
    DURATION_HELP_NOTE,
  ],
};

export const agentCliSmoke: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveSmokeOptions`, which owns their errors.
      permissive: true,
      command: 'smoke',
      // The options and the positional arguments are resolved together by this command's own
      // `resolveSmokeOptions`; a permissive parse cannot tell an unrecognized flag from a
      // positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(smokeHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli smoke -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0020-not-an-expo-app.rfc.md — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { EXIT_OK, exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  const { resolveSmokeOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const options = resolveSmokeOptions(argv ?? []);
    // Asserting, unlike `dev:wait`: this command reads the project's routes and writes its
    // screenshot under the project's `.expo`, so there is no useful run outside one.
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());

    const { smokeAsync } = require('./smokeAsync') as typeof import('./smokeAsync');
    const code = await smokeAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: it has already printed everything it has to say, and the code is
      // what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
