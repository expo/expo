# 0011: Impact and freshness

**Type:** RFC
**Status:** Active
**Systems:** the change classifier (`src/impact/`, the engine under `@expo/agent-cli status`); the last-build record (`src/plan/lastBuild.ts`); the fingerprint CLI wrapper (`src/project/fingerprint.ts`); the project-state probe (`src/project/probe.ts`, `src/status/statusAsync.ts`); `@expo/fingerprint`; `eas-cli` `fingerprint:compare` and `build:list`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-24
**Revised:** 2026-08-30
**Related:** [[0004-smart-start-and-project-state]], [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0010-agent-conventions]]

## Summary

This answers the question an agent asks after every edit: do I need to build again? And the one it should ask before every release: can this be shipped over the air? Those are two questions about two different systems. A tool answering both must never derive one from the other.

There is no `@expo/agent-cli impact` command. The classifier is the engine under `status`. The status UI, the `--explain` / `--assert` flags, and the exit codes of the gate live in [[0004-smart-start-and-project-state]].

## Two things called impact

`src/project/impact.ts` classifies one package, asking "what must rerun after installing this?". `src/impact/` classifies one change. They are the same question at two scales. The module paths are what tell them apart. `classifyInstallImpactAsync` was left where it is rather than renamed, because it is referenced by name from `install`, from the plan engine, and from [[0004-smart-start-and-project-state]].

## `reload` has two reasons

`classifyInstallImpactAsync` reaches `action: 'reload'` down two different paths (`resolveAction` in `src/project/impact.ts`):

1. `impact === 'js-only'`. Nothing native was added, so the native runtime is unchanged.
2. `expoGoBundled && targetsExpoGo`. Something native was added, and the runtime the project targets already contains it.

The classification was always right. The sentence beside it used to be one string: "Only JavaScript changed...". Reason 2 is conditional on the runtime. Reason 1 is not. The moment that project gains `expo-dev-client` or a native directory, `targetsExpoGo` goes false and the same package needs a build.

`reloadReason` in `src/followups/install.ts` words the rung from the reports it was already given: the js-only sentence when nothing native was added, and "Expo Go already carries `<packages>`, so no rebuild is needed for it... A project that builds its own runtime would need a new build." when something was. A set that mixes both says only what is true of the set. No new input. `impact` and `expoGoBundled` are on every report.

## What the vocabulary actually is

The classifier's entire input is the `reasons` array on a fingerprint source. Read out of the sourcer (`@expo/fingerprint` 0.20.9, `src/sourcer/{Expo,Bare,PatchPackage,Packages}.ts`):

`expoConfig`, `expoConfigExternalFile`, `expoConfigPlugins`, `expoAutolinkingIos`, `expoAutolinkingAndroid`, `rncoreAutolinking`, `rncoreAutolinkingIos`, `rncoreAutolinkingAndroid`, `bareNativeDir`, `bareGitIgnore`, `expoCNGPatches`, `patchPackage`, `easBuild`, `packageJson:scripts`, and the `package:<name>` family.

Three values that a design document listed as reasons are not reasons at all. `expoAutolinkingConfig:ios` / `:android` is the source's `id`. Its `reasons` are `expoAutolinkingIos` / `expoAutolinkingAndroid`. `rncoreAutolinkingConfig` and its `:ios` / `:android` forms are a `contentsId`. The `reasons` are `rncoreAutolinking*`. `expoConfigExternalFile:contentsOnly` is an `overrideHashKey`. The reason stays `expoConfigExternalFile`.

The classifier reads a vocabulary owned by another package, so its table is transcription. A test over captured output is the only thing that keeps it honest. One test asserts that no source in a real fingerprint falls through to `unknown`.

## The classifier reads `reasons`

Every reason maps to `needs-native-build`. The nuance lives one level down. A fingerprint source is the native surface. If one moved, the binary differs, and there is no fourth class between "the app has to be rebuilt" and "it does not". What varies is the `ChangeKind`: `native-module`, `native-project`, `config-plugin`, `app-config`, `build-config`, `build-scripts`, or `unknown`. That is what decides the follow-up. An autolinked module needs a prebuild and a build. An `eas.json` edit needs only a new cloud build.

Four details:

- The strongest class wins. A diff holding one autolinked module and forty config edits needs a native build.
- A reason this CLI has never heard of is `unknown`, and `unknown` costs a build. Reporting an unrecognised source as free is the one answer a caller cannot recover from.
- The prefix families are matched after the exact table, and exact wins. `expoConfigPlugins` starts with `expoConfig`, whose family is `app-config`, so a prefix-first matcher would report every config-plugin change as a config edit. Prefixes exist because `package:<name>` and `packageJson:<key>` grow without this table.
- A `changed` item is classified from its `afterSource`. The reasons of a source that is still there are what it is there for now.

## An undecided fingerprint is not an unchanged one

A platform whose comparison could not be decided reports `needs-native-build`. The file-level view is not consulted for it at all.

A project on which `@expo/agent-cli dev` has never run a native build has no record, so `fingerprintChanged` is `null`. Treating that as falsy and falling through to the changed files reports a cheap class on no evidence, for a project that has no build at all. It also contradicts `dev`, which treats unrecorded as stale ([[0004-smart-start-and-project-state]]). `--assert js-only` would have passed there.

The fall-through condition is `fingerprintChanged === false` rather than merely falsy. The per-platform reason says the native surface could not be established, so this reports the answer that is safe to be wrong about.

`src/impact/fromRecord.ts` is where the nullable class lives. The report answers `class: null` where nothing was established. `status --assert` exits 22 there rather than rounding `null` up to a conservative class. See [[0004-smart-start-and-project-state]].

## When the fingerprint did not move

An empty diff is not the answer. It is the absence of the strongest one. The class then comes from the changed files. A file the running dev server read once, at start-up (`metro.config.*`, `babel.config.*`, `.env*`, `tsconfig.json`, a lockfile) needs Metro restarted. Everything else is picked up by Fast Refresh. That is the whole content of `dev-client-compatible`: the installed app is still the right one, and only the bundler has to come back.

Two limits, both reported:

- The file-level answer can never reach `needs-native-build`. A file under `ios/` that the fingerprint did not react to is one the active preset ignores.
- A project outside git has no file-level answer at all. `git status --porcelain -z` is where the list comes from. The answer is `null` and the payload says the class came from the fingerprint alone.

## The record has to hold the sources

`.expo/agent-cli-last-build.json` stores the whole `{sources, hash}` per platform. A bare hash answers "is the last build stale" and nothing else. `fingerprint:diff` needs both sides' `sources` to say what changed.

The read is backwards compatible. A bare string reads as `{hash, sources: null}`. A comparison against such a record still reports whether the surface changed, with a caveat saying it cannot report what. Reading normalizes, so recording one platform rewrites the other's entry in the v2 spelling.

A two-platform record is about 56 KB. No gzip, no subset, no second file. A project where this grows unreasonably loses a comparison and never a command. The record is advisory.

`status --json` explicitly drops the sources. `status` promises to be instant and small. Its freshness section is a hash comparison.

The same sources are also in the fingerprint cache ([[0023-fingerprint-caching]]), as `{hash, sources}` per key. A warm run that kept only the hash would keep the freshness verdict and lose the diff.

## The three comparisons

**`last-build` (default).** Fingerprint the working tree per platform, diff against the record. The question an agent asks most.

**`eas-build` (`--build <id>`).** `eas fingerprint:compare --build-id <id> --json --non-interactive`. This is server ground truth and needs no local record. It runs once per command, not once per platform. `eas fingerprint:compare` takes no platform. A build was made for exactly one platform. `PlatformImpact.platform` is nullable. `null` means the comparison was not per-platform. `--platform ios --build <id>` fills it in, because then the caller said so.

`fingerprint:compare --json` prints `{ fingerprint1, fingerprint2 }`, each a whole `{ hash, sources }`. It does not print a diff. The diff is produced locally: `compareWithEasBuildAsync` hands the pair to the project's own fingerprint CLI. The two hashes are the server's answer to "did anything change". The diff is a local elaboration of it. A diff that could not be produced costs the detail and not the verdict. `fingerprintChanged` still comes from the hashes. Older guesses stay in the parser as fallbacks. A shape that moves again should degrade to "whether" rather than to nothing.

**`git-refs` (`--base <ref>`) is not implemented**, and says so rather than approximating: exit 1, `IMPACT_MODE_UNAVAILABLE`. Materializing a ref means a linked work tree borrowing this tree's `node_modules`, so a revision whose dependencies differ would be fingerprinted against the wrong module tree. `--build <id>` answers the same question exactly. The upstream ask that would make this cheap is `@expo/fingerprint --git-ref` ([[0010-agent-conventions]]).

## The build-cache lookup

`eas build:list --platform <p> --fingerprint-hash <hash> --status finished --limit 1 --json --non-interactive`, run whenever a build would otherwise be needed and a hash and an `eas` are both in hand. A hit turns "you need a native build" into "a finished build already exists for this exact fingerprint". The follow-up becomes `eas build:download` rather than a new build.

It can never fail the command. No EAS CLI, no account, no network, a timeout, an unrecognised payload: every one answers "no cached build was found" and never "there is none". `--status finished` is load-bearing: a queued or errored build with the same fingerprint is not a build anyone can install.

The lookup answers in three states: `{ state: 'found', build }`, `{ state: 'none' }`, or `{ state: 'unknown', reason }`. Only an empty list from an exit-0 run is `none`. Output this CLI cannot parse is `unknown`, because a shape that moved upstream must never be reported as a fact about an account. The reason of a refusal is read off stdout before stderr. An unlinked project gets the whole explanation on stdout.

`--platform ios` does not isolate the iOS app config. An Android-only edit can move the iOS hash. The whole-project hash still dominates, so an unchanged project hash still implies unchanged per-platform hashes.

## A fingerprint change is not "OTA-unsafe"

This section is the normative one. `ota.safe` comes from the resolved `runtimeVersion` policy, and never from the class.

A fingerprint answers "does the native binary differ". OTA safety answers "would an update published now reach builds that can run it". The two coincide under exactly one policy:

| policy                                                    | fingerprint changed             | `ota.safe` |
| --------------------------------------------------------- | ------------------------------- | ---------- |
| `fingerprint`                                             | anything, including undecidable | `true`     |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | `true`                          | `false`    |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | `false`                         | `true`     |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | undecidable                     | `null`     |
| a policy this CLI does not know                           | anything                        | `null`     |
| nothing resolved                                          | anything                        | `null`     |

Under `fingerprint` the runtime version moves with the native surface, so EAS Update will not serve a build a bundle it cannot run. Under every other policy it does not move. A native module added without an app-version bump keeps the same runtime version, the update is offered to installed builds that lack the native code, and the app crashes. A tool that derived `safe` from `class` would report it backwards: it would say "unsafe" for a `needs-native-build` under `fingerprint`, which is the one policy where a native change is safest.

Three decisions:

- `null` is not `false`. A report that could not see the policy has not established that an update is unsafe any more than that it is safe.
- A policy this CLI has never heard of is `null`, and is reported verbatim.
- `why` is always a sentence, whatever the verdict.

Resolving the policy uses `expo config --json --type public`, a subprocess that evaluates a dynamic `app.config.js` with its environment. A static-config read is the fallback when the subprocess fails, and `source: null` when neither answered. The Expo CLI writes its own structured event lines to stdout ahead of the answer, so the parse is "last JSON line wins", the same rule `parseFingerprint` uses.

## Precision limits

Every one of these is a string in `caveats` on the payload.

- The preset is part of the question, and it is reported without being passed. `strict` / `balanced` / `relaxed` change what counts as a source, so both sides must use one and the payload always says which.
- `--preset` is forwarded only when the caller names it. The flag exists in this monorepo's `@expo/fingerprint` source and not in the version the registry serves. A real SDK 57 project on 0.20.9 answers `unknown or unexpected option: --preset` and exits non-zero. Sending it unasked would have broken this command against essentially every project that exists today. This is the process boundary of [[0001-agentic-cli-on-expo-cli]] in its most concrete form: the source in this repository is not the CLI the user has. See [[0002-testing-and-evals]] §A flag is not shipped.
- A fingerprint change is not the same as "needs prebuild". `.easignore`, `eas.json`, and `package.json` `scripts` move the hash without changing generated native code. The class is still `needs-native-build`, because a new cloud build is genuinely required, and the `ChangeKind` and the sentence both say prebuild is not.
- `node_modules` is the fingerprint's substrate. Autolinking sources come from the installed tree, so any answer is about this working tree and no other revision. This is the same fact that makes `--base` dishonest.
- `--profile` is reported and not applied. The local `fingerprint` CLI has no way to apply an `eas.json` profile's environment variables. Only `eas fingerprint:generate --build-profile` does.
- A v1 record answers "whether", not "what".

## Command surface and exit codes

There is no `@expo/agent-cli impact`. Every rule below describes `@expo/agent-cli status`, which absorbed it. The status UI lives in [[0004-smart-start-and-project-state]].

| Code | Meaning                                                                          |
| ---- | -------------------------------------------------------------------------------- |
| `0`  | a report was produced, and the assertion held if one was made                    |
| `20` | `--assert` was given and the real class is stronger than it                      |
| `22` | `--assert` was given and no class could be established. Nothing to gate on       |
| `1`  | the tool could not do its job: bad flag, no fingerprint CLI, an unreadable build |

A failed `--assert` is `20`, not `1`. [[0010-agent-conventions]] §Exit codes reserves `20`–`29` for "the tool worked and the operation failed". The classification ran, the report is complete, and the gate the caller opted into did not pass. Without `--assert` the command is `0` always, because it is information rather than judgment. The whole report still prints on the run that exits `20`.

## Testing

Per [[0002-testing-and-evals]]. Unit: the classifier over every value in §What the vocabulary actually is, mixed diffs where the strongest class must win, the empty diff, an unrecognised reason, the exact-beats-prefix case, and the full `runtimeVersion` × `fingerprintChanged` matrix. Fixtures are real captures, trimmed with the trimming stated. E2E: a stub `fingerprint` covering both generate and diff, a stub `eas` recording its argv, each exit code, the v1 and v2 records, the `cli:impact` event. Eval (tier 1/2): "I added expo-camera, do I need a new build?", graded on `class` in `--json` and on `ota.safe`.
