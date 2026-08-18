# Consolidated review: expo/expo#48954

Base: `a91ec7344096cccdf0d6030e281572ba747c004e`  
Reviewed head: `72023ba5f8f1e982b2d2ef115d4e5931aee77c33`  
Current head: `da5657155c4a589756c3feb9dabaf7d90d9fa559`

The current head differs from the independently reviewed head only by the formatter-required import reorder in `FallbackWatcher.test.ts`; `check-packages` is now green. The production watch-before-read fix is sound for the diagnosed race, but the following findings remain.

## Findings

### [P2] Remove a provisional watcher when its directory read fails — `packages/@expo/metro-file-map/src/watchers/FallbackWatcher.ts:458`

The new order creates and records a watcher before `walker` has established that the directory can be read:

```ts
walk.filterDir((currentDir: string, stats: Stats) => {
  if (ignored && common.posixPathMatchesPattern(ignored, currentDir)) {
    return false;
  }
  beforeReaddirCallback(path.normalize(currentDir), stats);
  return true;
});
```

The later read-error path only forwards the error; it does not roll back that watch. Cleanup also assumes that calling `close()` will always produce a future `close` event:

```ts
await new Promise<void>((resolve) => {
  watcher.once('close', () => process.nextTick(resolve));
  watcher.close();
  delete this.#watched[dir];
});
```

**Trigger:** On Windows without Watchman, a newly discovered directory disappears after `fs.watch` succeeds but before `walker` completes `readdir`. Windows reports `EPERM` for deletion of a watched directory; Node closes the errored `FSWatcher` internally, and the existing code deliberately ignores that `EPERM`.

**Problem:** The now-unusable object remains in `#watched`. A later directory at the same path is treated as already watched, and `stopWatching()` can wait forever because `close()` on Node's already-closed watcher is a no-op and emits no second `close` event.

**Impact:** Later files at the reused path can again be absent from Metro's file map, and watcher shutdown can fail to complete.

**Evidence:** A base/head state-transition harness produced `childWatchCalls=0 → 1` with clean shutdown on base, versus `1 → 1` with timed-out shutdown on head after modeling Node's documented closed-handle state. Node's behavior is explicit in its [FSWatcher documentation](https://nodejs.org/api/fs.html#fswatchfilename-options-listener) and [watcher implementation](https://github.com/nodejs/node/blob/v24.3.0/lib/internal/fs/watchers.js#L203-L220).

**Adversarial check:** The generic bookkeeping weakness for errored, fully established watchers predates this PR, and a timely parent-directory deletion event normally cleans up the child. This finding is limited to the new pre-read interval where the PR creates a provisional watcher before a successful directory read; it requires the child error to win the cleanup race.

**Suggested direction:** Remove the exact watcher from `#watched` when it errors, make close cleanup idempotent without waiting for a second `close`, and roll back provisional watches when that directory's walk fails.

### [P3] Debounce symlinks discovered during the watch/read overlap — `packages/@expo/metro-file-map/src/watchers/FallbackWatcher.ts:340`

Regular files discovered by the walk use `#emitEvent`, but symlinks bypass the debounce:

```ts
(symlink, stats) => {
  if (this.#register(symlink, 'l')) {
    this.emitFileEvent({
      event: TOUCH_EVENT,
      relativePath: path.relative(this.root, symlink),
      metadata: {
        modifiedTime: stats.mtime.getTime(),
        size: stats.size,
        type: 'l',
      },
    });
  }
},
```

**Trigger:** A package manager creates a symlink after the new pre-read watch starts but before `readdir` completes.

**Problem:** The walk emits an immediate touch and the watch path emits another through the 100 ms debounce. Because the first event never enters `#changeTimers`, the second cannot replace it.

**Impact:** Expo enables symlink processing, so both touches normally become separate FileMap/plugin updates and can cause redundant cache invalidation or HMR work. The final filesystem state remains correct.

**Evidence:** An exact real-filesystem overlap reproduction emitted one symlink touch on base and two on head, 113 ms apart. FileMap batches every 30 ms and deduplicates only within the current batch, so the second event normally survives downstream.

**Adversarial check:** The scheduling frequency is platform-dependent and consumers should tolerate duplicate filesystem notifications; no state corruption was demonstrated. That limits this to P3.

**Suggested direction:** Route walk-discovered symlinks through `#emitEvent`, matching regular files, and add an overlap regression test.

### [P3] Make the polling deadline shorter than Jest's test timeout — `packages/@expo/metro-file-map/src/watchers/__tests__/FallbackWatcher.test.ts:19`

```ts
const WAIT_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 10;

async function waitFor(predicate: () => boolean, description: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > WAIT_TIMEOUT_MS) {
      throw new Error(`Timed out after ${WAIT_TIMEOUT_MS}ms while waiting for ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
```

**Problem:** This suite has no `testTimeout` override, so Jest Circus 29.7 uses its 5 second default. Jest aborts first, making the helper's descriptive 10 second failure unreachable; it also does not cancel the polling promise.

**Impact:** A slow event between five and ten seconds is reported as a generic Jest timeout, and polling can continue after the test has failed while teardown is running.

**Evidence:** The package config contains no override, and the installed Jest Circus initializes `testTimeout: 5000`. Focused and full-suite runs passed, so an asserted persistent watcher leak was not treated as proven.

**Suggested direction:** Set the test timeout above the polling deadline plus teardown, or reduce `WAIT_TIMEOUT_MS` below five seconds.

### [P3] Link the changelog entry to the PR and author — `packages/@expo/metro-file-map/CHANGELOG.md:11`

The current entry is:

```md
- Pick up files written into a new directory while `FallbackWatcher` starts to watch it, so a package installed while the dev server runs is resolvable. ([#48950](https://github.com/expo/expo/issues/48950))
```

The repository's changelog guide requires links to the associated PR and author. This is functional release metadata: publishing automation scans the referenced PRs to notify closed issues when fixes become available.

**Suggested direction:** Use the established suffix `([#48954](https://github.com/expo/expo/pull/48954) by [@expo-bot](https://github.com/expo-bot))`; retain the issue link in the prose if useful.

## Merge actions and open verification

1. Replace the PR description. It still claims the implementation contains 500 ms/2 s rescans and a `TreeFS` miss-cache change, but the current implementation contains neither. The accurate current-design evidence is in the [follow-up verification comment](https://github.com/expo/expo/pull/48954#issuecomment-5302902391).
2. Run `@expo/metro-file-map` on Windows before merge. The implementation affects Windows without Watchman, but both Windows jobs are skipped for pull requests and all current-design manual measurements were Linux.
3. Prefer a deterministic order test that asserts `fs.watch(directory)` occurs before `fs.readdir(directory)`. The existing real-filesystem test passed against both buggy base and fixed head on macOS, although Ubuntu PR CI exercises the intended Linux behavior.
4. Consider repeating the literal `npx expo install` plus Expo Go workflow. Current-design evidence used direct `bun add` with a running SDK 57 server; this is close to, but not identical to, the reported end-to-end route.

## Verification summary

- Inspected all three changed files plus `walker@1.0.8`, watcher selection, FileMap batching/deduplication, Expo's symlink configuration, and Node `FSWatcher` lifecycle semantics.
- Verified the core watch-before-read invariant and unchanged ignore behavior.
- Ran the exact regression suite against base and head on macOS: 2/2 passed on each, exposing the portability limitation.
- Ran the reviewed-head package suite: 18 suites and 701 tests passed.
- Current-head `check-packages`: success. Windows jobs: skipped.
- The formatting failure reported against `72023ba5` is resolved at `da565715` and is not a current finding.
- Inotify queue overflow, `TreeFS` fallback misses, the misleading `ExpoAsset` diagnostic, and upstreaming are separate follow-ups rather than findings in this PR.
