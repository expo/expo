# Step 1 — round 2

All seven blockers and S1–S7 addressed. Changes remain uncommitted. No real package migration, schema/config change, settings-builder change, or change to the other agent’s files. `moduleMapContent` rejection is retained.

## Commands and isolation

Commands below use these absolute paths:

```sh
ROOT=/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests
SCRATCH=/tmp/claude-501/-Users-chrfalch-repos-expo-expo/7592229e-2d96-40dd-a90c-978caa316489/scratchpad/r2build
export EXPO_ROOT_DIR="$ROOT"
```

Compilation ran from `$ROOT/tools`, exclusively into scratch:

```sh
node_modules/.bin/tsc --outDir "$SCRATCH/build" --tsBuildInfoFile "$SCRATCH/.tsbuildinfo"
```

Scratch has a `node_modules` link to `$ROOT/tools/node_modules`. An existing `Utils.ts` read uses `__dirname/../../../apps/bare-expo/package.json` regardless of `EXPO_ROOT_DIR`; the initial full run therefore collected 561 tests but failed that Hermes test with ENOENT. A read-only link at `$SCRATCH/../apps/bare-expo/package.json` supplies the existing worktree file. No production/test source was changed for this layout issue. No `pnpm build`, `pnpm test`, or `et` ran.

## RED evidence per blocker

A1, A3, A6 and the should-fix regressions were added before implementation and run with:

```sh
node --test --test-name-pattern='R2 ' "$SCRATCH/build/prebuilds/CheckedInManifest.test.js" > "$SCRATCH/red-blockers-and-should.log" 2>&1
```

This run collected **13 tests, 13 failed**. A2’s first fixture failed during `describe` for an unrelated reason; that failure is **not** counted as A2 evidence. Its corrected, valid fixture was run separately before the fix, as recorded below. Earlier Swift cache-permission setup failures likewise are not red evidence.

### A1 — unknown dependency silently dropped

Literal `.target(name: "Main", dependencies: ["Ghost"], path: "ios")` fixture; command above.

```text
not ok 1 - R2 A1 rejects an undeclared Ghost dependency instead of silently dropping it
  error: 'Missing expected rejection.'
```

The resolver returned successfully; the new rejection assertion failed. No missing-symbol sentinel.

### A2 — legal plugin application silently dropped

Literal `plugins: [.plugin(name: "Generate")]` plus `.plugin(name: "Generate", capability: .buildTool(), path: "plugin")`. The test first runs real `swift package describe` successfully, then expects the resolver to reject the plugin edge. Its Swift library source is `Value.swift` to avoid SwiftPM treating `Main.swift` as an executable entry point.

```sh
node --test --test-name-pattern='R2 A2' "$SCRATCH/build/prebuilds/CheckedInManifest.test.js" > "$SCRATCH/red-A2.log" 2>&1
```

```text
not ok 1 - R2 A2 rejects a legal build-tool plugin application
  error: 'Missing expected rejection.'
# tests 1
# pass 0
# fail 1
```

### A3 — missing environment-owned binary declaration

Fixture has a root manifest containing only Main, an existing `Vendor.xcframework`, and config Main → Vendor plus the framework target. Same fixture is generated in Mode A, then Mode B. Command is the shared R2 run above.

```text
not ok 3 - R2 A3 preserves the environment-owned vendored binary target in Mode B
  Expected values to be strictly equal:
  + undefined
  - '.binaryTarget(\n' +
  -   '            name: "Vendor",\n' +
  -   '            path: "../../../Vendor.xcframework"\n' +
  -   '        )'
```

Mode B still emitted `dependencies: ["Vendor"]`; the assertion specifically detected its absent declaration.

### A4 — silent no-write false green

Isolated copy `/tmp/expo-collateral-a4-old` retains the original gate and the injected early return in its current `SPMPackage.writePackageSwiftAsync`:

```ts
if (pkg.packageName === 'expo-json-utils') return;
```

Executed from that isolated copy (live worktree files were not injected):

```sh
node -e "const assert=require('node:assert/strict');const{spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,['tools/scripts/check-spm-manifest-collateral.cjs'],{cwd:process.cwd(),encoding:'utf8'});process.stdout.write(r.stdout);process.stderr.write(r.stderr);assert.notEqual(r.status,0,'A4 silent no-write must fail the collateral gate')" > /tmp/expo-spm-a4-old-red-assertion.log 2>&1
```

```text
PASS: 154 byte-identical manifests across 77 products (Debug + Release), baseline 466da8e06a1.
AssertionError [ERR_ASSERTION]: A4 silent no-write must fail the collateral gate
  actual: 0, expected: 0, operator: 'notStrictEqual'
```

One explicit exit-status assertion failed because the broken generator passed the old gate with 154 comparisons.

### A5 — baseline using current package inputs

Isolated copy `/tmp/expo-collateral-a5-old` retains the original gate and `packages/expo-modules-core/package.json` version `999.0.0-a5-probe`. Executed from that copy:

```sh
node -e "const assert=require('node:assert/strict');const{spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,['tools/scripts/check-spm-manifest-collateral.cjs'],{cwd:process.cwd(),encoding:'utf8'});process.stdout.write(r.stdout);process.stderr.write(r.stderr);assert.notEqual(r.status,0,'A5 package version change must fail the collateral gate')" > /tmp/expo-spm-a5-old-red-assertion.log 2>&1
```

```text
PASS: 154 byte-identical manifests across 77 products (Debug + Release), baseline 466da8e06a1.
AssertionError [ERR_ASSERTION]: A5 package version change must fail the collateral gate
  actual: 0, expected: 0, operator: 'notStrictEqual'
```

One explicit exit-status assertion failed: both old workers had read the injected current version.

### A6 — external root manifest activates Mode B

Fixture sources moved under a temporary repo’s `node_modules/react-native-screens`, retaining root Package.swift. Both call sites exercised separately; command is the shared R2 run.

```text
not ok 4 - R2 A6 keeps third-party root manifests in Mode A during manifest generation
  The input did not match the regular expression /sources: nil/.
  actual: ... sources: ["src", "Fixture+Exports.swift"], ...
not ok 5 - R2 A6 keeps third-party root manifests in Mode A during sources generation
  Expected values to be strictly equal:
  true !== false
```

The second assertion found an unwanted Mode B `Main/src` symlink. Both operations had succeeded instead of retaining Mode A.

### A7 — vacuous URL-dependency assertion

`$SCRATCH/wrong-diagnostic.cjs` replaces the compiled resolver export with an unrelated manifest-loading rejection containing the expected product/target and remediation. `$SCRATCH/assert-diagnostic.cjs` executes the URL-dependency test with that preload and asserts its exit must be nonzero; it also asserts exactly one inner test was collected.

```sh
node --test "$SCRATCH/assert-diagnostic.cjs" > "$SCRATCH/red-A7.log" 2>&1
```

```text
# ok 1 - D-G URL dependency: rejects manifest-owned external packages
# # tests 1
# # pass 1
not ok 1 - R2 A7 rejects an unrelated manifest-loading error as URL-dependency evidence
  error: 'D-G URL assertion accepted an unrelated manifest-loading diagnostic'
  actual: 0, expected: 0, operator: 'notStrictEqual'
# tests 1
# pass 0
# fail 1
```

Audited every D-G regex, including path, all four non-regular kinds, URL/product, macro/system declarations, Tests coverage, mixed language, both zero-source cases, and both populated/empty layout fields. Each now matches its specific diagnostic clause, rather than generic words found in a loader error. Localization, conditional dependencies and module-map assertions were tightened too.

The same probe after the fix (`$SCRATCH/green-A7.log`) passes **1/1 outer tests**: its inner URL test now fails specifically at the unique external-dependency regex when given `Swift Package Manager could not read Package.swift`.

## GREEN

Final full test command, from `$ROOT/tools`:

```sh
EXPO_ROOT_DIR="$ROOT" node --test "$SCRATCH/build/**/*.test.js" > "$SCRATCH/green-all-final.log" 2>&1
```

```text
# tests 561
# suites 136
# pass 558
# fail 0
# cancelled 0
# skipped 3
# todo 0
```

**561 collected, 558 passed, 3 existing Hermes skips, zero failed.** Includes **56 Mode B tests**, real Swift and C `swift package describe` / `swift build`, and the other agent’s tests present at compilation. The earlier focused run was **54/54**, before adding two further checks for allowed external/SPM names and scoped in-repo packages.

Additional required checks passed:

```sh
node_modules/.bin/tsc --noEmit --tsBuildInfoFile "$SCRATCH/typecheck.tsbuildinfo"
pnpm lint --max-warnings 0
git -c core.fsmonitor=false diff --check
node --check tools/scripts/check-spm-manifest-collateral.cjs
```

Compile/typecheck/lint logs: `$SCRATCH/build-final.log`, `$SCRATCH/typecheck.log`, `$SCRATCH/lint.log`. Lint reports the existing node_modules/lockfile notice, with zero ESLint warnings/errors.

## Re-run collateral gate and BOTH fault shapes

From `$ROOT`:

```sh
node tools/scripts/check-spm-manifest-collateral.cjs
```

`/tmp/expo-spm-collateral-green-final.log`:

```text
before: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
after: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
PASS: 154 byte-identical manifests across 77 products (Debug + Release), baseline 466da8e06a1.
```

The only normalization replaces each worker’s exact temporary repository prefix with `<EXPO_ROOT_DIR>`. Package versions, paths beneath the repo root, ordering, settings and all remaining bytes stay significant. Baseline package inputs now come from `git archive 466da8e06a1 packages`; current tracked/untracked, nonignored package inputs are copied separately. Installed third-party dependencies and artifact metadata remain shared test inputs.

Faults were re-injected one at a time in `/tmp/expo-collateral-fixed-clone`, restoring the preceding input before the next. Every command below was executed there, substituting the named absolute log path:

```sh
node tools/scripts/check-spm-manifest-collateral.cjs > LOG 2>&1
gate_status=$?
test $gate_status -ne 0
```

1. **Inventory removal:** set isolated `expo-haptics` config `products: []`. Exit 1, `/tmp/expo-spm-inventory-fixed-failure.log`:

   ```text
   AssertionError [ERR_ASSERTION]: Product inventory changed; explicitly exclude intentional additions/removals
   -   'expo-haptics/ExpoHaptics',
   ```

2. **Silent no-write:** early return for `pkg.packageName === 'expo-json-utils'`. Exit 1, `/tmp/expo-spm-a4-fixed-failure.log`:

   ```text
   AssertionError [ERR_ASSERTION]: expo-json-utils/EXJSONUtils/Debug did not write Package.swift
   Error: after generator failed (exit 1)
   ```

3. **Release-only no-write:** same return restricted to `buildType === 'Release'`. Exit 1, `/tmp/expo-spm-release-no-write-fixed-failure.log`:

   ```text
   AssertionError [ERR_ASSERTION]: expo-json-utils/EXJSONUtils/Release did not write Package.swift
   Error: after generator failed (exit 1)
   ```

4. **Baseline-input probe:** isolated core version `999.0.0-a5-probe`. Exit 1, `/tmp/expo-spm-a5-fixed-failure.log`:

   ```text
   before: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
   after: Generated 154 manifests for 77 products (74 configs; 0 explicit exclusions).
   DIFF: expo-modules-core/ExpoModulesCore/Debug
   DIFF: expo-modules-core/ExpoModulesCore/Release
   AssertionError [ERR_ASSERTION]: Collateral manifest changes
   2 !== 0
   ```

Gate regression protection is in the executable gate itself: independent snapshots, independent per-product/per-flavor outputs, absent-before / exists-after / nonempty assertions, inventory/coverage checks. Fault-injection copies/logs are scratch artifacts; no production injection remains.

## Changes per fix (absolute paths)

- **A1:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — reject unknown dependency names; retain permitted external/SPM by-name references.
- **A2:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — inspect SwiftPM `pluginUsages` and reject plugin applications explicitly.
- **A3:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMPackage.ts` — restore the unconditional existing vendored-framework loop; no environment logic rewritten.
- **A4:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/scripts/check-spm-manifest-collateral.cjs` — distinct worker/flavor outputs and fresh, nonempty output assertions.
- **A5:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/scripts/check-spm-manifest-collateral.cjs` — archive baseline packages and copy current inputs separately, then normalize only temporary root prefixes.
- **A6:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts`, `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMPackage.ts`, `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMGenerator.ts` — shared package-root presence check restricted to repo workspace package paths; the gate likewise exempts external configs from migration detection.
- **A7:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.test.ts` — every D-G rejection checks its distinct diagnostic clause.
- **S1:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — preserve `publicHeaders: false` when supplying checked-in structural fields.
- **S2:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — reject absolute/escaping prefixed source, exclusion, resource and header paths; all four `../other` cases tested.
- **S3:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMPackage.ts` — Swift-escape Mode B structural paths (quotes, backslashes, control characters); real dump-package accepts the emitted `a"b.swift` fixture.
- **S4:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMGenerator.ts` — prune target staging entries other than `src` and required generated exports; cover A→B and removal of stale exports without changing real sources.
- **S5:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.test.ts` — existing three acceptance tests exercised under an inverted presence-switch mutation in scratch; evidence below.
- **S6:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/SPMPackage.ts` — one comment explains the absolute manifest root passed into unchanged include resolution and deliberate bypass of config-relative/`.build` paths.
- **S7:** `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.ts` — memoize the dump promise per package root; invalidate on manifest stat changes and discard failed dumps; still resolve source files and product settings afresh.

The regression tests for these changes are all in `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests/tools/src/prebuilds/CheckedInManifest.test.ts`. S7’s wrapper observed three Swift invocations before the fix versus one after, with another invocation after a manifest edit.

## S5 — three previously missing RED runs

Before fixing the presence logic, `$SCRATCH/red-s5.cjs` temporarily inverted both presence checks in **compiled scratch files only**, ran the three tests, asserted exactly three collected/failed tests, and restored those files in `finally`.

```sh
node "$SCRATCH/red-s5.cjs" > "$SCRATCH/red-S5.log" 2>&1
# Inner command:
node --test --test-name-pattern='A6 stages real|D-F1 keeps|D-B checks' "$SCRATCH/build/prebuilds/CheckedInManifest.test.js"
```

```text
not ok 1 - A6 stages real directories and compiles a source relying on generated exports
  error: "ENOENT: no such file or directory, lstat '.../generated/Fixture/Main/src'"
not ok 2 - D-F1 keeps config settings and platforms while replacing structure and membership
  The input was expected to not match /v13|AppKit|StaleConfigTarget|Unused/.
  actual: ... targets: ["Main", "StaleConfigTarget"] ...
not ok 3 - D-B checks only the package-root manifest
  error: 'Cannot use the checked-in Package.swift for product "Fixture", target "Main": Swift Package Manager could not read .../packages/fixture/Package.swift ...'
# tests 3
# pass 0
# fail 3
```

These demonstrate missing real-directory staging, stale config structure leaking through, and erroneous root-manifest loading when only `apple/Package.swift` exists. All three pass in the final full run.

## Disagreements / limits

No disagreement with the requested fixes. `publicHeaders: false` retains the existing pipeline’s omission behavior; no broader SwiftPM module-generation semantics were changed. Installed third-party node_modules are shared inputs to the collateral comparison, while all in-repo package inputs are revision-specific. The gate remains a manifest collateral check; it does not build XCFrameworks. The settled localization, conditional-dependency and moduleMapContent policies were not reopened.

Focused independent round-two review completed with **no material findings**. The reviewer inspected the fixes and regression coverage without rerunning successful checks or reopening the previously verified environment half.
