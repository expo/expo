// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §Other gates, in brief
import { printCommandHelp } from '../../help/format';
import type { CommandHelp } from '../../help/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR } from '../../utils/args';

export const runtimeReloadHelp: CommandHelp = {
  command: 'runtime:reload',
  usage: `${PROGRAM_PREFIX} runtime:reload`,
  options: [
    `--route <route>         Open this route once the app is back`,
    `--method <method>       auto (default), dev-server, runtime, or device`,
    `--ios, --platform ios   Reload the app on the booted iOS simulator`,
    `--android               Reload the app on the attached Android device`,
    `--cloud                 Reload the app on this project's EAS Simulator session`,
    `--scheme <scheme>       URL scheme for --route, instead of the one in app.json`,
    `--app-id <id>           Application id to stop, for the device method`,
    `--dev-server-url <url>  Dev server to reload through (default: the project's own)`,
    `--port <number>         Dev server on this port, short for --dev-server-url`,
    `--timeout ${DURATION_METAVAR}    How long to wait for the app to come back (default: 30s)`,
    `--json                  Print the result as JSON`,
    `--no-bundle-check       Reload without building the entry bundle first`,
    `--no-route-check        Open --route without checking it against the project`,
    `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help              Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} runtime:reload`,
      gets: 'the app runs the code on disk now, and the report says what proved it',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:reload --route /notes`,
      gets: 'the same, then that route opened in the app that came back',
    },
    {
      run: `${PROGRAM_PREFIX} runtime:reload --json --timeout 60s`,
      gets: 'the same as one object, waiting a minute for the app to come back',
    },
  ],
  next: ['runtime:errors', 'smoke', 'navigate'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'reloaded',
      'method',
      'verifiedBy',
      'devServerUrl',
      'devServerSource',
      'appsConnected',
      'commandSocketClients',
      'commandSocketChurn',
      'appsReconnected',
      'appsReconnectedReason',
      'bundle',
      'bundlesAfterReload',
      'bundlePlatforms',
      'bundlePlatformSource',
      'route',
      'routeCheck',
      'url',
      'platform',
      'deviceId',
      'attempts',
      'waitedMs',
      'followups',
    ],
  },
  notes: [
    `Run this after an edit, before any gate that reads the app: a component that threw keeps`,
    `running the old code, and runtime:errors replays what it already reported.`,
    `The command socket picks the rung. dev-server broadcasts a reload where that socket holds a`,
    `client; where it does not, device relaunches, which costs the app's JavaScript state.`,
    `The rung is the socket, not the location: --cloud only names the device backend.`,
    `--method runtime asks the app to reload itself with expo.reloadAppAsync(), which auto never`,
    `picks: on Expo Go that same call closes the app instead [observed — SDK 57, iOS simulator].`,
    `The entry bundle is checked first, so a reload never lands on one that does not compile.`,
    `A reload is reported only when it was observed — a new debugger target, or a new Bundled`,
    `line in the dev server's own output. Start the server with dev --detach so there is output.`,
    `Exit codes: 0 reloaded and observed · 20 no method reloaded it, or the bundle fails ·`,
    `22 a method ran and nothing was observed before --timeout · 1 there was no dev server.`,
    DURATION_HELP_NOTE,
  ],
};

export const agentCliReload: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveReloadOptions`.
      permissive: true,
      command: 'runtime:reload',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(runtimeReloadHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli runtime:reload -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveReloadOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { reloadAsync } = require('./reloadAsync') as typeof import('./reloadAsync');
  const { EXIT_OK, exitWithCodeAsync } =
    require('../../exitCodes') as typeof import('../../exitCodes');

  return (async () => {
    const options = resolveReloadOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const code = await reloadAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: the command has already printed everything it has to say, and
      // the code is what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
