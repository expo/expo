// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — EAS Hosting is the web rail.
// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI — the ladder.
// The EAS CLI is reached as a subprocess like the rest of the family (llp/0001 constraint 5), so
// the first question of anything that goes through EAS is which `eas` binary is going to run. A
// web deploy answers it before it exports; every other EAS-backed command answers it the same way,
// which is why the resolver is here and not under `deploy/`.
//
// **An installed `eas-cli` is not something this CLI may expect.** The ladder used to stop at
// `PATH`, so a machine that had never installed it got `eas unknown (no EAS CLI is installed, so
// nothing here can ask EAS about builds)` from `status --explain` and an install line from every
// command that needs EAS [observed — 2026-08-26, reported by Kudo]. The published package is one
// `npx` away, and the auth chain had been reaching for it that way since wave 17, per call site.
// So the runner is a **rung of the ladder** now rather than one site's fallback.

import path from 'path';

import { fileExistsSync } from './dir';
import { CommandError } from './errors';
import { type Invoker } from './invoker';
import { resolvePackageRunnerForProject } from './packageRunner';
import { findExecutableOnPath, spawnSubprocessAsync } from './subprocess';
import { looksLikeWrapperCrash } from './wrapperCrash';

/** Where the `eas` that is going to run came from. */
export type EasCliSource =
  /** The project's own `eas-cli`, from `node_modules/.bin`. */
  | 'project'
  /** A globally installed one, found on `PATH`. */
  | 'path'
  /** None is installed, so the published package is run through `npx` or `bunx`. */
  | 'runner';

/** The `eas` bin to spawn, and where it came from. */
export interface EasCli {
  /** The executable to spawn. */
  command: string;
  /**
   * What goes before the `eas` command word, which is the package name in the runner form.
   *
   * Always spread through {@link easCliArgs} rather than read directly: a call site that spawns
   * `command` with its own argv alone runs `npx build:list`, which is a different program.
   */
  prefixArgs: string[];
  source: EasCliSource;
  /**
   * Which runner is downloading the package. Set only for `source: 'runner'`.
   *
   * The name rather than the path, because it is what {@link easCliLabel} prints and what a reader
   * would type. The path is still what gets spawned.
   */
  runner?: Invoker;
}

/**
 * The package the runner rung runs, pinned to a name rather than to a version.
 *
 * `@latest` because the rung only exists when nothing is installed: there is no pinned version in
 * this project to respect, and the newest CLI is the one that knows about the newest service.
 */
export const EAS_CLI_PACKAGE = 'eas-cli@latest';

/**
 * What goes before the `eas` command word under npm's exec.
 *
 * `--yes` because npx **prompts** before installing a package it has not seen — `Need to install the
 * following packages: … Ok to proceed? (y)` — and a prompt is a hang here rather than a question:
 * `spawnSubprocessAsync` never attaches stdin (llp/0006 §Non-interactive parity), so the answer it
 * waits for can never arrive. A named constant rather than an inline array so the foreign-flag lint
 * counts it: it is an option this CLI writes onto another program's command line, which is exactly
 * what that inventory is for (llp/0002).
 */
const NPX_PREFIX_ARGS = ['--yes', EAS_CLI_PACKAGE];

/**
 * The same, under bun's.
 *
 * No `--yes`: `bunx` installs what it is asked for without asking, and has no such flag [observed —
 * `bunx --help`, bun 1.3.14].
 */
const BUNX_PREFIX_ARGS = [EAS_CLI_PACKAGE];

/** How long the `PATH` candidate has to prove it is the EAS CLI, for the probing resolver. */
export const EAS_CLI_PROBE_TIMEOUT_MS = 4000;

/** The argv one `eas` invocation is actually spawned with. */
export function easCliArgs(easCli: EasCli, args: string[]): string[] {
  return [...easCli.prefixArgs, ...args];
}

/**
 * How an invocation is written when it has to be named in output.
 *
 * A resolved binary is named by its **path**, because *which* `eas` ran is the fact a reader needs
 * when it turns out not to have been the CLI. A runner is named by its **name and its arguments**,
 * because the path `npx` was found at says nothing the name does not, and `npx --yes eas-cli@latest`
 * is a line that can be pasted. Every reason and every report that names the source renders it this
 * way, so nothing claims an `eas` binary exists on a machine that has none.
 */
export function easCliLabel({ command, prefixArgs, runner }: EasCli): string {
  return runner ? [runner, ...prefixArgs].join(' ') : command;
}

/** Whether this invocation downloads the CLI before it runs, which is what makes a first run slow. */
export function usesPackageRunner(easCli: EasCli | null): boolean {
  return easCli?.source === 'runner';
}

/**
 * The two rungs that are already on this machine: the project's `eas-cli`, then one on `PATH`.
 *
 * For the one caller that must not pay a download to answer its question — the auth preflight reads
 * a local session file, and the rungs under it (`expo whoami`, `EXPO_TOKEN`) answer the same
 * question for free, so spending a package install on it would cost `status` its speed for nothing
 * (`src/needsHuman/preflight.ts`). Every other caller uses {@link resolveEasCli}.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 */
export function resolveInstalledEasCli(
  projectRoot: string,
  { pathEnv }: { pathEnv?: string } = {}
): EasCli | null {
  const binName = process.platform === 'win32' ? 'eas.cmd' : 'eas';
  const projectBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  if (fileExistsSync(projectBin)) {
    return { command: projectBin, prefixArgs: [], source: 'project' };
  }

  const pathBin = findExecutableOnPath('eas', { pathEnv });
  return pathBin ? { command: pathBin, prefixArgs: [], source: 'path' } : null;
}

/**
 * The runner rung on its own, with no check that the runner can be reached.
 *
 * For a caller whose contract is to always answer with *something* to spawn, and whose report of a
 * spawn that failed is honest on its own — the auth passthrough, which prints what the runner said.
 * A caller that has to distinguish "nothing here can ask EAS" uses {@link resolveEasCli}.
 */
export function easCliPackageRunner(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli {
  const runner = resolvePackageRunnerForProject(projectRoot, { env, pathEnv });
  return {
    command: runner.command,
    prefixArgs: runner.runner === 'npx' ? [...NPX_PREFIX_ARGS] : [...BUNX_PREFIX_ARGS],
    source: 'runner',
    runner: runner.runner,
  };
}

/**
 * Resolve the `eas` CLI for a project, or answer `null`.
 *
 * Three rungs: the project's own `eas-cli`, an `eas` on `PATH`, then the published package through
 * a runner. Local before global before downloaded — a version the repository pinned is the version
 * that should run, and a download is the rung that is true on every machine rather than the one
 * that is fastest.
 *
 * `null` is now a much narrower answer than it was: it means this machine has no `eas` **and** no
 * `npx` or `bunx` to fetch one with, which is a machine with no working Node install. Callers that
 * report "nothing could ask EAS" still have to handle it, and their reasons say which of the two it
 * was.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 * @param env the environment to read the invoking runner from, for the same reason.
 */
export function resolveEasCli(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli | null {
  const installed = resolveInstalledEasCli(projectRoot, { pathEnv });
  if (installed) {
    return installed;
  }
  return reachableRunnerRung(projectRoot, { pathEnv, env });
}

/**
 * The same ladder, with the `PATH` rung checked before it is taken.
 *
 * @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints
 * What answers the name `eas` is whatever this machine has under it — a wrapper, a stale symlink, a
 * shim from another tool — and a shim exits non-zero exactly the way a signed-out CLI does. The
 * check used to live in `passthrough/auth.ts`, which made "route around a broken shim" a property
 * of one command; it is the **ladder's** now, so the rung a shim falls through to is simply the next
 * one.
 *
 * Async because the check is a subprocess, and that is why it is a second function rather than an
 * option: `status` reads this on a path that promises to be instant, and a `--version` spawn per
 * resolution is not free. The sync callers keep the guard they already have — they notice a wrapper
 * *after* the fact, from the run's own output (`utils/wrapperCrash.ts`), which costs nothing when
 * the binary is real.
 *
 * The other two rungs are never probed: `node_modules/.bin` holds only what was installed into it,
 * and the runner rung names the package outright.
 */
export async function resolveEasCliAsync(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<EasCli | null> {
  const installed = resolveInstalledEasCli(projectRoot, { pathEnv });
  if (installed && (installed.source === 'project' || (await isRealEasCliAsync(installed.command, projectRoot)))) {
    return installed;
  }
  return reachableRunnerRung(projectRoot, { pathEnv, env });
}

/**
 * Whether the `eas` this resolved is really the EAS CLI.
 *
 * `--version` because it is the cheapest question the CLI answers and the one a wrapper is least
 * likely to survive. A candidate that times out or cannot be spawned is *kept*: the check exists to
 * catch a binary that is not the CLI, not to second-guess a slow machine, and a download is a worse
 * answer than a slow local one.
 */
export async function isRealEasCliAsync(command: string, cwd: string): Promise<boolean> {
  const result = await spawnSubprocessAsync(command, ['--version'], {
    cwd,
    output: 'capture',
    timeoutMs: EAS_CLI_PROBE_TIMEOUT_MS,
  });
  if (result.spawnError || result.timedOut) {
    return true;
  }
  return !looksLikeWrapperCrash({ tool: 'eas', ...result });
}

/**
 * The runner rung, or null when the runner itself cannot be reached from here.
 *
 * The gate is what keeps `null` an honest answer. `resolvePackageRunner` deliberately leaves `npx`
 * a bare name — resolved through `PATH` by the spawn, the way it always was — so the name is what
 * gets looked up here, and what gets spawned is still whatever that module returned.
 */
function reachableRunnerRung(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv }
): EasCli | null {
  const runner = easCliPackageRunner(projectRoot, { pathEnv, env });
  if (path.isAbsolute(runner.command)) {
    return runner;
  }
  return findExecutableOnPath(runner.command, { pathEnv }) ? runner : null;
}

/**
 * Resolve the `eas` CLI for a project, for a caller that cannot do its job without one.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 * @throws {CommandError} `EAS_CLI_MISSING` when the whole ladder is exhausted.
 */
export function resolveEasCliOrThrow(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli {
  const resolved = resolveEasCli(projectRoot, { pathEnv, env });
  if (resolved) {
    return resolved;
  }

  // Reaching here means no `eas` *and* no runner, so `npm install -g eas-cli` — what this used to
  // advise — is a command the reader also cannot run. What is broken is the toolchain under it.
  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      `The EAS CLI could not be reached, so this command cannot run.`,
      `Why: no "eas" binary was found in ${path.join('node_modules', '.bin')} or on PATH, and no package runner ("npx" or "bunx") is on PATH either, so the published eas-cli could not be downloaded to stand in for one.`,
      `How: add the EAS CLI to the project with "npm install --save-dev eas-cli", then run this command again. If that command is also unavailable, PATH is missing the Node.js install that provides npm and npx — fix that first.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install --save-dev eas-cli';
  throw error;
}
