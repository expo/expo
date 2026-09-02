// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — Ordering, derived rather than listed
// Turn the tier table into the plan for one project on one machine: which steps this project has,
// which of their targets exist, how big they are, and in what order they would run.
//
// This is the half that probes. Everything it decides *with* is pure — `fixSteps.ts` names the
// targets and `fixSafety.ts` accepts or refuses them — so what is left here is `stat`, `readdir`,
// and one `git status`.

import fs from 'fs';
import os from 'os';
import path from 'path';

import { dirtyTrackedPathsAsync } from '../../checkpoint/git';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import { directoryExistsSync, fileExistsSync } from '../../utils/dir';
import { CommandError } from '../../utils/errors';
import { findExecutableOnPath } from '../../utils/subprocess';
import { rejectUnsafeTarget, type TargetSafetyContext } from './fixSafety';
import {
  stepsForTier,
  type FixStepContext,
  type FixStepDefinition,
  type NativePlatform,
  type TargetSpec,
} from './fixSteps';
import type { FixPackageManager, FixStep, FixTier, SkippedFixStep } from './fixTypes';
import { detectPackageManager } from './packageManager';

/** How many directory entries one target's size is measured over before the answer is `null`. */
export const SIZE_WALK_LIMIT = 20_000;

export interface FixPlanOptions {
  tier: FixTier;
  /** The platforms the run covers, or null to read them off the project. */
  platforms: NativePlatform[] | null;
  allowMachineWide: boolean;
}

/** A plan, plus what the applier needs to check every target a second time before deleting it. */
export interface FixPlan {
  projectRoot: string;
  tier: FixTier;
  platforms: NativePlatform[];
  packageManager: FixPackageManager;
  steps: FixStep[];
  skipped: SkippedFixStep[];
  /** The machine the targets were accepted against, re-used at apply time. */
  safety: Pick<TargetSafetyContext, 'projectRoot' | 'homeDir' | 'tmpDir' | 'allowMachineWide'>;
}

/**
 * Probe the project and build the plan.
 *
 * @throws {CommandError} `DOCTOR_FIX_DIRTY_NATIVE` when a planned step deletes inside a native
 * directory holding uncommitted tracked changes, and `DOCTOR_FIX_UNSAFE_PATH` when the table named
 * a target the safety predicate refuses.
 */
export async function planFixAsync(projectRoot: string, options: FixPlanOptions): Promise<FixPlan> {
  const context = probeProject(projectRoot, options.platforms);
  const safety = {
    projectRoot,
    homeDir: context.homeDir,
    tmpDir: context.tmpDir,
    allowMachineWide: options.allowMachineWide,
  };

  const definitions = stepsForTier(options.tier, context.platform);
  await assertNativeIsCleanAsync(projectRoot, definitions, context);

  const steps: FixStep[] = [];
  const skipped: SkippedFixStep[] = [];

  for (const definition of definitions) {
    const unavailable = definition.unavailable?.(context) ?? null;
    if (unavailable) {
      skipped.push({ id: definition.id, reason: unavailable });
      continue;
    }

    // Not an error: a machine-wide step the caller did not opt into is a step this run does not
    // want, and the reason names the flag that would include it.
    if (definition.scope === 'machine' && !options.allowMachineWide) {
      skipped.push({
        id: definition.id,
        reason: `Affects every project on this machine. Pass --allow-machine-wide to include it.`,
      });
      continue;
    }

    const targets = await resolveTargetsAsync(definition, context, safety);
    // A deletion with nothing to delete is not a step, it is a fact about the project.
    if (definition.kind === 'delete' && !targets.length) {
      skipped.push({
        id: definition.id,
        reason: `Nothing to delete: ${describeTargets(definition, context)} ${
          definition.targets!(context).length > 1 ? 'do' : 'does'
        } not exist.`,
      });
      continue;
    }

    steps.push({
      id: definition.id,
      kind: definition.kind,
      targets,
      argv: definition.argv?.(context) ?? null,
      cwd: cwdFor(definition, context),
      scope: definition.scope,
      bytes: await totalBytesAsync(targets),
      reason: definition.reason,
      timeClass: definition.timeClass,
      recoverable: definition.recoverable,
    });
  }

  return {
    projectRoot,
    tier: options.tier,
    platforms: context.platforms,
    packageManager: { name: context.packageManager.name, lockfile: context.packageManagerLockfile },
    steps,
    skipped,
    safety,
  };
}

/** Everything the table asks about the machine and the project, read once. */
export interface ProbedFixContext extends FixStepContext {
  /** Absolute path of the lockfile that named the package manager, or null. */
  packageManagerLockfile: string | null;
}

/** Read the project and the machine into the shape the table expects. */
export function probeProject(
  projectRoot: string,
  requestedPlatforms: NativePlatform[] | null
): ProbedFixContext {
  const nativeDirs = {
    ios: directoryExistsSync(path.join(projectRoot, 'ios')),
    android: directoryExistsSync(path.join(projectRoot, 'android')),
  };
  const packageManager = detectPackageManager(projectRoot);

  return {
    projectRoot,
    tmpDir: os.tmpdir(),
    homeDir: os.homedir(),
    platform: process.platform,
    platforms: requestedPlatforms ?? defaultPlatforms(nativeDirs),
    nativeDirs,
    hasPodfile: fileExistsSync(path.join(projectRoot, 'ios', 'Podfile')),
    xcodeProjectNames: readXcodeProjectNames(projectRoot),
    hasWatchman: findExecutableOnPath('watchman') != null,
    packageManager: { name: packageManager.name, installCwd: packageManager.installCwd },
    packageManagerLockfile: packageManager.lockfile,
  };
}

/**
 * The platforms a run covers when the caller named none.
 *
 * The directories that are there, because those are the ones with build state to reset. A CNG
 * project has neither, and its one native step is `prebuild-clean`, which covers both.
 */
function defaultPlatforms(nativeDirs: { ios: boolean; android: boolean }): NativePlatform[] {
  const present = (['ios', 'android'] as const).filter((platform) => nativeDirs[platform]);
  return present.length ? [...present] : ['ios', 'android'];
}

/**
 * The Xcode project names in `ios/`, which is how a DerivedData directory is named.
 *
 * Read off disk rather than derived from the app config: the directory is `<scheme>-<hash>`, the
 * scheme comes from the generated Xcode project, and a name guessed from `app.json` would match a
 * directory belonging to somebody else's app.
 */
function readXcodeProjectNames(projectRoot: string): string[] {
  try {
    return fs
      .readdirSync(path.join(projectRoot, 'ios'), { withFileTypes: true })
      .filter((entry) => entry.name.endsWith('.xcodeproj'))
      .map((entry) => path.basename(entry.name, '.xcodeproj'));
  } catch {
    return [];
  }
}

/**
 * Refuse to delete inside a native directory the user has uncommitted tracked work in.
 *
 * Two reasons, and the second is the one that matters. A checkpoint holds only tracked files
 * (llp/0008), so a dirty native directory is the one place where this command's deletions and the
 * user's own unrecorded work sit next to each other — and `pod install` and `prebuild --clean`
 * both rewrite tracked files (`Podfile.lock`, the generated projects), which mixes machine output
 * into a diff the user can no longer separate from their own edits.
 *
 * @throws {CommandError} `DOCTOR_FIX_DIRTY_NATIVE`
 */
async function assertNativeIsCleanAsync(
  projectRoot: string,
  definitions: FixStepDefinition[],
  context: FixStepContext
): Promise<void> {
  const platforms = new Set<NativePlatform>();
  for (const definition of definitions) {
    if (definition.unavailable?.(context)) {
      continue;
    }
    for (const platform of definition.touchesNative?.(context) ?? []) {
      if (context.nativeDirs[platform]) {
        platforms.add(platform);
      }
    }
  }

  // No planned step deletes inside a native directory this project has, so there is nothing to
  // ask about — and asking anyway would let an answer about some *other* pathspec refuse a plan
  // whose subject would then be the empty string.
  if (!platforms.size) {
    return;
  }

  const dirty = await dirtyTrackedPathsAsync(projectRoot, [...platforms]);
  if (!dirty.length) {
    return;
  }

  // The directories git actually reported on, not the ones it was asked about: a run that asked
  // about both and got one back must not name the clean one as dirty.
  const named = [...platforms].filter((platform) =>
    dirty.some((file) => file === platform || file.startsWith(`${platform}/`))
  );
  const subject = (named.length ? named : [...platforms]).join(' and ');

  const error = new CommandError(
    'DOCTOR_FIX_DIRTY_NATIVE',
    [
      `Nothing was planned: ${subject} ${named.length === 1 ? 'has' : 'have'} uncommitted changes (${dirty.slice(0, 5).join(', ')}${dirty.length > 5 ? `, and ${dirty.length - 5} more` : ''}).`,
      `Why: this tier deletes inside those directories and reinstalls into them, and a checkpoint holds only tracked files that are already committed — so your uncommitted native work would be the one thing no snapshot could put back.`,
      `How: commit or stash the changes and run this again, or use "${PROGRAM_PREFIX} doctor:fix --tier safe", which never touches the native directories.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} doctor:fix --tier safe`;
  throw error;
}

/**
 * Expand a step's target specs into the absolute paths that exist, refusing any the predicate
 * rejects.
 *
 * @throws {CommandError} `DOCTOR_FIX_UNSAFE_PATH`
 */
async function resolveTargetsAsync(
  definition: FixStepDefinition,
  context: FixStepContext,
  safety: FixPlan['safety']
): Promise<string[]> {
  const found: string[] = [];
  for (const spec of definition.targets?.(context) ?? []) {
    for (const candidate of await expandAsync(spec)) {
      const rejection = rejectUnsafeTarget(candidate, { ...safety, scope: definition.scope });
      if (rejection) {
        throw unsafePathError(definition.id, rejection);
      }
      if (await existsAsync(candidate)) {
        found.push(candidate);
      }
    }
  }
  return found;
}

/** The paths one spec names on this machine, whether or not they exist. */
async function expandAsync(spec: TargetSpec): Promise<string[]> {
  if (spec.kind === 'path') {
    return [spec.path];
  }
  const entries = await fs.promises.readdir(spec.dir).catch(() => [] as string[]);
  return entries
    .filter((entry) => entry.startsWith(spec.prefix))
    .map((entry) => path.join(spec.dir, entry));
}

/** The error for a target the safety predicate refused. A bug or a hostile link, never a project. */
export function unsafePathError(stepId: string, rejection: string): CommandError {
  const error = new CommandError(
    'DOCTOR_FIX_UNSAFE_PATH',
    [
      `Nothing was deleted: the "${stepId}" step named a path this command refuses to touch.`,
      `Why: ${rejection}`,
      `How: this is either a bug in ${PROGRAM_NAME} or a link planted where a cache directory should be. Check the path by hand, then report it at https://github.com/expo/expo/issues.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} doctor:fix --tier safe`;
  return error;
}

async function existsAsync(target: string): Promise<boolean> {
  return (await fs.promises.lstat(target).catch(() => null)) != null;
}

/**
 * Bytes on disk under a set of targets, or null when it was not worth counting.
 *
 * A dry run has to be fast, and `node_modules` is a hundred thousand files. The walk stops at
 * {@link SIZE_WALK_LIMIT} entries and reports `null` rather than a number that is quietly a
 * fraction of the truth — "not measured" is an answer, "12 MB" for a 400 MB directory is not.
 */
export async function totalBytesAsync(targets: string[]): Promise<number | null> {
  let bytes = 0;
  let seen = 0;
  const queue = [...targets];

  while (queue.length) {
    const current = queue.pop()!;
    if (++seen > SIZE_WALK_LIMIT) {
      return null;
    }
    const stat = await fs.promises.lstat(current).catch(() => null);
    if (!stat) {
      continue;
    }
    if (stat.isDirectory()) {
      const entries = await fs.promises.readdir(current).catch(() => [] as string[]);
      for (const entry of entries) {
        queue.push(path.join(current, entry));
      }
    } else {
      bytes += stat.size;
    }
  }
  return bytes;
}

/** Where a step's subprocess runs, as the payload spells it: null means the project root. */
function cwdFor(definition: FixStepDefinition, context: FixStepContext): string | null {
  const cwd = definition.cwd?.(context);
  return cwd && cwd !== context.projectRoot ? cwd : null;
}

/** The paths a skipped deletion would have removed, for the sentence that says it found none. */
function describeTargets(definition: FixStepDefinition, context: FixStepContext): string {
  return (definition.targets?.(context) ?? [])
    .map((spec) => (spec.kind === 'path' ? spec.path : path.join(spec.dir, `${spec.prefix}*`)))
    .join(', ');
}
