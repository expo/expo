import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const startHelp: CommandHelp = {
  command: 'start',
  usage: `${PROGRAM_PREFIX} start`,
  options: [
    `--no-agent-skills   Skip linking agent skills from installed packages`,
    `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help          Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} start`,
      gets: 'expo start in this terminal, plus a sync of this project’s agent skills',
    },
    {
      run: `${PROGRAM_PREFIX} start --web --port 8082`,
      gets: 'the same, with --web --port 8082 forwarded to expo start untouched',
    },
    {
      run: `${PROGRAM_PREFIX} start -- --web --port 8082`,
      gets: 'the same again: everything after -- goes to the Expo CLI verbatim',
    },
  ],
  next: ['navigate', 'runtime:errors', 'dev'],
  notes: [
    `This is expo start: it probes nothing and plans nothing, and it holds this terminal.`,
    `To have the prebuild and the native build decided for you, run "${PROGRAM_PREFIX} dev" instead.`,
    `It has no --json of its own; run "npx expo start --help" for the arguments it forwards.`,
  ],
};

export const agentCliStart: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to `expo start` and is forwarded untouched.
      permissive: true,
      command: 'start',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(startHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli start -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { resolveStartOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());
    const options = resolveStartOptions(argv ?? []);

    // @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher — a command that
    // shares a name with an `expo` command behaves like it. Neither the probe nor the plan engine
    // is loaded here, so `expo start` is reached as fast as running it directly.
    const { startAsync } = require('./startAsync') as typeof import('./startAsync');
    process.exitCode = await startAsync(projectRoot, options);
  })().catch(logCmdError);
};
