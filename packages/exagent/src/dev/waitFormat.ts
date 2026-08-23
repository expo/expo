// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two halves of what `dev:wait` reports, as pure functions over one result: labelled lines for
// a terminal, and one JSON object whose keys mirror those labels. Nothing here does I/O, so the
// shape of both channels is unit-testable without a dev server.

import chalk from 'chalk';

import type { FollowUp } from '../followups';
import type { DevServerSource } from '../runtime/devServer';

/** Width of the label column, matching `exagent status`. */
const LABEL_WIDTH = 12;

/** Separates the facts inside one line. */
const SEPARATOR = ' · ';

/** What one `dev:wait` run found. The command's whole answer, in one object. */
export interface DevWaitResult {
  devServerUrl: string;
  /** Which step of discovery produced {@link devServerUrl}. */
  source: DevServerSource;
  /** The dev server answered `packager-status:running`. */
  ready: boolean;
  /** Whether the dev server serves this project; null when it could not be decided. */
  projectRootMatched: boolean | null;
  /** The project root the dev server named, or null when it named none. */
  reportedProjectRoot: string | null;
  /** The project this command was run in. */
  projectRoot: string;
  /** Debugger targets attached to the dev server when the wait ended. */
  appsConnected: number;
  /** How long the whole wait took, in milliseconds. */
  waitedMs: number;
  /** The budget expired before the wait could finish. */
  timedOut: boolean;
  /** Whether an app was required to attach (`--require-app`). */
  requireApp: boolean;
  /** Why the wait did not end in a ready bundler. Absent when it did. */
  reason?: string;
}

/** The `--json` payload: one object, with the keys the labelled lines print. */
export interface DevWaitResultJson {
  /** The bundler is ready, and an app is attached when `--require-app` asked for one. */
  ok: boolean;
  devServerUrl: string;
  ready: boolean;
  projectRootMatched: boolean | null;
  projectRoot: string;
  appsConnected: number;
  waitedMs: number;
  timedOut: boolean;
  source: DevServerSource;
  followups: FollowUp[];
}

/** Whether the run answered the question it was asked: ready, plus an app if one was required. */
export function devWaitSucceeded(result: DevWaitResult): boolean {
  return result.ready && (!result.requireApp || result.appsConnected > 0);
}

export function devWaitResultToJson(
  result: DevWaitResult,
  followups: FollowUp[]
): DevWaitResultJson {
  return {
    ok: devWaitSucceeded(result),
    devServerUrl: result.devServerUrl,
    ready: result.ready,
    projectRootMatched: result.projectRootMatched,
    projectRoot: result.projectRoot,
    appsConnected: result.appsConnected,
    waitedMs: result.waitedMs,
    timedOut: result.timedOut,
    source: result.source,
    followups,
  };
}

/** Render the result as one labelled line per fact, in the order they were established. */
export function formatDevWaitResult(result: DevWaitResult): string {
  return [
    row('dev server', `${result.devServerUrl}${SEPARATOR}${chalk.dim(`via ${result.source}`)}`),
    row('bundler', bundlerValue(result)),
    row('project', projectValue(result)),
    row('apps', appsValue(result)),
  ].join('\n');
}

function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}

function bundlerValue(result: DevWaitResult): string {
  if (result.ready) {
    return `${chalk.green('ready')} after ${formatDuration(result.waitedMs)}`;
  }
  if (result.timedOut) {
    return `${chalk.yellow('still working')} after ${formatDuration(result.waitedMs)} (timed out)`;
  }
  return `${chalk.red('not ready')}${result.reason ? ` (${result.reason})` : ''}`;
}

/**
 * What the dev server said about the project it serves.
 *
 * A mismatch is the answer worth reading twice: the bundle may be finished and still belong to
 * another app, which is the discovery caveat this header exists to close.
 */
function projectValue(result: DevWaitResult): string {
  if (result.projectRootMatched === true) {
    return `${chalk.green('matches')} ${result.projectRoot}`;
  }
  if (result.projectRootMatched === false) {
    return chalk.yellow(
      `serves ${result.reportedProjectRoot ?? 'another project'}, not ${result.projectRoot}`
    );
  }
  return chalk.dim(`unknown (the dev server named no project root)`);
}

function appsValue(result: DevWaitResult): string {
  const apps = result.appsConnected === 1 ? 'app' : 'apps';
  const count = `${result.appsConnected} ${apps} connected`;
  if (result.requireApp && result.appsConnected === 0) {
    return `${chalk.yellow(count)} (timed out waiting for one)`;
  }
  return count;
}

/** Milliseconds, in the unit a reader thinks in: `840ms`, `4.2s`. */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}
