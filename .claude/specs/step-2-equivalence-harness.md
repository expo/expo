# Step 2 spec — build-equivalence harness

Status: approved 2026-09-18. Ledger: `.claude/ledger.md`. Linear: ENG-26918.
Independent of step 1. Neither step migrates any package.

## One-sentence statement

Build a reusable comparison that answers "did these two `.xcframework`s come out the same?"
for a single Expo package built two ways, so that steps 3 through 9 have an objective
migration gate instead of a human eyeballing a build log.

## Why this exists, and why it is not a byte diff

Ledger D3 retired the earlier gate. A Mode B build points its target paths at real repo
directories by design, so the emitted `Package.swift` text *must* differ and a byte-identical
artifact is not achievable. What must hold instead is that the compiled output is equivalent:
the same exported symbols and the same public Swift interface.

Byte comparison of the `.xcframework` is wrong for a second reason: `Info.plist`, dSYM UUIDs,
and embedded build paths differ between any two builds, including two builds of the same
unchanged source. A harness that compares bytes reports a difference every time and is
therefore worthless as a gate.

## Surface facts (verified 2026-09-18, do not re-derive)

- **Single-package build.** `tools/src/commands/PrebuildPackages.ts`, command
  `prebuild-packages`, alias `prebuild`. Scope is positional, not a flag:
  `et prebuild expo-haptics -f Debug -p iOS -n ExpoHaptics`.
- **Expansion.** `RunSteps.ts:525-529` `expandWithUnbuiltDependencies` silently adds monorepo
  packages named in `externalDependencies` whose xcframework is missing — so the first
  `expo-haptics` build may also build `expo-modules-core`. There is no flag to disable it.
  Second and later runs do not re-expand.
- **Output path.** `Frameworks.getFrameworksOutputPath` (`Frameworks.ts:166-178`) →
  `packages/precompile/.build/<pkg>/output/<flavor-lowercase>/xcframeworks/<Product>.xcframework`.
  Monorepo packages carry no `versionPrefix`; external ones do (`RunSteps.ts:576-578`).
- **Slice layout.** `<slice>/<Product>.framework/` holds the binary, `Headers/`,
  `Modules/module.modulemap`, and
  `Modules/<Product>.swiftmodule/<triple>.{swiftinterface,private.swiftinterface,package.swiftinterface,swiftdoc,abi.json}`.
- **`SwiftInterfaceChecks.ts` is a validator, not a comparator.** It answers "does this one
  artifact import a test-only module". Its slice-to-interface walk `findSwiftInterfaces`
  (`SwiftInterfaceChecks.ts:64`) is the one genuinely reusable part and is **not exported**.
- **No symbol-extraction code exists anywhere in `tools/`.** No `nm`, no `dyld_info`, no
  `swift-demangle`. The only binary inspection is diagnostic text: `otool -hv`
  (`Verifier.ts:619`) and `otool -L` (`Verifier.ts:638`), neither parsed into a structure.
  The ABI-skew check that exists elsewhere in the project's history is **not in this base**.
  Symbol extraction is therefore new code, not a reuse.
- **Build cost is unmeasured.** No timing figures exist in the code or docs. With a warm
  artifact cache (`packages/precompile/.cache`, currently ~12 GB) and warm per-product
  DerivedData (`SPMBuild.ts:217`, wiped only by `--clean`), a repeat build is incremental.
  A cold run additionally pays GB-scale React/Hermes downloads.

## A1 — Architecture: a pure core with a thin shell

The comparison must be unit-testable without Xcode, without a build, and without a Mac-only
toolchain in the loop. Three layers:

1. **`tools/src/prebuilds/equivalence/SymbolTable.ts`** — `parseNmOutput(text): SymbolSet`,
   a pure function over recorded `nm` text. Executing `nm` lives behind a separate,
   injectable reader so tests never shell out.
2. **`tools/src/prebuilds/equivalence/XCFrameworkComparison.ts`** — the core.
   `compareXCFrameworks(a: string, b: string, opts): EquivalenceReport`. Pure apart from
   filesystem reads. Knows nothing about `et prebuild` or about modes.
3. **`tools/src/commands/PrebuildEquivalence.ts`** — the shell. Resolves package → product →
   flavor → both artifact paths, optionally runs the two builds, prints the report, exits
   non-zero on any difference.

Layer 3 is a convenience. **Layer 2 is the deliverable**, and it must be callable with two
bare paths, because steps 3-9 will sometimes compare artifacts built hours apart.

## A2 — What is compared

Per slice, matched by slice directory name, for every slice present in either input:

**Exported symbols.** `nm -gU <binary>` — external, defined symbols only. Compare as sets.
Report symbols present in one side and absent in the other, in both directions. Mangled Swift
names are compared as-is; demangling is presentation only and must never change the verdict.

**Swift interface.** Every `<triple>.swiftinterface` and `<triple>.private.swiftinterface`
under `Modules/<Product>.swiftmodule/`, compared as normalized text (A3). `.package.swiftinterface`
is compared when present on both sides. `.swiftdoc` and `.abi.json` are **not** compared —
`.swiftdoc` is a binary format with embedded paths, and `.abi.json` is redundant with the
symbol set for this purpose.

**Structural presence.** The slice set itself, the presence of the binary, of
`Modules/module.modulemap`, and the `Headers/` file name set. A header present in one build
and missing in the other is a real defect and the symbol set will not always catch it.

**A2 AMENDED 2026-09-18 — presence alone is not enough. Both gaps were proven on real
artifacts by review, and the fault is this spec's, not the implementation's.**

*Everything in a slice is compared, not only `*.framework`.* Deleting
`expo-application_EXApplication.bundle` from every slice of a real `EXApplication.xcframework`
reported `Equivalent`. Real slices carry resource bundles both beside the framework
(expo-application) and inside it (expo-media-library), and each holds `PrivacyInfo.xcprivacy`.
This project has already lost resource bundles once when the build shape changed. Compare the
full slice tree: every bundle, its file set, and the content of `PrivacyInfo.xcprivacy`.

*Text artifacts are compared by content, not by name.* Gutting every `module.modulemap` to a
single comment and overwriting `EXApplication-Swift.h` with `// gutted` reported `Equivalent`.
The modulemap is path-free text (`use React`, `umbrella header`, `export *`). Compare the
content of `module.modulemap` and of every header under `Headers/`.

The header case is not a nicety. Three pure-ObjC Tier C packages emit **no `.swiftinterface`
at all**, and ObjC method signatures produce no exported symbols — so without header-content
comparison the entire interface half of the gate is empty for them and a changed public ObjC
API is invisible. The gate would rubber-stamp those three packages.

Explicitly **not** compared: `Info.plist`, dSYMs, binary bytes, file sizes, timestamps,
code signatures.

## A3 — Normalization, and the trap it exists for

A raw `.swiftinterface` diff fails on every correct build. Its header carries

    // swift-compiler-version: ...
    // swift-module-flags: -target ... -I /Users/<path>/staging/... -module-name ...

and the `-I` / `-F` / `-Xcc -I` paths point at the per-mode staging directory, which differs
between Mode A and Mode B **by design**.

Normalization rules, applied to both sides before comparison:

- Absolute paths under the repo root, the build path, or the cache path collapse to the
  literal placeholder `<PATH>`. The path is replaced; the flag that carried it is kept.

  **A3 AMENDED 2026-09-18 — anchor this, it was proven to erase real changes.** An unanchored
  rule that collapses any `/a/b`-shaped token is not what this bullet asks for, and review
  produced two triggers that both reported equivalent: a public default value changing from
  `"https://api.example.com/v1"` to `".../v2"`, and `-Xcc -DFACTOR=8/2/1` against `8/4/1`
  (both normalize to `-DFACTOR=8<PATH>`). Collapse only genuine filesystem paths rooted at the
  repo, build or cache directory, and only where they appear as path arguments — never inside
  a string literal, and never in an arithmetic or macro expression. A URL in a public default
  is public API: a change there must surface.

- Interface text is compared **in order**. An unordered multiset of trimmed lines reports
  equivalent when an attribute moves between declarations — review's trigger was
  `@available(*, unavailable)` moving from `first()` to `second()`, which changes the public
  API and compared clean.
- Trailing whitespace is stripped; line endings are normalized.
- Nothing else. In particular `swift-module-flags` is **kept and compared** after path
  collapsing, because a genuine flag change — `-enable-library-evolution` disappearing, say —
  is exactly the regression this gate exists to catch. Deleting the whole header line would
  hide it.

The known Xcode-27 hazard applies: the pipeline rewrites `.swiftinterface` text
(`Frameworks.ts:1388`) and Swift 6.4 prints `Target::Type` where earlier versions printed
`Target.Type`. Both modes pass through the same rewrite, so this does not break the
comparison — but if the harness reports interface differences that are all of that shape,
that is the rewrite bug, not a Mode B defect. Say so in the report text.

## A4 — The `spmPackages` assertion (ledger F15/F16)

Three packages declare `spmPackages`: `expo-image`, `expo-image-manipulator`, `expo-camera`.
A symbol comparison **cannot** catch a broken external-dependency resolution, because the
build fails outright rather than producing a differing artifact — or, worse, succeeds while
silently dropping the dependency.

The silent path is real and is the single most important thing this harness must catch:
`Frameworks.ts:651-655` logs `⚠️  SPM dependency <name> not found in Build/Products/ or
SourcePackages/artifacts/` and **continues**. The build goes green, the dependency is simply
absent from the output and from the tarball (`Frameworks.ts:730-735`).

A companion check, `assertSpmPackagesResolved(pkg, product, flavor): Diagnostic[]`, therefore
asserts all four of:

1. The generated `Package.swift` contains, for each declared `spmPackages` product, either a
   `.package(url:)` line (`SPMPackage.ts:651-659`) or a `.binaryTarget(path:)` line
   (`SPMPackage.ts:1487-1518`). One or the other, never neither.
2. The prepared xcframework exists at `Frameworks.getSharedSPMDepFrameworkPath(product, flavor)`.
3. The run log contains no `not found in Build/Products/` warning for that dependency.
4. `otool -L` on the product binary still names the dependency's `@rpath` entry.

**The counter-assertion, which a naive harness gets wrong:** a shared SPM dependency
legitimately does **not** sit beside the product in
`output/<flavor>/xcframeworks/`. It lives in `packages/precompile/.build/.spm-deps/`, and
`Frameworks.ts:562-564` logs `⏭️  Skipping shared SPM dep <name> (already at shared location)`
on a correct build. Verified on disk: `expo-image/output/{debug,release}/xcframeworks/`
contains only `ExpoImage.xcframework` and `ExpoImage.tar.gz`. A check asserting
`SDWebImage.xcframework` sits next to `ExpoImage.xcframework` fails on a correct build, unless
`bundleSharedDeps` is set. Do not write that check.

## A5 — Report shape

`EquivalenceReport` carries a boolean verdict plus a structured difference list: slice, kind
(`symbols` / `interface` / `structure`), and the specific items. The printed form leads with
the verdict and the count, then the differences grouped by slice, then — for a package with
`spmPackages` — the four diagnostics of A4.

Error text follows the repo's what / why / how rule (`.claude/CLAUDE.md`, "Error messages").
"Differs" is not a next step; name the symbol or the interface line and what it implies.

## Acceptance criteria

Red/green applies. Tests are written and **seen failing** first. `tools/` has no jest: it runs
`pnpm build && node --test 'build/**/*.test.js'` (`tools/package.json`). Tests are `*.test.ts`
compiled to `build/**/*.test.js`.

⚠ `et` resolves `EXPO_ROOT_DIR`, not the working directory — in a worktree a bare `et` builds
the **main checkout**. Export `EXPO_ROOT_DIR` to the worktree for every invocation. Confirm a
non-zero test count in every run; a suite that collects zero tests exits 0 and looks green.

**B1 — Positive control.** Comparing an xcframework fixture against an identical copy reports
equivalent, with an empty difference list.

**B2 — Negative controls, one test each. This is the criterion that matters most.** A harness
that never reports a difference passes B1 perfectly and is worthless. Each of the following
perturbations, applied to a copy of the fixture, must be **detected**, and the reported
difference must name the perturbed item:

- a symbol removed from one side's binary;
- a symbol added to one side;
- a public declaration removed from a `.swiftinterface`;
- a `swift-module-flags` entry changed to something other than a path
  (`-enable-library-evolution` dropped);
- a whole slice missing on one side;
- a header file missing from `Headers/` on one side;
- `Modules/module.modulemap` missing on one side.

**B3 — Normalization does not hide a real change.** Two fixtures differing **only** in
absolute build paths report equivalent. Two fixtures differing in a non-path part of
`swift-module-flags` report a difference. Both assertions in the same test file, because the
pair is the actual contract.

**B4 — `nm` parsing.** `parseNmOutput` is tested against recorded `nm -gU` text fixtures
covering: Swift mangled names, ObjC class symbols (`_OBJC_CLASS_$_`), C symbols, an empty
table, and malformed input (which must throw, not silently yield an empty set — an empty
symbol set compared against another empty set would report equivalent, a false green).

**B5 — `spmPackages` assertions.** `assertSpmPackagesResolved` is tested against fixtures
for: all four conditions met; the `Package.swift` line absent; the prepared xcframework
absent; the warning present in the log; the `otool -L` entry absent. Plus the counter-case of
A4 — a correct `expo-image`-shaped layout with the dependency in `.spm-deps/` and **not**
beside the product **must pass**. A harness that fails that case is worse than none.

**B6 — One real artifact, end to end.** Run the comparison against a genuine built
`.xcframework` compared with itself, to prove the fixtures are not lying about the real
layout. Any already-built artifact under `packages/precompile/.build/*/output/` serves; if
none exists, build one (`et prebuild expo-haptics -f Debug -p iOS`) and say in the report
how long it took — that number is currently unknown and worth recording.

B6 is the only criterion that needs a build. B1 through B5 must run with no Xcode, no
network, and no prebuilt artifact.

## Out of scope

- Running the comparison against a real Mode A vs Mode B pair. No package has a checked-in
  `Package.swift` yet; that is step 3's pilot, and it is what consumes this harness.
- Any change to the build pipeline itself, to `Verifier.ts`, or to `SwiftInterfaceChecks.ts`
  beyond **exporting** `findSwiftInterfaces` if it is reused. Do not alter its behaviour.
- CI wiring.
- `packages/expo/scripts/spm/` — another session owns that directory.
- Fixing F15 in the autolinking plugin. That is step 2b, and it is not in this file.
