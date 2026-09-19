# Step 2, round 6a — stop text-scanning the manifest, and close the override holes

The cross-lab reviewer checked round 5 statically and returned four blockers. I verified three of
them myself by reading the code and by running `swift package dump-package` on the real generated
`expo-image` manifest. All four are real. This round fixes them.

Round 5's items 1-4 were the right changes; the defects are in HOW two of them were implemented,
not in what they set out to do. Do not undo round 5.

Files you may change — **these four and nothing else**:

- `tools/src/commands/PrebuildEquivalence.ts` and `PrebuildEquivalence.test.ts`
- `tools/src/prebuilds/equivalence/SpmPackagesCheck.ts` and `SpmPackagesCheck.test.ts`

Do NOT touch `tools/src/prebuilds/equivalence/XCFrameworkComparison.*` — it has its own findings
and its own round. Do NOT touch anything under `tools/src/prebuilds/CheckedInManifest*` — separate
task. If a file outside your four must change, stop and report.

## Context: what this harness is for

It proves that an iOS `.xcframework` built the old way ("Mode A") and the new way ("Mode B") are
the same artifact. Its most important job is catching a Mode B build that silently **dropped a
SwiftPM package dependency**, which a symbol comparison provably cannot see. So it reads dependency
declarations out of the `Package.swift` that produced the build. Every defect below ends in the
same place: the harness reporting agreement it did not actually establish.

## Item 1 (BLOCKER) — the agreement check is in the wrong place and is skippable

`PrebuildEquivalence.ts:57` compares the artifacts and line 61 prints the verdict. Only afterwards,
at line 64, inside `if (!options.skipSpmPackagesCheck)`, does `resolveSpmPackagesCheck` run
`assertSameBuild`.

Two consequences. With `--skip-spm-packages-check`, two artifacts from different packages or
different flavours are never agreement-checked at all and the command exits 0. Without the flag,
the verdict is printed before the mismatch is discovered — the eventual throw does exit non-zero,
so this half is ordering, not a false green.

Whether two artifacts are two builds of the same thing is a precondition of the **whole**
comparison, not of the dependency sub-check. Hoist it: run the agreement check unconditionally,
before `compareXCFrameworks`, and let no flag skip it.

Also close the silent-skip beside it: `assertSameBuild` runs only `if (artifactA && artifactB)`, so
if either path fails to parse, nothing is checked. An unparseable path must not buy a free pass —
decide what it should do, implement it, and justify it in your report.

## Item 2 (BLOCKER) — `--flavor` can defeat the flavour validation entirely

`PrebuildEquivalence.ts:111`:

```ts
const flavor = options.flavor !== undefined ? parseFlavor(options.flavor) : artifact?.flavor;
```

The user-supplied flavour wins over the flavour parsed from the artifacts, and nothing ever
cross-checks the two. Line 142 then validates the manifest against that override.

Concrete defeat, which I verified by reading: both artifacts are Debug; invoke with
`--flavor Release --manifest <a Release manifest>`; the agreement check, the flavour check and the
dependency check all pass. That is exactly the Debug-artifact-vouched-for-by-a-Release-manifest
defect round 5 existed to stop, reached through a different door.

Fix: an override may **supply** a value the artifacts do not carry; it may never **contradict** one
they do. When the artifacts parse to a flavour and `--flavor` disagrees, fail loudly naming both.
Apply the same rule to `--package`, which has the same shape at line 110 — and note the reviewer's
related point that `--package`/`--product` can select an unrelated config with no `spmPackages`,
which sidesteps the `--manifest` requirement without ever being checked against the artifact.

## Items 3 and 4 (BLOCKERS) — read the manifest, do not scan its text

Two separate findings with one cause.

**Item 3.** `SpmPackagesCheck.ts:135` splits a `.binaryTarget(path:)` string on `/` and takes the
first `debug` or `release` segment, without normalising `..`. So
`.../libavif/debug/../release/libavif.xcframework` is read as Debug while it resolves to Release.

**Item 4.** `SpmPackagesCheck.ts:184` searches the whole manifest text for `.package(url: "<url>"`,
after a comment stripper (lines 318-319) that only removes whole-line `//` comments and
non-nested block comments. A trailing `// .package(url: ...)`, a declaration inside a *nested*
block comment, and one embedded in a raw string literal all still match and report `pass`.

**Both are the same mistake: treating a Swift manifest as text.** There is a standing rule on this
work not to parse build inputs out of source files by pattern, because every round of it produces
something that is quietly wrong. This repository already has the right tool, and this task already
uses it in `tools/src/prebuilds/CheckedInManifest.ts`: `swift package dump-package`.

I verified it works here, on the real generated manifest, before writing this. Copy
`packages/precompile/.build/expo-image/generated/ExpoImage/Package.swift` into an empty temp
directory and run `swift package dump-package` there: it returns JSON in seconds, needs no network
and no sibling files, and gives you both of the things being scanned for —

- `dependencies[]` — the `.package(url:)` declarations (empty for that particular manifest, which
  declares its dependencies as binary targets),
- `targets[]` where `type == "binary"`, each with its `path`, e.g.
  `../../../../.cache/react/0.88.0-nightly-.../release/React.xcframework`.

Replace the text scanning in both checks with a single structural read:

1. Dump the manifest **once** and pass the parsed result to both the flavour check and the
   dependency check. This also closes the reviewer's separate finding that the two currently
   re-read the file independently, so a concurrent generator run could have them read different
   builds.
2. For the flavour check, **resolve each binary target path** (against the manifest's own
   directory) before inspecting it, so `..` cannot lie about which flavour it names.
3. A binary target that carries **no** flavour segment currently passes silently, and an existing
   test encodes that as intended. Reconsider it: a check that cannot tell must say so, not pass. If
   you keep the permissive behaviour, it must be loud enough that nobody reads it as a pass — and
   say in your report why you chose what you chose.

If `dump-package` turns out not to work for some manifest shape the harness must handle, stop and
report rather than falling back to text scanning.

## Also required — a test for the command itself

The reviewer notes that no test exercises command dispatch, the skip flag, or the order in which
the verdict is printed. That absence is exactly why item 1 shipped. Add tests that pin: the
agreement check runs with `--skip-spm-packages-check` set, and it runs before the comparison
verdict is printed.

One more, small: `SpmPackagesCheck.test.ts:445` calls `.every(...)` on a filtered list without
asserting the list is non-empty, so an empty list passes it. Assert the length.

## Constraints

- TypeScript: no `any`.
- Red before green on every item — including item 2, where the red is the defeat I described above.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  greens against stale JavaScript.** Check the build's exit status every time.
- The full suite is at ZERO failures before you start; it must be at zero when you finish. Another
  task may have changed the counts — state the baseline you actually observe rather than adjusting
  to a number I give you.
- `et` and the build resolve `EXPO_ROOT_DIR`, not the working directory. Act on this worktree.
- Do not commit, stash, or run any git command that alters state.
- Prove item 2 and item 3 against the real `expo-image` artifacts and the real generated manifest,
  not only fixtures. Those runs are read-only against the main checkout's `.build`; do not write
  there.

## Report (concise, structured)

1. Red evidence per item, with counts.
2. Green evidence: targeted and full runs, suite and test counts, and confirmation the build exited 0.
3. Item 1: what you chose for an unparseable artifact path, and why.
4. Item 2: the real-artifact run showing the `--flavor Release` defeat before, and refused after.
5. Items 3/4: confirmation the text scanning and the comment stripper are GONE, not merely improved.
   What you decided about a binary target with no flavour segment, and why.
6. `tsc` and `eslint --max-warnings 0` results.
7. Anything you could not do, and why.
