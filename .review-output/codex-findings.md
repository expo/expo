# Codex review: expo/expo#48954

- PR: https://github.com/expo/expo/pull/48954
- Reviewed head: `72023ba5f8f1e982b2d2ef115d4e5931aee77c33`
- Base: `a91ec7344096cccdf0d6030e281572ba747c004e`
- Scope: current three-file diff, issue #48950, maintainer review feedback, CI, and focused local verification
- Verdict: **the production ordering change is technically sound for the diagnosed Linux race, but I would not merge yet without tightening the regression test, verifying the affected Windows path (or gating it to Linux), and rerunning the exact motivating workflow.**

## Findings

### P1 — The affected-platform proof is incomplete, and the regression test is not portable

`FallbackWatcher` is not Linux-only. With Watchman disabled, the selection code uses it on every platform except macOS:

```ts
// packages/@expo/metro-file-map/src/Watcher.ts
const WatcherImpl = useWatchman
  ? WatchmanWatcher
  : NativeWatcher.isSupported()
    ? NativeWatcher
    : FallbackWatcher;

// packages/@expo/metro-file-map/src/watchers/NativeWatcher.ts
static isSupported(): boolean {
  return platform() === 'darwin';
}
```

The PR changes both Linux and Windows, but PR CI skips `check-packages-windows`; that workflow only runs on schedule or manual dispatch. The PR's measurements were all Linux.

The new test is also not a platform-independent red/green guard. It assumes a file written immediately before the real `fs.watch` starts cannot generate an event:

```ts
jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
  if (dir === packageDir && !watchedPackageDir) {
    watchedPackageDir = true;
    fs.writeFileSync(path.join(packageDir, 'package.json'), '{"name":"new-pkg"}');
  }
  return (realWatch as any)(dir, ...rest);
}) as typeof fs.watch);
```

I copied this test unchanged onto the buggy base commit and ran it on macOS. It passed 2/2. An instrumented run showed why:

```text
rawWatchEvents: [ 'node_modules/new-pkg:rename:package.json' ]
PASS FallbackWatcher.test.ts
Tests: 2 passed, 2 total
```

macOS FSEvents can report that just-prior write, so the buggy implementation is green there. That does not invalidate the Linux diagnosis—production macOS uses `NativeWatcher`—but it means this test cannot be treated as general proof.

Required before merge:

1. Add a deterministic unit test that records the calls and directly asserts `fs.watch(directory)` happens before `fs.readdir(directory)`. It must fail quickly on the base and pass on the head on every OS.
2. Keep a real-filesystem Linux integration test for the actual inotify behavior.
3. Run the affected suite on Windows. If Windows verification is unavailable, gate the changed ordering to Linux so Windows remains behaviorally unchanged, and scope the changelog/PR accordingly.

### P1 — The exact motivating workflow has not been closed end to end

Issue #48950's workflow is:

- SDK 57 Expo Router app
- Linux dev-server host, no Watchman
- Bun 1.3.14 selected through `npx expo install`
- install three packages in one command while `expo start --tunnel` remains running
- first add/import the modules after installation
- validate in Expo Go, including actual native-module calls

The current revision's strongest end-to-end evidence instead uses a blank app, direct `bun add`, one package at a time, and a package that is often imported before installation so the bundle is already poisoned. The bundle endpoint becoming HTTP 200 is good evidence for the file-map mechanism, but it does not verify the exact `npx expo install` integration or the reported Expo Go runtime route. The investigation explicitly never reproduced the misleading `ExpoAsset` error.

Before closing #48950, run the original steps unchanged against base and head. Success means:

- the same Metro process stays alive (record the server PID);
- no restart, cache clear, manual touch, or unrelated source edit is used to heal it;
- the post-install bundle becomes HTTP 200 within a fixed bound;
- the app renders in Expo Go and all three installed modules can actually be invoked;
- the file map contains each installed package's `package.json`;
- run both “first import after install” (the report) and “failed import before install” (negative-cache variant).

Because the base failed 2 of 4 observed cycles, an A/B harness with about 20 head cycles and interleaved base controls is a reasonable minimum. A head-only pass is not meaningful unless the same harness still reproduces failures on base.

### P2 — The real-filesystem test has inconsistent timeouts and already flaked locally

The helper waits up to 10 seconds:

```ts
const WAIT_TIMEOUT_MS = 10000;

while (!predicate()) {
  if (Date.now() - start > WAIT_TIMEOUT_MS) {
    throw new Error(`Timed out after ${WAIT_TIMEOUT_MS}ms while waiting for ${description}`);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
}
```

The normal Jest command still uses its 5-second test timeout. In one full macOS run, the second new test was aborted by Jest at 5 seconds while the other 700 tests passed; a repeat full run passed 701/701. On the buggy Linux implementation, the intended 10-second diagnostic cannot be reached under the normal command, and aborting early can leave the polling loop/watcher alive.

Make the timeout relationship explicit: either reduce the polling deadline below Jest's timeout or set a suite/test timeout longer than the polling deadline plus cleanup. Also platform-gate the real watcher integration so macOS does not run a test for a backend it never selects in production.

### P2 — The PR description describes code that is no longer in the PR

The body still says the fix adds 500 ms / 2 s rescans and changes `TreeFS`, and it cites the old 703-test plan and evidence for those deleted paths. The current diff has neither change; the second commit moves watch registration before the read and restores `TreeFS` to `main`.

Update the body before merge. Reviewers should not need to reconstruct the real design from the second commit message and a long bot comment. The updated body should clearly separate:

- fixed: the `readdir` → `fs.watch` blind interval in `FallbackWatcher`;
- unchanged: `TreeFS` negative-miss caching and its performance behavior;
- not fixed: inotify queue overflow, filesystem backends that do not reliably deliver events, and the unconfirmed `ExpoAsset` runtime route.

### Current CI blocker — formatting

At reviewed head, `check-packages` fails only because `FallbackWatcher.test.ts` is not formatted. The current code is:

```ts
import FallbackWatcher from '../FallbackWatcher';
import type { WatcherBackendChangeEvent } from '../../types';
```

`oxfmt` requires:

```ts
import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';
```

The Linux build/typecheck/test step passed before the format step failed. A bot fix was in progress while this review was written; remove this blocker only after the new head is pushed and CI is green.

### Non-blocking cleanup

- Match the package changelog convention by linking PR #48954 and its author, while retaining the issue link in the sentence if useful. Nearby entries use `([#PR](...) by [@author](...))`; the new entry links only issue #48950.
- Carry the regression test upstream (or file an upstream issue) for the vendored watcher logic so a future re-sync cannot silently restore the same ordering bug.
- Do not close #48950 as universally fixed by this PR alone. Track the inotify-overflow recovery/recrawl path and the misleading `ExpoAsset` diagnostic separately; track bounded `TreeFS` miss invalidation separately if that behavior is still desired.

## Why the production fix is plausible

The changed code installs the watch in `walker.filterDir`:

```ts
const walk = walker(dir);
walk.filterDir((currentDir: string, stats: Stats) => {
  if (ignored && common.posixPathMatchesPattern(ignored, currentDir)) {
    return false;
  }
  beforeReaddirCallback(path.normalize(currentDir), stats);
  return true;
});
walk
  .on('file', normalizeProxy(fileCallback))
  .on('symlink', normalizeProxy(symlinkCallback))
  .on('error', errorCallback);
```

The actual installed `walker@1.0.8` implementation confirms that hook runs before the read:

```js
if (stat.isDirectory()) {
  if (!that._filterDir(entry, stat)) {
    that.doneOne()
  } else {
    fs.readdir(entry, function(er, files) {
      // ...
      that.emit('dir', entry, stat)
      files.forEach(function(part) {
        that.go(path.join(entry, part))
      })
    })
  }
}
```

That establishes the intended invariant for a supported local filesystem while its event queue is healthy:

- entries stable before/during the read are present in the directory listing;
- entries created after watch registration generate watcher events;
- overlap is harmless because registration/debouncing deduplicates it;
- the old blind interval between read completion and watch registration is gone.

The fix adds no delayed rescans, no repeated `lstat` fallback, and no additional steady-state watches. `TreeFS.ts` and its tests have an empty diff from base, which addresses the maintainer's performance concern about repeatedly probing missing paths.

## Required verification matrix

| Scenario | Required result | Current evidence | Merge guardrail |
| --- | --- | --- | --- |
| Linux, no Watchman, gradual new-directory population (Bun/npm) | No stable file on disk is absent from emitted events/file map | Strong Linux bot evidence; head CI unit suite passes | Deterministic order test + real Linux red/base, green/head |
| Linux, atomic rename of a fully populated new directory | Complete subtree is listed and remains watched | Some package-manager stress evidence, but pattern is not classified | Explicit atomic-new-directory test |
| Existing watched package updated in place | Existing behavior unchanged; later writes still emit | Not isolated | Golden event-set comparison base vs head |
| Existing package directory atomically replaced | New inode is watched, or behavior is explicitly out of scope and no worse | Not isolated; `#watched[dir]` is keyed by path, so this deserves a targeted test | Replace-directory test followed by a late write |
| Windows, no Watchman | Same invariant or old behavior retained | Not run; PR Windows job skipped | Targeted Windows CI or Linux-only gate |
| macOS | `NativeWatcher` selected; behavior unchanged | Selection code unchanged; direct Fallback test is misleading on macOS | NativeWatcher selection/smoke test; skip Linux-specific integration |
| Watchman enabled | `WatchmanWatcher` selected; behavior unchanged | Source path unchanged | Selection/smoke test |
| Ignored directories, dot/glob filters, symlinks | Same visible events and watch count as base | Reasonable by inspection only | Parameterized parity tests |
| Directory disappears or `readdir` fails after watch creation | No unhandled error, duplicate public event, or leaked handle | Risk noted in AI review; not tested | Inject ENOENT/EACCES and assert cleanup/error behavior |
| Missing filename, EPERM, deletes/renames | Existing Windows fallback behavior preserved | Not run | Windows-specific tests |
| Large install below queue limit | On-disk stable file set equals emitted/file-map set | Strong stress evidence | Automated set comparison with raised queue |
| inotify queue overflow | Do not claim fixed; no worse than base; recrawl/restart work tracked separately | Yarn/Firebase still loses files at default queue, zero loss after queue increase | Separate overflow/recovery test and follow-up issue |
| Fallback paths outside watch roots / cached misses | No new `lstat` or resolution performance regression; current behavior unchanged | `TreeFS` diff is empty | Keep resolver benchmark/profile; do not claim this PR fixes it |

## Guardrail suite I would require

1. **Mechanism unit test:** mock/spy `fs.watch` and `fs.readdir`, assert watch-before-read directly, and prove base red/head green without relying on OS event history.
2. **Linux real-filesystem regression:** reproduce the exact gap with inotify; assert `package.json` and a late file are both reported; use coherent timeouts and close every watcher.
3. **Windows fallback job:** run the package suite on PRs when this package changes, with tests for path normalization, missing filenames, EPERM, deletion, and rename/replacement.
4. **Behavioral parity suite:** feed a static tree plus create/change/delete/rename/ignored/symlink cases to base and head, compare normalized file-event sets, watch counts, and open handles. Event ordering may differ only where required to close the race.
5. **Error and lifecycle suite:** fail `fs.watch` and `readdir` at each boundary; assert one intentional error, no crash from an unhandled `error` event, and no handle remaining after `stopWatching()`.
6. **Package-manager pattern harness:** test gradual new-directory writes, fully populated atomic rename, in-place update, and existing-directory replacement. Use Bun/npm/yarn/pnpm as representatives, but assert filesystem patterns rather than assuming manager names imply one pattern forever.
7. **Exact Expo E2E:** run issue #48950's `npx expo install` + Expo Router + Expo Go flow unchanged, with an interleaved base control and no server restart.
8. **Stress/performance:** compare the stable on-disk set to watcher/file-map output; measure watcher count, cold start time, CPU, and filesystem calls. Run once below overflow and separately under forced overflow. The latter belongs to recrawl/recovery, not this ordering patch.

## Verification performed in this review

- Inspected the live PR, issue #48950, maintainer review, inline comments, current CI, and the actual `walker@1.0.8` source.
- Tested an isolated checkout with the PR's exact dependencies.
- `pnpm run typecheck`: pass.
- `pnpm run lint`: pass.
- `pnpm run depscheck`: exit 0; existing types-only `@expo/metro` risky-dependency notice.
- Focused PR regression suite outside the filesystem sandbox: 2/2 pass.
- Full package suite outside the sandbox: first run 700/701 with one new real-watch timeout; repeat 701/701.
- GitHub Linux `check-packages` build/typecheck/test step: pass.
- `pnpm oxfmt --check packages/@expo/metro-file-map/src/watchers/__tests__/FallbackWatcher.test.ts`: fail on reviewed head.
- Buggy base + unchanged PR test on macOS: 2/2 pass, demonstrating the test is platform-specific rather than a universal red guard.
- Docker-based independent Linux reproduction was unavailable because the local Docker daemon is not running. I therefore treat the PR's Linux red/base evidence as reported evidence, not independently reproduced evidence.

## Bottom line

The watch-before-read change is a much better design than heuristic rescans and avoids the rejected `TreeFS` performance tradeoff. I found no production-code defect in that ordering invariant itself. The remaining work is about earning confidence appropriate for a high-risk watcher change: make the regression test test the ordering rather than an OS-specific event assumption, verify Windows or keep it inert, run the exact user workflow, and explicitly quarantine known overflow/TreeFS gaps from the claim this PR makes.
