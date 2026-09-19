# Step 1 spec — Mode B in `et prebuild`

Status: approved 2026-09-18, plan gate passed. Implemented; in its second review cycle.
D-F amended 2026-09-18 (see `moduleMapContent`, below).
Ledger: `.claude/ledger.md`. Linear: ENG-26918.

## One-sentence statement

When a package ships a `Package.swift` at its root, derive its SwiftPM target
structure from that manifest instead of from the `targets` array in `spm.config.json`,
and build those targets from the real repo directories rather than from a staged
copy — while every other part of the emitted manifest stays exactly as it is today.

## Scope boundary

Step 1 changes the pipeline only. **It migrates no package.** No `Package.swift` is
added to any package that has an `spm.config.json`, so every package continues to
build through Mode A. The pilot is step 3.

This is safe precisely because of D-B: no package in the pipeline has a root
`Package.swift` today, so landing the switch changes nothing until a manifest is
added deliberately.

## The core architectural claim

Mode A's emitted manifest has two halves:

- **Structural half** — the target list, each target's path, `exclude`, `sources`,
  `resources`, `publicHeadersPath`, and product-to-target membership.
- **Environment half** — `.binaryTarget(path:)` entries for React / Hermes /
  ReactNativeDependencies / sibling xcframeworks, `swiftSettings` / `cSettings` /
  `cxxSettings` / `linkerSettings`, per-flavor `.when(configuration:)` flags,
  `${VAR}` substitution, macro-plugin flags, header-map flags, `.library(type: .dynamic)`,
  `cxxLanguageStandard`, tools version.

Only the structural half can live in a checked-in manifest (ledger F2). The
environment half depends on the artifact cache path, the build flavor, and the RN
and Hermes versions, none of which a committed file can name.

**Therefore Mode B replaces exactly one function's worth of behaviour:
`resolveSourceTarget` (`tools/src/prebuilds/SPMPackage.ts:794-902`) and the source
staging walk that feeds it. It produces the same `ResolvedTarget[]`
(`SPMPackage.types.ts:89-106`) the rest of the pipeline already consumes.
Everything downstream — `buildSwiftSettings`, `buildCSettings`,
`collectHeaderMapFlags`, `generatePackageSwiftContent`, `SPMBuild`,
`Frameworks.composeXCFrameworkAsync` — is untouched.**

If an implementation finds itself editing the environment half, it has left the spec.

## E1 — The layout, verified by experiment

Verified with `swift package describe` **and** `swift build` on a scratch package
(2026-09-18). This is not assumed.

For each target, the pipeline creates a small staging directory that contains a
**symlink to the real source directory** plus any generated files:

```
<pkg.buildPath>/generated/<product>/
  Package.swift                       # emitted; environment half + structure from the checked-in manifest
  <TargetName>/
    src -> <repoRoot>/packages/<pkg>/<dumped target path>    # directory symlink
    <Product>+Exports.swift           # generated, exactly as Mode A generates it today
```

and the emitted target reads:

```swift
.target(
  name: "<TargetName>",
  path: "<TargetName>",
  exclude: ["src/Tests"],                          // each dumped exclude, prefixed "src/"
  sources: ["src", "<Product>+Exports.swift"],
  ...
)
```

Three results from the experiment, each one load-bearing:

- SwiftPM **recurses through the `src` symlink** and compiles the real sources.
- The generated file beside the symlink **joins the same module**.
- `exclude: ["src/Tests"]` **is honoured through the symlink** — a file containing
  deliberately invalid Swift under `Tests` was not compiled.
- A source file using `Date()` with **no `import Foundation` of its own** compiled,
  because the generated `@_exported import Foundation` reached it across the symlink.

That last point is why this layout is required rather than the plugin's simpler
package-level `root` symlink (`manifests.js:512-518`). See D-A below.

## Decisions

### D-A — Keep generating `<Product>+Exports.swift`. Do not drop it.

`SPMGenerator.ts:303-340` writes `@_exported import` lines for every entry in the
target's `linkedFrameworks`, plus every in-product target dependency. Every Tier A
package declares `linkedFrameworks: ["Foundation", "UIKit"]`, so this file exists
for all of them.

Dropping it in Mode B would:

- break compilation of every source file that relies on those imports arriving from
  a sibling — the exact failure class that `466da8e06a1` ("Import UIKit and
  Foundation where files relied on siblings") was fixing, and that
  [[project_swiftpm_explicit_module_import_class]] records; and
- change the module's `.swiftinterface`, which is half of the step-2 build
  equivalence gate (D3).

The file cannot be written into the repo tree. Hence the per-target staging
directory of E1 rather than a single package-level symlink.

### D-B (USER 2026-09-18) — Switch on the presence of `<packageRoot>/Package.swift`. No opt-in field.

**No field is added to `spm.config.json`.** If the package root holds a
`Package.swift`, the product builds in Mode B. If it does not, Mode A, byte for byte
as today.

An earlier draft argued for an explicit field on the grounds that presence would flip
four existing manifests unmigrated. That was verified false (ledger F12, withdrawn):
`expo`, `expo-constants` and `@expo/log-box` have no `spm.config.json` at all, so the
pipeline never sees them, and `expo-modules-jsi` keeps its manifest at
`apple/Package.swift`, which a root check misses. **A root presence check flips zero
packages today.**

Presence is preferred because it is one rule rather than two, it keeps a single source
of truth for whether a package is migrated, and it matches the autolinking plugin,
which already switches this way (`plugin.js:128`). Two different switch mechanisms for
the same underlying question would itself be a defect risk.

Consequences that follow, and must be honoured:

- **Adding a `Package.swift` to a pipeline package IS the migration.** There is no
  second flip. One PR per package, which matches the observed cost pattern (F8).
- **D-G's loud failures become the safety net**, not a nicety. A manifest added for
  any reason changes the build, so a manifest Mode B cannot express must abort, never
  degrade.
- **Root only**, matching the plugin exactly. `expo-modules-jsi` is a known exception:
  it has both an `spm.config.json` and an `apple/Package.swift`, so it stays in Mode A
  until that is addressed on its own turn. Do not add a second search location in step 1.
- When a manifest is present, the product's `targets` array is ignored for structure.
  Leave the array in place; D-F still reads other fields from the config. Do not delete
  `targets` from any config in step 1.

### D-C — Port the transform, do not import it

The generic helpers in `packages/expo/scripts/spm/manifests.js` (`runDumpPackage`,
`parseDumpedManifest`, `resolveTargetPaths`, `renderFileRules`) are the correct
shape (ledger D2) but live in a published package's JS plugin, not in `tools/`.
Cross-importing couples the build pipeline to the plugin's release cycle.

Create `tools/src/prebuilds/CheckedInManifest.ts` in TypeScript, mirroring that
shape. Keep the two implementations independent. Where behaviour must agree, say so
in a comment naming the counterpart function.

**Port from the post-#50329 version of `manifests.js`, not from `main`.** That open PR
adds `spmPackageIdentity` / `spmPackageDeclaration` / `spmProductDependency` and
threads an `spmPackages` argument through. Porting the older shape would reintroduce
the defect below.

**Do not inherit `siblingDependency`'s defect (ledger F15).** The plugin's version
reads only `dep.byName ?? dep.target`, so a `.product(name:package:)` dependency
returns `null` and is silently filtered away. The port must handle the `dep.product`
form — either by carrying it, or by raising the D-G error. Silence is the one
behaviour that is not acceptable.

### D-D — Target language is inferred from disk, not declared

`ResolvedTarget.type` drives exports generation, settings selection, and
`publicHeadersPath`. A checked-in `Package.swift` does not declare a language.

SwiftPM already forbids mixed-language targets, so the language is unambiguous.
Infer it from the resolved source set, after `exclude` is applied:

- any `.swift` → `swift`
- else any `.cpp` / `.cc` / `.cxx` / `.mm` → `cpp`
- else → `objc`
- no source files at all → hard error (D-G)

Do not read the language back out of `spm.config.json`.

### D-E — Dependencies are merged, not taken from the manifest

A checked-in manifest declares `dependencies: []` by design (F2 —
`packages/expo-constants/Package.swift` already does this). The real dependency
edges are:

- **sibling targets within the product** — from the dumped manifest's target
  dependencies, filtered to regular targets;
- **everything external** — React, Hermes, ReactNativeDependencies,
  `expo-modules-core/ExpoModulesCore`, sibling packages — from the product's
  existing `externalDependencies` in `spm.config.json`, resolved to
  `.binaryTarget`s by the unchanged environment-half code.

The merge order and de-duplication must produce the same dependency list Mode A
produces for an equivalent package.

### D-F — What `spm.config.json` still carries in Mode B

`podName`, `codegenName`, `publishPrebuilds`, `sourceOnly`, `customBuild`,
`autolinkWhen`, `textualHeaders`, `excludeFromUmbrella`, `externalDependencies`,
`spmPackages`, `compilerFlags` / `linkerFlags` (including `${VAR}` substitution and
per-flavor forms), `includeDirectories`, `moduleMapContent`, and `linkedFrameworks`.

**`spmPackages` is never removable** (ledger F16). It is read by
`precompiled_modules.rb:1612-1613,1694-1695`, `SPMBuild.ts:51`,
`Frameworks.ts:492-521,724-726`, and `SPMPackage.ts:651,1487,1642` — and the last of
those writes it into the emitted manifest, so it is structural, not just metadata.
Removing the key breaks the precompiled path as well as the source path. Only three
packages declare it — `expo-image`, `expo-image-manipulator`, `expo-camera` — and they
are step 7's problem, not step 1's — but Mode B must keep emitting it.

**D-F1 (USER 2026-09-18) — The manifest supplies structure and nothing else.**

Read from the checked-in manifest: the target list, each target's `path`, `exclude`,
`sources`, `resources`, `publicHeadersPath`, and product-to-target membership.

Read from `spm.config.json`: **everything else**, `linkedFrameworks` and `platforms`
included. Do not read `.linkedFramework(...)` out of the dumped `linkerSettings`, and
do not take `platforms` from the dump even though `dump-package` reports them.

Rationale: `linkedFrameworks` feeds dependency-graph construction, not just the
generated exports file, and it belongs with the other graph inputs. One rule — the
manifest owns layout, the config owns the graph and the environment — is easier to
hold than a per-field fallback table. This closes the spec's only open field question.

`headerPattern` and `fileMapping` are **not supported in Mode B** (ledger F5). No
Tier A or Tier B package uses them. A product that declares either alongside
`manifest` is a hard error (D-G).

**D-F AMENDED 2026-09-18 — `moduleMapContent` cannot be honoured in Mode B; it is a hard
error, not a retained field.** Listing it above as retained was wrong. Mode A writes the
module map to `<staging>/<Target>/include/module.modulemap` with `publicHeadersPath:
"include"`. In Mode B `publicHeadersPath` resolves to `src/include`, which is inside the real
repo tree, so honouring the field would **mutate the source checkout**. Throwing is the
correct failure mode under D-G. Two independent reviewers reached this conclusion separately.

Its only declared user is `external-configs/ios/react-native-screens` (two targets), and
external configs are permanently Mode A under F1 — so once the presence check is restricted
to in-repo packages, no reachable product declares it.

### D-G — Unrepresentable constructs fail loudly

Mode B must never silently degrade. Each of the following aborts the build for that
product with an error written to the repo's what / why / how rule
(`.claude/CLAUDE.md`, "Error messages"):

| condition | why it cannot be expressed |
|---|---|
| a target's path cannot be resolved to a real directory | nothing to symlink |
| a target depends on a declared non-regular target (binary, system, macro, plugin) | the mirror declares only regular targets |
| the manifest declares `.package(url:)` dependencies | the environment half owns all external deps (D-E) |
| a target depends on a `.product(name:package:)` entry | F15 — the plugin drops these silently; Mode B must not |
| the manifest declares a macro or system-library target | no equivalent in the emitted manifest |
| a resolved target contains a `Tests` directory that no `exclude` covers | R2 — test sources would ship in the artifact |
| a target's sources are mixed-language | D-D cannot infer a single language |
| a target resolves to zero source files | almost certainly a wrong path |
| the product also declares `headerPattern` or `fileMapping` | D-F |

The plugin's `unsupportedTargetDeps` / `unresolvedTargets` diagnostics
(`manifests.js:65-70`, `:505`) are the model for the first two — but the plugin
*skips* the module, whereas the pipeline must **fail**. A skipped package in a build
pipeline is a silently missing artifact.

### D-H — Test targets are dropped

`parseDumpedManifest` filters `type === 'regular'` (`manifests.js:41`), which drops
`.testTarget` for free. Mode B does the same. This settles ledger open question Q2.

Mode A's unconditional `'**/Tests/**'` exclusion (`SPMGenerator.ts:60-62`) has no
Mode B equivalent, because SwiftPM's `exclude` takes paths, not globs. The checked-in
manifest must exclude its own test directory — which ledger F6 already validated for
`expo-clipboard` — and D-G's `Tests`-directory check enforces it.

## Files

| file | change |
|---|---|
| `tools/src/prebuilds/CheckedInManifest.ts` | new — dump, parse, resolve, diagnose |
| `tools/src/prebuilds/CheckedInManifest.test.ts` | new — see acceptance |
| `tools/src/prebuilds/SPMGenerator.ts` | branch the staging walk; extract exports-file generation so both modes call it |
| `tools/src/prebuilds/SPMPackage.ts` | branch `resolveSourceTarget`; no change to any settings builder |
| `tools/src/prebuilds/SPMConfig.types.ts` | **no change** — D-B adds no field |
| `tools/src/prebuilds/schemas/spm.config.schema.json` | **no change** — D-B adds no field |

## Acceptance criteria

Red/green applies. Tests are written and **seen failing** first. `tools/` has no
jest — it runs `node --test` over compiled output (`tools/package.json:23`), so
tests are `*.test.ts` compiled to `build/**/*.test.js`.

**A1 — Structural transform.** Given a fixture package with a checked-in
`Package.swift`, `CheckedInManifest.ts` produces a `ResolvedTarget[]` with: the
staging path `<TargetName>`, `sources` of `["src", "<Product>+Exports.swift"]`, each
`exclude` / `resources` / `publicHeadersPath` prefixed `src/`, and test targets
absent.

**A2 — Language inference.** Swift-only, ObjC-only, and C++-containing fixtures each
infer the type of D-D. A mixed-language fixture throws.

**A3 — Each D-G row throws**, with an error naming the product, the target, and what
to do about it. One test per row.

**A4 — Dependency merge.** A fixture whose manifest declares sibling target deps and
whose config declares `externalDependencies` produces the union, de-duplicated, in
the same order Mode A produces for the equivalent config.

**A5 — No collateral change. This is the gate that matters most.** Generate the
`Package.swift` for **every** product in the repo on `main`, then again with step 1
applied, and diff. Every file must be **byte-identical** — no pipeline package has a
root `Package.swift` during step 1, so any difference is a regression. Deliver this as a runnable script, not a
one-off; steps 3 through 9 each re-run it against the packages they did not touch
(ledger D3, collateral clause).

**A6 — An opted-in fixture builds.** A fixture package with `manifest` set produces a
manifest that `swift package describe` accepts and `swift build` compiles, including
a source file that relies on an import arriving from the generated exports file.
This is the in-repo form of the E1 experiment.

Build equivalence between modes for a **real** package is step 2's harness and step
3's pilot. It is explicitly **not** step 1's gate.

## Out of scope

- Adding `Package.swift` to any package.
- Removing `headerPattern` / `fileMapping` machinery — Mode A keeps it (R1: Mode A
  is permanent, F1).
- Anything touching `external-configs/` (F1).
- CocoaPods, `precompiled_modules.rb`, and the autolinking plugin. Untouched.

## Delegation notes

Owner: `astra-implementer`, xhigh. Spec is complete; the reviewable choices are
marked in D-F. Hand over A1-A4 as failing tests first, or make "write the failing
tests and show the failure" step one.

Do not let the implementer widen scope into the environment half. The architectural
claim above is the contract.
