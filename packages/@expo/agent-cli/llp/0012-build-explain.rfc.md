# 0012: inspect:build-log, deterministic triage of a native build log

**Type:** RFC
**Status:** Active
**Systems:** `@expo/agent-cli inspect:build-log` (`src/builds/index.ts`, `src/builds/explain/`); the follow-up ladder (`src/followups/explain.ts`); the fixture corpus (`src/builds/explain/__tests__/fixtures/`); `eas-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-24
**Revised:** 2026-08-30
**Related:** [[0010-agent-conventions]], [[0006-agent-native-cli-surface]], [[0002-testing-and-evals]], [[0001-agentic-cli-on-expo-cli]], [[0016-v1-scope]]

## Summary

The command is `inspect:build-log`. Source paths stay `src/builds/`, which [[0016-v1-scope]] records as deliberate. A native build fails and prints four thousand lines. Somewhere in them is one line that says why. This command reads the log and reports that line, as a human table or as one JSON object. The report names which phase the build stopped in, a stable signature for the failure, the line number, the quoted context around it, and the command to run next.

Two properties are the whole design:

- Deterministic extraction, not summarization. The answer comes from a table of regular expressions that ships in this repository. No model, no API key, no network ([[0001-agentic-cli-on-expo-cli]] Shape 1). The same log always produces the same answer, and a fixture pins it.
- Nothing is claimed that the log does not say. Every report carries the line it came from, verbatim, with its number. A rule that only matched a tool's own "I failed" line reports `confidence: "low"` and says so.

## What ships, and what is reserved

Two input sources ship: `--file <path>` and `--stdin`. The `<build-id>` form, which would read the log of an EAS build by its id, does not. eas-cli has no `build:logs` command ([[0010-agent-conventions]] §Upstream asks).

The positional argument is reserved and reported rather than rejected as a stray. `@expo/agent-cli inspect:build-log <build-id>` is the command an agent will reach for. It has a code of its own, `BUILD_ID_UNSUPPORTED`. The message says the CLI cannot fetch a build's log, why, and the two spellings that work today. `Try: npx eas build:view <id>` prints where the log files are. Fetching by id is not in v1. See [[0017-deferred-commands]].

`source.kind` is `'file' | 'stdin'`. There is no `build` key.

Local logs are most of the value. `npx expo run:ios 2>&1 | npx @expo/agent-cli inspect:build-log --json` is the loop an agent driving a local build actually has.

`build:wait`'s follow-up naming a file rather than a build id, and why, are in [[0017-deferred-commands]].

## Two layers of phase detection

A log is cut into phases before any rule is asked about a line, because where a failure happened decides which rules can explain it. The phases are `install-dependencies`, `prebuild`, `pod-install`, `bundle-js`, `gradle`, `xcodebuild`, `fastlane`, `archive`, `upload`, and `unknown`.

**Layer 1 is the EAS phase header.** An EAS log is JSONL, one bunyan record per line. `readLog` unwraps a record to its `msg`. One line in stays one line out, so line numbers keep their meaning. Only an object with a string `msg` is unwrapped, because the same log prints the app config as JSON, and that is content rather than transport.

The step names are `Start phase: INSTALL_PODS`: a marker in SCREAMING_SNAKE, not a prose title. Those markers are matched now. Guessed prose titles stay, because a local log may still be titled that way. A step with no `PhaseName` opens no phase. Leaving an unmapped step unclaimed keeps the previous phase's span honest.

**Layer 2 is what the tools print**, and it is the layer that carries the feature. `Analyzing dependencies` is CocoaPods. `> Task :app:` is Gradle. `Command line invocation:` is xcodebuild. `iOS Bundling failed` is Metro. Every one of these was read off a log captured on a real machine, which is why a raw `pod install` or `expo run:ios` log segments exactly like a cloud one would.

Three decisions:

- Layer 1 is asked first, and may be wrong without costing anything. A header is a statement about the log's structure. A tool banner is only evidence of one. Layer 2 is complete on its own: if the header format changes tomorrow, every fixture here still segments, because none of them has a header in it.
- A phase anchor that fires while its phase is already running opens no new segment. A Gradle run prints hundreds of `> Task :` lines.
- A package manager's error prefix is a phase anchor. `npm error code E404` is the first line of a captured `npm install` failure, with no command echo above it. The same reasoning gives `PluginError` and a `@expo/config-plugins` stack frame to `prebuild`, and `[!]` to `pod-install`. `[!]` says where and never what. CocoaPods prefixes warnings with it too. There is no failure rule that matches a bare `[!]`.

A specifier in `Cannot find module` is reduced to its package: two segments when scoped, one otherwise. A deep import is not a package name.

## The rule table

The table is capped and in-repo. That cap used to live in [[0010-agent-conventions]]. This document implements it. `MAX_SIGNATURES` is a constant with a test on it. Forty is the cap. A cap nothing enforces is a preference.

Each rule is `{ signature, phase, kind, pattern, message, suggestedCommand?, docsUrl?, provenance }`.

- `signature` is a stable kebab id, such as `ios.pods.sandbox-out-of-sync`. An eval asserts the signature, never the wording.
- `suggestedCommand` is a function of the match, not a template. An unresolved `expo-camera` is `npx expo install expo-camera`. An unresolved `../utils/format` is a file to create, so that rule answers `null`.
- `provenance` is `'captured'` or `'format'`, in the shipped table rather than only in a comment, so a test can count it. `fixtures/README.md` repeats the same distinction per fixture.

### Which match wins

Two classes per phase. A `cause` is the thing that broke. A `summary` is the tool's own after-the-fact report that it stopped (`** BUILD FAILED **`, `FAILURE: Build failed with an exception.`).

The failing phase is the one the last failure marker is in, and inside it the earliest `cause` wins.

Last marker decides the phase, because a build stops where it fails, and every marker before that belongs to a step it went on past. Earliest cause decides the line, because a tool reports its own failure afterwards. Gradle's `* What went wrong:` is near the end of the log and says nothing. The compiler error twenty lines below it is the answer.

### Confidence

- `high`: a `cause` matched inside a phase the log named.
- `medium`: a `cause` matched, but no phase anchor claimed the region around it.
- `low`: only a `summary` matched. The signature names the tool that stopped and nothing about why, and `logTail` is where the answer is.

`--platform ios|android` narrows the table by ruling out the other platform's phases. With no hint every rule runs, because a wrong guess is worse than a wide one.

## Exit codes

`0`: a report was produced, and that includes `failure: null`.
`1`: no report could be produced.
`22`: what arrived is not a log at all.

"The log was read and no rule matched" is a report rather than a failure. It exits 0 carrying `failure: null` and `logTail`. The code answers did the tool work. A command that read four thousand lines and found nothing it has a rule for has done its job. This command does not join the `20`–`29` band. Its subject is a log, and a log has no outcome. The failure it reports already happened.

The exit `1` cases: a path with no file at it, a path that is a directory, a file this process may not read, and an empty source. An empty stdin exits `1` with `EMPTY_LOG` rather than reporting `failure: null`, because `failure: null` means "the log was read and nothing matched" and an empty stream means the log never arrived.

## Reading a log this process did not write

The reader streams. Bytes arrive in chunks, lines are cut out of a carry buffer, and a bounded window is kept. `fs.readFileSync` on the log is the one thing this module must never do.

Four bounds:

- The last 100,000 lines are kept, not the first. A build fails at its end.
- Lines are dropped in blocks of 10,000. Dropping one per line read is quadratic.
- A line is cut at 4,000 characters, with a visible marker.
- ANSI is stripped once, on the way in, so no rule ever has to know about colour.

Everything downstream of the reader is pure. `phases.ts`, `anchors.ts`, and `extract.ts` do no I/O.

## Is this a log at all

The input is judged as text or not. The control-character share of the first 8,192 characters decides it, counted after the ANSI codes are stripped, excluding tab, newline, and carriage return, and counting `U+FFFD`. The threshold is 2%. An undecoded brotli body is well above it. A decoded log is at 0%. The refusal quotes none of what it read. It says the share it measured, names brotli as the usual cause, and gives the decode command.

Exit 22, not 20 and not 1. Nothing about the build was measured, which is [[0010-agent-conventions]]'s "nothing was shown to be wrong and nothing was proved right". `20` would say the build failed. `0` with `failure: null` would say the build passed.

There is no magic-number check. The brotli stream format has none. The only sound test is the shape of the bytes.

## The fixtures are the feature

Twenty-three logs ship, each with an expectation next to it. `fixtures/README.md` says per file how it was produced. Twelve were captured on a real machine by breaking a real SDK 57 app in one specific way and running the real tool. Eleven were not (Gradle, signing, fastlane), because this machine had no JDK and a signing failure needs credentials a fixture must not carry. Those are written from documented output formats and marked `written`. The rules they cover carry `provenance: 'format'`. A test asserts the captured count does not fall as the table grows.

One edit was applied to every captured file, and only one: the home directory became `/Users/expo`. Nothing was reordered, normalized, or de-coloured.

Adversarial cases pin: an error word in a phase that succeeded; a log cut off mid-write; a log longer than the window; a log with no failure; ANSI; a chunk boundary in the middle of a line.

## Limits

- The rule table is small and always will be. A log outside it gets `failure: null` and `logTail`. The cap exists so that a maintainer has to argue past it.
- Patterns rot. Mitigations: versioned fixtures, `confidence: "low"` when only a summary matched, and `logTail` on every report.
- Android coverage is weaker than iOS coverage, and the fixtures README says which rules that applies to.

## Upstream asks

`eas build:logs <BUILD_ID> [--json] [--non-interactive]` is already recorded in [[0010-agent-conventions]] §Upstream asks. Until it lands, `inspect:build-log <build-id>` cannot ship.

## Testing

Unit, all against committed logs with no build running: the fixture table, the two phase layers, the table's own invariants (the cap, unique kebab ids, provenance), the streaming reader, the argument resolver, and the `--json` shape. Two tests are about the corpus: every `.log` has a `.json`, and `fixtures/README.md` names every file.

E2E, through the published bin with no TTY: `--file`, `--stdin` over a real pipe, `--json` fed to `JSON.parse`, exit 0 on a log with nothing in it, exit 1 for a file that is not there, and the reserved build-id argument reporting what it needs.
