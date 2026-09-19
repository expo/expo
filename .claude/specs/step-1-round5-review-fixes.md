# Step 1, round 5 — review fixes

Both reviewers checked round 4. The Claude reviewer accepted with two should-fix items; the
cross-lab reviewer found one blocker it missed. I adjudicated: the blocker is real, and three
of the should-fix items are worth doing. Four items follow.

Files you may change — **these two and nothing else**:

- `tools/src/prebuilds/CheckedInManifest.ts`
- `tools/src/prebuilds/CheckedInManifest.test.ts`

If a third file must change, stop and report instead of changing it.

Round 4 is otherwise accepted. Do not redesign it. In particular `isFirstPartyPackagePath` and
the four crafted-JSON guard tests were both proved correct by fault injection — leave them alone.

## Item 1 (BLOCKER) — a symlink can defeat the case-sensitivity probe

`isOnCaseSensitiveVolume` (`CheckedInManifest.ts:78-94`) decides whether the volume folds case by
stating a directory and its case-flipped twin and comparing `dev`/`ino`.

`fs.statSync` follows symlinks. So if a case-flipped **symlink** to the packages directory exists
beside it — real `/repo/packages`, plus `/repo/PACKAGES` as a symlink pointing at it — both stats
resolve to the same inode and the probe reports the volume as case-insensitive when it is not.
Containment then folds case, and a package under a genuinely different sibling directory such as
`/repo/Packages/fixture` is wrongly accepted as first-party.

Fix: the probe must compare the directory entries themselves, not what they point at. Use
`fs.lstatSync` for the twin, so a symlink is compared as a symlink and yields a different inode,
which gives the strict answer (case-sensitive). Use `lstatSync` for both sides for symmetry.

Test: build a fixture with a real directory and a case-flipped symlink to it, and assert the probe
reports case-sensitive. If a symlink cannot be created in the test environment, say so in your
report rather than skipping silently.

## Item 2 — do not cache a probe failure that is not definitive

Same function. The `catch` swallows every error, answers case-sensitive, and caches that answer
forever for this root. Two different situations are being conflated:

- The twin does not exist (`ENOENT`). That is a **definitive** answer: the volume is
  case-sensitive. Cache it.
- Any other failure (a permission error, for example) is **not** an answer. Return the strict
  default for this call, but do not cache it, so a transient failure cannot poison every later
  lookup under that root.

Test both branches.

## Item 3 — the Swift-rejection integration test is weaker than its name

Both reviewers flagged this independently. `CheckedInManifest.test.ts:914-919` asserts only that
Swift failed to read the manifest. A plain syntax error in the fixture satisfies the same
assertion, so the test does not show that the **absolute `sources` path** is what Swift rejected.
The pipeline's error genuinely does not carry Swift's stderr, so the assertion cannot simply be
tightened.

Fix by adding a control: the same fixture with the absolute entry removed must resolve
successfully. The pair — rejected with it, accepted without it — is what pins the failure to the
absolute path. Keep the existing comment recording that the guard is defence in depth.

## Item 4 — restore the two dead `review 5` tests

`CheckedInManifest.test.ts:977-987`. These two tests can never pass: the build emits module exports
as getter-only, non-configurable properties, so `t.mock.method` throws before anything is asserted.
They have never run.

**Do not delete them.** Read what they are for: `rejectsManifest` (`:72-83`) is the helper that
almost every error-path test in this file relies on, and it asserts three things about a
diagnostic — that it names the right target, that it matches the expected detail, and that it ends
with a remediation sentence. These two tests are a guard on that guard: they feed it a diagnostic
with a missing remediation, and one naming the wrong target, and require it to reject both. If
`rejectsManifest` ever went slack, every test that uses it would quietly stop checking anything.
That invariant is worth keeping — it is the same "a check that silently does not run" failure class
this whole task keeps hitting.

Fix the mechanism, keep the invariant. Extract the assertion body of `rejectsManifest` into a
plain function that takes an error, a target and a detail pattern, and have `rejectsManifest` call
it. The two tests then call that function directly with a crafted error and assert it throws
`assert.AssertionError`. No module mocking, no `t.mock.method`, no reliance on how the build emits
exports.

After this item the suite must be fully green. That is the acceptance signal for the whole of
step 1.

## Constraints

- TypeScript: no `any`.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Every command must act on this
  worktree, not the main checkout.
- A run that collects zero tests and exits 0 is not green. Confirm a non-zero test count every time.
- Red before green on all four items.
- Build and test from `tools/`: `pnpm build`, then
  `node --test build/prebuilds/CheckedInManifest.test.js`, and the full
  `node --test 'build/**/*.test.js'` at the end.

## Report (concise, structured)

1. Red evidence per item, with counts.
2. Green evidence: targeted and full run, with suite and test counts. State plainly whether the
   full suite is now at zero failures.
3. For item 1: how you built the symlink fixture and what the probe returned before and after.
4. For item 4: the shape you extracted, and confirmation that both tests now execute and pass.
5. `tsc` and `eslint --max-warnings 0` results.
6. Anything you could not do, and why.
