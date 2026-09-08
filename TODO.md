# Link.Preview reliability

## Status

The nested dismiss/reopen failure is fixed. The implementation also addresses stale native completions, delayed preload reports, early transition events, and ambiguous native tab names. No timing delay was added; the existing cancellable activation-path timeout remains.

## Completed implementation

- [x] Preserve the exact native-reported `screenId` as `__internal__PreviewKey` through action resolution and nested stack reduction.
- [x] Keep the key in action metadata, outside public route params. Do not restore `useNextScreenId` or JS route-key guessing.
- [x] Promote only the exact preloaded key with the matching route name. Stacks that do not own it perform ordinary navigation.
- [x] Preserve the already-active nested child state when its preloaded ancestor is promoted.
- [x] Capture the screen, owning stack, screen ID, and tab commands once at tap; report and consume the same activation.
- [x] Reject detached, replaced, rekeyed, cancelled, and already-promoted native screens. Consume each activation at most once.
- [x] Capture native tab targets so a later controller reorder cannot switch an unrelated tab.
- [x] Match native tab activation paths by route key, bridged through an internal `nativeID`; keep React Native Screens' name-based `screenKey` contract intact.
- [x] Keep a synchronous preview-key ref and an always-installed transition listener for events arriving before React renders the key.
- [x] Ignore late transition events from older previews.
- [x] Clear animation suppression when the matching navigation commit falls back because its native key disappeared or remains preloaded. Inspect the committed root tree, excluding stack routes after `index`.
- [x] Assign a fresh correlation ID to every prefetch attempt; reject delayed reports and timeout callbacks from older openings or other links.
- [x] Cancel pending activation-path publication on close while preserving an already-captured native commit.
- [x] Preserve no-screen-ID navigation and the iPad close-then-navigate flow.
- [x] Remove temporary debug logging and restore the test-only Podfile.lock change.

## Evidence and regressions

The original iPhone failure was reproduced locally. Exact-key propagation alone was rebuilt and retested before adding lifecycle and transition fixes; it still returned to Nested Index. The combined fix passed five dismiss/reopen/commit cycles, plus first-opening commit, with L2 remaining focused and no `activityState can only progress` warning in the final Metro log.

The successful trace reports the inactive outer `l1` key and renders that same screen at activity state `2`; the nested `l2` remains active. The precise original native-to-React `2 -> 0/1` ordering was not fully captured. Deterministic failing regression tests established the early-transition and delayed-preload races independently; native ownership checks also protect the asynchronous UIKit completion.

- [x] Exact key selection among same-name preloads; missing and mismatched keys use ordinary navigation.
- [x] Nested `/nested/l1/l2` promotion preserves the active child key, route count, and index.
- [x] Native path walker selects inactive `l1`, not active `l2`.
- [x] Native activation tests cover replacement, detachment, rekeying, cancellation, single consumption, and JS-first promotion.
- [x] Early transitionStart and old transitionEnd regressions.
- [x] Reopen, concurrent links, late preload reports, and cancellation regressions.
- [x] Same-name JS/native tab collision and native route-key bridge regressions.
- [x] Missing/still-preloaded key cleanup, nested active ownership, and older action report regressions.
- [x] Fresh senior review of the implementation; review findings incorporated.

## Automated verification (2026-09-08)

- [x] Final focused link/global-state/stack/transition tests: 37 suites, 439 passed, 1 skipped, 25 snapshots.
- [x] Native-tab tests: 34 suites, 643 passed, 1 skipped, 30 snapshots.
- [x] Full `CI=1 pnpm test --runInBand --silent`: 404 suites, 5,147 passed, 12 skipped, 257 snapshots.
- [x] Final context regression suite: 4 passed after validating the current stack-state representation.
- [x] `CI=1 node tools/bin/expotools.js check-packages expo-router`: all checks passed, including type checking, build, lint, and formatting.
- [x] `git diff --check`.
- [x] Fresh router-tester iOS development client built and installed.
- [x] Native unit tests: 40 tests in 10 suites passed.

The `et native-unit-tests -p ios --packages expo-router` command hit the existing C++ runtime linker failure. Running the same `ExpoRouter-Unit-Tests` scheme directly with `OTHER_LDFLAGS=$(inherited) -lc++` succeeded. This was a test invocation override; no linker workaround was added to the repository.

## Simulator verification

Fresh local RouterTester, iPhone 17 Pro, iOS 26.5:

- [x] `/nested/l1/l2`: dismiss, reopen, commit, remain on L2, five repetitions.
- [x] `/nested/l1/l2`: commit on first opening.
- [x] Simple stack preview to `/nested/l3`.
- [x] Nested child stack preview from L3 to `/nested/l3/l4`.
- [x] Current-route preview remains on L4.
- [x] Preview navigation from L4 to `/nested` reaches Nested Index.
- [x] JS tabs: index to second, then second to index.
- [x] NativeTabs: `/tabs` to `/tabs/faces`, reaching Face Gallery.
- [x] Normal back navigation after preview commits continues working; animation-reset behavior is covered by transition/context tests.
- [ ] Visually verify a later ordinary push animation.
- [ ] Complete iPad runtime verification. The iPad 26.5 client was installed, but Argent taps did not dismiss its system launch dialog. Direct launch did not resolve it; the fallback Computer Use tool reported missing permissions. This remains unverified, not a passing result.
- [ ] Broader device/OS and navigator-composition matrix, including SplitView, has not been exhaustively tested.

No EAS sessions were created. Task-owned Metro, device-console capture, and simulator automation servers are stopped after verification; the task-booted iPad is shut down. The pre-existing iPhone simulator remains running.
