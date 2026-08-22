// @ref llp/0005-runtime-loop-tools.rfc.md
// The runtime loop: connect to the app through the dev server, evaluate an expression or listen
// for errors, and print the answer. This is the step that turns "I think the fix works" into
// "I read the value out of the running app".

import { event } from '../events';
import { buildRuntimeErrorsFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { CdpClient, type CdpEvaluateResult } from './cdpClient';
import { requireConnectedAppAsync } from './devServer';
import {
  evaluateResultToJson,
  formatEvaluateResult,
  formatRuntimeErrors,
  runtimeErrorsToJson,
} from './format';
import type { RuntimeEvalOptions, RuntimeErrorsOptions } from './resolveOptions';
import { CdpRuntimeErrorCollector, type RuntimeErrorRecord } from './runtimeErrorCollector';

/**
 * Evaluate an expression in the running app and print the value it returned.
 *
 * @returns the exit code: `1` when the expression threw inside the app, so a script can branch
 * on the outcome without parsing the output.
 */
export async function runtimeEvalAsync(options: RuntimeEvalOptions): Promise<number> {
  const { devServerUrl, expression, timeoutMs, awaitPromise, json } = options;
  await requireConnectedAppAsync(devServerUrl);

  let result: CdpEvaluateResult;
  try {
    result = await new CdpClient({ metroUrl: devServerUrl }).evaluateAsync(expression, {
      awaitPromise,
      timeoutMs,
    });
  } catch (error: unknown) {
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
  });

  if (json) {
    Log.log(JSON.stringify(evaluateResultToJson(devServerUrl, expression, result), null, 2));
  } else {
    Log.log(formatEvaluateResult(devServerUrl, result));
  }

  return result.exceptionText ? 1 : 0;
}

/** Listen for runtime errors from the running app over a window and print what arrived. */
export async function runtimeErrorsAsync(options: RuntimeErrorsOptions): Promise<number> {
  const { devServerUrl, durationMs, json } = options;
  await requireConnectedAppAsync(devServerUrl);

  let errors: RuntimeErrorRecord[];
  try {
    errors = await new CdpRuntimeErrorCollector({
      metroUrl: devServerUrl,
      durationMs,
    }).collectAsync();
  } catch (error: unknown) {
    throw new CommandError(
      'RUNTIME_ERRORS_FAILED',
      [
        `Could not read runtime errors from the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again.`,
      ].join('\n')
    );
  }

  event('runtime_errors', { devServerUrl, durationMs, count: errors.length });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — the two outcomes need opposite
  // next steps: errors mean "fix, then prove the window is clean", an empty window means the
  // failure was probably never reproduced inside it.
  const followups = followUpsEnabled(options.followups)
    ? buildRuntimeErrorsFollowUps({ count: errors.length, durationMs })
    : [];

  if (json) {
    Log.log(
      JSON.stringify(
        { ...runtimeErrorsToJson(devServerUrl, durationMs, errors), followups },
        null,
        2
      )
    );
  } else {
    Log.log(formatRuntimeErrors(devServerUrl, durationMs, errors));
  }
  reportFollowUps('runtime errors', followups, { json });

  // Collected errors are a report, not a failure of the command: the app was reached and
  // answered. A caller that wants to fail on errors reads `count` from `--json`.
  return 0;
}
