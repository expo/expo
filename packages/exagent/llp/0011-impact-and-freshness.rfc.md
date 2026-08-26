# 0011: Impact and Freshness — what a change costs, and whether it can ship

**Type:** RFC
**Status:** Draft
**Systems:** `exagent impact` (`src/impact/`); the last-build record (`src/plan/lastBuild.ts`); the fingerprint CLI wrapper (`src/project/fingerprint.ts`); the project-state probe (`src/project/probe.ts`, `src/status/statusAsync.ts`); `@expo/fingerprint`; `eas-cli` `fingerprint:compare` and `build:list`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-24
**Related:** [[0004-smart-start-and-project-state]], [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0010-agent-conventions]]

## Summary

`exagent impact` answers the question an agent asks after every edit: **do I need to build again?**
And the one it should ask before every release and usually does not: **can this be shipped over the
air?** Those are two questions about two different systems, and this document's central claim is
that a tool answering both must never derive one from the other.

## Two things called impact

The word is now used twice in this package, deliberately. `src/project/impact.ts` classifies one
**package** — "what must rerun after installing this?" — and `src/impact/` classifies one
**change**. They are the same question at two scales, and [[0004-smart-start-and-project-state]]
§Sub-features already named the first one that. The module paths are what tell them apart, and
`classifyInstallImpactAsync` was left where it is rather than renamed: it is referenced by name
from `install`, from the plan engine and from llp/0004, and a rename would cost every one of those
a hop to buy a distinction the directory already makes.

## What the vocabulary actually is

The classifier's entire input is the `reasons` array on a fingerprint source, so the first job was
to establish what values exist. Read out of the sourcer [observed — `@expo/fingerprint` 0.20.9,
`src/sourcer/{Expo,Bare,PatchPackage,Packages}.ts`, 2026-08-24]:

`expoConfig`, `expoConfigExternalFile`, `expoConfigPlugins`, `expoAutolinkingIos`,
`expoAutolinkingAndroid`, `rncoreAutolinking`, `rncoreAutolinkingIos`, `rncoreAutolinkingAndroid`,
`bareNativeDir`, `bareGitIgnore`, `expoCNGPatches`, `patchPackage`, `easBuild`,
`packageJson:scripts`, and the `package:<name>` family.

**Three values that a design document listed as reasons are not reasons at all**, and a table
written from that document would have missed every real autolinking diff:

- `expoAutolinkingConfig:ios` / `:android` is the source's **`id`** [observed — `Expo.ts:395,458`];
  its `reasons` are `expoAutolinkingIos` / `expoAutolinkingAndroid`.
- `rncoreAutolinkingConfig` and its `:ios` / `:android` forms are a **`contentsId`** [observed —
  `Bare.ts:105,139,174`]; the `reasons` are `rncoreAutolinking*`.
- `expoConfigExternalFile:contentsOnly` is an **`overrideHashKey`** [observed — `Expo.ts:289`]; the
  reason stays `expoConfigExternalFile`.

The live capture is what settles it. Adding one native dependency to a real SDK 57 app produces
exactly three diff items [observed — 2026-08-24, `src/impact/__tests__/fixtures/`]:

```
added   dir      node_modules/react-native-mmkv           ["rncoreAutolinkingIos"]
added   dir      node_modules/react-native-nitro-modules  ["rncoreAutolinkingIos"]
changed contents rncoreAutolinkingConfig:ios              ["rncoreAutolinkingIos"]
```

The third item is the one that proves the point: `rncoreAutolinkingConfig:ios` appears, and it
appears under `id`, with an ordinary reason beside it. And `package:<name>` — which the same
document omitted — is in every real fingerprint as `package:react-native`, which is where a React
Native version bump lands.

The rule this leaves, and the reason the fixtures are real rather than synthesized: **the
classifier reads a vocabulary owned by another package, so its table is transcription and a test
over captured output is the only thing that keeps it honest.** One test asserts that no source in a
real fingerprint falls through to `unknown` [observed — `classify-test.ts`]; a drift between the
table and the tool fails there rather than in a user's report.

## The classifier reads `reasons`

Decision. Every reason maps to `needs-native-build`, and the nuance lives one level down.

That is not a table that lost its resolution. A fingerprint source **is** the native surface: if one
moved, the binary differs, and there is no fourth class between "the app has to be rebuilt" and "it
does not". What varies is the `ChangeKind` — `native-module`, `native-project`, `config-plugin`,
`app-config`, `build-config`, `build-scripts`, `unknown` — and that is what decides the *follow-up*,
because an autolinked module needs a prebuild and a build while an `eas.json` edit needs only a new
cloud build. The payload carries both, and the human line names the kind next to every source.

Four details are decisions rather than transcription:

- **The strongest class wins.** A diff holding one autolinked module and forty config edits needs a
  native build, and a majority rule would report the cheap one.
- **A reason this CLI has never heard of is `unknown`, and `unknown` costs a build.** The source
  moved the hash, and the hash is the native surface; reporting an unrecognised source as free is
  the one answer a caller cannot recover from. `unknown` is also the honest *name* for it, so a
  reader can see that the tool did not recognise something rather than that nothing was there.
- **The prefix families are matched after the exact table, and exact wins.** `expoConfigPlugins`
  starts with `expoConfig`, whose family is `app-config`, so a prefix-first matcher would report
  every config-plugin change as a config edit. Prefixes exist because `package:<name>` and
  `packageJson:<key>` grow without this table.
- **A `changed` item is classified from its `afterSource`.** The reasons of a source that is still
  there are what it is there for now.

## An undecided fingerprint is not an unchanged one

Decision. A platform whose comparison could not be decided reports `needs-native-build`, and the
file-level view is not consulted for it at all.

The state this is about is the ordinary one: a project on which `exagent dev` has never run a
native build has no record, so there is nothing to compare against and `fingerprintChanged` is
`null`. The first implementation treated that as falsy, fell through to the changed files, and
reported `dev-client-compatible` on a real project [observed — live, 2026-08-24, `notesapp`] — a
cheap class, on no evidence, for a project that has no build at all.

Three things are wrong with that, and one of them is a contradiction rather than a matter of taste:

- **It is a claim with nothing behind it.** The file-level classifier refines an answer the
  fingerprint already gave ("the native surface did not move, so which kind of cheap is it"). With
  no fingerprint answer there is nothing to refine, and the refinement becomes the whole verdict.
- **It contradicts `exagent dev` about the same project.** [[0004-smart-start-and-project-state]]
  §Implemented in v1 as, item 2 already fixed the direction to err in — "Unrecorded ⇒ stale: v1
  over-plans a build at worst, never under-plans" — so `dev` plans a build for exactly the project
  `impact` was calling `dev-client-compatible`. Two commands of one CLI disagreeing about one
  project is the failure mode [[0010-agent-conventions]] §The second: `dev:wait` was written for.
- **`--assert js-only` would have passed there.** A gate whose entire purpose is to be conservative
  would have been at its most permissive in the state where least is known.

So the fall-through condition is `fingerprintChanged === false` and not merely falsy, and the
per-platform reason says what happened: *whether the native surface changed could not be
established, so this reports the answer that is safe to be wrong about.* The caveat naming the
missing record rides along with it, so the reader gets the verdict and its cause together.

## When the fingerprint did not move

An empty diff is not the answer, it is the *absence* of the strongest one. The class then comes
from the changed files, and the split it makes is the one the fingerprint structurally cannot: a
file the running dev server read **once**, at start-up — `metro.config.*`, `babel.config.*`,
`.env*`, `tsconfig.json`, a lockfile — needs Metro restarted, and everything else is picked up by
Fast Refresh. That is the whole content of `dev-client-compatible`: the installed app is still the
right one, and only the bundler has to come back.

Two limits, both reported rather than only documented:

- **The file-level answer can never reach `needs-native-build`.** A file under `ios/` that the
  fingerprint did not react to is one the active preset ignores, and contradicting the stronger
  evidence would be wrong.
- **A project outside git has no file-level answer at all.** `git status --porcelain -z` is where
  the list comes from, and a fresh `create-expo-app` is not a repository, so the answer is `null`
  and the payload says the class came from the fingerprint alone.

## The record has to hold the sources

Decision. `.expo/exagent-last-build.json` stores the whole `{sources, hash}` per platform.

The v1 record stored a bare hash string, which answers "is the last build stale" and nothing else.
`fingerprint:diff` needs both sides' `sources` to say **what** changed, and "what" is the entire
value of this command over the freshness line `status` already prints.

**The read is backwards compatible in the one direction that matters.** A bare string reads as
`{hash, sources: null}` — a shape every consumer already handles, because it is what a failed
fingerprint produces. A comparison against such a record still reports whether the surface changed,
with a caveat saying it cannot report what. One consequence worth stating: reading normalizes, so
recording *one* platform rewrites the other's entry in the v2 spelling with the same meaning it had
[observed — `e2e/__tests__/dev-test.ts`].

**The size objection, measured rather than guessed** [observed — 2026-08-24, `friction/run3/notesapp`,
an SDK 57 Expo Router app, `@expo/fingerprint` 0.20.9, `balanced` preset]:

| | sources | bytes |
| --- | --- | --- |
| `--platform ios` | 59 | 25,526 |
| `--platform android` | 59 | 30,378 |
| both platforms | 79 | 43,072 |

~56 KB for a two-platform record. No gzip, no subset, no second file — only `JSON.stringify`
without indentation, which is a third of the bytes back for a file nobody reads by hand. A project
where this grows unreasonably loses a *comparison* and never a command: the record is advisory by
the same contract llp/0004 gave it.

**`status --json` explicitly drops the sources**, in one line, where it builds `probe` [observed —
`src/status/statusAsync.ts`]. `status` promises to be instant and small, its freshness section is a
hash comparison, and tens of thousands of bytes of sources in a report that has nothing to say
about any of them would be a regression paid by every caller. `impact` fingerprints for itself.

## The three comparisons

**`last-build` (default).** Fingerprint the working tree per platform, diff against the record.
The question an agent asks most.

**`eas-build` (`--build <id>`).** `eas fingerprint:compare --build-id <id> --json
--non-interactive`. Server ground truth, needing no local record, so it answers for a build this
machine never ran — which is the more useful mode, because most builds are made in the cloud and
leave nothing behind locally.

Decision: **this runs once per command, not once per platform.** `eas fingerprint:compare` takes no
platform [observed — eas-cli README, v22.2.0], and that is not an omission: a build was made for
exactly one platform, and which one is a fact about the build rather than a question to ask. So
`PlatformImpact.platform` is nullable, and `null` means "the comparison was not per-platform".
`--platform ios --build <id>` fills it in, because then the caller said so. The alternative —
looping the platforms — would have spawned the identical command twice and reported one answer as
two.

**`fingerprint:compare --json` does not print a diff** [observed — 2026-08-26, eas-cli 22.4.0,
signed in; recorded in `src/__fixtures__/eas/fingerprint-compare.json`]. It prints
`{ fingerprint1, fingerprint2 }`, each a whole `{ hash, sources }`. For `--build-id`, `fingerprint1`
is the build's fingerprint and `fingerprint2` is the one it computed from the working directory;
for two positional hashes it is the same shape with the same ordering. The guess this section
recorded — that eas-cli depends on `@expo/fingerprint`, so the payload would be a
`FingerprintDiffItem[]` — **was wrong**, and against the real service the parser found neither a
diff nor a hash under any of the keys it tried, so `impact --build <id>` answered with a caveat
carrying a megabyte of payload and nothing else. That is worse than the failure this design
anticipated: the fallback preserved "whether", and here even "whether" was lost, because the hashes
were not where the fallback looked either.

Resolution: **the diff is produced locally.** The payload carries both sides' `sources`, which is
exactly what `fingerprint:diff` takes, so `compareWithEasBuildAsync` hands the pair to the
project's own fingerprint CLI — the same call the `last-build` mode already makes. The two hashes
are the server's answer to "did anything change" and the diff is a local elaboration of it, so a
diff that could not be produced (no `@expo/fingerprint` in the project) costs the detail and not
the verdict: `fingerprintChanged` still comes from the hashes, and the failure rides along as a
caveat.

The older guesses stay in the parser as fallbacks, and the tail-carrying caveat stays behind them.
Not because the shape is still in doubt, but because it is another CLI's payload across a process
boundary: a shape that moves again should degrade to "whether" rather than to nothing, which is the
lesson this round actually taught.

**`git-refs` (`--base <ref>`) is not implemented**, and says so rather than approximating: exit 1,
`IMPACT_MODE_UNAVAILABLE`. Materializing a ref means a linked work tree borrowing *this* tree's
`node_modules`, so a revision whose dependencies differ would be fingerprinted against the wrong
module tree — an answer that looks exact and is not, which is worse than no answer. `--build <id>`
answers the same question exactly, and the error names it. The upstream ask that would make this
cheap is `@expo/fingerprint --git-ref`, already recorded in [[0010-agent-conventions]] §Upstream
asks.

## The build-cache lookup

`eas build:list --platform <p> --fingerprint-hash <hash> --status finished --limit 1 --json
--non-interactive`, run whenever a build would otherwise be needed and a hash and an `eas` are both
in hand. A hit turns "you need a native build" into "a finished build already exists for this exact
fingerprint", which is minutes saved, and the follow-up becomes `eas build:download` rather than a
new build. This closes the "No build-cache lookup" approximation of
[[0004-smart-start-and-project-state]] §Implemented in v1 as, item 2.

**It can never fail the command.** No EAS CLI, no account, no network, a timeout, an unrecognised
payload — every one answers `null`, read as "no cached build was found" and never as "there is
none". The report is complete without it, and a network blip must not turn an information command
into an error. `resolveEasCli` (nullable) exists for exactly this, beside the throwing
`resolveEasCliOrThrow` that `deploy` and `build:wait` use.

`--status finished` is load-bearing: a queued or errored build with the same fingerprint is not a
build anyone can install.

## Two commands, one classifier

Decision [confirmed — Kudo, 2026-08-26]. The classification this RFC designed is now read from two
places, and the split between them is the one `git` makes: `exagent status` is the **reflex** and
`exagent impact` is the **gate**.

`status` grew an always-on `impact` line — the class and the sentence that says what carried it —
because it was reporting `stale` and making the reader run a second command to learn what to do about
it. [[0004-smart-start-and-project-state]] §The impact headline is free, the explanation is not has
the cost argument and the measurements; what belongs here is what it means for *this* command.

**`impact` is not diminished, it is scoped.** What only it does:

- **`--assert <class>`**, which is the whole of CI gating and cannot move: it exists to exit
  non-zero, and `status` exits 0 by contract.
- **`--build <id>` and `--base/--head`**, the comparisons against something other than the local
  record — a cloud build, two git revisions. `status` compares the working tree against
  `.expo/exagent-last-build.json` and nothing else, because that is the only base it has for free.
- **Per-platform fingerprints.** `impact` runs `fingerprint:generate --platform <p>`; the `status`
  probe runs it with no platform, so its headline cannot separate an `ios/` change from an `android/`
  one.
- **The tool's own diff.** `impact` spawns `fingerprint:diff`; `status` reproduces it in process
  (`src/project/localDiff.ts`), pinned against a recorded real diff.

**Where the two disagree on purpose.** For a project with nothing recorded — or a v1 record holding
only a hash — `impact` answers `needs-native-build` and `status` answers `class: null`. Both are
right for what they are. A gate has to name a class because `--assert` compares against one and
"unknown" cannot be gated on, so `impact` takes the conservative reading and over-plans at worst
(§The three comparisons). A report must not, because its `unknown`s are load-bearing everywhere else
in it. `src/impact/fromRecord.ts` is where that difference is written down, and it is the only
classification path that returns a nullable class.

**The everyday pointer to `impact` is gone, and one deliberate pointer replaces it.** `status` names
`npx exagent impact --assert js-only` in its `--help` and nowhere else — not in the report, not in a
follow-up. A report that ended by suggesting another command for the question it had just answered
would be admitting it had not answered it.

### The build-cache lookup answers in three states

Added 2026-08-26, when [[0004-smart-start-and-project-state]] §The EAS build lookup, and why it is
opt-in gave the lookup a second caller. `impact` folds "EAS has no such build" and "nobody could
ask" together on purpose — it is *decorating* a report that is complete without either, so both lead
to the same follow-up ladder. `status` cannot: its whole contract is that a reader knows whether a
missing answer was established or merely assumed, which is the same rule its `auth`, `device` and
`ready` lines already follow.

So `lookUpCachedBuildAsync` is the primitive and answers `{ state: 'found', build }`,
`{ state: 'none' }`, or `{ state: 'unknown', reason }`, and `findCachedBuildAsync` is the two-state
wrapper `impact` keeps reading — same argv, same parser, same "never fails the command", byte for
byte the same behaviour. Only an **empty list from an exit-0 run** is `none`; output this CLI cannot
parse is `unknown`, because a shape that moved upstream must never be reported as a fact about an
account.

The reason of a refusal is read off **stdout before stderr**, which is the opposite of the usual
order and is what the CLI does: an unlinked project gets the whole explanation on stdout and only
`Error: build:list command failed.` on stderr [observed — live, 2026-08-26; recorded as
`src/__fixtures__/eas/build-list-unconfigured.json`].

## A fingerprint change is not "OTA-unsafe"

**This section is the normative one.** `ota.safe` comes from the resolved `runtimeVersion` policy,
and never from the class.

A fingerprint answers "does the native binary differ". OTA safety answers "would an update
published now reach builds that can run it". The two coincide under exactly one policy:

| policy | fingerprint changed | `ota.safe` |
| --- | --- | --- |
| `fingerprint` | anything, including undecidable | `true` |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | `true` | `false` |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | `false` | `true` |
| `appVersion` / `sdkVersion` / `nativeVersion` / a literal | undecidable | `null` |
| a policy this CLI does not know | anything | `null` |
| nothing resolved | anything | `null` |

Under `fingerprint` the runtime version moves with the native surface, so EAS Update will not serve
a build a bundle it cannot run. Under every other policy it does **not** move: a native module added
without an app-version bump keeps the same runtime version, the update is offered to installed
builds that lack the native code, and the app crashes on a module that is not there. That is the
failure this command exists to catch, and a tool that derived `safe` from `class` would report it
backwards — it would say "unsafe" for a `needs-native-build` under `fingerprint`, which is the one
policy where a native change is *safest*.

Three decisions inside that:

- **`null` is not `false`.** A report that could not see the policy has not established that an
  update is unsafe any more than that it is safe, and a `false` there would be as much an invention.
  The same discipline as `bundle.ok: null` in [[0010-agent-conventions]] §The gate has to ask about
  the _project_.
- **A policy this CLI has never heard of is `null`, and is reported verbatim.** Whether it tracks
  the native surface decides the answer, so nothing is claimed about one that has not been read.
- **`why` is always a sentence, whatever the verdict**, because the verdict is a boolean about a
  mechanism most readers have not thought about, and a bare `false` teaches nobody why.

**Resolving the policy closes an older follow-up.** `expo config --json --type public` is a
subprocess that evaluates a dynamic `app.config.js` with its environment, which is the only way to
read the runtimeVersion of a project whose config is code. [[0004-smart-start-and-project-state]]
§Implemented in v1 as, item 7 recorded that config was read from static files only and that
resolving it needed exactly this subprocess. A static-config read is the fallback when the
subprocess fails, and `source: null` when neither answered.

One thing found while wiring it, worth recording because it would have failed silently: **the Expo
CLI writes its own structured event lines to stdout ahead of the answer**, so a parser slicing from
the first `{` reads an event and then fails on the rest of the stream, reporting no runtimeVersion
at all — and therefore `ota.safe: null` on every run of a healthy project. The parse is the same
"last JSON line wins" rule `parseFingerprint` uses, with the whole tail as a fallback for a
pretty-printed payload.

## Precision limits, reported and not only documented

Every one of these is a string in `caveats` on the payload, because the reader of the payload is the
one who has to know them.

- **The preset is part of the question, and it is reported without being passed.** `strict` /
  `balanced` / `relaxed` change what counts as a source [observed — `FingerprintPreset`], so both
  sides must use one and the payload always says which. A comparison across two presets is a diff
  of the settings.

  **`--preset` is forwarded only when the caller names it**, and that is not a stylistic choice:
  the flag exists in this monorepo's `@expo/fingerprint` source and **not** in the version the
  registry serves. A real SDK 57 project on 0.20.9 answers `unknown or unexpected option:
  --preset` and exits non-zero [observed — live, 2026-08-24], so sending it unasked would have
  broken this command against essentially every project that exists today. This is the general
  hazard of the process boundary of [[0001-agentic-cli-on-expo-cli]] §Constraints, in its most
  concrete form: *the source in this repository is not the CLI the user has*, and a surface read
  from `cli/src/commands/*.ts` is a claim about an unreleased version. A caller who does pass
  `--preset` to a CLI too old for it gets an error naming the CLI's age rather than their project.
- **A fingerprint change is not the same as "needs prebuild".** `.easignore`, `eas.json` and
  `package.json` `scripts` move the hash without changing generated native code. The class is still
  `needs-native-build` — a new cloud build is genuinely required — and the `ChangeKind` and the
  sentence both say prebuild is not.
- **`node_modules` is the fingerprint's substrate.** Autolinking sources come from the installed
  tree, so any answer is about this working tree and no other revision. This is the same fact that
  makes `--base` dishonest.
- **`--profile` is reported and not applied.** The local `fingerprint` CLI has no way to apply an
  `eas.json` profile's environment variables; only `eas fingerprint:generate --build-profile` does.
  A dynamic `app.config.js` reading `process.env` can therefore fingerprint differently under a
  build profile than it does here, and the payload says so whether or not a profile was named.
- **A v1 record answers "whether", not "what".** Stated above; it is a caveat too.

## Command surface and exit codes

Top-level verb, per the [[0006-agent-native-cli-surface]] naming rule: `expo` has no `impact`
command, so there is no behaviour for the name to have to match. One `topLevelCommands` entry, one
name in the Develop help section, `positionalArgs: 'own'` with the resolver rejecting a stray one —
the argument a caller is most likely to type there is a build id, so the hint names `--build`
([[0010-agent-conventions]] §Registry rules (d)).

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | a report was produced, and the assertion held if one was made |
| `20` | `--assert` was given and the real class is stronger than it |
| `1` | the tool could not do its job: bad flag, no fingerprint CLI, an unreadable build |

Decision [deviating from the cluster plan, which said `1`]. **A failed `--assert` is `20`, not
`1`.** [[0010-agent-conventions]] §Exit codes reserves `20`–`29` for "the tool worked and the
operation failed", and this is exactly that shape: the classification ran, the report is complete
and printed, and the gate the caller opted into did not pass. `1` is the band for "the tool did not
work: fix the call", and there is nothing about the call to fix — an agent reading `1` would go
looking for a usage mistake it did not make. `runtime:errors --fail-on-error` already uses `20` for
the identical shape, and `impact --assert` is the same flag under another name.

Without `--assert` the command is `0` always, like `status` and for the same reason: it is
information, not judgment.

The whole report still prints on the run that exits `20`. The exit code is the answer and the
payload is why; losing either makes the gate unreadable.

## Testing

Per [[0002-testing-and-evals]], and the shape the vocabulary forces:

**Unit.** The classifier over every value in §What the vocabulary actually is, one case each, plus
the mixed diffs where the strongest class must win, the empty diff, an unrecognised reason, an
unreleased member of each prefix family, and the exact-beats-prefix case. The `runtimeVersion` ×
`fingerprintChanged` matrix in full — every policy against `true` / `false` / `null`. The option
resolver over each conflict. The subprocess argv of `fingerprint:generate`,
`fingerprint:diff`, `fingerprint:compare` and `build:list`, asserted against mocks. The `--json`
key set, pinned at the top level and per platform.

**Fixtures are real, and trimmed with the trimming stated.** `notesapp-ios-diff.json` is a whole
untrimmed `fingerprint:diff`; `notesapp-ios-sources.json` keeps one source per distinct `reasons`
combination of a real 59-source fingerprint and says in its README that its `hash` therefore does
not correspond to its `sources`. The provenance note records the SDK, the fingerprint version, the
preset, the exact commands, and that the project was restored and re-hashed to prove it.

**E2E.** Stub `fingerprint` covering **both** commands — so the temp-file dance of
`fingerprint:diff` is exercised rather than mocked away, and the test asserts both temp files are
gone afterwards — plus a stub `eas` recording its argv. Each exit code gets a test of its own,
including that the full report still prints on the `20`. The v1 record and the v2 record each get
one, because backwards compatibility is a property of the file on disk. The `cli:impact` event is
asserted from the JSONL stream, and `--json` is fed to `JSON.parse` rather than matched as a
substring.

**Eval (tier 1/2):** "I added expo-camera — do I need a new build?", graded on `class` in `--json`
and on `ota.safe`, not on wording.

## Open questions

1. ~~The `--json` shape of `eas fingerprint:compare`.~~ **Answered** [observed — 2026-08-26]: it is
   a pair of whole fingerprints and the diff is this CLI's to produce. See above.
2. `--base <ref>`, which needs either `@expo/fingerprint --git-ref` or an honest `--reinstall`.
   Neither is free, and `--build` covers the common case.
3. Whether `status` should gain a `Try: npx exagent impact` rung. The two do not overlap — `status`
   answers "is the last build stale" and `impact` answers "why, and what does it cost" — but the
   follow-up ladder is [[0009-smart-followups]]'s to decide.
