import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const devRunHelp: CommandHelp = {
  command: 'dev:run',
  usage: `${PROGRAM_PREFIX} dev`,
  options: [
    `--detach            Run the dev server in the background and give the terminal back`,
    `--wait-ready        With --detach, also wait for the bundler before reporting`,
    `--plan              Print what must run to get this app on a device, then exit`,
    `--yes               Consent up front to a plan that builds, which otherwise stops`,
    `--json              Print the plan as JSON, for --plan and for a run`,
    `--port <number>     Port for the dev server, so a busy 8081 needs no answer`,
    `--tunnel, --lan, --localhost   How a device reaches the dev server; passed to expo start`,
    `--ios, --android, --web   Platform to plan for; the host decides when none is named`,
    `--eas, --local      Where the native build runs: in the cloud on EAS, or on this machine`,
    `--go, --dev-client  Which app to run the project in, when both would work`,
    `--no-agent-skills   Skip linking agent skills from installed packages`,
    `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
    `--no-fingerprint-cache   Hash the project again rather than revalidating the cached hash`,
    `-h, --help          Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} dev --plan`,
      gets: 'what would run to get this app on a device, and why. Nothing runs',
    },
    {
      run: `${PROGRAM_PREFIX} dev --detach --wait-ready`,
      gets: 'the dev server in the background; its url, pid and log file are printed',
    },
    {
      run: `${PROGRAM_PREFIX} dev --yes --json --port 8082`,
      gets: 'the plan run with consent given up front, on that exact port, as one object',
    },
    {
      run: `${PROGRAM_PREFIX} dev --eas --plan`,
      gets: 'the plan with the build forced into the cloud, whatever this machine has',
    },
  ],
  next: ['navigate', 'dev:logs', 'dev:stop', 'smoke'],
  json: {
    stdout: 'one object: the plan for --plan, the detached server for --detach',
    stderr: 'the Expo CLI’s own output, progress and errors',
    keys: [
      'target',
      'steps',
      'rule',
      'reasons',
      'buildLocation',
      'url',
      'port',
      'pid',
      'logFile',
      'ready',
      'alreadyRunning',
      'followups',
    ],
  },
  notes: [
    `This command blocks: without --detach it holds this terminal until the dev server stops, so`,
    `the "Suggested next" commands cannot run in it. --detach starts the same server and exits.`,
    `A build runs in one of two places, and the plan picks before it prints. A local build`,
    `(expo prebuild + expo run:ios/run:android) needs Xcode or the Android SDK on this machine.`,
    `A cloud build (eas build) happens on EAS and needs an Expo account instead. When this`,
    `machine cannot do the local one, the plan is the cloud one and its Build: line says why.`,
    `The project can choose, in package.json under expo.agentCli: buildBackend (local or eas,`,
    `optionally per platform) and target (expo-go or dev-build). A flag beats the config.`,
    `The options of expo start are accepted and passed on. For expo start with nothing decided`,
    `for you, run "${PROGRAM_PREFIX} start" instead.`,
  ],
};

export const agentCliDev: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to the `expo` CLI and is forwarded to the step that accepts it.
      permissive: true,
      command: 'dev',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(devRunHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli dev -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { resolveDevOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());
    const options = resolveDevOptions(argv ?? []);

    // @ref llp/0004-smart-start-and-project-state.rfc.md §Status — Renamed: the
    // plan-first engine is `@expo/agent-cli dev`, and `@expo/agent-cli start` is the plain `expo start` wrapper.
    const { devAsync } = require('./devAsync') as typeof import('./devAsync');
    process.exitCode = await devAsync(projectRoot, options);
  })().catch(logCmdError);
};
