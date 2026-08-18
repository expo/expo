# Review: PR #48954 (grounded in Metro)

- **PR:** https://github.com/expo/expo/pull/48954
- **Title:** [metro-file-map] Pick up packages installed while the dev server is running
- **Head SHA:** `72023ba5f8f1e982b2d2ef115d4e5931aee77c33`
- **Sources this pass:** `walker@1.0.8`, Expo `FallbackWatcher` / `Watcher` / `FileMap` / `TreeFS`, Expo `createFileMap-fork` + `ExpoMetroConfig` + `instantiateMetro`, Metro 0.84.4 `DependencyGraph` / `PackageCache` / `metro-resolver`, facebook/metro `main` `FallbackWatcher.js`, Metro docs (`useWatchman`, `watchFolders`, resolution), Expo metro.mdx on-demand filesystem, issue #48950, Kitten's review

## Issue counts

- bugs: 0
- suggestions: 3
- nits: 0

## Summary

The live diff is the right fix, at the right layer, for a bug Expo users hit by default. Expo forces Watchman off (`resolver.useWatchman = null` → `createFileMap` uses `?? false`). On Linux that selects `FallbackWatcher`. That class is still a straight port of facebook/metro's `FallbackWatcher`, which on `main` today still starts `fs.watch` on walker's `'dir'` event — after `readdir`. A `package.json` written in that gap is invisible forever. metro-resolver then asks TreeFS (`doesFileExist` is `_fileSystem.exists`, not `fs.existsSync`); Expo packages have no root `index.js`, so a directory without `package.json` in the map becomes `Unable to resolve "<pkg>"`. The PR moves the watch into `filterDir` (after `lstat`, before `readdir`). That is the watch-then-list pattern. The TreeFS miss-cache work and the 500 ms / 2 s re-scans in the PR body are not in this commit; Kitten rejected both.

## How this is wired in Expo + Metro

### Expo makes this the default watcher

`ExpoMetroConfig` nulls Metro's Watchman default so the Node watcher is used. Metro docs: `useWatchman: false` "prevents Metro from using Watchman (even if it's installed)."

```ts
// packages/@expo/metro-config/src/ExpoMetroConfig.ts
(metroConfig.resolver as { useWatchman?: boolean | null }).useWatchman = null;
```

```ts
// packages/@expo/cli/src/start/server/metro/createFileMap-fork.ts
useWatchman: config.resolver.useWatchman ?? false,
```

`Watcher.ts` then picks `WatchmanWatcher > NativeWatcher (darwin only) > FallbackWatcher`. A stock `npx expo start` on Linux is this file. macOS uses recursive FSEvents (`NativeWatcher`) and does not have this race. The #48950 repro (Linux, no Watchman, bun, `--tunnel`) is the default Expo path, not an exotic fallback.

`createFileMap-fork.ts` replaces Metro's `DependencyGraph/createFileMap` so `@expo/metro-file-map` is what actually runs. `__expo` is asserted after `runServer()`.

### metro-resolver only believes the file map

`DependencyGraph.doesFileExist` is TreeFS, and `fileSystemLookup` is `this._fileSystem.lookup`. metro-resolver's package entry point is:

```js
// metro-resolver/src/resolve.js — resolvePackageEntryPoint
const dirLookup = context.fileSystemLookup(packagePath);
if (dirLookup.exists == false || dirLookup.type !== "d") { return failedFor(...) }
const packageJsonPath = path.join(packagePath, "package.json");
if (!context.doesFileExist(packageJsonPath)) {
  return resolveFile(context, packagePath, "index", platform);
}
```

Metro's own resolution docs say the same: RESOLVE_MODULE step 4 is "if `dirPath + 'package.json'` exists, read `main` / `exports`." Expo modules (`expo-haptics`, `expo-battery`, …) put the entry in `package.json` (`main` / `exports` → `build/`). There is no root `index.js`. A map that has `build/*.js` and not `package.json` fails bare-specifier resolution. That is the instrumented #48950 failure, and it matches the "Unable to resolve expo-haptics" symptom.

The `ExpoAsset` runtime error is a downstream display problem (first `requireNativeModule` on a bad/partial graph). Restarting the server rebuilds from a complete crawl. This PR does not need to fix that message.

### A failed resolve is not cached; a missing map entry is

```js
// metro DependencyGraph.resolveDependency
if (!resolution) {
  try {
    resolution = this._moduleResolver.resolveDependency(...)
  } catch (error) { throw error }
}
mapByPlatform.set(platformKey, resolution);
```

Failures are not stored. `_onHasteChange` also wipes `_resolutionCache` and `PackageCache.invalidate`s every changed path; a new `*/package.json` clears `#modulePathsWithNoPackage`. Editing `App.js` therefore retries resolve. The issue's "still 500 after editing the app" means TreeFS still lacked `package.json`, not that Metro cached the failure. Touching a file inside the package repaired it because that produced a watch event the map accepted.

`PackageCache.getPackage` reads the real file (`fs.readFileSync` + `JSON.parse`). Mid-write JSON can throw once; it is not cached. HastePlugin skips `node_modules`, and `FileProcessor` for those paths is SHA-1 or a no-op, so a partial `package.json` does not poison the FileMap change queue.

### FileMap only accepts file events that this PR actually emits

`index.ts` drops `metadata.type === 'd'`. Directory `touch` from `#watchdirDuringWalk` is discarded. The events that call `TreeFS.addOrModify` are the walk's `'file'` callbacks (and later inotify `touch`es). `package.json` passes `hasWatchedExtension` because `json` is in `sourceExts`, and `Watcher.watch` also globs `**/package.json`.

`includedByGlob('d', …)` does not drop new package dirs: non-files short-circuit, and `dot: true`.

### On-demand filesystem is a different layer

Enabled by default (`experiments.onDemandFilesystem ?? true` in `instantiateMetro`). Expo docs: Metro pre-crawls `watchFolders`; the fork lazily reads paths *outside* those roots (monorepos, pnpm/Bun GVS). `#populateFromFilesystem` is blocked by `rootPattern` *inside* watch roots. A normal app's `node_modules/<pkg>` never uses the fallback. The dropped TreeFS "don't cache misses" change is the right fix for an *outside-root* install after a failed probe, and the wrong fix for #48950. Kitten's perf objection still stands: Metro probes missing `node_modules` paths in bursts.

### Upstream still has the bug

facebook/metro `main` `FallbackWatcher.js` is the same `recReaddir` + `.on('dir', watch)` as Expo `main` and as Metro 0.84.4 vendored here. `walker` still emits `'dir'` only after `readdir`. This is a fork-local fix of an upstream race. Worth sending upstream; not a merge blocker.

### Recrawl exists above this watcher

FileMap `'recrawl'` → `Watcher.recrawl` → `#applyFileDelta`. `NativeWatcher` emits it on directory rename. `FallbackWatcher` never does. Kitten's "wrong layer" comment was about the deleted 500 ms / 2 s timers. Inotify queue overflow (author's yarn+firebase numbers) is still a separate recrawl-shaped change.

## What success looks like

Issue #48950's expected behaviour was one of:

1. Metro notices `node_modules` changed under a running server and the next reload works, **or**
2. The runtime error names the real module and says to restart, instead of blaming `ExpoAsset`.

This PR takes (1) for one specific race. That is the right product outcome for the motivating repro: Linux, no Watchman, `npx expo start`, `npx expo install` / `bun add`, then import the package. Success is:

- The next bundle that imports `<pkg>` returns 200 without restarting the dev server.
- `Unable to resolve "<pkg>"` stops happening for that install.
- The `ExpoAsset` red screen stops happening *when it was only a symptom of that missing `package.json`*. We are not fixing the error-message quality for other failures.

Kitten's review defines the other half of success: **do not "complete" the fix by expanding scope into the wrong layer.**

| Case | Required outcome | Why |
| --- | --- | --- |
| FallbackWatcher, file written between `readdir` and `fs.watch` | **Correct** — file is in the map | This is the bug |
| FallbackWatcher, file written after the watch exists | **Unchanged** (already worked) | Second new test |
| File created in an already-watched project dir | **Unchanged** | Author's control on `main` |
| NativeWatcher (macOS) | **Inert** — do not touch | Different backend; Kitten: OS-dependent |
| Watchman | **Inert** — do not touch | Not the default; has its own recrawl |
| TreeFS fallback miss inside/outside watch roots | **Inert** — keep negative cache | Kitten: probing `node_modules` misses is a hot path |
| Inotify queue overflow (`yarn add firebase`) | **Inert** — still can lose files, same as `main` | Recovery is FileMap `recrawl`, not timers in this watcher |
| `ExpoAsset` wording | **Out of scope** | `@expo/cli` / expo-modules-core, not metro-file-map |
| Tell-the-user-to-restart | Acceptable **only** for the inert rows | Do not paper over the TOCTOU with a restart prompt |

If a later change re-introduces delayed re-scans in `FallbackWatcher` or un-caches TreeFS misses, that is a regression of the review, not a completion of the issue.

## Guardrails this PR does not yet have

The new `FallbackWatcher` suite is the right *kind* of test (real `fs`, `jest.unmock`, write-at-`fs.watch` to pin the race). It is not enough, and it does not run in CI.

**CI gap.** `@expo/metro-file-map` has no unit-test job. Changing the package only triggers `cli.yml` (`@expo/cli` e2e on Ubuntu and Windows). Those e2e tests do not install a package against a running Linux FallbackWatcher. The red/green the author ran locally is not a merge gate.

**Unit tests that should exist before we call this locked:**

1. Keep the two new tests (before-watch write / after-watch write). They are the only automated guard of the ordering change.
2. `ignored` directories still skip both the watch and the walk (`filterDir` returns false). This path used to be the only `filterDir` user; it is now mixed with watch-start. Easy to break.
3. `startWatching` still finishes and still watches nested dirs. The initial crawl now watches from `filterDir` too; a hang or a missed child watch is a regression of startup, not of install.
4. A nested dir created during the walk (`pkg/build/package.json`) is reported. Real installs are not a single directory.
5. TreeFS `caches null result from fallback.lookup and does not re-query` stays green. That test is the inertness lock for Kitten's perf constraint. Do not "fix" it.
6. Optional but cheap: if `readdir` fails after `filterDir` watched, either close the handle (restore old failure semantics) or assert the leftover watch does not emit a file event FileMap would accept.

**Verification that should actually be run**, not just described in a stale PR body:

```text
# Automated (local; add to CI if this package is going to keep real-fs tests)
cd packages/@expo/metro-file-map && pnpm test && pnpm typecheck && pnpm lint
# Must include: FallbackWatcher #48950 red/green, TreeFS negative-cache green

# Inertness of the dropped designs
git diff origin/main -- packages/@expo/metro-file-map/src/lib/TreeFS.ts
git diff origin/main -- packages/@expo/metro-file-map/src/watchers/NativeWatcher.ts \
  packages/@expo/metro-file-map/src/watchers/WatchmanWatcher.ts
# both empty

# Motivating repro — Linux, Watchman not used, bun
# create-expo-app (SDK 57), npx expo start (no CI=1),
# import a not-yet-installed expo-* package (bundle 500, expected),
# npx expo install <pkg> with the server still up,
# next bundle of that import is 200 within a few seconds. No restart.

# Control (same machine): create a file under the project root after start, import it, 200.
# Control (macOS, if available): same install-while-running flow still 200 (NativeWatcher inert).

# Explicit non-goal, do not treat as a fail of this PR:
# yarn add firebase (thousands of dirs) may still lose files — same as main.
# A resolve of a path outside watchFolders after a prior miss still misses — same as main.
```

Kitten: "Testing here is also OS and package manager dependent." So the live check has to name the backend (FallbackWatcher / Linux / `useWatchman: false`) and the package manager (bun, because that is what `expo install` used in the issue). A green macOS smoke test does not verify this fix; it only verifies inertness.

The author's later sandbox table (main 500 forever, this change 200 at t+5s for `expo-print` / `expo-battery`; npm/yarn/bun harness with remaining yarn+firebase overflow) is the right *shape* of evidence. Put that in the PR body, replacing the deleted-timer numbers. Do not merge on a description that still claims 500 ms / 2 s re-scans.

## Issues

### Issue 1 -- Severity: suggestion
- File: packages/@expo/metro-file-map/src/watchers/FallbackWatcher.ts:183
- Description: `#watchdirDuringWalk` has a 16-line comment that narrates walker internals, the old race, the package-manager scenario, and issue #48950. Repeated again at the `filterDir` site (454–457). Design history, not a WHY.
- Suggestion: One line: “Watch before the walker `readdir`s so an entry cannot land between the listing and `fs.watch`.”
- Status: open

### Issue 2 -- Severity: suggestion
- File: packages/@expo/metro-file-map/src/watchers/FallbackWatcher.ts:458
- Description: `filterDir` now `fs.watch`es before `readdir`. If that `readdir` fails (EACCES, or ENOENT because a tmp extract dir vanished), walker never emits `'dir'`. Old code never watched that path. New code leaves an `FSWatcher` in `#watched` until `stopWatching`. Extract-then-rename installs can leak one fd per raced tmp dir.
- Suggestion: On walker `'error'` for that directory, close and drop the watch. I would not block on this.
- Status: open

### Issue 3 -- Severity: suggestion
- File: packages/@expo/metro-file-map/src/watchers/__tests__/FallbackWatcher.test.ts:68
- Description: Success for #48950 is "next bundle after `expo install` on a running Linux / no-Watchman server resolves the package, without restarting." These two tests pin the watch-before-`readdir` race and that is necessary, but they do not lock the rest of the contract. `@expo/metro-file-map` unit tests are not in CI (a change here only runs `@expo/cli` e2e). There is no test that `ignored` dirs still skip the walk, that `startWatching` still completes, or that a nested `pkg/build/` file is reported. The TreeFS negative-cache test is the inertness lock for Kitten's perf review and is not mentioned in the PR plan. The live verification in the PR body still describes the deleted 500 ms / 2 s timers.
- Suggestion: (1) Keep these two real-fs tests. (2) Add ignore + nested-dir cases, and treat `TreeFS` "caches null result from fallback.lookup and does not re-query" as a must-pass on this PR. (3) Run `pnpm test` in this package as a required check, or the new tests are not a gate. (4) Replace the PR test plan with the Linux/bun install-while-running bundle-200 repro, plus explicit non-goals: overflow, outside-root fallback misses, `ExpoAsset` copy, macOS/Watchman inert. (5) Do not reintroduce watcher-local re-scan timers or TreeFS miss re-checks to chase the leftover cases.
- Status: open

## Not issues

- TreeFS miss cache for in-root `node_modules` (`rootPattern` blocks fallback).
- `includedByGlob('d')` dropping packages (`dot: true`).
- Directory `touch` before the read (FileMap ignores `type === 'd'`).
- Metro resolution-cache stickiness (failures are not stored; `_onHasteChange` clears successes).
- Partial `package.json` during the write (Haste skips `node_modules`; `PackageCache` parse errors are not cached).
- Inotify overflow on huge `yarn add`s (pre-existing; needs recrawl).
- macOS / Watchman (different backends).

## Process

The PR body still describes the deleted timers + TreeFS change and a test plan that measured them. Update it. This is also a clean upstream candidate against facebook/metro `FallbackWatcher`.
