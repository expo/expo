# Step 1, round 6 — delete the case-sensitivity probe

Round 5 was reviewed twice, blind. The Claude reviewer approved with one should-fix; the
cross-lab reviewer found two blockers. All three findings point at the same thing: the runtime
volume probe. This round removes it rather than patching it.

Round 5's other three items (2, 3, 4) are ACCEPTED. Do not touch them.

Files you may change — **these two and nothing else**:

- `tools/src/prebuilds/CheckedInManifest.ts`
- `tools/src/prebuilds/CheckedInManifest.test.ts`

If a third file must change, stop and report instead of changing it.

## Background: why the probe goes

`isOnCaseSensitiveVolume` decides whether the volume folds case by stating a directory and its
case-flipped twin and comparing `dev`/`ino`. `isFirstPartyPackagePath` then lowercases both paths
when the probe says "insensitive".

Inode equality is a **proxy** for case folding, and other things cause it:

- **Blocker A.** A bind mount (or an APFS firmlink) of the flipped name onto the real directory
  makes both entries report one inode on a genuinely case-sensitive volume. `lstat` defeats a
  symlink but not a bind mount. The probe then says "insensitive", containment folds case, and an
  unrelated sibling such as `/repo/Packages/fixture` is accepted as first-party. A hard-linked
  *file* under the same name does it too, because the probe never checks it stated a directory.
- **Blocker B.** The probe answers for **one directory level** but the answer is applied to the
  **whole path**. If `/repo` folds case for its children while `/REPO` is a distinct directory
  under a case-sensitive parent, the probe correctly says "insensitive" and the code then
  lowercases the entire path, collapsing `/repo` and `/REPO` and accepting `/REPO/packages/fixture`.
- The `catch` also cannot tell which of the two `lstat` calls threw, so an `ENOENT` from the
  **original** is cached as the definitive "twin is missing, therefore case-sensitive" answer.
  Both reviewers found this independently.

Each is separately fixable, but the design is the problem: the code asks a question about the
volume in order to guess what the filesystem would do, when it can simply ask the filesystem.

## The change

Replace the probe and the case folding with canonicalisation through `fs.realpathSync.native`,
then compare **case-sensitively**, always.

`fs.realpathSync.native` calls the OS `realpath`, which returns the real on-disk spelling of every
component. I verified this on this machine, on both the temp volume and the repository volume:

```
input   <wt>/Packages/Expo-Haptics
plain   <wt>/Packages/Expo-Haptics      <- fs.realpathSync does NOT canonicalise casing
native  <wt>/packages/expo-haptics      <- fs.realpathSync.native DOES
```

So: canonicalise the packages root and the candidate with `fs.realpathSync.native`, then run the
existing containment logic (`path.relative`, non-empty, not absolute, no `..`, no `node_modules`,
one segment or two when the first is an `@scope`) with **no folding at all**.

This is why it answers all three findings at once. Blocker A: a bind-mounted `/repo/PACKAGES`
canonicalises to `/repo/PACKAGES`, which is not inside `/repo/packages`, so it is correctly
rejected — there is no inode proxy left to fool. Blocker B: nothing is folded, so no answer from
one level is applied to another. The `catch` finding: there is no probe, no cache and no `catch`.

Delete `isOnCaseSensitiveVolume`, the `caseSensitivityByDirectory` cache, and the `caseSensitive`
parameter of `isFirstPartyPackagePath`. Keep `isFirstPartyPackagePath` exported and keep it pure —
it takes two already-canonical paths. Canonicalisation happens in the caller.

## Requirements

1. **Both sides must be canonicalised, or neither comparison is meaningful.** Canonicalise the
   packages root once and the candidate per call.

2. **`realpathSync.native` throws `ENOENT` for a path that does not exist.** Decide and implement
   what that means, and say in your report what you chose. A path that does not exist is not a
   first-party package, so the answer is `false` — but it must not throw out of the caller, and it
   must not be silently indistinguishable from a real rejection to someone debugging.

3. **The failure direction is now the safe one, and must stay that way.** If canonicalisation ever
   fails to canonicalise, the result is a wrong *reject* — the package falls back to Mode A, which
   builds correctly, just not the new way. A wrong *accept* was the old danger. Do not add anything
   that reintroduces a fold.

4. **A wrong reject is currently silent.** `getPackagesDir()` reads `EXPO_ROOT_DIR`, so in a
   worktree whose `EXPO_ROOT_DIR` points at the main checkout, every package fails containment and
   silently falls back to Mode A with no diagnostic at all. Add a debug-level line naming the
   canonical packages root and the canonical candidate when containment rejects. Debug level, not a
   warning: rejection is the normal answer for most paths.

5. **Symlinks now resolve.** `realpathSync.native` follows them, so a package directory that is a
   symlink pointing outside `packages/` is rejected. That is correct and intended. Add a test that
   pins it, so a later change cannot quietly loosen it.

## Tests

Keep every round-5 test that still applies. The three tests specific to the probe
(`review 9 ...`) describe machinery that no longer exists — replace them with tests of the new
behaviour, and say in your report which you removed and what replaced each.

Required coverage:

- A case-flipped candidate (`PACKAGES/expo-haptics` for a real `packages/expo-haptics`) is accepted
  on a case-insensitive volume, because canonicalisation maps it onto the real directory. This is
  the behaviour users depend on and it must not regress.
- A genuinely different sibling directory (a real `Packages/` beside a real `packages/`) is
  rejected. On a case-insensitive volume such a pair cannot be created — if you cannot build the
  fixture, say so plainly in your report rather than skipping the test silently. You may drive
  `isFirstPartyPackagePath` directly with crafted canonical paths to cover it, since it is pure and
  exported; state that this is what you did.
- A symlinked package directory pointing outside `packages/` is rejected (requirement 5).
- A non-existent path is rejected without throwing (requirement 2).
- `@scope` packages still resolve, both single and two-segment forms.

**Note on the round-5 fixture.** The U+0131 (dotless i) basename exists only to build a
case-flipped pair on a case-insensitive volume for the probe. If the new tests do not need such a
pair, remove it and its explanatory comment. If one still helps, keep it. Your call — state which
and why.

## Investigate, do NOT fix

The cross-lab reviewer flagged `CheckedInManifest.ts:192`: a normalisation mismatch between the
exclusion paths used for source inference and those emitted, for inputs like `exclude: ["."]` or
`exclude: ["Folder/../Tests"]`. It is pre-existing and unrelated to this round. Determine whether
it is real, and report what you found with a concrete input. **Do not change it** — it is outside
this round's fence and I will schedule it separately.

## Not in scope, settled

One cross-lab should-fix claimed the item-3 Swift-rejection control pair can pass for the wrong
reason via a wrapper that fails only on its first invocation. The Claude reviewer tested the pair
directly by putting the absolute entry back into the control and watching it go red. Executed
evidence beats the static hypothesis; the pair stands. Leave it alone.

## Constraints

- TypeScript: no `any`.
- Red before green on every behavioural change.
- `et` and the `tools/` build resolve `EXPO_ROOT_DIR`, not the working directory. Act on this
  worktree.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  greens against stale JavaScript.** Check the build's exit status every time. A non-zero test
  count does not protect you from this.
- The full suite is at ZERO failures before you start (146 suites / 630 tests / 627 pass / 3
  pre-existing Hermes skips). It must be at zero when you finish. Every failure you see is yours.
  Those counts include work from a separate task that landed in this tree just before you started;
  if you see a different baseline, say so in your report rather than adjusting to it.
- Do not touch `tools/src/commands/PrebuildEquivalence.*` or anything under
  `tools/src/prebuilds/equivalence/` — that is the separate task, outside your fence.
- Do not commit, stash, or run any git command that changes state. Other files in this tree hold
  uncommitted work from separate tasks.

## Report (concise, structured)

1. Red evidence, with counts.
2. Green evidence: targeted and full runs, with suite and test counts, and confirmation that the
   build that produced them exited 0. State plainly whether the suite is at zero failures.
3. Which `review 9` probe tests you removed, and what replaced each.
4. What you chose for the `ENOENT` case, and how a wrong reject is now visible to someone debugging.
5. Whether you kept or dropped the U+0131 fixture, and why.
6. What you found at `CheckedInManifest.ts:192`, with a concrete input. Confirm you did not change it.
7. `tsc` and `eslint --max-warnings 0` results.
8. Anything you could not do, and why.
