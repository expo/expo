// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
// The plan-first half of `exagent start`: probe the project, decide what must run, emit the
// plan, then (unless `--plan` stopped us) run its steps as subprocesses.

import { checkpointBeforeAsync } from '../checkpoint/integration';
import {
  buildStartPlanFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import { Log } from '../log';
import { decideStartPlan } from '../plan/decide';
import { emitStartPlan } from '../plan/emit';
import { event } from '../plan/events';
import { readLastBuildFingerprints, recordLastBuildFingerprint } from '../plan/lastBuild';
import type { NativePlatform, PlanPlatform } from '../plan/types';
import { probeProjectStateAsync } from '../project/probe';
import type { PlanStep, ProjectState, StartPlan } from '../project/types';
import { CommandError } from '../utils/errors';
import { runExpoAsync } from '../utils/expoCli';
import { resolveStartFollowUps } from './followUps';
import { isPlatformFlag, type StartOptions } from './resolveOptions';
import { runDevServerAsync } from './startAsync';

/**
 * Probe the project, emit the plan, and run it.
 *
 * @returns 0 in `--plan` mode, otherwise the exit code of the first step that failed, or of the
 * last step when every step succeeded.
 */
export async function smartStartAsync(projectRoot: string, options: StartOptions): Promise<number> {
  const state = await probeProjectStateAsync(projectRoot);
  const plan = decideStartPlan(state, {
    platform: options.platform ?? resolveDefaultPlatform(state),
    lastBuild: readLastBuildFingerprints(projectRoot),
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  // `--plan` stops here, so its follow-ups are about the plan itself; `--smart` is about to run
  // it, so its follow-ups are the ones of a running dev server. Both are computed before the plan
  // is emitted, because `--json` carries them inside the plan object.
  const followups = resolveModeFollowUps(projectRoot, plan, state, options);

  // The plan is always emitted before anything runs, so `--plan` and `--smart` show the same
  // plan and a driving agent can approve one it has already seen.
  emitStartPlan(plan, {
    mode: options.mode === 'plan' ? 'plan' : 'smart',
    json: options.json,
    followups,
  });
  // Printed after the plan table and before the first step, so the terminal reads in the order
  // things happen and nothing lands in the middle of the dev server's own output.
  reportFollowUps('start', followups, { json: options.json });

  if (options.mode === 'plan') {
    return 0;
  }

  // @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints: only `expo prebuild` writes files git
  // tracks, by generating the native projects over whatever is there. Every other step of a plan
  // reads the project or writes into gitignored directories, so it needs no snapshot.
  if (plan.steps.some(isPrebuildStep)) {
    await checkpointBeforeAsync(projectRoot, {
      label: 'exagent start --smart',
      enabled: options.checkpoint,
      silent: options.json,
    });
  }

  return executePlanAsync(projectRoot, plan, state, options);
}

/** The follow-ups of the mode this run is in, or an empty list when they are suppressed. */
function resolveModeFollowUps(
  projectRoot: string,
  plan: StartPlan,
  state: ProjectState,
  options: StartOptions
): FollowUp[] {
  if (options.mode === 'plan') {
    return followUpsEnabled(options.followups) ? buildStartPlanFollowUps(plan, state) : [];
  }
  // The plan knows which app the dev server will be opened in, which the plain wrapper has to
  // read off the command line.
  return resolveStartFollowUps(projectRoot, options, {
    expoGo: plan.target === 'expo-go',
    web: plan.target === 'web',
  });
}

async function executePlanAsync(
  projectRoot: string,
  plan: StartPlan,
  state: ProjectState,
  options: StartOptions
): Promise<number> {
  let exitCode = 0;

  for (const [index, step] of plan.steps.entries()) {
    const args = resolveStepArgs(step, options, index === plan.steps.length - 1);
    event('start_plan_step', {
      id: step.id,
      argv: [step.argv[0]!, ...args],
      index: index + 1,
      total: plan.steps.length,
    });

    exitCode = isDevServerStep(step)
      ? await runDevServerAsync(projectRoot, args, { agentSkills: options.agentSkills })
      : await runExpoAsync(projectRoot, args);
    event('start_plan_step_exit', { id: step.id, code: exitCode });

    if (exitCode !== 0) {
      // Every later step depends on this one having worked, so the plan stops here.
      return exitCode;
    }

    recordBuildOf(projectRoot, step, state);
  }

  return exitCode;
}

/**
 * Turn one plan step into `expo` CLI arguments.
 *
 * The plan owns the arguments of every step. The user's own `expo start` options are appended
 * to the last step only when that step is `expo start`, because `expo prebuild` and
 * `expo run:*` accept a different set of options.
 */
function resolveStepArgs(step: PlanStep, options: StartOptions, isLast: boolean): string[] {
  assertExpoStep(step);
  const args = step.argv.slice(1);
  if (!isLast || !options.expoArgs.length) {
    return args;
  }

  if (step.argv[1] !== 'start') {
    // The platform flags were already acted on: they picked the platform this step builds for.
    const dropped = options.expoArgs.filter((arg) => !isPlatformFlag(arg));
    if (dropped.length) {
      Log.warn(
        `The plan ends with "${step.argv.join(' ')}" instead of "expo start", so these options were not passed on: ${dropped.join(' ')}. Run "exagent start ${dropped.join(' ')}" once the app is installed, or pass them to "npx ${step.argv.join(' ')}" yourself.`
      );
    }
    return args;
  }

  // The plan already sets the flags it needs (`--go`, `--dev-client`, `--web`), so a user who
  // passed the same flag does not get it twice.
  return [...args, ...options.expoArgs.filter((arg) => !args.includes(arg))];
}

/** Steps that generate the native projects, overwriting whatever is checked in. */
function isPrebuildStep(step: PlanStep): boolean {
  return step.argv[1] === 'prebuild';
}

/** Steps that start a dev server, and so get the skill sync of the plain `start` command. */
function isDevServerStep(step: PlanStep): boolean {
  const command = step.argv[1];
  return command === 'start' || command === 'run:ios' || command === 'run:android';
}

/**
 * Record what a successful `expo run:*` built, so the next run can skip the build.
 *
 * The hash comes from the probe, meaning it describes the project as it was *before* prebuild
 * ran. That is the same hash the next probe computes for an unchanged project, which is what
 * makes the comparison in `decideStartPlan` work.
 */
function recordBuildOf(projectRoot: string, step: PlanStep, state: ProjectState): void {
  const platform = resolveBuildPlatform(step);
  if (platform && state.fingerprint.hash) {
    recordLastBuildFingerprint(projectRoot, platform, state.fingerprint.hash);
  }
}

function resolveBuildPlatform(step: PlanStep): NativePlatform | null {
  if (step.argv[1] === 'run:ios') {
    return 'ios';
  }
  return step.argv[1] === 'run:android' ? 'android' : null;
}

/**
 * The platform to plan for when the command line names none.
 *
 * A single checked-in native directory is the project's own answer. Otherwise the host decides:
 * only macOS can build for iOS.
 */
function resolveDefaultPlatform(state: ProjectState): PlanPlatform {
  const { ios, android } = state.nativeDirs;
  if (ios !== android) {
    return ios ? 'ios' : 'android';
  }
  return process.platform === 'darwin' ? 'ios' : 'android';
}

/**
 * Every v1 step runs the `expo` CLI. This guard turns a future step for another CLI
 * (`eas-cli`, `expo-doctor`) into a clear error instead of a wrong `expo` invocation.
 */
function assertExpoStep(step: PlanStep): void {
  if (step.argv[0] !== 'expo') {
    throw new CommandError(
      'UNSUPPORTED_PLAN_STEP',
      `Cannot run the plan step "${step.id}": it invokes "${step.argv[0]}", and this version of exagent only runs the "expo" CLI. Update exagent, or run the step yourself with "npx ${step.argv.join(' ')}".`
    );
  }
}
