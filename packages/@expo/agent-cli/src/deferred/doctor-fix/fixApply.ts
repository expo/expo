// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — Ordering, derived rather than listed
// Run a plan that was already printed. One event per step, one result per step, and a stop at the
// first failure.
//
// The stop is the design, not a shortcut. The plan is ordered so that later steps read what earlier
// ones produced — `pod install` reads `node_modules`, `expo prebuild` reads the installed packages
// — so continuing past a failure runs a step against a project that is in a state nobody planned
// for, and reports whatever it does as if it meant something.

import fs from 'fs';
import path from 'path';

import { event } from '../../events';
import { spawnExpoAsync } from '../../utils/expoCli';
import { spawnSubprocessAsync } from '../../utils/subprocess';
import { unsafePathError, type FixPlan } from './fixPlan';
import { rejectUnsafeTarget } from './fixSafety';
import type { FixStep, FixStepResult } from './fixTypes';

export interface ApplyFixOptions {
  /** `capture` when the caller owns stdout (`--json`), `tee` when a person is reading along. */
  output: 'capture' | 'tee';
}

/**
 * Run every step of a plan, in order, until one fails.
 *
 * Never throws for a step that failed: that is the answer, and the caller reports it as exit
 * {@link EXIT_OUTCOME_FAILED}. The one thing it does throw for is a target that no longer passes
 * the safety predicate, because that is not a result — it is the plan having stopped describing
 * the machine.
 *
 * @throws {CommandError} `DOCTOR_FIX_UNSAFE_PATH`
 */
export async function applyFixAsync(
  plan: FixPlan,
  options: ApplyFixOptions
): Promise<FixStepResult[]> {
  const results: FixStepResult[] = [];
  let stopped = false;

  for (const step of plan.steps) {
    if (stopped) {
      results.push({
        id: step.id,
        status: 'skipped',
        durationMs: 0,
        detail: 'An earlier step failed, and the steps after it read what it was meant to produce.',
      });
      continue;
    }

    const startedAt = Date.now();
    const failure = await runStepAsync(plan, step, options);
    const result: FixStepResult = {
      id: step.id,
      status: failure ? 'failed' : 'done',
      durationMs: Date.now() - startedAt,
      detail: failure ?? describeDone(step),
    };
    results.push(result);
    event('doctor_fix_step', {
      id: step.id,
      kind: step.kind,
      scope: step.scope,
      status: result.status,
      targets: step.targets.length,
      durationMs: result.durationMs,
    });
    stopped = !!failure;
  }

  return results;
}

/** Run one step. @returns null when it worked, or one line saying what went wrong. */
async function runStepAsync(
  plan: FixPlan,
  step: FixStep,
  options: ApplyFixOptions
): Promise<string | null> {
  for (const target of step.targets) {
    // The second check. The plan was made a moment ago and the answer is almost always the same,
    // but "almost always" is not the standard for the last thing that happens before an `rm -rf`:
    // between the plan and here, a symlink can appear where a cache directory was.
    const rejection = rejectUnsafeTarget(target, { ...plan.safety, scope: step.scope });
    if (rejection) {
      throw unsafePathError(step.id, rejection);
    }
    try {
      await fs.promises.rm(target, { recursive: true, force: true });
    } catch (error: any) {
      return `Could not delete ${target}: ${error?.code ?? error?.message ?? 'unknown error'}`;
    }
  }

  if (!step.argv) {
    return null;
  }
  return runCommandAsync(plan, step, step.argv, options);
}

/** Run a step's subprocess. @returns null when it exited 0, or one line saying what it did. */
async function runCommandAsync(
  plan: FixPlan,
  step: FixStep,
  argv: string[],
  options: ApplyFixOptions
): Promise<string | null> {
  const cwd = step.cwd ?? plan.projectRoot;
  const printed = argv.join(' ');

  // `expo` is resolved through the project's own bin, like every other Expo CLI call here, so a
  // step never runs a different SDK's CLI than the project's (llp/0001 constraint 5).
  const result =
    argv[0] === 'expo'
      ? (await spawnExpoAsync(plan.projectRoot, argv.slice(1), { output: options.output })).result
      : await spawnSubprocessAsync(argv[0]!, argv.slice(1), {
          cwd,
          output: options.output,
          promptGuard: true,
        });

  if (result.spawnError) {
    return `Could not run "${printed}": ${result.spawnError.code ?? result.spawnError.message}. Is it installed and on PATH?`;
  }
  if (result.promptHang) {
    return `"${printed}" stopped on a question nothing can answer here: ${result.promptHang.trim()}`;
  }
  if (result.exitCode !== 0) {
    return `"${printed}" exited ${result.exitCode}${tail(result.stderr || result.stdout)}`;
  }
  return null;
}

/** What a step that worked did, in one line. */
function describeDone(step: FixStep): string {
  const deleted = step.targets.length
    ? `Deleted ${step.targets.map((target) => path.basename(target)).join(', ')}`
    : null;
  const ran = step.argv ? `ran "${step.argv.join(' ')}"` : null;
  return [deleted, ran].filter(Boolean).join(', ') || 'Nothing to do.';
}

/** The last line a failing tool printed, when it printed one. */
function tail(output: string): string {
  const line = output.trim().split('\n').filter(Boolean).at(-1);
  return line ? `: ${line.slice(0, 200)}` : '';
}
