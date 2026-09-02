// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher
// An `expo` command `@expo/agent-cli` does not wrap is forwarded there verbatim: `@expo/agent-cli prebuild --clean`
// is `expo prebuild --clean`. Nothing is added — no probe, no skill sync, no follow-ups — and
// nothing is interpreted, so the arguments, the output, the errors and the exit code all stay the
// Expo CLI's. Which commands reach here is `forwardedCommands` in `src/commandRegistry.ts`, a fixed
// list: a name in neither surface never gets this far, because it is not a command at all.

import { authCommands } from '../commandRegistry';
import { event } from '../events';
import type { Command } from '../types';
import { agentCliAuthPassthrough } from './auth';

/**
 * The command that answers a forwarded name, whichever CLI ends up answering it.
 *
 * One split, and it is about *what the command acts on* rather than about which CLI owns the name.
 * `prebuild`, `export` and the rest act on the project, so there is exactly one right CLI for them
 * and it is the project's. The four auth commands act on the machine's `~/.expo` session, which a
 * directory with no Expo app in it still has — so they get the fallback chain in `./auth`, and
 * every other forwarded command keeps failing honestly when there is no project CLI to run it.
 */
export function agentCliPassthrough(command: string): Command {
  return authCommands.includes(command)
    ? agentCliAuthPassthrough(command)
    : agentCliExpoPassthrough(command);
}

/**
 * The command that forwards `<command> <args...>` to the project's `expo` CLI.
 *
 * @param command One of the forwarded `expo` commands, e.g. `prebuild`.
 */
export function agentCliExpoPassthrough(command: string): Command {
  return async (argv) => {
    const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
    const { runExpoAsync } = require('../utils/expoCli') as typeof import('../utils/expoCli');
    const { findUpProjectRootOrCwd } =
      require('../utils/findUp') as typeof import('../utils/findUp');

    return (async () => {
      const args = argv ?? [];
      event('expo_passthrough', { command, args });
      // Not the asserting project-root lookup the other commands use: `expo login` and
      // `expo whoami` need no project, and the commands that do need one say so themselves.
      const projectRoot = findUpProjectRootOrCwd(process.cwd());
      process.exitCode = await runExpoAsync(projectRoot, [command, ...args]);
    })().catch(logCmdError);
  };
}
