// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher — the forwarded set.
// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — the session these commands manage.
//
// The four auth commands are forwarded like every other `expo` command, with one difference: what
// they act on is not the project. `login`, `logout`, `register` and `whoami` read and write
// `~/.expo/state.json`, which is a fact about the *machine*, and asking the project's CLI about it
// only works when the directory happens to have one.
//
// It usually does not. Outside an Expo app — a scratch directory, an API server, a monorepo's
// root — `resolveExpoCli` falls through to `npx expo`, which installs the whole SDK to read one
// JSON file [observed — 2026-08-26: `@expo/agent-cli whoami` in an empty directory printed
// `npm warn exec The following package was not found and will be installed: expo@57.0.16` and then
// the account name], and fails outright when the registry cannot be reached [observed — same date,
// with an empty npm cache: `npm error code ENOTCACHED`].
//
// The EAS CLI reads the same file, so it is the better thing to ask when the project cannot answer.
//
// `register` is the one exception, and it is an exception in both directions: the EAS CLI has no
// `register` at all [observed — eas-cli 22.5.0, `eas register --help` answers
// `Error: Command register not found`], so the fallback that saves the other three cannot save it;
// and the download it would otherwise be worth avoiding is *acceptable* here, because a person who
// has no account yet runs this once in their life [confirmed, 2026-08-26]. So `register`
// keeps the `npx expo` rung the other three gave up, and says on stderr that it is paying for it.

import os from 'os';
import path from 'path';

import type { Command } from '../types';
import { easCliInvocation } from '../utils/easCli';
import { type Invoker } from '../utils/invoker';
import { resolvePackageRunner } from '../utils/packageRunner';
import { resolveProjectBin } from '../utils/projectBin';
import { spawnSubprocessAsync } from '../utils/subprocess';

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
 * `runner-eas` rather than `npx-eas`: which runner runs the package is the caller's, not this CLI's,
 * so naming npm in the contract would be wrong under Bun (`src/utils/packageRunner.ts`).
 *
 * `project-eas` and `path-eas` are **gone** (wave 18). The EAS side has one rung — the runner — and
 * it subsumes both: the runner resolves the project's own `eas-cli` when the project has one, and
 * resolves a *package* rather than a file, so an `eas` on `PATH` is no longer a thing that can
 * answer (`src/utils/easCli.ts`). `project-expo` stays, because the Expo side is unchanged.
 */
export type AuthCliSource = 'project-expo' | 'runner-eas' | 'runner-expo';

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

/**
 * The package `register` falls back to, for the same reason and with a different tradeoff.
 *
 * Unpinned, where the EAS rungs' `EAS_CLI_PACKAGE` (`src/utils/easCli.ts`) carries `@latest`: `npx
 * expo` resolves to the newest
 * `expo` either way, and the version of an SDK downloaded to open a signup page is not a fact worth
 * asserting in a command line a reader may see.
 */
const EXPO_CLI_PACKAGE = 'expo';

/**
 * Which CLI should answer an auth command here.
 *
 * **The project's own `expo` wins, and nothing changed about that.** A directory that has an Expo
 * app in it gets the CLI that app pinned, and every one of these commands behaves exactly as it did
 * before — which matters because `expo login` and `eas login` are not identical programs, and a
 * project that has an opinion about its Expo version should keep it.
 *
 * When the project has no `expo`, the EAS CLI answers, through the one rung this CLI has for it:
 * `npx --yes eas-cli`, or `bunx`. This module used to own a chain of its own — the project's
 * `eas-cli`, then an `eas` on `PATH` (checked with a `--version` probe, because a binary under that
 * name can be a wrapper), then the runner. **All three collapsed into the runner** (wave 18): it
 * resolves the project's own copy when there is one, and it resolves a *package*, so the `PATH`
 * candidate and the probe that guarded it have nothing left to point at
 * (`src/utils/easCli.ts`).
 *
 * Still async, and still the async one every caller awaits: the signature is the contract of a
 * forwarded command, and narrowing it to sync would churn every call site for nothing.
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

  // The ungated invocation, because this function's contract is to always answer with something to
  // spawn. When no runner is on `PATH` the spawn fails with ENOENT, and what the runner said is a
  // truer sentence than any guess this module could make.
  const easCli = easCliInvocation(projectRoot, { pathEnv });
  return {
    tool: 'eas',
    source: 'runner-eas',
    command: easCli.command,
    prefixArgs: easCli.prefixArgs,
    runner: easCli.runner,
  };
}

/**
 * A `node_modules/.bin` entry installed for this project, or null when it has none.
 *
 * The walk of `src/utils/projectBin.ts` rather than this directory alone: in an npm workspace the
 * app's own `expo` is at the workspace root, so the literal path found nothing and these commands
 * fell through to a runner that downloads an SDK to read one JSON file — the exact cost this module
 * exists to avoid (F113, wave 28).
 */
function projectBin(projectRoot: string, name: string): string | null {
  return resolveProjectBin(projectRoot, name);
}

/**
 * Which CLI should answer `register` here.
 *
 * A two-rung chain where the other three have four, and the missing rungs are the EAS ones: there
 * is no `eas register` to fall back to, so the choice is `npx expo register` or nothing. It is
 * `npx expo register`.
 *
 * The download this costs is the one {@link resolveAuthCliAsync} exists to avoid, and it is
 * accepted here rather than avoided [confirmed, 2026-08-26]. The two commands are not
 * comparable: `whoami` is a question an agent asks on every run and answers from a file, so paying
 * for an SDK to read it is pure waste, while `register` creates an account — once, interactively,
 * in a browser — and a one-time install is a fair price for the only thing that can do the job. The
 * alternative was to keep failing with a message telling the reader to go to expo.dev/signup by
 * hand, which spends the same minute of their time and delivers less.
 *
 * The runner comes from `resolvePackageRunner`, so a Bun user gets `bunx expo` rather than npm's
 * exec (`src/utils/packageRunner.ts`).
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 */
export function resolveRegisterCli(
  projectRoot: string,
  { pathEnv }: { pathEnv?: string } = {}
): AuthCli {
  const projectExpo = projectBin(projectRoot, 'expo');
  if (projectExpo) {
    return { tool: 'expo', source: 'project-expo', command: projectExpo, prefixArgs: [] };
  }

  const resolved = resolvePackageRunner({ pathEnv });
  return {
    tool: 'expo',
    source: 'runner-expo',
    command: resolved.command,
    prefixArgs: [EXPO_CLI_PACKAGE],
    runner: resolved.runner,
  };
}

/**
 * The session file the CLI family will actually read.
 *
 * Not a constant. `~/.expo/state.json` is the usual answer and it was printed as though it were the
 * only one: under `EXPO_STAGING=1` the whole family reads `~/.expo-staging/state.json`, so a notice
 * naming the first is a notice about a file the run never touched [observed — live staging, S6].
 *
 * The same three rules the family uses, in the same order [observed — `@expo/cli`
 * `api/user/UserSettings.ts` `getExpoHomeDirectory`, and eas-cli resolves the same directory]:
 * `__UNSAFE_EXPO_HOME_DIRECTORY` wins, then `EXPO_STAGING`, then `EXPO_LOCAL`.
 */
export function sessionFilePath(env: NodeJS.ProcessEnv = process.env): string {
  const home = os.homedir();
  const unsafeHome = env.__UNSAFE_EXPO_HOME_DIRECTORY;
  const directory = unsafeHome
    ? unsafeHome
    : isTruthy(env.EXPO_STAGING)
      ? path.join(home, '.expo-staging')
      : isTruthy(env.EXPO_LOCAL)
        ? path.join(home, '.expo-local')
        : path.join(home, '.expo');
  return path.join(directory, 'state.json');
}

/** How the Expo family reads a boolean environment variable [`boolish`, @expo/cli]. */
function isTruthy(value: string | undefined): boolean {
  return value === '1' || value === 'true';
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
 * **On stderr**, always. `@expo/agent-cli whoami`'s stdout is the account name and nothing else — this
 * CLI's own auth preflight parses it (`src/needsHuman/preflight.ts`), and so will anything else
 * that reads a name out of a pipe. A note about which CLI answered belongs on the channel notes go
 * on.
 */
export function authFallbackNotice(cli: AuthCli, command: string): string | null {
  if (cli.source === 'project-expo') {
    // What a reader already assumes is happening needs no announcement.
    return null;
  }
  if (cli.source === 'runner-expo') {
    return [
      `Using the Expo CLI (${authCliLabel(cli)}) for "${command}": no expo package is installed for this directory or any above it, and the EAS CLI has no "${command}".`,
      `${cli.runner ?? 'npx'} will download the expo package first, which takes a minute. This is the one auth command that needs it — "login", "logout" and "whoami" answer from the EAS CLI without downloading anything.`,
    ].join('\n');
  }
  return [
    `Using the EAS CLI (${authCliLabel(cli)}) for "${command}": no expo package is installed for this directory or any above it.`,
    `Both CLIs sign in to the same account — the session lives in ${sessionFilePath()} and is shared between them [observed — @expo/cli "api/user/UserSettings.ts" and eas-cli "utils/paths.js" resolve the same file].`,
  ].join('\n');
}

/**
 * The command that answers one of the four auth commands.
 *
 * Deliberately shaped like `agentCliExpoPassthrough`, and for the same reason: nothing is added to
 * the run. The arguments, the output, the errors and the exit code all stay the answering CLI's,
 * and the only thing this contributes is *which* CLI that is, plus one line on stderr saying so
 * when it is not the one the reader would assume.
 *
 * stdio is inherited, because `login` asks for a password and `register` opens a browser. That is
 * the one hard constraint on this path: a captured run would turn the prompt into a hang.
 *
 * @param command One of {@link AUTH_COMMANDS}.
 */
export function agentCliAuthPassthrough(command: string): Command {
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
      // `register` resolves down its own chain, because the EAS CLI has no `register` to offer it.
      const cli =
        command === 'register'
          ? resolveRegisterCli(projectRoot)
          : await resolveAuthCliAsync(projectRoot);

      event('auth_passthrough', {
        command,
        args,
        tool: cli.tool,
        source: cli.source,
        cli: authCliLabel(cli),
      });
      const notice = authFallbackNotice(cli, command);
      if (notice) {
        Log.error(notice);
      }

      // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
      // The one thing a forwarded command cannot forward: `--json` is this CLI's contract and
      // neither `expo whoami` nor `eas whoami` has such a flag, so the flag reached the other CLI,
      // was ignored, and an agent that asked for one object got a line of prose at exit 0
      // [observed — live staging, S7]. `whoami` is a *read*, so this one can be answered here.
      if (command === 'whoami' && args.includes('--json')) {
        process.exitCode = await printWhoamiJsonAsync(projectRoot, cli, args);
        return;
      }

      // Both CLIs spell all four verbs the same way, so the command word is the command word.
      process.exitCode = await runInheritedAsync(
        cli.command,
        [...cli.prefixArgs, command, ...args],
        { cwd: projectRoot }
      );
    })().catch(logCmdError);
  };
}

/**
 * The machine shape of `@expo/agent-cli whoami --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one object on stdout, every key
 * always present, and a fact the run does not have is null.
 */
export interface WhoamiResultJson {
  /** Whether the CLI that answered says this machine is signed in. */
  loggedIn: boolean;
  /** The account name, or null when the answer named none. */
  user: string | null;
  /** Which CLI answered, e.g. `expo whoami`. */
  source: string;
  /** The session file that CLI reads, which `EXPO_STAGING` moves. */
  sessionFile: string;
  /** The invocation that answered, so a reader can run the same thing by hand. */
  cli: string;
}

/**
 * Answer `whoami --json` from the same CLI the forwarded form would have run.
 *
 * Captured rather than inherited, which is the difference from every other path in this module:
 * this run owns stdout, and the prose the CLI prints is the thing being turned into the object.
 * `--json` is dropped from the argv it forwards, because neither CLI has it.
 *
 * The exit code stays the answering CLI's, so the two forms of this command agree: a signed-out
 * machine is `1` here exactly as it is without `--json`.
 */
async function printWhoamiJsonAsync(
  projectRoot: string,
  cli: AuthCli,
  args: string[]
): Promise<number> {
  const Log = require('../log') as typeof import('../log');
  const { parseWhoamiUser } =
    require('../needsHuman/preflight') as typeof import('../needsHuman/preflight');

  const forwarded = args.filter((arg) => arg !== '--json');
  const result = await spawnSubprocessAsync(
    cli.command,
    [...cli.prefixArgs, 'whoami', ...forwarded],
    { cwd: projectRoot, output: 'capture' }
  );

  const report: WhoamiResultJson = {
    loggedIn: result.exitCode === 0,
    user: result.exitCode === 0 ? parseWhoamiUser(result.stdout) : null,
    source: `${cli.tool} whoami`,
    sessionFile: sessionFilePath(),
    cli: authCliLabel(cli),
  };
  Log.log(JSON.stringify(report, null, 2));
  // What the CLI said, on stderr, where it cannot break the parse: a signed-out machine's reason
  // is its own sentence and this object does not carry prose.
  const said = `${result.stderr}${result.stdout}`.trim();
  if (result.exitCode !== 0 && said) {
    Log.error(said);
  }
  return result.exitCode ?? 1;
}
