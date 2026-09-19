# Step 1 — Mode B report

Implemented in the requested worktree, without commits. No real package was migrated. The environment builders remain unchanged. Explicit limitations are listed below.

## Files

- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — reads SwiftPM dump JSON; resolves structure, languages, dependencies and diagnostics.
- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.test.ts` — 41 Mode B tests, with generated temporary fixtures and real Swift/C builds.
- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMPackage.ts` — selects Mode B; replaces structural fields and product membership while retaining resolved environment settings and dependency references.
- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMGenerator.ts` — stages target directories through `src` symlinks; shares exports-file generation between modes.
- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/scripts/check-spm-manifest-collateral.cjs` — executable baseline/current inventory and manifest byte-comparison gate, supporting explicit exclusions for later migrations.
- `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/.claude/astra-report-step1.md` — this report.

## Red run — before implementation

The worktree initially lacked dependencies (`expo-build: command not found`). Local ignored links reused installed dependencies; this setup failure was not counted as red evidence. All commands used this worktree, with `EXPO_ROOT_DIR` pinned where repository discovery applied.

Actual first full command, from the worktree root:

```sh
EXPO_ROOT_DIR=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests pnpm --dir tools build && EXPO_ROOT_DIR=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests node --test 'tools/build/**/*.test.js'
```

It collected **464 tests**, with **432 passed, 28 failed, 4 cancelled**: 25 new Mode B failures plus existing tests blocked by initially missing app dependency links. Those links were subsequently supplied.

Focused red command, from `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools`, before `CheckedInManifest.ts` existed:

```sh
EXPO_ROOT_DIR=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests node --test build/prebuilds/CheckedInManifest.test.js
```

Verbatim failure output, trimmed to test names and assertions:

```text
not ok 1 - A1 transforms manifest layout and drops test targets
  error: 'Mode B resolver must exist'
not ok 2 - A2 infers swift from .swift sources rather than config
  error: 'Mode B resolver must exist'
not ok 3 - A2 infers objc from .m sources rather than config
  error: 'Mode B resolver must exist'
not ok 4 - A2 infers objc from .c sources rather than config
  error: 'Mode B resolver must exist'
not ok 5 - A2 infers cpp from .cpp sources rather than config
  error: 'Mode B resolver must exist'
not ok 6 - A2 infers cpp from .cc sources rather than config
  error: 'Mode B resolver must exist'
not ok 7 - A2 infers cpp from .cxx sources rather than config
  error: 'Mode B resolver must exist'
not ok 8 - A2 infers cpp from .mm sources rather than config
  error: 'Mode B resolver must exist'
not ok 9 - A2 applies explicit sources and excludes before inferring language
  error: 'Mode B resolver must exist'
not ok 10 - A1 resolves SwiftPM default target paths
  error: 'Mode B resolver must exist'
not ok 11 - D-G path: rejects a target without a real source directory
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 12 - D-G non-regular dependency: rejects a dependency on a binary target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 13 - D-G non-regular dependency: rejects a dependency on a system target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 14 - D-G non-regular dependency: rejects a dependency on a macro target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 15 - D-G non-regular dependency: rejects a dependency on a plugin target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 16 - D-G URL dependency: rejects manifest-owned external packages
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 17 - D-G product dependency: rejects .product instead of silently dropping it
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 18 - D-G unsupported target: rejects a declared macro target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 19 - D-G unsupported target: rejects a declared system-library target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 20 - D-G Tests directory: rejects uncovered nested test sources
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 21 - D-G mixed language: rejects Swift and C-family sources in one target
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 22 - D-G zero sources: rejects an empty resolved source set
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 23 - D-G config layout: rejects headerPattern
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 24 - D-G config layout: rejects fileMapping
  error: |-
    The input did not match the regular expression /Fixture/. Input:
    
    'Mode B resolver must exist'
    
not ok 25 - A4 merges sibling and external dependencies in equivalent Mode A order without duplicates
  error: 'Mode B resolver must exist'
# tests 25
# suites 0
# pass 0
# fail 25
# cancelled 0
# skipped 0
# todo 0
# duration_ms 68.533
```

Full original logs: `/private/tmp/expo-step1-red.log` and `/private/tmp/expo-step1-red-focused.log`. The initial test-only dynamic import/sentinel allowed compilation before the module existed; it was replaced with a normal import after implementation. All behavioral assertions remain.

Review regressions were also observed red before fixes: six source regressions (`/private/tmp/expo-step1-review-red.log`, **6 failures/6 tests**), the transitive-target external dependency assertion (**1/1**), module-map rejection (**1/1**), empty forbidden config declarations (**2/2**), and conditional dependency rejection (**1/1**). Each now passes. The independent reviewer verified all seven reported findings were resolved.

## Green run

From `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools`:

```sh
export EXPO_ROOT_DIR=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests
pnpm build && node --test 'build/**/*.test.js'
```

Verbatim final suite summary:

```text
# tests 508
# suites 127
# pass 505
# fail 0
# cancelled 0
# skipped 3
# todo 0
# duration_ms 27706.911083
```

This is **508 collected tests, 505 passed, 3 skipped, zero failed**, including **41 Mode B tests**. Three existing Hermes tests skip because the installed React Native version has a single Hermes version key. The full-suite count also includes the other session's Step 2 tests that were present at compilation. Full output: `/private/tmp/expo-step1-green-all.log`; build output: `/private/tmp/expo-step1-build-final.log`.

`pnpm build`, `pnpm tsc --noEmit`, `pnpm lint --max-warnings 0`, and `git diff --check` all passed. Final typecheck and lint logs are `/private/tmp/expo-step1-typecheck-final.log` and `/private/tmp/expo-step1-lint-final.log`. Concurrent Step 2 test-first changes temporarily blocked typechecking, but the final full typecheck passed. A temporary isolated validation snapshot was removed; the green run above used the actual `tools/` directory.

## A5 — collateral gate

Script: `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/scripts/check-spm-manifest-collateral.cjs`

```sh
node tools/scripts/check-spm-manifest-collateral.cjs
# Later migrations: --base <ref> --exclude <npm-package>/<product> (repeatable)
```

Verbatim result:

```text
before: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
after: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
PASS: 154 byte-identical manifests across 77 products (Debug + Release), baseline 466da8e06a1.
```

The gate independently transpiles generator sources from git revision `466da8e06a1` and the working tree. Both receive identical configs, real source/resource directories and temporary artifact metadata; this is a manifest comparison, not an XCFramework build. No products are implicitly skipped, including external, source-only and custom-build products. Baseline/current inventories must match after explicit exclusions. Fault-injecting removal of `expo-haptics/ExpoHaptics` failed the inventory assertion (exit 1), proving removal cannot disappear from both snapshots.

Eight environment/rendering functions were compared directly against the baseline and were byte-identical: `buildSwiftSettings`, `buildCSettings`, `collectHeaderMapFlags`, `generatePackageSwiftContent`, `getExternalDependencyConfig`, `substituteCompilerFlagVariables`, `resolveCompilerFlags`, and `getExpoModulesMacroPluginFlags`.

## A6 — actual SwiftPM builds

**Accepted and compiled.** The test invokes `swift package describe` and `swift build` against the emitted manifest, with temporary cache/build directories and `--disable-sandbox`. `UsesExports.swift` has no import of its own, returns `Date`, and uses the sibling target's symbol. Generated exports import both Foundation and Helper. Invalid Swift under excluded `Tests` is absent from the described sources. The test verifies the `src` directory symlink, exact `sources: ["src", "Fixture+Exports.swift"]`, product membership, and unchanged original sources. A separate C fixture describes/builds with implicit public headers remapped to `src/include`.

Verbatim test records:

```text
# Subtest: A6 stages real directories and compiles a source relying on generated exports
ok 63 - A6 stages real directories and compiles a source relying on generated exports
  ---
  duration_ms: 6274.95025
  type: 'test'
  ...
# Subtest: prefixes implicit C public headers and builds through the source symlink
ok 68 - prefixes implicit C public headers and builds through the source symlink
  ---
  duration_ms: 3804.716625
  type: 'test'
  ...
```

## D-G coverage

All tests are in `CheckedInManifest.test.ts` above.

| D-G condition | Test |
|---|---|
| Unresolvable target path | `D-G path: rejects a target without a real source directory` |
| Dependency on a declared non-regular target | `D-G non-regular dependency: rejects a dependency on a … target` — separate binary, system, macro and plugin cases |
| Manifest `.package(url:)` | `D-G URL dependency: rejects manifest-owned external packages` |
| Target `.product(name:package:)` | `D-G product dependency: rejects .product instead of silently dropping it` |
| Declared macro/system-library target | `D-G unsupported target: rejects a declared … target` — separate macro/system-library cases |
| Unexcluded `Tests` directory | `D-G Tests directory: rejects uncovered nested test sources`; also explicit-source and covered-ancestor cases |
| Mixed source languages | `D-G mixed language: rejects Swift and C-family sources in one target` |
| Zero resolved sources | `D-G zero sources: rejects an empty resolved source set`; also explicit empty `sources` |
| Config `headerPattern` / `fileMapping` | `D-G config layout: rejects …` — both fields, including empty declarations |

## Limitations / departures from the written spec

- **D-F `moduleMapContent` cannot be retained under all stated boundaries.** SwiftPM discovers it beneath `publicHeadersPath`; generating it there would write through the real-source symlink, changing that path would replace manifest-owned layout, and injecting flags would cross the environment boundary. Mode B throws an actionable error instead. Mode A remains unchanged.
- **Localized resources/default localization and resource rules outside `.copy`/`.process` are rejected.** The existing `ResolvedTarget` resource representation and fixed generated manifest cannot preserve them. No localization information is silently dropped.
- **Conditional sibling dependencies are rejected.** Existing resolved dependencies represent strings or external product references, not platform conditions. Flattening a condition would widen the dependency. The diagnostic tells the caller to remove it only if valid on every platform or retain Mode A.
- **A6's “manifest set” wording is stale.** The fixture opts in through a root `Package.swift`, following D-B; no config field was added.

## Deliberately out of scope

No package migrations, real-package `Package.swift` additions, schema/config additions, changes under `packages/expo/scripts/spm/`, external-config edits, CocoaPods/autolinking work, or build-equivalence harness work. The post-#50329 plugin was read with `git show` only. No checkout, merge, stash, commit or push was performed.

The separate session's `equivalence/`, `PrebuildEquivalence.ts`, and `SwiftInterfaceChecks.ts` work was preserved and is not part of this implementation.
