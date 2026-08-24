// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two halves of what `dev:wait` reports, as pure functions over one result: labelled lines for
// a terminal, and one JSON object whose keys mirror those labels. Nothing here does I/O, so the
// shape of both channels is unit-testable without a dev server.

import chalk from 'chalk';

import type { FollowUp } from '../followups';
import type {
  BundleCheckError,
  BundleCheckPlatform,
  BundleCheckResult,
} from '../runtime/bundleCheck';
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
  /** What building the project's entry bundle answered, or null when it was not attempted. */
  bundle: BundleCheckResult | null;
  /** Why the wait did not end in a ready bundler. Absent when it did. */
  reason?: string;
}

/**
 * The `bundle` object of the `--json` payload.
 *
 * Always present with the same keys, so a parser reads one shape whether the check ran, was
 * declined with `--no-bundle-check`, or could not decide (llp/0006 §Output contract).
 */
export interface DevWaitBundleJson {
  /** Whether the entry bundle was fetched at all. */
  checked: boolean;
  /**
   * True when it compiled, false when the bundler reported an error.
   *
   * Null when it was not decided: the check was declined, the dev server was never ready, or
   * nothing about the manifest could be read. Null is never "broken".
   */
  ok: boolean | null;
  /** Platform the bundle was built for, or null when nothing was built. */
  platform: BundleCheckPlatform | null;
  /** Entry bundle URL that was fetched, resolved from the dev server's own manifest. */
  url: string | null;
  /** What the bundler reported. Present exactly when `ok` is false. */
  error: BundleCheckError | null;
  /** Why `ok` is null. */
  reason: string | null;
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
  bundle: DevWaitBundleJson;
  followups: FollowUp[];
}

/**
 * Whether the run answered the question it was asked: this project's bundler ready, plus an app if
 * one was required.
 *
 * A dev server that proved it serves **another** project fails, whatever else it answered. The
 * human report has always said so plainly — "serves /other/app, not /this/app" — while `ok` stayed
 * true and the process exited 0, so an agent gating on the exit code walked into a stranger's app
 * while the prose on screen told a person not to. `null` is not `false`: a dev server that named no
 * project root has not been shown to be the wrong one, and refusing to pass on "undecidable" would
 * fail every dev server too old to send the header.
 */
export function devWaitSucceeded(result: DevWaitResult): boolean {
  return (
    result.projectRootMatched !== false &&
    result.ready &&
    bundleCompiled(result) &&
    (!result.requireApp || result.appsConnected > 0)
  );
}

/**
 * Whether the entry bundle is known not to be broken.
 *
 * A check that could not run (`unknown`) passes: the dev server answered nothing this command
 * understands, which is not evidence that the project is broken, and going red on it would trade
 * one wrong answer for another.
 */
function bundleCompiled(result: DevWaitResult): boolean {
  return (
    result.bundle == null || result.bundle.outcome === 'ok' || result.bundle.outcome === 'unknown'
  );
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
    bundle: bundleToJson(result.bundle),
    followups,
  };
}

/** The `bundle` object, with the same keys whatever the check did or did not manage to do. */
function bundleToJson(bundle: BundleCheckResult | null): DevWaitBundleJson {
  if (bundle == null) {
    return { checked: false, ok: null, platform: null, url: null, error: null, reason: null };
  }
  return {
    checked: true,
    ok: bundle.outcome === 'ok' ? true : bundle.outcome === 'broken' ? false : null,
    platform: bundle.platform,
    url: bundle.url,
    error: bundle.error,
    reason: bundle.reason ?? null,
  };
}

/** Render the result as one labelled line per fact, in the order they were established. */
export function formatDevWaitResult(result: DevWaitResult): string {
  return [
    row('dev server', `${result.devServerUrl}${SEPARATOR}${chalk.dim(`via ${result.source}`)}`),
    row('bundler', bundlerValue(result)),
    row('project', projectValue(result)),
    row('bundle', bundleValue(result.bundle)),
    row('apps', appsValue(result)),
    ...bundleErrorLines(result.bundle),
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

/**
 * What building the project's own entry bundle answered.
 *
 * The only line of this report that is about the *project*: every other one is about the dev
 * server, which can be perfectly healthy while the code it is serving does not compile.
 */
function bundleValue(bundle: BundleCheckResult | null): string {
  if (bundle == null) {
    return chalk.dim('not checked');
  }
  switch (bundle.outcome) {
    case 'ok':
      return `${chalk.green('compiles')} for ${bundle.platform}`;
    case 'broken':
      return `${chalk.red('does not compile')} for ${bundle.platform}`;
    case 'timeout':
      return chalk.yellow(`still building for ${bundle.platform} (timed out)`);
    default:
      return chalk.dim(`unknown${bundle.reason ? ` (${bundle.reason})` : ''}`);
  }
}

/**
 * The file, line and message the bundler stopped on, under the summary line.
 *
 * Printed in full rather than summarized: this is the one thing the reader has to act on, and it
 * is exactly what they would otherwise go looking for in a dev-server log they do not have.
 */
function bundleErrorLines(bundle: BundleCheckResult | null): string[] {
  const error = bundle?.error;
  if (error == null) {
    return [];
  }
  const location = [error.filename, error.lineNumber, error.column].filter(
    (part) => part != null
  ) as (string | number)[];
  return [
    row('', chalk.red(error.message)),
    ...(location.length ? [row('', chalk.dim(location.join(':')))] : []),
    ...(error.snippet ? [error.snippet] : []),
  ];
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
