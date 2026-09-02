// @ref llp/0012-build-explain.rfc.md §Two layers of phase detection
//
// Cut a build log into the steps that produced it. Pure: `string[]` in, `Phase[]` out — no file
// system, no network, no subprocess — which is what makes every rule in here testable against a
// committed log without a build running anywhere.
//
// Detection is two layers, and the second is the one that carries the feature:
//
//   Layer 1 — the phase header EAS Build puts between steps. The step *vocabulary* is real
//   [observed — `docs/pages/build-reference/ios-builds.mdx` §Remote steps and
//   `docs/pages/build-reference/android-builds.mdx` §Remote steps]; the exact decoration EAS wraps
//   a header in is not documented and no EAS log was available to record here, so the matcher
//   strips common log furniture and compares the remaining words. Deliberately loose, per
//   llp/0010 §Upstream asks: the format can change and this must degrade to layer 2 rather than
//   mis-segment.
//
//   Layer 2 — what the tools themselves print on the way in. `Analyzing dependencies` is
//   CocoaPods, `> Task :app:` is Gradle, `Command line invocation:` is xcodebuild. Every one of
//   these was read off a real log, which is why a raw `expo run:ios` or `pod install` log — the
//   thing an agent actually has on its own machine — segments exactly like an EAS one.

import type { Phase, PhaseName, PhaseStatus } from './types';

/** A rule that starts a phase at the line it matches. */
interface PhaseAnchor {
  phase: PhaseName;
  pattern: RegExp;
  /** Which layer found it, so a test can assert the two layers independently. */
  layer: 1 | 2;
}

/**
 * Log furniture that sits around a header without being part of it.
 *
 * Timestamps, stream tags and rules are what a log *transport* adds; the header is the words
 * inside them. Stripping them is what lets one table read a header whatever wrapped it.
 */
const HEADER_DECORATION = [
  // A leading ISO timestamp, with or without brackets: `[2026-08-23T10:00:00.000Z]`.
  /^\[?\d{4}-\d{2}-\d{2}[T ][\d:.]+Z?\]?\s*/,
  // A stream tag the builder prefixes lines with.
  /^\[(?:stdout|stderr|info|log)\]\s*/i,
  // Rules and bullets a header is centred in or pointed at.
  /^[\s=*#>▸▶»\-–—|]+/,
  /[\s=*#<«\-–—|]+$/,
];

/**
 * The step names EAS Build writes into its log, and the phases they are.
 *
 * This is the real format, read off a real log at last [observed — 2026-08-26, staging build
 * `77e676e2…`]: every boundary is a record whose message is `Start phase: <NAME>` or
 * `End phase: <NAME>`, and the names are SCREAMING_SNAKE rather than the prose titles
 * {@link EAS_PHASE_LABELS} guesses at. The eighteen seen in one iOS build were `SPIN_UP_BUILDER`,
 * `INSTALL_CUSTOM_TOOLS`, `PREPARE_PROJECT`, `PRE_INSTALL_HOOK`, `READ_EAS_JSON`,
 * `READ_PACKAGE_JSON`, `INSTALL_DEPENDENCIES`, `READ_APP_CONFIG`, `RUN_EXPO_DOCTOR`,
 * `PREPARE_CREDENTIALS`, `PREBUILD`, `RESTORE_CACHE`, `INSTALL_PODS`, `CLEAN_UP_CREDENTIALS`,
 * `ON_BUILD_ERROR_HOOK`, `ON_BUILD_COMPLETE_HOOK`, `UPLOAD_BUILD_ARTIFACTS` and `FAIL_BUILD`.
 *
 * Only the ones this module has a `PhaseName` for are mapped. A step with no name here opens no
 * phase, which is the safe direction: an unmapped step left unclaimed keeps the previous phase's
 * span honest, whereas inventing a boundary would move a failure into a phase it did not happen
 * in. `End phase:` is deliberately not matched — a phase is opened by its start and closed by the
 * next start, which is how the rest of this file already works.
 */
const EAS_PHASE_STEPS: Record<string, PhaseName> = {
  INSTALL_DEPENDENCIES: 'install-dependencies',
  PREBUILD: 'prebuild',
  INSTALL_PODS: 'pod-install',
  BUNDLE_JAVASCRIPT: 'bundle-js',
  RUN_GRADLEW: 'gradle',
  RUN_FASTLANE: 'fastlane',
  UPLOAD_BUILD_ARTIFACTS: 'upload',
  UPLOAD_APPLICATION_ARCHIVE: 'upload',
};

/** The `Start phase: <NAME>` marker that opens every step of an EAS Build log. */
const EAS_PHASE_MARKER = /^Start phase:\s*([A-Z0-9_]+)$/;

/** The words EAS names its steps with, from the two build-process pages of the docs. */
const EAS_PHASE_LABELS: { label: RegExp; phase: PhaseName }[] = [
  { label: /^install\s+dependencies$/i, phase: 'install-dependencies' },
  { label: /^(?:run\s+)?(?:expo\s+)?prebuild$/i, phase: 'prebuild' },
  { label: /^install\s+(?:pods|cocoapods)$/i, phase: 'pod-install' },
  { label: /^bundle\s+javascript$/i, phase: 'bundle-js' },
  { label: /^run\s+gradlew?$/i, phase: 'gradle' },
  { label: /^run\s+fastlane$/i, phase: 'fastlane' },
  { label: /^upload\s+application\s+archive$/i, phase: 'upload' },
];

/**
 * What each tool prints as it starts, in the order a build runs them.
 *
 * Every pattern here was read off a log captured on a real machine; the fixtures directory says
 * which log each one came from. A pattern that matched only a synthesized log would be a rule
 * about a format nobody has seen.
 */
const CONTENT_ANCHORS: PhaseAnchor[] = [
  // --- install-dependencies -------------------------------------------------------------------
  {
    phase: 'install-dependencies',
    layer: 2,
    pattern: /^\s*(?:[$>]\s*)?(?:npm|yarn|pnpm|bun)\s+(?:install|ci|add)\b/,
  },
  { phase: 'install-dependencies', layer: 2, pattern: /^added \d+ packages?\b/ },
  { phase: 'install-dependencies', layer: 2, pattern: /^yarn install v/ },
  { phase: 'install-dependencies', layer: 2, pattern: /^Packages: \+\d+/ },
  { phase: 'install-dependencies', layer: 2, pattern: /^Lockfile is up to date/ },
  // A package manager's own error prefix is as good a phase marker as its banner, and it is often
  // the only one there is: a captured `npm install` failure starts at `npm error code E404` with
  // no command echo above it [observed — `npm-package-not-found.log`].
  { phase: 'install-dependencies', layer: 2, pattern: /^npm (?:ERR!|error)\b/ },
  { phase: 'install-dependencies', layer: 2, pattern: /^ERR_PNPM_\w+/ },
  { phase: 'install-dependencies', layer: 2, pattern: /^error An unexpected error occurred/ },

  // --- prebuild -------------------------------------------------------------------------------
  { phase: 'prebuild', layer: 2, pattern: /^\s*(?:[$>]\s*)?(?:npx )?expo prebuild\b/ },
  {
    phase: 'prebuild',
    layer: 2,
    pattern: /^[✔✖✓×\s]*(?:Created|Creating) native director(?:y|ies)/i,
  },
  { phase: 'prebuild', layer: 2, pattern: /^[✔✖✓×\s]*Config (?:synced|sync)/i },
  { phase: 'prebuild', layer: 2, pattern: /^[✔✖✓×\s]*Finished prebuild/i },
  // Prebuild fails before it prints anything of its own: a config plugin that does not resolve
  // stops `getConfig`, so the first line of the log is the error [observed —
  // `prebuild-plugin-not-found.log`, `prebuild-plugin-threw.log`]. `PluginError` and a stack frame
  // through `@expo/config-plugins` are what is left to recognise it by.
  { phase: 'prebuild', layer: 2, pattern: /^PluginError\b/ },
  {
    phase: 'prebuild',
    layer: 2,
    pattern: /^\s*at \S+ \(\S*(?:@expo\/config-plugins|\/plugins?\/)/,
  },

  // --- pod-install ----------------------------------------------------------------------------
  { phase: 'pod-install', layer: 2, pattern: /^\s*(?:[$>]\s*)?(?:bundle exec )?pod install\b/ },
  { phase: 'pod-install', layer: 2, pattern: /^Analyzing dependencies\s*$/ },
  { phase: 'pod-install', layer: 2, pattern: /^Using Expo modules\s*$/ },
  { phase: 'pod-install', layer: 2, pattern: /^\[Expo\] Enabling modular headers/ },
  { phase: 'pod-install', layer: 2, pattern: /^Downloading dependencies\s*$/ },
  { phase: 'pod-install', layer: 2, pattern: /^Generating Pods project\s*$/ },
  // `[!]` is CocoaPods' marker and nothing else in a build log uses it. It marks warnings as well
  // as errors, so it says *where* and never *what* — which is exactly a phase anchor's job.
  { phase: 'pod-install', layer: 2, pattern: /^\[!\] / },

  // --- bundle-js ------------------------------------------------------------------------------
  { phase: 'bundle-js', layer: 2, pattern: /^Starting Metro Bundler\s*$/ },
  { phase: 'bundle-js', layer: 2, pattern: /^Welcome to Metro\b/ },
  { phase: 'bundle-js', layer: 2, pattern: /^(?:iOS|Android|Web) Bundl(?:ing|ed)\b/ },
  { phase: 'bundle-js', layer: 2, pattern: /^\s*(?:[$>]\s*)?(?:npx )?expo export\b/ },
  { phase: 'bundle-js', layer: 2, pattern: /^Writing bundle output to:/ },

  // --- gradle ---------------------------------------------------------------------------------
  { phase: 'gradle', layer: 2, pattern: /^\s*(?:[$>]\s*)?\.\/gradlew\b/ },
  { phase: 'gradle', layer: 2, pattern: /^Starting a Gradle Daemon\b/ },
  { phase: 'gradle', layer: 2, pattern: /^Welcome to Gradle\b/ },
  { phase: 'gradle', layer: 2, pattern: /^> (?:Task|Configure project|Configure settings)\b/ },

  // --- xcodebuild -----------------------------------------------------------------------------
  { phase: 'xcodebuild', layer: 2, pattern: /^Command line invocation:\s*$/ },
  { phase: 'xcodebuild', layer: 2, pattern: /^\s*(?:[$>]\s*)?xcodebuild\b/ },
  { phase: 'xcodebuild', layer: 2, pattern: /^Build settings from command line:\s*$/ },
  { phase: 'xcodebuild', layer: 2, pattern: /^note: Building targets in dependency order/ },
  { phase: 'xcodebuild', layer: 2, pattern: /^Prepare packages\s*$/ },

  // --- fastlane -------------------------------------------------------------------------------
  { phase: 'fastlane', layer: 2, pattern: /^\s*(?:[$>]\s*)?(?:bundle exec )?fastlane\b/ },
  { phase: 'fastlane', layer: 2, pattern: /^\[\d\d:\d\d:\d\d\]: Driving the lane\b/ },
  { phase: 'fastlane', layer: 2, pattern: /^Successfully loaded Appfile\b/ },

  // --- archive / upload -----------------------------------------------------------------------
  { phase: 'archive', layer: 2, pattern: /^\s*(?:[$>]\s*)?xcodebuild .*-exportArchive\b/ },
  { phase: 'archive', layer: 2, pattern: /^Exporting archive\b/i },
  { phase: 'upload', layer: 2, pattern: /^Uploading (?:the )?application archive\b/i },
];

/** Phases only one platform ever produces, so a `--platform` hint can rule the others out. */
export const PLATFORM_ONLY_PHASES: Record<'ios' | 'android', PhaseName[]> = {
  ios: ['pod-install', 'xcodebuild', 'fastlane'],
  android: ['gradle'],
};

/**
 * Whether a phase can occur on a platform.
 *
 * With no hint every phase can, which is the default: a log that names no platform is read with
 * the whole table, and a wrong guess is worse than a wide one.
 */
export function phaseAllowedOnPlatform(
  phase: PhaseName,
  platform: 'ios' | 'android' | null
): boolean {
  if (!platform) {
    return true;
  }
  const other = platform === 'ios' ? 'android' : 'ios';
  return !PLATFORM_ONLY_PHASES[other].includes(phase);
}

/** A header line with the transport's decoration taken off, or the line unchanged. */
export function stripHeaderDecoration(line: string): string {
  let text = line;
  for (const pattern of HEADER_DECORATION) {
    text = text.replace(pattern, '');
  }
  // A header EAS wrapped in brackets: `[Install dependencies]`.
  const bracketed = text.match(/^\[([^\]]+)\]$/);
  return (bracketed?.[1] ?? text).trim();
}

/**
 * The phase a line starts, or null when it starts none.
 *
 * Layer 1 is asked first: a header is a statement about the log's structure, and a tool banner is
 * only evidence of one. Exported for the unit tests, which assert the two layers separately.
 */
export function phaseAnchorFor(
  line: string,
  platform: 'ios' | 'android' | null = null
): { phase: PhaseName; layer: 1 | 2 } | null {
  const header = stripHeaderDecoration(line);
  if (header) {
    // The marker EAS actually writes, before the titles this file used to guess at.
    const marker = EAS_PHASE_MARKER.exec(header);
    if (marker) {
      const phase = EAS_PHASE_STEPS[marker[1]!];
      // A step with no `PhaseName` claims nothing, and neither does the content of the line: a
      // `Start phase:` marker is a boundary or it is nothing.
      return phase && phaseAllowedOnPlatform(phase, platform) ? { phase, layer: 1 } : null;
    }
    for (const { label, phase } of EAS_PHASE_LABELS) {
      if (label.test(header) && phaseAllowedOnPlatform(phase, platform)) {
        return { phase, layer: 1 };
      }
    }
  }
  for (const anchor of CONTENT_ANCHORS) {
    if (anchor.pattern.test(line) && phaseAllowedOnPlatform(anchor.phase, platform)) {
      return { phase: anchor.phase, layer: anchor.layer };
    }
  }
  return null;
}

/**
 * Cut a log into phases.
 *
 * Every log starts in `unknown` and stays there until something claims it, so a log that begins
 * mid-stream — the common case, since the tail is what survives truncation — is still segmented
 * from the first anchor onwards. Consecutive anchors for the phase already running do not open a
 * new segment: `> Task :app:compileDebugKotlin` follows `> Task :app:preBuild` a hundred times in
 * one Gradle run, and a hundred one-line phases would be a worse answer than one.
 *
 * @param lines the log, ANSI already stripped, one entry per line.
 * @param platform the caller's `--platform` hint, which rules out the other platform's phases.
 * @returns the segments, in order, every line of the log covered exactly once.
 */
export function detectPhases(lines: string[], platform: 'ios' | 'android' | null = null): Phase[] {
  if (lines.length === 0) {
    return [];
  }

  const phases: Phase[] = [];
  let current: PhaseName = 'unknown';
  let start = 1;

  for (let index = 0; index < lines.length; index++) {
    const anchor = phaseAnchorFor(lines[index]!, platform);
    if (!anchor || anchor.phase === current) {
      continue;
    }
    const lineNumber = index + 1;
    // A leading `unknown` run of zero lines is not a phase; every other closed segment is.
    if (lineNumber > start) {
      phases.push({ name: current, status: 'unknown', startLine: start, endLine: lineNumber - 1 });
    }
    current = anchor.phase;
    start = lineNumber;
  }

  phases.push({ name: current, status: 'unknown', startLine: start, endLine: lines.length });
  return phases;
}

/**
 * Mark the phase a failure was found in, and the ones the build plainly got past.
 *
 * A phase that a later phase started after is `succeeded` — a build only reaches its next step by
 * finishing the one before. Everything from the failing phase onward stays `unknown`, because a
 * log that stopped says nothing about what came after it, and the last phase of a log with no
 * failure in it stays `unknown` too: the log may simply have been cut off.
 *
 * @param phases the segments {@link detectPhases} produced.
 * @param failedIndex index of the failing phase, or -1 when no failure was located.
 * @returns a new array; the input is not modified.
 */
export function markPhaseStatuses(phases: Phase[], failedIndex: number): Phase[] {
  return phases.map((phase, index) => {
    let status: PhaseStatus = 'unknown';
    if (failedIndex >= 0 && index === failedIndex) {
      status = 'failed';
    } else if (index < (failedIndex >= 0 ? failedIndex : phases.length - 1)) {
      status = 'succeeded';
    }
    return { ...phase, status };
  });
}

/** The index of the phase a 1-based line number falls in, or -1 when it falls in none. */
export function phaseIndexForLine(phases: Phase[], line: number): number {
  return phases.findIndex((phase) => line >= phase.startLine && line <= phase.endLine);
}
