// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — eas-cli is reached as a subprocess,
// so its answer arrives as text on a pipe and has to be read back defensively. Nothing here throws:
// a payload whose shape moved degrades to nulls in the report, because a wait that has been running
// for forty minutes must not end on a field rename.

import type { BuildViewPayload, BuildWaitDetails, BuildWaitProgress } from './types';

/**
 * The last JSON object printed on stdout, or null when there is none.
 *
 * `--json` sends everything that is not the answer to stderr, so stdout *should* be one object —
 * but "should" is another CLI's promise, and an update notice or a warning on the wrong stream
 * would break a parser that trusted it. Three readings, cheapest first:
 *
 * 1. the whole of stdout, which is the case when the promise held;
 * 2. the last line that is an object on its own, the way `parseFingerprintHash` reads the
 *    fingerprint CLI (`src/project/fingerprint.ts`);
 * 3. everything from the last line that *opens* an object, for a pretty-printed payload with
 *    something printed above it.
 */
export function parseLastJsonObject(output: string): BuildViewPayload | null {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  const whole = asObject(trimmed);
  if (whole) {
    return whole;
  }

  const lines = trimmed.split('\n');
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index]!.trim();
    if (line.startsWith('{')) {
      // One object on one line, which is what a compact `--json` prints.
      const single = asObject(line);
      if (single) {
        return single;
      }
      // Otherwise this line opens a pretty-printed object that runs to the end of the output.
      const block = asObject(lines.slice(index).join('\n'));
      if (block) {
        return block;
      }
    }
  }
  return null;
}

/** One JSON object, or null for anything else — including a JSON array or a bare number. */
function asObject(text: string): BuildViewPayload | null {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** A string field of an untrusted payload, or null when it is absent or another type. */
export function readString(payload: BuildViewPayload | null, key: string): string | null {
  const value = payload?.[key];
  return typeof value === 'string' && value ? value : null;
}

/** A number field of an untrusted payload, or null when it is absent or another type. */
export function readNumber(payload: BuildViewPayload | null, key: string): number | null {
  const value = payload?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** A nested object of an untrusted payload, or null when it is absent or another type. */
function readObject(payload: BuildViewPayload | null, key: string): BuildViewPayload | null {
  const value = payload?.[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as BuildViewPayload)
    : null;
}

/**
 * The fields of the polled object the report carries.
 *
 * A nested object that is absent stays `null` rather than becoming an object of nulls: "this build
 * produced no artifacts" and "artifacts exist and are empty" are different answers, and only the
 * payload knows which one this is.
 */
export function readBuildDetails(payload: BuildViewPayload | null): BuildWaitDetails {
  const error = readObject(payload, 'error');
  const artifacts = readObject(payload, 'artifacts');
  const fingerprint = readObject(payload, 'fingerprint');
  const metrics = readObject(payload, 'metrics');

  return {
    error: error && {
      errorCode: readString(error, 'errorCode'),
      message: readString(error, 'message'),
      docsUrl: readString(error, 'docsUrl'),
    },
    artifacts: artifacts && {
      buildUrl: readString(artifacts, 'buildUrl'),
      applicationArchiveUrl: readString(artifacts, 'applicationArchiveUrl'),
      buildArtifactsUrl: readString(artifacts, 'buildArtifactsUrl'),
      xcodeBuildLogsUrl: readString(artifacts, 'xcodeBuildLogsUrl'),
    },
    fingerprint: fingerprint && { hash: readString(fingerprint, 'hash') },
    metrics: metrics && {
      buildWaitTime: readNumber(metrics, 'buildWaitTime'),
      buildQueueTime: readNumber(metrics, 'buildQueueTime'),
      buildDuration: readNumber(metrics, 'buildDuration'),
    },
    createdAt: readString(payload, 'createdAt'),
    completedAt: readString(payload, 'completedAt'),
    appVersion: readString(payload, 'appVersion'),
    appBuildVersion: readString(payload, 'appBuildVersion'),
  };
}

/**
 * What one poll learned, for the event stream.
 *
 * `queuePosition` and `estimatedWaitTimeLeftSeconds` are the two fields that make a wait readable
 * while it runs — they are what turns "still going" into "eleventh in the queue, about four
 * minutes" — and both are real `BuildFragment` fields [observed — eas-cli `Build.ts`].
 */
export function readProgress(
  payload: BuildViewPayload | null,
  elapsedMs: number
): BuildWaitProgress {
  return {
    status: readString(payload, 'status'),
    queuePosition: readNumber(payload, 'queuePosition'),
    estimatedWaitTimeLeftSeconds: readNumber(payload, 'estimatedWaitTimeLeftSeconds'),
    elapsedMs,
  };
}
