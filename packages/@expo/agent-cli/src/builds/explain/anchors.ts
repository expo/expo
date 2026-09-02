// @ref llp/0010-agent-conventions.rfc.md §`inspect:build-log`
// @ref llp/0012-build-explain.rfc.md §The rule table
//
// The rules `inspect:build-log` matches a build log against. Data, not code: every entry is a regular
// expression, a stable id, one sentence of what broke, and the command to run next. Nothing here
// does I/O and nothing here is fetched — the table ships in the repository, is capped at
// {@link MAX_SIGNATURES}, and every entry has a fixture (`__tests__/fixtures/`) with a test.
//
// The cap is the decision, not an implementation detail. llp/0017 §Not built rules out *the
// build-failure signature DB* — a hosted, growing, community-fed corpus — and llp/0010 records
// that a bounded in-repo table is the opposite of that in every dimension that made it a
// scope-out. A maintainer who wants to answer a field report by appending a rule has to argue
// past the cap first, which is the point.
//
// Two classes per phase:
//
//   `cause`   — the thing that actually broke. A file and a line, a pod that does not exist, a
//               module that did not resolve.
//   `summary` — the tool's own after-the-fact report that it failed. `** BUILD FAILED **` says
//               where the build stopped and nothing about why.
//
// The earliest `cause` inside the failing phase beats every `summary`, which is what keeps
// Gradle's trailing `* What went wrong:` from burying the Kotlin `e: … error:` line that caused
// it (llp/0012 §Which match wins).

import { PROGRAM_PREFIX } from '../../programName';
import type { PhaseName } from './types';

/**
 * How many rules this table may hold.
 *
 * A number, in code, with a test on it: the cap of llp/0010 §`inspect:build-log` is only a cap if
 * something enforces it. Raising it is a decision to record in that document, not an edit to make
 * while adding a rule.
 */
export const MAX_SIGNATURES = 40;

/** Where a rule's pattern came from, which the fixtures README repeats per fixture. */
export type AnchorProvenance =
  /** Read off a log captured on a real machine, committed under `__tests__/fixtures/`. */
  | 'captured'
  /**
   * Written from the tool's documented or well-known output format, because capturing it here
   * would have meant a full native build. Marked so a reader never mistakes it for a recording.
   */
  | 'format';

export interface Anchor {
  /** Stable kebab id. This is the assertable half of the contract and outlives wording changes. */
  signature: string;
  phase: PhaseName;
  kind: 'cause' | 'summary';
  pattern: RegExp;
  /** What broke, in one sentence. Written from the rule, not quoted from the log. */
  message: string;
  /**
   * The command to run next, from the capture groups of the match.
   *
   * A function rather than a template because the right next command sometimes depends on what
   * matched: an unresolved `expo-camera` is `npx expo install expo-camera`, and an unresolved
   * `../utils/format` is a file to create, which no command does for you.
   *
   * @returns the command, or null when this rule has no single right answer.
   */
  suggestedCommand?: (match: RegExpMatchArray) => string | null;
  /** The Expo docs page for this class of failure, when there is one. */
  docsUrl?: string;
  provenance: AnchorProvenance;
}

/** The troubleshooting page every native build failure is worth reading. */
const BUILD_TROUBLESHOOTING = 'https://docs.expo.dev/build-reference/troubleshooting/';

/**
 * `npx expo install <name>` for a package, and nothing for anything else.
 *
 * Two guards, both load-bearing. A *relative* specifier — `../utils/format` — is a file to create
 * and no install fixes it, so suggesting one would send a reader to run a command that fails. And
 * a capture group that did not participate in the match is `undefined`: a rule reading `match[1]`
 * without checking crashes in the middle of a report, which is the one place a rule table must
 * not be able to take the command down [observed while writing `anchors-test.ts`].
 */
function installPackage(name: string | undefined): string | null {
  if (!name || name.startsWith('.') || name.startsWith('/')) {
    return null;
  }
  return `npx expo install ${packageNameOf(name)}`;
}

/**
 * The package a module specifier belongs to.
 *
 * What a resolver names when it fails is a **specifier**, and a specifier is routinely a deep
 * import — the failure that made this necessary reads `Cannot find module
 * '@expo/expo-modules-macros-plugin/package.json'` [observed — 2026-08-26, staging build
 * `77e676e2…`, an EAS `INSTALL_PODS` failure]. Passing that through produced
 * `npx expo install @expo/expo-modules-macros-plugin/package.json`, which is not a package name and
 * fails on the reader's machine — the one thing a suggested command must never do.
 *
 * A scoped name keeps two segments (`@scope/name`) and everything else keeps one, which is npm's
 * own rule for where a package name ends and a subpath begins.
 */
function packageNameOf(specifier: string): string {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]!;
}

/**
 * The rules, most specific first.
 *
 * Order matters twice. Within one line, the first rule that matches wins, so a rule that names a
 * concrete failure must come before the generic one that would also match it. Across the log, the
 * order here is irrelevant — `extract.ts` decides by line number, not by table position.
 */
export const ANCHORS: Anchor[] = [
  // ── install-dependencies ────────────────────────────────────────────────────────────────────
  {
    signature: 'deps.package-not-found',
    phase: 'install-dependencies',
    kind: 'cause',
    // npm 10 writes `npm error`; npm 9 and earlier wrote `npm ERR!`. Both are still in logs.
    pattern: /^npm (?:ERR!|error) 404 Not Found - \w+ \S+\/([^/\s]+)/,
    message: 'A dependency does not exist in the npm registry under that name.',
    provenance: 'captured',
  },
  {
    signature: 'deps.no-matching-version',
    phase: 'install-dependencies',
    kind: 'cause',
    pattern: /^npm (?:ERR!|error) notarget No matching version found for (\S+?)\.?$/,
    message: 'A dependency was requested at a version that was never published.',
    suggestedCommand: () => 'npx expo install --check',
    provenance: 'captured',
  },
  {
    signature: 'deps.peer-conflict',
    phase: 'install-dependencies',
    kind: 'cause',
    pattern: /^npm (?:ERR!|error) ERESOLVE (?:unable to resolve dependency tree|could not resolve)/,
    message:
      'Two dependencies ask for incompatible versions of the same package, so npm produced no tree.',
    suggestedCommand: () => 'npx expo install --fix',
    provenance: 'captured',
  },
  {
    signature: 'deps.module-not-found',
    phase: 'install-dependencies',
    kind: 'cause',
    pattern: /Error: Cannot find module '([^']+)'/,
    message: 'A package required at build time is not installed.',
    suggestedCommand: (match) => installPackage(match[1]),
    provenance: 'format',
  },
  {
    signature: 'deps.install-failed',
    phase: 'install-dependencies',
    kind: 'summary',
    pattern: /^npm (?:ERR!|error) code (\S+)/,
    message: 'The dependency install failed; npm classified it but the cause is on another line.',
    provenance: 'captured',
  },

  // ── prebuild ────────────────────────────────────────────────────────────────────────────────
  {
    signature: 'prebuild.plugin-not-found',
    phase: 'prebuild',
    kind: 'cause',
    pattern: /Failed to resolve plugin for module "([^"]+)"/,
    message: 'A config plugin named in the app config could not be resolved.',
    suggestedCommand: (match) => installPackage(match[1]),
    docsUrl: 'https://docs.expo.dev/config-plugins/introduction/',
    provenance: 'captured',
  },
  {
    signature: 'prebuild.plugin-invalid',
    phase: 'prebuild',
    kind: 'cause',
    pattern: /Package "([^"]+)" does not contain a valid config plugin/,
    message: 'A package named as a config plugin does not export one.',
    docsUrl: 'https://docs.expo.dev/config-plugins/introduction/',
    provenance: 'format',
  },
  {
    signature: 'prebuild.plugin-threw',
    phase: 'prebuild',
    kind: 'cause',
    // The stack frame that names the *project's own* plugin file, which is the one a reader can
    // open. `node_modules` is excluded on purpose: every config-plugin stack runs through
    // `@expo/config-plugins/build/plugins/withStaticPlugin.js`, and pointing at that frame would
    // name the mechanism instead of the plugin. The thrown message is the line above, which the
    // reported `context.before` carries.
    pattern: /^\s*at (\w+) \((?!.*node_modules)\S*\/plugins?\/[^)]*\.js:\d+:\d+\)/,
    message: 'A config plugin in this project threw while the app config was being resolved.',
    suggestedCommand: () => `${PROGRAM_PREFIX} inspect:config-plugins`,
    docsUrl: 'https://docs.expo.dev/config-plugins/development-and-debugging/',
    provenance: 'captured',
  },
  {
    signature: 'prebuild.plugin-error',
    phase: 'prebuild',
    kind: 'summary',
    pattern: /^PluginError: (.+)$/,
    message: 'A config plugin failed while the app config was being resolved.',
    suggestedCommand: () => `${PROGRAM_PREFIX} inspect:config-plugins`,
    docsUrl: 'https://docs.expo.dev/config-plugins/development-and-debugging/',
    provenance: 'captured',
  },

  // ── pod-install ─────────────────────────────────────────────────────────────────────────────
  //
  // Every rule here is narrower than `[!]`. CocoaPods prefixes warnings with the same marker —
  // `[!] ExpoFont has added 2 script phases.` is printed by a pod install that *succeeded*
  // [observed — `pod-install-warnings-only.log`] — so a bare `[!]` rule would report a failure for
  // every Expo project on earth.
  {
    signature: 'pods.spec-not-found',
    phase: 'pod-install',
    kind: 'cause',
    pattern: /^\[!\] Unable to find a specification for [`'"]([^`'"]+)/,
    message: 'CocoaPods has no podspec under that name in any source it knows about.',
    suggestedCommand: () => 'npx pod-install --non-interactive',
    provenance: 'captured',
  },
  {
    signature: 'pods.version-conflict',
    phase: 'pod-install',
    kind: 'cause',
    pattern: /^\[!\] CocoaPods could not find compatible versions for pod [`'"]([^`'"]+)/,
    message: 'Two pods require versions of the same pod that cannot both be satisfied.',
    suggestedCommand: () => 'npx expo install --check',
    provenance: 'format',
  },
  {
    signature: 'pods.invalid-podfile',
    phase: 'pod-install',
    kind: 'cause',
    pattern: /^\[!\] Invalid `Podfile` file: (.+)$/,
    message: 'The Podfile did not evaluate, so no dependency was resolved at all.',
    suggestedCommand: () => 'npx expo prebuild --clean --platform ios',
    provenance: 'captured',
  },
  {
    signature: 'pods.install-error',
    phase: 'pod-install',
    kind: 'summary',
    pattern: /^\[!\] (?:Error installing|An error occurred while)\b/,
    message: 'CocoaPods failed while installing a pod; the cause is above this line.',
    provenance: 'format',
  },

  // ── bundle-js ───────────────────────────────────────────────────────────────────────────────
  {
    signature: 'bundle.unresolved-module',
    phase: 'bundle-js',
    kind: 'cause',
    pattern: /Unable to resolve module (\S+) from (\S+?):?\s*$/,
    message: 'Metro could not resolve an import, so the JavaScript bundle was never produced.',
    suggestedCommand: (match) => installPackage(match[1]),
    provenance: 'captured',
  },
  {
    signature: 'bundle.syntax-error',
    phase: 'bundle-js',
    kind: 'cause',
    pattern: /^(?:SyntaxError: )?SyntaxError: ([^:]+): (.+)$/,
    message: 'A source file did not parse, so the JavaScript bundle was never produced.',
    suggestedCommand: () => `${PROGRAM_PREFIX} typecheck`,
    provenance: 'captured',
  },
  {
    signature: 'bundle.transform-error',
    phase: 'bundle-js',
    kind: 'cause',
    pattern: /^(?:Error: )?TransformError (\S+): (.+)$/,
    message: 'A source file failed to transform, so the JavaScript bundle was never produced.',
    suggestedCommand: () => `${PROGRAM_PREFIX} typecheck`,
    provenance: 'format',
  },
  {
    signature: 'bundle.failed',
    phase: 'bundle-js',
    kind: 'summary',
    pattern: /^(?:iOS|Android|Web) Bundling failed\b/,
    message: 'Metro stopped without producing a bundle.',
    provenance: 'captured',
  },

  // ── xcodebuild ──────────────────────────────────────────────────────────────────────────────
  {
    signature: 'ios.pods.sandbox-out-of-sync',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^\s*error: The sandbox is not in sync with the Podfile\.lock/,
    message:
      'The installed pods do not match Podfile.lock, so Xcode refused to build against them.',
    suggestedCommand: () => 'npx pod-install --non-interactive',
    docsUrl: BUILD_TROUBLESHOOTING,
    provenance: 'captured',
  },
  {
    signature: 'ios.signing.no-team',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^\s*error: Signing for "([^"]+)" requires a development team\./,
    message: 'The Xcode target has no Apple development team, so it cannot be signed.',
    suggestedCommand: () => 'npx eas credentials --platform ios',
    docsUrl: 'https://docs.expo.dev/app-signing/app-credentials/',
    provenance: 'format',
  },
  {
    signature: 'ios.signing.no-profile',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^\s*error: No profiles for '([^']+)' were found/,
    message: 'No provisioning profile matches this bundle identifier.',
    suggestedCommand: () => 'npx eas credentials --platform ios',
    docsUrl: 'https://docs.expo.dev/app-signing/app-credentials/',
    provenance: 'format',
  },
  {
    signature: 'ios.swift.compile-error',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^(\S+\.swift):(\d+):(\d+): error: (.+)$/,
    message: 'The Swift compiler rejected a source file.',
    provenance: 'captured',
  },
  {
    signature: 'ios.clang.compile-error',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^(\S+\.(?:m|mm|c|cc|cpp|h|hpp)):(\d+):(\d+): error: (.+)$/,
    message: 'The C/Objective-C compiler rejected a source file.',
    provenance: 'format',
  },
  {
    signature: 'ios.link.undefined-symbols',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^\s*(?:ld: )?Undefined symbols?(?: for architecture (\S+))?:/,
    message: 'The linker found no implementation for a symbol something referenced.',
    suggestedCommand: () => 'npx pod-install --non-interactive',
    docsUrl: BUILD_TROUBLESHOOTING,
    provenance: 'format',
  },
  {
    signature: 'ios.script-phase-failed',
    phase: 'xcodebuild',
    kind: 'cause',
    pattern: /^Command PhaseScriptExecution failed with a nonzero exit code/,
    message: 'A build script phase exited non-zero; what it printed is above this line.',
    provenance: 'format',
  },
  {
    signature: 'ios.build-failed',
    phase: 'xcodebuild',
    kind: 'summary',
    pattern: /^(?:\*\* BUILD FAILED \*\*|The following build commands failed:)/,
    message: 'xcodebuild stopped without producing a build.',
    docsUrl: BUILD_TROUBLESHOOTING,
    provenance: 'captured',
  },

  // ── gradle ──────────────────────────────────────────────────────────────────────────────────
  {
    signature: 'android.kotlin.compile-error',
    phase: 'gradle',
    kind: 'cause',
    pattern: /^e: (?:file:\/\/)?(\S+?):(\d+):(\d+)(?::)? (?:error: )?(.+)$/,
    message: 'The Kotlin compiler rejected a source file.',
    provenance: 'format',
  },
  {
    signature: 'android.javac.package-missing',
    phase: 'gradle',
    kind: 'cause',
    pattern: /^(\S+\.java):(\d+): error: package (\S+) does not exist/,
    message: 'A Java source imports a package no dependency on the compile classpath provides.',
    provenance: 'format',
  },
  {
    signature: 'android.gradle.duplicate-class',
    phase: 'gradle',
    kind: 'cause',
    pattern: /^\s*Duplicate class (\S+) found in modules? (.+)$/,
    message: 'One class is on the classpath twice, from two different modules.',
    suggestedCommand: () => 'cd android && ./gradlew :app:dependencies',
    provenance: 'format',
  },
  {
    signature: 'android.aapt.resource-error',
    phase: 'gradle',
    kind: 'cause',
    pattern: /^\s*(?:ERROR:\s*)?(\S+): AAPT: error: (.+)$/,
    message: 'The Android resource compiler rejected a resource or a manifest entry.',
    provenance: 'format',
  },
  {
    signature: 'android.gradle.task-failed',
    phase: 'gradle',
    kind: 'summary',
    // A `summary`, not a `cause`, and the distinction is the whole rule. Gradle prints this line
    // under `* What went wrong:`, *after* the compiler output that explains it — so treating it as
    // a cause makes it win the "earliest cause in the failing phase" tie-break over the AAPT error
    // or the duplicate class twenty lines below, and the report names the task instead of the
    // reason [observed — `gradle-aapt-resource-error.log`, `gradle-duplicate-class.log`].
    pattern: /^\s*(?:> )?Execution failed for task '([^']+)'\./,
    message: 'A Gradle task failed; the reason is elsewhere in this phase.',
    provenance: 'format',
  },
  {
    signature: 'android.gradle.build-failed',
    phase: 'gradle',
    kind: 'summary',
    pattern: /^(?:FAILURE: Build failed with an exception\.|\* What went wrong:)/,
    message: 'Gradle stopped without producing an artifact.',
    docsUrl: BUILD_TROUBLESHOOTING,
    provenance: 'format',
  },

  // ── fastlane / archive / upload ─────────────────────────────────────────────────────────────
  {
    signature: 'ios.export.failed',
    phase: 'fastlane',
    kind: 'cause',
    pattern: /^\s*error: exportArchive: (.+)$/,
    message: 'Xcode built the archive and then refused to export an .ipa from it.',
    suggestedCommand: () => 'npx eas credentials --platform ios',
    docsUrl: 'https://docs.expo.dev/app-signing/app-credentials/',
    provenance: 'format',
  },
  {
    signature: 'ios.export.profile-mismatch',
    phase: 'fastlane',
    kind: 'cause',
    pattern: /Provisioning profile "([^"]+)" doesn't include signing certificate/,
    message: 'The provisioning profile was not issued for the certificate the build signed with.',
    suggestedCommand: () => 'npx eas credentials --platform ios',
    docsUrl: 'https://docs.expo.dev/app-signing/app-credentials/',
    provenance: 'format',
  },
  {
    signature: 'ios.fastlane.failed',
    phase: 'fastlane',
    kind: 'summary',
    pattern: /fastlane finished with errors/,
    message: 'fastlane stopped without producing an artifact.',
    provenance: 'format',
  },
];

/**
 * The first rule that matches a line, or null.
 *
 * @param line one line of the log, ANSI already stripped.
 * @param isPhaseAllowed a predicate that rules out the other platform's phases when the caller
 *   passed `--platform`. Its default lets every rule run, which is what a log with no hint gets.
 * @returns the rule and the match, so a caller can build the suggested command from the captures.
 */
export function anchorFor(
  line: string,
  isPhaseAllowed: (phase: PhaseName) => boolean = () => true
): { anchor: Anchor; match: RegExpMatchArray } | null {
  for (const anchor of ANCHORS) {
    if (!isPhaseAllowed(anchor.phase)) {
      continue;
    }
    const match = line.match(anchor.pattern);
    if (match) {
      return { anchor, match };
    }
  }
  return null;
}
