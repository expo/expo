# 0023: Fingerprint Caching — Paying for One Hash Instead of Three

**Type:** RFC
**Status:** Final — implemented
**Systems:** the fingerprint wrapper (`src/project/fingerprint.ts`); the pinned-file manifest (`src/project/fingerprintKeys.ts`); the cross-run record (`src/project/fingerprintCache.ts`, `.expo/agent-cli-fingerprint.json`); the project-state probe (`src/project/probe.ts`); the EAS build lookup (`src/status/easBuilds.ts`); the status report (`src/status/statusAsync.ts`, `src/status/sections.ts`, `src/status/format.ts`, `src/status/types.ts`); `@expo/agent-cli dev` (`src/dev/devAsync.ts`, `src/dev/resolveOptions.ts`); `@expo/fingerprint`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27 · finalized 2026-08-28
**Related:** [[0004-smart-start-and-project-state]], [[0011-impact-and-freshness]], [[0021-honest-reports]], [[0001-agentic-cli-on-expo-cli]]

## Summary

`@expo/agent-cli status --explain` computed **three fingerprints**, and each one cost about a second. The
three are the same three the previous run computed, in a project nobody touched in between. This
document is the two caches that fix that. It is also the rules that keep the report honest about
which of them answered, because a cached hash is a claim about the past reported in the present tense.

Two layers, and they solve different problems:

1. **An in-process memo.** One fingerprint per (project, platform, preset, cache-allowed) per
   process, with concurrent callers sharing one promise.
2. **A cross-run record** under `.expo/`, revalidated on the next run against the **size and
   modification time** of the files that can move a fingerprint.

The design is deliberately cheap and deliberately incomplete, and the shape of that trade is the
substance of this document. The key is a stamp rather than a content hash. `ios/` and `android/` are
outside it altogether. And a **ten-minute expiry**, rather than the key, is what bounds everything the
stamps cannot see [decided — Kudo, 2026-08-27]. Every one of those three gives something up, so each
has a section saying what, and the report is required to say which check answered and how old the
answer is.

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

`clearFingerprintMemo(projectRoot?)` drops it. `@expo/agent-cli dev` calls it after every plan step, because
an install, a prebuild or a build has just changed the project and every hash above that point
describes a project that no longer exists.

## Layer 2 — the cross-run cache

`.expo/agent-cli-fingerprint.json`, beside the records `agent-cli-last-build.json` and
`agent-cli-eas-builds.json` already keep there, and best-effort like both: a project whose `.expo`
cannot be written loses a cache, not an answer.

One entry per `platform|preset` key, holding `{hash, sources, computedAt, cliVersion, keyManifest}`.
The `sources` ride along — tens of thousands of bytes — because without them a warm run would keep
the freshness verdict and lose the impact *diff*, which is the half llp/0011 §The record has to hold
the sources exists to protect. The whole record measures 43 KB for one key on a real app.

`cliVersion` is the project's own `@expo/fingerprint` version, read out of its `package.json`. It is
**checked, not keyed on**: an upgrade replaces the entry rather than accumulating one per version
that ever ran here. A project whose version cannot be read is not cached at all, because a hash
from another version of the tool is not comparable with this one (llp/0001 §Constraints item 5).

**Finding that package is three rungs, not one** [F111, fixed 2026-08-28]. One rung is the literal
path `<projectRoot>/node_modules/@expo/fingerprint/package.json`. Because a null version turns
the whole cross-run cache off, the effect in a monorepo was that this document's subject silently did
not exist there: two consecutive `status` runs in a pnpm workspace both reported `source: "computed"`
and no record was ever written [observed — 2026-08-28]. That is an asymmetry rather than a
policy, and it is what makes it a defect. The fingerprint CLI *is* found and spawned in the same
project, from `node_modules/.bin/fingerprint`, which pnpm writes. So the lookup now walks the way
`node_modules` is actually laid out. First the ancestors' `node_modules`, which is the same walk the
hoisted-lockfile sentinels do. Then, for pnpm's isolated store, the copy beside the project's own
`expo`, reached **through** the symlink into the virtual store rather than to it. The first attempt
resolved the link's own path, passed every unit case, and still wrote no record in a real workspace,
so there is a case for the symlink now. With it, a pnpm workspace app pins 14 files, including the
three above it (`../../pnpm-lock.yaml`, `../../pnpm-workspace.yaml`, `../../package.json`). That is
the first time §the walk up to a hoisted lockfile has been exercised anywhere but a fixture.

**What this did not reach: an npm-workspaces monorepo**, where npm hoists so completely that the app
has no `node_modules` of its own at all. There `resolveFingerprintCli` found no bin, so no hash was
computed and there was nothing to cache. That is a larger defect than this one, and it lives in the
project-local bin resolution every command shares rather than in this record [F113, **fixed**:
`src/utils/projectBin.ts`, [[0015-backend-selection-and-config]] §Resolving a project-local
bin]. The record works there now: a second `status` in that repository answers `source: "cache"`
revalidated against 13 files [observed — 2026-08-28].

The schema version is **2**. Version 1 keyed on sha256 content hashes and carried a digest of the
native directories. An entry written under those rules was revalidated against a different question,
so such a record is dropped rather than migrated. The thing it holds is recomputable in a second.

## The key is a stamp, not a hash

Every pinned file below is recorded as **its size and its modification time**, not as a content
hash [decided — Kudo, 2026-08-27, after the first implementation shipped sha256]. That is one `stat`
per file instead of one read plus one digest, which makes revalidation flat in the size of the files
rather than linear. On the app measured here, nine pinned files with 1.2 MB between them, most of it
one 799 KB icon, one manifest pass costs **0.025 ms** with stamps against **0.595 ms** with sha256
[observed — 2026-08-27, 50 passes each]. Both are small. The stamp is the one that stays small when
a project's lockfile is 3 MB, or its splash assets are a dozen photographs.

The trade is that a stamp is a weaker statement about a file, and it is worth being exact about how:

- **A file whose bytes changed almost always changes its stamp**, because an edit that keeps the byte
  count *and* the timestamp is not something a text editor, a package manager or `git` does.
- **A file whose bytes did not change can still change its stamp.** `git checkout`, `git stash pop`
  and a fresh clone all rewrite modification times. That costs a recomputation of a hash that would
  have come back identical. It is a slow answer rather than a wrong one, and it is the direction to
  be wrong in.
- **The remaining case is real and small**. An edit that preserves both size and timestamp is
  invisible. Nothing in this manifest catches it. The TTL does.

## What a cached hash is revalidated against

The pinned set — `src/project/fingerprintKeys.ts` — is the cheap approximation of the walk the
fingerprint does. A stamp of every one of these that exists:

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

**The asset files a static config points at**: icons, adaptive icons, splash images, fonts, and the
iOS and Android `googleServicesFile`. These are separate sources of the fingerprint
(`expoConfigExternalFile`), so changing an icon moves the hash and leaves `app.json` alone. They are
read statically and never evaluated (llp/0001 §Constraints item 5), and capped at 64 files. Over the
cap the project is not cached, rather than cached without them.

**A referenced path may be a directory, and one of them is the default scaffold's** [F112, fixed
2026-08-28]. Since SDK 57 `ios.icon` is `./assets/expo.icon`, an icon bundle holding `icon.json` and an
`Assets/` tree. A stamp of a directory is not a file stamp, so such an entry used to *disappear*
out of the manifest with nothing said, and no entry is no mismatch. Live: editing
`assets/expo.icon/icon.json` moved the hash from `f50891f3` to `ed4b0454`, and a warm `status` kept
answering `f50891f3` from cache for the whole TTL, with `uncovered` never naming the gap [observed —
2026-08-28, a bun-installed SDK 57 scaffold]. A directory is now expanded into its files, four
levels deep, under the same 64-file cap, which is what the cap was always counting, since the point
of it is the number of `stat` calls. The manifest of a default scaffold goes from 9 entries to 12.
The count in the over-cap sentence went with it: the walk stops at the cap rather than finishing, so
it no longer claims a number it never measured.

**And the class it belonged to is closed, not just the icon.** What made that defect quiet was that a
candidate yielding no stamp leaves *no entry*, and no entry is no mismatch. That is correct for a
**sentinel**, which is a question whose "no" is itself pinned: an `eas.json` appearing grows the set,
and `manifestsMatch` requires the same set. It is wrong for a path the config **points at**, which is
a claim that something is there. The two are now told apart. A config-referenced path that **exists**
and cannot be stamped is named in `uncovered`, by its own relative path, so the report says which
one it dropped. What is left in that branch is a directory too deep for the walk and an unreadable
one. A dangling symlink counts as present, because what it points at can be replaced without this
key noticing. A path that is merely *absent* is deliberately **not** named, because its absence is
the pinned "no" again, and a caveat about nothing is noise.

`manifestsMatch` requires the same set at the same stamps. A sentinel that *appeared* or
*disappeared* is a miss, not a partial match.

## The native directories are not pinned

**`ios/` and `android/` are outside the key entirely** [decided — Kudo, 2026-08-27]. Not walked, not
stat-ed, not counted. And the cache is **not** disabled for the projects that have them. A bare
project is cached exactly like a managed one.

This is a reversal, and the earlier reasoning is kept because the measurement behind it still stands.
A prebuilt scaffold's `ios/` and `android/` hold 70 files once the trees `@expo/fingerprint` itself
ignores are excluded, and a stat walk of both took 0.68–2.03 ms against 0.81–1.12 s for the
fingerprint it would stand in for [observed — a blank `create-expo-app` prebuilt for both platforms,
2026-08-27]. The walk was affordable. It was dropped anyway, for what it costs in surface rather than
in time. It would need an exclusion list transcribed from `@expo/fingerprint`'s
`DEFAULT_IGNORE_PATHS`, which is another project's private constant and would drift. It would need a
file-count ceiling and a "too large to cache" branch. And it would need a second kind of key entry to
explain in every report. The TTL covers the same ground with none of that.

**What it means, plainly: a native edit is invisible to the key.** Edit `ios/AppDelegate.swift` and
the next `status` answers from the record, with the hash from before the edit, for up to ten minutes.
Two things make that acceptable rather than merely accepted:

1. **The report says so.** The caveat `everything in ios/ and android/, which this cache does not
   look at — a native edit, or a prebuild that creates them, is caught by the cache's own expiry and
   not by these files` is on every hit, in `--json` under `freshness.hashSource.caveats`.
2. **`@expo/agent-cli dev` drops the record after every plan step it runs** (`src/dev/devAsync.ts`). That
   covers the one native-surface change this CLI makes itself, which is `expo prebuild`, immediately
   rather than in ten minutes. A prebuild run some other way rides on the expiry.

**`@expo/agent-cli install` drops nothing, and does not have to** [measured 2026-08-28]. It was worth
checking, because `install` changes the project as surely as a plan step does and the dev-step rule
above could have been read as applying to it. It does not need to: `package.json` and the lockfile are
both pinned sentinels, so an install moves two stamps and the next read misses on its own. Live on an
SDK 57 scaffold — `status` twice for `computed` then `cache` at 12 pinned files, `install expo-clipboard`,
then `status` again: `source: "computed"` and a new hash, with `.expo/agent-cli-fingerprint.json` still
on disk. Asserted by `live-project`, so the distinction between "nothing drops it" and "nothing needs
to" cannot quietly stop being true.

## What invalidates an answer

| Change | Outcome |
| ------ | ------- |
| A pinned file's size or modification time moves | recompute |
| A pinned file appears or disappears | recompute |
| A pinned file is touched without being changed (`git checkout`) | recompute — the safe direction |
| `@expo/fingerprint` version differs | recompute |
| A different platform or preset is asked for | recompute (its own entry) |
| The record is older than {@link FINGERPRINT_CACHE_TTL_MS} | recompute |
| The record is missing, corrupt, or from another schema version | recompute |
| A completed `@expo/agent-cli dev` plan step | recompute — the record is dropped outright |
| A completed `@expo/agent-cli install` | recompute — **the record is left in place and the key misses by itself** |
| A file no sentinel names (`src/**`, `index.js`) changes | **hit** |
| Anything under `ios/` or `android/` changes | **hit** — bounded by the TTL only |
| A prebuild run outside `@expo/agent-cli dev` | **hit** — bounded by the TTL only |
| An edit that preserved a pinned file's size *and* timestamp | **hit** — bounded by the TTL only |
| `--no-fingerprint-cache` or `AGENT_CLI_NO_FINGERPRINT_CACHE` | not read (still written) |

Two mechanical hazards, both found rather than anticipated:

**The project can move while the hash is computed.** The CLI runs for about a second. The manifest is
therefore read *twice* — before the spawn and after it — and the record is written only if the two
agree. Otherwise the run reports its measurement and caches nothing.

**Three writes finish at once.** One `status --explain` computes three fingerprints and two of them
finish together, into one file. Three concurrent read-modify-writes lost an entry, and sometimes
truncated the file so that all three were lost [observed — e2e, 2026-08-27, before the fix]. Writes
are now queued per project within the process and land through a temporary file and a `rename`, so a
second `@expo/agent-cli` process can never read a half-written record.

## What the stamps miss, and the dynamic config caveat

Three things can be true of a project without the key noticing. They are collected here because they
are what the TTL is sized against, and because a caveat only counted in a document is a caveat
nobody read (llp/0021 §A note only in `--json` is a note nobody read).

1. **A native edit.** `ios/` and `android/` are outside the key, per the section above. This is the
   largest of the three, and the one `@expo/agent-cli dev` short-circuits for its own prebuild.
2. **An edit that preserved a pinned file's size and modification time.** It is rare, because no
   editor or package manager does it, but it is not impossible, and a stamp cannot see it where a
   content hash could. That is the cost of the stamp, stated rather than buried.
3. **What a dynamic config evaluates to.** `app.config.js` and `app.config.ts` are *evaluated*. They
   can read `process.env`, the date, or another file, so an untouched file can still answer
   differently, and no property of the file, stamp or hash, can see that. Pinning the environment was
   considered and rejected: the set of variables a config might read is unbounded, and a cache that
   pretended to cover them would be worse than one that admits it does not. A project with a dynamic
   config carries `what app.config.js evaluates to — its size and modification time are pinned, and a
   config that reads environment variables or other files can still answer differently without being
   touched` in `uncovered`.

The mitigations are the same three for all of them, and none is a fix. The manifest **names** what it
did not cover. The report **says the answer came from a record**, and by what check. And the record
**expires**.

## The TTL is the risk bound

**Ten minutes**, as `FINGERPRINT_CACHE_TTL_MS`.

This is not housekeeping. With the native directories out of the key, the expiry is the *only* thing
standing between a native edit and a `status` that reports the hash from before it. The number
follows from that:

- **Ten minutes keeps the saving.** The workflow this serves is an agent loop that runs `status` many
  times while working on one change. Those runs land seconds apart, well inside the window, so the
  38% below survives intact.
- **Ten minutes is shorter than the thing a wrong answer misdirects.** What a stale `fresh` verdict
  buys you is a skipped native build, and a native build is minutes. An error that expires faster
  than the action it would have avoided cannot cost much.
- **An hour was the top of the range considered**, and it would let a native edit made before a
  meeting be missed after it. **A day** is the value this shipped with while the manifest still walked
  `ios/` and `android/`. It is indefensible now that it does not. It was defensible then because the
  walk, rather than the clock, was catching native edits.

`--no-fingerprint-cache` is there for a caller who cannot accept even ten minutes.

## The report says where the answer came from

@ref llp/0021-honest-reports.rfc.md — a cached hash reported as a measurement is precisely the
failure that document exists to prevent, so the provenance travels with the hash rather than being
inferable from the flags.

`FingerprintResult` gains `source: 'computed' | 'cache'`, `memoized`, `revalidatedAgainst`,
`keyKind`, `computedAt`, `ageMs` and `cacheCaveats`. `memoized` is deliberately not a third `source`:
a memo hit of a computed answer is still that computation.

`status --json` carries them under `freshness.hashSource` — `{source, revalidatedAgainst, keyKind,
computedAt, ageMs, caveats}` — and under `probe.fingerprint`, whole. The `cli:status` event carries
`fingerprintSource` and `fingerprintRevalidatedAgainst`. **No existing field changed shape.**

The printed report adds one line, and only for a cached answer:

```
freshness   ios      local stale (no recorded build) · eas unknown (EAS was not asked — pass --explain)
            android  local stale (no recorded build) · eas unknown (EAS was not asked — pass --explain)
            fingerprint: bf2d19d9 (from cache, revalidated by mtime+size of 9 files, cached 19s ago) — pass --no-fingerprint-cache to hash the project again
```

The asymmetry is the point: `computed` is what a reader already assumes a status report did, and
`cache` is the claim that needs its evidence attached. Three facts make that claim checkable rather
than reassuring:

- **What kind of check ran.** `mtime+size` is a stamp comparison, not a content hash, and a reader
  about to skip a native build on the strength of it is entitled to know which. The formatter reads
  the kind off the result rather than spelling it, so the line cannot outlive a change to the check.
- **How many files it covered.** "Revalidated by mtime+size of 9 files" can be disagreed with;
  "cached" cannot.
- **How old the entry is.** Because the age *is* the bound on everything in the section above, this
  is the most load-bearing of the three. A reader who sees `cached 8m ago` beside a native edit they
  made five minutes ago has been told exactly what they need.

The way out sits on the line that makes the claim, so a reader who does not accept it has nothing to
go looking for.

## Every consumer can turn it off

- `@expo/agent-cli status --no-fingerprint-cache` and `@expo/agent-cli dev --no-fingerprint-cache`, threaded to the
  probe *and* to the EAS build lookup. The lookup pays for two of the three, so a flag that only
  reached the probe would apply to a third of the cost it is about.
- `AGENT_CLI_NO_FINGERPRINT_CACHE=1`, for the paths with no flag of their own, meaning the probe inside
  `agents:setup` and an `impact` comparison. A flag overrules it. A flag that was *not* passed states
  nothing, so `--no-fingerprint-cache`'s absence leaves the variable in charge.

A refusing run still **writes** the record. The flag is about what a caller will accept, not about
what the project may remember, and a measurement is the truest thing to put there.

## What it bought

`friction/run7/tapapp`, a real SDK 57 Expo Router app, `e8e7e5e096` versus this wave [observed —
2026-08-27, three to five runs each, warm CLI]:

| Command | Before | After, warm record |
| ------- | ------ | ------------------ |
| `status --explain` | 4.46 / 4.71 / 4.87 s | **2.81 / 2.85 / 2.99 / 3.03 s** |
| `status` | 1.57 / 1.59 / 1.59 s | 1.58 / 1.58 / 1.65 s |
| `status --dev-server-url <dead port>` | 1.16 / 1.17 / 1.27 s | **0.27 / 0.27 / 0.27 / 0.28 / 0.28 s** |

The cold-record column is left out of the table on purpose, because `--explain` makes two network
calls and its run-to-run spread (4.6 s to 7.1 s across this session) is wider than anything the cache
does. It was measured where there is no network to hide in: the dead-port row, cold record,
alternating against `--no-fingerprint-cache` so machine drift cancels. There the whole cost of reading
the manifest, missing, and writing the record is **about 40 ms**, at 1.19 / 1.20 / 1.21 s with the
cache against 1.15 / 1.16 / 1.17 s without it.

`status --explain --no-fingerprint-cache` measures 4.50 / 4.51 / 4.65 s, which is the before column.
The flag restores the old behaviour rather than approximating it.

Three honest readings of that table:

1. **`--explain` is about 38% faster warm**, roughly 1.8 s of 4.7 s, which is the wave's own goal and
   is met. Two per-platform fingerprints run *after* the parallel section and before their EAS calls,
   so they are additive wall time and removing them shows up directly.
2. **A default `status` is not faster at all.** The saving is real and hidden. Pinning the
   dev-server probe out of the way exposes it plainly: 1.16–1.27 s becomes 0.27–0.28 s, **about
   0.9 s and 77%**. What hides it is the 1.3 s a default run spends on dev-server discovery, which is
   more than the fingerprint it runs in parallel with. The fingerprint was never the critical path of
   a default `status`. Discovery was — and not through its probes, which cost about a millisecond
   each, but through the unfired timers behind them, which a *lock hit* that scans no ports at all
   paid in full too [observed — 2026-08-27]. That is
   [[0004-smart-start-and-project-state]] §The discovery ladder, where it is fixed.
3. **The first run costs about 40 ms more**, per the isolation above. Paid once per change, recovered
   on the next run. Moving from sha256 to stamps is what made this number small enough to state: one
   manifest pass over this project's nine pinned files and 1.2 MB went from 0.595 ms to 0.025 ms.

## Proof

Unit, `src/project/__tests__/`:

- `fingerprintKeys-test.ts`: that one entry is `mtime+size` and says so; a stamp that moves and one
  that does not; **the two limits, asserted as limits**, meaning that an edit which preserved size and
  timestamp is a match and a file touched without being changed is a mismatch; the walk up to a
  hoisted lockfile; the files a static config points at, **including the ones inside a directory it
  points at**, as a pair, so that the entries appear and a file inside the bundle changing makes the
  two manifests disagree, because only the second of those is what the record is believed on; the
  silent-vanish class in **both** directions, with a referenced path that exists and cannot be stamped
  being named and one that is merely absent deliberately not; `patches/`; the dynamic-config caveat;
  and the native directories, whose absence from the key is pinned by four cases so nobody meets it
  as a surprise.
- `fingerprintCache-test.ts`: a hit, and a miss for each row of the invalidation matrix; the TTL; the
  `keyKind` and `ageMs` a hit reports; a corrupt record; a schema-version bump; three concurrent
  writes keeping all three entries; and no temporary file left behind. The three native-directory
  cases assert **hits**, with a comment saying which decision they encode, so narrowing the TTL or
  putting the walk back shows up as a test that changed on purpose. Three cases cover where the
  `@expo/fingerprint` version is found: beside the project, in an ancestor a hoisted install put it
  in, and beside `expo` **through** pnpm's symlink. The last was written after a fix that passed
  the other two and still cached nothing in a real workspace.
- `fingerprint-test.ts`: the memo, covering sequential, concurrent, per platform, per preset, and
  never across the cache-allowed boundary; `clearFingerprintMemo`; and the cross-run cache end to end.
- `../dev/__tests__/devAsync-test.ts`: both caches dropped after a completed plan step, and neither
  touched when a step failed.
- `../status/__tests__/format-test.ts`: the printed line carries the kind, the count and the age;
  ages in seconds, minutes and hours; and it never says `content hash` or `sha` for a check that was
  neither.

E2E, `e2e/__tests__/status-test.ts` §the fingerprint cache: fourteen cases against the published
CLI. The stub `fingerprint` bin now records every invocation, the way the stub `expo` bin does,
because the whole subject is a **number of subprocesses**. A memo hit, a cache hit and a
recomputation all print the same hash. One default run spawns one. `--explain` spawns three. The next
`--explain` spawns none and says `cache`. Touching `app.json` or adding a lockfile spawns again, and
touching `index.js` does not. A version bump does. `--no-fingerprint-cache` and
`AGENT_CLI_NO_FINGERPRINT_CACHE` do. And the bare block asserts the shape of the trade in both
directions: a nested native edit is **not** seen and the report names the gap, while a Pods tree is
neither stat-ed nor a reason to recompute.

**A note on writing tests against a stamp.** Several of these had to be changed to alter a file's
*length* rather than only its bytes. An in-memory filesystem can write twice inside one millisecond,
so a same-length rewrite moves neither half of the stamp and the test would pass or fail by luck.
Where that case matters it is now a test of its own, asserting the limit rather than hiding inside an
assertion about a miss. Two flaky failures were found this way before they could land.

One existing e2e test had to change, and the reason is this document's caveat in miniature: it moved
the fingerprint by setting an environment variable the stub reads. An environment variable is not a
file, so the pinned set correctly did not see it. The test now also touches `app.json`, which is how
a real project moves its hash.

## Open questions

1. ~~**The dev-server port scan.**~~ **Answered — 2026-08-27.** The 1.3 s was real and the scan was
   not spending it: the cost was a `setTimeout` behind each probe's timeout, never cleared and never
   `unref`ed, keeping the event loop alive long after the report was printed. Clearing the timer, and
   aborting the request the timeout abandoned, brings a default `status` to 0.27–0.32 s against a
   0.28 s floor. The design, the ladder, all seven measured scenarios and two remaining limits are in
   [[0004-smart-start-and-project-state]] §The discovery ladder.

2. **Should the record be shared between the `all` key and the per-platform keys?** The whole-project
   hash dominates the per-platform ones, because `--platform` filters the same source list, which is
   already why the EAS build cache is keyed on the project hash (`src/status/easBuilds.ts`). It
   proves the per-platform hashes are *unchanged*. It does not produce their values, so it cannot
   remove the first per-platform run. It could remove the revalidation.
3. **A `--refresh` convention.** This wave spells the escape hatch `--no-fingerprint-cache`, which is
   specific and long. If more caches acquire flags, one shared spelling is worth deciding on.
4. **Should a native edit be caught by something other than the clock?** The cheapest candidate that
   is not a walk is stamping the two directories themselves — two `stat` calls, which would catch a
   prebuild but not an edit inside one. It was left out to keep the key one kind of thing. If
   ten minutes turns out to be too long in practice, this is the first thing to reach for before
   shortening it further.
