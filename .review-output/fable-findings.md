# Deep review: expo/expo#48954

**PR:** [metro-file-map] Pick up packages installed while the dev server is running
**Head commit:** `72023ba5f8f1e982b2d2ef115d4e5931aee77c33`
**Verdict:** REQUEST_CHANGES — the fix is correct; blocking items are small, and the guardrail gaps below should be closed before or at merge.
**Reviewed by:** Claude (Fable 5), 2026-08-15

## What the PR does

On Linux and Windows without watchman, `FallbackWatcher` watched a new directory only **after** it read the directory's entries. A file written between the read and the watch produced no listing entry and no event, so Metro's file map stayed stale until a dev-server restart. This is the mechanism behind issue #48950 (`npx expo install` while `expo start` runs → red screen with a misleading `Cannot find native module 'ExpoAsset'`, or `Unable to resolve` for the installed package).

The fix moves the `fs.watch` registration into walker's `filterDir` hook, which runs **before** the read. The read then lists every entry that exists before the watch starts, and the watch reports every entry that appears after. No timer, no re-scan, no extra syscall.

History note: the first version of this PR used 500 ms / 2 s re-scan timers plus a `TreeFS` change. @kitten rejected both ("wrong layer", "performance regression"). The agent rewrote the PR to the current single-change design, which answers both objections directly.

## What success looks like

Derived from issue #48950 and the review feedback:

- **S1 — The user-visible bug is gone.** A package installed while the dev server runs becomes resolvable by the next bundle without a restart, on every platform that uses `FallbackWatcher` (Linux **and Windows** without watchman), with every common package manager (npm, yarn, pnpm, bun). Both symptoms from the issue disappear: the `Unable to resolve` bundling error and the misleading `ExpoAsset` red screen.
- **S2 — The design respects the feedback.** No timing heuristics in the watcher. Recovery from genuine event loss belongs to the recrawl layer above the watcher, not to the watcher (kitten's constraint). Hot paths such as the `TreeFS` miss cache stay unchanged.
- **S3 — Inert everywhere else.** Zero behavior change on macOS (`NativeWatcher`), on watchman setups, and in `TreeFS`. On the `FallbackWatcher` path itself: same syscall count, same event set, only the ordering changes.
- **S4 — No regressions.** Existing suites pass; ignored directories stay ignored; deletion and error paths keep their semantics.

**Where this PR lands against that bar:** S2 and S3 hold by construction (verified below). S1 holds for the deterministic race on Linux — verified live by the agent's before/after runs and pinned by a red/green unit test. Three gaps remain, and they define the follow-up work:

1. **S1 on Windows is asserted, not demonstrated.** No CI in this PR ran the package's tests on Windows (see guardrails).
2. **S1 still fails on kernel event-queue overflow.** The agent's own data shows `yarn add firebase` (9,491 files, 3,370 dirs in ~2 s) can overflow the default inotify queue (16,384 events) and silently lose files. No watcher-ordering change can fix that; it needs the recrawl/reconciliation layer kitten pointed at. Until that exists, large installs can still reproduce the issue — silently, with the same misleading error.
3. **The misleading error is untouched.** The issue explicitly asks that the error name the real problem and suggest a restart, instead of blaming `ExpoAsset`. Nothing in this PR addresses it, and it is exactly what users will see in the overflow case.

**Consequence:** merge this PR on its merits, but do not close #48950 as fully fixed on the strength of it alone. File follow-ups for: (a) recrawl-on-suspected-loss, (b) the misleading `ExpoAsset` error, (c) `TreeFS` fallback-miss invalidation (the reverted change, redesigned with bounds).

## Verification I performed

1. **Read `walker@1.0.8` source** (`lib/walker.js`, the pinned dependency). Confirmed all three properties the fix depends on:
   - `filterDir(entry, stat)` receives the stats object (line 58), so the emitted touch metadata is sound.
   - `filterDir` runs for **every** directory, including the walk root (`go(root)` → `lstat` → `filterDir`). The new-directory call site in `#processChange` therefore watches the new package directory itself, not only its subdirectories.
   - `filterDir` runs **before** `fs.readdir(entry)` (lines 58–61); the `dir` event fires only after the read (line 69). This ordering is the entire fix, and it is real.

2. **Confirmed the behavior change is safe downstream (S3).** The watch, the `#register(dir, 'd')`, and the directory `touch` event now happen even if the later `readdir` fails (for example, on a permission error), and the touch fires before the read confirms the directory is readable. `index.ts:828-829` drops all events with `metadata.type === 'd'`, so consumers see no difference. The `fs.watch` on an unreadable directory is inert and is cleaned up in `stopWatching()`.

3. **Checked error paths.** `#watchdirDuringWalk` wraps `#watchdir` in try/catch and routes failures through `#checkedEmitError` (ENOENT ignored, others emitted). This improves on `main`: there, an `fs.watch` throw inside the `'dir'` handler propagated as an uncaught exception inside walker's `readdir` callback.

4. **Checked for duplicate events.** A file created between watch start and read end is reported by both the watch and the walk. `#register` returns false on the second registration, and `#emitEvent` debounces by `event + relativePath` key. No duplicate emission reaches consumers.

5. **Checked the test design.** The test opts out of the memfs mock (`jest.unmock('fs')`) and uses real timers, both necessary: memfs watchers report grandchild entries and never emit `close`. The first test injects the `package.json` write at the exact moment `fs.watch` is called on the new directory — the precise race window — so it is red on `main` and green with the fix. The second test is a control that passes on both.

6. **Mapped the CI coverage** (this produced the biggest guardrail finding):
   - The SDK workflow's `check-packages` job ran the package's unit tests on ubuntu — that step passed; the job failed only on the separate `oxfmt --check` step.
   - `check-packages-windows` runs **only** on schedule or manual dispatch — never on PRs.
   - `jest-windows` in cli.yml runs **only** `@expo/cli` E2E tests, never this package's suite (and it was skipped for this PR anyway).
   - Net: **no PR CI ever runs `@expo/metro-file-map` tests on Windows**, even though `FallbackWatcher` is the Windows watcher and has win32-only branches (missing-filename events, EPERM handling, the 1 s walk-end delay).

7. Attempted to run the new suite on macOS in a temporary worktree at the PR head. Blocked by an environment mismatch in my local checkout (sdk-57 install vs. main's `expo-module-scripts` dependency set). Local issue, not a PR issue; the worktree was removed.

## Guardrails to build (tests + verification)

These ensure the solution is correct where it can be, provably inert where it cannot yet be, and protected against regression.

| # | Guardrail | Protects | When |
|---|---|---|---|
| G1 | Red/green race test (**exists in this PR**) | The core fix | Every CI run |
| G2 | Deterministic walker-contract test: assert `filterDir` runs for the walk root and before `readdir` | Against a `walker` version bump changing undocumented internals — fails fast with a clear message instead of G1's 10 s timeout | Add in this PR or follow-up |
| G3 | Ignored-directory regression test: an ignored dir gets no `fs.watch`, no events, no descent | `filterDir` now has dual responsibility; nothing pins that the ignore check stays ahead of the watch callback. A reorder would silently watch ignored trees (e.g. `.git`) | Add in this PR or follow-up |
| G4 | One Windows run of this package's suite **before merge** (workflow_dispatch of `check-packages-windows`, or a local run); nightly windows job as the standing guard | S1 on Windows — currently asserted, never demonstrated | Before merge |
| G5 | One macOS local `pnpm test` run | Contributor experience — the suite drives a real `fs.watch` and no CI covers darwin for this package | Before merge |
| G6 | Check in the install soak harness (npm/yarn/bun × N packages; spawn install against a running watcher; diff disk vs. events) as a package script or manual/scheduled workflow | The only verification that measures S1 directly. Doubles as the inertness proof for future watcher changes: event sets equal, files lost = 0 | Follow-up, re-run on any watcher change |
| G7 | Encode the issue's repro as a documented procedure or `@expo/cli` E2E: start server → install package → poll bundle for 200 | End-to-end success, including layers above the watcher | Follow-up |
| G8 | File the three follow-up issues: recrawl-on-suspected-loss (queue overflow), the misleading `ExpoAsset` error, `TreeFS` miss invalidation | Honest tracking — without the recrawl layer, big installs still reproduce #48950 silently | At merge |

Priority: G4 is the one gap that should block merge (a watcher change shipping to Windows with zero Windows execution). G2/G3 are cheap and belong near this PR. G6 is the highest-value long-term guardrail: it turns the agent's one-off 48-install evidence into a repeatable check that any future watcher change must pass.

## Findings (blocking and suggestions)

1. **CI is red (blocks merge).** `check-packages` fails: `oxfmt --check` reports format issues in the new test file. The agent ran `pnpm run lint` but not `pnpm run format`. Fix: run `pnpm run format` in the package and commit.
2. **The PR description is stale (blocks informed review).** It still describes the removed two-change design (re-scan timers + `TreeFS`) and a test plan that measured deleted code. The agent's rewrite comment contains accurate replacement text.
3. **Windows verification (blocks merge — G4 above).**
4. **Changelog entry format (suggestion).** Convention is `([#PR](link) by [@author](link))`; the entry links only the issue.
5. **Upstream the fix (suggestion).** The file is vendored from metro/sane; the same race exists upstream. Upstreaming prevents a future re-sync from silently reintroducing it.

## Files

- Review JSON (for posting inline comments): `.review-output/code-review-48954.json`
