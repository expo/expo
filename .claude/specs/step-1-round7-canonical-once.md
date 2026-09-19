# Step 1, round 7 — canonicalise once, and consume what was validated

Round 6 was reviewed twice, blind. The Claude reviewer accepted with three should-fixes; the
cross-lab reviewer found a blocker it missed. The blocker is real — I confirmed it by reading the
code and the call sites. Round 6's design (canonicalise, compare case-sensitively, no folding) is
CORRECT and stays. This round fixes how it is wired.

Files you may change — **these four and nothing else**:

- `tools/src/prebuilds/CheckedInManifest.ts` and `CheckedInManifest.test.ts`
- `tools/src/prebuilds/SPMGenerator.ts`
- `tools/src/prebuilds/SPMPackage.ts`

The last two are already this task's files (both are modified in the working tree by earlier rounds
of this same step). Do NOT touch `tools/src/commands/PrebuildEquivalence.*` or anything under
`tools/src/prebuilds/equivalence/` — a separate round owns those and may be editing them while you
work. If a fifth file must change, stop and report.

## Item 1 (BLOCKER) — the path that is validated is not the path that is used

Three facts, all verified:

- `CheckedInManifest.ts:84` tests existence with `fs.existsSync(path.join(pkg.path, 'Package.swift'))`.
  `path.join` collapses `..` **lexically**, without consulting the filesystem.
- `CheckedInManifest.ts:93-94` canonicalises with `realpathSync.native`, which resolves **symlinks
  first**, component by component. For a path containing both a symlink and `..`, these two
  resolutions land in different directories.
- `SPMGenerator.ts:144-145` and `SPMPackage.ts:1362-1363` call `hasCheckedInManifest(pkg)` and then
  pass the **raw `pkg.path`** to `resolveCheckedInManifestAsync`.

So the containment check can pass against one directory while the manifest is read from another.
The reviewer's layout: a real `/repo/packages/anchor`, a real `/repo/packages/fixture` with no
manifest, a symlink `/repo/vendor/link -> /repo/packages/anchor`, and a real
`/repo/vendor/fixture/Package.swift` outside `packages/`. With `pkg.path` of
`/repo/vendor/link/../fixture`: the existence check resolves lexically to `/repo/vendor/fixture`
and finds the manifest; canonicalisation resolves the symlink first and lands on
`/repo/packages/fixture`, which passes containment. Result: `true`, and the manifest actually read
is the one outside `packages/`.

Canonicalising before comparing does not establish that the checked directory and the consumed
directory are the same directory. Only using one resolved path for both does.

**Fix: resolve once, and let every later step use that result.**

1. Canonicalise `pkg.path` **first**, before the existence check.
2. Run the existence check, the `node_modules` exclusion and the containment check against the
   canonical path only.
3. Return the canonical path to the caller rather than a bare boolean, and have both call sites
   pass it to `resolveCheckedInManifestAsync` in place of `pkg.path`.

Shape the return however reads best — a `string | null`, or a small result object — but the
property to hold is: **there is exactly one resolved path, and it is the one consumed.**

Reordering also makes the candidate-side canonicalisation failure reachable, which it is not today
(the existence check answers first). That closes a should-fix both reviewers raised independently;
see item 3.

## Item 2 — state the guarantee's scope, do not chase it

The cross-lab reviewer's second blocker is a time-of-check/time-of-use race: the packages root and
the candidate are resolved by two separate `realpath` calls, so retargeting the `packages/` symlink
between them could admit a candidate validated under the old root. It notes this matters only if
the safety property is meant to hold against a **live, racing** filesystem.

My ruling: it is not. This is a build tool reading a repository checkout, and a defence against a
filesystem mutating underneath it is out of proportion to the threat. Item 1 already narrows the
window by removing one of the resolutions.

So: do not add locking, retries or re-validation. Instead state the scope in a short comment where
the resolution happens — the guarantee holds for a filesystem that is stable for the duration of
the call. One or two lines. Do not restate the mechanism the code already shows.

## Item 3 — a test that never reaches what it names

**Both reviewers found this independently.** `CheckedInManifest.test.ts:908-912`,
`review 10 answers false for a package directory that does not exist`, never reaches
canonicalisation: its fixture has no `Package.swift`, so the existence check answers first. It was
proven vacuous — it stayed green under a fault that removed the null handling entirely.

After item 1 reorders the checks, canonicalisation runs first and the branch becomes reachable.
Rewrite the test so it genuinely drives a canonicalisation failure on the candidate side, and prove
it is no longer vacuous: state in your report which fault you injected and that the test went red.

## Item 4 — a skip that hides the behaviour users depend on

`CheckedInManifest.test.ts:812` is guarded by `{ skip: process.platform !== 'darwin' }`, but the
real precondition is a **case-insensitive volume**, not macOS. Two consequences: on a case-sensitive
macOS setup the test fails at its own `assert.ok(fs.existsSync(...))` instead of skipping, and
together with the Linux skip, the one behaviour users actually depend on — a case-flipped path
being accepted — runs on no CI machine at all.

Gate on the observed property instead: create the directory, check whether its case-flipped
spelling exists, and skip only when the volume does not fold. A guard should test the thing it
needs, not a proxy for it.

For reference, the reviewer created a genuinely case-sensitive volume on this machine with
`hdiutil` to test the opposite polarity, so both polarities are reachable locally if you want them.

## Item 5 — two small consistency fixes

- `CheckedInManifest.ts:89` lowercases when excluding `node_modules`, while the canonical
  containment check at `:64` compares the segment exactly. A directory canonically spelled
  `NODE_MODULES` is therefore treated inconsistently by the two. Make them agree, and say which
  way you chose and why.
- `CheckedInManifest.ts:77`'s `catch` assumes the thrown value is a Node `ErrnoException` and reads
  `.code` off it. A thrown `null` or `undefined` would throw again from the handler. No real OS
  path was identified that does this, so it is hardening, not a live bug — make it safe anyway.

## Not in scope, ruled

- **Windows.** The cross-lab reviewer notes `path.relative` folds case internally on Windows, which
  would silently re-fold. This is the iOS precompile pipeline; it runs on macOS. No action. If you
  find the code already claims Windows support somewhere, report it rather than acting.
- **The duplicated debug line.** `hasCheckedInManifest` is called from both `SPMGenerator.ts:144`
  and `SPMPackage.ts:1362`, so a rejection can log twice per run. Item 1 changes both call sites
  anyway; if the duplication disappears naturally, say so. Do not build a cache or a dedupe
  mechanism to chase it — that is the shape of construct round 6 removed.
- **`CheckedInManifest.ts:185` (`isExcluded`/`normalizedRelative`).** Confirmed real by both
  reviewers and by execution. It has its own scheduled step. Do not touch it.

## Constraints

- TypeScript: no `any`.
- Red before green on items 1, 3 and 4. Item 1's red is the reviewer's layout above: build it, show
  `hasCheckedInManifest` returning `true` while the consumed manifest lies outside `packages/`.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  greens against stale JavaScript.** Check the build's exit status every time.
- The full suite is at ZERO failures before you start. It must be at zero when you finish. Another
  task is landing changes in this tree, so state the baseline you actually observe rather than
  matching a number I give you. Every failure in YOUR four files is yours.
- `et` and the build resolve `EXPO_ROOT_DIR`, not the working directory. Act on this worktree.
- Do not commit, stash, or run any git command that alters state.

## Report (concise, structured)

1. Red evidence per item, with counts. For item 1, the fixture layout and the wrong `true`.
2. Green evidence: targeted and full runs, suite and test counts, build exit status.
3. The shape you chose for the return value, and both call sites updated to consume it.
4. Item 3: the fault you injected to prove the rewritten test is no longer vacuous.
5. Item 4: how you detect a case-folding volume, and what happens on each polarity.
6. Item 5: which way you made `node_modules` consistent, and why.
7. `tsc` and `eslint --max-warnings 0` results.
8. Anything you could not do, and why.
