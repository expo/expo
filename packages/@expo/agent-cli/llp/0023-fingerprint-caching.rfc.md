# 0023: Fingerprint caching

**Type:** RFC
**Status:** Active
**Systems:** the fingerprint wrapper (`src/project/fingerprint.ts`); the pinned-file manifest (`src/project/fingerprintKeys.ts`); the cross-run record (`src/project/fingerprintCache.ts`, `.expo/agent-cli-fingerprint.json`); the project-state probe (`src/project/probe.ts`); the EAS build lookup (`src/status/easBuilds.ts`); the status report; `@expo/fingerprint`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27
**Revised:** 2026-08-30
**Related:** [[0004-smart-start-and-project-state]], [[0011-impact-and-freshness]], [[0021-honest-reports]], [[0001-agentic-cli-on-expo-cli]]

## Summary

`@expo/agent-cli status --explain` computed three fingerprints, and each one cost about a second. The three are the same three the previous run computed, in a project nobody touched in between. This document is the two caches that fix that. It is also the rules that keep the report honest about which of them answered, because a cached hash is a claim about the past reported in the present tense.

Two layers, and they solve different problems:

1. An in-process memo. One fingerprint per (project, platform, preset, cache-allowed) per process, with concurrent callers sharing one promise.
2. A cross-run record under `.expo/`, revalidated on the next run against the size and modification time of the files that can move a fingerprint.

The design is deliberately cheap and deliberately incomplete. The key is a stamp rather than a content hash. `ios/` and `android/` are outside it altogether. A ten-minute expiry, rather than the key, is what bounds everything the stamps cannot see. [confirmed, Kudo, 2026-08-27] The report is required to say which check answered and how old the answer is.

## Layer 1: one fingerprint per key per process

`generateFingerprintAsync` keeps a module-level `Map` of the promise, not the result. Two callers that start at the same moment join one subprocess. A guard that dedupes finished work and not in-flight work does nothing on exactly the concurrency the report is built out of.

The key is `(projectRoot, platform ?? 'all', preset ?? 'default', cacheAllowed)`. The last component is there so a caller that passed `--no-fingerprint-cache` is never handed the memo of a caller that did not.

This layer alone buys nothing on `status --explain`. The three fingerprints that run there have three different keys (`all`, `ios`, `android`), so there is no duplicate for the memo to collapse. It is kept because it is correct and cheap, it holds for the paths where a key does repeat, and it is the guard that keeps a future call site from silently doubling the cost. The win in the numbers is Layer 2's.

`clearFingerprintMemo(projectRoot?)` drops it. `@expo/agent-cli dev` calls it after every plan step, because an install, a prebuild, or a build has just changed the project.

## Layer 2: the cross-run cache

`.expo/agent-cli-fingerprint.json`, beside the records `agent-cli-last-build.json` and `agent-cli-eas-builds.json` already keep there, and best-effort like both: a project whose `.expo` cannot be written loses a cache, not an answer.

One entry per `platform|preset` key, holding `{hash, sources, computedAt, cliVersion, keyManifest}`. The `sources` ride along because without them a warm run would keep the freshness verdict and lose the impact diff ([[0011-impact-and-freshness]]).

`cliVersion` is the project's own `@expo/fingerprint` version, read out of its `package.json`. It is checked, not keyed on: an upgrade replaces the entry rather than accumulating one per version. A project whose version cannot be read is not cached at all, because a hash from another version of the tool is not comparable with this one ([[0001-agentic-cli-on-expo-cli]] constraint 5).

Finding that package walks the way `node_modules` is actually laid out. First the ancestors' `node_modules`. Then, for pnpm's isolated store, the copy beside the project's own `expo`, reached through the symlink into the virtual store rather than to it. Project-local bin resolution is shared with every other command (`src/utils/projectBin.ts`, [[0015-backend-selection-and-config]]).

The schema version is 2. Version 1 keyed on sha256 content hashes and carried a digest of the native directories. An entry written under those rules is dropped rather than migrated.

## The key is a stamp, not a hash

Every pinned file is recorded as its size and its modification time, not as a content hash. [confirmed, Kudo, 2026-08-27] That is one `stat` per file instead of one read plus one digest, which makes revalidation flat in the size of the files rather than linear.

The trade:

- A file whose bytes changed almost always changes its stamp, because an edit that keeps the byte count and the timestamp is not something a text editor, a package manager, or `git` does.
- A file whose bytes did not change can still change its stamp. `git checkout`, `git stash pop`, and a fresh clone all rewrite modification times. That costs a recomputation of a hash that would have come back identical. It is a slow answer rather than a wrong one.
- An edit that preserves both size and timestamp is invisible. Nothing in this manifest catches it. The TTL does.

## What a cached hash is revalidated against

The pinned set (`src/project/fingerprintKeys.ts`) is the cheap approximation of the walk the fingerprint does. A stamp of every one of these that exists:

Lockfiles, at the project root and in the nearest ancestor that has one, so a hoisted monorepo install is covered: `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `bun.lock`, `bun.lockb`, `deno.lock`. Plus the ancestor's `package.json`.

The manifest: `package.json`.

Every app-config spelling `@expo/config` resolves: `app.json`, `app.config.json`, and `app.config` with `.ts`, `.mts`, `.cts`, `.mjs`, `.cjs`, `.js`. All of them, not only the one this project has: a project that gains one has changed its config, and a pinned set that grew is a miss.

EAS: `eas.json`, `.easignore`.

The fingerprint's own settings: `.fingerprintignore`, `fingerprint.config.js`, `fingerprint.config.cjs`. `@expo/fingerprint` loads these for `preset`, `ignorePaths`, `sourceSkips`, and `extraSources`, so a change to them moves the hash while every source stays put.

`.gitignore`, which the bare sourcer hashes directly as `bareGitIgnore`.

`patches/`, file by file, for `patch-package`.

The asset files a static config points at: icons, adaptive icons, splash images, fonts, and the iOS and Android `googleServicesFile`. These are separate sources of the fingerprint (`expoConfigExternalFile`), so changing an icon moves the hash and leaves `app.json` alone. They are read statically and never evaluated, and capped at 64 files. Over the cap the project is not cached, rather than cached without them.

A referenced path may be a directory. Since SDK 57 `ios.icon` is `./assets/expo.icon`, an icon bundle. A directory is expanded into its files, four levels deep, under the same 64-file cap. A config-referenced path that exists and cannot be stamped is named in `uncovered`. A path that is merely absent is deliberately not named, because its absence is the pinned "no". A dangling symlink counts as present, because what it points at can be replaced without this key noticing.

`manifestsMatch` requires the same set at the same stamps. A sentinel that appeared or disappeared is a miss, not a partial match.

## The native directories are not pinned

`ios/` and `android/` are outside the key entirely. [confirmed, Kudo, 2026-08-27] Not walked, not stat-ed, not counted. And the cache is not disabled for the projects that have them. A bare project is cached exactly like a managed one.

A native edit is invisible to the key. Edit `ios/AppDelegate.swift` and the next `status` answers from the record, with the hash from before the edit, for up to ten minutes. Two things make that acceptable:

1. The report says so. The caveat that everything in `ios/` and `android/` is not looked at is on every hit, in `--json` under `freshness.hashSource.caveats`.
2. `@expo/agent-cli dev` drops the record after every plan step it runs. That covers the one native-surface change this CLI makes itself, which is `expo prebuild`, immediately rather than in ten minutes. A prebuild run some other way rides on the expiry.

`@expo/agent-cli install` drops nothing, and does not have to. `package.json` and the lockfile are both pinned sentinels, so an install moves two stamps and the next read misses on its own.

## What invalidates an answer

| Change                                                          | Outcome                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| A pinned file's size or modification time moves                 | recompute                                                           |
| A pinned file appears or disappears                             | recompute                                                           |
| A pinned file is touched without being changed (`git checkout`) | recompute, the safe direction                                       |
| `@expo/fingerprint` version differs                             | recompute                                                           |
| A different platform or preset is asked for                     | recompute (its own entry)                                           |
| The record is older than `FINGERPRINT_CACHE_TTL_MS`             | recompute                                                           |
| The record is missing, corrupt, or from another schema version  | recompute                                                           |
| A completed `@expo/agent-cli dev` plan step                     | recompute. The record is dropped outright                           |
| A completed `@expo/agent-cli install`                           | recompute. The record is left in place and the key misses by itself |
| A file no sentinel names (`src/**`, `index.js`) changes         | hit                                                                 |
| Anything under `ios/` or `android/` changes                     | hit, bounded by the TTL only                                        |
| A prebuild run outside `@expo/agent-cli dev`                    | hit, bounded by the TTL only                                        |
| An edit that preserved a pinned file's size and timestamp       | hit, bounded by the TTL only                                        |
| `--no-fingerprint-cache` or `AGENT_CLI_NO_FINGERPRINT_CACHE`    | not read (still written)                                            |

Two mechanical hazards:

The project can move while the hash is computed. The manifest is therefore read twice, before the spawn and after it, and the record is written only if the two agree. Otherwise the run reports its measurement and caches nothing.

Three writes finish at once. Writes are queued per project within the process and land through a temporary file and a `rename`, so a second `@expo/agent-cli` process can never read a half-written record.

## What the stamps miss

Three things can be true of a project without the key noticing. They are what the TTL is sized against.

1. A native edit. `ios/` and `android/` are outside the key. This is the largest of the three, and the one `@expo/agent-cli dev` short-circuits for its own prebuild.
2. An edit that preserved a pinned file's size and modification time. Rare, not impossible, and a stamp cannot see it where a content hash could.
3. What a dynamic config evaluates to. `app.config.js` and `app.config.ts` are evaluated. They can read `process.env`, the date, or another file. Pinning the environment was considered and rejected: the set of variables a config might read is unbounded. A project with a dynamic config carries that in `uncovered`.

The mitigations are the same three for all of them. The manifest names what it did not cover. The report says the answer came from a record, and by what check. And the record expires.

## The TTL is the risk bound

Ten minutes, as `FINGERPRINT_CACHE_TTL_MS`. With the native directories out of the key, the expiry is the only thing standing between a native edit and a `status` that reports the hash from before it.

Ten minutes keeps the saving. An agent loop that runs `status` many times while working on one change lands seconds apart, well inside the window. Ten minutes is shorter than the thing a wrong answer misdirects: a skipped native build is minutes. An hour would let a native edit made before a meeting be missed after it. A day is indefensible now that the walk does not catch native edits.

`--no-fingerprint-cache` is there for a caller who cannot accept even ten minutes.

## The report says where the answer came from

A cached hash reported as a measurement is the failure [[0021-honest-reports]] exists to prevent. The provenance travels with the hash.

`FingerprintResult` gains `source: 'computed' | 'cache'`, `memoized`, `revalidatedAgainst`, `keyKind`, `computedAt`, `ageMs`, and `cacheCaveats`. `memoized` is deliberately not a third `source`: a memo hit of a computed answer is still that computation.

`status --json` carries them under `freshness.hashSource` (`{source, revalidatedAgainst, keyKind, computedAt, ageMs, caveats}`) and under `probe.fingerprint`, whole. The `cli:status` event carries `fingerprintSource` and `fingerprintRevalidatedAgainst`. No existing field changed shape.

The printed report adds one line, and only for a cached answer. Three facts make the claim checkable:

- What kind of check ran. `mtime+size` is a stamp comparison, not a content hash.
- How many files it covered.
- How old the entry is. The age is the bound on everything the stamps miss.

The way out sits on the line that makes the claim (`--no-fingerprint-cache`).

`computed` is what a reader already assumes a status report did. `cache` is the claim that needs its evidence attached.

## Every consumer can turn it off

`@expo/agent-cli status --no-fingerprint-cache` and `@expo/agent-cli dev --no-fingerprint-cache`, threaded to the probe and to the EAS build lookup. `AGENT_CLI_NO_FINGERPRINT_CACHE=1` for the paths with no flag of their own. A flag overrules it. A refusing run still writes the record. The flag is about what a caller will accept, not about what the project may remember.

## What it bought

On a real SDK 57 Expo Router app, a warm `status --explain` is about 38% faster (roughly 1.8 s of 4.7 s). A default `status` is not faster at all. The fingerprint was never its critical path. Dev-server discovery was, and that is [[0004-smart-start-and-project-state]] §The discovery ladder. Pinning the discovery out of the way exposes the saving: about 0.9 s and 77%. The first run costs about 40 ms more, recovered on the next run.

## Proof

Unit, `src/project/__tests__/`: stamp match and mismatch including the two limits (same-size rewrite is a match, a touch without a change is a miss); the walk up to a hoisted lockfile; config-referenced files including directories; the silent-vanish class in both directions; native directories absent from the key; the invalidation matrix; the TTL; concurrent writes; the memo never crossing the cache-allowed boundary. `devAsync-test.ts` asserts both caches dropped after a completed plan step.

E2E, `e2e/__tests__/status-test.ts`: the stub `fingerprint` bin records every invocation. A memo hit, a cache hit, and a recomputation all print the same hash. One default run spawns one. `--explain` spawns three. The next `--explain` spawns none and says `cache`. Touching `app.json` or adding a lockfile spawns again. Touching `index.js` does not. A nested native edit is not seen and the report names the gap.

Several tests had to alter a file's length rather than only its bytes. An in-memory filesystem can write twice inside one millisecond, so a same-length rewrite moves neither half of the stamp.
