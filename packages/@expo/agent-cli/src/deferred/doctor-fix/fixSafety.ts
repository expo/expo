// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — Path safety
// The one predicate every target of `doctor:fix` passes through, on the way into the plan and
// again on the way into `rm`.
//
// Everything else in this command decides *whether* a path is worth deleting. This decides whether
// the path is one the command is allowed to name at all, and it is the only thing standing between
// a table of glob patterns and somebody's home directory. It answers from its arguments and from
// `lstat`/`realpath` of the target — nothing here reads the process environment, so the table test
// describes a machine instead of running on one.

import fs from 'fs';
import path from 'path';

import { isPathInside } from '../../utils/dir';
import type { FixScope } from './fixTypes';

/** What the predicate needs to know about the machine and about the step that named the target. */
export interface TargetSafetyContext {
  /** Absolute path of the project being fixed. */
  projectRoot: string;
  /** Absolute home directory of the user. */
  homeDir: string;
  /** Absolute temporary directory, i.e. `os.tmpdir()`. */
  tmpDir: string;
  /** The scope the step declared for this target. */
  scope: FixScope;
  /** Whether `--allow-machine-wide` was passed. */
  allowMachineWide: boolean;
}

/**
 * Directories that may hold a *machine-wide* target, as a function of the machine.
 *
 * A fixed list, not a rule: a machine-wide deletion affects every project here, so the set of
 * places one may live is small enough to write down and read. The roots themselves are never
 * targets — only paths strictly inside them.
 */
export function machineWideRoots({
  homeDir,
  tmpDir,
}: Pick<TargetSafetyContext, 'homeDir' | 'tmpDir'>): string[] {
  return [tmpDir, path.join(homeDir, 'Library', 'Developer', 'Xcode', 'DerivedData')];
}

/**
 * Directories that may hold a *project-scoped* target.
 *
 * The project directory, and the temporary directory: Metro's file map lives in `$TMPDIR` under a
 * name built from the md5 of the project root, so it is outside the project and belongs to it
 * alone [observed — `@expo/metro-file-map` `DiskCacheManager.getCacheFilePath` and
 * `rootRelativeCacheKeys`, live on this machine 2026-08-24].
 */
function projectScopedRoots({ projectRoot, tmpDir }: TargetSafetyContext): string[] {
  return [projectRoot, tmpDir];
}

/**
 * Whether one absolute path may be deleted.
 *
 * @returns null when the target is safe, or one sentence naming why it is not. The sentence is the
 * message of the `DOCTOR_FIX_UNSAFE_PATH` the caller raises, so it says what was refused and why.
 */
export function rejectUnsafeTarget(target: string, context: TargetSafetyContext): string | null {
  if (!path.isAbsolute(target)) {
    return `"${target}" is not an absolute path, so what it means depends on the working directory.`;
  }

  const normalized = normalize(target);
  const projectRoot = normalize(context.projectRoot);
  const homeDir = normalize(context.homeDir);
  const tmpDir = normalize(context.tmpDir);

  // The four paths that are never a cache, whatever a step believes. Checked before the scope
  // rules, so no flag and no allowlist can reach them.
  if (normalized === path.parse(normalized).root) {
    return `"${target}" is the filesystem root.`;
  }
  if (normalized === homeDir) {
    return `"${target}" is the home directory.`;
  }
  if (normalized === tmpDir) {
    return `"${target}" is the temporary directory itself, which every program on this machine shares.`;
  }
  if (normalized === projectRoot) {
    return `"${target}" is the project root. This command resets caches and build state, never the project.`;
  }

  if (context.scope === 'machine' && !context.allowMachineWide) {
    return `"${target}" affects every project on this machine. Pass --allow-machine-wide to include it.`;
  }

  const roots =
    context.scope === 'machine'
      ? machineWideRoots(context).map(normalize)
      : projectScopedRoots(context).map(normalize);

  const root = roots.find((candidate) => isPathInside(normalized, candidate));
  if (!root) {
    return context.scope === 'machine'
      ? `"${target}" is outside every directory on the machine-wide allowlist (${roots.join(', ')}).`
      : `"${target}" is outside the project (${projectRoot}) and outside the temporary directory (${tmpDir}).`;
  }

  // A symlink is the one shape where the path a reader sees and the bytes `rm -rf` reaches are
  // different things. Nothing in the step table is one, so a target that is one means the machine
  // is not in the state the table describes, and the honest answer is to stop.
  const link = lstatOrNull(normalized);
  if (link?.isSymbolicLink()) {
    return `"${target}" is a symlink. This command deletes directories, and following a link would delete something else.`;
  }

  // The parent may be the link instead, which the lstat above never sees. A target that does not
  // exist has no realpath and is not unsafe: the planner is what decides it is not worth a step.
  //
  // The *root* is resolved too, and it has to be: on macOS `os.tmpdir()` answers
  // `/var/folders/…`, `/var` is a symlink to `/private/var`, and every real path under it starts
  // with `/private` [observed live — the first run of this command on this machine refused its own
  // Metro file map for escaping a directory it had never left]. Comparing a resolved path against
  // an unresolved root makes every target of a symlinked root look like an escape.
  const real = realpathOrNull(normalized);
  const realRoot = realpathOrNull(root) ?? root;
  if (real && real !== normalized && !isPathInside(real, realRoot)) {
    return `"${target}" resolves to "${real}", which is outside ${root}.`;
  }

  return null;
}

/** One path with its separators and any trailing separator normalized, for comparing. */
function normalize(target: string): string {
  const resolved = path.resolve(target);
  const root = path.parse(resolved).root;
  return resolved === root ? resolved : resolved.replace(/[\\/]+$/, '');
}

function lstatOrNull(target: string): fs.Stats | null {
  try {
    return fs.lstatSync(target);
  } catch {
    return null;
  }
}

function realpathOrNull(target: string): string | null {
  try {
    return normalize(fs.realpathSync(target));
  } catch {
    return null;
  }
}
