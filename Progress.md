# Progress

## Final status

Implementation completed on `@ubax/eng-22046-derive-browser-history-from-reducer` from base `4e985efdca5`.

- Routers own browser history instructions, including parent-focus changes and nested pop targets.
- The exact two synchronous pushes create two browser entries even when the destination tab stack has not mounted. Both browser back and `router.back()` reach the intermediate Details screen.
- Web queue sequencing preserves router registration and permits cancellation of suspended navigation. Browser restores discard speculative commands. Native batching is preserved.
- Independent senior-engineer review completed; all blocking findings addressed and verified.
- Final validation: 8/8 Chromium browser-history E2Es passed; build/typecheck/lint passed. Full package run: 420 suites passed, 5,366 tests passed, 9 skipped; only 3 unchanged RSC asset-path snapshots failed because shared dependency transforms encode the worktree's relative path. No snapshots updated. Lint reports one existing React Compiler memoization warning in StackToolbarMenu/native.android.tsx.

### Remaining limits

- Browser entries from before page load and synthetic initial anchors cannot always have matching navigator history; existing fallback behavior is preserved.
- Explicit singular/tab deduplication can remove old navigator routes while older browser snapshots remain accessible. Immediate forward/back visits and pops to surviving destinations are covered; absolute equivalence after exhausting deduplicated navigator history is not claimed.

### Re-run validation

From `packages/expo-router`: `pnpm build`, `pnpm typecheck`, `CI=1 pnpm test --runInBand --watch=false`, then `pnpm lint`.

From `packages/@expo/cli`: `CI=1 pnpm test:playwright navigator-browser-history --workers=1 --retries=0 --reporter=list`.

Dependencies are locally linked to `/Users/jakubtkacz/Documents/code/expo`; expo-router's build output is generated in this worktree. Generated dependencies/build output are ignored and are not part of the changes.

## Planning checkpoint

- Checked out and pulled `@ubax/eng-22046-derive-browser-history-from-reducer` at `4e985efdca5` in the requested worktree. No upstream changes were pending.
- Read Expo overview/router skills, package AGENTS.md, and `.claude/CLAUDE.md`.
- Saved implementation plan to `PLAN.md` before changing source or tests.
- Context compaction was requested; no explicit compaction tool is available. The plan and this progress file provide the continuation checkpoint.
- Dependency directories are absent in this worktree; the existing checkout at `/Users/jakubtkacz/Documents/code/expo-router-tester` has dependencies and build output. Arrange validation without modifying that checkout's source.

## Original implementation steps — completed

1. Establish local test tooling and write failing regression tests.
2. Implement router-owned instructions and replace global inference.
3. Run focused/full checks, browser E2E, and required independent review.

## Implementation checkpoint

- Red: three new reducer regressions failed on the original code (six failures across Web/Node): custom push ignored, custom state growth incorrectly pushed, and growing RESET incorrectly pushed.
- Added optional `RouterActionResult.browserHistory` instructions and carried them through the tree reducer. The browser projector now applies instructions instead of inspecting focused navigator lengths.
- Stack/Tab routers choose instructions; Expo stack overrides preserve metadata and recompute it after singular filtering.
- Green: focused tree/projector/reducer tests passed (5 suites, 62 tests).
- Added router semantics tests. Drawer open/back failed as expected; now implementing explicit drawer instructions to preserve same-URL back behavior.
- Added E2E coverage alternating `router.back`, browser back, and forward after two synchronous nested pushes, including browser entry-count assertions.
- Reused existing dependency directories via local symlinks and built this worktree's expo-router source. Build-directory symlinks were converted to ignored generated-output directories; no dependency/build outputs are tracked.

## Review and broader validation

- Initial runtime validation passed: 7/7 Chromium browser-history E2Es, including alternating back/forward after two pushes and anchored reloads.
- Router suites passed: 33 suites / 954 tests.
- Initial full package run: 418 suites passed; only 3 existing RSC asset snapshots failed because the linked dependency transformer emits a different relative path for this worktree (same sitemap.png, different checkout path). No snapshot updates made.
- Independent senior review found parent focus decisions missing, singular/deduplicated forward visits incorrectly treated as replace/pop, and parent pop counts failing to account for nested browser entries.
- Added failing regressions for hidden-child parent focus, singular promotion, and nested pop targeting; confirmed failures before fixes.
- Extended the contract with a router-owned focus hook and optional pop destination (navigator/route keys). Browser projection resolves that destination among owned snapshots, falling back to the bounded count for unknown/synthetic destinations.
- Stack and history-based tab promotions now create visits even when deduplication does not grow the state. Older browser entries removed from navigator history by explicit singular/dedup options are still browser history; complete equivalence of those incompatible history policies is not claimed.
- Typecheck initially found overly broad types in the new tests; narrowing the fixtures before final validation.


## Unmounted-stack regression and queue fix

- New Chromium regression executes the user's two pushes directly from Home before Explore mounts. Red: expected two new entries, observed one.
- Cause: the old drainer dispatched the entire batch before the child router registered, so both actions reached the parent tab router and the second replaced nested state.
- Drainer now commits one destination per transition. Added red/green test asserting router layout-effect registration occurs between intents.
- Review caught cancellation being blocked behind suspended destinations. Added red/green tests for GO_BACK and browser popstate interruption, plus repeated enqueue of one intent object. Queue entries now get a stable per-enqueue identity outside updater functions; superseded prefixes are removed by identity to survive React transition rebasing.
- Green: all 18 drainer/provider tests; exact previously-unmounted-tab Chromium regression passes with two entries and both back controls reaching Details.
- Follow-up drawer composition regression also passes: navigation consumes a drawer state entry via explicit replace instead of deleting the prior page.
- The original dependency checkout was removed externally during validation. Repointed local dependency/build links to `/Users/jakubtkacz/Documents/code/expo`; source in that checkout was not modified.


## Final review fixes

- Confirmed the exact unmounted-tab E2E is green, then all 8 Chromium browser-history scenarios passed together.
- Added actual reducer/suspense red-green coverage for browser restoration: pending PUSH commands from an uncommitted screen were leaking into the committed report. Browser intents now capture the last committed reducer snapshot; restoration discards speculative state/history/commands while event IDs remain monotonic.
- Limited per-destination queue commits to web using `RoutingQueueDrainer.native.tsx` with the original implementation. Native batching is an existing contract, and serializing native actions caused observable extra intermediate states. All affected native suites now pass unchanged.
- Latest targeted validation: 31 suites passed, 547 tests passed, 2 skipped, all 4 snapshots passed (global state plus affected native navigation/protection/router suites).

## PR explanation document

- Added `PR_EXPLAINED.md` as a low-context, step-by-step guide to the complete PR.
- Documented the original problem, router-owned history contract, reducer/report/adapter pipeline, exact unmounted-stack push sequence, browser restoration, nested pop targets, prevention, Suspense handling, native behavior, tests, and known limits.
- Added Mermaid flow and sequence diagrams, decision tables, source links, and a suggested review order.
- Proofread source links against the current tree and ran `git diff --check`.
