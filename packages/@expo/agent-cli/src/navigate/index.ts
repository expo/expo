import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const navigateHelp: CommandHelp = {
  command: 'navigate',
  usage: `${PROGRAM_PREFIX} navigate <route>`,
  options: [
    `--scheme <scheme>       URL scheme of the app, instead of the one in app.json`,
    `--ios                   Open the link on the booted iOS simulator`,
    `--android               Open the link on the attached Android device`,
    `--cloud                 Open the link on this project's EAS Simulator session`,
    `--app-id <id>           Application id of the target app`,
    `--dev-server-url <url>  Dev server to read (default: the project's own, then 8081)`,
    `--print-url             Print the URL and open nothing; needs no device`,
    `--attach-timeout <dur>  How long to wait for the app to connect (default: 45s)`,
    `--no-wait-attach        Report what the device tool said, without waiting for the app`,
    `--json                  Print the result as JSON`,
    `--no-route-check        Open the link without checking the route against the project`,
    `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help              Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} navigate /`,
      gets: 'the app opens on a booted device, at the root route',
    },
    {
      run: `${PROGRAM_PREFIX} navigate /profile/42 --ios`,
      gets: 'that route opens on the booted iOS simulator',
    },
    {
      run: `${PROGRAM_PREFIX} navigate "/search?q=shoes" --json`,
      gets: 'the same as one object: the url, the device, and whether the app attached',
    },
    {
      run: `${PROGRAM_PREFIX} navigate / --print-url`,
      gets: 'the resolved URL only. Nothing is opened, and no device is needed',
    },
  ],
  next: ['runtime:tree', 'runtime:errors', 'smoke'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'the device tool’s output, progress and errors',
    keys: [
      'route',
      'url',
      'devServerUrl',
      'devServerSource',
      'resolution',
      'target',
      'hostType',
      'connect',
      'printUrl',
      'deviceBackend',
      'platform',
      'deviceId',
      'appId',
      'command',
      'exitCode',
      'launch',
      'routeCheck',
      'reversedPort',
      'attached',
      'attachWaitedMs',
      'attachRecovered',
      'attachAlert',
      'followups',
    ],
  },
  notes: [
    `The URL shape follows the app: Expo Go uses exp://<host>/--/<route>, a development build`,
    `uses <scheme>://<route>. Which one is running is read from the dev server, so start it with`,
    `"${PROGRAM_PREFIX} dev --detach" first.`,
    `--print-url resolves everything and opens nothing. Use it for a device this machine cannot`,
    `drive — a phone, a cloud simulator — and hand the URL to whatever opens it.`,
    `A tunnelled dev server changes the host in the URL, and that host is read from the log a`,
    `--detach run wrote. A server started in a terminal leaves none.`,
  ],
};

export const agentCliNavigate: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveNavigateOptions`.
      permissive: true,
      command: 'navigate',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(navigateHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli navigate -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { resolveNavigateOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { navigateAsync } = require('./navigateAsync') as typeof import('./navigateAsync');

  return (async () => {
    const options = resolveNavigateOptions(argv ?? []);
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());
    process.exitCode = await navigateAsync(projectRoot, options);
  })().catch(logCmdError);
};
