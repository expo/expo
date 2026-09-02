// @ref llp/0005-runtime-loop-tools.rfc.md
// The runtime loop: connect to the app through the dev server, evaluate an expression or listen
// for errors, and print the answer. This is the step that turns "I think the fix works" into
// "I read the value out of the running app".

import type { DevServerLogEntry } from '../dev/logErrors';
import { event } from '../events';
import { EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import { buildRuntimeErrorsFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import {
  CdpClient,
  CdpPromisePendingError,
  isMethodNotFoundError,
  type CdpEvaluateResult,
} from './cdpClient';
import { APP_RECONNECT_GRACE_MS } from './devServer';
import {
  evaluateResultToJson,
  formatEvaluateResult,
  formatRuntimeErrors,
  runtimeErrorsToJson,
  NO_DEV_SERVER_LOG,
  type RuntimeErrorsLogJson,
} from './format';
import { preflightRuntimeAsync, type RuntimeContext } from './preflight';
import type { RuntimeEvalOptions, RuntimeErrorsOptions } from './resolveOptions';
import { CdpRuntimeErrorCollector, type RuntimeErrorRecord } from './runtimeErrorCollector';
import {
  formatStackFrames,
  isUnmappedFrame,
  relativizeFrame,
  symbolicateFramesAsync,
} from './symbolicate';
import { EMPTY_DEVICE_INDEX, scopeTargets } from './targetPlatform';

// The family's shared type, re-exported from where it was first defined so that the commands and
// the modules that call them keep importing it from one place (`./preflight` owns it now, because
// the preflight is what reads it).
export type { RuntimeContext };

/**
 * Evaluate an expression in the running app and print the value it returned.
 *
 * @returns the exit code: `1` when the expression threw inside the app, so a script can branch
 * on the outcome without parsing the output.
 */
export async function runtimeEvalAsync(
  options: RuntimeEvalOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { expression, timeoutMs, awaitPromise, json } = options;
  // One preflight, one read of the target list (`./preflight`): the dev server, the app and the
  // platform index come back together, so the platform this command was told about is the platform
  // of the app it reads and the two steps cannot disagree about which app that is (F51).
  const { devServerUrl, deviceIndex } = await preflightRuntimeAsync(
    { need: 'debugger-target', devServerUrl: options.devServerUrl, platform: options.platform },
    context
  );

  let result: CdpEvaluateResult;
  try {
    result = await new CdpClient({
      metroUrl: devServerUrl,
      platform: options.platform,
      deviceIndex,
    }).evaluateAsync(expression, {
      awaitPromise,
      timeoutMs,
    });
  } catch (error: unknown) {
    if (isMethodNotFoundError(error)) {
      throw evaluateUnsupportedError(devServerUrl);
    }
    if (error instanceof CdpPromisePendingError) {
      throw promisePendingError(devServerUrl, expression, timeoutMs, error);
    }
    throw new CommandError(
      'RUNTIME_EVALUATE_FAILED',
      [
        `Could not evaluate the expression in the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again. Raise --timeout when the app is busy.`,
      ].join('\n')
    );
  }

  event('runtime_eval', {
    devServerUrl,
    threw: !!result.exceptionText,
    type: result.type ?? 'undefined',
    promise: result.promise?.state ?? null,
  });

  if (json) {
    Log.log(JSON.stringify(evaluateResultToJson(devServerUrl, expression, result), null, 2));
  } else {
    Log.log(formatEvaluateResult(devServerUrl, result));
  }

  // A rejected promise is the asynchronous form of a throw, so it exits the same way: an agent
  // gating on `runtime:eval` must not read a failed `fetch` as a pass. The two are still told apart
  // in the report itself — `threw` for one, `promise.state` for the other.
  return result.exceptionText || result.promise?.state === 'rejected' ? 1 : 0;
}

/**
 * A promise the expression returned outlived the wait.
 *
 * Its own error rather than a report, because the command was asked for a settled value and has
 * none: reporting "pending" with exit 0 would let a caller act on a value that never arrived.
 * `--no-await-promise` is the way to ask for the pending answer on purpose, and it exits 0.
 */
function promisePendingError(
  devServerUrl: string,
  expression: string,
  timeoutMs: number,
  cause: CdpPromisePendingError
): CommandError {
  const error = new CommandError(
    'RUNTIME_PROMISE_PENDING',
    cause.lost
      ? [
          `The promise the expression returned was lost before it settled (dev server ${devServerUrl}).`,
          `Why: the app reloaded during the wait, which clears the globals this command parks the outcome on, so the value it resolved to — if it ever did — cannot be read any more.`,
          `How: run the expression again once the app has finished reloading ("${PROGRAM_PREFIX} smoke" waits for the bundle and the app together).`,
        ].join('\n')
      : [
          `The promise the expression returned had not settled after ${timeoutMs}ms (dev server ${devServerUrl}).`,
          `Why: the app is answering — it reported the promise and was polled until the wait ran out — so this is the promise taking longer than the budget, not a runtime that cannot be reached. A request to a slow host, or one waiting on something that never happens, both look like this.`,
          `How: give it longer with --timeout (for example --timeout 30s), or pass --no-await-promise to be told that a promise came back without waiting for it.`,
        ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} runtime:eval ${JSON.stringify(expression)} --timeout 30s`;
  return error;
}

/**
 * The connected runtime has no `Runtime.evaluate` handler.
 *
 * Kept apart from `RUNTIME_EVALUATE_FAILED` because the two need opposite next steps: a failed
 * evaluate is worth retrying with a longer `--timeout`, while a missing handler never will be, and
 * a caller told to retry would loop.
 *
 * The known cause is a JavaScript engine built without the Chrome DevTools Protocol debugger, which
 * is what Expo Go for Android ships [observed — Expo Go 57.0.9, 2026-08-22]. On that runtime the
 * reading commands connect and report an empty window rather than failing, so the message says so
 * instead of promising that they work.
 *
 * Shared with `runtime:tree`, `runtime:tap` and `runtime:type` (`./interact/`), which meet the same
 * runtime and must not describe it in a second set of words.
 */
export function evaluateUnsupportedError(devServerUrl: string): CommandError {
  const error = new CommandError(
    'RUNTIME_EVALUATE_UNSUPPORTED',
    [
      `The app connected to ${devServerUrl} cannot evaluate JavaScript.`,
      `Why: its runtime answered Runtime.evaluate with "method not found". Expo Go for Android ships a JavaScript engine built without the Chrome DevTools Protocol debugger, so nothing can be evaluated in it, and "${PROGRAM_PREFIX} runtime:errors" connects to it, is acknowledged, and reports an empty window. Expo Go on iOS answers both [observed — 2026-08-25].`,
      // Not "npx @expo/agent-cli dev prints the plan" [friction run 6, F55]: for a project Expo Go can
      // still serve, `dev --plan` prints the **Expo Go** path, because the plan engine only reaches
      // the development-build steps when a native module makes Expo Go incompatible
      // (`src/plan/decide.ts`). So the sentence names what does help instead.
      `How: run "${PROGRAM_PREFIX} runtime:errors --android", which falls back to the dev server's own log when the runtime cannot answer — the app's errors are there, with a code frame. Expo Go on iOS answers this command directly. To leave Expo Go behind, "npx expo run:android" builds and installs this project's own Android app; "${PROGRAM_PREFIX} dev --plan --android" prints the Expo Go path while Expo Go can still serve this project.`,
    ].join('\n')
  );
  // The platform is on it, so the command a driving agent runs next reads the same app (F54).
  error.suggestedCommand = `${PROGRAM_PREFIX} runtime:errors --android`;
  return error;
}

/** Listen for runtime errors from the running app over a window and print what arrived. */
export async function runtimeErrorsAsync(
  options: RuntimeErrorsOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { durationMs, json, failOnError } = options;

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — friction run 4, F39.
  // This is the command the CLI's own follow-ups name straight after a reload, so it is the one
  // that lands inside the app's reconnect window: for a second or so the dev server lists the
  // runtime that is being replaced, which cannot be connected to, and lists nothing at all in
  // between. Both were reported as "there is no app", one run in three. The grace period is what
  // makes the printed chain deterministic — including for a reload nothing here performed, such as
  // pressing "r" in the dev server's terminal.
  const connection = await preflightRuntimeAsync(
    {
      need: 'debugger-target',
      devServerUrl: options.devServerUrl,
      platform: options.platform,
      retryMs: APP_RECONNECT_GRACE_MS,
    },
    context
  );
  const { devServerUrl, deviceIndex } = connection;

  // @ref ../dev/logErrors — F105. Which *other* platforms have an app on this dev server, because
  // the log fallback below cannot tell their lines from this one's and a caveat that does not say so
  // is the overclaim. Computed from the read the preflight already made, so it costs nothing.
  const otherPlatformsConnected =
    options.platform == null
      ? []
      : [
          ...new Set(
            scopeTargets(
              connection.targets,
              options.platform,
              deviceIndex ?? EMPTY_DEVICE_INDEX
            ).otherPlatform.map((entry) => entry.platform)
          ),
        ].sort();

  // Marked before the window opens, so the log read below is bounded the same way the debugger
  // window is: a log is cumulative, and reporting all of it as "what happened while I watched"
  // would be the same overclaim the empty window was, pointed the other way.
  const logMark = markDevServerLog(context.projectRoot ?? null);

  let errors: RuntimeErrorRecord[];
  const collector = new CdpRuntimeErrorCollector({
    metroUrl: devServerUrl,
    durationMs,
    targetRetryMs: APP_RECONNECT_GRACE_MS,
    platform: options.platform,
    deviceIndex,
  });
  try {
    errors = await collector.collectAsync();
  } catch (error: unknown) {
    throw new CommandError(
      'RUNTIME_ERRORS_FAILED',
      [
        `Could not read runtime errors from the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again. If the app was reloading, "${PROGRAM_PREFIX} runtime:reload" waits for it to come back and exits 0 only when it has.`,
      ].join('\n')
    );
  }

  errors = await symbolicateRuntimeErrorsAsync(errors, devServerUrl, context.projectRoot ?? null);

  // @ref llp/0005-runtime-loop-tools.rfc.md §Android — friction run 6, F52. When the runtime has no
  // debugger, the debugger window is silence and the dev server's own log is where the app's errors
  // actually are. Read only then: on a runtime that answers, the log would add a second, unlabelled
  // copy of what the window already reported.
  // `?? ` rather than a bare read: a collector that established nothing — an injected fake, a
  // socket that closed before the probe answered — has not shown the runtime to be blind.
  const capability = collector.capability ?? { blind: null, evidence: null };
  const blind = capability.blind === true;
  const logRead = blind
    ? readDevServerLogWindow(context.projectRoot ?? null, logMark)
    : { json: NO_DEV_SERVER_LOG, entries: [] };
  const log: RuntimeErrorsLogJson = logRead.json.read
    ? { ...logRead.json, otherPlatformsConnected }
    : logRead.json;
  errors = [...errors, ...logRecordsOf(logRead.entries)];

  event('runtime_errors', {
    devServerUrl,
    durationMs,
    count: errors.length,
    symbolicated: errors.filter((error) => error.symbolicated).length,
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — the two outcomes need opposite
  // next steps: errors mean "fix, then prove the window is clean", an empty window means the
  // failure was probably never reproduced inside it.
  const followups = followUpsEnabled(options.followups)
    ? buildRuntimeErrorsFollowUps({
        count: errors.length,
        durationMs,
        platform: options.platform ?? null,
      })
    : [];

  const caveat = blind ? blindRuntimeCaveat(capability.evidence, log) : null;

  if (json) {
    Log.log(
      JSON.stringify(
        {
          ...runtimeErrorsToJson(devServerUrl, durationMs, errors, {
            runtimeReadable: capability.blind == null ? null : !blind,
            runtimeEvidence: capability.evidence,
            devServerLog: log,
          }),
          followups,
        },
        null,
        2
      )
    );
  } else {
    Log.log(formatRuntimeErrors(devServerUrl, durationMs, errors, caveat));
  }
  reportFollowUps('runtime:errors', followups, { json });

  // Collected errors are a report, not a failure of the command: the app was reached and answered,
  // and a window that catches nothing is the common case. `--fail-on-error` is the opt-in for a
  // caller using this as a gate, which is what `dev:wait` is by default — the two differ because
  // an empty window here means "nothing happened while I watched", not "the app is healthy".
  if (failOnError && errors.length > 0) {
    return EXIT_OUTCOME_FAILED;
  }
  // ...and an empty window on a runtime with no debugger is not even that. It is *no observation*,
  // so a gate must not read it as a pass. `22` is llp/0010's code for "nothing was shown to be
  // wrong and nothing was proved right", which is exactly this — and it differs from llp/0010's
  // earlier reading of `runtime:errors` as always-0-unless-caught, which was written before any
  // runtime that cannot answer had been seen (llp/0005-runtime-loop-tools.rfc.md §Android records the change).
  if (failOnError && blind && !log.read) {
    Log.error(inconclusiveWindowError(devServerUrl, capability.evidence, log));
    return EXIT_OUTCOME_TIMEOUT;
  }
  return 0;
}

/** The line that has to sit above an empty window from a runtime that cannot report anything. */
function blindRuntimeCaveat(evidence: string | null, log: RuntimeErrorsLogJson): string {
  // F105: on a dev server with an app on another platform too, the second half of this sentence used
  // to be false. The log is not a per-app channel — Expo's logger prefixes a platform only for an
  // app that is not bridgeless, and every modern app is — so the honest form names the other app.
  const ambiguity =
    log.otherPlatformsConnected.length > 0
      ? ` That log does not say which app wrote a line, and the ${log.otherPlatformsConnected.join(' and ')} app on this same dev server writes to it too — so a record below may be from ${log.otherPlatformsConnected.length === 1 ? 'that app' : 'one of those apps'} rather than this one.`
      : '';
  const readClause = log.read
    ? ` The errors below marked "dev server log" were read from ${log.logFile} instead, which is where a bridgeless app's errors do arrive${log.older > 0 ? `; ${log.older} more ${log.older === 1 ? 'was' : 'were'} already in that log before this window opened` : ''}.${ambiguity}`
    : ` ${log.reason ?? 'No dev server log was available to read instead.'}`;
  return `CAVEAT: this runtime cannot report errors over the debugger protocol, so an empty window from it means nothing about the app. Why: ${evidence ?? 'it answered no debugger call'}.${readClause}`;
}

/** The what / why / how for a gate that was given no observation to gate on. */
function inconclusiveWindowError(
  devServerUrl: string,
  evidence: string | null,
  log: RuntimeErrorsLogJson
): string {
  return [
    `--fail-on-error has nothing to judge: the runtime connected to ${devServerUrl} reports no errors, whatever the app does.`,
    `Why: ${evidence ?? 'the runtime answered no debugger call'}. Expo Go for Android ships a JavaScript engine with no Chrome DevTools Protocol debugger, so it acknowledges the calls that open this window and then sends nothing. Exiting 0 here would report health that nothing observed. ${log.reason ?? ''}`.trim(),
    `How: start the dev server detached ("${PROGRAM_PREFIX} dev --detach"), which captures its log — this command reads the app's errors out of it when the runtime cannot answer. Or open the app in a development build, or on iOS, either of which carries a debuggable engine.`,
  ].join('\n');
}

/** How many lines the detached log had before the window opened, or null when there is none. */
function markDevServerLog(projectRoot: string | null): number | null {
  if (projectRoot == null) {
    return null;
  }
  const { readDetachedLogSync } = require('../dev/logFile') as typeof import('../dev/logFile');
  return readDetachedLogSync(projectRoot, 0)?.totalLines ?? null;
}

/** The errors the detached dev server log gained during the window. */
function readDevServerLogWindow(
  projectRoot: string | null,
  mark: number | null
): { json: RuntimeErrorsLogJson; entries: DevServerLogEntry[] } {
  if (projectRoot == null) {
    return {
      json: { ...NO_DEV_SERVER_LOG, reason: 'this command was not run inside a project' },
      entries: [],
    };
  }
  const { detachedLogPath, readDetachedLogSync } =
    require('../dev/logFile') as typeof import('../dev/logFile');
  const { readDevServerLogErrors } =
    require('../dev/logErrors') as typeof import('../dev/logErrors');

  // The whole file: `tail` is a display cap, and the mark below is what bounds the window.
  const read = readDetachedLogSync(projectRoot, Number.MAX_SAFE_INTEGER);
  if (read == null) {
    return {
      json: {
        ...NO_DEV_SERVER_LOG,
        logFile: detachedLogPath(projectRoot),
        reason: `this project has no detached dev server log (${detachedLogPath(projectRoot)}), so there was nowhere else to read the app's errors from — start the dev server with "${PROGRAM_PREFIX} dev --detach" to get one`,
      },
      entries: [],
    };
  }

  const { errors, older } = readDevServerLogErrors(read.lines, mark ?? 0);
  return {
    json: {
      read: true,
      logFile: read.logFile,
      count: errors.length,
      older,
      reason: null,
      // Filled in by the caller, which is the only place that knows what else is connected (F105).
      otherPlatformsConnected: [],
    },
    entries: errors,
  };
}

/** The log's entries as error records, labelled for what they are. */
function logRecordsOf(entries: DevServerLogEntry[]): RuntimeErrorRecord[] {
  return entries.map((entry) => ({
    source: 'dev-server-log' as const,
    timestamp: Date.now(),
    message: entry.message,
    stack: entry.details || undefined,
    // The dev server prints these for errors and nothing else, so they are errors — but there is
    // no structured stack behind them, which is why `frames` stays absent.
    isError: true,
  }));
}

/**
 * Map every stack onto project files, and make the frames readable either way.
 *
 * One request per error rather than one for all of them: Metro keys its source maps by the frame's
 * bundle URL, so mixing two bundles into one request is fine, but a failure on one error's stack
 * would take the others' with it. The frames are trimmed of their query strings whatever happens,
 * because that is what makes an unmapped stack unreadable.
 */
async function symbolicateRuntimeErrorsAsync(
  errors: RuntimeErrorRecord[],
  devServerUrl: string,
  projectRoot: string | null
): Promise<RuntimeErrorRecord[]> {
  return await Promise.all(
    errors.map(async (error) => {
      if (!error.frames?.length) {
        return error;
      }
      const symbolicated = await symbolicateFramesAsync(devServerUrl, error.frames);
      const frames = symbolicated.map((frame) => relativizeFrame(frame, projectRoot));
      return {
        ...error,
        frames,
        symbolicated: frames.some((frame) => !isUnmappedFrame(frame)),
        stack: formatStackFrames(frames),
      };
    })
  );
}
