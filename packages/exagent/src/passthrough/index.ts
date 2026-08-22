// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
// An `expo` command `exagent` does not wrap is forwarded there verbatim: `exagent prebuild --clean`
// is `expo prebuild --clean`. Nothing is added — no probe, no skill sync, no follow-ups — and
// nothing is interpreted, so the arguments, the output, the errors and the exit code all stay the
// Expo CLI's. Which commands reach here is `forwardedCommands` in `src/commandRegistry.ts`, a fixed
// list: a name in neither surface never gets this far, because it is not a command at all.

import { event } from '../events';
import type { Command } from '../types';

/**
 * The command that forwards `<command> <args...>` to the project's `expo` CLI.
 *
 * @param command One of the forwarded `expo` commands, e.g. `prebuild`.
 */
export function exagentExpoPassthrough(command: string): Command {
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
