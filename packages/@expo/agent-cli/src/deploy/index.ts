import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const deployHelp: CommandHelp = {
  command: 'deploy',
  usage: `${PROGRAM_PREFIX} deploy`,
  options: [
    `--web                Deploy the web export to EAS Hosting`,
    `--native             Launch the native app with create-launch (launch.expo.dev)`,
    `--upload-root <dir>  Directory to upload for --native. Default: the project itself`,
    `--json               Print the result as JSON`,
    `--no-followups       Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help           Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} deploy`,
      gets: 'a project with web support deploys its web app; no target flag needed',
    },
    {
      run: `${PROGRAM_PREFIX} deploy --web --json`,
      gets: 'the same, as one object: expo export --platform web, then eas deploy',
    },
    {
      run: `${PROGRAM_PREFIX} deploy --native`,
      gets: 'a launch.expo.dev URL to open — the store steps happen in the browser',
    },
    {
      run: `${PROGRAM_PREFIX} deploy --native --upload-root ../..`,
      gets: 'the same, for an app that lives inside a monorepo',
    },
  ],
  next: ['status', 'smoke'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'the subprocess output, progress and errors',
    keys: ['projectRoot', 'targets', 'web', 'native', 'followups'],
  },
  notes: [
    `--native stops at a URL a person has to open, and exits 7: the store account, the signing`,
    `and the submission all happen there. Hand the URL over; no command finishes it for you.`,
    `Sign in once with "npx expo login", or set EXPO_TOKEN on a machine that cannot.`,
  ],
};

export const agentCliDeploy: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveDeployOptions`, which reports a bad flag as a CommandError.
      permissive: true,
      command: 'deploy',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(deployHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli deploy -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { resolveDeployOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { deployAsync } = require('./deployAsync') as typeof import('./deployAsync');

  return (async () => {
    const options = resolveDeployOptions(argv ?? []);
    await deployAsync(findUpExpoAppRootOrAssert(process.cwd()), options);
  })().catch(logCmdError);
};
