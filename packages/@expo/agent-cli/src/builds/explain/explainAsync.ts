// @ref llp/0012-build-explain.rfc.md
// `@expo/agent-cli inspect:build-log --file <path>` / `--stdin`: read a build log and say what failed in it.
//
// Orchestration only. Every decision the command makes lives in a pure module next to this one —
// `readLog` streams the bytes, `phases` cuts them into steps, `anchors` is the rule table,
// `extract` picks the one match the report is about — so the answer a fixture pins is the answer
// the command gives.

import { event } from '../../events';
import { EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import { buildExplainFollowUps, followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { PROGRAM_PREFIX } from '../../programName';
import { CommandError } from '../../utils/errors';
import { extractFailure, logTail } from './extract';
import { formatExplainReport } from './format';
import { detectPhases } from './phases';
import { readLogFileAsync, readLogStreamAsync, type ReadLogResult } from './readLog';
import type { ExplainOptions } from './resolveOptions';
import type { ExplainReport } from './types';

/**
 * Read one build log and report what failed in it.
 *
 * @returns a promise that resolves when the report has been printed. The command exits 0 from
 *   here whatever the report says — a located failure and a "nothing matched" are both reports
 *   (llp/0012 §Exit codes). Only a log that could not be read at all exits 1, and that leaves
 *   through a `CommandError` rather than through this function.
 */
export async function explainAsync(options: ExplainOptions): Promise<void> {
  const read =
    options.source.kind === 'file'
      ? await readLogFileAsync(options.source.path)
      : await readLogStreamAsync(process.stdin);

  if (read.lines.length === 0) {
    throw emptyLogError(options);
  }
  // Before anything is extracted, and before a byte of it is quoted anywhere.
  if (!read.looksLikeText) {
    throw notALogError(options, read.controlRatio);
  }

  const report = buildExplainReport(read, options);

  event('build_explain', {
    source: report.source.kind,
    lines: report.source.lines,
    bytes: report.source.bytes,
    truncated: report.source.truncated,
    phase: report.failure?.phase ?? null,
    signature: report.failure?.signature ?? null,
    line: report.failure?.line ?? null,
    confidence: report.failure?.confidence ?? null,
    otherFailures: report.otherFailures.length,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatExplainReport(report));
  }

  reportFollowUps('inspect:build-log', report.followups, { json: options.json });
}

/**
 * The one JSON object the command prints.
 *
 * Exported for the shape test: the top-level keys are the de-facto version of this command
 * (llp/0006 §Output contract), and they must not depend on what the log held — an agent reading
 * `failure` on a log with no error in it gets `null`, not a missing key.
 */
export function buildExplainReport(read: ReadLogResult, options: ExplainOptions): ExplainReport {
  const phases = detectPhases(read.lines, options.platform);
  const extracted = extractFailure(read.lines, phases, {
    platform: options.platform,
    contextBefore: options.contextBefore,
    contextAfter: options.contextAfter,
    all: options.all,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildExplainFollowUps({
        failure: extracted.failure,
        phase: extracted.failure?.phase ?? null,
        moreMayExist: !options.all,
        source: options.source,
      })
    : [];

  return {
    source: {
      kind: options.source.kind,
      path: options.source.kind === 'file' ? options.source.path : null,
      platform: options.platform,
      bytes: read.bytes,
      lines: read.lines.length,
      truncated: read.truncated,
      droppedLines: read.droppedLines,
    },
    phases: extracted.phases,
    failure: extracted.failure,
    otherFailures: extracted.otherFailures,
    // Always present, whether or not a failure was located: a report whose rule table came up
    // empty must still leave the caller with something to read.
    logTail: logTail(read.lines),
    followups,
  };
}

/**
 * The error for a source that is not a log.
 *
 * @ref llp/0012-build-explain.rfc.md §Is this a log at all — live staging, S8.
 *
 * Exit `22` rather than `20`, and never `0`: nothing about the build was measured, so this is
 * llp/0010's "nothing was shown to be wrong and nothing was proved right" — the same code
 * `status --assert` uses for a project it cannot measure. `20` would say the build failed, and the
 * old answer, `0` with `failure: null`, said it passed.
 *
 * The refusal quotes **none** of what it read. That is the other half of the finding: the report
 * carried ten kilobytes of control characters into `logTail`, where a terminal renders them as
 * anything at all and an agent has to carry them through its own context.
 */
function notALogError(options: ExplainOptions, controlRatio: number): CommandError {
  const where = options.source.kind === 'file' ? options.source.path : 'the data on stdin';
  const error = new CommandError(
    'LOG_NOT_TEXT',
    [
      `${where} is not a build log, so nothing was read from it.`,
      `Why: ${Math.round(controlRatio * 100)}% of the start of it is control characters, which no log contains — this is binary, and the usual reason is a log that is still compressed. EAS serves build logs brotli-encoded, so a response saved without decoding it looks exactly like this. Reporting "no error located" for it would say the build passed.`,
      `How: decode it first — "brotli --decompress --output build.log build.log.br", or "curl --compressed" when fetching it — then pass the decoded file with "--file build.log". "npx eas build:view <id>" prints where a build's logs are.`,
    ].join('\n')
  );
  error.exitCode = EXIT_OUTCOME_TIMEOUT;
  error.suggestedCommand = `${PROGRAM_PREFIX} inspect:build-log --help`;
  return error;
}

/**
 * The error for a source that held no bytes.
 *
 * This is exit `1` and not a report with `failure: null`, because the two say different things:
 * `failure: null` means "the log was read and nothing matched", and an empty stdin means the log
 * never arrived. Reporting the first for the second would tell an agent its build log is clean.
 */
function emptyLogError(options: ExplainOptions): CommandError {
  const error = new CommandError(
    'EMPTY_LOG',
    options.source.kind === 'stdin'
      ? [
          `Nothing arrived on stdin, so there is no log to explain.`,
          `Why: this run read stdin because it is not a terminal, and the stream closed without a byte on it. An empty log is not a log with no errors in it — nothing was read at all.`,
          `How: check that the command on the left of the pipe wrote something, and that its errors are included: "npx expo run:ios 2>&1 | ${PROGRAM_PREFIX} inspect:build-log". Or read a saved log with "--file <path>".`,
        ].join('\n')
      : [
          `The log at ${options.source.path} is empty, so there is nothing to explain.`,
          `Why: the file exists and was read, and it held no bytes. An empty log is not a log with no errors in it.`,
          `How: check that the build actually wrote to this path, and that stderr was captured too: "npx expo run:ios > build.log 2>&1".`,
        ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} inspect:build-log --help`;
  return error;
}
