// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
// What `exagent dev` does: probe the project, decide what must run, emit the plan, then (unless
// `--plan` stopped us, or a person declined it) run its steps as subprocesses. The plain
// `expo start` wrapper is `exagent start`, whose dev-server runner and follow-ups this reuses.

import { checkpointBeforeAsync } from '../checkpoint/integration';
import {
  buildStartPlanFollowUps,
  followUpsEnabled,
  reportFollowUps,
  resolveDevServerPort,
  type FollowUp,
} from '../followups';
import { Log } from '../log';
import { classifySubprocessFailure, lastNonEmptyLine } from '../needsHuman/detect';
import { needsHumanErrorFrom } from '../needsHuman/error';
import { decideStartPlan } from '../plan/decide';
import { emitStartPlan } from '../plan/emit';
import { event } from '../plan/events';
import { readLastBuildFingerprints, recordLastBuildFingerprint } from '../plan/lastBuild';
import { isPlatformFlag } from '../plan/platformFlags';
import type { NativePlatform, PlanPlatform } from '../plan/types';
import { probeProjectStateAsync } from '../project/probe';
import type { PlanStep, ProjectState, StartPlan } from '../project/types';
import { resolveStartFollowUps } from '../start/followUps';
import { runDevServerAsync, type DevServerRun } from '../start/startAsync';
import { CommandError } from '../utils/errors';
import { runExpoAsync, spawnExpoAsync } from '../utils/expoCli';
import { isInteractive } from '../utils/interactive';
import type { SubprocessOutput } from '../utils/subprocess';
import { confirmPlanAsync } from './confirmPlan';
import type { DevOptions } from './resolveOptions';

/**
 * Probe the project, emit the plan, and run it.
 *
 * @returns 0 in `--plan` mode, otherwise the exit code of the first step that failed, or of the
 * last step when every step succeeded.
 */
export async function devAsync(projectRoot: string, options: DevOptions): Promise<number> {
  const state = await probeProjectStateAsync(projectRoot);
  const plan = decideStartPlan(state, {
    platform: options.platform ?? resolveDefaultPlatform(state),
    lastBuild: readLastBuildFingerprints(projectRoot),
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  // `--plan` stops here, so its follow-ups are about the plan itself and the plan object is the
  // whole answer.
  if (options.mode === 'plan') {
    const followups = followUpsEnabled(options.followups)
      ? buildStartPlanFollowUps(plan, state)
      : [];
    emitStartPlan(plan, { mode: 'plan', json: options.json, followups });
    reportFollowUps('dev', followups, { json: options.json });
    return 0;
  }

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
  // The plan is always emitted before anything runs — on the `cli:start_plan` event for a driving
  // agent, and as a table for a person. In `--json` mode it is *not* printed here: stdout is
  // reserved for the one object this run prints when it ends, which is either the plan with its
  // follow-ups or the error envelope. Printing the plan first and then running a dev server that
  // appends its log to the same stream is what made this command's output unparseable.
  emitStartPlan(plan, {
    mode: 'smart',
    print: options.json ? 'none' : 'text',
    followups: [],
  });

  // The follow-ups of a run are the *dev server's*, and in `--json` mode they are computed after
  // it so they can name the port it actually took. A terminal cannot wait for that: the bundler
  // takes the screen and anything printed afterwards scrolls away with its output.
  if (!options.json) {
    reportFollowUps('dev', resolveRunFollowUps(projectRoot, plan, options, null), {});
  }

  // @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run — the plan was printed above, so the
  // person answering has seen what they are approving. Declining is not a failure: nothing ran,
  // and nothing is wrong, so the command exits 0.
  if (!(await confirmPlanAsync(plan, options))) {
    return 0;
  }

  // @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints: only `expo prebuild` writes files git
  // tracks, by generating the native projects over whatever is there. Every other step of a plan
  // reads the project or writes into gitignored directories, so it needs no snapshot.
  if (plan.steps.some(isPrebuildStep)) {
    await checkpointBeforeAsync(projectRoot, {
      label: 'exagent dev',
      enabled: options.checkpoint,
      silent: options.json,
    });
  }

  const run = await executePlanAsync(projectRoot, plan, state, options);

  if (options.json) {
    // One object, when the run is over and there is something true to say about it.
    const followups = resolveRunFollowUps(projectRoot, plan, options, run.devServer);
    reportFollowUps('dev', followups, { json: true });
    Log.log(JSON.stringify({ ...plan, followups }, null, 2));
  }

  return run.exitCode;
}

/**
 * Where the output of the plan's subprocesses goes.
 *
 * `--json` owns stdout, so nothing a subprocess prints may reach it. A run with no terminal keeps
 * the output *and* prints it, because a step that stopped on a question the Expo CLI asked says so
 * on a stream that would otherwise go nowhere. A person watching gets the tools' own stdio, which
 * is what makes the bundler's keypress menu and its signals work.
 */
function stepOutputFor(options: DevOptions): SubprocessOutput {
  if (options.json) {
    return 'capture';
  }
  return isInteractive() ? 'inherit' : 'tee';
}

/** What one execution of a plan amounts to. */
interface PlanRun {
  exitCode: number;
  /** The dev server the run started, or null when it started none. */
  devServer: DevServerRun | null;
}

async function executePlanAsync(
  projectRoot: string,
  plan: StartPlan,
  state: ProjectState,
  options: DevOptions
): Promise<PlanRun> {
  const output = stepOutputFor(options);
  let devServer: DevServerRun | null = null;
  let exitCode = 0;

  for (const [index, step] of plan.steps.entries()) {
    const args = resolveStepArgs(step, options, index === plan.steps.length - 1);
    event('start_plan_step', {
      id: step.id,
      argv: [step.argv[0]!, ...args],
      index: index + 1,
      total: plan.steps.length,
    });

    const result = isDevServerStep(step)
      ? await runDevServerAsync(projectRoot, args, { agentSkills: options.agentSkills, output })
      : await runStepAsync(projectRoot, args, output);
    if (isDevServerStep(step)) {
      devServer = result as DevServerRun;
    }
    exitCode = result.exitCode;
    event('start_plan_step_exit', { id: step.id, code: exitCode });

    if (exitCode !== 0) {
      // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 3 — a step that
      // stopped because the Expo CLI needed an answer is not a failed command, it is a command
      // waiting on a person. Nothing is captured in `inherit` mode, so there is nothing to
      // classify there and the exit code is forwarded as it always was.
      assertNotNeedsHuman(step, args, result);
      // Every later step depends on this one having worked, so the plan stops here.
      return { exitCode, devServer };
    }

    recordBuildOf(projectRoot, step, state);
  }

  return { exitCode, devServer };
}

/** Run a plan step that is not a dev server, in the output mode this run is in. */
async function runStepAsync(
  projectRoot: string,
  args: string[],
  output: SubprocessOutput
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (output === 'inherit') {
    return { exitCode: await runExpoAsync(projectRoot, args), stdout: '', stderr: '' };
  }
  const { result } = await spawnExpoAsync(projectRoot, args, { output });
  return { exitCode: result.exitCode ?? 1, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Turn a step that stopped on a prompt into the handoff it is.
 *
 * `Input is required, but 'npx expo' is in non-interactive mode.` is the definition of exit 7: no
 * re-run of the same command gets past it, because what it is waiting for is an answer. The
 * classifier's generic `expo-prompt` row names the command that stopped, and the message quotes
 * what the CLI actually asked so the reader can see the question.
 *
 * @throws {NeedsHumanError} when the registry recognises what stopped the step.
 */
function assertNotNeedsHuman(
  step: PlanStep,
  args: string[],
  result: { exitCode: number; stdout: string; stderr: string }
): void {
  const invocation = `npx expo ${args.join(' ')}`;
  const needsHuman = classifySubprocessFailure({ tool: 'expo', invocation, ...result });
  if (!needsHuman) {
    return;
  }

  const asked = lastNonEmptyLine(result.stderr) ?? lastNonEmptyLine(result.stdout);
  throw needsHumanErrorFrom(needsHuman, {
    code: 'EXPO_NEEDS_INPUT',
    message: [
      `The plan stopped at "${step.id}": "${invocation}" needed an answer and this run has no terminal to give one.`,
      `Why: the Expo CLI asks before it does something it cannot decide — most often "port 8081 is busy, use another one?" — and a run with no terminal fails there instead of prompting.`,
      `How: for the port question, name the port yourself with "npx exagent dev --port 8082", which is answered before the CLI has to ask. Otherwise run the command above in a terminal once, and answer it.`,
      asked ? `\nWhat it asked for:\n${asked}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  });
}

/**
 * The follow-ups of a run, which are the dev server's.
 *
 * `devServer` is what the run learned about the server it started, and null before it has started
 * one. The port is only claimed when something reported it: `source: 'default'` means neither the
 * dev server nor the command line named one, and a URL built on that assumption is how this
 * command came to tell an agent to open a *different project's* app
 * [observed — friction run, 2026-08-23].
 */
function resolveRunFollowUps(
  projectRoot: string,
  plan: StartPlan,
  options: DevOptions,
  devServer: DevServerRun | null
): FollowUp[] {
  const port = devServer
    ? // After the run: what the dev server reported, and nothing when it reported nothing.
      devServer.port && devServer.port.source !== 'default'
      ? devServer.port.port
      : null
    : // Before it: the flag, or the port `expo start` uses when none is named.
      resolveDevServerPort(options.expoArgs);

  return resolveStartFollowUps(projectRoot, options, {
    expoGo: plan.target === 'expo-go',
    web: plan.target === 'web',
    port,
  });
}

/**
 * Turn one plan step into `expo` CLI arguments.
 *
 * The plan owns the arguments of every step. The user's own `expo start` options are appended
 * to the last step only when that step is `expo start`, because `expo prebuild` and
 * `expo run:*` accept a different set of options.
 */
function resolveStepArgs(step: PlanStep, options: DevOptions, isLast: boolean): string[] {
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

/** Steps that start a dev server, and so get the skill sync of the `exagent start` wrapper. */
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
