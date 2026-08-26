# `inspect:build-log` fixtures

Every `.log` here is an input to the extractor and every `.json` next to it is what the extractor
must answer for it. `extract-test.ts` asserts the pair; `explainAsync-test.ts` asserts that neither
half is ever orphaned and that every file is listed below.

**The distinction this file exists for: which of these are recordings, and which are
constructions.** A rule written from a log nobody has seen is a guess with a test around it, and a
reader has to be able to tell the two apart without running anything. The
`provenance` field on each rule in `../../anchors.ts` says the same thing per rule.

- **captured** — the output of a real tool, run on this machine on 2026-08-24, redirected to a
  file. The only edit is the one noted under *What was changed* below.
- **composed** — two or more captured logs concatenated, to make a case that needs more than one
  phase in it. No line was written by hand.
- **derived** — a captured diagnostic from a real compiler, placed inside a build-driver frame that
  was written by hand, because capturing the driver would have meant a full native build.
- **written** — no capture. The lines follow the tool's documented or well-known output format.
  These are the fixtures a reviewer should be most sceptical of.

## What was captured, and how

The Expo app is `friction/run3/notesapp` — a real SDK 57 project, Expo Router, 29 dependencies —
copied to a scratch directory per capture, broken in one specific way, and run. The scratch copies
were deleted afterwards; the source app was never modified.

| Fixture | Provenance | Produced by |
| --- | --- | --- |
| `metro-unresolved-module.log` | captured | An import of a module that does not exist, then `npx expo export --platform ios`. Contains real ANSI colour. |
| `metro-syntax-error.log` | captured | A stray `;` inside an object literal, then `npx expo export --platform ios`. Contains real ANSI colour. |
| `npm-package-not-found.log` | captured | `npm install nonexistent-package-xyz-123` |
| `npm-no-matching-version.log` | captured | `npm install react@99.99.99` |
| `npm-peer-conflict.log` | captured | `npm install react-dom@18.3.1` in a project pinned to `react@17.0.2` |
| `prebuild-plugin-not-found.log` | captured | A plugin name no package provides, added to `app.json`, then `npx expo prebuild --platform ios --no-install` |
| `prebuild-plugin-threw.log` | captured | A local plugin that throws, added to `app.json`, then `npx expo prebuild --platform ios --no-install` |
| `pod-install-spec-not-found.log` | captured | A real `npx expo prebuild --platform ios`, one nonexistent pod appended to the generated `ios/Podfile`, then `pod install`. 180 lines of real Expo pod install output before the failure. |
| `pod-install-invalid-podfile.log` | captured | A `Podfile` whose `require_relative` names a file that is not there, then `pod install` |
| `xcodebuild-pods-out-of-sync.log` | captured | A real `npx expo prebuild --platform ios` with **no** `pod install` after it, then `xcodebuild -project notesapp.xcodeproj -scheme notesapp -sdk iphonesimulator build`. Xcode 26.6, exit 65. 240 lines. |
| `swiftc-compile-errors.log` | captured | `swiftc -c` on a Swift file with two type errors in it. Xcode 26.6 toolchain. |
| `no-failure-successful-pod-install.log` | captured | A `pod install` that **succeeded** on the real prebuilt app. It prints eight `[!]` lines, every one of them a warning. This is the fixture that keeps `[!]` from being a failure rule. |
| `adversarial-warning-in-successful-phase.log` | composed | `no-failure-successful-pod-install.log` followed by `xcodebuild-pods-out-of-sync.log`. The error-shaped lines are in the phase that succeeded and the real failure is in the one after it. |
| `adversarial-truncated-mid-stream.log` | composed | The first 600 bytes of `xcodebuild-swift-compile-error.log`. Ends mid-line, with no trailing newline. |
| `xcodebuild-swift-compile-error.log` | derived | The real `swiftc-compile-errors.log` diagnostics inside an `xcodebuild` driver frame written from the structure of `xcodebuild-pods-out-of-sync.log`. |
| `xcodebuild-signing-no-team.log` | written | Xcode's `error: Signing for "X" requires a development team.` format. |
| `xcodebuild-no-profile.log` | written | Xcode's `error: No profiles for 'X' were found` format. |
| `xcodebuild-undefined-symbols.log` | written | The linker's `Undefined symbols for architecture arm64:` / `ld: symbol(s) not found` format. |
| `gradle-kotlin-compile-error.log` | written | The Kotlin compiler's `e: file://…:line:col` format inside a Gradle `FAILURE:` block. |
| `gradle-duplicate-class.log` | written | AGP's `checkReleaseDuplicateClasses` failure format. |
| `gradle-aapt-resource-error.log` | written | AGP's `ERROR:…: AAPT: error: …` resource-linking format. |
| `gradle-javac-package-missing.log` | written | `javac`'s `error: package … does not exist` format inside a Gradle `FAILURE:` block. |
| `fastlane-export-failed.log` | written | fastlane's lane output around `error: exportArchive:`. |

## Why the Android and signing fixtures are written rather than captured

A Gradle build of a real Expo app downloads the Android Gradle Plugin, the Kotlin compiler and the
whole dependency graph before it reaches a compile error — tens of minutes and several gigabytes on
a cold machine — and this machine had no `gradle` on `PATH` and no JDK runtime (`javac` reported
`Unable to locate a Java Runtime`). A signing failure needs an Apple team, a device destination and
credentials that a fixture must not carry. Both were out of budget for this round; both are marked
`written` here and `provenance: 'format'` in the rule table, and both are the first fixtures worth
replacing with a recording when one is available.

The iOS half was affordable and so it was captured: `xcodebuild-pods-out-of-sync.log` and
`pod-install-spec-not-found.log` are real runs of a real Expo app on Xcode 26.6.

## What was changed

One substitution, applied to every captured file: the home directory `/Users/<user>` was replaced
with `/Users/expo`, so a machine's account name does not ship in the repository. Nothing else was
edited — not a line reordered, not a timestamp normalized, not an ANSI escape removed. The `exit=N`
line the capture script appended after each run was dropped, because it was the script's and not
the tool's.

## Adding one

1. Capture the log. Prefer breaking a real project over writing lines by hand; a `written` fixture
   is the fallback, not the default.
2. Save it here as `<what-broke>.log` and add a row to the table above with its provenance.
3. Write the `.json`. The quickest honest way is to run the extractor over the log, read what it
   answered, and **check it by hand against the log** before committing it — a generated
   expectation that nobody read is a test that asserts the current behaviour rather than the
   right one.
4. If it needed a new rule, add it to `../../anchors.ts` with the matching `provenance`, and update
   the uncovered-rules list in `extract-test.ts`.
