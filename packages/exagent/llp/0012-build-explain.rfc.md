# 0012: `inspect:build-log` — Deterministic Triage of a Native Build Log

**Type:** RFC
**Status:** Draft
**Systems:** `exagent inspect:build-log` (`src/builds/index.ts`, `src/builds/explain/`); the follow-up ladder (`src/followups/explain.ts`); the fixture corpus (`src/builds/explain/__tests__/fixtures/`); `eas-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-24
**Related:** [[0010-agent-conventions]], [[0006-agent-native-cli-surface]], [[0002-testing-and-evals]], [[0001-agentic-cli-on-expo-cli]], [[0016-v1-scope]]

> **Renamed 2026-08-26:** this command was `build:explain` until the v1 scope narrowing
> ([[0016-v1-scope]]). The `build` group it was in held one command that started nothing and one
> that waited on a build somebody else started. `build:wait` was deferred (see
> [[0017-deferred-commands]]) and this one moved to `inspect`, the group named after what the caller
> is doing. It ships marked `[experimental]`. Nothing about its behaviour, its flags or its rule
> table changed. Occurrences of the old name below are the historical record, and they are left as
> written where they quote a decision. The source paths are unchanged (`src/builds/`, which llp/0016
> records as deliberate).

## Summary

A native build fails and prints four thousand lines. Somewhere in them is one line that says why. `exagent build:explain` reads the log and reports that line, as a human table or as one JSON object. The report names which phase the build stopped in, a stable signature for the failure, the line number, the quoted context around it, and the command to run next.

Two properties are the whole design, and both are constraints rather than features:

- **Deterministic extraction, not summarization.** The answer comes from a table of regular expressions that ships in this repository. No model, no API key, no network ([[0001-agentic-cli-on-expo-cli]] Shape 1). The same log always produces the same answer, and a fixture pins it.
- **Nothing is claimed that the log does not say.** Every report carries the line it came from, verbatim, with its number. A rule that only matched a tool's own "I failed" line reports `confidence: "low"` and says so, rather than dressing a guess as a diagnosis.

## What ships, and what is reserved

Two input sources ship: `--file <path>` and `--stdin`. The `<build-id>` form, which would read the log of an EAS build by its id, **does not**, and the reason is upstream. eas-cli has no `build:logs` command ([[0010-agent-conventions]] §Upstream asks), so there is no supported way for this CLI to fetch one.

Decision [confirmed — Kudo, 2026-08-24]. The positional argument is **reserved and reported** rather than rejected as a stray. [[0010-agent-conventions]] §Registry rules (d) makes a stray positional a `BAD_ARGS` naming what was dropped, which is the right answer for an argument that is a typo. This one is not a typo. `exagent build:explain <build-id>` is the command an agent will reach for, it is the form the plan named, and it will exist. So it has a code of its own, `BUILD_ID_UNSUPPORTED`, whose message says the CLI cannot fetch a build's log yet, why, and the two spellings that work today. `Try: npx eas build:view <id>` is the command that prints where the log files are.

That reservation shapes the payload too. `source.kind` is `'file' | 'stdin'` and there is no `build` key, because a key that is always `null` for a mode that does not exist is noise a caller has to learn to ignore. When the build-id form lands it adds `source.kind: 'eas-build'`, `source.buildId` and `build`, which is an additive change to a caller reading `failure`.

**Local logs are most of the value anyway,** which is why this half shipped first with no EAS dependency at all. `npx expo run:ios 2>&1 | npx exagent build:explain --json` is the loop an agent driving a local build actually has, and half the committed fixtures came from exactly that.

## Two layers of phase detection

A log is cut into phases before any rule is asked about a line, because _where_ a failure happened decides _which_ rules can explain it. The phases are `install-dependencies`, `prebuild`, `pod-install`, `bundle-js`, `gradle`, `xcodebuild`, `fastlane`, `archive`, `upload` and `unknown`.

**Layer 1 is the EAS phase header.** The step vocabulary is real and in this repository [observed — `docs/pages/build-reference/ios-builds.mdx` §Remote steps, `docs/pages/build-reference/android-builds.mdx` §Remote steps]: install dependencies, prebuild, install pods, bundle JavaScript, run gradlew, run fastlane, upload application archive, in that order. The exact decoration EAS wraps a header in was **not documented, and no EAS build log was available to record here.** So the matcher strips common log furniture (an ISO timestamp, a `[stderr]` stream tag, a rule of `=` or `-`, a bullet, brackets) and compares the words that are left against that vocabulary. It is deliberately loose, and deliberately not load-bearing.

**An EAS log has since been read, and both halves of that guess were wrong** [observed — 2026-08-26, staging build `77e676e2…`, a failed iOS `development-simulator` build, 644 records].

The log is **JSONL**, not decorated plain text: one bunyan record per line, `{name, pid, phase, buildId, source, level, msg, time, v, logId}`. Nothing in the rule table could see through that. Patterns matched inside a JSON blob rather than against the sentence a tool printed, and each context line shown to a reader was about 400 characters of metadata wrapped around the 80 they wanted. `readLog` now unwraps a record to its `msg`, which is the narrowest place it can be done: one line in stays one line out, so line numbers keep their meaning and no other module learns the format. Only an object with a **string** `msg` is unwrapped, because the same log prints the app config as JSON, and that is content rather than transport.

The step names are **`Start phase: INSTALL_PODS`**: a marker in SCREAMING_SNAKE, not a prose title. The eighteen steps of one iOS build were `SPIN_UP_BUILDER`, `INSTALL_CUSTOM_TOOLS`, `PREPARE_PROJECT`, `PRE_INSTALL_HOOK`, `READ_EAS_JSON`, `READ_PACKAGE_JSON`, `INSTALL_DEPENDENCIES`, `READ_APP_CONFIG`, `RUN_EXPO_DOCTOR`, `PREPARE_CREDENTIALS`, `PREBUILD`, `RESTORE_CACHE`, `INSTALL_PODS`, `CLEAN_UP_CREDENTIALS`, `ON_BUILD_ERROR_HOOK`, `ON_BUILD_COMPLETE_HOOK`, `UPLOAD_BUILD_ARTIFACTS` and `FAIL_BUILD`, each opened by a `Start phase:` record and closed by an `End phase:` one. Those markers are matched now. The guessed titles stay, because they cost nothing and a local log may still be titled that way. A step with no `PhaseName` opens **no** phase, which is the safe direction: leaving an unmapped step unclaimed keeps the previous phase's span honest, where inventing a boundary would move a failure into a phase it did not happen in.

What it was worth, on that log. `phase unknown` and `confidence medium — a rule matched, but no phase claimed the lines around it` became `phase pod-install` and `confidence high — a rule matched the failing line inside a phase this log named`, with the phase list printing `unknown → install-dependencies → prebuild → install-dependencies → pod-install ✗ → upload`. The layering held exactly as designed. Layer 2 had already found the failing line without help, and layer 1 is what turned a located line into a located *phase*.

One more thing the same log corrected, in the rule table rather than in the phases. `Cannot find module` names a **specifier**, and a specifier is routinely a deep import. `Cannot find module '@expo/expo-modules-macros-plugin/package.json'` produced `npx expo install @expo/expo-modules-macros-plugin/package.json`, which is not a package name. That is a suggested command that fails on the reader's machine, the one thing the table must not produce. A specifier is now reduced to its package: two segments when scoped, one otherwise.

**Getting the log at all is harder than it should be** [observed — same date]. `build:view --json` carries `logFiles`, a Google Cloud Storage URL whose signature expires in **15 minutes**. The body is **Brotli** (`content-encoding: br`), so a plain `curl -o log.txt` writes binary that no reader can parse. `build:explain` handles that gracefully, reporting `none located` rather than crashing, but it cannot help. `logFiles` is populated **while the build is still `IN_PROGRESS`**, so a log is fetchable before there is a result. The `build:wait` follow-up that says "once the log above is saved to a file" is therefore incomplete advice, and this is the concrete argument for the reserved `build:explain <build-id>` form: fetching, decompressing and expiring are three things a reader should not have to get right by hand.

**Layer 2 is what the tools print,** and it is the layer that carries the feature. `Analyzing dependencies` is CocoaPods. `> Task :app:` is Gradle. `Command line invocation:` is xcodebuild. `iOS Bundling failed` is Metro. Every one of these was read off a log captured on a real machine, which is why a raw `pod install` or `expo run:ios` log, the thing an agent has on its own laptop, segments exactly like a cloud one would.

Three decisions inside that are decisions rather than transcription:

- **Layer 1 is asked first, and may be wrong without costing anything.** A header is a statement about the log's structure, and a tool banner is only evidence of one, so the stronger claim wins where both are present. Layer 2 is complete on its own, though: if the header format changes tomorrow, every fixture here still segments, because none of them has a header in it.
- **A phase anchor that fires while its phase is already running opens no new segment.** A Gradle run prints hundreds of `> Task :` lines, and a hundred one-line phases would be a worse answer than one.
- **A package manager's error prefix is a phase anchor.** `npm error code E404` is the _first_ line of a captured `npm install` failure, with no command echo above it, so without this rule the whole log is `unknown` and every answer from it drops to `medium` confidence [observed — `npm-package-not-found.log`]. The same reasoning gives `PluginError` and a `@expo/config-plugins` stack frame to `prebuild`, and `[!]` to `pod-install`.

`[!]` deserves its own sentence, because it is the one that could have gone wrong. It is CocoaPods' marker and nothing else in a build log uses it. But CocoaPods prefixes **warnings** with it too, and a `pod install` that succeeds on a real Expo app prints eight of them [observed — `no-failure-successful-pod-install.log`]. So `[!]` says _where_ and never _what_. It is a phase anchor, and there is no failure rule that matches a bare `[!]`.

## The rule table

The table is **capped and in-repo**, which [[0010-agent-conventions]] §`build:explain` records as a decision and this document implements. `MAX_SIGNATURES` is a constant with a test on it, because a cap nothing enforces is a preference. Thirty-four rules ship against a cap of forty. Fifteen carry `provenance: 'captured'`, and a test holds that floor as the table grows.

Each rule is `{ signature, phase, kind, pattern, message, suggestedCommand?, docsUrl?, provenance }`. Three fields are worth arguing about:

- **`signature`** is a stable kebab id, such as `ios.pods.sandbox-out-of-sync` or `android.gradle.duplicate-class`, and it is the assertable half of the contract. An eval asserts the signature, never the wording.
- **`suggestedCommand` is a function of the match, not a template.** An unresolved `expo-camera` is `npx expo install expo-camera`. An unresolved `../utils/format` is a file to create, which no command does for you, so that rule answers `null`. A rule that suggested a command for both would send a reader to run something that fails.
- **`provenance` is `'captured'` or `'format'`,** and it is in the shipped table rather than only in a comment, so a test can count it. A rule written from a documented format is a guess with a test around it. A reader has to be able to tell the two apart, and `fixtures/README.md` repeats the same distinction per fixture.

### Which match wins

Two classes per phase. A **`cause`** is the thing that broke: a file and a line, a pod that does not exist, a module that did not resolve. A **`summary`** is the tool's own after-the-fact report that it stopped: `** BUILD FAILED **`, `FAILURE: Build failed with an exception.`, `npm error code E404`.

The rule, in one sentence: **the failing phase is the one the last failure marker is in, and inside it the earliest `cause` wins.**

Both halves earn their place, and each was chosen against a fixture:

- **_Last_ marker decides the phase,** because a build stops where it fails, and every marker before that belongs to a step it went on past. This is what answers the "an error word in a phase that succeeded" case. A pod install that printed eight `[!]` warnings and then succeeded, followed by an xcodebuild that failed, reports the xcodebuild [observed — `adversarial-warning-in-successful-phase.log`, which is two real captures concatenated].
- **_Earliest cause_ decides the line,** because a tool reports its own failure afterwards. Gradle's `* What went wrong:` is near the end of the log and says nothing, and the compiler error twenty lines below it is the answer. Taking the last match would report the summary every time.

That second half is also what reclassified one rule. `Execution failed for task ':app:…'` was written as a `cause` and had to become a `summary`. Gradle prints it _under_ `* What went wrong:`, so as a cause it won the earliest-in-phase tie-break over the AAPT error and the duplicate class below it, and the report named the task instead of the reason [observed — `gradle-aapt-resource-error.log`, `gradle-duplicate-class.log`, both before and after].

### Confidence, and what it is honest about

- `high`: a `cause` matched inside a phase the log named. The line quoted is the thing that broke.
- `medium`: a `cause` matched, but no phase anchor claimed the region around it. The _what_ is as certain as ever, and only the _where_ is a guess. Raw `swiftc` output with no build driver above it is the shipped example.
- `low`: only a `summary` matched. The signature names the tool that stopped and nothing about why, and `logTail` is where the answer is.

`--platform ios|android` narrows the table by ruling out the other platform's phases: `gradle` for iOS, and `pod-install`, `xcodebuild` and `fastlane` for Android. With no hint every rule runs, which is the default, because a wrong guess is worse than a wide one.

## Exit codes

`0`: **a report was produced**, and that includes `failure: null`.
`1`: no report could be produced.
`22`: what arrived is not a log at all (see §Is this a log at all).

Decision [confirmed — Kudo, 2026-08-24]. "The log was read and no rule matched" is a **report** rather than a failure, and it exits 0 carrying `failure: null` and `logTail`. The reasoning is [[0010-agent-conventions]]'s: the code answers _did the tool work_, and a command that read four thousand lines and found nothing it has a rule for has done its job exactly. The classification lives in the payload, where an agent that has the JSON does not need the exit code to say the same thing twice.

This command deliberately does **not** join the `20`–`29` band, and the distinction is worth stating because it looks like it should. `build:wait` and `typecheck` are in the band because their subject is an operation with an outcome: a build that errored, a project that does not type-check. `build:explain`'s subject is a log, and a log has no outcome. The failure it reports already happened, to a build that already exited, long before this command ran. Exiting `20` for "the log I was handed describes a failure" would make the code mean "I did my job", every time, for every log worth passing in.

The exit `1` cases are the ones where there is genuinely nothing to report: a path with no file at it, a path that is a directory, a file this process may not read, and an **empty** source. The last is the subtle one. An empty stdin exits `1` with `EMPTY_LOG` rather than reporting `failure: null`, because the two say different things. `failure: null` means "the log was read and nothing matched", and an empty stream means the log never arrived. Reporting the first for the second tells an agent its build log is clean.

## Reading a log this process did not write

A native build log is not a small file. Xcode logs from `eas build:download --all-artifacts` run to tens of megabytes, and a Gradle run with `--debug` on can pass a hundred. So the reader **streams**: bytes arrive in chunks, lines are cut out of a carry buffer, and a bounded window is kept. `fs.readFileSync` on the log is the one thing this module must never do, and two tests assert it does not, one on the pure reader and one on the path the command actually takes.

Four bounds, each with a reason:

- **The last 100,000 lines are kept, not the first.** A build fails at its end. Truncating the head costs early phases, which the report says out loud through `truncated` and `droppedLines`. Truncating the tail would cost the answer.
- **Lines are dropped in blocks of 10,000.** Dropping one per line read is quadratic, and a 400,000-line log took a minute of it [observed while writing `extract-test.ts`]. The block is the fix, and it costs holding 110,000 lines between trims.
- **A line is cut at 4,000 characters,** with a visible marker. A bundler that inlines a source map writes one line of several megabytes, no rule reads past a few hundred characters, and one such line would otherwise cost more than the rest of the log.
- **ANSI is stripped once, on the way in,** so no rule ever has to know about colour. Two of the captured fixtures are genuinely coloured, which is what makes that testable rather than assumed.

Everything downstream of the reader is pure, taking `string[]` in and giving data out. `phases.ts`, `anchors.ts` and `extract.ts` do no I/O of any kind. That is what makes the fixture suite cheap, and what keeps "deterministic extraction" a checkable claim.

## Is this a log at all

Added after live staging validation, S8 [observed — 2026-08-26].

`inspect:build-log --file` was handed an EAS build log that had been fetched but never decoded, since
EAS serves them **brotli-encoded**. It answered **exit 0 with `failure: null`**, meaning "the log was
read and nothing failed", about a build that had errored. It then put roughly ten kilobytes of raw
control characters into `logTail`, where a terminal renders them as anything at all and a driving
agent carries them through its own context.

Both halves are fixed in the reader, before a rule ever runs:

- **The input is judged as text or not.** The control-character share of the first 8,192 characters
  decides it, counted **after** the ANSI codes are stripped, excluding tab, newline and carriage
  return, and counting `U+FFFD`. That last one is what invalid UTF-8 becomes once it has been through
  a decoder, so a compressed body caught in either state is caught by one rule. The threshold is 2%,
  and the two measurements that put it there are far from it: the undecoded response was **55%**
  control characters, and the same log decoded was **0%** [observed — staging evidence 35 and 37].
- **The refusal quotes none of what it read.** It says the share it measured, names brotli as the
  usual cause, and gives the decode command. Nothing else.

**Exit 22, not 20 and not 1.** Nothing about the build was measured, which is
[[0010-agent-conventions]]'s "nothing was shown to be wrong and nothing was proved right", the same
code `status --assert` uses for a project it cannot measure. `20` would say the build failed. `0`
with `failure: null`, which is what it did, said the build passed.

There is no magic-number check, and that is deliberate rather than an omission: the brotli stream
format has none. The observed body began `8b ff 7f 00`, which is data rather than a signature, so the
only sound test is the shape of the bytes.

**What this cannot catch:** a decoded log whose *content* is binary-ish for its first eight
kilobytes, and a compressed body small enough that the sample is mostly the text around it. The
first would be refused, which is the honest answer for it anyway. The second is bounded by the sample
being of the **start**, which is where a compressed body is compressed.

## The fixtures are the feature

[[0002-testing-and-evals]] says the tests are the product's specification; here they are also its evidence. Twenty-three logs ship, each with an expectation next to it, and `fixtures/README.md` says per file how it was produced.

**Twelve were captured on this machine on 2026-08-24**, by copying a real SDK 57 Expo app to a scratch directory, breaking it in one specific way, and running the real tool:

| What was broken                                     | What was run                              | What it proves                                                  |
| --------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| An import of a module that is not there             | `expo export --platform ios`              | `bundle.unresolved-module`, and real ANSI                       |
| A stray `;` in an object literal                    | `expo export --platform ios`              | `bundle.syntax-error`, and real ANSI                            |
| A package name nobody publishes                     | `npm install`                             | `deps.package-not-found`                                        |
| A version nobody published                          | `npm install react@99.99.99`              | `deps.no-matching-version`                                      |
| `react@17` with `react-dom@18`                      | `npm install`                             | `deps.peer-conflict`                                            |
| A plugin name no package provides                   | `expo prebuild --platform ios`            | `prebuild.plugin-not-found`                                     |
| A local plugin that throws                          | `expo prebuild --platform ios`            | `prebuild.plugin-threw`                                         |
| A pod nobody publishes, in a real generated Podfile | `pod install`                             | `pods.spec-not-found`, after 174 lines of real Expo pod install |
| A `require_relative` of a file that is not there    | `pod install`                             | `pods.invalid-podfile`                                          |
| A real prebuild with **no** `pod install` after it  | `xcodebuild … -sdk iphonesimulator build` | `ios.pods.sandbox-out-of-sync`, `** BUILD FAILED **`, exit 65   |
| Two type errors in a Swift file                     | `swiftc -c`                               | `ios.swift.compile-error`                                       |
| Nothing — a `pod install` that **worked**           | `pod install`                             | that `[!]` is not a failure                                     |

**Eleven were not,** and the reason is stated rather than hidden. A Gradle build of a real Expo app downloads the Android Gradle Plugin, the Kotlin compiler and the whole dependency graph before it reaches a compile error, and this machine had no `gradle` on `PATH` and no JDK runtime at all (`javac` answered `Unable to locate a Java Runtime`). A signing failure needs an Apple team, a device destination and credentials that a fixture must not carry. So the four Gradle fixtures, the three signing-and-linking ones and the fastlane one are written from those tools' documented output formats and marked `written`. The Swift-inside-xcodebuild one is `derived`: real `swiftc` diagnostics inside a hand-written driver frame modeled on the real xcodebuild capture. Two are `composed` from real captures with no line written by hand.

**The rules those fixtures cover carry `provenance: 'format'`, and a test asserts the captured count does not fall as the table grows.** These are the first fixtures worth replacing with a recording, and the Android half is the honest gap in this round. The iOS half was affordable, so it was captured.

One edit was applied to every captured file, and only one: the home directory `/Users/<user>` became `/Users/expo`, so an account name does not ship in the repository. Nothing was reordered, normalized or de-coloured.

### The adversarial cases, and why each exists

- **An error word in a phase that succeeded**: the composed pod-install-then-xcodebuild log above. This is the case a naive "search for `error`" gets wrong every time.
- **A log cut off mid-write**, ending without a newline. The partial last line is still a line, and it is often the interesting one.
- **A log longer than the window**: 400,000 lines, produced lazily by the test so the test never holds it either. It asserts the tail is kept, the drop is reported, and the failure at the end is still found.
- **A log with no failure in it at all**, which must answer `failure: null` and exit 0.
- **ANSI**, from the two Metro recordings rather than from a construction.
- **A chunk boundary in the middle of a line**, asserted at the unit level with a scripted stream and at the e2e level by writing a real log to a real pipe 37 bytes at a time.

## What `build:wait` says about this command, and what it does not

`build:wait` is deferred; the rung it gains here, and why that rung names a file rather than a build id, are in the `build:wait` section of [[0017-deferred-commands]].

## Limits, stated in the output rather than only here

- **The rule table is small and always will be.** It covers the failures Expo itself causes and can name precisely. A log outside it gets `failure: null` and `logTail`, which is the honest answer rather than a bug to fix by appending a rule. The cap exists so that a maintainer has to argue past it.
- **Patterns rot.** A Gradle or Xcode version bump changes wording. The mitigations are the versioned fixtures, `confidence: "low"` when only a summary matched, and `logTail` on every report whatever happened.
- **The EAS phase-header format is undocumented and unrecorded.** Layer 2 is what actually works today, and layer 1 is a bet that costs nothing if it is lost.
- **Android coverage is weaker than iOS coverage,** and the fixtures README says which rules that applies to.

## Upstream asks

`eas build:logs <BUILD_ID> [--json] [--non-interactive]` is already recorded in [[0010-agent-conventions]] §Upstream asks and this command is what it now gates: the server-side capability exists (the Expo MCP server exposes `build_logs`), and only the CLI surface is missing. Until it lands, `build:explain <build-id>` cannot ship, and the error says so in those words.

## Testing

Unit, all against committed logs with no build running anywhere: the fixture table (`extract-test.ts`), which asserts phases, the located failure and every `--all` match per log; the two phase layers separately (`phases-test.ts`); the table's own invariants — the cap, unique kebab ids, provenance, and that no rule can throw on a capture group it does not have (`anchors-test.ts`); the streaming reader against chunk boundaries, CRLF, no trailing newline, a multi-megabyte line, ANSI and the truncation window (`readLog-test.ts`); the argument resolver over every combination a caller can type (`resolveOptions-test.ts`); and the `--json` shape, whose key set must not depend on what the log held (`explainAsync-test.ts`).

Two of those tests are about the corpus rather than the code, and are the ones that keep this document true: every `.log` has a `.json` and no orphans of either exist, and `fixtures/README.md` names every file, so a fixture cannot be added without recording where it came from.

E2E, through the published bin with no TTY: `--file` against a committed log; `--stdin` over a real pipe, including one written in 37-byte chunks; `--json` fed to `JSON.parse` as the whole assertion; exit 0 on a log with nothing in it; exit 1 with the `--json` error envelope for a file that is not there; and the reserved build-id argument reporting what it needs.
