# 0016: The v1 Surface — What Ships, What Waits, and What Is Marked Experimental

**Type:** RFC
**Status:** Final
**Systems:** the command registry (`src/commandRegistry.ts`); the reference shelf (`src/deferred/`); the suggested-command lint (`src/lint/`); `--help`; `README.md`; the `AGENTS.md` managed block (`src/agents/content.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26 (§The graduation review added 2026-08-28) · finalized 2026-08-28
**Related:** [[0017-deferred-commands]], [[0006-agent-native-cli-surface]], [[0010-agent-conventions]], [[0005-runtime-loop-tools]], [[0008-guardrails]], [[0012-build-explain]], [[0014-interaction-spike]], [[0018-interaction-commands]], [[0019-backend-parity-audit]], [[0022-live-tier]], [[0024-cli-ui]]

## Summary

Decision [confirmed — Kudo, 2026-08-26]: **cut the surface down to what a person can be handed and asked to try.** Twenty-odd commands had accumulated, each with a reason, and the reasons were individually good. What none of them answered is the question a first release asks: which of these does an agent reach for, and which are a second way to do something it already has?

So: **five areas deferred, two renamed, everything else unchanged.** Nothing here has ever been published — the whole surface is one unreleased cycle — so no user is losing a command. What is being decided is what the first one contains.

**One addition since** [confirmed — Kudo, 2026-08-26]: `runtime:tree`, `runtime:tap` and
`runtime:type`. They are not a widening of the narrowing — they are the commands
`plans/cluster-a-runtime-verify.md` gated on a live spike, and the spike came back GO
([[0014-interaction-spike]]). Driving the app is a capability the v1 surface otherwise has no
answer for at all: `navigate` opens a route and `runtime:eval` reads state, and nothing between them
presses a button. They ship marked experimental, on the same rule as `smoke`.

## The decision table

| Command                        | v1                                | Why                                                                    |
| ------------------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| `new`                          | **keep**                          | headless creation, nothing else does it                                |
| `install` / `add`              | **keep**                          | the `expo install` wrapper with the skill sync and the impact report    |
| `status` (+`--explain`/`--assert`/`--build`) | **keep**            | the read-only brief, and the only gate that costs nothing               |
| `typecheck`                    | **keep**                          | the gate no other command can be ([[0010-agent-conventions]] §The fourth) |
| `doctor` / `doctor:check`      | **keep**                          | expo-doctor, normalized                                                 |
| `dev` / `dev:stop` / `dev:logs` | **keep**                         | the plan engine, plus `--detach`, `--port`, `--wait-ready`              |
| `start`                        | **keep**                          | `expo start` and nothing else                                           |
| `navigate` (+`--print-url`, `--cloud`) | **keep**                  | the only way to open a route on a device — and, on a development build with nothing loaded, the only way to *load* one ([[0005-runtime-loop-tools]] §On a development build, `navigate` goes launcher-first) |
| `runtime:eval` / `:errors` / `:reload` / `:stop` | **keep**         | the runtime loop, cloud flags included                                  |
| `runtime:tree` / `:tap` / `:type` | **added**, marked experimental — **graduated 2026-08-28** (§The graduation review) | driving the app, gated on a live spike and taken after it returned GO ([[0014-interaction-spike]], [[0018-interaction-commands]]) |
| `smoke`                        | **keep**, marked experimental — **graduated 2026-08-28** (§The graduation review) | the whole gate in one command                                           |
| `deploy` (all platforms)       | **keep**                          | shipping, web and native                                                |
| `login` / `logout` / `whoami` / `register` | **keep**              | forwarded, with the EAS fallback of [[0006-agent-native-cli-surface]]   |
| `skills:*`, `agents:setup`     | **keep**                          | agent setup                                                             |
| forwarded `expo` set           | **keep**                          | the fixed list, unchanged                                               |
| `dev:wait`                     | **defer** ([[0017-deferred-commands]] §`dev:wait`) | `smoke` asks its questions and three more               |
| `checkpoint` + `:list` / `:undo`, and the auto-snapshots | **defer** ([[0017-deferred-commands]] §The checkpoint system) | agents manage git themselves     |
| `build:wait`                   | **defer** ([[0017-deferred-commands]] §`build:wait`) | wants to be `build --wait`, not a command             |
| `runtime:network`              | **defer** ([[0017-deferred-commands]] §`runtime:network`) | the domain is unstable and absent on Expo Go     |
| `doctor:fix`                   | **defer** ([[0017-deferred-commands]] §`doctor:fix`) | the check half is the v1 answer                       |
| `build:explain`                | **rename** → `inspect:build-log`, marked experimental — **graduated 2026-08-28** (§The graduation review) | its group held nothing else                                             |
| `config:effective`             | **rename** → `inspect:config-plugins`, marked experimental — **kept 2026-08-28** (§The graduation review) | its group was another CLI's verb                                    |

Each deferral's own reasoning is recorded with its design, which as of 2026-08-26 is one document: [[0017-deferred-commands]], one section per area, linked per row above. Each section carries a **Why** and a **re-entry criterion**, so "deferred" is a state with a way out rather than a polite deletion. The findings a deferred area made that still govern live code did **not** go there — they stayed in the LLP that made them, and each section says which and where.

## Deferred is a place, not a deletion

Every deferred area's code moves verbatim to `src/deferred/<area>/`, with a one-line header naming the date and the LLP. The property that makes it worth keeping is that it is **imported by nothing**: no registry entry loads it, no help line names it, no follow-up suggests it. A command that comes back is restored from that directory rather than rewritten from its LLP.

Three exclusions hold that property up, one per tool, and each names the directory:

- **jest** — `testPathIgnorePatterns`. The suites moved with their code and are not run: they assert against a surface this CLI no longer has, so running them would fail on the deferral itself rather than on a regression.
- **tsc** — `exclude` in `tsconfig.json`. Reference code is not held to compiling against a tree that moved on around it.
- **the suggested-command lint** — `SKIPPED_DIRECTORIES` in `src/lint/sweep.ts`. Every file there names a command the registry no longer resolves, which is exactly what that lint fails on; the point of the exclusion is that it keeps failing on it *everywhere else*.

That third one is what made this change tractable at all. The narrowing touched about a hundred printed sentences, and a `Try:` line naming a command that no longer exists is silent — it is data, not a call. The lint reads every string literal under `src/` and resolves it against the same `resolveCommand` the CLI runs, so each deferral's leftovers were a failure list to work through rather than something to find by reading.

**One thing does not move: the JSONL event declarations.** `cli:dev_wait`, `cli:runtime_network`, `cli:build_wait*` and `cli:doctor_fix_*` stay in `src/events.ts`, each annotated with the deferral. They are the schema a consumer wrote against, and a deferral is not a schema change: the command comes back emitting those fields or it comes back as something else. Nothing emits them now.

**Library internals stay where they are used.** `dev:wait` is the case that matters: `src/runtime/waitReady.ts` and `src/runtime/bundleCheck.ts` are what `smoke`, `runtime:reload` and `dev --detach --wait-ready` call, so only the command layer moved. `bundleToJson` and its payload type moved *into* `bundleCheck.ts` on the way, beside the check they describe; the type is now `BundleCheckJson` and the JSON keys are unchanged. `src/checkpoint/git.ts` split the same way — `runGitAsync` and `resolveWorkTreeAsync` are how `src/impact/` reads a diff, so they are `src/utils/git.ts` now, and the snapshot plumbing went to the shelf.

## Where a deferred command's callers were sent

The rule the narrowing had to satisfy: **a suggestion is a command the reader runs**
([[0009-smart-followups]]), so every follow-up naming a deferred command had to become one that
exists. The per-command redirects are with the designs, see [[0017-deferred-commands]].

## The `inspect` group, and why the names moved

Two commands read something a project produced and ran nothing. Both sat under a group named after another CLI's verb:

- `build:explain` was in `build`, which after `build:wait`'s deferral held one command that starts no build. The group existed to be answered with `npx eas build` when somebody typed `exagent build --platform ios` ([[0010-agent-conventions]] §Registry rules (c)) — which is a job for the absent-capability table, not for a group.
- `config:effective` was in `config`, a forwarded `expo` command, so rule (b) left it reachable by its colon form only.

`inspect` is this CLI's own name for what the caller is doing, so both spellings work again (`exagent inspect config-plugins` resolves), and it is where every read-only answer that follows belongs. The source directories keep their names — `src/builds/`, `src/config/` — because [[0012-build-explain]] and the rule fixtures reference them throughout and moving them would rewrite a hundred paths to say nothing new.

`exagent build` is now a name this CLI does not have. It answers from `absentCapabilities`: *starting a build is the EAS CLI's job*, `Try: npx eas build`, with `inspect:build-log` named as what this CLI does have. The one thing lost against the old group is the caller's own flags on that `Try:` line.

## Experimental is per command, never per group

New registry attribute [confirmed — Kudo, 2026-08-26]: a `CommandAction` or a `TopLevelCommand` may carry `unstable: true`. `--help` prints an `[experimental]` tag on that command's own line, and one footnote per section that has any: *experimental commands may change or vanish*.

It went on six commands — `inspect:build-log`, `inspect:config-plugins`, `smoke`, and the three
interaction commands `runtime:tree`, `runtime:tap` and `runtime:type` — and on **no group**. That is the whole design decision. Marking `inspect` would say something about the stable actions that join it later, which is the opposite of what is meant: the group is the durable idea, and the two commands in it today are the guesses. `smoke` is the same shape from the other end — the name is not going anywhere, and which of its eight phases belong in one command is what a first release is for finding out. The three interaction
commands are a third shape again: the mechanism under them is proved, and proved against **one app,
on one runtime, on one day** ([[0018-interaction-commands]] §Why these ship experimental), so the
names are settled and the projection and the `--verify` diff are the guesses.

`true` or absent, never `false`: a command that is not marked is the ordinary case, and `unstable: false` beside twenty entries with nothing would read as a claim somebody made rather than as the default.

**One command carries it now.** Which, and why, is the section below.

## The graduation review

[2026-08-28. The last scope decision inside v1.] Six commands shipped
`[experimental]` and the mark has no expiry, so a tag that nobody ever takes off stops being a
warning and becomes a hedge. This is the review that takes it off, one command at a time, against
what each of them has on the record rather than against how settled it feels.

### The bar

A command graduates when all three hold:

- **(a) Its behaviour contract has not changed for five waves.** The contract is the flags it
  accepts, the keys of its `--json` payload and its exit codes. Not its help text: the `--help`
  redesign of [[0024-cli-ui]] rewrote every command's help in the surface, stable ones included,
  so counting it here would reset every clock at once and measure the redesign rather than the
  command.
- **(b) It has live evidence on every platform and runtime combination it claims to support.**
  [[0019-backend-parity-audit]] §The live matrix is the register, and `filled` is the only cell that
  counts as evidence — `runnable` explicitly is not, and `by hand` is weaker than `filled` and is
  named as such wherever it is leaned on. A limit the whole surface shares (no physical device,
  no Windows at the live tier) cannot be one command's blocker.
- **(c) Every failure mode it has is honest.** No known false-green and no known false-red. A gap
  the report *states* — `confidence: "low"`, `inconclusive`, `notAttributable` — is honest by
  construction and is not a blocker. A gap the report is *silent* about is.

A command that fails any of the three keeps the mark **with a named list of what would lift it**,
below. That list is what makes "experimental" a state with a way out, in the same shape
§Deferred is a place, not a deletion gives a deferral.

### The verdict

| Command | Verdict | (a) contract | (b) live evidence | (c) honesty | If kept: what would graduate it |
| --- | --- | --- | --- | --- | --- |
| `smoke` | **graduate** | last moved wave 23; the eight phases and the 0/20/22/1 table have not moved since wave 16 | `live-local` (iOS, Expo Go), `live-android` (Expo Go, 22 asserted), `live-devclient` (Android dev build, exit 0), `live-cloud` (22 at the `runtime` phase), iOS dev build by hand | three-valued by design; F107 is narrow and the phase that carries it reports `inconclusive` with the engine named | — |
| `runtime:tree` | **graduate** | last moved wave 17 (F69, grouping by element); wave 21 added `error.data` across the whole `runtime` group | `live-local`, `live-android` (the refusal), `live-devclient`, plus the iOS dev build by hand | F63's blind `--verify` and F62's stale-bundle green are both closed and both asserted live on two platforms | — |
| `runtime:tap` | **graduate** | same as `tree` — one module, one report shape | same, and `--verify`'s text diff is `filled` on both `live-local` and `live-devclient` | as above; `handlerOutsideMatch` is reported rather than hidden | — |
| `runtime:type` | **graduate** | same as `tree` | same; `editable={false}` → 20 with `disabledOn` on both runtimes | as above; F77's three wording slips closed in the same wave | — |
| `inspect:build-log` | **graduate** | last moved wave 17 (exit 22 for a body that is not text); the rule table is capped and its `signature` ids are the assertable half | `live-eas` `filled` twice on one real staging log — undecoded → 22, decoded → the phase located and the line checked back against the file | S8, the one false-green it ever had (exit 0 `failure: null` about a build that errored), is closed against a measured threshold: 55% control characters undecoded, 0% decoded | — |
| `inspect:config-plugins` | **keep** | moved 2026-08-28, five waves ago and at the edge of the bar, on the command's first live run | `live-project` only, on one project shape; every other column is `open — no backend dimension` | F133 was a `Why:` line of pure stack frames and F132 was a report that counted `1 declared` for a config declaring three — both dishonest, both closed five waves ago | the four items below |

### Why the five graduated

**The interaction commands graduated on a criterion they wrote for themselves.**
[[0018-interaction-commands]] §What is still unverified ends: *the first friction run against a
project this did not come from is what closes those, and is the re-entry point for the
`[experimental]` mark.* That run is friction run 7, on a project `exagent new` scaffolded for it. It
cost nine findings and every one was fixed. Two live passes have happened since against two further
apps and two further runtimes, and `src/runtime/interact/` has had no non-help commit between. The
record set the criterion and the criterion was met.

**`smoke` graduated because the thing the mark was about was tested and held.** The mark's stated
reason was that *the phase list and the outcome table might* move. The hardest claim anyone made
about that table was §What `smoke --android` is: *not a green light, and it never will be*. A live
run of the same command against a development build got exit 0 with all eight phases `ok`
([[0005-runtime-loop-tools]] §The wall was Expo Go's, not Android's). **The prose was wrong and the
code needed no change** — the gate reaches its refusal by asking the runtime what it carries rather
than by knowing the platform. An outcome table that survives having its own documentation falsified
is not a guess.

**`inspect:build-log` graduated because its one open question is additive by design.** The reserved
`<build-id>` form is the change everyone expects it to make, and [[0012-build-explain]] §What ships,
and what is reserved decided its shape in advance: `source.kind` gains `'eas-build'`, `source.buildId`
and `build` appear, and a caller reading `failure` sees nothing move. A tag that warns about an
addition somebody has already designed warns about nothing. Two limits stay and are stated in the
output rather than in the mark — patterns rot, which `confidence` and `logTail` carry, and the
Android rules are `provenance: 'format'` rather than `'captured'`, which the fixture README names
per file.

### Why `inspect:config-plugins` keeps it

It is the one command whose defects form a pattern rather than a list, and the pattern is **a report
claiming a completeness it has not got**:

- **F35** (friction run 3): `autolinkedModules` answered "is my native dependency linked?" with a
  list that had never been asked that question. Fixed by renaming it `expoAutolinkedModules` and
  shipping a sentence about its scope in the payload.
- **F132** (2026-08-28): `10 (1 declared, 9 auto)` for a config declaring three, naming neither of the
  two `_internal.pluginHistory` has no entry for. Fixed by `declaredNotApplied`.
- **F133** (2026-08-28): a broken plugin entry answered with a `Why:` line of pure stack frames.

The last two landed on this command's **first ever live run**, five waves ago, and they landed
because the run existed rather than because anybody had reasoned harder. [[0019-backend-parity-audit]]
§Still stub-only, by choice is where that gap is accepted. One live run is one sample.

**What would graduate it:**

1. **A second live pass over `pluginHistory`, on plugin shapes the first run did not have.** At
   minimum: a plugin declared as `["pkg", {…}]` with options, a plugin resolved from a workspace
   path rather than from `node_modules`, and a plugin that another config plugin adds. The
   assertion is `declaredNotApplied` — empty where the history accounts for everything, and naming
   the right ids where it does not.
2. **Both platforms' mods asserted live.** The first live pass asserted the introspected config and
   the plugin list. `platforms.android` has never been read live, and §the mods introspection cannot evaluate
   is the field a reader most needs to be right about.
3. **Five waves with no change to `EffectiveConfigReport`'s key set.** Met on the calendar; it is
   criteria 1 and 2 that are outstanding.
4. **A `--file <name>` run against a native file the first pass did not produce.** The flag selects
   one file out of the introspected set and has stub coverage only.

Any one of those four failing is a reason to keep the mark. All four passing is a graduation, and it
is a small enough list that whoever runs the next `live-project` pass can close most of it in one
session.

### What this review did not decide

- **The mechanism stays.** `unstable: true` is still a registry attribute, still per command and
  never per group, and `inspect` is now the case that demonstrates why: one action marked, one not,
  on one listing. Nothing about the type, the tag or the footnote changed.
- **A graduation is not a promise never to change.** It says the command is not expected to, and
  that a change to it is a change to a shipped contract with the note that implies. Additive keys
  stay additive.
- **Every row here is cheap to override.** The verdict column is one word per command and the
  evidence is beside it, so putting a mark back is one `unstable: true`, one line in this table and
  one test.

## `doctor`'s exit code belongs to the protocol

`doctor:check` wraps a tool with an exit-code contract of its own: `expo-doctor` exits **1** when any
check fails [observed — `packages/expo-doctor/src/doctor.ts`]. This command does **not** mirror that
code [decided — friction run 7's F68]. [[0010-agent-conventions]] §Exit codes gives
`1` one meaning across the whole surface: *the tool did not work*. Using it for *the tool worked and
the project has a problem*, which `typecheck` and `smoke` both report as
`20`, makes `exagent doctor --bogus` and a project with one failing check indistinguishable, and
an agent cannot use `doctor` as a gate without parsing prose.

So: **0** when every check passed, **20** when any failed, and **1** only for a run that produced no
code of its own (a signalled or killed check established nothing about the project, which really is a
tool failure). Nothing is hidden — expo-doctor's own code stays on the `exitCode` field of `--json`
and on the `cli:doctor_check` event, which is where a caller that wants it can read it.

The general rule this settles: **a forwarded exit code is handed back verbatim only where this CLI
adds no verdict of its own.** `doctor:check` parses the report, counts the checks and decides what to
say about them — it has a verdict, so it owes the protocol's code.

## What this costs

- **A wait that only needs the bundler is now a whole smoke run.** A CI job with no device has no cheaper gate than `typecheck`. If that turns out to bite, `dev:wait` comes back, or `smoke` grows the flags that cut it down — which is its re-entry criterion.
- **`install --json` loses a key** (`checkpoint`), and `EXAGENT_NO_CHECKPOINT` and the `--no-checkpoint` flags are gone from `install`, `dev` and `agents:setup`. An unknown flag is an error, so a script that passed one finds out.
- **`web` has no bundle gate.** `smoke --platform web` is refused ([[0005-runtime-loop-tools]] §`--platform web` is refused), and for the part web *can* answer it names `typecheck`, which is a weaker answer honestly labelled.
- **The reference shelf is unverified code.** Nothing type-checks it and nothing runs its tests, so it rots at the rate the tree around it moves. That is the accepted price of keeping it: the alternative is deleting the work and rebuilding from prose.

## Testing

Unchanged in kind, smaller in count: 2757 unit tests over 152 suites and 396 e2e tests over 22, from 3179 / 473 before — the difference is the suites that moved to the shelf with their code. Adding the three interaction commands took it to **2876 unit tests over 156 suites and 411 e2e over 23** [observed — 2026-08-26]. The tier-0 eval scenario `dev-wait-no-dev-server` was replaced by `smoke-no-dev-server`, which asks the same thing of the command that answers it now. The suggested-command lint is the regression test for the narrowing itself: it fails on any string that names a command the registry no longer has.

**§The graduation review's own test is the set.** `isUnstableCommand` is swept over every
runnable name in the registry and the result asserted to be exactly `['inspect:config-plugins']`, so
a sixth graduation or a seventh mark has to come to this document to change it. Two more pin the
rendering the per-command rule exists for: the `inspect` listing tags one action and not the other
while still printing the footnote, and the `runtime` listing, whose actions have all graduated,
prints neither. The two e2e tests that asserted the old marks assert the new state through the
published bin. Counts at this wave: **3509 unit over 176 suites, 576 e2e over 30** [observed —
2026-08-28].
