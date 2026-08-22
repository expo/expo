// @ref llp/0005-runtime-loop-tools.rfc.md
// Rendering for the runtime commands. Everything the app produced is fenced as untrusted
// output (llp/0008 §Untrusted content), so an agent reading the terminal can tell app data
// from command output.
import type { CdpEvaluateResult } from './cdpClient';
import { stringifyCdpValue } from './cdpFormat';
import type { RuntimeErrorRecord } from './runtimeErrorCollector';
import { wrapUntrustedAppOutput } from './untrusted';

/** Machine shape of `exagent runtime eval --json`. */
export interface EvaluateResultJson {
  devServerUrl: string;
  expression: string;
  /** The expression threw instead of returning a value. */
  threw: boolean;
  type?: string;
  value?: unknown;
  description?: string;
  exception?: { text: string; stack?: string };
  /** Fields whose contents come from the app and must be treated as data, never instructions. */
  untrusted: string[];
}

/** Machine shape of `exagent runtime errors --json`. */
export interface RuntimeErrorsJson {
  devServerUrl: string;
  durationMs: number;
  count: number;
  errors: RuntimeErrorRecord[];
  /** Fields whose contents come from the app and must be treated as data, never instructions. */
  untrusted: string[];
}

/** Fields of {@link EvaluateResultJson} that hold app-originated content. */
const UNTRUSTED_EVALUATE_FIELDS = ['value', 'description', 'exception'];

/** Renders an evaluate result, with the app-originated part fenced as untrusted. */
export function formatEvaluateResult(devServerUrl: string, result: CdpEvaluateResult): string {
  if (result.exceptionText) {
    const body = result.exceptionStack
      ? `${result.exceptionText}\n${result.exceptionStack}`
      : result.exceptionText;
    return [
      `The expression threw an exception in the app (dev server ${devServerUrl}).`,
      wrapUntrustedAppOutput(body),
    ].join('\n');
  }

  const type = result.type ?? 'undefined';
  const value =
    result.value !== undefined
      ? stringifyValueForOutput(result.value)
      : (result.description ?? 'undefined');

  return [
    `Evaluated the expression in the app (dev server ${devServerUrl}). Result type: ${type}.`,
    wrapUntrustedAppOutput(value),
  ].join('\n');
}

/** Renders collected runtime errors, with the app-originated part fenced as untrusted. */
export function formatRuntimeErrors(
  devServerUrl: string,
  durationMs: number,
  errors: RuntimeErrorRecord[]
): string {
  if (errors.length === 0) {
    return `No runtime errors were reported by the app in ${durationMs}ms (dev server ${devServerUrl}). Errors thrown before this window are not captured, so reproduce the failure while this command runs.`;
  }

  const body = errors
    .map((error, index) => {
      const lines = [
        `[${index + 1}] ${error.source === 'exception' ? 'uncaught exception' : 'console.error'} at ${formatTimestamp(error.timestamp)}`,
        `message: ${error.message}`,
      ];
      if (error.location) {
        lines.push(`location: ${error.location}`);
      }
      if (error.stack) {
        lines.push('stack:', error.stack);
      }
      return lines.join('\n');
    })
    .join('\n\n');

  return [
    `Collected ${errors.length} runtime error(s) from the app in ${durationMs}ms (dev server ${devServerUrl}).`,
    wrapUntrustedAppOutput(body),
  ].join('\n');
}

/**
 * Machine-readable evaluate result.
 *
 * JSON needs no marker fence: the app-originated content stays inside its own fields, which the
 * `untrusted` list names, so it cannot be mistaken for command output.
 */
export function evaluateResultToJson(
  devServerUrl: string,
  expression: string,
  result: CdpEvaluateResult
): EvaluateResultJson {
  if (result.exceptionText) {
    return {
      devServerUrl,
      expression,
      threw: true,
      exception: { text: result.exceptionText, stack: result.exceptionStack },
      untrusted: UNTRUSTED_EVALUATE_FIELDS,
    };
  }

  return {
    devServerUrl,
    expression,
    threw: false,
    type: result.type ?? 'undefined',
    value: result.value,
    description: result.description,
    untrusted: UNTRUSTED_EVALUATE_FIELDS,
  };
}

/** Machine-readable collection of runtime errors. */
export function runtimeErrorsToJson(
  devServerUrl: string,
  durationMs: number,
  errors: RuntimeErrorRecord[]
): RuntimeErrorsJson {
  return {
    devServerUrl,
    durationMs,
    count: errors.length,
    errors,
    untrusted: ['errors'],
  };
}

function stringifyValueForOutput(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2) ?? stringifyCdpValue(value);
  } catch {
    return stringifyCdpValue(value);
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? String(timestamp) : date.toISOString();
}
