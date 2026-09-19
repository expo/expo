# Step 2, round 5 — review fixes

Round 4 was reviewed with fault injection. All five of its behaviours are genuinely test-bound;
every injected fault went red. Round 4 is otherwise sound — do not redesign it. Four items follow:
one blocker and three should-fix.

Files you may change: `tools/src/commands/PrebuildEquivalence.ts` and the files under
`tools/src/prebuilds/equivalence/`, plus their tests. Nothing else. If a file outside that set must
change, stop and report.

## Item 1 (BLOCKER) — the default manifest path cannot be tied to the build under test

`PrebuildEquivalence.ts:124-133` builds the manifest path from the package name and product name
only. The generator writes one `generated/<Product>/Package.swift` per product, and **every
flavour and every mode overwrites it**. So the check reads whatever manifest happens to be on disk.

The reviewer proved this on real data, not a fixture: a Debug run of `expo-image` passed the
manifest check by reading the **Release** manifest, while the sibling prepared-xcframework check
correctly used the Debug path.

Why this is a blocker rather than a wart: in steps 3-9 this same hole lets the **Mode A** manifest
vouch for a **Mode B** build that dropped a SwiftPM package dependency. That single failure is the
entire reason this check exists — the artifact symbol comparison provably cannot catch it.

**D21 — the decision on how to fix it.** Do not guess at a manifest path the harness cannot tie to
the artifact. Two changes:

1. When the SPM dependency check is going to run — that is, when the package declares
   `spmPackages` — `--manifest` becomes **required**. Absent it, fail loudly with a diagnostic
   saying what is wrong (the manifest on disk is overwritten by every flavour and mode, so it
   cannot be trusted to describe this artifact), and what to do (pass `--manifest` pointing at the
   manifest that produced this build). Do not fall back to a guessed path. Do not emit a `skipped`
   diagnostic — a skipped check reading as green is the failure this task keeps repeating.
2. When a manifest **is** supplied, verify it actually describes this build: the flavour segment of
   each `.binaryTarget(path:)` must match the artifact's flavour. On mismatch, fail with both
   values named.

Packages that declare no `spmPackages` keep today's behaviour — the check already returns "nothing
more to check" for them, so nothing is gained by demanding a flag.

Recorded for later, not to be built now: the better long-term fix is for the prebuild pipeline to
copy the manifest it actually used into the output directory beside the xcframework, so the harness
can find it with no flag. That is a pipeline change and belongs with step 3's pilot. If steps 3-9
find the required flag burdensome, that is the upgrade path.

## Item 2 (should-fix) — a slice holding no framework is silently dropped

`XCFrameworkComparison.ts:484-492` (`readSlices`) drops any slice with no `.framework` in it, on
both sides, so its contents are never compared. The reviewer demonstrated two artifacts differing
only in such a slice reporting `Equivalent — 0 differences`.

Not reachable on today's corpus — every `.xcframework` under `packages/precompile/.build` was
scanned and none has a frameworkless slice — and the drop-on-one-side case **is** caught. It is
still the defect class this task keeps hitting, and steps 3-9 add artifacts nobody has seen.

Fix: take the slice set to be every directory, and require only that *some* slice carry a
framework.

## Item 3 (should-fix) — A and B are never checked for agreement

`PrebuildEquivalence.ts:102` resolves configuration with
`parseArtifactPath(pathA) ?? parseArtifactPath(pathB)`. Two artifacts from different packages, or
different flavours, are checked against A's configuration with no warning at all. Compare the two
parses and fail when they disagree, naming both.

## Item 4 (should-fix) — the dependency match is an exact string literal

`SpmPackagesCheck.ts:151` matches `.package(url: "<url>"` as a literal, which depends on the
emitter's current spacing. A formatting change flips a pass to a fail. This direction is a false
red, not a false green, so it is the least urgent item here — but make the match tolerant of
whitespace. If that needs more than a pattern change, report instead of reaching further.

## Also fix while you are here

`tools/scripts/check-spm-manifest-collateral.test.cjs` is never collected by the canonical
`node --test 'build/**/*.test.js'` — wrong directory and wrong extension, so this gate has never
run in the normal suite. Either wire it in or give it an explicit invocation, and say which you
did and why. If wiring it in requires touching a file outside your fence, report instead.

## Constraints

- TypeScript: no `any`.
- Red before green on every item.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  reports green against stale sources.** Check the build succeeded before trusting any run.
- A run that collects zero tests and exits 0 is not green. State the test count every time.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Act on this worktree.
- **The full suite is now at ZERO failures** (142 suites / 614 tests / 611 pass / 3 pre-existing
  Hermes skips). An earlier draft of this spec told you to expect 2 failures in
  `tools/src/prebuilds/CheckedInManifest.test.ts`; that work landed and those tests pass. Every
  failure you see is yours. Do not edit anything under `tools/src/prebuilds/CheckedInManifest*` —
  it is outside your fence and belongs to separate work.
- Prove item 1 against a real artifact, not only a fixture: the reviewer reproduced it with
  `expo-image`, so the fix must be shown on the same ground.

## Report (concise, structured)

1. Red evidence per item, with counts.
2. Green evidence: targeted and full runs, with suite and test counts.
3. For item 1: the real-artifact reproduction before and after, and what the failure message says.
4. What you did about the uncollected collateral gate, and why.
5. `tsc` and `eslint --max-warnings 0` results.
6. Anything you could not do, and why.
