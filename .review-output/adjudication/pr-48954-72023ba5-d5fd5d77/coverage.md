# Coverage report

## Review snapshot

- Pull request: `expo/expo#48954`
- Base: `a91ec7344096cccdf0d6030e281572ba747c004e`
- Reviewed head: `72023ba5f8f1e982b2d2ef115d4e5931aee77c33`
- Current head at final consistency check: `da5657155c4a589756c3feb9dabaf7d90d9fa559`
- Current-head delta: import-order-only formatting fix in `FallbackWatcher.test.ts`

## Changed files

### `packages/@expo/metro-file-map/src/watchers/FallbackWatcher.ts`

Inspected the complete base/head implementations plus first-order consumers.

- Verified `walker@1.0.8` calls `filterDir(entry, stat)` before `fs.readdir` and emits `dir` after the read.
- Verified the ignore predicate still runs before watch creation or descent.
- Verified root-watch creation remains idempotent.
- Verified regular-file overlap is suppressed by `#register` and `#emitEvent`.
- Verified directory touch events are discarded by FileMap.
- Found and separately reproduced the symlink overlap duplicate.
- Modeled and independently challenged the provisional-watch/read-failure lifecycle on Windows using Node's documented `FSWatcher` error behavior.
- Checked deletion, watcher-error, path-reuse, and shutdown paths.

### `packages/@expo/metro-file-map/src/watchers/__tests__/FallbackWatcher.test.ts`

- Ran the exact test against the buggy base and reviewed head on macOS: both passed 2/2, proving it is not a portable red/green test.
- Ran the reviewed-head package suite: 18 suites and 701 tests passed.
- Confirmed the 10 second polling deadline conflicts with Jest Circus 29.7's 5 second default.
- Confirmed Ubuntu PR CI runs the affected package's Jest suite.
- Confirmed Windows package and CLI jobs are skipped for pull requests.
- Confirmed the reviewed-head formatting failure and the current-head formatting-only fix; current `check-packages` is green.

### `packages/@expo/metro-file-map/CHANGELOG.md`

- Verified the description accurately reflects the current implementation.
- Verified the entry omits the associated PR and author links required by the repository changelog guide.

## First-order dependencies and consumers

- `walker@1.0.8`: exact filter/read/event ordering inspected.
- `Watcher.ts`: fallback selection inspected; `FallbackWatcher` is used when Watchman is disabled and `NativeWatcher` is unsupported.
- `NativeWatcher.ts`: native backend is supported only on Darwin, leaving Windows on `FallbackWatcher`.
- `createFileMap-fork.ts`: Expo enables symlink tracking.
- `FileMap#index.ts`: directory filtering, 30 ms batching, duplicate detection, symlink processing, and change emission inspected.
- Node `FSWatcher`: official error/close contract and Node 24.3 implementation checked for the Windows lifecycle candidate.

## Residual limitations

- The provisional-watch lifecycle was proven with exact base/head code and modeled Node semantics, not reproduced on a native Windows host.
- The current design has not been rerun through the issue's literal `npx expo install` plus Expo Go workflow; the closest evidence uses `bun add` against a running SDK 57 server.
- Kernel event-queue overflow, `TreeFS` fallback misses, and the misleading `ExpoAsset` diagnostic are intentionally outside this PR's verified scope.
