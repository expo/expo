# Step 1, round 8 — bind the call sites

Round 7 fixed the right defect and the implementation is correct. A blind cross-lab review approved
it with no blockers. This round closes one gap that review found, plus two smaller items. **Do not
redesign `resolveCheckedInManifestRoot` — its logic is settled.** The work here is almost entirely
in tests.

**Files you may change:** `tools/src/prebuilds/CheckedInManifest.ts`,
`tools/src/prebuilds/CheckedInManifest.test.ts`, and — for item 1's fault injection only, and only
if a test genuinely requires it — `tools/src/prebuilds/SPMGenerator.ts` and
`tools/src/prebuilds/SPMPackage.ts`. Nothing else. Other uncommitted work exists in this tree
(`src/commands/PrebuildEquivalence.*`, `src/prebuilds/equivalence/`, `SPMConfig.types.ts`,
`schemas/spm.config.schema.json`) — do not touch it, do not report on it.

## Context

`resolveCheckedInManifestRoot(pkg)` decides whether a directory is a first-party Expo package
carrying a `Package.swift` that may be trusted to describe how to build it, and returns that
directory's **canonical** path. The defect round 7 fixed: the function validated one path and the
callers consumed a different one. It checked containment on a path built with `path.join` (which
collapses `..` lexically, without touching the filesystem) but resolved with `fs.realpathSync.native`
(which follows symlinks). Through a symlink those disagree, so it could validate
`packages/fixture` while the caller read `vendor/fixture/Package.swift`.

The fix was to canonicalize once and return that one path, which both call sites must then consume.

---

## Item 1 (MUST FIX) — nothing binds the call sites, which is what round 7 was about

`CheckedInManifest.test.ts:927` and `:935` both call `resolveCheckedInManifestRoot` **directly**.
Neither exercises `SPMGenerator.ts` or `SPMPackage.ts`. So reverting either caller to pass raw
`pkg.path` into `resolveCheckedInManifestAsync` — which is precisely the round-7 blocker coming
back — leaves the entire suite green. The fix is in the code and nothing holds it there.

There is a second, smaller gap in the same area. The positive test at `:927` builds its path as
`packages/anchor/../fixture`: a lexical `..` with **no symlink**, so the lexical and canonical
spellings of the final directory agree. It proves `..` collapse, not symlink divergence. The
negative test at `:935` does create a real symlink, but it asserts rejection. **The accepting path
through a real symlink — where canonical and lexical genuinely differ and the package IS
first-party — is untested, and that is exactly the case where a reverted caller reads the wrong
manifest.**

**Required:**

1. A fixture where the package is first-party and legitimately accepted, reached by a path whose
   canonical and lexical spellings differ through a **real symlink**, with a *different*
   `Package.swift` sitting at the lexical location. The two manifests must be distinguishable by
   their parsed content, so a test can assert **which one was consumed**, not merely that something
   was consumed.
2. A test per call site — one for `SPMGenerator.ts`, one for `SPMPackage.ts` — driving that caller
   and asserting the targets it produces came from the canonical manifest.
3. **Prove each test binds its own caller.** Revert `SPMGenerator.ts` alone to consume `pkg.path`:
   the generator test must go red and the package test must stay green. Then revert
   `SPMPackage.ts` alone: the reverse. Report both injections with pass/fail counts. A single test
   that goes red for either revert is not sufficient — it does not tell you which caller regressed.

If driving a call site end-to-end turns out to require machinery disproportionate to the test (a
full package fixture, a Swift toolchain invocation per case), say so and propose the narrowest
seam that still fails on an independent revert of each caller. Do not silently fall back to
testing the resolver again — that is the gap being closed.

## Item 2 (should-fix) — the `node_modules` exclusion comment gives the wrong reason

`CheckedInManifest.ts:99-101` currently reads:

```
// Exact, like the containment check: a canonical path carries each component's real on-disk
// spelling, and npm only ever creates `node_modules`.
```

The reviewer refuted that justification with a counterexample: if `packages/` is itself a symlink to
a directory literally named `NODE_MODULES`, then `packagesRoot` canonicalizes to `/repo/NODE_MODULES`,
a candidate canonicalizes to `/repo/NODE_MODULES/<pkg>`, containment passes, and the exact
comparison does not match.

**My ruling, and the reasoning you should encode rather than re-derive:** that counterexample is not
a miss of this check. It is a case where the **anchor** moved — the repository's own packages
directory was redirected — and no spelling comparison can repair an anchor that has been redefined.
What this exclusion actually defends against is a **nested** dependency tree *inside* the packages
root, such as `packages/expo-camera/node_modules/evil/Package.swift`, which passes containment
because it genuinely is under the packages root. npm always spells that directory `node_modules`, so
the exact comparison is correct for the threat it addresses.

**Required:** replace the comment with one that states the actual purpose (nested dependency trees
under the packages root) and names the boundary (a redirected packages root is outside what this
check can establish). Add a test covering the nested case — `packages/<pkg>/node_modules/<dep>` with
a `Package.swift` in it must be rejected — so the behaviour is held by a test and not only by a
comment. Do **not** add a guard for the redirected-anchor scenario; it requires control of the
repository layout, and defending it is out of scope for this round.

## Item 3 (should-fix) — two error messages stop at *what* and *why*

This repository requires error messages to say what failed, why, and **what to do next**.
`CheckedInManifest.ts:79` (the canonicalize failure debug line) and `:107` (the containment
rejection) both state what and why and then stop. Add a concrete next step to each — for the
resolve failure, checking the path exists and is readable; for the containment rejection, what a
first-party package directory is expected to look like. Keep them one line each; these are debug
lines, not user-facing crashes.

## Constraints

- TypeScript: no `any`.
- **Red before green on every item.** Write the test, run it, see it fail, then implement.
  ⚠ **Round 7 was marked down for provenance**: a scripted edit silently no-opped and three tests
  landed after the implementation, which the reviewer would not accept as test-first. Make each edit
  land where you intend, re-read the file after editing to confirm it changed, and report the red run
  and the green run separately for every item. If an edit misfires, say so — a disclosed gap is
  recoverable, a quiet one is not.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  reports green against stale sources.** Print and check the build exit status every time.
- A run that collects zero tests and exits 0 is not green. State suite and test counts every time.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Export it to this worktree, or you will
  silently act on the main checkout.
- **State the full-suite baseline you observe before you start.** Round 7 reported
  `149 suites / 652 tests / 649 pass / 0 fail / 3 skipped`, but that number is unverified by the
  review and separate work is landing in this tree. Report what you see; do not match that figure.
- Run no git command that changes state — no `checkout`, `stash`, `restore`, `reset`, `clean`.
- Fault injections for item 1 must be reverted before you finish. `git status` must show only your
  intended changes, and the two out-of-scope modified files unchanged by you.

## Report (concise, structured, agent-to-agent)

1. Red evidence per item, with counts.
2. Item 1: the two independent revert injections, each with which test went red and which stayed
   green, and counts.
3. Green evidence: targeted and full runs, with suite and test counts, and the build exit status.
4. `tsc` and `eslint --max-warnings 0` results.
5. Anything you could not do, and why.
