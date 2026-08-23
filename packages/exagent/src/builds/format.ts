// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — "one fact per line, label value
// style". The same facts as `--json`, in the shape a terminal and a model reading a terminal both
// get through in one pass.

import chalk from 'chalk';

import type { BuildWaitReport } from './types';

/** Width of the label column, matching `status` and `deploy`. */
const LABEL_WIDTH = 12;

/** How much of an EAS error message fits on a line. The rest is in `--json`. */
const ERROR_MAX_LENGTH = 160;

/** One line per fact the wait learned. */
export function formatBuildWaitReport(
  report: BuildWaitReport,
  { interrupted = false }: { interrupted?: boolean } = {}
): string {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row(report.kind, report.id);
  row('outcome', outcomeLine(report, interrupted));
  row('status', report.status ?? chalk.yellow('unknown'));
  if (report.platform) {
    row('platform', report.platform.toLowerCase());
  }
  if (report.buildProfile) {
    row('profile', report.buildProfile);
  }
  row('waited', `${formatDuration(report.waitedMs)} · ${report.polls} polls`);

  const { error, artifacts, metrics, fingerprint } = report.build;
  if (metrics) {
    row('timings', metricsLine(metrics));
  }
  if (fingerprint?.hash) {
    row('fingerprint', fingerprint.hash);
  }
  if (artifacts?.applicationArchiveUrl ?? artifacts?.buildUrl) {
    row('artifact', artifacts.applicationArchiveUrl ?? artifacts.buildUrl!);
  }
  if (artifacts?.xcodeBuildLogsUrl) {
    row('xcode logs', artifacts.xcodeBuildLogsUrl);
  }
  if (error) {
    row('error', chalk.red(errorLine(error)));
  }

  return lines.join('\n');
}

/** The outcome, plus the sentence that says what it means for the caller. */
function outcomeLine(report: BuildWaitReport, interrupted: boolean): string {
  switch (report.outcome) {
    case 'finished':
      return chalk.green(`finished — the ${report.kind} succeeded`);
    case 'errored':
      return chalk.red(`errored — the ${report.kind} failed`);
    case 'canceled':
      return chalk.yellow(
        interrupted
          ? `canceled — this wait was interrupted; the ${report.kind} may still be running`
          : `canceled — the ${report.kind} was stopped before it finished`
      );
    case 'timeout':
      // A timeout is inconclusive, and saying so is the whole reason it has an exit code of its own.
      return chalk.yellow(
        `timeout — the ${report.kind} had not finished after ${formatDuration(report.waitedMs)}, and may still succeed`
      );
  }
}

/** What EAS recorded about a failure, on one line. */
function errorLine(error: NonNullable<BuildWaitReport['build']['error']>): string {
  const message = error.message ?? 'no message';
  const truncated =
    message.length > ERROR_MAX_LENGTH ? `${message.slice(0, ERROR_MAX_LENGTH)}…` : message;
  return error.errorCode ? `${error.errorCode}: ${truncated}` : truncated;
}

/** Where the time went, for a build that is over. */
function metricsLine(metrics: NonNullable<BuildWaitReport['build']['metrics']>): string {
  return (
    [
      metrics.buildQueueTime == null
        ? null
        : `queued ${formatDuration(metrics.buildQueueTime * 1000)}`,
      metrics.buildWaitTime == null
        ? null
        : `waited ${formatDuration(metrics.buildWaitTime * 1000)}`,
      metrics.buildDuration == null
        ? null
        : `built ${formatDuration(metrics.buildDuration * 1000)}`,
    ]
      .filter(Boolean)
      .join(' · ') || 'none recorded'
  );
}

/**
 * A duration as a person reads one: `45s`, `12m 23s`, `1h 4m`.
 *
 * The same spellings {@link resolveDuration} accepts on the way in, so a `waited` line can be
 * pasted back into `--timeout` without translation.
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    const seconds = totalSeconds % 60;
    return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
