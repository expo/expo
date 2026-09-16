# Router-owned browser history

## Request and checkout

- Work in `/Users/jakubtkacz/.codex/worktrees/dabb/expo` on `@ubax/eng-22046-derive-browser-history-from-reducer`.
- Fetched and pulled the branch; starting commit is `4e985efdca5dcf415cfd3374e88e93af36d3739b`.
- The same branch is checked out in another worktree; do not edit that worktree or commit/push without considering its shared branch reference.
- Make browser-history decisions belong to routers, including two consecutive nested `router.push` calls producing two entries. Keep browser back and in-app back aligned wherever owned browser entries allow it.

## Findings

- `RouterActionResult` already wraps `{ state, affectedRouteKey }`, so adding optional history metadata fits the existing contract without changing navigation-state serialization.
- `reduceNavigationTree` currently discards action-result metadata and rebuilds ancestors. `useNavigationTreeReducer` then calls `projectBrowserHistory`, which infers push/pop from `findMatchingState` and `getHistoryLength`.
- Browser entries and event ordering already live in the pure reducer. The adapter alone writes `window.history`, and browser-originated changes restore saved states with removal prevention.
- StackRouter and TabRouter already normalize results in outer wrappers. Expo's stack-router wrapper can further modify results for singular routes and dismissal, and must preserve/correct history decisions.
- Existing Playwright coverage includes batched nested pushes and anchored deep links, but should compare in-app and browser traversal explicitly.

## Implementation

1. Write failing regression tests first. Cover router-owned decisions (including a custom router overriding state-shape inference), stack pushes/pop/replace/preload, nested handling and batched entries, and prevent-remove/browser restore behavior.
2. Add a documented optional browser-history instruction to `RouterActionResult`: push a single entry, traverse back by a router-selected count, or replace the current entry by default. Keep metadata out of navigation state.
3. Make StackRouter and TabRouter select instructions from their action semantics and actual local result. Account for no-ops, preloaded routes, route-name reconciliation, resets, tab back behavior, and wrappers such as DrawerRouter and Expo's singular stack router.
4. Carry the instruction from the handling router through `reduceNavigationTree`. Apply it only after the navigation is accepted. Structural repairs replace the current entry; prevented/no-op actions do not move history. Browser restores suppress normal projection.
5. Replace global focused-state inference in `browserHistory.ts` with applying the instruction. Preserve forward-entry truncation, stable entry IDs, bounded backward traversal, URL refreshes, and browser restoration semantics. Preserve native no-op behavior.
6. Extend the nested-stack browser fixture/tests to alternate browser back/forward with `router.back`, checking both URLs and visible routes after the two synchronous pushes. Record any unavoidable limitation around anchors synthesized at startup and browser entries from before the page load (the browser does not expose those states).
7. Update package architecture notes and changelog where needed.

## Validation

- Follow `.claude/CLAUDE.md` red/green requirements.
- Run focused router/tree/browser-history tests during development, then package tests, build/typecheck, and lint per `packages/expo-router/AGENTS.md`.
- Attempt the relevant Playwright browser-history test using repository tooling. This is a web history change; browser E2E is the relevant runtime check.
- Request the fresh senior-engineer agent review required by package AGENTS.md after implementation, while performing final checks locally.
- Log commands, results, limitations, and design adjustments in `Progress.md`.

## Context handoff

Read this plan and `Progress.md` after compaction. No implementation edits existed when this plan was written. Tools expose no explicit context-compaction operation; preserve this checkpoint and proceed from these files if automatic compaction has not occurred.


## Adjustments from regression tests and review

- Add optional `getBrowserHistoryForRouteFocus(previous, next, childAction)` so parent routers can contribute decisions without inspecting navigator types in global code. Explicit `replace` consumes drawer-state entries during child navigation.
- Pop metadata includes an optional navigator/route destination; owned browser snapshots resolve the actual browser distance across nested stacks. The count remains a fallback for synthetic anchors.
- Forward singular/deduplicated visits push when focus changes even if state length does not grow. Earlier browser snapshots survive explicit navigator deduplication; absolute equivalence is not promised for those conflicting histories.
- The exact batch from an unmounted tab exposed a separate sequencing requirement: process one queued destination per committed transition, allowing router registration before the next href. Browser traversals/back/replace/reset/dismiss can supersede suspended navigation. Queue entries have stable identities across React rebasing.

- Final scope: serialize web queue commits only; native uses its original batched drainer. Browser restore captures the last committed reducer snapshot and drops speculative commands from suspended destinations.
