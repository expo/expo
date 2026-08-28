// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving a project-local bin
// The one walk behind every "the project's own copy of X" question this CLI asks about an
// executable. Six resolvers each built the literal path `<projectRoot>/node_modules/.bin/<name>`,
// which is one layout out of several a package manager produces — and not the one an npm workspace
// produces at all (F113, wave 28).
//
// A file lookup, never `require.resolve`: a `.bin` entry is a shim rather than an importable
// module, and nothing here may execute project code to find out where the project's tools are
// (`src/project/nodeModules.ts` states the same rule for package directories).
import path from 'path';

import { fileExistsSync } from './dir';

/** One search for a project-local bin, and what it covered. */
export interface ProjectBinLookup {
  /** The executable to spawn, or null when no ancestor had it. */
  command: string | null;
  /**
   * Every `node_modules/.bin` directory that was looked in, nearest first.
   *
   * Carried so an error can say what it searched instead of guessing why nothing was found. The
   * guess was wrong in exactly the case this walk fixes: "install the project's dependencies",
   * printed to a reader whose dependencies were installed and hoisted.
   */
  searched: string[];
}

/**
 * The file name a bin is installed under here.
 *
 * On Windows npm writes a batch shim beside the shell script, and it is the shim that can be
 * started — `resolveSpawnTarget` (`./windowsShim.ts`) then runs it through `cmd.exe`.
 */
export function projectBinFileName(name: string): string {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

/**
 * The project's own copy of a bin, walking `node_modules/.bin` from the project upwards.
 *
 * **This does not loosen "the project's own copy".** An ancestor's `node_modules` *is* this
 * project's dependency tree: it is where npm, yarn and pnpm put a workspace package's dependencies,
 * and it is what Node itself resolves from here. That is the whole difference from a global install
 * or a package fetched from the registry, which are copies of something else — so the resolvers
 * that refuse those (`resolveFingerprintCli`'s "no npx fallback", `resolveTypeScriptCli`'s missing
 * one) keep refusing them, and the version-comparability rule they exist for
 * ([[0001-agentic-cli-on-expo-cli]] §Constraints item 5) holds unchanged.
 *
 * **The stop is the filesystem root**, which is where `resolvePackageRootSync`
 * (`src/project/nodeModules.ts`) and `detectPackageManager`
 * (`src/deferred/doctor-fix/packageManager.ts`) stop too, and where Node's own resolution stops. A
 * walk that stopped at "the workspace root" would have to decide what one is, and no filesystem
 * marks it: a `workspaces` field, a `pnpm-workspace.yaml`, a lockfile and a `.git` directory all
 * disagree in real repositories, and each disagreement would be a project whose installed tool this
 * CLI declines to find.
 *
 * The nearest copy wins, because that is the one the project pinned.
 */
export function lookupProjectBin(projectRoot: string, name: string): ProjectBinLookup {
  const fileName = projectBinFileName(name);
  const searched: string[] = [];
  for (let dir = path.resolve(projectRoot); ; dir = path.dirname(dir)) {
    const binDirectory = path.join(dir, 'node_modules', '.bin');
    searched.push(binDirectory);
    const candidate = path.join(binDirectory, fileName);
    // A file, so a directory that shares the name is not mistaken for an executable, and a broken
    // symlink — which is what a half-removed install leaves — reads as absent and the walk goes on.
    if (fileExistsSync(candidate)) {
      return { command: candidate, searched };
    }
    if (path.dirname(dir) === dir) {
      return { command: null, searched };
    }
  }
}

/** {@link lookupProjectBin}, for the callers that only need the answer. */
export function resolveProjectBin(projectRoot: string, name: string): string | null {
  return lookupProjectBin(projectRoot, name).command;
}

/**
 * What a failed search covered, as a clause an error message can carry.
 *
 * The paths are not listed one per line: a real project is ten directories from the root and the
 * list would bury the sentence it is in. The three facts a reader acts on are where the search
 * started, that it went up, and where it stopped.
 */
export function describeProjectBinSearch(name: string, { searched }: ProjectBinLookup): string {
  const start = searched[0] ?? '';
  return `no "${name}" in ${start}, nor in the node_modules/.bin of every directory above it (${searched.length} searched, up to ${path.parse(start).root})`;
}
