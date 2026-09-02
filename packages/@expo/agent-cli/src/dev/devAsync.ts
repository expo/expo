// @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract
// What `@expo/agent-cli dev` does: probe the project, decide what must run, emit the plan, then (unless
// `--plan` stopped us, or a person declined it) run its steps as subprocesses. The plain
// `expo start` wrapper is `@expo/agent-cli start`, whose dev-server runner and follow-ups this reuses.

import { outputTail } from '../deploy/parseOutput';
import { EXIT_OUTCOME_FAILED } from '../exitCodes';
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
import { emitStartPlan } from '../plan/emit';
import { event as planEvent } from '../plan/events';
import { readLastBuildFingerprints, recordLastBuildFingerprint } from '../plan/lastBuild';
import { resolveStartPlanAsync } from '../plan/resolveAsync';
import type { NativePlatform, PlanPlatform } from '../plan/types';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { clearFingerprintMemo } from '../project/fingerprint';
import { clearFingerprintCache } from '../project/fingerprintCache';
import { probeProjectStateAsync } from '../project/probe';
import type { PlanStep, ProjectState, StartPlan } from '../project/types';
import { resolveStartFollowUpsAsync } from '../start/followUps';
import { runDevServerAsync, type DevServerRun } from '../start/startAsync';
import { localTool, EAS_REQUIREMENT, EAS_WHERE, LOCAL_WHERE } from '../toolchain/runsOn';
import { CommandError } from '../utils/errors';
import { runExpoAsync, spawnExpoAsync } from '../utils/expoCli';
import { isInteractive } from '../utils/interactive';
import type { SubprocessOutput } from '../utils/subprocess';
import {
  looksLikeWrapperCrash,
  wrapperCrashDetail,
  type WrapperCrashTool,
} from '../utils/wrapperCrash';
import { appReachedDevice } from './buildEvidence';
import { event as devEvent } from './events';
import { forwardedStepArgs, withForwardedExpoArgs } from './forwardedArgs';
import { hasPlanConsent } from './planConsent';
import {
  detectPortCollision,
  findFreePortAsync,
  formatPortMove,
  type PortCollision,
} from './portCollision';
import type { DevOptions } from './resolveOptions';

/** Where `expo start` listens when nothing names a port, for the free-port scan to start from. */
const DEFAULT_METRO_PORT = 8081;

/**
 * Probe the project, emit the plan, and run it.
 *
 * @returns 0 in `--plan` mode, otherwise the exit code of the first step that failed, or of the
 * last step when every step succeeded.
 */
export async function devAsync(projectRoot: string, options: DevOptions): Promise<number> {
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization — before the probe, because
  // the child does the probe: this run's whole job is to start that child and report on it.
  if (options.detach) {
    const { devDetachAsync } = require('./detachAsync') as typeof import('./detachAsync');
    return await devDetachAsync(projectRoot, options);
  }

  const state = await probeProjectStateAsync(projectRoot, {
    fingerprintCache: options.fingerprintCache,
  });
  // @ref llp/0015-backend-selection-and-config.rfc.md §The selection
  // One call that folds in everything outside the project: the developer's config, the flags they
  // typed, this host and the toolchain probe. The backend is chosen **here**, before the plan is
  // printed, so the steps an agent approves are the steps that run — never swapped mid-run
  // (llp/0008 §Plan-with-cost dry run).
  const resolved = await resolveStartPlanAsync(projectRoot, state, {
    platform: options.platform ?? resolveDefaultPlatform(state),
    // Only the flag the caller typed reaches `expo start`, and only that form opens the app on a
    // device. The default above says what to *build* for and never appears on a command line.
    requestedPlatform: options.platform,
    lastBuild: readLastBuildFingerprints(projectRoot),
    requestedBackend: options.buildBackend,
    requestedTarget: options.runTarget,
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §The plan approved is the plan run
  // Here, before anything is printed. The options a caller typed for `expo start` used to be folded
  // in while the step ran, so `--plan --tunnel` printed a command without `--tunnel` and the run
  // passed it [observed — friction run 7, F71; live staging, S5].
  const { plan, dropped } = withForwardedExpoArgs(resolved, options.expoArgs);
  if (dropped.length) {
    const last = plan.steps[plan.steps.length - 1]!;
    Log.warn(
      `The plan ends with "${last.argv.join(' ')}" instead of "expo start", so these options were not passed on: ${dropped.join(' ')}. Run "${PROGRAM_NAME} start ${dropped.join(' ')}" once the app is installed, or pass them to "npx ${last.argv.join(' ')}" yourself.`
    );
  }

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  // `--plan` stops here, so its follow-ups are about the plan itself and the plan object is the
  // whole answer.
  if (options.mode === 'plan') {
    const followups = followUpsEnabled(options.followups)
      ? // The typed flag, not the resolved platform: this is the plan the caller asked for, and the
        // command that runs it has to ask for the same one (F103).
        buildStartPlanFollowUps(plan, state, options.platform)
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

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
  // On stderr, and before the confirmation, because this is the one thing that decides whether the
  // plan below is worth starting: a build that cannot run here fails many minutes in, at a compiler
  // error about a toolchain, and the command that does work is `eas build`. Said out loud even in
  // `--json` mode, where the plan carrying the same fact is not printed until the run is over.
  warnUnbuildable(plan);

  // The follow-ups of a run are the *dev server's*, and in `--json` mode they are computed after
  // it so they can name the port it actually took. A terminal cannot wait for that: the bundler
  // takes the screen and anything printed afterwards scrolls away with its output.
  if (!options.json) {
    reportFollowUps('dev', await resolveRunFollowUpsAsync(projectRoot, plan, options, null), {});
  }

  // @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt — the plan was printed
  // above, so a run that stops here has already shown what it stopped short of. Stopping is not a
  // failure: nothing ran, and nothing is wrong, so the command exits 0.
  if (!hasPlanConsent(plan, options)) {
    return 0;
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
    const followups = await resolveRunFollowUpsAsync(projectRoot, plan, options, run.devServer);
    reportFollowUps('dev', followups, { json: true });
    Log.log(JSON.stringify({ ...plan, followups }, null, 2));
  }

  return run.exitCode;
}

/**
 * Warn, once, when the plan builds here and this machine cannot.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §The selection
 * This is now the *rare* case, and the change is the point of the whole feature: detection routes
 * a build it knows cannot happen here to the cloud while the plan is being made, so a local plan
 * on a machine with no toolchain is one somebody asked for by name. The warning says who asked, so
 * the reader knows which line to change.
 *
 * Only for `missing`: `unknown` has established nothing about the machine, and a warning about a
 * toolchain that is probably installed is noise on every run that follows.
 */
function warnUnbuildable(plan: StartPlan): void {
  const location = plan.buildLocation;
  if (location?.runsOn !== 'local' || location.status !== 'missing') {
    return;
  }
  const tool = localTool(location.platform);
  const asked =
    location.selection?.source === 'flag'
      ? ' --local asked for this build to run here.'
      : location.selection?.source === 'config'
        ? ` The ${PROGRAM_NAME} config asks for this build to run here.`
        : '';
  Log.warn(
    `This plan builds ${LOCAL_WHERE} and this machine does not have ${tool}: ${location.detail}${asked} The build step will fail once it reaches the compiler. To build for ${location.platform} without ${tool}, run "${location.alternativeCommand}", which builds ${EAS_WHERE} and needs ${EAS_REQUIREMENT}.`
  );
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
  /** The CLI arguments it actually ran with, which is what a reader has to reproduce. */
  args: string[];
  /** Whether this step is the one that starts the dev server. */
  devServerStep: boolean;
  /** What the step exited with, which is the `expo` CLI's own code. */
  exitCode: number;
  /**
   * Whether this failed step's build was recorded anyway, because its app reached a device.
   *
   * The one thing a reader of a failed `expo run:*` cannot see for themselves, and the one that
   * decides what the next command costs: fifteen minutes, or seconds (F121, `./buildEvidence.ts`).
   */
  buildRecorded: boolean;
  stdout: string;
  stderr: string;
  /**
   * The file that actually ran, when the step resolved one.
   *
   * Kept because it is the only fact that resolves a wrapper crash: the reader has to look at the
   * file under that name, not at the package they believe they installed (`wrapperCrash.ts`).
   * Null for a dev-server step, whose output nothing captures anyway.
   */
  binPath: string | null;
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
  // One retry per plan, whatever it is made of: a second collision means the port this CLI picked
  // was taken between the bind test and the dev server's own bind, and retrying forever on that
  // would be a loop nobody asked for.
  let retriedOnFreePort = false;

  for (const [index, step] of plan.steps.entries()) {
    let args = resolveStepArgs(step, options, index === plan.steps.length - 1);
    planEvent('start_plan_step', {
      id: step.id,
      argv: [step.argv[0]!, ...args],
      index: index + 1,
      total: plan.steps.length,
    });

    const devServerStep = isDevServerStep(step);
    const runStep = async (stepArgs: string[]) =>
      devServerStep
        ? await runDevServerAsync(projectRoot, stepArgs, {
            agentSkills: options.agentSkills,
            output,
          })
        : await runStepAsync(projectRoot, step, stepArgs, output);

    let result = await runStep(args);
    let portCollided = false;

    // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — the port carve-out. Checked
    // before the classifier below, because a busy port is the one stop in the Expo CLI's prompt
    // family that a machine can get past on its own.
    if (devServerStep && result.exitCode !== 0) {
      const collision = detectPortCollision(`${result.stderr}\n${result.stdout}`);
      if (collision) {
        portCollided = true;
        // A port the caller named is a requirement, not a preference: silently moving the dev
        // server somewhere else would leave every command the caller had already written — and
        // every URL it had already printed — pointing at nothing.
        if (options.port != null) {
          throw await portDemandedError(projectRoot, options.port);
        }
        // Once per plan. A second collision means the port this CLI picked was taken between the
        // bind test and the dev server's own bind, and retrying forever on that is a loop nobody
        // asked for — the step failure below reports it instead.
        if (!retriedOnFreePort) {
          retriedOnFreePort = true;
          const retry = await retryOnFreePortAsync(collision, args, runStep);
          if (retry) {
            args = retry.args;
            result = retry.result;
            portCollided =
              result.exitCode !== 0 &&
              detectPortCollision(`${result.stderr}\n${result.stdout}`) != null;
          }
        }
      }
    }

    if (devServerStep) {
      devServer = result as DevServerRun;
    }
    exitCode = result.exitCode;
    planEvent('start_plan_step_exit', { id: step.id, code: exitCode });

    if (exitCode !== 0) {
      // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
      // F121, and **before** the needs-human throw below rather than after it: `expo run:*` builds,
      // installs and launches in one subprocess, and a launch that failed is not a build that did.
      // A build whose app is on the device is a fact of its own, so it is recorded here, and the
      // step failure below is reported exactly as it was. The `macos-automation` recovery — "drop
      // --ios and run npx @expo/agent-cli dev --yes" — is a dev server now instead of the same fifteen
      // minutes over again, which is what made that handoff wrong rather than merely incomplete.
      const buildRecorded = recordBuildReachedDevice(projectRoot, step, state, result);
      const failure: StepFailure = {
        step,
        args,
        devServerStep,
        exitCode,
        buildRecorded,
        stdout: result.stdout,
        stderr: result.stderr,
        // A dev-server step answers with a `DevServerRun`, which resolved no binary of its own.
        binPath: 'binPath' in result ? (result.binPath ?? null) : null,
      };
      // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol, layer 3 — a step that
      // stopped because the Expo CLI needed an answer, or because macOS refused it a permission,
      // is not a failed command: it is a command waiting on a person. Nothing is captured in
      // `inherit` mode, so there is nothing to classify there.
      //
      // A port collision is excluded whatever its output looks like: it has already been retried
      // on a port this CLI picked, and there is no answer a person could give that the retry did
      // not already try. It falls through to the ordinary step failure below.
      if (!portCollided) {
        assertNotNeedsHuman(failure);
      }
      // Every later step depends on this one having worked, so the plan stops here.
      return { exitCode, devServer, failure };
    }

    recordBuildOf(projectRoot, step, state);
    // @ref llp/0023-fingerprint-caching.rfc.md §What invalidates an answer
    // After the step, not before: an install, a prebuild or a build has just changed the project,
    // and every fingerprint measured before it is a statement about the project as it was.
    //
    // **Both caches, not only the memo.** The pinned files are stamps of the project's own config
    // and lockfiles and say nothing about `ios/` or `android/`, so `expo prebuild` — which creates
    // them — moves nothing the record is keyed on. Its expiry would catch that eventually; dropping
    // the record here catches it now, for the one prebuild this CLI runs itself.
    clearFingerprintMemo(projectRoot);
    clearFingerprintCache(projectRoot);
  }

  return { exitCode, devServer, failure: null };
}

/** What one step run amounts to, for the retry that may replace it. */
type StepResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** The file that ran, when this step resolved one. @see StepFailure.binPath */
  binPath?: string | null;
};

/**
 * Start the dev server again on a port this CLI picked, after the Expo CLI stopped on a busy one.
 *
 * Only reached when the caller named no `--port`: they asked for "a dev server", and which port it
 * lands on is this command's to decide — which is exactly what the Expo CLI's own question is for,
 * and exactly what a run with no terminal cannot answer.
 *
 * @returns the second run and the arguments it used, or null when no free port could be found.
 */
async function retryOnFreePortAsync(
  collision: PortCollision,
  args: string[],
  runStep: (stepArgs: string[]) => Promise<StepResult>
): Promise<{ args: string[]; result: StepResult } | null> {
  // The CLI's own offer first: it walked to that port, so it is the one it would have taken.
  const scanFrom = collision.offeredPort ?? (collision.requestedPort ?? DEFAULT_METRO_PORT) + 1;
  const free = await findFreePortAsync(scanFrom);
  const busy = collision.requestedPort;

  devEvent('start_plan_port_retry', {
    busyPort: busy,
    offeredPort: collision.offeredPort,
    port: free,
  });

  if (free == null) {
    return null;
  }

  // On stderr even in `--json` mode, where stdout is the one object this run prints. Said out loud
  // because the dev server is not where the caller asked for it, and every URL it printed before
  // this line is stale.
  //
  // The first sentence comes from `formatPortMove` because a `--detach` parent reads it back out
  // of this child's log — that is the only channel between the two, and it is what puts
  // `portMoved` in the parent's report (llp/0004 §A busy port is not a step only a person can
  // complete; friction run 5, F48-4).
  Log.warn(
    `${formatPortMove({ from: busy, to: free })} ${
      busy == null
        ? 'Pass --port to name one yourself.'
        : `Pass --port ${busy} to require that port instead of moving, which fails when it is taken.`
    }`
  );

  const retryArgs = [...args, '--port', String(free)];
  return { args: retryArgs, result: await runStep(retryArgs) };
}

/**
 * The failure for a `--port` that was named and could not be had.
 *
 * An **outcome**, not a tool error and not a person: the command worked, and the thing it was asked
 * to do did not happen (llp/0010 §Exit codes). It never suggests the command that just failed —
 * running it again unchanged stops in the same place until the port is freed.
 */
async function portDemandedError(projectRoot: string, port: number): Promise<CommandError> {
  const { findPortListenerAsync } = require('./portListener') as typeof import('./portListener');
  const { readDevServerLockAsync } = require('../devLock') as typeof import('../devLock');
  const [listener, lock, free] = await Promise.all([
    findPortListenerAsync(port),
    readDevServerLockAsync(projectRoot),
    findFreePortAsync(port + 1),
  ]);

  // The most useful special case: the process on that port is this project's own dev server, so
  // there is nothing to start and nothing to fix.
  const ours = lock != null && lock.port === port;
  const holder = listener
    ? `pid ${listener.pid}${listener.command ? ` (${listener.command})` : ''}`
    : 'a process this machine would not name';

  const error = new CommandError(
    'PORT_IN_USE',
    [
      `Port ${port} is taken, so no dev server was started on it.`,
      ours
        ? `Why: this project's own dev server is already on port ${port}, held by ${holder}. Nothing was started, because there is already one there.`
        : `Why: ${holder} is listening on it, and --port ${port} is a requirement rather than a preference — moving the dev server to another port would leave every URL and every command that names ${port} pointing at nothing.`,
      ours
        ? `How: use the dev server that is running ("${PROGRAM_PREFIX} smoke" checks its bundle and its app), or stop it first with "${PROGRAM_PREFIX} dev:stop".`
        : `How: free the port with "${PROGRAM_PREFIX} dev:stop --port ${port} --force", which stops it only when it answers as an Expo dev server${listener ? ` and pid ${listener.pid} looks like one` : ''}${free == null ? '' : `, or start on a free port instead with "${PROGRAM_PREFIX} dev --yes --port ${free}"`}. Leaving --port out lets this command pick a free port on its own.`,
    ].join('\n')
  );
  // Never the command that just failed: it would stop in exactly the same place.
  error.suggestedCommand = ours
    ? `${PROGRAM_PREFIX} smoke`
    : free == null
      ? `${PROGRAM_PREFIX} dev:stop --port ${port} --force`
      : `${PROGRAM_PREFIX} dev --yes --port ${free}`;
  error.exitCode = EXIT_OUTCOME_FAILED;
  return error;
}

/** Run a plan step that is not a dev server, in the output mode this run is in. */
async function runStepAsync(
  projectRoot: string,
  step: PlanStep,
  args: string[],
  output: SubprocessOutput
): Promise<StepResult> {
  if (step.argv[0] === 'eas') {
    return await runEasStepAsync(projectRoot, args, output);
  }
  if (output === 'inherit') {
    // Nothing is captured, so there is nothing for the wrapper-crash guard to read either.
    const exitCode = await runExpoAsync(projectRoot, args);
    return { exitCode, stdout: '', stderr: '', binPath: null };
  }
  const { cli, result } = await spawnExpoAsync(projectRoot, args, { output });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    binPath: cli.command,
  };
}

/**
 * Run one `eas` step of a plan.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §Running an `eas` step
 * The EAS CLI is reached as a subprocess like every other member of the family (llp/0001
 * constraint 5), and it is resolved with the *throwing* resolver: a plan that chose the cloud
 * cannot do its job without it, so an unreachable CLI is an error rather than a step that quietly
 * does nothing. Since wave 18 that error is a last resort — the ladder's third rung runs the
 * published `eas-cli` through `npx`, so a machine that simply never installed it builds anyway, and
 * a cloud build is a step whose minutes make the first download's a rounding error. The output mode
 * is the plan's own — `inherit` is what makes the EAS CLI's own progress and its credential
 * questions reach the person watching.
 */
async function runEasStepAsync(
  projectRoot: string,
  args: string[],
  output: SubprocessOutput
): Promise<StepResult> {
  const { resolveEasCliOrThrow, easCliArgs } =
    require('../utils/easCli') as typeof import('../utils/easCli');
  const { spawnSubprocessAsync } =
    require('../utils/subprocess') as typeof import('../utils/subprocess');

  const easCli = resolveEasCliOrThrow(projectRoot);
  const result = await spawnSubprocessAsync(easCli.command, easCliArgs(easCli, args), {
    cwd: projectRoot,
    output,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    // The file, as this field promises, which on the runner rung is the runner. Nothing downstream
    // reads it except the wrapper-crash guard, and a wrapper crash is a claim about a binary
    // somebody installed under the name `eas` — never about `npx`, which reports its own failures.
    binPath: easCli.command,
  };
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
  const invocation = invocationOf(failure);
  const needsHuman = classifySubprocessFailure({
    // The registry is keyed by tool, and an `eas build` that stops for a login is a different
    // scenario from an `expo start` that stops for a prompt.
    tool: failure.step.argv[0] === 'eas' ? 'eas' : 'expo',
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
        `How: grant the permission in System Settings › Privacy & Security › Automation, then run this command again. To keep going without it, drop --ios and open the app the way that needs no Automation grant: "${PROGRAM_PREFIX} dev --yes" to start the dev server, then "${PROGRAM_PREFIX} navigate /", which deep-links through "xcrun simctl openurl".`,
        // @ref llp/0004 §Implemented in v1 — F121. The `How:` above is the
        // recovery that used to walk straight back into a fifteen-minute rebuild, because the build
        // this run finished was not recorded. It is now, and the reader is told so on the line that
        // sends them there.
        failure.buildRecorded
          ? `Note: the app it built is installed on the simulator already, so that build is recorded and "${PROGRAM_PREFIX} dev --yes" starts a dev server rather than building again.`
          : '',
        said ? `\nWhat the tool printed:\n${said}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  // A prompt is the one case where the *last* line is the answer: it is the question the CLI
  // stopped on, and nothing was printed after it.
  //
  // The port question is deliberately not among these any more: it is recognised before the
  // classifier runs and either retried on a free port or reported as an outcome
  // (`detectPortCollision`, `portDemandedError`). What is left here genuinely needs the person.
  //
  // **The code is the registry row's own, never one spelled here.** A plan runs steps of two CLIs
  // (llp/0015 §Running an `eas` step), and an `eas build` that stopped for a login is a different
  // scenario, with a different recovery, from an `expo start` that stopped for a prompt — which is
  // the whole reason the classifier is told which tool ran. Naming `EXPO_NEEDS_INPUT` here
  // flattened all four rows onto the Expo CLI's, so an agent branching on the code was told to
  // answer a question when what it had to do was sign in.
  const asked = lastNonEmptyLine(failure.stderr) ?? lastNonEmptyLine(failure.stdout);
  const cli = `${cliNameOf(failure.step)} CLI`;
  return {
    message: [
      `The plan stopped at "${failure.step.id}": "${invocation}" needed an answer and this run has no terminal to give one.`,
      `Why: the ${cli} asks before it does something it cannot decide, and a run with no terminal fails there instead of prompting. The question it asked is quoted below.`,
      `How: run the command above in a terminal once and answer it. If the answer is a value this CLI takes as a flag, pass that flag instead — "${PROGRAM_PREFIX} dev --help" lists them.`,
      asked ? `\nWhat it asked for:\n${asked}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/** The command a reader has to type to reproduce one step, exactly as it ran. */
function invocationOf(failure: StepFailure): string {
  return `npx ${failure.step.argv[0]} ${failure.args.join(' ')}`;
}

/** The CLI a step drives, as a reader would name it in a sentence. */
function cliNameOf(step: PlanStep): string {
  return step.argv[0] === 'eas' ? 'EAS' : 'Expo';
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
  const invocation = invocationOf(failure);
  // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the process on the other side of
  // the spawn is whatever this machine has under that name, and sometimes it is a wrapper, a shim
  // or a stale link. Quoting *its* bytes under "What the tool printed" tells the reader the Expo or
  // EAS CLI said them, and an agent then acts on a sentence no Expo tool wrote (`wrapperCrash.ts`).
  // The guard needs captured output, so it can only fire in `capture` mode — which is the mode a
  // driving agent runs in, and the only one where anything is quoted at all.
  const tool: WrapperCrashTool = failure.step.argv[0] === 'eas' ? 'eas' : 'expo';
  const wrapperCrash =
    output === 'capture' &&
    failure.binPath != null &&
    looksLikeWrapperCrash({
      tool,
      exitCode: failure.exitCode,
      stdout: failure.stdout,
      stderr: failure.stderr,
    });
  // In `tee` and `inherit` mode the tool's own output already reached the terminal, and repeating
  // it would bury the three lines that say what to do.
  const tail = output === 'capture' ? outputTail(`${failure.stdout}${failure.stderr}`, 12) : '';
  const error = new CommandError(
    'PLAN_STEP_FAILED',
    [
      `The plan stopped at "${failure.step.id}": "${invocation}" exited ${exitCode}.`,
      failure.devServerStep
        ? `Why: that step is the one that starts the dev server, and its process has exited, so no dev server is running for this project. The exit code above is the ${cliNameOf(failure.step)} CLI's own, not this command's.`
        : `Why: every later step of the plan depends on this one, so nothing after it ran. The exit code above is the ${cliNameOf(failure.step)} CLI's own, not this command's.`,
      // @ref llp/0004 §Implemented in v1 — said out loud because it is the
      // fact that decides what the next command costs, and nothing in the tool's own output says
      // it. Without this line the reader re-runs a step whose expensive half already worked.
      failure.buildRecorded
        ? `Note: the app it built is installed on the device, so that build is recorded — the next "${PROGRAM_PREFIX} dev" starts a dev server for it instead of building again.`
        : '',
      `How: run the command above yourself to see it fail with its whole output, or run "${PROGRAM_PREFIX} dev --plan" to see the steps this plan is made of.`,
      wrapperCrash
        ? wrapperCrashDetail({ tool, exitCode: failure.exitCode }, failure.binPath!)
        : tail
          ? `\nWhat the tool printed:\n${tail}`
          : '',
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
 *
 * The dev-server options a follow-up may quote are the **plan's last step**, never the caller's own
 * arguments. They are the same list for a plan that ends in `expo start`, and they differ for every
 * plan that does not: `--port` and `--tunnel` cannot be forwarded to `expo run:ios`, this command
 * already says so out loud, and reading the raw arguments made it print a development-build URL
 * naming the port it had just announced it was dropping — while the step was about to serve on 8081
 * [F120, observed — wave 29 live, 2026-08-27]. The plan is the argv that will run (llp/0015 §The
 * plan approved is the plan run), so it is the one thing a follow-up may read.
 */
async function resolveRunFollowUpsAsync(
  projectRoot: string,
  plan: StartPlan,
  options: DevOptions,
  devServer: DevServerRun | null
): Promise<FollowUp[]> {
  const planArgs = plan.steps.at(-1)?.argv.slice(1) ?? [];
  const port = devServer
    ? // After the run: what the dev server reported, and nothing when it reported nothing.
      devServer.port && devServer.port.source !== 'default'
      ? devServer.port.port
      : null
    : // Before it: the port the plan's own last step carries, or the one the Expo CLI defaults to.
      resolveDevServerPort(planArgs);

  return await resolveStartFollowUpsAsync(
    projectRoot,
    { ...options, expoArgs: planArgs },
    {
      expoGo: plan.target === 'expo-go',
      web: plan.target === 'web',
      port,
      // Whatever the plan's own probe established, and null when it planned no build and probed
      // nothing. The cloud-build rung reads it to say why the cloud is still worth choosing.
      localBuild: plan.buildLocation?.status ?? null,
    }
  );
}

/**
 * Turn one plan step into `expo` CLI arguments.
 *
 * The plan owns the arguments of every step. The user's own `expo start` options are appended
 * to the last step only when that step is `expo start`, because `expo prebuild` and
 * `expo run:*` accept a different set of options.
 */
function resolveStepArgs(step: PlanStep, options: DevOptions, isLast: boolean): string[] {
  assertRunnableStep(step);
  // Idempotent, and folded in a second time on purpose: the plan the run reads already carries the
  // forwarded options (`withForwardedExpoArgs`, above), and a flag the argv holds is never added
  // twice. What this call is still for is the assertion above and a step that was rebuilt since.
  return forwardedStepArgs(step, options.expoArgs, { isLast }).args;
}

/** Steps that start a dev server, and so get the skill sync of the `@expo/agent-cli start` wrapper. */
function isDevServerStep(step: PlanStep): boolean {
  if (step.argv[0] !== 'expo') {
    // `eas build` finishes with an artifact and starts nothing. The dev server of an EAS-backed
    // plan is the `expo start --dev-client` step that follows it.
    return false;
  }
  const command = step.argv[1];
  return command === 'start' || command === 'run:ios' || command === 'run:android';
}

/**
 * Record what a successful `expo run:*` built, so the next run can skip the build.
 *
 * The hash comes from the probe, meaning it describes the project as it was *before* prebuild
 * ran. That is the same hash the next probe computes for an unchanged project, which is what
 * makes the comparison in `decideStartPlan` work.
 *
 * The probe's `sources` go in with it, because a hash alone lets a later `@expo/agent-cli impact` say the
 * native surface changed and never what changed (llp/0011 §The record has to hold the sources).
 * They are already in hand: the probe computed them to get the hash.
 */
function recordBuildOf(projectRoot: string, step: PlanStep, state: ProjectState): void {
  const platform = resolveBuildPlatform(step);
  if (platform && state.fingerprint.hash) {
    recordLastBuildFingerprint(projectRoot, platform, {
      hash: state.fingerprint.hash,
      sources: state.fingerprint.sources ?? null,
    });
  }
}

/**
 * Record the build of a step that **failed**, when its own output shows the app reached a device.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
 * The other half of {@link recordBuildOf}, and the whole of F121. `expo run:*` is one subprocess
 * that builds, installs and launches, so its exit code is the *launch's* answer as often as the
 * compiler's — and a plan that rebuilds because the launch failed spends fifteen minutes to change
 * nothing. What is read is the install (`./buildEvidence.ts`), because the record is a claim about
 * the app on a device rather than about a binary in a build directory.
 *
 * @returns whether a build was recorded, which is what the failure report has to say out loud.
 */
function recordBuildReachedDevice(
  projectRoot: string,
  step: PlanStep,
  state: ProjectState,
  result: StepResult
): boolean {
  if (resolveBuildPlatform(step) == null) {
    return false;
  }
  if (!appReachedDevice(`${result.stdout}\n${result.stderr}`)) {
    return false;
  }
  recordBuildOf(projectRoot, step, state);
  // Only when something was written: a project with no fingerprint records nothing, and a report
  // that promised the next plan would skip the build would be promising the opposite of the truth.
  return state.fingerprint.hash != null;
}

function resolveBuildPlatform(step: PlanStep): NativePlatform | null {
  if (step.argv[0] !== 'expo') {
    // @ref llp/0015-backend-selection-and-config.rfc.md §What the EAS route is made of
    // Deliberately not `eas build`. The record answers "does the app **installed on a device**
    // match this project", and a cloud build ends in an artifact that nothing here has installed.
    // Recording it would mark the next plan fresh against a build no device is running.
    return null;
  }
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

/** The CLIs a plan step may invoke. Everything else is a step this version cannot run. */
const RUNNABLE_CLIS = ['expo', 'eas'];

/**
 * A plan step runs the `expo` CLI or the `eas` one. This guard turns a step for any other
 * (`expo-doctor`, `fingerprint`) into a clear error instead of a wrong invocation.
 */
function assertRunnableStep(step: PlanStep): void {
  if (!RUNNABLE_CLIS.includes(step.argv[0]!)) {
    throw new CommandError(
      'UNSUPPORTED_PLAN_STEP',
      `Cannot run the plan step "${step.id}": it invokes "${step.argv[0]}", and this version of ${PROGRAM_NAME} only runs the ${RUNNABLE_CLIS.map((cli) => `"${cli}"`).join(' and ')} CLIs. Update ${PROGRAM_NAME}, or run the step yourself with "npx ${step.argv.join(' ')}".`
    );
  }
}
