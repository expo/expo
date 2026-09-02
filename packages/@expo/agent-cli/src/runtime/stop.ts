// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const runtimeStopHelp: CommandHelp = {
  command: 'runtime:stop',
  usage: `${PROGRAM_PREFIX} runtime:stop`,
  options: [
    `--ios, --platform ios   Stop the app on the booted iOS simulator`,
    `--android               Stop the app on the attached Android device`,
    `--cloud                 Stop the app on this project's EAS Simulator session`,
    `--app-id <id>           Application id to stop, instead of the one this works out`,
    `--dev-server-url <url>  Dev server to ask which app is running (default: the project's own)`,
    `--port <number>         Dev server on this port, short for --dev-server-url`,
    `--json                  Print the result as JSON`,
    `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help              Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} runtime:stop`,
      gets: 'the app on the device stops; exit 0 also when it was not running',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:stop --ios --json`,
      gets: 'the same on the booted simulator, as one object naming which app it stopped',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:stop --app-id com.example.myapp`,
      gets: 'stops exactly that application id, whatever the dev server reports',
    },
  ],
  next: ['navigate', 'dev', 'status'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'stopped',
      'wasRunning',
      'platform',
      'deviceBackend',
      'deviceId',
      'bundleId',
      'bundleIdSource',
      'bundleIdReason',
      'command',
      'reason',
      'connectedAppIds',
      'appIdMismatch',
      'followups',
    ],
  },
  notes: [
    `The counterpart of navigate, which starts the app. The hard part is which app: Expo Go and`,
    `a development build are different applications. Evidence is ranked — --app-id, the app`,
    `connected to the dev server, the app config, then Expo Go — and bundleIdSource says which.`,
    `The one runtime command that needs no dev server: it acts on a device, not on a debugger.`,
    `--cloud stops the app, never the EAS Simulator session, which keeps billing. End the`,
    `session with "npx eas simulator:stop".`,
    `Exit 20 has one cause: --app-id named an app that is not running while the dev server`,
    `reports a different one that is. Nothing was stopped — most often a typo in the id.`,
  ],
};

export const agentCliRuntimeStop: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveRuntimeStopOptions`.
      permissive: true,
      command: 'runtime:stop',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(runtimeStopHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli runtime:stop -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveRuntimeStopOptions } =
    require('./resolveStopOptions') as typeof import('./resolveStopOptions');
  const { runtimeStopAsync } = require('./stopAsync') as typeof import('./stopAsync');

  return (async () => {
    const options = resolveRuntimeStopOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    process.exitCode = await runtimeStopAsync(projectRoot, options);
  })().catch(logCmdError);
};
