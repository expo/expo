// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher
// Which runner spawns a *published package* this CLI does not have installed — `eas-cli` for an
// auth command outside a project, `expo-doctor`, `create-expo`, `create-launch`, and the `expo`
// fallback for a project that has none.
//
// The sibling of `./invoker.ts`, and the distinction between them is the whole design. That module
// answers "what should a suggested command be *written* as", which is a question about text a
// person reads. This one answers "what should this process *spawn*", which is a question about a
// binary. They agree on the detection and differ in what they are allowed to do with it: a
// suggestion is rewritten only for this CLI's own name, because `npx <other-package>` is a line
// that may not run under Bun; a spawn resolves the runner outright, because the runner is not text.
//
// Why it matters: `bunx @expo/agent-cli whoami` used to spawn `npm exec eas-cli` [observed — 2026-08-26],
// so a Bun user got npm's exec — a different runner, a different cache, and a
// slower first run — from a CLI they had reached through Bun.

import path from 'path';

import { fileExistsSync } from './dir';
import { detectInvoker, type Invoker } from './invoker';
import { findExecutableOnPath } from './subprocess';

/** The runner to spawn a published package with. */
export interface PackageRunner {
  /** Which runner this is, in the spelling a reader would type. */
  runner: Invoker;
  /** The executable to spawn. An absolute path for `bunx`, the bare name for `npx`. */
  command: string;
}

/** One answer per process. The environment does not change under a running command. */
let cached: PackageRunner | null = null;

/** Forget what this process resolved. For tests, and for nothing else. */
export function resetPackageRunnerCache(): void {
  cached = null;
}

/**
 * The runner this process should spawn published packages with.
 *
 * Two conditions, and both are required. Bun has to have **started** this process — detected the
 * way `./invoker.ts` detects it, from `npm_config_user_agent` and `npm_execpath`, because
 * `process.versions.bun` is unset under `bunx` for a bin with a Node shebang [observed — live,
 * 2026-08-26: `bunx <node-bin>` reports `npm_config_user_agent=bun/1.3.14 …`,
 * `npm_execpath=…/bin/bun`, `process.versions.bun` absent, `process.execPath` a Node]. And `bunx`
 * has to be **findable**, because "bun started this" is not the same claim as "bun is reachable
 * from here", and a spawn of a name that is not there fails where `npx` would have worked.
 *
 * `npx` stays the default and stays a bare name: it is resolved through `PATH` by the spawn, the
 * way it always was, and nothing about a machine that never mentioned Bun changes.
 *
 * @param env the environment to read, for tests that must not depend on this process's own.
 * @param pathEnv `PATH` to search, for the same reason.
 */
export function resolvePackageRunner({
  env,
  pathEnv,
}: { env?: NodeJS.ProcessEnv; pathEnv?: string } = {}): PackageRunner {
  if (cached) {
    return cached;
  }

  const npx: PackageRunner = {
    runner: 'npx',
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
  };

  if (detectInvoker(env) !== 'bunx') {
    cached = npx;
    return cached;
  }

  // The absolute path rather than the bare name, so the binary that answered the question is the
  // binary that runs — the same discipline `resolveEasCli` and `resolveExpoCli` follow.
  const bunx = findExecutableOnPath('bunx', { pathEnv });
  cached = bunx ? { runner: 'bunx', command: bunx } : npx;
  return cached;
}

/**
 * Lockfile names per manager, in the order one directory is searched.
 *
 * A copy of a *decision*, not an import: the same table `@expo/package-manager`'s
 * `resolvePackageManager` uses [observed — `packages/@expo/package-manager/src/utils/nodeManagers.ts`],
 * which `src/deferred/doctor-fix/packageManager.ts` also mirrors. That module is the v1 narrowing's
 * reference shelf and is imported by nothing (llp/0016 §Deferred is a place), so the four names are
 * spelled again here rather than reached for across that line.
 *
 * The whole table and not just bun's two entries, because the *precedence* is the answer: a project
 * with both `bun.lock` and `package-lock.json` in one directory installs with bun, and a walk that
 * only looked for bun's would keep climbing past an npm project into whatever a parent directory has.
 */
const LOCKFILES: { manager: string; files: string[] }[] = [
  { manager: 'bun', files: ['bun.lock', 'bun.lockb'] },
  { manager: 'yarn', files: ['yarn.lock'] },
  { manager: 'npm', files: ['package-lock.json'] },
  { manager: 'pnpm', files: ['pnpm-lock.yaml'] },
];

/**
 * Whether the lockfile that governs this project is bun's.
 *
 * Walks up, because a package of a monorepo has no lockfile of its own and the workspace root's is
 * the one that installed it. The first directory holding *any* known lockfile decides.
 */
export function projectUsesBun(projectRoot: string): boolean {
  let dir = path.resolve(projectRoot);
  // Bounded by the filesystem root: `path.dirname('/')` is `'/'`, which ends the walk.
  for (;;) {
    for (const { manager, files } of LOCKFILES) {
      for (const file of files) {
        if (fileExistsSync(path.join(dir, file))) {
          return manager === 'bun';
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return false;
    }
    dir = parent;
  }
}

/**
 * The runner a *project's* published packages should be spawned with.
 *
 * Two signals, and either one is enough. {@link resolvePackageRunner} answers "which runner started
 * this process", which is the right question for a package this CLI spawns on its own behalf. It is
 * not the whole question for a package spawned **into a project**: `@expo/agent-cli status` in a bun app run
 * from a plain shell was started by neither runner, and downloading `eas-cli` with npm's exec there
 * puts a second cache and a second copy beside the one bun already manages [confirmed,
 * 2026-08-26: `bunx eas-cli` is what a bun project should get].
 *
 * `bunx` still has to be **reachable**, for the reason it does one rung up: "this project installs
 * with bun" is not the claim "bun is on this PATH", and a spawn of a name that is not there fails
 * where `npx` would have worked. So npx remains the answer that is true on every machine.
 *
 * Not cached, because the answer is per project rather than per process.
 */
export function resolvePackageRunnerForProject(
  projectRoot: string,
  { env, pathEnv }: { env?: NodeJS.ProcessEnv; pathEnv?: string } = {}
): PackageRunner {
  const fromProcess = resolvePackageRunner({ env, pathEnv });
  if (fromProcess.runner === 'bunx' || !projectUsesBun(projectRoot)) {
    return fromProcess;
  }
  const bunx = findExecutableOnPath('bunx', { pathEnv });
  return bunx ? { runner: 'bunx', command: bunx } : fromProcess;
}

/**
 * The runner's name, for output and for events.
 *
 * The name and not the path: `bunx` is what a reader would type, and the absolute path it was
 * found at is noise in a sentence about which runner ran. The path is still what gets spawned, and
 * still what the `command` field of a resolution event carries.
 */
export function packageRunnerLabel({ runner }: PackageRunner): string {
  return runner;
}
