# 0023: Fingerprint Caching — Paying for One Hash Instead of Three

**Type:** RFC
**Status:** Draft — implemented
**Systems:** the fingerprint wrapper (`src/project/fingerprint.ts`); the pinned-file manifest (`src/project/fingerprintKeys.ts`); the cross-run record (`src/project/fingerprintCache.ts`, `.expo/exagent-fingerprint.json`); the project-state probe (`src/project/probe.ts`); the EAS build lookup (`src/status/easBuilds.ts`); the status report (`src/status/statusAsync.ts`, `src/status/sections.ts`, `src/status/format.ts`, `src/status/types.ts`); `exagent dev` (`src/dev/devAsync.ts`, `src/dev/resolveOptions.ts`); `@expo/fingerprint`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27
**Related:** [[0004-smart-start-and-project-state]], [[0011-impact-and-freshness]], [[0021-honest-reports]], [[0001-agentic-cli-on-expo-cli]]

## Summary

`exagent status --explain` computed **three fingerprints** and each one cost about a second. The
three are the same three the previous run computed, in a project nobody touched in between. This
document is the two caches that fix that, and — because a cached hash is a claim about the past
reported in the present tense — the rules that keep the report honest about which of them answered.

Two layers, and they solve different problems:

1. **An in-process memo.** One fingerprint per (project, platform, preset, cache-allowed) per
   process, with concurrent callers sharing one promise.
2. **A cross-run record** under `.expo/`, revalidated on the next run against the content hashes of
   the files that can move a fingerprint.

The measured effect is at the bottom, and one half of it is smaller than expected. That is recorded
rather than rounded up.

## What it cost before

One `fingerprint:generate` on a real SDK 57 Expo Router app [observed — `friction/run7/tapapp`,
2026-08-27]:

| Invocation                | Wall time      |
| ------------------------- | -------------- |
| whole project (no `--platform`) | 1.09–1.10 s |
| one platform (`--platform ios`) | 0.95–0.96 s |

And the call sites, per llp/0011 §The fingerprint CLI is the substrate:

| Call site | What it asks for | Times per `status --explain` |
| --------- | ---------------- | ---------------------------- |
| `src/project/probe.ts` | the whole project | 1 |
| `src/status/easBuilds.ts` | one platform | 2 |
| `src/impact/compare.ts` | one platform + preset | 0 under `status`; 1 per platform in a comparison |

## Layer 1 — one fingerprint per key per process

`generateFingerprintAsync` keeps a module-level `Map` of the **promise**, not the result. Two
callers that start at the same moment join one subprocess. That is the F93 lesson at a second
boundary: a guard that dedupes finished work and not in-flight work does nothing on exactly the
concurrency the report is built out of.

The key is `(projectRoot, platform ?? 'all', preset ?? 'default', cacheAllowed)`. The last component
is there so a caller that passed `--no-fingerprint-cache` is never handed the memo of a caller that
did not: their two calls mean different things, and one of them means "measure it".

**Honest measurement of what this layer alone buys on `status --explain`: nothing.** The three
fingerprints that run there have three *different* keys — `all`, `ios`, `android` — so there is no
duplicate for the memo to collapse. It is kept because it is correct and cheap, it holds for the
paths where a key does repeat (a comparison and a probe in one process), and it is the guard that
keeps a future call site from silently doubling the cost. The win in the numbers below is Layer 2's.

`clearFingerprintMemo(projectRoot?)` drops it. `exagent dev` calls it after every plan step, because
an install, a prebuild or a build has just changed the project and every hash above that point
describes a project that no longer exists.

## Layer 2 — the cross-run cache

`.expo/exagent-fingerprint.json`, beside the records `exagent-last-build.json` and
`exagent-eas-builds.json` already keep there, and best-effort like both: a project whose `.expo`
cannot be written loses a cache, not an answer.

One entry per `platform|preset` key, holding `{hash, sources, computedAt, cliVersion, keyManifest}`.
The `sources` ride along — tens of thousands of bytes — because without them a warm run would keep
the freshness verdict and lose the impact *diff*, which is the half llp/0011 §The record has to hold
the sources exists to protect. The whole record measures 43 KB for one key on a real app.

`cliVersion` is the project's own `@expo/fingerprint` version, read out of its `package.json`. It is
**checked, not keyed on**: an upgrade replaces the entry rather than accumulating one per version
that ever ran here. A project whose version cannot be read is not cached at all, because a hash
from another version of the tool is not comparable with this one (llp/0001 §Constraints item 5).

## What a cached hash is revalidated against

The pinned set — `src/project/fingerprintKeys.ts` — is the cheap approximation of the walk the
fingerprint does. Content hashes (sha256) of every one of these that exists:

**Lockfiles**, at the project root and in the nearest ancestor that has one, so a hoisted monorepo
install is covered: `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, `bun.lock`, `bun.lockb`, `deno.lock`. Plus the ancestor's `package.json`.

**The manifest**: `package.json`.

**Every app-config spelling `@expo/config` resolves**: `app.json`, `app.config.json`, and
`app.config` with `.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js` [observed — `@expo/config`
`src/Config.ts` `DYNAMIC_CONFIG_EXTS`, 2026-08-27]. All of them, not only the one this project has:
a project that *gains* one has changed its config, and a pinned set that grew is a miss.

**EAS**: `eas.json`, `.easignore`.

**The fingerprint's own settings**: `.fingerprintignore`, `fingerprint.config.js`,
`fingerprint.config.cjs`. This last pair is not in the original ask and is load-bearing:
`@expo/fingerprint` loads it for `preset`, `ignorePaths`, `sourceSkips` and `extraSources`
[observed — `@expo/fingerprint` `src/Config.ts` `CONFIG_FILES`], so it decides *what the hash is of*.
A change to it moves the hash while every source stays put.

**`.gitignore`**, which the bare sourcer hashes directly as `bareGitIgnore`.

**`patches/`**, file by file, for `patch-package` (`expoCNGPatches`).

**The asset files a static config points at** — icons, adaptive icons, splash images, fonts, and the
iOS and Android `googleServicesFile`. These are separate sources of the fingerprint
(`expoConfigExternalFile`): changing an icon moves the hash and leaves `app.json` alone. Read
statically and never evaluated (llp/0001 §Constraints item 5), capped at 64 files — over the cap the
project is not cached, rather than cached without them.

**`ios/` and `android/`**, when they exist. See below.

`manifestsMatch` requires the same set at the same hashes. A sentinel that *appeared* or
*disappeared* is a miss, not a partial match.

## What invalidates an answer

| Change | Outcome |
| ------ | ------- |
| Any pinned file's contents move | recompute |
| A pinned file appears or disappears | recompute |
| A file under `ios/`/`android/` changes size or modification time | recompute |
| `ios/` or `android/` appears — i.e. `expo prebuild` ran | recompute |
| `@expo/fingerprint` version differs | recompute |
| A different platform or preset is asked for | recompute (its own entry) |
| The record is older than the TTL | recompute |
| The record is missing, corrupt, or from another schema version | recompute |
| A file no sentinel names (`src/**`, `index.js`) changes | **hit** |
| Anything under `ios/Pods`, `**/build`, `.gradle`, `.cxx` changes | **hit** |
| `--no-fingerprint-cache` or `EXAGENT_NO_FINGERPRINT_CACHE` | not read (still written) |

Two mechanical hazards, both found rather than anticipated:

**The project can move while the hash is computed.** The CLI runs for about a second. The manifest is
therefore read *twice* — before the spawn and after it — and the record is written only if the two
agree. Otherwise the run reports its measurement and caches nothing.

**Three writes finish at once.** One `status --explain` computes three fingerprints and two of them
finish together, into one file. Three concurrent read-modify-writes lost an entry, and sometimes
truncated the file so that all three were lost [observed — e2e, 2026-08-27, before the fix]. Writes
are now queued per project within the process and land through a temporary file and a `rename`, so a
second `exagent` process can never read a half-written record.

## The bare-project decision

The pinned set says nothing about a nested edit to `ios/AppDelegate.swift`. Two options were on the
table: a cheap manifest of the native directories, or no cross-run caching for bare projects at all.

**Decided: the manifest (option a).** Justified by measurement on a real prebuilt scaffold — a blank
`create-expo-app` with `expo prebuild --platform all` [observed — 2026-08-27]:

- `ios/` and `android/` hold **70 files** once the ignored trees are excluded.
- A stat walk of both took **0.68–2.03 ms** across five runs.
- One `fingerprint:generate` on the same project took **0.81–1.12 s**.

The walk costs about 0.1% of what it saves, so refusing the cache to bare projects would trade a
second for a millisecond. Bare projects are also the ones where a native build is most expensive, so
they are the last projects to leave uncached.

Size and modification time rather than content hashes, because a prebuilt tree holds binaries and
asset catalogues. That is the weaker check, and it is weak in the **safe** direction: a `git
checkout` that restores identical bytes moves the modification time and costs a recomputation — a
slow answer, never a wrong one.

The excluded directories mirror `DEFAULT_IGNORE_PATHS` of `@expo/fingerprint` [observed —
`src/Options.ts`, 2026-08-27]: `Pods`, `build`, `.gradle`, `.cxx`, `.swiftpm`, `DerivedData`,
`xcuserdata`, `project.xcworkspace`, `node_modules`, and the files `.DS_Store`, `gradlew.bat`,
`.xcode.env.local`. The fingerprint does not hash them either, so a change there cannot move the
hash. A native tree over 5000 files after those exclusions refuses to be a cache key at all, and
says so.

## The dynamic config caveat

`app.config.js` and `app.config.ts` are **evaluated**. They can read `process.env`, the date, or
another file, so the same bytes can produce a different config — and a content hash of the file
cannot see that. Pinning the environment was considered and rejected: the set of variables a config
might read is unbounded, and a cache that pretended to cover them would be worse than one that
admits it does not.

Three mitigations, all of them admissions rather than fixes:

1. **The manifest names it.** A project with a dynamic config carries `what app.config.js evaluates
   to — its bytes are pinned, and a config that reads environment variables or other files can still
   answer differently with the same bytes` in `uncovered`, and that list reaches `--json`.
2. **The report says the answer is cached**, with the count. See below.
3. **A TTL, so the mistake cannot live forever.**

## The TTL

**24 hours.** An entry older than that is dropped whatever its pinned files say.

An hour was considered and is too short for the thing this serves, which is a working session: the
agent loop that runs `status` fifty times in an afternoon would pay the second again after every
coffee. A week was considered and is not a bound in any useful sense — a wrong answer that survives
a weekend is a wrong answer. A day makes the one class of mistake the pinned files cannot catch
self-correcting on the timescale a person notices, and `--no-fingerprint-cache` is there for anyone
who cannot accept it for even one run.

## The report says where the answer came from

@ref llp/0021-honest-reports.rfc.md — a cached hash reported as a measurement is precisely the
failure that document exists to prevent, so the provenance travels with the hash rather than being
inferable from the flags.

`FingerprintResult` gains `source: 'computed' | 'cache'`, `memoized`, `revalidatedAgainst`,
`computedAt` and `cacheCaveats`. `memoized` is deliberately not a third `source`: a memo hit of a
computed answer is still that computation.

`status --json` carries them under `freshness.hashSource` — `{source, revalidatedAgainst,
computedAt, caveats}` — and under `probe.fingerprint`, whole. The `cli:status` event carries
`fingerprintSource` and `fingerprintRevalidatedAgainst`. **No existing field changed shape.**

The printed report adds one line, and only for a cached answer:

```
freshness   ios      local stale (no recorded build) · eas unknown (EAS was not asked — pass --explain)
            android  local stale (no recorded build) · eas unknown (EAS was not asked — pass --explain)
            fingerprint: bf2d19d9 (from cache, revalidated against 9 pinned files, computed 2026-08-27T20:27:51.185Z) — pass --no-fingerprint-cache to hash the project again
```

The asymmetry is the point: `computed` is what a reader already assumes a status report did, and
`cache` is the claim that needs its evidence attached. The count is what makes it checkable —
"revalidated against 9 pinned files" can be disagreed with, and "cached" cannot. The way out sits on
the line that makes the claim, so a reader who does not accept it has nothing to go looking for.

## Every consumer can turn it off

- `exagent status --no-fingerprint-cache` and `exagent dev --no-fingerprint-cache`, threaded to the
  probe *and* to the EAS build lookup — which pays for two of the three, so a flag that only reached
  the probe would apply to a third of the cost it is about.
- `EXAGENT_NO_FINGERPRINT_CACHE=1`, for the paths with no flag of their own (the probe inside
  `agents:setup`, an `impact` comparison). A flag overrules it; a flag that was *not* passed states
  nothing, so `--no-fingerprint-cache`'s absence leaves the variable in charge.

A refusing run still **writes** the record. The flag is about what a caller will accept, not about
what the project may remember, and a measurement is the truest thing to put there.

## What it bought

`friction/run7/tapapp`, a real SDK 57 Expo Router app, `e8e7e5e096` versus this wave [observed —
2026-08-27, three to five runs each, warm CLI]:

| Command | Before | After, cold record | After, warm record |
| ------- | ------ | ------------------ | ------------------ |
| `status --explain` | 4.46 / 4.71 / 4.87 s | 4.63 / 5.25 / 5.42 s | **2.69 / 2.72 / 2.85 / 2.87 s** |
| `status` | 1.57 / 1.59 / 1.59 s | — | 1.58 / 1.58 / 1.65 s |
| `status --dev-server-url <dead port>` | 1.16 / 1.17 / 1.27 s | — | **0.26 / 0.27 / 0.27 / 0.28 / 0.36 s** |

`status --explain --no-fingerprint-cache` measures 4.50 / 4.51 / 4.65 s, which is the before column:
the flag genuinely restores the old behaviour rather than approximating it.

Three honest readings of that table:

1. **`--explain` is 38% faster warm** — about 1.8 s of 4.7 s, which is the wave's own goal and is
   met. Two per-platform fingerprints run *after* the parallel section and before their EAS calls,
   so they are additive wall time and removing them shows up directly.
2. **A default `status` is not faster at all.** The saving is real and hidden: a plain `status` scans
   ports 8081–8085 for a dev server, and that scan costs about 1.3 s — more than the fingerprint it
   runs in parallel with. Pinning the dev-server probe out of the way exposes the same saving
   plainly: 1.16–1.27 s becomes 0.26–0.36 s, **about 0.9 s and 77%**. The fingerprint was never the
   critical path of a default `status`; the port scan is, and that is the next thing worth a wave.
3. **The first run is slightly slower**, by something in the region of 0.2–0.6 s and inside the
   run-to-run noise of `--explain`: reading the pinned files twice and writing 43 KB. Paid once per
   change, recovered on the next run.

## Proof

Unit, `src/project/__tests__/`:

- `fingerprintKeys-test.ts` — the sentinel list itself; a hash that moves and one that does not;
  the walk up to a hoisted lockfile; the files a static config points at; `patches/`; the dynamic-
  config caveat; the native-directory digest, its exclusions, and its refusal above the budget.
- `fingerprintCache-test.ts` — hit, and a miss for each row of the invalidation matrix; the TTL; a
  corrupt record; a schema-version bump; three concurrent writes keeping all three entries; no
  temporary file left behind.
- `fingerprint-test.ts` — the memo (sequential, concurrent, per platform, per preset, and never
  across the cache-allowed boundary), `clearFingerprintMemo`, and the cross-run cache end to end.

E2E, `e2e/__tests__/status-test.ts` §the fingerprint cache — fourteen cases against the published
CLI. The stub `fingerprint` bin now records every invocation, the way the stub `expo` bin does,
because the whole subject is a **number of subprocesses**: a memo hit, a cache hit and a
recomputation all print the same hash. One default run spawns one; `--explain` spawns three; the
next `--explain` spawns none and says `cache`; touching `app.json` or adding a lockfile spawns
again; touching `index.js` does not; a version bump does; `--no-fingerprint-cache` and
`EXAGENT_NO_FINGERPRINT_CACHE` do; a nested native edit does and an `ios/Pods` write does not.

One existing e2e test had to change, and the reason is this document's caveat in miniature: it moved
the fingerprint by setting an environment variable the stub reads. An environment variable is not a
file, so the pinned set correctly did not see it. The test now also touches `app.json`, which is how
a real project moves its hash.

## Open questions

1. **The dev-server port scan.** Reading 2 above: it is now the largest single cost in a default
   `status`, at about 1.3 s. Worth its own wave.
2. **Should the record be shared between the `all` key and the per-platform keys?** The whole-project
   hash dominates the per-platform ones — `--platform` filters the same source list — which is
   already why the EAS build cache is keyed on the project hash (`src/status/easBuilds.ts`). It
   proves the per-platform hashes are *unchanged*; it does not produce their values, so it cannot
   remove the first per-platform run. It could remove the revalidation.
3. **A `--refresh` convention.** This wave spells the escape hatch `--no-fingerprint-cache`, which is
   specific and long. If more caches acquire flags, one shared spelling is worth deciding on.
