# Step 2, round 6d — the gate must actually fail

Round 6c closed twelve items and two blind reviewers confirmed the substance holds: all six
must-fix items met, all ten files inside the fence, every leg bound by injection. **Do not
redesign anything from 6c.** This round closes what the reviews found, and three of the items
are round 6c having introduced the very defect it existed to remove.

**Files you may change:** `tools/scripts/check-spm-manifest-collateral.cjs`,
`tools/src/prebuilds/SpmManifestCollateral.test.ts`,
`tools/src/prebuilds/equivalence/ArtifactPath.ts` and its test,
`tools/src/commands/PrebuildEquivalence.ts` and its test,
`tools/src/prebuilds/equivalence/XCFrameworkComparison.test.ts`.
Anything else: stop and report.

## The standing rule, restated because 6c broke it

**A check that reads green without running, or a conclusion presented in place of the evidence.**
Items 1-3 below are each an instance introduced by round 6c itself, while satisfying a
should-fix. When a change makes a test easier to satisfy, that is the moment to check whether it
still binds anything.

---

## Item 1 (MUST) — the gate's test-mode branch makes it exit 0 on detected drift

`check-spm-manifest-collateral.cjs:371-384`: when `SPM_COLLATERAL_TEST_MODES` is set, the gate
loops the modes, swallows each failure into `console.log(\`${mode}: EXIT 1: …\`)` and returns —
**never running the real comparison, always exiting 0.** The tests followed it down.

Parent `cea69733b28` asserted the real evidence:
```ts
assert.notEqual(result.status, 0, 'a manifest that no longer matches the baseline must fail');
assert.match(..., /DIFF: /);
```
Current `SpmManifestCollateral.test.ts:139-159` asserts:
```ts
assert.equal(sharedGateResult.status, 0, ...);
assert.match(sharedGateResult.stdout, /collateral-drift: EXIT 1: Collateral manifest changes/);
```
The test now asserts on **a string the code under test prints about itself**, and asserts the
gate exited **0** on a run in which it detected drift. The `/DIFF: /` assertion and the
`<EXPO_ROOT_DIR>` half of the marker assertion were dropped.

Both reviewers found this independently (Claude B3, astra A1). Astra adds: removing normal-mode
comparison entirely would leave these tests green.

**Required:** the composition **"drift is detected → the gate process exits non-zero"** must be
bound by a test that observes the real exit status of a real gate run. Keep item 11's one-process
sharing if you can do so without a test-only branch deciding the outcome; if you cannot, give up
the sharing — correctness outranks the 22 seconds. A production script must not contain a branch
that converts its own failures into a zero exit. Restore the `/DIFF: /` and `<EXPO_ROOT_DIR>`
assertions.

**Verify by injection:** delete the normal-mode comparison and confirm the drift test goes red.

## Item 2 (MUST) — a test that asserts on its own constant

`SpmManifestCollateral.test.ts:161-169`, `it('runs the exact three fault modes in one gate
process')`, asserts only on the test file's own `GATE_MODES` constant: length 3, set size 3,
sorted contents. No production value is read. **It can never go red for any change to the gate.**
It is also redundant — the shared `before()` spawn already guarantees one gate process.

Found independently by both reviewers (Claude B2, astra A3).

**Required:** delete it. Do not replace it with a stronger version; item 1's work covers the
ground that matters.

## Item 3 (MUST) — item 3's own defect, recurring in the code written to fix item 3

`ArtifactPath.test.ts:136` asserts `error.message.includes(marker)`. It passes off the **input
path**, which already contains the marker twice. This is exactly the shape round 6c's item 3 was
raised for, reappearing in round 6c's own new tests. (astra A2.)

**Required:** assert the diagnostic clause itself, not a substring the input already supplies.
Then sweep the tests this round and round 6c added for the same shape and fix every instance —
audit the class, not the reported line. Two more are already known:
- `XCFrameworkComparison.test.ts:236` — `assert.match(report, /Loose.swiftinterface|nested/)`;
  both alternatives are present in every case. Assert the exact relative path.
- `PrebuildEquivalence.test.ts:80` — `/^Failed.*artifact.*equivalent.*dependenc/i` also matches
  "Failed — artifacts not equivalent; SPM dependency check passed", so it does not pin which
  half failed.

## Item 4 (MUST) — lint ships red and was reported green

`pnpm lint --max-warnings 0` exits 1:
```
tools/src/commands/PrebuildEquivalence.test.ts
  8:1  warning  `./PrebuildEquivalence` import should occur before type import of
                `../prebuilds/equivalence/SpmPackagesCheck`  import/order
```
`.github/workflows/expotools.yml:49` runs exactly this, so the job is red. The fault is
**inherited from parent `cea69733b28`**, not introduced by 6c — but 6c reported lint green when
it was not.

**Required:** fix the import order. Then run `pnpm lint --max-warnings 0` yourself and paste the
exit status. Do not report a tool's result you did not observe.

---

## Should-fix

5. **`ArtifactPath.ts:53-55` refuses unambiguous paths.** The repetition count runs over the
   **whole absolute path**, including the prefix the layout never matched:
   `/Users/x/.build/expo/packages/precompile/.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework`
   throws "layout marker .build occurs more than once", though only the second `.build` can
   match. Count from `match.index` onward. Keep both refusals from 6c item 6 working.
6. **`PrebuildEquivalence.ts:183-184` — `--skip-spm-packages-check` no longer survives a
   malformed config.** `readProductConfig` (`:168-175`) throws on unparseable JSON, so the flag
   can no longer get a user past a config problem. Item 10 required *reading* the config there,
   not *failing* on it. Degrade to "no sibling info" instead of throwing.
7. **`check-spm-manifest-collateral.cjs:397` lost stack traces for every gate error.**
   `console.error(error)` → `console.error(error.message)`. Item 4 asked only that the
   *unreachable baseline* case be legible. Keep that case legible; restore diagnostic detail for
   unexpected internal errors. Note the test at `:237`,
   `assert.doesNotMatch(output, /\n\s+at /)`, is satisfied by this top-level change rather than
   by `ensureBaselineReachable` — it would pass even if that function were deleted. Bind it to
   the function it claims to test.

## Settled — do not revisit

- **Item 11 stands as met.** Gate suite 34.9 s → 12.9 s confirmed by both reviewers. The full
  suite got slower (35.1 s → 38.8-39.1 s), but that is the cost of 27 added tests, not of the
  gate. Do not trade coverage for wall clock. If item 1 forces you to give up process sharing,
  say so and report the new timing — that is an accepted regression, not a failure.
- **The `Versions/*/Modules` fallback in `findSwiftInterfaces` is required, not scope creep.**
  Without it the mirroring exclusion regresses the macOS no-symlink layout. Proven by injection.
- **Items 8 and 12 are closed.** Comment and identifier changes with no testable surface.

## Out of scope — reported, not yours to fix

`expotools.yml:10-13` filters `pull_request` to `tools/**`, so a PR that adds or removes an
`spm.config.json` product never triggers this job at all. Item 5's premise does not hold today
and the gate has no protective value for packages-only PRs. **Do not change the workflow
filter.** The orchestrator owns this decision.

## Constraints

- TypeScript: no `any`.
- **Red before green on every item**, reported separately, with injections reverted and the
  revert verified by sha256 — never by git.
- **A failed `pnpm build` leaves the previous `build/` output in place** and `node --test` then
  greens against stale sources. Print and check the build exit status every time.
- A run that collects zero tests and exits 0 is not green. State suite and test counts.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Export it to this worktree.
- Run no git command that changes state — no `checkout`, `stash`, `restore`, `reset`, `clean`,
  `commit`, `push`.
- Baseline to expect: 161 suites / 718 tests / 715 pass / 0 fail / 3 skipped, exit 0. State what
  you observe.

## Report (concise, structured, agent-to-agent)

1. Red evidence per item, with counts.
2. Item 1: the injection proving a real non-zero exit is now bound, and whether process sharing
   survived. New timing if it did not.
3. Item 3: every instance you found in the sweep, not only the three named.
4. Item 4: the actual pasted exit status of `pnpm lint --max-warnings 0`.
5. Green evidence: targeted and full runs, counts, build exit status.
6. `tsc` and `eslint --max-warnings 0` results, observed by you.
7. Anything you could not do, and why.
