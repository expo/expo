# Blind-review finding fixes

Worktree: `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests`.

All compilation used `/tmp/astra-manifests.caGM5D/run/build` and `/tmp/astra-manifests.caGM5D/run/.tsbuildinfo`. No shared build/cache, `pnpm build`, `pnpm test`, `et`, or git write commands were used. The scratch build has the requested read-only symlink to `apps/bare-expo/package.json`. `EXPO_ROOT_DIR` points to this worktree for the complete suite.

## 1. Normalization marker collision

Reserved raw marker rejection was chosen: `<EXPO_ROOT_DIR>` belongs to the comparison format, so accepting it in generator output makes normalization ambiguous. Reject it before substituting fixture roots.

Red: the injected after-run generator replaces every fixture-root occurrence with literal `<EXPO_ROOT_DIR>`. The real gate exited 0 before the fix; the regression failed with `a literal normalization marker must fail the gate` (actual status 0). Evidence: `/tmp/gate-manifests-red.log`.

Green: the same injected fault exits 1 with `contains reserved normalization marker <EXPO_ROOT_DIR>`. The normal gate compares 154 manifests / 77 products successfully. Evidence: `/tmp/gate-manifests-injected-fault.log`, `/tmp/gate-manifests-real.log`.

Changed: `tools/scripts/check-spm-manifest-collateral.cjs:212–215`; new `tools/scripts/check-spm-manifest-collateral.test.cjs:1–68,76–86`. The final injector persists corrupted content back to the emitted file before comparison.

## 2. Resource paths counted as sources

Red: `.target(name: "Main", path: "ios", resources: [.copy("Templates")])` with `ios/Value.swift` and `ios/Templates/template.c` failed with `it mixes Swift and C-family source files`. The same fixture with resource directory `Tests` failed with `its Tests directory contains source "Tests/template.c" that is not excluded and would ship in the artifact.`

Fix: add declared resource paths to the exclusion set used for both language inference and the uncovered-Tests scan; emitted structural excludes remain unchanged.

Green: both tests pass. Independently, real `swift package describe` lists only `Value.swift` as a source and `swift build` succeeds for the literal Templates fixture. Logs: `/tmp/astra-manifests.caGM5D/resource-fixture/{describe,build}.log`.

Changed: `tools/src/prebuilds/CheckedInManifest.ts:413–419`; `tools/src/prebuilds/CheckedInManifest.test.ts:749–762`.

## 3. Canonical in-repo eligibility

Red: (a) `packages/fixture` linked to `node_modules/third-party` returned true (`true !== false`); (b) an actual `ExternalPackage` with its workspace link resolving into `packages/fixture` produced Mode B output during both manifest and source generation (missing `sources: nil`, then `true !== false` for staged `Main/src`); (c) existing `PACKAGES/fixture/Package.swift` returned false (`false !== true`). All four tests failed.

Fix: realpath both package and packages directory; compare lowercase on Darwin; explicitly exclude `ExternalPackage` instances and paths through node_modules. Canonical location alone cannot identify an external package whose Node resolution lands inside the workspace.

Green: all four tests pass, including real external-package generation in both paths and the case-insensitive-filesystem regression.

Changed: `tools/src/prebuilds/CheckedInManifest.ts:7,54–68`; `tools/src/prebuilds/CheckedInManifest.test.ts:8–9,764–806`.

## 4. Escaping target path

Red: `.target(name: "Main", path: "../secret")` with a real sibling `secret/Value.swift` was accepted: `Missing expected rejection.`

Fix: validate the target's own path with the existing prefix/absolute-path escape guard before resolving its source directory. The diagnostic identifies the package-root boundary and its remediation.

Green: the same escape is rejected and the new test passes.

Changed: `tools/src/prebuilds/CheckedInManifest.ts:175–193,390–392`; `tools/src/prebuilds/CheckedInManifest.test.ts:808–813`.

For items 2–5, the focused original run was 9 tests / 0 pass / 9 fail, and the fixed run was 9 tests / 9 pass / 0 fail. Logs: `/tmp/astra-manifests.caGM5D/items-2-5-{red,green}.log`.

## 5. Vacuous remediation assertion

Red: new meta-regressions feed `rejectsManifest` an error with its remediation removed and an error whose quoted target is `Wrong` while `Main` remains in the diagnostic's source path. Both incorrectly passed the old helper, causing both meta-regressions to fail with `Missing expected rejection (AssertionError).`

Fix: require the exact product/quoted-target prefix, remove it before checking remediation, and require a final imperative sentence after the diagnostic sentence.

Green: both malformed-message regressions pass because the helper rejects them. Additionally, mutations of the compiled production diagnostic were rerun against `D-G path`: deleting `${how}` exits 1 (remediation regex mismatch), and replacing the quoted target with `Wrong` exits 1 (`Error must name target Main`). Logs: `/tmp/astra-manifests.caGM5D/item-5-{remediation,target}-mutation.log`; each is 1 test / 0 pass / 1 fail. Mutations were restored in scratch immediately afterward.

Changed: `tools/src/prebuilds/CheckedInManifest.test.ts:68–79,903–913`; production diagnostics were not changed for this item.

## 6. Failed-dump eviction and absolute paths

Red: removing the failed-dump eviction in scratch makes the unchanged-manifest retry fail with `Swift Package Manager could not read ... exited with non-zero code: 1` (1 test / 1 fail). Removing `path.isAbsolute(value)` accepts `publicHeadersPath: "/abs/x"`, causing `Missing expected rejection.`

Production behavior is already correct; only guard tests are required. The test wrapper fails the first actual Swift invocation, then delegates subsequent calls to the real Swift executable, without altering the manifest or its stamp.

Pending: three extra absolute-path tests authored in this session (sources, exclude, resources) are rejected by this Swift toolchain during dump-package before reaching the boundary under test. Their expected boundary-specific diagnostic is therefore wrong. Per the instruction to stop when a test looks wrong, asked permission to remove those three additional cases and retain the publicHeadersPath guard. No pre-existing test was weakened.

Evidence: `/tmp/astra-manifests.caGM5D/item-6-{absolute,discard}-red.log`. Both valid guard tests pass with mutations restored (together with the two item-7 tests: 4 tests / 4 pass / 0 fail, `/tmp/astra-manifests.caGM5D/items-6-7-guards-green.log`).

Changed: `tools/src/prebuilds/CheckedInManifest.test.ts:815–859`; no production memo or absolute-path behavior changed.

## 7. Mode A exports and failed-dump staging coverage

Red mutations of scratch output:

- No-op `generateExportsFile`: missing `Main/Fixture+Exports.swift` (`ENOENT`), 1 test / 1 fail.
- Empty default `internalTargetNames`: output lacks `@_exported import Helper`, 1 test / 1 fail.
- Failed dump left in memo: second staging call repeats the rejected dump, 1 test / 1 fail.

New tests exercise Mode A staging with framework and internal dependency exports, reject external dependency exports, and exercise transient dump failure/retry followed by a Mode A run that must not invoke Swift again. No production generator or memo behavior needed changing.

Logs: `/tmp/astra-manifests.caGM5D/item-7-{noop,empty-internal,discard}-red.log`. Both new tests pass with the mutations restored.

Changed: `tools/src/prebuilds/CheckedInManifest.test.ts:829–845,861–901` (staging tests and shared transient-Swift-failure fixture helper). `SPMGenerator.ts` and `SPMPackage.ts` were not edited in this session.

## 8. Production output depth

Red: extra flavor segment in `generated/<product>/<flavor>/Package.swift` fails the production-depth regression. The runtime red run observed `generated/ExpoAgeRange/Debug/Package.swift` and failed with `generated manifest must use the production generated/<product>/Package.swift path`. Evidence: `/tmp/gate-manifests-production-runtime-red.log`.

Fix: generate at `generated/<product>/Package.swift`. Remove the scratch output after snapshotting each flavor so Debug and Release both start absent at the same production path.

Green: production-depth regression and 154-manifest collateral comparison pass.

Changed: `tools/scripts/check-spm-manifest-collateral.cjs:194–199,217`; new `tools/scripts/check-spm-manifest-collateral.test.cjs:1–74`.

## Final validation and scope

Full scratch-suite run: **587 tests / 581 pass / 3 fail / 3 skipped**, 139 suites. The only failures are the three newly authored extra absolute-path cases discussed in item 6; the requested decision is pending. Log: `/tmp/astra-manifests.caGM5D/full-suite-initial.log`.

Commands from worktree `tools/`:

```sh
node_modules/.bin/tsc --outDir /tmp/astra-manifests.caGM5D/run/build --tsBuildInfoFile /tmp/astra-manifests.caGM5D/run/.tsbuildinfo
EXPO_ROOT_DIR=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests NODE_PATH=$PWD/node_modules node --test '/tmp/astra-manifests.caGM5D/run/build/**/*.test.js'
node_modules/.bin/tsc --noEmit --tsBuildInfoFile /tmp/astra-manifests.caGM5D/run/.typecheck.tsbuildinfo
```

Compilation and separate isolated no-emit typecheck both exit 0. Standalone gate integration regressions: **2 tests / 2 pass / 0 fail**, run separately because the `.cjs` tests are outside the TypeScript scratch-build glob. Uninstrumented gate: **154 byte-identical manifests / 77 products**, baseline `466da8e06a1`; injected marker gate: **exit 1**.

Focused read-only reviewer found no other implementation issues, but flagged a case-sensitive macOS caveat: unconditional Darwin lowercase comparison treats distinct `PACKAGES` and `packages` directories alike on case-sensitive APFS, and the new Darwin case test assumes a case-insensitive volume. This session follows the explicit requested “case-insensitive comparison on darwin”; changing that platform rule would exceed the specified fix, so this caveat is reported and left unchanged. The current filesystem is case-insensitive and the literal uppercase-path test passed.

Focused TypeScript-file lint passes. Full `tools/` lint fails only on an unrelated existing/concurrent warning: `tools/src/commands/PrebuildEquivalence.ts:12`, unused `InspectedArtifact` (`@typescript-eslint/no-unused-vars`). Left untouched.

Extra implementation/test file: `tools/scripts/check-spm-manifest-collateral.test.cjs`, necessary to exercise the standalone gate. The other additional file is this requested report. No package, CocoaPods, autolinking, external-config, or environment-generation edits. No TypeScript `any` added. No package migration performed. All fault injection was confined to scratch artifacts or child processes.


## Outstanding decision

Item 6 is paused only for the three extra, newly authored absolute sources/exclude/resources test cases. Their failure is a test-design error: Swift rejects those manifest values before the resolver guard can run. The requested publicHeadersPath and memo-eviction regressions both have meaningful mutation-red and restored-green evidence. Asked the user whether to remove the three extras or retain them using a controlled dump fixture; no answer has arrived. They remain unchanged pending that answer, so the full suite is not yet green. This explicitly follows the request to stop on an item when a test looks wrong. No pre-existing expectation was weakened.
