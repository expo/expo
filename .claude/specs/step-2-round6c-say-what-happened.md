# Step 2, round 6c — say what happened, and make the gate survive CI

Round 6b landed ten items and two independent blind reviews confirmed most of them hold under fault
injection: 15 of 16 injected faults went red. This round closes what they found. **Do not redesign
round 6b's structure** — the two-layout parser, the `decideEquivalence` split and the ported
collateral gate all stay. Six must-fix items and six should-fix.

**Files you may change:** `tools/src/commands/PrebuildEquivalence.ts`, everything under
`tools/src/prebuilds/equivalence/`, `tools/src/prebuilds/SpmManifestCollateral.test.ts`,
`tools/scripts/check-spm-manifest-collateral.cjs`, and their tests. Item 4 additionally licenses
`.github/workflows/expotools.yml`. Item 2 additionally licenses `tools/src/prebuilds/SwiftInterfaceChecks.ts`.
Anything else: stop and report.

## The standing rule

The defect class this project keeps hitting: **a check that reads green without running, or a
conclusion presented before the evidence that contradicts it.** Two of this round's must-fixes are
that shape appearing inside the *tests* rather than the code. Treat it as the priority.

---

## Item 1 (MUST) — the command says "Equivalent" on a run that failed

`PrebuildEquivalence.ts:125` formats the verdict before `assertSpmPackagesResolved` runs at `:132`,
and `:141` puts that verdict at `lines[0]`. Throwing refusals are correctly hoisted — that part of
round 6b holds — but the **non-throwing** failure path was untouched. A reviewer captured the actual
screen for a run that exits 1:

```
Equivalent — same exported symbols, same public interface, same structure.
  A: …/expo-image/output/debug/xcframeworks/ExpoImage.xcframework
  B: …/two/…/ExpoImage.xcframework

SPM package dependencies of ExpoImage (Debug), read from both artifacts:
  ✗ SDWebImage runtime-link: No ExpoImage binary to inspect in …
  …
=== exit code: 1
```

First line green, last line green, and **nothing anywhere states the run failed.**

The doc comment at `:107-113` claims the property holds "by what this function can reach". That
overstates it: making `log` unreachable orders *printing* against *deciding*, but it does not order
`verdict` against `diagnostics` inside the returned `lines`.

**Required:** compute the diagnostics first, and make the leading line state the run's overall
outcome — artifact comparison and dependency check together. A reader must be able to tell pass from
fail from the first line alone. Correct the doc comment to claim only what is true. Add a test for
the exit-1 path; `PrebuildEquivalence.test.ts:210` currently covers only exit 0.

## Item 2 (MUST) — item 6's gap survived, relocated

`XCFrameworkComparison.ts:61` `SWIFT_INTERFACE_IN_FRAMEWORK` excludes **every** `.swiftinterface`
anywhere inside a `.framework` from the tree comparison. But `indexSwiftInterfaces` →
`findSwiftInterfaces` (`SwiftInterfaceChecks.ts:64-80`) indexes only
`<framework>/Modules/*.swiftmodule/*.swiftinterface`. Anything inside the framework but outside a
`.swiftmodule` directory is therefore read by no comparison at all.

Reproduced by a reviewer: side A carries `Demo.framework/Modules/Loose.swiftinterface`, side B does
not, everything else identical → `differences: 0, equivalent: true`.

**Required:** make the exclusion mirror exactly what `findSwiftInterfaces` indexes, so that the set
excluded from the tree compare and the set read by the interface compare are the same set by
construction rather than by coincidence. If that means exporting or sharing a predicate from
`SwiftInterfaceChecks.ts`, that is licensed. The macOS `Versions/A/Modules/…` layout was checked and
works both with and without the standard symlinks — do not regress it.

## Item 3 (MUST) — a test that passes for the wrong reason

`PrebuildEquivalence.ts:287` compares `a.packageName` against `b.packageName`. Neutering that row
alone leaves the suite fully green. The test meant to bind it
(`PrebuildEquivalence.test.ts:653-667`) asserts `{ message: /expo-image[\s\S]*expo-video/ }` — but
the thrown message **begins with the two full artifact paths**, which already contain both names.
The assertion is satisfied by the paths, so the test still passes off the *artifact* row.

This is the same shape round 6b's item 8 was raised for, one row over, and it is worth more than the
line it fixes: a test that looks like coverage and is not.

**Required:** assert on the disagreement text itself — `package expo-image vs expo-video` — as the
product test at `:697` already does. Then **verify by injection**: neuter the package row alone and
confirm this test, and only this test, goes red. Do the same for the flavour and artifact rows to
confirm all three legs are independently bound. Report the three injections.

## Item 4 (MUST) — the collateral gate will fail in CI

`check-spm-manifest-collateral.cjs:18` hardcodes `base: '466da8e06a1'` and reaches for it with
`git ls-tree`, `git show` and `git archive`. `.github/workflows/expotools.yml:22` uses
`actions/checkout` with no `fetch-depth`, so CI has a depth-1 clone where that object does not
exist. A reviewer reproduced it:

```
fatal: not a tree object
Error: Command failed: git … ls-tree -r --name-only … -- packages
```

All three tests fail, with a raw stack trace and no what/why/how.

**Required, both halves:**
1. Make the baseline reachable in CI — `fetch-depth` on that workflow, or an equivalent that does
   not depend on full history.
2. **An unreachable baseline must fail with a diagnostic, never a stack trace**, naming what failed,
   why (the baseline commit is not in a shallow clone), and what to do. Do **not** make it skip: a
   gate that skips when it cannot find its baseline is precisely the failure this whole round exists
   to remove. Fail, loudly and legibly.

## Item 5 (MUST) — the inventory check turns unrelated PRs red

`checkInventory` (`check-spm-manifest-collateral.cjs:55-74`) asserts the product inventory equals the
frozen baseline's. Once this gate is in the canonical suite, **any** unrelated PR that adds or
removes an `spm.config.json` product turns the whole `expotools` job red with "Product inventory
changed" — for a change that is not collateral damage at all.

The gate's actual question is: *did the manifests of products I did not migrate change?* Adding a
new package cannot answer that question, because it has no baseline manifest to differ from.

**Required — this is the semantics, implement exactly this:**
- Product present in **both** baseline and current → manifests must be byte-identical. A difference
  fails, as today.
- Product present in **baseline only** → **fail.** A product that disappeared is exactly collateral
  damage.
- Product present in **current only** → **informational**, not a failure. Report it by name so the
  addition is visible, and carry on.

## Item 6 (MUST) — the marker-collision hole in the path parser

`parseArtifactPath` (`ArtifactPath.ts:45`) returns the first layout that matches. A reviewer
constructed `/repo/packages/.build/.expo-prebuild/output/debug/xcframeworks/Foo.xcframework`, which
matches `SHARED_BUILD_TREE` with the package name captured as `.expo-prebuild`. Separately, the
greedy version-prefix group `(?:.+/)?` can swallow a second `.build/<pkg>/output/` segment, yielding
the wrong package.

Neither path is realistic today — both need a package directory named `.build` or a nested output
tree. But the package name selects which `spm.config.json` the dependency check reads, so a wrong
one is a false pass in the only check that catches a dropped dependency.

**Required:** apply this project's established principle — **a path that cannot be placed
unambiguously is refused, not guessed.** Refuse when both layouts match, and when a layout marker
occurs more than once in the path. Name the ambiguity in the message. Test both constructions above.

---

## Should-fix

7. **`PrebuildEquivalence.ts:461-470` — item 7's hoist regressed the most common user error.**
   Because the plan is now resolved before `compare`, `inspectArtifact`'s `readdirSync` reaches a
   mistyped path first, producing `Error: ENOENT: no such file or directory, scandir …` with a Node
   stack instead of `readSlices`' "There is no xcframework at … (side A)". Restore a diagnostic for
   a missing artifact.
8. **Correct the `.package.swiftinterface` comment** (`XCFrameworkComparison.ts:69-77`). The
   decision — skip a one-sided one — is **correct and stays**. But the stated reason is not the one
   that holds. `-package-name` appears nowhere in this pipeline, and the current build emits 190
   `.package.swiftinterface` files across 20 packages, so the file's existence plainly does not
   depend on a flag the two systems treat differently. The reason that actually holds: package-level
   API is unreachable to any consumer of the built framework, which is what these artifacts are for.
   Replace the justification with that, and drop the unverified claim.
9. **Error messages at `PrebuildEquivalence.ts:220` and `:387`** surface raw read errors with no
   what/why/how. Give them the repo's three-part shape.
10. **`PrebuildEquivalence.ts:174`** — the `--skip-spm-packages-check` path returns before reading
    the configuration, so the report cannot name sibling products that do declare `spmPackages`, as
    round 6b's item 3 required. Close that.
11. **Suite runtime.** The gate adds ~36 s to a ~2 s suite because `runGate` is invoked three times,
    each doing two `git archive` extractions and two full `tools/src` transpiles. Drive the three
    modes from one gate process, or share a fixture. Report the before and after timing.
12. **`SpmManifestCollateral.test.ts:24`** names a preload `INSTRUMENT_WRITES` while it hooks
    `readFileSync`.

## Settled — do not revisit

- **The "last-wins" flavour leg is unbindable by construction, and that is correct.** With the
  ambiguity refusal in place, a path with two distinct flavours throws, and a path with the same
  flavour twice has `first === last` — so `named[0]` and `named.at(-1)` are provably equivalent and
  the injection stays green. The implementation is right and the existing tests are honest about
  what they bind. Do not add a phantom assertion to make this leg look covered.
- `SwiftInterfaceChecks.ts:64` was changed from `function` to `export function` in round 6b, outside
  that round's fence. Accepted, and item 2 licenses the file.

## Constraints

- TypeScript: no `any`.
- **Red before green on every item**, reported separately. For items 3 and 6 the red is a fault
  injection; revert every injection and verify the revert.
- **A failed `pnpm build` leaves the previous `build/` output in place** and `node --test` then
  reports green against stale sources. Print and check the build exit status every time. This has
  produced false greens in four rounds of this work.
- A run that collects zero tests and exits 0 is not green. State suite and test counts every time.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Export it to this worktree.
- **State the full-suite baseline you observe before you start.** An independent clean rebuild
  measured `156 suites / 691 tests / 688 pass / 0 fail / 3 skipped`. Report what you see.
- Run no git command that changes state — no `checkout`, `stash`, `restore`, `reset`, `clean`.

## Report (concise, structured, agent-to-agent)

1. Red evidence per item, with counts.
2. Item 3: the three row injections, which test went red for each, and which stayed green.
3. Item 4: the gate failing legibly against an unreachable baseline — the actual message.
4. Item 5: the three inventory cases demonstrated.
5. Item 11: suite timing before and after.
6. Green evidence: targeted and full runs, counts, and build exit status.
7. `tsc` and `eslint --max-warnings 0` results.
8. Anything you could not do, and why.
