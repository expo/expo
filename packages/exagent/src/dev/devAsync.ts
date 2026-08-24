// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
// What `exagent dev` does: probe the project, decide what must run, emit the plan, then (unless
// `--plan` stopped us, or a person declined it) run its steps as subprocesses. The plain
// `expo start` wrapper is `exagent start`, whose dev-server runner and follow-ups this reuses.

import { checkpointBeforeAsync } from '../checkpoint/integration';
import { outputTail } from '../deploy/parseOutput';
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
    // Only the flag the caller typed reaches `expo start`, and only that form opens the app on a
    // device. The default above says what to *build* for and never appears on a command line.
    requestedPlatform: options.platform,
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

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
  // A plan whose step failed has no result to report, so it reports a failure. It used to print
  // the plan object with its success-shaped follow-ups and leave only the exit code disagreeing —
  // and when the code was the Expo CLI's own `7`, an agent read a started dev server on stdout,
  // nothing on stderr, and "a person must finish this" from the exit code
  // [observed — friction run 2, 2026-08-23: `dev --yes --json --ios`].
  if (run.exitCode !== 0 && run.failure) {
    throw planStepFailedError(run.failure, stepOutputFor(options), run.exitCode);
  }

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

/** The step that ended a plan, and everything known about how it ended. */
interface StepFailure {
  step: PlanStep;
  /** The `expo` arguments it actually ran with, which is what a reader has to reproduce. */
  args: string[];
  /** Whether this step is the one that starts the dev server. */
  devServerStep: boolean;
  /** What the step exited with, which is the `expo` CLI's own code. */
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** What one execution of a plan amounts to. */
interface PlanRun {
  exitCode: number;
  /** The dev server the run started, or null when it started none. */
  devServer: DevServerRun | null;
  /** The step that stopped the plan, or null when every step succeeded. */
  failure: StepFailure | null;
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

    const devServerStep = isDevServerStep(step);
    const result = devServerStep
      ? await runDevServerAsync(projectRoot, args, { agentSkills: options.agentSkills, output })
      : await runStepAsync(projectRoot, args, output);
    if (devServerStep) {
      devServer = result as DevServerRun;
    }
    exitCode = result.exitCode;
    event('start_plan_step_exit', { id: step.id, code: exitCode });

    if (exitCode !== 0) {
      const failure: StepFailure = {
        step,
        args,
        devServerStep,
        exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      };
      // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 3 — a step that
      // stopped because the Expo CLI needed an answer, or because macOS refused it a permission,
      // is not a failed command: it is a command waiting on a person. Nothing is captured in
      // `inherit` mode, so there is nothing to classify there.
      assertNotNeedsHuman(failure);
      // Every later step depends on this one having worked, so the plan stops here.
      return { exitCode, devServer, failure };
    }

    recordBuildOf(projectRoot, step, state);
  }

  return { exitCode, devServer, failure: null };
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
 * Turn a step the registry recognises into the handoff it is.
 *
 * Two scenarios reach this today, and they need different prose. A prompt — `Input is required,
 * but 'npx expo' is in non-interactive mode.` — is the definition of exit 7: no re-run of the same
 * command gets past it, because what it is waiting for is an answer. A macOS Automation refusal is
 * the same shape for a different reason: the permission is granted by a person clicking a switch,
 * and until then `expo start --ios` cannot finish. Anything else the classifier recognises keeps
 * the registry row's own code and a message that names the step and quotes what the tool printed.
 *
 * @throws {NeedsHumanError} when the registry recognises what stopped the step.
 */
function assertNotNeedsHuman(failure: StepFailure): void {
  const invocation = `npx expo ${failure.args.join(' ')}`;
  const needsHuman = classifySubprocessFailure({
    tool: 'expo',
    invocation,
    exitCode: failure.exitCode,
    stdout: failure.stdout,
    stderr: failure.stderr,
  });
  if (!needsHuman) {
    return;
  }

  throw needsHumanErrorFrom(needsHuman, stopPromptFor(needsHuman.scenario, failure, invocation));
}

/** The what / why / how of one recognised stop, per scenario. */
function stopPromptFor(
  scenario: string,
  failure: StepFailure,
  invocation: string
): { message: string; code?: string } {
  if (scenario === 'macos-automation') {
    // The *first* line of the crash, not the last: an unhandled rejection ends with Node's own
    // version footer, and quoting that under "What the tool printed" says nothing at all.
    const said = firstLineMatching(failure, /osascript|Apple events|\(-1743\)/i);
    return {
      message: [
        `The plan stopped at "${failure.step.id}": macOS refused "${invocation}" permission to control Simulator.app.`,
        `Why: --ios makes the Expo CLI drive Simulator.app through AppleScript, and macOS refuses an application that has not been granted Automation permission. The Expo CLI does not catch that rejection, so it ends the whole "expo start" process${failure.devServerStep ? ' — the dev server this run started exited with it, and nothing is listening for this project now' : ''}.`,
        `How: grant the permission in System Settings › Privacy & Security › Automation, then run this command again. To keep going without it, drop --ios and open the app the way that needs no Automation grant: "npx exagent dev --yes" to start the dev server, then "npx exagent navigate /", which deep-links through "xcrun simctl openurl".`,
        said ? `\nWhat the tool printed:\n${said}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  // A prompt is the one case where the *last* line is the answer: it is the question the CLI
  // stopped on, and nothing was printed after it.
  const asked = lastNonEmptyLine(failure.stderr) ?? lastNonEmptyLine(failure.stdout);
  return {
    code: 'EXPO_NEEDS_INPUT',
    message: [
      `The plan stopped at "${failure.step.id}": "${invocation}" needed an answer and this run has no terminal to give one.`,
      `Why: the Expo CLI asks before it does something it cannot decide — most often "port 8081 is busy, use another one?" — and a run with no terminal fails there instead of prompting.`,
      `How: for the port question, name the port yourself with "npx exagent dev --port 8082", which is answered before the CLI has to ask. Otherwise run the command above in a terminal once, and answer it.`,
      asked ? `\nWhat it asked for:\n${asked}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/** The first line of a captured failure that says something about the cause, or null for none. */
function firstLineMatching(failure: StepFailure, pattern: RegExp): string | null {
  return (
    `${failure.stderr}\n${failure.stdout}`
      .split('\n')
      .map((line) => line.trim())
      .find((line) => pattern.test(line)) ?? null
  );
}

/**
 * A step that failed and that nothing recognised.
 *
 * The plan object is not an answer here: it describes what the run *meant* to do, and printing it
 * with its follow-ups after a step failed told a driving agent that a dev server was up when none
 * was [observed — friction run 2, 2026-08-23]. The **forwarded exit code is kept**, per llp/0010
 * §Exit codes: inventing one would hide the code the tool actually reported. Only the payload
 * changes — from a success-shaped plan to the error envelope every other `--json` failure prints.
 */
function planStepFailedError(
  failure: StepFailure,
  output: SubprocessOutput,
  exitCode: number
): CommandError {
  const invocation = `npx expo ${failure.args.join(' ')}`;
  // In `tee` and `inherit` mode the tool's own output already reached the terminal, and repeating
  // it would bury the three lines that say what to do.
  const tail = output === 'capture' ? outputTail(`${failure.stdout}${failure.stderr}`, 12) : '';
  const error = new CommandError(
    'PLAN_STEP_FAILED',
    [
      `The plan stopped at "${failure.step.id}": "${invocation}" exited ${exitCode}.`,
      failure.devServerStep
        ? `Why: that step is the one that starts the dev server, and its process has exited, so no dev server is running for this project. The exit code above is the Expo CLI's own, not this command's.`
        : `Why: every later step of the plan depends on this one, so nothing after it ran. The exit code above is the Expo CLI's own, not this command's.`,
      `How: run the command above yourself to see it fail with its whole output, or run "npx exagent dev --plan" to see the steps this plan is made of.`,
      tail ? `\nWhat the tool printed:\n${tail}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
  error.suggestedCommand = invocation;
  error.exitCode = exitCode;
  return error;
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
