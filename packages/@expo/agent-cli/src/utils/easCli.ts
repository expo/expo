// @ref llp/0007-deploy-and-headless.rfc.md §deploy — EAS Hosting is the web rail.
// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI — the single rung.
// The EAS CLI is reached as a subprocess like the rest of the family (llp/0001 constraint 5), so
// the first question of anything that goes through EAS is which `eas` is going to run. A web deploy
// answers it before it exports; every other EAS-backed command answers it the same way, which is
// why the resolver is here and not under `deploy/`.
//
// **There is one answer: the package runner.** `npx --yes eas-cli`, or `bunx eas-cli`. Not a ladder
// of a project bin, then `PATH`, then a runner — one rung, taken every time
// [decided, 2026-08-27]. An installed `eas-cli` was never something this CLI could expect
// [observed — 2026-08-26: `eas unknown (no EAS CLI is installed, so nothing here
// can ask EAS about builds)` on a machine that had simply never installed it].
//
// Two things make one rung simpler rather than weaker, and both were measured before they were
// relied on (llp/0015 §Resolving the EAS CLI):
//
//  1. **The runners already prefer the project's own copy.** `npx --yes eas-cli` in a project that
//     has `eas-cli` installed runs *that* version and touches no network — verified against a dead
//     registry [observed — live, 2026-08-27]. So dropping the "project bin first" rung drops
//     nothing: the pin still wins, including in a monorepo whose install is hoisted to the
//     workspace root.
//  2. **It kills the impostor class by construction.** What used to answer the name `eas` was
//     whatever the machine had under it — a wrapper, a stale symlink, a shim from another tool
//     (llp/0001 §Constraints) — and every call site needed a guard against reporting its bytes as
//     the service's answer. A runner resolves a *package*, never a file on `PATH`, so a stray `eas`
//     is not spawned at all. The guards stay as a safety net (`utils/wrapperCrash.ts`) and should
//     now be unreachable.
//
// The one cost is the first run in a project that does *not* have `eas-cli`: the runner downloads
// it. Which caller may pay that is a caller's decision rather than this module's, and `pinned` is
// what lets each of them make it — see llp/0015 §Resolving the EAS CLI.

import fs from 'fs';
import path from 'path';

import { CommandError } from './errors';
import { type Invoker } from './invoker';
import { resolvePackageRunnerForProject } from './packageRunner';
import { findExecutableOnPath } from './subprocess';

/** The `eas` invocation to spawn. */
export interface EasCli {
  /** The executable to spawn: the runner. An absolute path for `bunx`, the bare name for `npx`. */
  command: string;
  /**
   * What goes before the `eas` command word: the runner's own flags, then the package spec.
   *
   * Always spread through {@link easCliArgs} rather than read directly — a call site that spawns
   * `command` with its own argv alone runs `npx build:list`, which is a different program.
   */
  prefixArgs: string[];
  /**
   * Where the CLI came from, which is now always a description of the runner, e.g.
   * `npx --yes eas-cli@latest`.
   *
   * A string rather than the old `'project' | 'path' | 'runner'` enum: with one rung there is no
   * rung to report, and what the reader of an event or a failure needs instead is the line they
   * could paste. {@link easCliLabel} is the accessor; this field is what carries it into a payload.
   */
  source: string;
  /** Which runner is going to run it. */
  runner: Invoker;
  /**
   * Whether the project declares `eas-cli`, so the runner resolves it out of `node_modules`.
   *
   * The difference between a spawn that costs about a third of a second and one that may install a
   * package first, which is the only thing any caller has to weigh about this rung. Read from the
   * project's `package.json` rather than probed, because the decision it informs has to be made
   * before anything is spawned.
   */
  pinned: boolean;
}

/**
 * The package spec for a project that does **not** declare `eas-cli`.
 *
 * `@latest` because there is no pin in this project to respect, and the newest CLI is the one that
 * knows about the newest service. It is not free: `@latest` asks the registry on every run, and on a
 * machine that cannot reach one it stalls for the length of npm's own retry ladder before failing
 * [observed — live, 2026-08-27: ~70 s against a dead registry]. Every caller therefore spawns this
 * under a deadline, and the opportunistic ones say so when it expires.
 */
export const EAS_CLI_PACKAGE_LATEST = 'eas-cli@latest';

/**
 * The package spec for a project that declares `eas-cli`.
 *
 * The bare name, and {@link EAS_CLI_PACKAGE_LATEST} is exactly what it must not be: a spec carrying
 * a version **defeats the pin**. `npx --yes eas-cli@latest` in a project holding 22.4.0 ran 22.6.0,
 * where `npx --yes eas-cli` ran 22.4.0 out of `node_modules` and touched no network [observed —
 * live, 2026-08-27]. A repository that pinned a version pinned it on purpose.
 */
export const EAS_CLI_PACKAGE_PINNED = 'eas-cli';

/**
 * What goes before the package spec, per runner.
 *
 * `--yes` for npm's exec because npx **prompts** before installing a package it has not seen —
 * `Need to install the following packages: … Ok to proceed? (y)` — and a prompt is a hang rather
 * than a question here: `spawnSubprocessAsync` never attaches stdin (llp/0006 §Surface improvements
 * parity), so the answer it waits for can never arrive. `bunx` installs without asking and has no
 * such flag [observed — `bunx --help`, bun 1.3.14].
 *
 * A named constant rather than an inline array so the foreign-flag lint counts `--yes`: it is an
 * option this CLI writes onto another program's command line, which is what that inventory is for
 * (llp/0002).
 */
const NPX_RUNNER_ARGS = ['--yes'];

/** The same for bun's exec, which needs nothing. */
const BUNX_RUNNER_ARGS: string[] = [];

/** The argv one `eas` invocation is actually spawned with. */
export function easCliArgs(easCli: EasCli, args: string[]): string[] {
  return [...easCli.prefixArgs, ...args];
}

/**
 * How an invocation is written when it has to be named in output.
 *
 * The runner's **name** and its arguments, never the path the runner was found at: `bunx` is what a
 * reader would type, and `/opt/homebrew/bin/bunx eas-cli` is a line that says nothing more while
 * looking like it says something about this machine. The path is still what gets spawned.
 */
export function easCliLabel(easCli: EasCli): string {
  return easCli.source;
}

/**
 * Whether this invocation may have to install the CLI before it can answer.
 *
 * The question every caller with a deadline has to ask. False for a project that declares
 * `eas-cli`: the runner resolves it out of `node_modules`, and the spawn is then as cheap as running
 * the bin directly [observed — 0.26–0.45 s against 0.32–0.42 s, live, 2026-08-27].
 */
export function mayDownloadEasCli(easCli: EasCli | null): boolean {
  return easCli != null && !easCli.pinned;
}

/**
 * Whether the project declares `eas-cli`, as a dependency or a dev dependency.
 *
 * A **declaration**, not an installed copy. It decides the package spec, and the spec has to be
 * chosen before anything runs; walking `node_modules` to find out whether the declaration was
 * honoured would answer a different question more slowly. A project that declares it and has not
 * installed it gets `npx --yes eas-cli`, and npx installs the declared range — which is the version
 * the project asked for either way.
 *
 * The known gap: a package that does *not* declare it while a sibling workspace does gets
 * `@latest`, and so downloads a CLI that is already on disk. That is the honest reading of "this
 * project pinned a version", and the cost is one download rather than a wrong version.
 *
 * Sync, and never throws: a `package.json` that is missing, unreadable or not an object reads as
 * "does not declare it", which costs the pin and never the command.
 */
export function projectDeclaresEasCli(projectRoot: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    return false;
  }
  if (parsed == null || typeof parsed !== 'object') {
    return false;
  }
  const manifest = parsed as { dependencies?: unknown; devDependencies?: unknown };
  return declaresEasCli(manifest.dependencies) || declaresEasCli(manifest.devDependencies);
}

function declaresEasCli(field: unknown): boolean {
  return field != null && typeof field === 'object' && EAS_CLI_PACKAGE_PINNED in field;
}

/**
 * The invocation that runs the EAS CLI for a project, whether or not one is installed.
 *
 * Never consults `PATH` for an `eas`, and never reaches into `node_modules/.bin`: the runner does
 * both jobs, and does the second one better (§module header). What it does read is the project's
 * `package.json`, to choose between the pinned spec and `@latest`.
 *
 * **Ungated**, so it always answers with something to spawn — for a caller whose report of a spawn
 * that failed is honest on its own, like the auth passthrough, which prints what the runner said. A
 * caller that has to tell "nothing here can ask EAS" apart from "EAS said no" uses
 * {@link resolveEasCli}.
 *
 * @param pathEnv `PATH` to search for the runner, for tests that must not depend on the machine's own.
 * @param env the environment to read the invoking runner from, for the same reason.
 */
export function easCliInvocation(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli {
  const runner = resolvePackageRunnerForProject(projectRoot, { env, pathEnv });
  const pinned = projectDeclaresEasCli(projectRoot);
  const prefixArgs = [
    ...(runner.runner === 'npx' ? NPX_RUNNER_ARGS : BUNX_RUNNER_ARGS),
    pinned ? EAS_CLI_PACKAGE_PINNED : EAS_CLI_PACKAGE_LATEST,
  ];
  return {
    command: runner.command,
    prefixArgs,
    source: [runner.runner, ...prefixArgs].join(' '),
    runner: runner.runner,
    pinned,
  };
}

/**
 * The same invocation, or `null` when the runner itself cannot be reached from here.
 *
 * `null` is a much narrower answer than the old resolver's: not "no EAS CLI is installed" — the
 * runner would have fetched one — but "this machine has no `npx` and no `bunx`", which is a broken
 * or absent Node install. Callers that must never fail for want of EAS still handle it, and their
 * reasons say so in those terms.
 *
 * The gate is what keeps that honest. `resolvePackageRunner` deliberately leaves `npx` a bare name —
 * resolved through `PATH` by the spawn, the way it always was — so the *name* is what is looked up
 * here, and what gets spawned is still whatever that module returned.
 */
export function resolveEasCli(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli | null {
  const easCli = easCliInvocation(projectRoot, { pathEnv, env });
  if (path.isAbsolute(easCli.command)) {
    return easCli;
  }
  return findExecutableOnPath(easCli.command, { pathEnv }) ? easCli : null;
}

/**
 * Resolve the EAS CLI for a caller that cannot do its job without one.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 * @throws {CommandError} `EAS_CLI_MISSING` when no package runner can be reached.
 */
export function resolveEasCliOrThrow(
  projectRoot: string,
  { pathEnv, env }: { pathEnv?: string; env?: NodeJS.ProcessEnv } = {}
): EasCli {
  const resolved = resolveEasCli(projectRoot, { pathEnv, env });
  if (resolved) {
    return resolved;
  }

  // Reaching here is not "you have not installed eas-cli" — this CLI would have run the published
  // one — so `npm install -g eas-cli` is not the advice: it is a command the reader cannot run
  // either, for the same reason nothing else here worked.
  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      `The EAS CLI could not be reached, so this command cannot run.`,
      `Why: this CLI runs the published eas-cli through a package runner, and no package runner ("npx" or "bunx") was found on PATH — so there is nothing here that can start it.`,
      `How: PATH is missing the Node.js install that provides npm and npx; fix that, then run this command again. Once npm is reachable, "npm install --save-dev eas-cli" also pins the CLI into this project, which is the version this command would then run.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install --save-dev eas-cli';
  throw error;
}
