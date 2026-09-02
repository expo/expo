// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix
// The whole of one `doctor:fix` run: plan, print, ask, snapshot, apply, report.
//
// Dry run is the default and `--apply` is what executes, which is the opposite of `@expo/agent-cli dev`.
// The reason is one sentence: `dev` adds things and this deletes them, so the cheap mistake here
// is running a plan nobody read.
//
// @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt — what used to be
// `? Run this moderate reset?` is a stop that prints the command which runs it. This command is on
// the deferred shelf (llp/0017), so nothing here ships in v1; it follows the rule anyway, because
// the day it is un-deferred is the day a prompt would come back with it.

import chalk from 'chalk';

import { checkpointBeforeAsync } from '../../checkpoint/integration';
import { event } from '../../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../../exitCodes';
import { buildDoctorFixFollowUps, followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { PROGRAM_NAME } from '../../programName';
import { consentRerunCommand } from '../../utils/consent';
import { isInteractive } from '../../utils/interactive';
import { applyFixAsync } from './fixApply';
import { formatFixPlan } from './fixFormat';
import { planFixAsync } from './fixPlan';
import type { NativePlatform } from './fixSteps';
import type { FixCheckpoint, FixPlanPayload, FixTier } from './fixTypes';

export interface DoctorFixOptions {
  tier: FixTier;
  /** Whether the plan runs. False is the default. */
  apply: boolean;
  /** Native platforms the run covers, or null to read them off the project. */
  platforms: NativePlatform[] | null;
  allowMachineWide: boolean;
  /** Consent to a reset that deletes, given up front so nothing has to be asked. */
  yes: boolean;
  /** False when `--no-checkpoint` was passed. */
  checkpoint?: boolean;
  json: boolean;
  followups?: boolean;
}

/**
 * The honest note that goes with every checkpoint this command takes.
 *
 * A checkpoint holds only git-tracked files [observed — llp/0008 §Consent is a re-run, never a prompt], and every
 * headline target of this command is gitignored. Saying so is not a disclaimer: an agent that
 * reads "Checkpoint <id>" and infers a safety net will run the aggressive tier believing an undo
 * exists for `node_modules`, and it does not.
 */
export const CHECKPOINT_NOTE =
  'The checkpoint holds tracked files only. node_modules, ios/Pods, .expo and the Metro caches are gitignored, so "checkpoint:undo" cannot bring them back — the reinstall steps are what do.';

/**
 * Run one `doctor:fix`, on all three channels.
 *
 * @returns the exit code to leave with: 0 for a dry run and for an apply whose steps all worked,
 * and {@link EXIT_OUTCOME_FAILED} when an applied step failed. A step that failed is an outcome,
 * not a tool error — the command did exactly what it was asked and the *reset* is what did not
 * finish (llp/0010 §Exit codes).
 */
export async function printDoctorFixAsync(
  projectRoot: string,
  options: DoctorFixOptions
): Promise<number> {
  const plan = await planFixAsync(projectRoot, {
    tier: options.tier,
    platforms: options.platforms,
    allowMachineWide: options.allowMachineWide,
  });

  const payload: FixPlanPayload = {
    projectRoot: plan.projectRoot,
    tier: plan.tier,
    applied: false,
    platforms: plan.platforms,
    packageManager: plan.packageManager,
    steps: plan.steps,
    skipped: plan.skipped,
    results: null,
    checkpoint: null,
    followups: [],
  };

  // The plan is not applied when consent is missing, and the event says so rather than reporting
  // the intent it was built with.
  const stopped = options.apply && needsConsent(payload, options);

  event('doctor_fix_plan', {
    tier: plan.tier,
    applied: options.apply && !stopped,
    steps: plan.steps.map((step) => step.id),
    skipped: plan.skipped.map((skipped) => skipped.id),
    allowMachineWide: options.allowMachineWide,
    platforms: plan.platforms,
  });

  if (!options.apply) {
    return report(payload, options, EXIT_OK);
  }

  // The plan goes on screen first, so a reader has what they would be consenting to, and then the
  // run stops with the line that does it. `--json` and every non-interactive run never reach this.
  if (stopped) {
    const rerun = consentRerunCommand(['doctor:fix', '--apply', '--tier', plan.tier]);
    Log.log(formatFixPlan(payload));
    Log.log(
      chalk`Nothing ran: a ${plan.tier} reset deletes files, so it runs only when the command says so.\nRun it: {bold ${rerun}}`
    );
    return EXIT_OK;
  }

  payload.checkpoint = await takeCheckpointAsync(projectRoot, options);
  payload.results = await applyFixAsync(plan, { output: options.json ? 'capture' : 'tee' });
  payload.applied = true;

  const failed = payload.results.some((result) => result.status === 'failed');
  return report(payload, options, failed ? EXIT_OUTCOME_FAILED : EXIT_OK);
}

/**
 * Whether this run stops short of deleting anything and asks to be run again with `--yes`.
 *
 * The safe tier never stops: everything in it is regenerated by the next command, which is the
 * definition of the tier. `--json` counts as machine use, like a non-interactive stream — its
 * caller parses stdout and has already said it wants the work done.
 */
export function needsConsent(payload: FixPlanPayload, options: DoctorFixOptions): boolean {
  if (options.yes || options.json || !isInteractive() || !payload.steps.length) {
    return false;
  }
  return options.tier !== 'safe';
}

/**
 * Snapshot the tracked files before an apply, at moderate and above.
 *
 * It protects one real thing — a bare project's tracked `ios/` and `android/`, and a tracked
 * `Podfile.lock` that `pod install` is about to rewrite — and {@link CHECKPOINT_NOTE} says what it
 * does not protect. The safe tier deletes nothing tracked, so it takes none.
 */
async function takeCheckpointAsync(
  projectRoot: string,
  options: DoctorFixOptions
): Promise<FixCheckpoint | null> {
  if (options.tier === 'safe') {
    return null;
  }
  const result = await checkpointBeforeAsync(projectRoot, {
    label: `${PROGRAM_NAME} doctor:fix --tier ${options.tier}`,
    enabled: options.checkpoint,
    silent: options.json,
  });
  return { id: result.record?.id ?? null, files: result.files, note: CHECKPOINT_NOTE };
}

/** Print the payload on the channel the caller asked for, attach the follow-ups, and hand back the code. */
function report(payload: FixPlanPayload, options: DoctorFixOptions, exitCode: number): number {
  payload.followups = followUpsEnabled(options.followups) ? buildDoctorFixFollowUps(payload) : [];

  if (options.json) {
    Log.log(JSON.stringify(payload, null, 2));
  } else {
    Log.log(formatFixPlan(payload));
  }

  reportFollowUps('doctor:fix', payload.followups, { json: options.json });
  return exitCode;
}
