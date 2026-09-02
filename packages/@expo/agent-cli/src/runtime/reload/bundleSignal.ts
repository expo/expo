// @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload, without CDP
// @ref llp/0021-honest-reports.rfc.md §The rules
// The proof of a reload for an app that holds **neither** list.
//
// `runtime:reload` has two proofs, and both of them are a connection to the dev server: peer churn
// on the client command socket, and a debugger target the dev server had never listed. An app on a
// cloud simulator over a tunnel had neither [observed — live staging, 2026-08-26, S11: Expo Go
// loaded this project's manifest on the session and `/json/list` stayed empty for three minutes].
// A reload that cannot be proved is reported as unproved, which is right and is also a dead end: the
// command could never exit 0 on the device it exists for.
//
// There is a third observation, and the dev server makes it. The app fetches its **bundle** over the
// tunnel — that is how it is running the project at all — and the bundler prints one line per
// finished build: `iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)` [observed —
// `packages/@expo/cli/src/start/server/metro/MetroTerminalReporter.ts`]. A detached dev server's
// output is captured (`src/dev/logFile.ts`), so a line that was not there before the relaunch and is
// there after it is a bundle the dev server served **to something, after this command acted**.
//
// **What this is evidence of, exactly.** That the dev server built and served this project's bundle
// after the mark. It is not a fact about *which* client asked: another device attached to the same
// dev server would produce the same line. That is weaker than a debugger target, and it is written
// down rather than rounded up — `verifiedBy: dev-server-bundle` is its own value, and the human
// report says what it means.
//
// **It is a fact about which platform, though, and that half was being thrown away** [F126, added
// 2026-08-28]. The reporter prefixes the platform and `readBundleLines` has always kept it, so a
// caller that named `--ios` was accepting `Android Bundled …` as proof that the iOS app came back.
// Measured with a development build on each platform on one dev server: `runtime:reload --ios`
// exited 0 quoting the Android line [observed — wave 29 live, 2026-08-28]. The unscoped weakness
// above is real and stays; this is the part of it the line itself can answer, and it is the same
// finding as F53 and F100 one signal further out.

import { readDetachedLogSync } from '../../dev/logFile';
import type { NativePlatform } from '../../plan/types';

/** How many lines of the captured log one read looks at. */
export const BUNDLE_LOG_LINES = 5000;

/** How often the log is re-read while waiting for a bundle. */
const BUNDLE_POLL_INTERVAL_MS = 400;

/**
 * One finished bundle build, as the dev server reported it.
 *
 * `Bundling failed` is deliberately **not** one of these: a build that did not finish served no
 * bundle, so counting it would let a broken reload prove itself.
 */
export interface BundleLogLine {
  /** The platform tag the reporter prefixes, e.g. `iOS`. Verbatim, so a report can quote it. */
  platform: string;
  /** Entry file the bundle was built from, as the reporter normalised it. */
  entry: string;
  /** How many modules went into it, or null when the line did not carry a count. */
  modules: number | null;
  /** The line itself, which is what a report shows as the evidence. */
  text: string;
}

/**
 * `<Platform> Bundled <time> <entry> (<n> modules)`.
 *
 * The time is matched but not kept: it is `1387ms` for a cold build and `0.4ms` for a warm one — the
 * reporter switches to microseconds under half a millisecond — and nothing here has a use for it.
 * Anchored at the start of the line so the word in prose is not a bundle.
 */
const BUNDLED_LINE =
  /^\s*(?<platform>[A-Za-z][A-Za-z0-9_.-]*)\s+Bundled\s+[\d.]+\s*(?:ms|s)\s+(?<entry>\S+)(?:\s+\((?<modules>\d+)\s+modules?\))?\s*$/;

/**
 * Whether a reporter's platform tag is the platform a caller named.
 *
 * The tag is `iOS`, `Android`, `Web` — the reporter's own casing, which is kept verbatim so a report
 * can quote it — and the flag is `ios` / `android`, so the compare is case-insensitive. An unknown
 * tag never matches: this exists to keep two platforms apart, and a tag nothing recognises is not
 * evidence about either of them.
 */
function bundleIsFor(line: BundleLogLine, platform: NativePlatform): boolean {
  return line.platform.toLowerCase() === platform;
}

/** Every finished bundle build in a run of log lines, oldest first. */
export function readBundleLines(lines: readonly string[]): BundleLogLine[] {
  const bundles: BundleLogLine[] = [];
  for (const line of lines) {
    const match = BUNDLED_LINE.exec(line);
    if (!match?.groups) {
      continue;
    }
    bundles.push({
      platform: match.groups.platform!,
      entry: match.groups.entry!,
      modules: match.groups.modules ? Number(match.groups.modules) : null,
      text: line.trim(),
    });
  }
  return bundles;
}

/** Where the log stood before the app was reloaded. */
export interface BundleSignalMark {
  /** Whether there is a captured log to watch at all. */
  available: boolean;
  /** How many finished bundles the log already held, for the report rather than for the compare. */
  bundles: number;
  /** How many lines the log had. What "after the mark" is measured against. */
  totalLines: number;
  /** Why the signal is unavailable, or null when it is. */
  reason: string | null;
}

/** Why a project with no captured output cannot be watched, said the same way everywhere. */
const NO_LOG_REASON =
  'this project has no detached dev server log, so nothing captured what the dev server served — a dev server started in a terminal writes there and not to a file';

/**
 * Read where the captured log stands right now.
 *
 * Called immediately before the app is acted on, so that everything the wait counts is output the
 * dev server produced **after** this command did something.
 */
export function markBundleSignalSync(
  projectRoot: string,
  { tail = BUNDLE_LOG_LINES }: { tail?: number } = {}
): BundleSignalMark {
  const read = readDetachedLogSync(projectRoot, tail);
  if (read == null) {
    return { available: false, bundles: 0, totalLines: 0, reason: NO_LOG_REASON };
  }
  return {
    available: true,
    bundles: readBundleLines(read.lines).length,
    totalLines: read.totalLines,
    reason: null,
  };
}

/** What watching the log for a bundle amounted to. */
export interface BundleSignalObservation {
  /** A bundle finished after the mark. The one fact this module exists to establish. */
  observed: boolean;
  /** How many did. */
  newBundles: number;
  /** The last of them, which is what a report quotes as the evidence. */
  last: BundleLogLine | null;
  /** Why nothing was observed, or null when something was. */
  reason: string | null;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
}

/**
 * Wait for the dev server to finish a bundle it did not have at the mark.
 *
 * Never throws: a log that cannot be read is an observation that did not happen, which is a thing
 * to report rather than an error to raise.
 */
export async function waitForNewBundleAsync(
  projectRoot: string,
  {
    before,
    timeoutMs,
    intervalMs = BUNDLE_POLL_INTERVAL_MS,
    tail = BUNDLE_LOG_LINES,
    signal,
    platform = null,
  }: {
    before: BundleSignalMark;
    timeoutMs: number;
    intervalMs?: number;
    tail?: number;
    /** Stop the wait because the caller's other proof answered first. */
    signal?: AbortSignal;
    /**
     * The platform the caller named, or null when they named none (F126).
     *
     * `null` counts every platform's bundles, and that is deliberate rather than a gap: narrowing a
     * run that named nothing would be this module choosing a default platform, which is exactly what
     * F53 was. The report says which platform the line it quotes was for either way.
     */
    platform?: NativePlatform | null;
  }
): Promise<BundleSignalObservation> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  const waited = () => Date.now() - startedAt;

  if (!before.available) {
    return {
      observed: false,
      newBundles: 0,
      last: null,
      reason: before.reason ?? NO_LOG_REASON,
      waitedMs: 0,
    };
  }

  let reason = `the dev server finished no bundle in the ${timeoutMs}ms after the app was relaunched, so nothing was seen to fetch the served bundle`;

  for (;;) {
    const read = readDetachedLogSync(projectRoot, tail);
    if (read == null) {
      return {
        observed: false,
        newBundles: 0,
        last: null,
        reason: NO_LOG_REASON,
        waitedMs: waited(),
      };
    }
    // A dev server restarted mid-run truncates the log, so the mark's line count is ahead of the
    // file's. Reading "everything after line 40" out of a shorter file would count that dev
    // server's own first bundle as evidence for a reload this command never caused.
    if (read.totalLines < before.totalLines) {
      return {
        observed: false,
        newBundles: 0,
        last: null,
        reason: `the captured dev server log was truncated after this command read it (${read.totalLines} lines now, ${before.totalLines} before), so it belongs to a dev server that restarted and nothing in it can be attributed to this reload`,
        waitedMs: waited(),
      };
    }

    // Only the lines the file grew by. The tail is a window on the end of the file, so the file
    // index of `lines[i]` is `totalLines - lines.length + i`.
    const firstIndex = read.totalLines - read.lines.length;
    const fresh =
      before.totalLines <= firstIndex
        ? read.lines
        : read.lines.slice(before.totalLines - firstIndex);
    // The window did not reach back to the mark, so "after the mark" cannot be established from it.
    if (before.totalLines < firstIndex) {
      reason = `the dev server wrote more than ${tail} lines since this command read its log, so which of its bundles came after the relaunch cannot be told apart`;
    } else {
      const all = readBundleLines(fresh);
      const bundles = platform ? all.filter((line) => bundleIsFor(line, platform)) : all;
      if (bundles.length > 0) {
        return {
          observed: true,
          newBundles: bundles.length,
          last: bundles[bundles.length - 1]!,
          reason: null,
          waitedMs: waited(),
        };
      }
      // Something was served and it was not for the platform this command is about. Said out loud,
      // because "no bundle finished" and "a bundle finished for the other app on this dev server"
      // send a reader to different places.
      if (platform && all.length > 0) {
        const others = [...new Set(all.map((line) => line.platform))].join(', ');
        reason = `the dev server finished ${all.length} bundle${all.length === 1 ? '' : 's'} in the ${timeoutMs}ms after the app was relaunched, and ${all.length === 1 ? 'it was not' : 'none of them was'} for ${platform} — ${others} asked, which is another app on this dev server rather than the one this command reloaded`;
      }
    }

    if (signal?.aborted) {
      return {
        observed: false,
        newBundles: 0,
        last: null,
        reason:
          'the app was seen to come back on the dev server before any bundle finished, so this watch was not needed',
        waitedMs: waited(),
      };
    }
    if (Date.now() + intervalMs >= deadline) {
      return { observed: false, newBundles: 0, last: null, reason, waitedMs: waited() };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
