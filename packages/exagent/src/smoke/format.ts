// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two channels of `exagent smoke`: labelled lines for a terminal, and one JSON object whose
// keys mirror those labels. Pure over one `SmokeRun`, so both shapes are testable without a dev
// server, a device, or a clock.

import chalk from 'chalk';

import { bundleToJson } from '../dev/waitFormat';
import type { FollowUp } from '../followups';
import type { RouteCheckJson } from '../navigate/routeCheck';
import { wrapUntrustedAppOutput } from '../runtime/untrusted';
import { isFailingRecord, type SmokeRun } from './phases';
import type { SmokeOptions } from './resolveOptions';
import type { SmokePhase, SmokeResultJson } from './types';

/** Width of the label column, matching `dev:wait` and `status`. */
const LABEL_WIDTH = 12;

/** Separates the facts inside one line. */
const SEPARATOR = ' · ';

/** The route check of a run that never reached one, so the key set never varies. */
function uncheckedRoute(reason: string): RouteCheckJson {
  return { checked: false, ok: null, matched: null, routeCount: 0, reason };
}

export function smokeResultToJson(
  run: SmokeRun,
  options: SmokeOptions,
  followups: FollowUp[]
): SmokeResultJson {
  const failing = run.errors.filter(isFailingRecord).length;
  return {
    ok: run.outcome === 'passed',
    outcome: run.outcome,
    phases: run.phases,
    devServerUrl: run.devServerUrl,
    source: run.discovery?.source ?? 'default',
    projectRootMatched: run.projectRootMatched,
    started: run.started,
    appsConnected: run.appsConnected,
    // The same object `dev:wait` and `runtime:reload` print, from the same function: one question
    // asked in three commands must not have three shapes (llp/0010 §The reload gate).
    bundle: bundleToJson(run.bundle),
    route: run.route,
    routeCheck:
      run.routeCheck ??
      uncheckedRoute(
        run.route == null
          ? 'no --route was given, so no route was checked'
          : 'the run ended before the route was opened'
      ),
    platform: options.platform,
    deviceId: run.deviceId,
    runtimeSupported: run.runtimeSupported,
    errors: {
      windowMs: run.windowMs,
      // Null rather than 0 for a window that never opened: zero errors and no window are opposite
      // facts, and only one of them is evidence.
      count: run.windowMs == null ? null : run.errors.length,
      failing: run.windowMs == null ? null : failing,
      logs: run.windowMs == null ? null : run.errors.length - failing,
      records: run.errors,
    },
    screenshot: run.screenshot,
    durationMs: run.durationMs,
    // @ref llp/0008-guardrails.rfc.md — every string in here came out of the app.
    untrusted: ['errors.records'],
    followups,
  };
}

/** One label, one value, matching the other reports of this CLI. */
function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}

/** Render the run as one labelled line per fact, in the order they were established. */
export function formatSmokeResult(run: SmokeRun, options: SmokeOptions): string {
  const lines = [
    row('smoke', outcomeValue(run)),
    row('dev server', `${run.devServerUrl}${SEPARATOR}${chalk.dim(`via ${run.discovery?.source ?? 'default'}${run.started ? ', started by this run' : ''}`)}`),
    ...run.phases.map((phase) => row('', phaseLine(phase))),
  ];

  if (run.screenshot.ok) {
    lines.push(row('screenshot', run.screenshot.path));
  }

  // The records last and fenced, because everything in them is a string the app produced.
  if (run.errors.length > 0) {
    lines.push(
      wrapUntrustedAppOutput(
        run.errors
          .map((error, index) =>
            [
              // What the app did, in the terms this command decides on: an `Error` it reported —
              // which on React Native is how an uncaught throw arrives — or a line it logged.
              `[${index + 1}] ${isFailingRecord(error) ? 'error reported by the app' : 'console.error'}`,
              `message: ${error.message}`,
              ...(error.stack ? ['stack:', error.stack] : []),
            ].join('\n')
          )
          .join('\n\n')
      )
    );
  }

  lines.push(row('took', `${formatDuration(run.durationMs)}${options.route ? `${SEPARATOR}${chalk.dim(`route ${options.route}`)}` : ''}`));
  return lines.join('\n');
}

/** The verdict, in the word an agent reads and a colour a person does. */
function outcomeValue(run: SmokeRun): string {
  switch (run.outcome) {
    case 'passed':
      return chalk.green('passed');
    case 'failed':
      return chalk.red('failed');
    default:
      return chalk.yellow('inconclusive');
  }
}

/** One phase, as `status  id · reason`. */
function phaseLine(phase: SmokePhase): string {
  const mark =
    phase.status === 'ok'
      ? chalk.green('ok')
      : phase.status === 'failed'
        ? chalk.red('failed')
        : phase.status === 'inconclusive'
          ? chalk.yellow('unknown')
          : chalk.dim('skipped');
  const timing = phase.ms > 0 ? chalk.dim(` ${formatDuration(phase.ms)}`) : '';
  return `${mark.padEnd(18)}${phase.id}${timing}${phase.reason ? chalk.dim(`${SEPARATOR}${phase.reason}`) : ''}`;
}

/** Milliseconds, in the unit a reader thinks in: `840ms`, `4.2s`. */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}
