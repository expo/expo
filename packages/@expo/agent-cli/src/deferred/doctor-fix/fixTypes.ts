// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix
// The shape of a `doctor:fix` plan. Pure data — no I/O here.
//
// The step reuses `PlanStep`'s `{ id, reason, timeClass }` triple and its `TimeClass` verbatim
// (llp/0004, `src/project/types.ts`), because a driving agent already reads that shape from
// `@expo/agent-cli dev --plan` and a second spelling of "what will run and how long it costs" would make
// it read two. What it adds is what a reset has and a start plan does not: the paths a step
// deletes, the scope those paths belong to, and what comes back afterwards.

import type { FollowUp } from '../../followups/types';
import type { TimeClass } from '../../project/types';

/**
 * How much a run is allowed to destroy. Cumulative: `moderate` includes every `safe` step, and
 * `aggressive` includes both.
 */
export type FixTier = 'safe' | 'moderate' | 'aggressive';

/** Every tier, weakest first. The order is the containment order. */
export const FIX_TIERS: FixTier[] = ['safe', 'moderate', 'aggressive'];

/**
 * Who a target belongs to.
 *
 * `project` — this project alone is affected, whether or not the path is inside the project
 * directory. `$TMPDIR/metro-file-map-expo-<md5 of the project root>-…` lives in a shared temporary
 * directory and is still project-scoped, because the project root is *in its name*.
 *
 * `machine` — every project on this machine is affected. Those steps need `--allow-machine-wide`.
 */
export type FixScope = 'project' | 'machine';

/** What a step does. */
export type FixStepKind =
  /** Remove {@link FixStep.targets}. Nothing is put back by this command. */
  | 'delete'
  /** Remove {@link FixStep.targets}, then run {@link FixStep.argv} to put them back. */
  | 'delete-and-reinstall'
  /** Run {@link FixStep.argv}. Deletes nothing this command can name as a path. */
  | 'command';

/**
 * When a step runs, relative to the others.
 *
 * The ordering rules of llp/0017 §doctor:fix are derived from this and from {@link FixScope}, so a new step
 * declares what it *is* rather than where it goes in a hand-kept list.
 */
export type FixPhase =
  /** Removes state. Every one of these runs before any `install` step. */
  | 'clean'
  /** Puts state back, and reads whatever the `clean` steps already removed. */
  | 'install';

/** One step of a reset plan, as it appears in `--json`. */
export interface FixStep {
  /** Stable id, e.g. `metro-file-map`. The assertable half of the contract. */
  id: string;
  kind: FixStepKind;
  /** Absolute paths this step deletes. Empty for a `command` step. */
  targets: string[];
  /** The subprocess this step runs, or null when it only deletes. */
  argv: string[] | null;
  /**
   * Where {@link argv} runs, when that is not the project root — the directory holding the
   * lockfile of a monorepo, most often. Null means the project root.
   */
  cwd: string | null;
  scope: FixScope;
  /** Total size of {@link targets} on disk, or null when it was not measured. */
  bytes: number | null;
  /** Why a stale copy of this is worth removing, in one sentence. */
  reason: string;
  timeClass: TimeClass;
  /** What puts this back, so a reader knows what they are spending. */
  recoverable: string;
}

/** A step the tier asked for and this project does not have. */
export interface SkippedFixStep {
  id: string;
  /** Why it is not in the plan, naming the state that decided it. */
  reason: string;
}

/** What one step did when the plan was applied. */
export interface FixStepResult {
  id: string;
  status: 'done' | 'failed' | 'skipped';
  durationMs: number;
  /**
   * What happened, in one line. For a failure it is what the tool printed or what the filesystem
   * refused; for a skip it is why the run never reached this step.
   */
  detail: string;
}

/** The snapshot taken before an apply, and what it does *not* hold. */
export interface FixCheckpoint {
  /** Git object id of the snapshot commit, or null when none was made. */
  id: string | null;
  /** Tracked files it holds. */
  files: number;
  /**
   * The honest note. Checkpoints hold only git-tracked files (llp/0008), so the gitignored things
   * this command deletes — `node_modules`, `ios/Pods`, `.expo`, the Metro caches — are in no
   * checkpoint and `checkpoint:undo` will not bring them back.
   */
  note: string;
}

/** Which package manager reinstalls this project, and what said so. */
export interface FixPackageManager {
  /** `pnpm`, `npm`, `yarn` or `bun`. */
  name: string;
  /** Absolute path of the lockfile that named it, or null when none was found. */
  lockfile: string | null;
}

/** The whole answer of `doctor:fix`. */
export interface FixPlanPayload {
  projectRoot: string;
  tier: FixTier;
  /** Whether the steps ran. `false` is the default: `--apply` is what executes. */
  applied: boolean;
  /** Native platforms the plan covers, e.g. `["ios"]`. */
  platforms: string[];
  packageManager: FixPackageManager;
  steps: FixStep[];
  skipped: SkippedFixStep[];
  /** One entry per step on an apply, null on a dry run. */
  results: FixStepResult[] | null;
  /** The snapshot taken before an apply, null when none was. */
  checkpoint: FixCheckpoint | null;
  followups: FollowUp[];
}
