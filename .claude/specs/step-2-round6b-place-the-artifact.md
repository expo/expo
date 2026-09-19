# Step 2, round 6b — place the artifact, and stop passing on things never compared

Round 6a is sound in its core: reading the generated `Package.swift` through
`swift package dump-package` instead of scanning its text was the right change and is not up for
revision. Ten items follow: **three must-fix** (items 1, 7, 10) and seven should-fix. Do not
redesign anything else.

Two independent blind reviews — one from a different lab — converged on items 1, 2 and 3, and one of
them reproduced each live. Treat those three as established facts, not as claims to re-litigate.

**Files you may change:** `tools/src/commands/PrebuildEquivalence.ts` and everything under
`tools/src/prebuilds/equivalence/`, plus their tests. Two named exceptions, both authorised:

- Item 1 imports one existing constant from `tools/src/prebuilds/PackageLocalBuild.ts`. Importing
  from that file is allowed; editing it is not.
- Item 10 may edit `tools/package.json` and may add or move a file under `tools/src/` or
  `tools/scripts/`. That is the whole of its licence.

Anything else: stop and report rather than reaching for it.

## Context you need

`et prebuild-equivalence` compares two builds of the same Expo package and reports whether they are
equivalent. It exists to catch one specific failure: the new build silently dropping a SwiftPM
package dependency. Comparing compiled symbols provably cannot catch that, which is why the command
also reads the generated `Package.swift`.

The defect class this project keeps hitting, and the one every item below belongs to: **a check that
reads green without running.** A check skipped but reported as a pass. A comparison of two empty
things. A guard whose condition is satisfied by the very thing it was meant to reject. Treat any
behaviour of that shape as the priority.

---

## Item 1 (BLOCKER) — the artifact-path parser refuses a layout this repo produces

`tools/src/prebuilds/equivalence/ArtifactPath.ts:20` anchors `ARTIFACT_PATH` on `/.build/`:

```
(?:^|\/)\.build\/(@[^/]+\/[^/]+|[^/]+)\/output\/(?:.+\/)?(debug|release)\/xcframeworks\/([^/]+)\.xcframework\/?$
```

A path it cannot parse is refused by `readArtifactContext` (`PrebuildEquivalence.ts:203`), which
aborts the whole run. That refusal is correct in principle — a path carrying no evidence must not be
reported on. But it currently rejects a **second layout the repo itself writes**:

- `PackageLocalBuild.ts:5` — `PACKAGE_LOCAL_BUILD_DIRECTORY = '.expo-prebuild'`, and
  `getPackageLocalBuildPath(pkg)` is `<pkg.path>/.expo-prebuild`.
- `pipeline/RunSteps.ts:521` — under `request.exactPackage`, every requested package is mapped
  through `withPackageLocalBuildPath`, so `pkg.buildPath` becomes `<pkg>/.expo-prebuild`.
- `commands/PrebuildPackageForPublish.ts:41` sets `exactPackage: true`. This is the Turbo publish
  path, `et prebuild-package-for-publish` — a first-class producer, not a user's scratch copy.
- `Frameworks.ts:167` — `getFrameworksOutputPath` then writes
  `<pkg>/.expo-prebuild/output/[<version>/]<flavor>/xcframeworks/<Product>.xcframework`.

So `packages/expo-image/.expo-prebuild/output/debug/xcframeworks/ExpoImage.xcframework` is a real
build output that this command refuses to look at.

**⚠ This is not a one-token tweak.** The two layouts put the package name on opposite sides of the
marker:

| layout | marker | package name is |
|---|---|---|
| A | `.build` | the segment **after** it: `.build/<package>/output/…` |
| B | `.expo-prebuild` | the segment **before** it: `<package>/.expo-prebuild/output/…` |

**Required:**

1. Parse both layouts. Keep the two patterns separate and named; do not fuse them into one
   unreadable alternation.
2. Derive layout B's marker from `PACKAGE_LOCAL_BUILD_DIRECTORY` imported from
   `../PackageLocalBuild`, escaping it for use in a pattern. Do not retype the literal
   `.expo-prebuild` — the point is that the two cannot drift apart.
3. Both layouts keep the existing tail semantics: an optional version prefix of one or more segments
   between `output/` and the flavor, and a scoped package name spanning two segments
   (`@scope/name`). Layout B's package segment is the one immediately before the marker, and it is
   scoped when the segment before *that* begins with `@`.
4. Update the refusal message in `readArtifactContext` — it currently names only the `.build` layout
   and tells the user to keep that tail. It must name both layouts.
5. Update the doc comment on `ARTIFACT_PATH`, which currently claims `.build/…` is "the layout
   `Frameworks.getFrameworksOutputPath` writes". That is half the truth and it is what caused this.

**Tests:** both layouts, each with and without a version prefix, each with a scoped and an unscoped
package name, plus the existing rejection cases (a copy in a scratch directory must still be
refused). Prove the refusal message names both layouts.

---

## Item 2 (should-fix) — the flavour of a binary target is read from the wrong segment

`SpmPackagesCheck.ts:433`:

```ts
relativePath?.split(path.sep).find((segment) => segment === 'debug' || segment === 'release') ?? null
```

`.find` takes the **first** flavour segment. In
`../debug/.spm-deps/SDWebImage/release/SDWebImage.xcframework` the artifact is the Release one and
this reports Debug.

A reviewer demonstrated the false pass live, against the real code:

```
path: "../release/.spm-deps/SDWebImage/debug/SDWebImage.xcframework"
assertManifestMatchesFlavor(manifest, 'Release')  →  ACCEPTED
```

A Release build vouched for by a manifest pointing at a **debug** dependency. Note what is and is
not established: the false pass is real and executable on a crafted manifest, but nobody has shown
today's emitter producing such a path — I traced it and every `.binaryTarget` path is
`path.relative(packageSwiftDir, …)` (`SPMPackage.ts:1535`, `:602`), climbing out through `..`
segments only, with one flavour segment per dependency root. Fix it regardless, and here is the
reason, because it is the whole point: `assertManifestMatchesFlavor` exists to catch a manifest that
does **not** describe this build. Arguing "the emitter cannot produce that path" assumes the emitter
is correct, which is precisely what this check must not assume.

**Required:** the flavour is the one nearest the artifact — the **last** matching segment, not the
first. And a path containing two **different** flavour segments is ambiguous: refuse it, naming the
path and both values. Silently resolving it either way is the defect class above. Two occurrences of
the *same* flavour are not ambiguous. Zero matches keeps today's behaviour (the existing refusal).

**Tests:** last-wins; two differing flavours refused with both named; same flavour twice accepted;
zero unchanged.

---

## Item 3 (should-fix) — `--product` can switch off the only check that catches a dropped dependency

`PrebuildEquivalence.ts:130` returns `null` when the resolved product declares no `spmPackages`. The
run then exits 0 having compared only artifacts, and says nothing about the dependency check not
having run.

There is a guard at `:288`, but it is a coincidence rather than a defence: it fires only when the
artifact basename is itself a declared product name. The code's own comment at `ArtifactPath.ts:7`
says a framework name and the product name that built it commonly differ
(`EXApplication.xcframework` ← `ExpoApplication`). Whenever they differ, the guard is inert.

Corpus facts I verified, so you need not re-derive them: of 67 `spm.config.json` files, exactly three
products declare `spmPackages` — `expo-image/ExpoImage`, `expo-image-manipulator/ExpoImageManipulator`
and `expo-camera/ExpoCameraBarcodeScanning` — and only **expo-camera** mixes, its sibling `ExpoCamera`
declaring none. For that one package, product name, pod name, target name and artifact name all
coincide, so the guard does fire today. It stops firing the day a mixed package ships a product whose
framework name differs from its product name.

**Required — two changes, and mind the difference between them:**

1. **Always state whether the dependency check ran.** When it did not, the report says so and says
   why, naming any products of this package that do declare `spmPackages`. A product that genuinely
   declares none is a legitimate, permanent state — this is not an error, and it must not become one.
   What must end is the silence.
2. **Refuse one specific shape**, where the flag is the only thing that turned the check off and
   nothing corroborates it: `--product` was passed explicitly **and** the selected product declares
   no `spmPackages` **and** the artifact basename differs from the selected product's name **and**
   some sibling product in the same `spm.config.json` does declare `spmPackages`. Name the selected
   product, the artifact, and the sibling, and point at `--skip-spm-packages-check` as the explicit
   route. All four conditions must hold — do not broaden this, or you will refuse a legitimate
   comparison of a product that simply has no SwiftPM dependencies.

**Tests:** the refusal, with each of the four conditions relaxed in turn proving it does *not* fire
(four cases); and the report line in both no-check situations.

---

## Items 4–6 (should-fix) — `XCFrameworkComparison.ts` passes on things it never compared

### Item 4 — a `.framework` holding no binary on **either** side is never symbol-compared

`:190` runs `compareSymbols` only when the product binary exists on both sides. When it exists on
neither, nothing runs and nothing is reported. The `carriesFramework` guard at `:494` only requires
some slice to contain a `.framework` **directory**, which an empty one satisfies. So two artifacts
whose frameworks are all empty directories report `Equivalent — 0 differences` — the "two empty
things are equal" failure that guard was written to prevent, reintroduced one level down.

The one-side-only case is already caught by the tree compare. The uncaught case is both sides empty.

**Required:** a `.framework` matched on both sides but carrying no binary on either is a reported
difference — or, if you judge a refusal more appropriate given the `:494` guard's intent, a refusal.
State which you chose and why in your report.

### Item 5 — the slice tree compare matches path names, not entry kind

`:215-218` builds `pathsA`/`pathsB` from `entry.path` alone. `TreeEntry` carries `isDirectory`
(`:52-55`) and it is never compared. A directory `Foo.bundle` on one side and a **file** named
`Foo.bundle` on the other report no difference.

**Required:** compare kind as well as path, and report a same-path/different-kind entry as a
difference in its own right, distinct from present-on-one-side-only.

### Item 6 — a `.swiftinterface` outside a `.framework` is invisible to both comparisons

`readTree` drops every path matching `SWIFT_INTERFACE` (`:61`, applied at `:526`) on the stated
grounds that the interface comparison owns it. But `compareInterfaces` runs only per matched
`.framework` (`:196`) and indexes from inside it. A `.swiftinterface` sitting loose in a slice is
therefore excluded from the tree compare **and** never reaches the interface compare.

**Required:** close the gap. Either the tree compare stops excluding interfaces it is the only
comparison that would see, or the interface comparison extends to the slice. Either is acceptable;
what is not acceptable is a file no comparison looks at. Say which you chose.

---

---

## Item 7 (MUST FIX) — the operator reads "Equivalent" and only then sees the error

Round 6a hoisted `assertSameBuild` so that agreement is established **before** the verdict is
printed. The manifest flavour check was not hoisted and has exactly the same shape. A reviewer
observed this on real `expo-image` artifacts: the command printed

```
Equivalent — same exported symbols, same public interface, same structure.
```

and only afterwards threw the release-manifest error. The exit code is correct, so CI is safe — but
a human reads a green verdict and then a stack trace, and the green verdict is the thing they
remember. This is the defect class at the top of this spec wearing a different hat: a conclusion
presented before the checks that could invalidate it have run.

**Required:** every check that can invalidate the verdict runs before the verdict is formatted or
printed. Do this by construction, not by moving one more call: if two places currently run the
agreement checks (`PrebuildEquivalence.ts:76` and `:124` both do, which is also why the property is
hard to see), arrange it so there is one place where "everything that can refuse has refused" is
established, and the report cannot be printed before it. Say in your report how you made it
structural rather than positional.

## Item 8 (should-fix) — the product leg of the agreement check is untested

`PrebuildEquivalence.ts:178` compares `a.artifactName` against `b.artifactName`. Neutering only that
row — leaving the package and flavour rows intact — leaves the suite green: a reviewer injected
exactly that and got 125 pass / 0 fail. The package and flavour legs are bound; this one is not.

**Required:** a test pairing two artifacts from the same package and flavour whose product basenames
differ (for example `.build/expo-av/output/debug/xcframeworks/ExpoAV.xcframework` against
`…/ExpoAudio.xcframework`), asserting the refusal names both. Confirm it goes red when that row
alone is neutered.

## Item 9 (should-fix) — the `.package.swiftinterface` skip is a permissive skip with no coverage

`XCFrameworkComparison.ts:333` silently ignores a `.package.swiftinterface` present on one side
only. Deleting the skip changes no test — a reviewer injected that and got 125 pass / 0 fail. An
unexamined permissive skip is the defect class of this whole task, sitting in the one file whose job
is refusing to pass over differences it has not examined.

**Required:** decide whether the skip is right, and bind the decision with a test either way. If it
is right, the test asserts the skip and a comment states why a one-sided `.package.swiftinterface`
is not a difference. If it is not right, it becomes a reported difference. State which you chose.

## Item 10 (MUST FIX) — a gate that no command invokes

`tools/scripts/check-spm-manifest-collateral.test.cjs` exists and is run by nothing. A reviewer
grepped the repository: it is referenced only from `.claude/` notes. `tools/package.json`'s `test`
script is `pnpm build && node --test 'build/**/*.test.js'` — `scripts/` is not compiled into
`build/`, and `.cjs` does not match `*.test.js`. A previous round was asked to either wire it in or
give it an explicit invocation and did neither, so this gate has never run.

It is not decoration. It enforces that packages **not** being migrated emit a byte-identical
manifest, which is half the acceptance criterion for the nine migration steps this harness exists to
gate. A gate that reads as present but never executes is worse than no gate.

**Required:** make it run in the canonical suite. Preferred: port it to a `*.test.ts` under
`tools/src/` so it is compiled and collected by `node --test 'build/**/*.test.js'` like every other
test. If that is disproportionate — say, because it must run against the repository rather than
against fixtures — add an explicit npm script in `tools/package.json` **and** make the canonical
`test` script invoke it, so that no one has to know it exists. Either way, demonstrate it actually
runs: show it collected and passing in a suite run, and show it going red against a deliberately
altered manifest. An invocation nobody has seen fail is not evidence.


## Constraints

- TypeScript: no `any`.
- **Red before green on every item.** Write the test, run it, see it fail, then implement. Report
  the red run and the green run for each item, with counts. No red evidence means not done. If you
  find yourself unable to produce a red in the correct order for some item, say so explicitly and
  say what you did instead — do not quietly compensate.
- **A failed `pnpm build` leaves the previous `build/` output in place, and `node --test` then
  reports green against stale sources.** Print and check the build exit status every time before
  trusting any test run.
- A run that collects zero tests and exits 0 is not green. State suite and test counts every time.
- `et` resolves `EXPO_ROOT_DIR`, not the working directory. Export it to this worktree, or you will
  silently act on the main checkout.
- **State the full-suite baseline you observe before you start, and do not try to match a number
  from this document.** Separate work has been landing in this tree and the count moves.
- Run no git command that changes state — no `checkout`, `stash`, `restore`, `reset`, `clean`.
- `packages/precompile/.build` does not exist in this worktree, so items 1–3 cannot be demonstrated
  against real build output here. Fixtures are expected. Do not fabricate a real-artifact
  demonstration; if you construct a directory tree that mimics one, call it what it is.
- Error messages in this repo say what failed, why, and what to do next.

## Report (concise, structured, agent-to-agent)

1. Red evidence per item, with counts.
2. Green evidence: targeted and full runs, with suite and test counts, and the build exit status.
3. Item 1: the patterns you wrote, and the full matrix of layouts you proved.
4. Items 4, 6 and 9: which option you chose, and why.
5. Item 7: how you made the ordering structural rather than positional.
6. Item 10: the gate collected and passing in a suite run, and the same gate going red against a
   deliberately altered manifest.
7. `tsc` and `eslint --max-warnings 0` results.
8. Anything you could not do, and why.
