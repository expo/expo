// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two halves of what `dev:wait` reports, as pure functions over one result: labelled lines for
// a terminal, and one JSON object whose keys mirror those labels. Nothing here does I/O, so the
// shape of both channels is unit-testable without a dev server.

import chalk from 'chalk';

import type { FollowUp } from '../../followups';
import type {
  BundleCheckError,
  BundleCheckPlatform,
  BundleCheckResult,
  BundlePlatformSource,
} from '../../runtime/bundleCheck';
import type { DevServerSource } from '../../runtime/devServer';

/** Width of the label column, matching `@expo/agent-cli status`. */
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
  /**
   * Debugger targets attached to the dev server when the wait ended.
   *
   * Null for `--platform web`, and that null is a decision rather than a gap. The list holds
   * React Native runtimes that attached over the dev server's inspector; a browser running the web
   * bundle registers nothing there, whether or not it is open [observed — 2026-08-24, live: the
   * web bundle ran in Safari and `/json/list` stayed at the one iOS target for 90 s]. So under
   * `--platform web` the number is a count of *native* apps, and reporting it is how "1 app
   * connected" came to describe a browser nobody had opened (llp/0010 §An empty target list is inconclusive
   * cannot see).
   */
  appsConnected: number | null;
  /**
   * Platform the app count is about, or null when it is about the dev server as a whole.
   *
   * Only ever `web` today: it is what turns "no number" into "no number *because* this is web".
   */
  appsPlatform?: BundleCheckPlatform | null;
  /** How long the whole wait took, in milliseconds. */
  waitedMs: number;
  /** The budget expired before the wait could finish. */
  timedOut: boolean;
  /** Whether an app was required to attach (`--require-app`). */
  requireApp: boolean;
  /**
   * Whether the entry bundle check was asked for, i.e. `--no-bundle-check` was *not* passed.
   *
   * Kept beside {@link bundle} because a null bundle has two causes that read the same and mean
   * opposite things: a caller who declined the check, and a check that never got the chance to run
   * because the bundler was never ready. Only the first has a flag to name, and reporting "not
   * checked" for both is what made a declined check read as a clean one [friction run 5, F48-7].
   */
  bundleCheck: boolean;
  /**
   * What building the project's entry bundle answered, or null when it was not attempted.
   *
   * The **decisive** one when more than one platform was checked: a broken bundle wins, because
   * that is what the exit code is about. {@link bundles} holds every answer.
   */
  bundle: BundleCheckResult | null;
  /**
   * Every platform that was checked, in the order they were.
   *
   * More than one only when no `--platform` was named and the dev server has apps on more than one
   * platform. That is friction run 6's F53: with an Android-only break and an iOS app also
   * connected, a run with no flag checked the fixed iOS default and reported "compiles for ios"
   * while the Android app was on a red screen.
   */
  bundles?: BundleCheckResult[];
  /** Where the checked platform came from, so a reader can tell a default from a decision. */
  bundlePlatformSource?: BundlePlatformSource;
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
  /** Debugger targets attached, or null when they cannot answer the question — see the field of
   * the same name on {@link DevWaitResult}. */
  appsConnected: number | null;
  /** Why {@link appsConnected} is null. Present exactly when it is, the way `bundle.reason` is. */
  appsReason: string | null;
  waitedMs: number;
  timedOut: boolean;
  source: DevServerSource;
  bundle: DevWaitBundleJson;
  /** Every platform whose entry bundle was built, in the order they were. */
  bundlePlatforms: BundleCheckPlatform[];
  /** Where those platforms came from: a flag, the connected apps, or this command's default. */
  bundlePlatformSource: BundlePlatformSource;
  followups: FollowUp[];
}

/** Why a web wait reports no app count. One sentence, in one place, for both channels. */
const WEB_APPS_UNKNOWN_REASON =
  'the dev server only lists debugger targets for native runtimes, so a browser running the web bundle cannot be counted';

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
    // `--require-app` cannot be combined with `--platform web` (`resolveWaitOptions`), so
    // `requireApp` here always comes with a number to test.
    (!result.requireApp || (result.appsConnected ?? 0) > 0)
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
    appsReason: result.appsConnected == null ? WEB_APPS_UNKNOWN_REASON : null,
    waitedMs: result.waitedMs,
    timedOut: result.timedOut,
    source: result.source,
    bundle: bundleToJson(result.bundle, { skippedByFlag: !result.bundleCheck }),
    bundlePlatforms: (result.bundles ?? (result.bundle ? [result.bundle] : [])).map(
      (bundle) => bundle.platform
    ),
    bundlePlatformSource: result.bundlePlatformSource ?? 'default',
    followups,
  };
}

/** Render the result as one labelled line per fact, in the order they were established. */
export function formatDevWaitResult(result: DevWaitResult): string {
  return [
    row('dev server', `${result.devServerUrl}${SEPARATOR}${chalk.dim(`via ${result.source}`)}`),
    row('bundler', bundlerValue(result)),
    row('project', projectValue(result)),
    row('bundle', bundleValue(result)),
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
function bundleValue(result: DevWaitResult): string {
  const bundle = result.bundle;
  if (bundle == null) {
    // The two ways of having no answer, told apart. A caller that passed `--no-bundle-check` gets
    // the flag named back, so the line reads as their own decision rather than as a clean result;
    // a check that never ran keeps the plainer wording, because there is no flag to blame.
    return result.bundleCheck ? chalk.dim('not checked') : chalk.dim('skipped (--no-bundle-check)');
  }
  // Every platform that was checked, not only the decisive one: "compiles for ios" printed while
  // an Android app was on a red screen is exactly what F53 recorded, and the second platform is the
  // only thing on this line that would have said so.
  const others = (result.bundles ?? []).filter((entry) => entry !== bundle);
  const alsoClause = others.length
    ? chalk.dim(
        ` · also ${others
          .map(
            (entry) =>
              `${entry.outcome === 'ok' ? 'compiles' : entry.outcome} for ${entry.platform}`
          )
          .join(', ')}`
      )
    : '';
  const sourceClause =
    result.bundlePlatformSource === 'connected-app'
      ? chalk.dim(' · the platform the connected app is on')
      : result.bundlePlatformSource === 'default'
        ? chalk.dim(" · this command's default, because nothing named a platform")
        : '';

  switch (bundle.outcome) {
    case 'ok':
      return `${chalk.green('compiles')} for ${bundle.platform}${alsoClause}${sourceClause}`;
    case 'broken':
      return `${chalk.red('does not compile')} for ${bundle.platform}${alsoClause}${sourceClause}`;
    case 'timeout':
      return chalk.yellow(`still building for ${bundle.platform} (timed out)`) + alsoClause;
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
  // No number at all for web, rather than a number with a caveat next to it: a reader who takes
  // one thing from this line takes the number, and for web the number is about other platforms.
  if (result.appsConnected == null) {
    return chalk.dim(`cannot be counted for web (${WEB_APPS_UNKNOWN_REASON})`);
  }
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
