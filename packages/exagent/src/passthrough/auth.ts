// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher — the forwarded set.
// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — the session these commands manage.
//
// The four auth commands are forwarded like every other `expo` command, with one difference: what
// they act on is not the project. `login`, `logout`, `register` and `whoami` read and write
// `~/.expo/state.json`, which is a fact about the *machine*, and asking the project's CLI about it
// only works when the directory happens to have one.
//
// It usually does not. Outside an Expo app — a scratch directory, an API server, a monorepo's
// root — `resolveExpoCli` falls through to `npx expo`, which installs the whole SDK to read one
// JSON file [observed — 2026-08-26: `exagent whoami` in an empty directory printed
// `npm warn exec The following package was not found and will be installed: expo@57.0.16` and then
// the account name], and fails outright when the registry cannot be reached [observed — same date,
// with an empty npm cache: `npm error code ENOTCACHED`].
//
// The EAS CLI reads the same file, so it is the better thing to ask when the project cannot answer.

import path from 'path';

import type { Command } from '../types';
import { fileExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { findExecutableOnPath, spawnSubprocessAsync } from '../utils/subprocess';
import { type Invoker } from '../utils/invoker';
import { resolvePackageRunner } from '../utils/packageRunner';
import { looksLikeWrapperCrash } from '../utils/wrapperCrash';

/**
 * The commands this module owns.
 *
 * Re-exported from the registry, which is where the partition of `forwardedCommands` is declared,
 * so that the list and the behaviour it selects can never drift apart.
 */
export { authCommands as AUTH_COMMANDS } from '../commandRegistry';

/** Which CLI is going to answer. */
export type AuthTool = 'expo' | 'eas';

/**
 * Where the CLI that is going to answer came from.
 *
 * `runner-eas` rather than `npx-eas`: which runner downloads the package is the caller's, not this
 * CLI's, so naming npm in the contract would be wrong under Bun (`src/utils/packageRunner.ts`).
 */
export type AuthCliSource = 'project-expo' | 'project-eas' | 'path-eas' | 'runner-eas';

/** The invocation one auth command resolves to. */
export interface AuthCli {
  tool: AuthTool;
  source: AuthCliSource;
  /** The executable to spawn. */
  command: string;
  /** What goes before the auth command, which is the package name in the runner form. */
  prefixArgs: string[];
  /**
   * The package runner, when the CLI is one this machine does not have installed.
   *
   * Set only for `runner-eas`. It is what {@link authCliLabel} names, because a reader wants to
   * see `bunx eas-cli@latest` rather than the absolute path the runner was found at.
   */
  runner?: Invoker;
}

/** The package the `npx` fallback runs, pinned to a name rather than to a version. */
const EAS_CLI_PACKAGE = 'eas-cli@latest';

/** How long the PATH candidate has to prove it is the EAS CLI. */
export const AUTH_PROBE_TIMEOUT_MS = 4000;

/**
 * Which CLI should answer an auth command here.
 *
 * **The project's own `expo` wins, and nothing changed about that.** A directory that has an Expo
 * app in it gets the CLI that app pinned, and every one of these commands behaves exactly as it did
 * before — which matters because `expo login` and `eas login` are not identical programs, and a
 * project that has an opinion about its Expo version should keep it.
 *
 * The fallback chain only runs when the project has no `expo`: its own `eas-cli`, then an `eas` on
 * `PATH`, then `npx eas-cli@latest`. Local before global before downloaded, the same order
 * `resolveEasCli` uses, because a version the repository pinned is the version that should run.
 *
 * The `PATH` candidate is the one that gets checked, because it is the one that can be something
 * else entirely — a wrapper, a stale symlink, a shim from another tool. It is asked for its version
 * once, and dropped if it answers the way a wrapper dies rather than the way the CLI does
 * (§`looksLikeWrapperCrash`). The other three need no check: two came out of a `node_modules` that
 * only holds what was installed into it, and the third names the package outright.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 */
export async function resolveAuthCliAsync(
  projectRoot: string,
  { pathEnv }: { pathEnv?: string } = {}
): Promise<AuthCli> {
  const projectExpo = projectBin(projectRoot, 'expo');
  if (projectExpo) {
    return { tool: 'expo', source: 'project-expo', command: projectExpo, prefixArgs: [] };
  }

  const projectEas = projectBin(projectRoot, 'eas');
  if (projectEas) {
    return { tool: 'eas', source: 'project-eas', command: projectEas, prefixArgs: [] };
  }

  const pathEas = findExecutableOnPath('eas', { pathEnv });
  if (pathEas && (await isRealEasCliAsync(pathEas, projectRoot))) {
    return { tool: 'eas', source: 'path-eas', command: pathEas, prefixArgs: [] };
  }

  const resolved = resolvePackageRunner({ pathEnv });
  return {
    tool: 'eas',
    source: 'runner-eas',
    command: resolved.command,
    prefixArgs: [EAS_CLI_PACKAGE],
    runner: resolved.runner,
  };
}

/** A `node_modules/.bin` entry of this project, or null when it has none. */
function projectBin(projectRoot: string, name: string): string | null {
  const binName = process.platform === 'win32' ? `${name}.cmd` : name;
  const bin = path.join(projectRoot, 'node_modules', '.bin', binName);
  return fileExistsSync(bin) ? bin : null;
}

/**
 * Whether the `eas` on `PATH` is really the EAS CLI.
 *
 * `--version` because it is the cheapest question the CLI answers and the one a wrapper is least
 * likely to survive. A candidate that times out or cannot be spawned is *kept*: the check exists to
 * catch a binary that is not the CLI, not to second-guess a slow machine, and `npx` — which
 * downloads — is a worse answer than a slow local one.
 */
async function isRealEasCliAsync(command: string, cwd: string): Promise<boolean> {
  const result = await spawnSubprocessAsync(command, ['--version'], {
    cwd,
    output: 'capture',
    timeoutMs: AUTH_PROBE_TIMEOUT_MS,
  });
  if (result.spawnError || result.timedOut) {
    return true;
  }
  return !looksLikeWrapperCrash({ tool: 'eas', ...result });
}

/**
 * The `eas` command that does what an `expo` auth command does, or null when there is none.
 *
 * Three of the four are the same word, because the two CLIs share the session and named the verbs
 * that manage it identically. `register` is the exception: **`eas register` does not exist**
 * [observed — eas-cli 22.4.0, `eas register --help` answers `Error: Command register not found`],
 * so it gets null and the caller says so rather than running a command that is not there.
 */
export function easArgsForAuthCommand(command: string): string[] | null {
  return command === 'register' ? null : [command];
}

/**
 * How an invocation is written when it has to be named in output.
 *
 * A resolved binary is named by its path, because *which* `eas` ran is the fact a reader needs. A
 * package runner is named by its name, because the path it was found at says nothing the name does
 * not, and `bunx eas-cli@latest` is a line that can be pasted.
 */
export function authCliLabel({ command, prefixArgs, runner }: AuthCli): string {
  return [runner ?? command, ...prefixArgs].join(' ');
}

/**
 * The line printed above a run the project did not resolve.
 *
 * **On stderr**, always. `exagent whoami`'s stdout is the account name and nothing else — this
 * CLI's own auth preflight parses it (`src/needsHuman/preflight.ts`), and so will anything else
 * that reads a name out of a pipe. A note about which CLI answered belongs on the channel notes go
 * on.
 */
export function authFallbackNotice(cli: AuthCli, command: string): string {
  return [
    `Using the EAS CLI (${authCliLabel(cli)}) for "${command}": this directory has no expo package.`,
    `Both CLIs sign in to the same account — the session lives in ~/.expo/state.json and is shared between them [observed — @expo/cli "api/user/UserSettings.ts" and eas-cli "utils/paths.js" resolve the same file].`,
  ].join('\n');
}

/**
 * The failure for an auth command the EAS CLI has no equivalent of.
 *
 * Only `register` reaches this, and only outside an Expo project. It is a real dead end rather than
 * a missing feature of this CLI, so it names both ways out: the page the command would have opened,
 * and the install that would make the command itself work.
 */
export function authCommandUnavailableError(command: string, cli: AuthCli): CommandError {
  const error = new CommandError(
    'AUTH_COMMAND_UNAVAILABLE',
    [
      `There is no CLI here that can run "${command}".`,
      `Why: "${command}" is an Expo CLI command, this directory has no expo package, and the EAS CLI that would otherwise answer has no "${command}" of its own (${authCliLabel(cli)}).`,
      `How: sign up in a browser at https://expo.dev/signup, then "npx exagent login" — which does work here. Inside an Expo project this command is forwarded to the project's own expo CLI and behaves as it always has.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent login';
  return error;
}

/**
 * The command that answers one of the four auth commands.
 *
 * Deliberately shaped like `exagentExpoPassthrough`, and for the same reason: nothing is added to
 * the run. The arguments, the output, the errors and the exit code all stay the answering CLI's,
 * and the only thing this contributes is *which* CLI that is, plus one line on stderr saying so
 * when it is not the one the reader would assume.
 *
 * stdio is inherited, because `login` asks for a password and `register` opens a browser. That is
 * the one hard constraint on this path: a captured run would turn the prompt into a hang.
 *
 * @param command One of {@link AUTH_COMMANDS}.
 */
export function exagentAuthPassthrough(command: string): Command {
  return async (argv) => {
    const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
    const { event } = require('../events') as typeof import('../events');
    const Log = require('../log') as typeof import('../log');
    const { runInheritedAsync } =
      require('../utils/inheritedRun') as typeof import('../utils/inheritedRun');
    const { findUpProjectRootOrCwd } =
      require('../utils/findUp') as typeof import('../utils/findUp');

    return (async () => {
      const args = argv ?? [];
      // Not the asserting project-root lookup: these commands need no project, which is the whole
      // reason this module exists.
      const projectRoot = findUpProjectRootOrCwd(process.cwd());
      const cli = await resolveAuthCliAsync(projectRoot);

      const commandArgs = cli.tool === 'expo' ? [command] : easArgsForAuthCommand(command);
      if (!commandArgs) {
        throw authCommandUnavailableError(command, cli);
      }

      event('auth_passthrough', {
        command,
        args,
        tool: cli.tool,
        source: cli.source,
        cli: authCliLabel(cli),
      });
      if (cli.tool === 'eas') {
        Log.error(authFallbackNotice(cli, command));
      }

      process.exitCode = await runInheritedAsync(
        cli.command,
        [...cli.prefixArgs, ...commandArgs, ...args],
        { cwd: projectRoot }
      );
    })().catch(logCmdError);
  };
}
