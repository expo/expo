// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — Package-manager detection
// Which package manager puts `node_modules` back, read from the lockfile the project already has.
//
// The names, the per-directory precedence and the npm fallback mirror `@expo/package-manager`'s
// `resolvePackageManager` [observed — `packages/@expo/package-manager/src/utils/nodeManagers.ts`],
// so `doctor:fix` reinstalls with the same tool `expo prebuild` would have used. It is a copy of a
// *decision*, not an import: the process boundary of llp/0001 rules out reaching into that package.

import path from 'path';

import { fileExistsSync } from '../../utils/dir';
import type { FixPackageManager } from './fixTypes';

/**
 * Lockfile names per manager, in the order one directory is searched.
 *
 * Mirrors `RESOLUTION_ORDER` upstream, minus `nub`, which no Expo project this command runs in
 * has produced. Two projects rarely have two lockfiles; when they do, this is the tie-break.
 */
export const LOCKFILES: { name: string; files: string[] }[] = [
  { name: 'bun', files: ['bun.lock', 'bun.lockb'] },
  { name: 'yarn', files: ['yarn.lock'] },
  { name: 'npm', files: ['package-lock.json'] },
  { name: 'pnpm', files: ['pnpm-lock.yaml'] },
];

/**
 * The manager a project with no lockfile at all is reinstalled with.
 *
 * npm, for the reason upstream picks it: it is the one that ships with Node, so it is the only
 * answer that is true on every machine.
 */
export const DEFAULT_PACKAGE_MANAGER = 'npm';

/**
 * Find the lockfile that decides how this project installs.
 *
 * Walks up from the project, because a package of a monorepo has no lockfile of its own and the
 * workspace root's is the one that matters. The directory it is found in is where the install has
 * to run: `npm install` inside a workspace package writes a second lockfile there instead.
 */
export function detectPackageManager(projectRoot: string): FixPackageManager & {
  /** Directory the install runs in — the lockfile's, or the project root when there is none. */
  installCwd: string;
} {
  let dir = path.resolve(projectRoot);
  // Bounded by the filesystem root: `path.dirname('/')` is `'/'`, which ends the walk.
  for (;;) {
    for (const { name, files } of LOCKFILES) {
      for (const file of files) {
        const lockfile = path.join(dir, file);
        if (fileExistsSync(lockfile)) {
          return { name, lockfile, installCwd: dir };
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return {
        name: DEFAULT_PACKAGE_MANAGER,
        lockfile: null,
        installCwd: path.resolve(projectRoot),
      };
    }
    dir = parent;
  }
}

/** The argv that reinstalls the dependencies of a project with one manager. */
export function installArgv(packageManagerName: string): string[] {
  return [packageManagerName, 'install'];
}
