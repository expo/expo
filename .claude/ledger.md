# Task ledger — expo-swift-manifests

Read this first in every fresh session. Update it at every pipeline boundary.
Facts, not narrative. Keep under ~4k tokens.

## Goal
Convert first-party Expo packages, one at a time, from "layout + manifest generated at
build time from `spm.config.json`" to "layout + `Package.swift` checked into git", so the
per-package config shrinks to the pipeline-only fields that have no manifest equivalent.
Done looks like: every first-party package with an `ios/` tree ships a `Package.swift`;
`et prebuild` derives target structure from it; the emitted build manifest is unchanged;
CocoaPods and the SwiftPM autolinking plugin both still work.

**Status: ANALYSIS COMPLETE, PLAN PROPOSED, NOT APPROVED.** No code written.

## Linear
- **ENG-26918** — this task, carries the full analysis (the durable copy; this ledger holds
  only the plan). https://linear.app/expo/issue/ENG-26918
  Parent ENG-24314 · project SDK 58 (`b480b3a5-def3-4e9a-808f-e5376999d52a`) · Backlog.
- Related: ENG-22650 (`expo`, merged #45906) · ENG-22651 (`expo-modules-core`, tsapeta,
  draft #45907 stale since 2026-05-18).

## Location
- worktree: `/Users/chrfalch/repos/expo/expo/.claude/worktrees/expo-swift-manifests`
- branch: `chrfalch/expo-swift-manifests`
- base: `main` @ `466da8e06a1`
- 2 WIP commits, PUSHED to origin 2026-09-19: `96945f98863` (source) + `cea69733b28`
  (session state — DROP BEFORE PR). See the final Next step section.

## Findings that constrain the plan (verified, do not re-derive)

**F1 — The premise needs correcting. `spm.config.json` cannot be retired.** Seven
configs under `packages/expo-modules-autolinking/external-configs/ios/` describe
third-party sources (skia, reanimated, screens, svg, worklets, safe-area-context,
async-storage) that resolve inside the *consumer's* `node_modules`. There is nowhere
to check in a manifest. The dual path is permanent.

**F2 — A checked-in manifest can only carry structure.** The generated manifest holds
absolute `/Users/...` paths, RN + Hermes version strings baked into `.binaryTarget(path:)`,
and per-flavor flags (`SPMPackage.ts:1104-1106, 1381-1392, 1404-1420`). SwiftPM has no
conditional form for `binaryTarget` paths. So the pipeline must KEEP generating its own
manifest; the checked-in one becomes its structural INPUT, not its output. This is exactly
what `packages/expo-constants/Package.swift` already does (`dependencies: []`, deps
injected by the plugin).

**F3 — `swift package dump-package` reads a checked-in manifest as JSON.** Verified
exit 0 on `packages/expo-constants`. No Swift text parsing is needed, so
[[feedback_no_ruby_parsing_of_podspecs]] does not apply to this design.

**F4 — Residual config after conversion** (fields with no Package.swift equivalent):
`podName`, `codegenName`, `publishPrebuilds`, `sourceOnly`, `customBuild`, `autolinkWhen`,
`textualHeaders`, `excludeFromUmbrella`, `externalDependencies`, and the `${VAR}`-substituted
and per-flavor `compilerFlags`. Several are read by
`expo-modules-autolinking/scripts/ios/precompiled_modules.rb:1675-1710` at `pod install`,
not by the pipeline. Small, not empty.

**F5 — `headerPattern` / `fileMapping` disappear on conversion.** They exist only to stage
headers into `include/<Module>/` at generation time (`SPMGenerator.ts:270-285`). A real
checked-in layout deletes that machinery. Only `expo-modules-core` uses `fileMapping`.

**F6 — Tier A needs NO file moves. Proven by experiment, not assumed.** `swift package
describe` validated three shapes with `path: "ios"` pointing straight at the existing flat
directory: plain (expo-haptics), with `exclude: ["Tests"]` (expo-clipboard), and with
`resources: [.copy("PrivacyInfo.xcprivacy")]` (expo-device). The sibling `.podspec` inside
the target directory is ignored, no warning. Neither existing precedent uses `path: "ios"`,
so this had to be tested. Trial files were deleted.

**F7 — Podspec globs mostly survive.** ~54 podspecs use recursive `**/*.{h,m,swift}`;
`packages/expo`'s restructure needed no podspec edit. One package breaks on ANY split:
`packages/expo-observe/ios/ExpoObserve.podspec:35` uses non-recursive `*.{h,m,mm,swift}`.
Eleven further sites break on a *renamed* subdirectory.

**F8 — Real per-package cost, from the merged precedent.** `packages/expo` (#45906,
`eab441463b5`): 38 files, +36/−1, of which 34 are pure renames, plus a 33-line Package.swift
— then a SEPARATE follow-up PR (#49832, `10e29ef9523`, 10 files +49/−2) carrying three
distinct fixes. `expo-constants` (#49820): 7 files +35, plus one follow-up. Budget one main
PR plus one follow-up per package that moves files.

**F10 — The Mode B layout is verified, not assumed (2026-09-18).** `swift package
describe` AND `swift build` on a scratch package prove all four: SwiftPM recurses
through a directory symlink named in a target's `path`/`sources`; a generated file
placed BESIDE the symlink joins the same module; `exclude: ["src/Tests"]` is honoured
through the symlink (a deliberately invalid file was not compiled); and a source file
using `Date()` with no `import Foundation` of its own compiled, because an
`@_exported import Foundation` in the generated sibling reached it across the symlink.

**F11 — `<Product>+Exports.swift` cannot be dropped.** `SPMGenerator.ts:303-340`
emits `@_exported import` for every `linkedFrameworks` entry; every Tier A config
declares `["Foundation", "UIKit"]`. Dropping it breaks every file that free-rides on
those imports — the class `466da8e06a1` was fixing — and changes the `.swiftinterface`
that the D3 gate compares. It cannot be written into the repo tree, which is why the
design uses a per-target staging dir with a `src` symlink, not the plugin's single
package-level `root` symlink.

**F12 — WITHDRAWN, was WRONG (corrected by USER 2026-09-18).** It claimed a presence-based
switch would flip four packages unmigrated. Verified false: `expo`, `expo-constants` and
`@expo/log-box` have **no `spm.config.json`**, so the prebuild pipeline never sees them;
`expo-modules-jsi` keeps its manifest at `apple/Package.swift`, which a root check misses.
A root presence check flips **zero** packages today. Superseded by D-B.

**F12b — `spm.config.json` has no manifest field today.** Product properties are exactly:
`codegenName`, `customBuild`, `excludeFromUmbrella`, `externalDependencies`, `name`,
`platforms`, `podName`, `sourceOnly`, `spmPackages`, `swiftLanguageVersions`, `targets`,
`textualHeaders` (`schemas/spm.config.schema.json`). No opt-in field is being added (D-B).

**F12c — Exactly four checked-in manifests exist**, and only `expo-modules-jsi` has both a
manifest and an `spm.config.json`. Its manifest is at `apple/Package.swift`, a location the
plugin's root check also misses — so the plugin does not use it either. Known exception,
not a new limitation; handle when that package's turn comes.

**F13 — No snapshot coverage of the emitted manifest exists.** `tools/` runs
`node --test` over compiled output, not jest; prebuild tests assert settings-array
helpers only. Nothing today would catch a collateral change to a generated
`Package.swift`. Hence acceptance A5.

**F14 — The PLUGIN already switches on presence, so migration is coupled (peer session
ENG-24314, re-verified here 2026-09-18).** `packages/expo/scripts/spm/plugin.js:128` is a
bare `fs.existsSync(<moduleRoot>/Package.swift)`. So the moment a package gains a checked-in
manifest for the PIPELINE, the plugin flips to its checked-in branch too, with no opt-in on
that side. D1/F12 are not in conflict — they describe different consumers — but the coupling
is real: **every package migration is simultaneously a plugin-behaviour change.** Steps 3-9
must verify the plugin path, not only the prebuild path.

**F15 — The plugin's checked-in branch silently DROPS external package deps.**
`siblingDependency` (`manifests.js:25-30`) destructures only `dep.byName ?? dep.target`. A
`.product(name:package:)` dependency dumps as `dep.product`, so `name == null`, it returns
`null`, and `.filter(Boolean)` at `:52` removes it. `unsupportedTargetDeps` does not catch it
— that only reports sibling targets of a non-regular kind. Nothing warns. Verified by reading.

**F16 — `spmPackages` must NEVER be dropped from `spm.config.json` (corrects F4's omission).**
Consumers, all verified here: `precompiled_modules.rb:1612-1613,1694-1695` at pod install;
`SPMBuild.ts:51`; `Frameworks.ts:492-521,724-726`; `SPMPackage.ts:651,1487,1642`; typed at
`SPMConfig.types.ts:244` and `SPMPackage.types.ts:120`. It reaches the emitted manifest
itself (`SPMPackage.ts:651`), so it is structural as well as metadata. Exactly three configs
declare it — `expo-image`, `expo-image-manipulator`, `expo-camera` — which is precisely the
Tier C "external SPM deps" row. No `external-configs/ios/` entry declares it today, but the
key is read there too and `Frameworks.ts:492` names lottie-react-native as the anticipated
shape, so it is not a purely first-party field. Does not change the plan (F1). Combined with F15,
migrating any of those three breaks external dependency resolution on the plugin path
(`Unable to resolve module dependency: 'SDWebImage'`), and a symbol/swiftinterface comparison
will NOT catch it because the build fails rather than producing a differing artifact.

**F9 — Ownership collision.** ENG-22650 (`expo`) and ENG-22651 (`expo-modules-core`) belong
to Tomasz Sapeta. #45906 merged; **#45907 (expo-modules-core) is an open DRAFT, stale since
2026-05-18**. `expo-modules-core` is the hardest package in the corpus.

## Corpus tiering (script: `<scratchpad>/analyze_spm_configs.py`)
| tier | count | shape | file moves |
|---|---|---|---|
| A | 43 | 1 swift target, `path: ios`, trivial pattern | none |
| B | 7 | named subdir that already exists, or `Tests/**` exclude | none |
| C owned | 17 | mixed-lang, pure-ObjC, external SPM deps, core | 8 need moves |
| C external | 7 | third-party `external-configs/` | impossible |

Tier C owned breakdown: 8 physically intermixed (expo-audio, expo-sensors,
expo-background-task, expo-media-library, @expo/ui, expo-location, expo-file-system,
expo-modules-core) · 3 already separated (expo-application, expo-sqlite, expo-camera) ·
3 pure ObjC (expo-json-utils, expo-structured-headers, unimodules-app-loader) ·
3 external SPM deps (expo-image, expo-image-manipulator, expo-camera).

## Decisions
- **D1 (USER 2026-09-18)** The pipeline supports BOTH modes at once: today's generated
  staging tree (Mode A), AND building from the real repo directories with a checked-in
  manifest (Mode B). Per-package switch on the presence of `Package.swift`. Reason: migrate
  one package at a time, no flag day.
- **D2 — Mode B is a PORT, not an invention.** `packages/expo/scripts/spm/manifests.js:544`
  `emitSourceManifestPackage` already does it for the plugin: `runDumpPackage`,
  `resolveTargetPaths` against real sources, `linkRoot` symlink to the module root, then
  re-declare targets and inject React/codegen deps. It also already returns diagnostics for
  targets it cannot express (`unsupportedTargetDeps`, `unresolvedTargets`). Adopt that shape.
- **D3 — REPLACES the earlier acceptance gate.** "Byte-identical emitted manifest" is WRONG
  for Mode B: its target paths point at real directories by design, so the text must differ.
  The gate becomes **build equivalence** — the xcframework produced in Mode B must match the
  Mode A one on exported symbols and `.swiftinterface`. Byte-identical manifest still applies
  to every package NOT being migrated in a given PR, to prove no collateral change.
- **D4 (USER)** Prove the design on several simple packages before any hard one.
  `expo-modules-core` goes last.
- **D5 (USER)** Stay neutral on CocoaPods deprecation. No step may depend on it going away.
- **D6 (USER)** The "pipeline reads the manifest vs plugin-only" question is deferred until
  after the Tier A pilot. D1 largely settles it: dual-mode is the answer.
- **D7 — Mode B replaces exactly `resolveSourceTarget` (`SPMPackage.ts:794-902`) plus the
  staging walk.** It emits the same `ResolvedTarget[]` the pipeline already consumes. The
  environment half (binary targets, settings, flavor flags, `${VAR}`, macro flags, header
  maps) stays generated as today. An implementation editing the environment half has left
  the spec. This is the contract in the step-1 spec.
- **D8 — Port the plugin's transform into `tools/`, do not import it.** The helpers live in
  a published package's JS plugin; cross-importing couples the pipeline to its release
  cycle. New `tools/src/prebuilds/CheckedInManifest.ts`, same shape (D2), independent.
- **D9 — Mode B fails loudly on anything it cannot express**, never skips. The plugin skips
  a module; a build pipeline that skips produces a silently missing artifact. Eight
  conditions enumerated in the spec.
- **D11 (USER 2026-09-18) — Switch on presence of `<packageRoot>/Package.swift`. No opt-in
  field is added to `spm.config.json`.** One rule, one source of truth, and it matches the
  plugin (`plugin.js:128`). Rests on F12 being withdrawn. Adding a manifest to a pipeline
  package IS the migration — there is no second flip — which makes D9's loud failures the
  safety net rather than a nicety. Root only; `expo-modules-jsi` (`apple/Package.swift`)
  stays in Mode A as a known exception.
- **D12 (USER 2026-09-18) — The manifest supplies structure ONLY.** Targets, paths,
  `exclude`, `sources`, `resources`, `publicHeadersPath`, membership. Everything else stays
  in `spm.config.json`, including `linkedFrameworks` AND `platforms` — do not read
  `.linkedFramework` or platforms out of the dump. Reason (user): `linkedFrameworks` feeds
  graph construction and belongs with the other graph inputs. Closes Q3.
- **D10 — Q2 settled.** Test targets drop for free by filtering `type === 'regular'`, as
  `manifests.js:41` does. Mode A's glob exclusion has no Mode B equivalent (SwiftPM
  `exclude` takes paths, not globs), so the checked-in manifest must exclude its own test
  dir and Mode B hard-errors when it does not (R2).

## Plan (shape approved by user 2026-09-18; individual steps NOT yet specced or approved)
| # | step | status | owner | note |
|---|------|--------|-------|------|
| 1 | Mode B in `et prebuild`: build from repo dirs when the product opts in, keep staging otherwise. Port D2. | **round 2 done 2026-09-18 (7 blockers + S1-S7); BOTH RE-REVIEWERS RUNNING (blind)** | astra-implementer, xhigh | spec: `.claude/specs/step-1-mode-b.md` |
| 2 | Build-equivalence harness (D3): compare xcframework symbols + swiftinterface across modes, **plus assert a package declaring `spmPackages` still resolves them after migration** (F15/F16 — symbols cannot catch it) | **all 8 blockers + 5 should-fixes FIXED 2026-09-18; focused re-review running** | opus-implementer, high | spec: `.claude/specs/step-2-equivalence-harness.md`; this IS the red/green gate for steps 3-9 |
| 2b | Fix F15: teach `emitSourceManifestPackage` to carry `.product(name:package:)` deps | **DONE by the expo-swiftpm session (ENG-26920), commit `ba04ccacf5e`, VERIFIED pushed** | expo-swiftpm session | step 7 UNBLOCKED; see F72 |
| 2c | Fix F73: `normalizedRelative` (`CheckedInManifest.ts:192`) normalises separators + leading `./` only, while the emit path uses `path.posix.join`, which also collapses `.`/`..` | **todo — MUST land before step 3** | — | proven real in BOTH directions with executed evidence |
| 2d | F76 RESOLVED (no build change): delete the dead `compilerFlags` block from expo-camera's config; then close the schema/pipeline `target` gap (F75) | todo — small, no longer a behaviour decision | — | the "obvious fix" would have BROKEN QR scanning; see F76 |
| 3 | Tier A pilot — 1 package (expo-haptics), both modes green | todo | opus-implementer, high | |
| 4 | Tier A prove-out — ~4 more simple packages (D4), then reassess | todo | opus-implementer, medium | gate before bulk |
| 5 | Tier A bulk — remaining ~38, batched | todo | sol-implementer | mechanical once 3-4 hold |
| 6 | Tier B — 7 | todo | sol-implementer | named subdir already on disk |
| 7 | Tier C without moves — 9 | todo | opus-implementer, high | pure-ObjC, separated mixed. **UNBLOCKED 2026-09-18** — F15 fixed by ENG-26920 (F72) |
| 8 | Tier C with moves — 7 (excl. core) | todo | opus-implementer, high | 1 main PR + 1 follow-up each (F8) |
| 9 | `expo-modules-core` | last | — | D4; tsapeta coordination open (Q1) |
| — | external-configs (7) | never | — | F1 |

Steps 1 and 2 are the enabler pair. Neither changes any package.

## Risks
- **R1** Dual-mode means two code paths in the pipeline **indefinitely**. Mode A can never be
  deleted (F1: external configs need it forever). Accept the permanent branch; both paths
  must stay tested.
- **R2** New per-target directories escape podspec `exclude_files` (26 sites) and
  `.swiftlint.yml:20-23`, which only exclude `ios/Tests`. Consequence is test sources in
  shipped artifacts — `SwiftInterfaceChecks.ts:15-17` exists to catch exactly this.
- **R3** `tools/src/commands/IosNativeUnitTests.ts:20-33` derives Xcode scheme names by
  regex-scanning podspecs for `test_spec`. A renamed test directory renames the CI scheme.
- **R4** `expo-observe` (F7) breaks on any split. Tier A, so no split is planned — but do not
  let a later change split it without fixing the glob first.
- **R5** Known breakage classes on any move: cross-module `import` needs `#if canImport`;
  files free-riding on a sibling's import; the brownfield template symlink into
  `packages/expo/ios/`. See [[project_expo_ios_restructure_breakage_classes]] and
  [[project_swiftpm_explicit_module_import_class]].
- **R6** CI cannot validate Xcode-27 Swift behaviour ([[project_expo_ci_swift_validation_limits]]).

## Open questions
1. **`expo-modules-core` / ENG-22651** — coordinate with tsapeta, or take over? NOT blocking
   now (D4 puts it last), but must be settled before step 9.
2. ~~Test targets in Mode B~~ — SETTLED by D10.
3. ~~Should `linkedFrameworks` move into the manifest?~~ — SETTLED by D11.

## Next step

### 2026-09-18, fresh session (expo-53) — step 1 round 4 DISPATCHED
Resumed from this ledger. Tree state re-verified and it matches the stop description below:
`CheckedInManifest.ts:58` still lowercases on darwin; the three `review 6 rejects absolute
paths` tests are still unrewritten. No duplicate session processes.
- Spec written: `.claude/specs/step-1-round4-d16-d17.md` (D16 + D17, self-contained; scope
  fenced to `CheckedInManifest.ts` + `CheckedInManifest.test.ts` only).
- `opus-implementer` (high) ran it red-first. **CODE-COMPLETE, BOTH REVIEWERS RUNNING (blind).**
  - D17 branch taken: `fs.realpathSync` does NOT canonicalize casing here (verified on this
    machine). So: runtime probe of the volume holding `getPackagesDir()`, comparing `dev`/`ino`
    of a dir and its case-flipped twin, cached in `caseSensitivityByDirectory`, defaulting to
    case-SENSITIVE when the probe fails. No `process.platform` branch left. New pure function
    `isFirstPartyPackagePath(root, candidate, caseSensitive)`; both polarities tested.
    Unacted observation from the agent: `fs.realpathSync.native` DOES canonicalize casing here
    and would remove the probe entirely — decide after review.
  - D16: 4 new unit tests reach the guard via a `stubSwiftDump` PATH shim emitting crafted
    `dump-package` JSON; integration loop narrowed to `publicHeadersPath`; 1 new integration test
    for Swift's own rejection. Nothing deleted.
  - Counts: before 72 tests / 5 fail. After, targeted 81 / 79 pass / 2 fail; full run
    611 tests / 142 suites / 606 pass / 2 fail / 3 skipped. `tsc` and `eslint --max-warnings 0`
    both exit 0.
  - **F66 — the ledger's "3 failures" was wrong; there are 5.** Two `review 5 rejects diagnostics
    ...` tests fail and did so before this round: the build emits SWC-style getter-only,
    non-configurable exports, so `t.mock.method` cannot replace `resolveCheckedInManifestAsync`
    (`TypeError: The argument 'methodName' must be a method`). OPEN: if they never passed, an
    earlier round shipped two tests that assert nothing. Reviewer asked to settle this. Not yet
    fixed — needs a different injection seam.
- Reviewers: Claude `reviewer` (high, executes + fault-injects, backup/restore with sha256) and
  `astra-reviewer` (xhigh, read-only STATIC — no build, so it cannot collide).

**Step 1 round 4 — Claude `reviewer` verdict: ACCEPT.** No blockers. Evidence is strong:
- Fault injection 1: early `return false` in `isFirstPartyPackagePath` breaks 13 tests incl. the
  Mode-B integration tests. It is the ONE production route, not a test-only seam.
- Fault injection 2: neutering `path.isAbsolute` at `CheckedInManifest.ts:226` fails all 4 new
  unit tests AND the `publicHeadersPath` integration test, while the new Swift-rejection
  integration test correctly stays green. The guard binding is real.
- Counts reproduced exactly (81/79/2 targeted; 611/606/2/3 full). `tsc` + `eslint` 0. No `any`.
- Scope confirmed by mtime: only the two fenced files were touched.
- Files restored byte-exact; `pnpm build` re-run after restore.
Should-fix carried forward (NOT blockers, NOT in this round's fence):
- **S-A — the two `review 5` tests can never pass** (`CheckedInManifest.test.ts:977-987`).
  Confirmed mechanism: SWC emits exports as getter-only non-configurable properties, so
  `t.mock.method` throws. Independent of this change. Worse, they only exercise the file-local
  `rejectsManifest` helper, never production code. Rewrite (inject the thrown error) or delete.
  **Until then the suite cannot be green.** F66 above is answered: they NEVER passed.
- **S-B — the new Swift-rejection integration test is weaker than its name**
  (`CheckedInManifest.test.ts:914-919`): the regex matches ANY unreadable manifest, incl. a
  syntax error. Assertion is true, not false — just weak. Add a control that resolves when the
  absolute entry is removed.
Nits: scope dir `packages/@expo` itself passes containment (harmless, untested); probe defaults
case-SENSITIVE on `statSync` throw, the unsafe direction on a case-insensitive volume
(unreachable today); **`getPackagesDir()` reads `EXPO_ROOT_DIR`, so in a worktree whose
`EXPO_ROOT_DIR` points at the main checkout EVERY package fails containment and silently falls
back to Mode A with no diagnostic** — wants a debug line ([[feedback_et_uses_expo_root_dir_not_cwd]]).

**Step 1 round 4 — `astra-reviewer` verdict (blind): REQUEST CHANGES.** 1 blocker Claude missed.
Both labs independently confirmed `isFirstPartyPackagePath` IS the production path (no parallel
implementation) and that the 4 crafted-JSON guard tests are correctly wired.
- **BLOCKER (verified by me at `CheckedInManifest.ts:87`): `fs.statSync` follows symlinks.** A
  case-flipped SYMLINK beside the packages dir (`/repo/PACKAGES` -> `/repo/packages`) makes both
  stats report one inode, so the probe calls a case-SENSITIVE volume case-insensitive. Containment
  then folds case and wrongly accepts `/repo/Packages/fixture`. Astra traced it, did not execute it.
  Fix is one word (`lstatSync`). Not present in this repo; fixing anyway — it is a wrong-answer path
  and the fix is free.
- Astra should-fix: the probe's `catch` caches a non-definitive failure forever for that root.
- Astra should-fix: the weak Swift-rejection test — **same finding as Claude's S-B, reached
  independently.** Two labs agreeing; fixing.

**ADJUDICATION (me, 2026-09-18).** Step 1 round 4 is NOT accepted. Round 5 spec written:
`.claude/specs/step-1-round5-review-fixes.md`, 4 items, same 2-file fence.
1. BLOCKER: `lstatSync` in the probe, with a symlink fixture test.
2. Do not cache a non-`ENOENT` probe failure (cache only the definitive answer).
3. Add the control case to the Swift-rejection test (rejected with the absolute entry, accepted
   without it) — that pair is what pins the failure to the absolute path.
4. **S-A REVERSED — do NOT delete the two `review 5` tests.** Claude called them worthless for
   never touching production code. I read them: they are a guard on `rejectsManifest`, the helper
   nearly every error-path test in the file depends on, which asserts target + detail + a
   remediation sentence. If it went slack, every test using it would silently stop checking. That
   is this task's own recurring failure class. Keep the invariant, fix the mechanism: extract the
   assertion body into a plain function both the helper and the two tests call. No module mocking.
   After this the suite must be at ZERO failures — that is step 1's acceptance signal.
**NOT YET DISPATCHED: the step-2 reviewer is building in this worktree.** Dispatch round 5 only
after it reports ([[feedback_concurrent_tools_build_collides]]).

**Step 2 round 4 — Claude `reviewer` verdict: CHANGES-REQUIRED. 1 blocker, proven on REAL data.**
Strong review: all 6 fault injections went red, so all five round-4 behaviours are test-bound.
The basename fix's opposite hole is CLOSED (a lookalike `ExpoImagee.framework` fails loudly).
- **B1 — the default manifest path is flavour-blind and mode-blind** (`PrebuildEquivalence.ts:124-133`).
  `generated/<Product>/Package.swift` is overwritten by every flavour AND every mode. Proven: a
  Debug `expo-image` run passed the manifest check against the RELEASE manifest while the sibling
  prepared-xcframework check used `debug/`. In steps 3-9 this lets the **Mode A manifest vouch for a
  Mode B build that dropped a dependency** — F15, the exact failure this check exists for.
- S1 a frameworkless slice is dropped on BOTH sides and never compared (unreachable on today's
  corpus — every `.xcframework` under `.build` scanned, zero such slices; drop-on-one-side IS caught).
- S2 `parseArtifactPath(pathA) ?? parseArtifactPath(pathB)` never checks A and B agree.
- S3 `.package(url: "<url>"` is an exact-literal match on emitter formatting (false RED, not green).
- Claim 5 (unbriefed `ConfigRoots` refactor) only PARTLY verifiable — files untracked, no prior
  revision to diff. Production wiring is test-bound (FI-6). Accepted on that basis.
- Note: `tools/scripts/check-spm-manifest-collateral.test.cjs` (step-1's gate) is NEVER collected by
  `node --test 'build/**/*.test.js'` — wrong dir and extension. That gate has never run in the suite.
- **F69 — new false-green trap: a FAILED `pnpm build` leaves the old `build/` in place, so
  `node --test` greens against STALE sources.** A non-zero test count does not catch it. Saved to
  auto-memory as [[feedback_failed_tools_build_leaves_stale_output]].

**Step 2 round 5 spec written:** `.claude/specs/step-2-round5-review-fixes.md`.
**D21 (me) — how B1 is fixed.** Do not guess a manifest path the harness cannot tie to the artifact.
(a) When the package declares `spmPackages`, `--manifest` becomes REQUIRED; absent it, fail loudly —
NOT a `skipped` diagnostic, since a skipped check reading green is this task's recurring defect.
(b) When supplied, verify the `.binaryTarget(path:)` flavour segment matches the artifact's flavour.
Packages with no `spmPackages` are unaffected. Recorded but NOT to be built now: the better fix is
the pipeline copying the manifest it used into the output dir beside the xcframework — that is a
pipeline change and belongs with step 3's pilot; it is the upgrade path if the flag proves annoying.

**Step 2 round-4 review DISPATCHED** (the one that died to the rate limit; round 4 has had no
independent check at all). Fresh `reviewer`, high, fault-injection brief covering: both scoped
names + path-order independence, the basename fix's opposite hole, the `artifacts[]` per-artifact
verdicts, the empty-`artifacts` throw vs `--allow-missing-build-log`, and the unbriefed
`ConfigRoots` refactor. Told the 2 `review 5` failures are expected and out of its scope.
Build slot is free: the step-1 Claude reviewer is done and astra is static.
- NOT started in parallel, deliberately: the step-2 round-4 re-review also builds `tools/`,
  and concurrent `tools/` builds share outDir + tsbuildinfo, which can produce a wrong
  pass/fail ([[feedback_concurrent_tools_build_collides]]). Step-2 review is dispatched
  after this agent reports.
- Unchanged after that: the canonical `pnpm build && node --test` from `tools/`, alone.

**Session rate limit hit 2026-09-18, resets 16:40 Europe/Oslo.** Two agents died to it. Stopped
deliberately at this point. Nothing is committed; the worktree holds all work.

**Verified tree state at the stop — do not assume the reports above describe the files.**
Both step-1 and step-2 agents ended WITHOUT delivering their last result, so the tree is behind
the decisions recorded here.

**Step 1 — 7 of 8 items applied; D16 and D17 are decided but NOT in the code.**
- `CheckedInManifest.ts:58` still reads
  `process.platform === 'darwin' ? resolved.toLowerCase() : resolved` — the unconditional
  lowercase compare D17 WITHDREW. It is still wrong on a case-sensitive APFS volume. Replace with
  containment on canonical paths only (realpath both sides, `path.relative` non-empty, no `..`,
  not absolute), and verify empirically whether `realpath` returns on-disk canonical casing here.
- `CheckedInManifest.test.ts:821` still holds the three unrewritten
  `review 6 rejects absolute paths for ${rule}` tests. These are the 3 failures in the suite.
  Apply D16: unit tests driven by a synthetic `dump-package` JSON fixture, plus ONE integration
  test asserting Swift's own rejection. Delete nothing.
- D18 DID land — the node_modules / `ExternalPackage` exclusion is at `CheckedInManifest.ts:60-63`.
- Items 1, 2, 4, 5, 7, 8 landed with red/green evidence. Gate re-verified: exit 1 on the marker
  fault, `154 byte-identical manifests across 77 products` uninstrumented.
- Astra's report: `.claude/astra-report-manifests.md`.

**Step 2 — round 4 is code-complete but UNREVIEWED.** 91/91/0 across 22 suites, `tsc` and
`eslint --max-warnings 0` clean, blocker verified on the real `RNScreens.xcframework`. The fresh
`reviewer` died to the rate limit at "Now I inject faults one by one", having injected nothing.
**Its verdict does not exist — round 4 has had no independent check at all.** Re-dispatch it.

### 2026-09-18, fresh session (c899f7c8) — step 1 round 5 DISPATCHED
Resumed from this ledger. Tree state re-verified: round 4 DID land (`isFirstPartyPackagePath`
is at `CheckedInManifest.ts:60`), so the older "verified tree state at the stop" block below is
stale — trust the round-5 order, not that block. `git status` shows 3 modified + the untracked
step-1/step-2 files; nothing committed.
No duplicate session process for this sessionId. Four other live sessions sit in the MAIN
checkout, not this worktree, so they share no `tools/` outDir with us.
- `opus-implementer` (high) dispatched on `.claude/specs/step-1-round5-review-fixes.md`,
  2-file fence, red-first, plus the F69 stale-`build/` warning in its brief. RUNNING.
- Step 2 round 5 deliberately NOT started in parallel — both rounds build `tools/`
  ([[feedback_concurrent_tools_build_collides]]). It goes next, alone.

**Step 1 round 5 — CODE-COMPLETE 2026-09-18, BOTH REVIEWERS RUNNING (blind).**
All 4 items done, red-first, scope fence held (only the 2 fenced files; no git state touched).
- Item 1: `lstatSync` on both sides of the probe. Probe returned `false` before, `true` after.
- **F70 — the literal `packages`/`PACKAGES` symlink fixture is IMPOSSIBLE on this machine.**
  `os.tmpdir()` is case-insensitive APFS; `symlinkSync` of the flipped name fails `EEXIST`.
  The implementer used basename `packagesı` (U+0131 DOTLESS I → `PACKAGESI`, which APFS does not
  fold; it tested `ß`/`ﬁ`/`İ`/`K` — all fold). Same pair also fabricates both item-2 answers on any
  volume (absent twin = ENOENT; hard-linked twin = two names, one inode). **This is the one
  judgment call flagged for review** — alternative is gating the test on a case-sensitive volume,
  i.e. it never runs on a default macOS checkout.
- Item 2: ENOENT cached as definitive; other errors return strict default, uncached.
  No red available for the ENOENT branch — the fix did not change it. Stated, not manufactured.
- Item 3: control added; the syntax-error injection confirmed the OLD assertion passed on it.
- Item 4: extracted `assertManifestDiagnostic(error, detail, target)`; both dead tests now live
  (proved by slackening the extracted fn → both red). No module mocking left.
- `isOnCaseSensitiveVolume` now exported for testability (no behaviour change).
- **SUITE AT ZERO FAILURES**: targeted 84/84/0; full `# suites 142 # tests 614 # pass 611
  # fail 0 # skipped 3` (3 skips pre-existing, Hermes version.properties gate). Every test run
  followed a build whose exit status was checked (F69).
- `tsc --noEmit` exit 0; `eslint --max-warnings 0` exit 0; no `any`.
- Reviewers dispatched: fresh Claude `reviewer` (builds; fault injection on all 4 items, both
  item-1 questions) + `astra-reviewer` BLIND (read-only, static — no build, so no outDir collision).

**Step 1 round 5 — Claude `reviewer` verdict: APPROVE WITH NITS. 0 blockers.** Strong review:
it re-ran the build (exit 0 checked), reproduced the counts EXACTLY (targeted 84/84/0; full
142 suites / 614 tests / 611 pass / 0 fail / 3 skip), and fault-injected all 4 items — every one
went red for the right reason, including BOTH polarities of item 2's cache and BOTH slackenings of
item 4's extracted assertion. Injections were made in `build/` only; sources byte-identical after.
- Item-1 question (a): `lstatSync` on both sides is correct. Symmetric `lstat` compares directory
  ENTRIES, which is what the probe means. On a folding volume the two names ARE one entry, so the
  case-insensitive answer survives. Mixing `stat` + `lstat` would be the fragile choice.
- Item-1 question (b): the U+0131 fixture IS a genuine equivalent — reverting production to
  `statSync` turns exactly that test red. Verified, not reasoned.
- **SHOULD-FIX S-C (`CheckedInManifest.ts:88-95`): the `catch` cannot tell WHICH side threw, so an
  `ENOENT` from the ORIGINAL is cached as "case-sensitive".** Spec item 2 said only a missing TWIN
  is definitive. Demonstrated against the built module: probe a not-yet-existing path → `true`
  cached; create a folding pair at it → still `true`, correct answer is `false`. Low impact today
  (`hasCheckedInManifest` passes a realpath'd existing path) but `isOnCaseSensitiveVolume` is now
  EXPORTED, so it is one caller away from mattering. Remedy: `lstat` the original OUTSIDE the
  `try`; keep the `try` around the twin only.
- Nit: no test drives the "other error" branch from the TWIN side (it is reached via `ENOTDIR` on
  the original). Branch covered, spec's scenario not.
- Could not verify: the historical red runs (files untracked, no prior revision). Substituted its
  own fault injection — equivalent evidence of test strength, not of authoring ORDER.
- Scope confirmed: HEAD unchanged at `466da8e06a1`; the other dirty `tools/src/prebuilds/` files
  have mtimes hours earlier.
Awaiting `astra-reviewer` (blind) before adjudicating.

**Step 2 round 5 DISPATCHED 2026-09-18** — `opus-implementer`, high, on
`.claude/specs/step-2-round5-review-fixes.md`. Build slot was free (Claude step-1 reviewer done;
astra is static/read-only, no `tools/` build). **Spec corrected before dispatch**: its constraint
block still said "expect exactly 2 failures in `CheckedInManifest.test.ts`" — round 5 fixed those,
so that line would have excused a real failure. Now reads ZERO failures + an explicit
do-not-touch fence on `CheckedInManifest*`.

**Step 1 round 5 — `astra-reviewer` verdict (blind): REQUEST CHANGES. 2 blockers.**
**ADJUDICATION (me, 2026-09-18): both blockers REAL, and they kill the DESIGN, not a line.**
All three review findings (astra A, astra B, Claude's S-C) are the same root cause: the runtime
volume probe infers case-folding from a `dev`/`ino` proxy, and inode equality has other causes.
- **Astra A** — a bind mount / APFS firmlink of the flipped name reports one inode on a
  case-SENSITIVE volume. `lstat` defeats a symlink, not a bind mount. Probe then folds and accepts
  `/repo/Packages/fixture`. Probe also never checks it stated a DIRECTORY (hard-linked file works).
- **Astra B** (independent of A) — the probe answers for ONE directory level; the answer is applied
  to the WHOLE path. `/repo` folding while `/REPO` is distinct ⇒ accepts `/REPO/packages/fixture`.
- Claude S-C / astra should-fix 2 — the `catch` cannot tell which side threw. Same probe.

**D22 (me) — DELETE the probe. Canonicalise with `fs.realpathSync.native`, compare
case-SENSITIVELY, always.** I verified on BOTH volumes (tmp + repo) myself:
`<wt>/Packages/Expo-Haptics` → plain `realpathSync` returns it UNCHANGED; `realpathSync.native`
returns `<wt>/packages/expo-haptics`. The OS `realpath` gives the true on-disk spelling, so the
filesystem answers the question the probe was guessing at. This closes A (a bind-mounted
`/repo/PACKAGES` canonicalises to itself → correctly rejected; no inode proxy left), B (nothing is
folded anywhere) and S-C (no probe, no cache, no `catch`) at once. This is the round-4 agent's
unacted observation, which I had deferred to "decide after review". Decided.
**Failure direction inverts to SAFE**: a canonicalisation miss now yields a wrong REJECT (silent
Mode A fallback, which builds fine) instead of a wrong ACCEPT. Round 6 must keep it that way and
add the debug line that makes a wrong reject visible ([[feedback_et_uses_expo_root_dir_not_cwd]]).

**Astra should-fix 1 REJECTED** (item-3 control "can pass via a first-invocation-only failure").
Claude tested the pair directly — put the absolute entry back into the control, it went red.
Executed evidence beats the static hypothesis. Pair stands.
**Astra should-fix 4 — `CheckedInManifest.ts:192`**, exclusion-path normalisation mismatch
(`exclude: ["."]`, `"Folder/../Tests"`). Pre-existing, unrelated. Round 6 INVESTIGATES and reports,
does NOT fix. Schedule separately.
**Astra should-fix 3** — the real case-insensitive integration test is skipped on Linux and would
fail on case-sensitive macOS, so CI's Linux run never exercises it. Folded into round 6's test
rewrite (the probe tests go away regardless).

**Round 6 spec WRITTEN: `.claude/specs/step-1-round6-drop-the-probe.md`.** Same 2-file fence.
Round 5 items 2/3/4 are ACCEPTED and fenced off.
**NOT DISPATCHED — the step-2 round-5 implementer holds the `tools/` build slot**
([[feedback_concurrent_tools_build_collides]]). Dispatch round 6 the moment it reports.

**Step 2 round 5 — CODE-COMPLETE 2026-09-18, awaiting review.** All 5 items done, red-first
(2 reds: a compile red, then a runtime red of 8 failing tests across all 4 items). Fence held;
6 files, all inside it. No git state touched.
- **B1 proven on the REAL `expo-image` artifact, all three cases.** BEFORE: a Debug artifact with
  no `--manifest` printed `✓ manifest-declaration` read from `release/` beside
  `✓ prepared-xcframework` read from `debug/` — one green report, two flavours. AFTER: (1) Debug +
  no `--manifest` → exit 1, diagnostic names the overwritten path and says to pass `--manifest`;
  (2) Debug + the on-disk Release manifest → exit 1, names both flavours AND the offending
  `.binaryTarget(path:)`; (3) Release + that manifest → exit 0, both checks on the same flavour.
  Item 3 also proven on real artifacts (Debug vs Release → exit 1).
- Real-artifact runs read the MAIN checkout's `.build` (this worktree has none), read-only.
- **New baseline: 146 suites / 630 tests / 627 pass / 0 fail / 3 skip** (+4 suites, +16 tests over
  the 142/614 step-1 baseline). `tsc`, `lint --max-warnings 0`, `prettier --check` all exit 0.
- **Item 5 NOT wired in, reported instead** (as the spec permits): collecting
  `tools/scripts/check-spm-manifest-collateral.test.cjs` needs `tools/package.json` or a file move,
  both outside the fence. Explicit invocation passes 2/2. **Still uncollected by the canonical run
  — this gate has never run in the suite. OPEN, needs an owner outside both fences.**

**F71 (ME, verified by reading `PrebuildEquivalence.ts:64-65,165-190`) — item 3's A/B agreement
check is in the WRONG PLACE.** Both new throws live inside `resolveSpmPackagesCheck`, which the
caller gates behind `if (!options.skipSpmPackagesCheck)`. So `--skip-spm-packages-check` disables
the agreement check too. And `compareXCFrameworks` runs and PRINTS its verdict at line 57, BEFORE
any of it. Whether two artifacts are two builds of the same thing is a precondition of the WHOLE
comparison, not of the dependency sub-check. The implementer flagged the consequence honestly and
asked for a ruling; the spec did pin the defect at line 102 inside that function, so it followed
the spec. My call: real defect, goes to step-2 round 6 — hoist the agreement check to run
UNCONDITIONALLY before `compareXCFrameworks`. Astra asked to rule on it independently (blind).
- Second implementer judgment call, ACCEPTED: item 3 compares the whole `ArtifactContext`
  (package + flavour + artifact name), wider than the spec's "package and flavour". Two
  differently-named frameworks are not an equivalence pair either. Reviewers asked to check it
  introduces no false rejection.

**DISPATCHED 2026-09-18 (build slot management):**
- `opus-implementer` high → step 1 **round 6** (`.claude/specs/step-1-round6-drop-the-probe.md`).
  Holds the `tools/` build slot. Spec baseline corrected to 146/630 first, and an explicit
  do-not-touch fence added for `PrebuildEquivalence.*` + `prebuilds/equivalence/**`.
- `astra-reviewer` BLIND → step 2 round 5, read-only/static, so no build collision.
- **STILL OWED: the Claude `reviewer` (fault injection) for step 2 round 5.** It builds, so it
  waits for round 6 to report. Do not skip it — astra static alone is not the review gate.

**F72 — step 2b is DONE; step 7 is UNBLOCKED.** Reported by the expo-swiftpm session
(ENG-26920, owner of `packages/expo/scripts/spm/`). I verified the commit myself rather than
taking the report on trust: `ba04ccacf5e` "[ios][expo] Mirror a checked-in Package.swift's Swift
package dependencies" exists, is on `origin/chrfalch/spm-declare-swiftpm-packages`, 7 files
+1399/-61 — matching their claim, and every file inside THEIR fence.
`emitSourceManifestPackage` now carries a module's external SwiftPM package dependencies into the
emitted manifest. Before this, branch (A) dropped them with NO diagnostic, so expo-image,
expo-image-manipulator and expo-camera would each have regressed the moment its `Package.swift`
was checked in. Their evidence: 360/360 tests / 11 suites; additivity proven EMPIRICALLY — the four
real checked-in manifests (expo, expo-constants, expo-log-box, ExpoModulesJSI) emit BYTE-IDENTICAL
output before and after; tester build `BUILD SUCCEEDED`, sync `not supported (0)`, no warning.
Two things that bind MY later steps:
- Their test lever is an UNTRACKED `packages/expo-image/Package.swift` in THEIR worktree, never
  committed. My real checked-in manifest replaces it — do not expect it to be there, and do not
  treat its absence as a regression.
- **Deliberate divergence carried forward: an unmatched `.byName(...)` now renders VERBATIM**
  instead of being dropped. SwiftPM resolves it in the generated package exactly as in the module's
  own manifest; an unresolvable one fails loudly naming it. So a `byName` typo surfaces at Swift
  BUILD time, not at sync time. Steps 7-9 must expect that failure shape.
File-ownership agreement unchanged: `packages/expo/scripts/spm/` theirs, `tools/src/prebuilds/`
mine. No reply owed.

**Step 1 round 6 (D22, drop the probe) — CODE-COMPLETE 2026-09-18, BOTH REVIEWERS to run.**
Probe, cache and the `caseSensitive` param are GONE. `canonicalize(dir, role)` returns
`string | null` (`realpathSync.native`, `null` on any throw, debug line naming role/path/errno);
`hasCheckedInManifest` answers `false` when either side is null and never throws out.
Two distinct debug lines separate a failed RESOLUTION from a real REJECTION — the silent-Mode-A
complaint is closed ([[feedback_et_uses_expo_root_dir_not_cwd]]).
- Reds: 3, one per behaviour change (fold accepted a case-only sibling; ENOENT escaped the caller;
  no diagnostic existed at all). Baseline observed 146/630 — matched the spec exactly.
- **GREEN: targeted 86/86/0; full 146 suites / 632 tests / 629 pass / 0 fail / 3 skip**, build
  exit 0 checked on the same shell line. `tsc` 0, eslint 0, no `any`.
- U+0131 fixture DROPPED with `probeFixture`/`linkTwin` — it existed only for the probe.
- **Openly stated coverage limit:** the "genuinely different sibling" case is driven through the
  pure exported `isFirstPartyPackagePath` with CRAFTED canonical paths, because a real `Packages/`
  beside a real `packages/` cannot exist on this case-insensitive volume. Reviewer asked to rule.
- Judgment call flagged: `logger.debug` (unflagged) over `logger.verbose`. Reviewer asked to rule
  on noise across ~90 packages.
- Candidate-side canonicalisation failure is UNREACHABLE from `hasCheckedInManifest` (an
  `existsSync` early return fires first), so no test drives it. Defence for future callers.

**F73 — astra should-fix 4 (`CheckedInManifest.ts:192`) is REAL IN BOTH DIRECTIONS.** Round 6
investigated without fixing, as instructed, and proved it by EXECUTION against real
`swift package dump-package` fixtures:
- `exclude: ["."]` → inference excludes NOTHING (`isExcluded('', ['.'])` is false), but the emitted
  exclude is `src` (`path.posix.join('src','.')` collapses) — **the generated package excludes the
  whole source directory it was analysed with.** Silent wrong output.
- `exclude: ["Folder/../Tests"]` with `ios/Tests/Bad.swift` → **THROWS** "its Tests directory
  contains source ... that is not excluded". `isExcluded` does not resolve `..`; `prefixSourcePath`
  would have emitted `src/Tests`, which does exclude it. **False rejection.**
Root cause: `normalizedRelative` normalises separators and a leading `./` only; the emit path goes
through `path.posix.join`, which also collapses `.` and `..`. Now plan step **2c**; it must land
before step 3's pilot, since a false rejection would block a migration and the silent case would
ship a wrong manifest.

**Step 2 round 5 — `astra-reviewer` (blind): REQUEST CHANGES, 4 BLOCKERS.** I verified 3 myself.
- **B1 = my F71, CONFIRMED independently.** Astra traced the order: compare → PRINT verdict →
  check skip flag → agreement check. One correction to my finding, which I accept: WITHOUT the
  skip flag the throw is caught by the CLI wrapper and exits 1, so that half is ORDERING, not a
  false green. The skip-flag bypass IS a false green.
- **B2 (verified by me at `PrebuildEquivalence.ts:111`) — `--flavor` DEFEATS item 1 entirely.**
  `options.flavor` wins over the parsed artifact flavour with NO cross-check; line 142 then
  validates the manifest against the OVERRIDE. Two Debug artifacts + `--flavor Release --manifest
  <release manifest>` ⇒ agreement, flavour AND dependency checks all pass. That is exactly the
  defect round 5 existed to stop, through a different door. `--package` has the same shape (:110).
- **B3 (verified by me at `SpmPackagesCheck.ts:135`) — flavour token scan, no `..` normalisation.**
  `.../libavif/debug/../release/libavif.xcframework` reads as Debug, resolves to Release. A target
  with NO flavour segment passes silently, and a test at :519 encodes that as intended.
- **B4 — the whitespace-tolerant matcher accepts non-live declarations.** The comment stripper
  (:318) handles only whole-line `//` and NON-NESTED block comments, so a trailing `//` comment, a
  nested block comment, and a raw string literal all still match and report `pass`.
- Astra should-fixes on `XCFrameworkComparison.ts` (own round, 6b): empty `.framework` dirs report
  "Equivalent" with NO symbol comparison run (:190 vs :494); tree compare matches path-name sets
  but not entry TYPE, so a file and an empty dir of the same name compare equal (:215); loose
  `.swiftinterface` in a frameworkless slice excluded entirely (:526).
- Astra should-fix: no test covers command dispatch, the skip flag or verdict ordering — **which is
  exactly why B1 shipped**. And `SpmPackagesCheck.test.ts:445` `.every()` on a filtered list with
  no length assertion.

**D23 (me) — B3 and B4 are ONE defect: the harness TEXT-SCANS a Swift manifest.** Standing rule
[[feedback_no_ruby_parsing_of_podspecs]]. Fix is not a better regex: read it structurally with
`swift package dump-package`, which this task ALREADY uses in `CheckedInManifest.ts`.
**I verified it on the REAL generated `expo-image` manifest before speccing**: copied to an empty
temp dir, `dump-package` returned JSON in seconds, no network, no sibling files, giving
`dependencies[]` AND `targets[type=binary].path`
(e.g. `../../../../.cache/react/0.88.0-nightly-.../release/React.xcframework`). Dump ONCE and pass
the parsed result to both checks — which also closes astra's double-read race.
**D24 (me) — an override may SUPPLY a value the artifacts lack; it may never CONTRADICT one they
carry.** That is the B2 fix.
**D25 (me) — the Claude fault-injection review of step 2 round 5 is CANCELLED as a standalone.**
Round 6a rewrites the code it would review. Its brief folds into the round-6a review, which must
ALSO verify the round-5 claims astra could not check statically: the real-artifact `expo-image`
repro, the test counts, build freshness, and whether the collateral-test invocation was ever run.

**Step 2 round 6a spec WRITTEN: `.claude/specs/step-2-round6a-read-the-manifest.md`** (4 blockers +
the command-dispatch test + the `.every()` length assert). Fence: `PrebuildEquivalence.*` +
`SpmPackagesCheck.*` ONLY — `XCFrameworkComparison.*` explicitly excluded for round 6b.
**Round 6b NOT YET SPECCED**: the 3 `XCFrameworkComparison.ts` should-fixes above.

**DISPATCHED:** fresh Claude `reviewer` → step 1 round 6 (holds the build slot).
**QUEUED, needs the build slot, in this order:** (1) step-2 round-6a implementer,
(2) step-1 round-6 astra cross-check — static, so it may go in parallel at any time.

**Step 1 round 6 — Claude `reviewer` verdict: ACCEPT, 0 blockers, 3 should-fixes.**
Strongest review of this task so far. It reproduced every count (targeted 86/86/0; full
146/632/629/0/3; build exit 0 checked), confirmed the probe is gone from ALL of `tools/src`
(no `isOnCaseSensitiveVolume`/`caseSensitive`/`probeFixture`/`linkTwin`/U+0131 anywhere), and
fault-injected 5 behaviours — all RED, incl. forcing `isFirstPartyPackagePath` to `true`, which
reddened 8 tests across 3 END-TO-END caller tests. Mutations were to `build/` only, restored and
md5-verified (`1f33aaf64c2c56759ba4b8b6cd90546e`).
- **It BUILT A REAL CASE-SENSITIVE APFS VOLUME with `hdiutil`** — the fixture round 6 said could
  not exist here — and ran the sibling case end to end: real `repo/packages/fixture` AND real
  `repo/Packages/fixture` side by side ⇒ `packages/fixture` `true`, `Packages/fixture` **`false`**
  with the rejection line naming both canonical paths. Volume detached after.
- **Q4 (does the design close the hole or move it): CLOSED.** No wrong `true` found. `..` escaping
  `packages/` → false; `..` staying inside → true; `packages/` itself a symlink → true (both sides
  canonicalise to one root); symlink inside `packages/` → `node_modules` → false; symlink from
  OUTSIDE pointing INTO `packages/fixture` → true, correct (the trusted manifest IS the real
  first-party one). Firmlink/bind-mount class: `realpath` does not resolve a firmlink alias name,
  so `/repo/PACKAGES` canonicalises to itself and fails containment — **failure direction is
  REJECT, exactly as D22 argued.**
- Q5: pure-function-only coverage is SUFFICIENT — the caller path is guarded (the forced-`true`
  injection reddens 3 end-to-end tests), and the case-only variant was confirmed on the real
  case-sensitive volume anyway.
- Q6: `logger.debug` is RIGHT. `Logger.debug` is ungated, and the line fires only for a
  non-external, non-`node_modules` package that HAS a `Package.swift` — **exactly 4 directories in
  the repo today**, not ~90.
- Residual fold at `:87-89` (`part.toLowerCase() === 'node_modules'`) is pre-existing, pre-canonical
  and REJECT-ONLY, so it cannot yield a wrong `true`. Nit: the `part === '..'` check is dead for
  canonical inputs; harmless.
**SHOULD-FIXES for a step-1 round 7 (all 3 are the recurring "green without running" class):**
- **SF1 `CheckedInManifest.test.ts:908-912` is VACUOUS.** `review 10 answers false for a package
  directory that does not exist` — `pkg.path` has no `Package.swift`, so the `existsSync` early
  return at `:84` answers first and canonicalisation is NEVER reached. Proven: it stayed GREEN
  under the removed-null-handling fault. Rename it, or point it at a path that HAS a
  `Package.swift` whose directory then disappears.
- **SF2 `CheckedInManifest.test.ts:812` guards the WRONG CONDITION.** `{ skip: platform !== 'darwin' }`
  guards the platform; the real precondition is a case-INSENSITIVE tmpdir volume. On case-sensitive
  macOS it FAILS rather than skips, and combined with the Linux skip, **the one behaviour users
  depend on (a case-flipped candidate being accepted) is verified on NO CI machine.** Gate on the
  observed volume. (Astra raised this same class in round 5.)
- **SF3** the rejection debug line repeats — `hasCheckedInManifest` is called from
  `SPMGenerator.ts:144` AND `SPMPackage.ts:1362`. Minor; dedupe if the manifest count grows.
- Could not verify: the historical red runs / baseline (untracked files, no prior revision). It
  substituted its own fault injection. It also independently CONFIRMED F73 by reading, agreeing
  with both directions, without executing the fixtures.

**F74 — a Codex wrapper can "complete" with a PLACEHOLDER instead of the review.** The
step-1-round-6 `astra-reviewer` returned `status: completed` after 27s / 3 tool uses saying
"Waiting for Astra to finish; I'll report back once it completes". Nothing was reviewed, and it
reads exactly like a delivered verdict — **the same "check reads green without running" class as
the code defects, one level up in my own orchestration.** Resumed via SendMessage with an explicit
long-timeout / background-and-poll instruction. Saved to auto-memory as
[[feedback_codex_wrapper_returns_placeholder]]. Rule: a wrapper result containing no findings is a
FAILED delegation, never an ACCEPT.

**DISPATCHED: step 2 round 6a** (`opus-implementer`, high) — holds the build slot.
**PENDING:** astra's step-1-round-6 verdict (being re-collected).
**NEXT after astra returns:** spec step 1 **round 7** folding SF1-SF3 + whatever astra adds, so
step 1 closes in ONE more round. Do not spec it before astra reports.

**Step 1 round 6 — `astra-reviewer` (blind, re-collected after F74): REQUEST CHANGES, 1 real
blocker the Claude ACCEPT missed.** Second round running where astra caught what Claude did not.

**B1 CHECK/USE DIVERGENCE — CONFIRMED BY ME at `CheckedInManifest.ts:84` vs `:93-94` plus BOTH
call sites.** Three verified facts:
- `:84` tests existence with `fs.existsSync(path.join(pkg.path,'Package.swift'))` — `path.join`
  collapses `..` **lexically**, never consulting the filesystem.
- `:93-94` canonicalises with `realpathSync.native` — resolves **symlinks first**, per component.
  For a path holding BOTH a symlink and `..`, these two land in DIFFERENT directories.
- `SPMGenerator.ts:144-145` and `SPMPackage.ts:1362-1363` call `hasCheckedInManifest(pkg)` and then
  pass the **RAW `pkg.path`** to `resolveCheckedInManifestAsync`. **The validated path is not the
  consumed path.**
Astra's layout: real `/repo/packages/anchor`, real `/repo/packages/fixture` (no manifest), symlink
`/repo/vendor/link -> /repo/packages/anchor`, real `/repo/vendor/fixture/Package.swift` OUTSIDE
`packages/`. `pkg.path = /repo/vendor/link/../fixture` ⇒ existence check finds
`/repo/vendor/fixture/Package.swift`; canonicalisation lands on `/repo/packages/fixture`;
containment PASSES; the manifest actually read is the one outside `packages/`. **Wrong accept.**
So D22 closed the case-folding hole but left a check/use hole. Canonicalising before comparing does
not establish that the checked dir and the consumed dir are the same dir.
**D26 (me) — resolve ONCE and return it.** Canonicalise first (before the existence check), run
existence + `node_modules` + containment against the canonical path only, and RETURN it so both
call sites consume exactly what was validated. Also makes the candidate-side canonicalisation
failure REACHABLE, closing the vacuous-test finding both labs raised.

**Astra B2 (TOCTOU: the two `realpath` calls are not atomic against a retargeted `packages/`
symlink) — SCOPED, NOT FIXED (my ruling).** Astra itself scoped it to "only if the guarantee must
hold across a LIVE race". This is a build tool reading a checkout; defending against a filesystem
mutating mid-call is out of proportion. D26 removes one of the two resolutions anyway. Round 7
states the scope in a comment instead: the guarantee holds for a filesystem stable for the call.

**Both labs agreed, independently, on two findings** (strong signal):
- the vacuous `:908` test (Claude SF1 = astra SF1),
- the platform-vs-volume skip guard (Claude SF2 = astra SF2; astra had raised the class in round 5
  too).
**Astra-only should-fixes folded into round 7:** `node_modules` exclusion lowercases at `:89` while
canonical containment compares exactly at `:64` — inconsistent for a canonical `NODE_MODULES`; and
the `:77` catch assumes `ErrnoException` and would rethrow on a thrown `null` (hardening, no live
path found).
**RULED OUT of round 7:** Windows (`path.relative` folds case there) — this is the iOS precompile
pipeline, macOS only. The duplicate debug line — D26 rewrites both call sites anyway; explicitly do
NOT build a dedupe cache, that is the construct round 6 removed.
Astra also independently confirmed F73 by reading, matching both directions.

**Step 1 round 7 spec WRITTEN: `.claude/specs/step-1-round7-canonical-once.md`.**
**Fence widened to FOUR files** — `CheckedInManifest.ts`/`.test.ts` + `SPMGenerator.ts` +
`SPMPackage.ts`. Legitimate: the latter two are already modified in this tree by earlier rounds of
THIS step. Explicitly fenced OFF: `PrebuildEquivalence.*` and `prebuilds/equivalence/**` (round 6a
may be editing them concurrently).
**QUEUED behind step 2 round 6a for the build slot.** Round 7 should close step 1.

**PEER REQUEST DONE (expo-swiftpm session, T11): `autolinkWhen` declared.** NOT folded into step 1
— step 1 is under review with a fenced spec, and contaminating it would muddy the review. Done as
its own small additive change in 2 files I own. **Not committed.**
- `tools/src/prebuilds/schemas/spm.config.schema.json` (+37, −0)
- `tools/src/prebuilds/SPMConfig.types.ts` (+24, −0): `export type AutolinkWhen` + the field.
- Verified all 3 peer claims before acting, and read `companion_autolink_condition_met?`
  (`precompiled_modules.rb:622-634`) rather than trusting the summary: first match wins
  podName → npmPackage → podfileProperty; podfileProperty is opt-out.
- **Deviated deliberately: EXACTLY ONE selector required, not all-optional.** The Ruby returns
  false when none is present, so an all-optional shape permits `autolinkWhen: {}` — a companion
  that looks configured and silently never links. That is this task's recurring class, in a schema.
  ajv-verified: 3 valid shapes pass; `{}`, two selectors, and an unknown key all fail. `tsc` 0.
- **F75 — declaring `autolinkWhen` does NOT make expo-camera schema-valid.** I validated all 74
  `spm.config.json` files: exactly 1 fails, expo-camera, and its REMAINING errors are in
  `targets[]`, not `autolinkWhen` — undeclared `pattern`, `dependencies`, and `compilerFlags` as an
  object with a `swift` key (schema expects an array). So the peer's "turn validation on and camera
  breaks" premise survives their own fix. NOT touched: choosing which target variants accept those
  three is a design call inside the `oneOf`, not a one-field addition. Reported back; offered to
  spec it or apply their shape. **Open item, my files, no owner yet.**
- ⚠ Formatting trap hit and recovered: my first attempt rewrote the schema with `json.dumps`, which
  reflowed 4-space indent to 2 and produced 785/586 changed lines for a 1-field addition. Restored
  with `git show HEAD:<path> >` (NOT `git checkout` — the file was unmodified at session start, so
  nothing was at risk) and redid it as a surgical text insert. Check `git diff --stat` after any
  programmatic JSON edit.

**F76 — `compilerFlags.swift` is SILENTLY DROPPED on the SPM path.** Found while checking a peer
claim rather than accepting it, and it is bigger than the schema gap that led to it.
- The peer said `resolveCompilerFlags` "splits c / cxx / swift channels". **It does not.**
  `SPMPackage.ts:295-330` returns `{ c, cxx }` only, and reads exactly three top-level keys:
  `common`, `debug`, `release`. `SPMConfig.types.ts:50-78` agrees — `CompilerFlagsPerLanguage` is
  `{c?, cxx?}`; there is no `swift` anywhere in the type.
- `packages/expo-camera/spm.config.json:58` declares
  `"compilerFlags": {"swift": ["-DZXINGOBJC_USE_SUBSPECS","-DZXINGOBJC_PDF417","-DZXINGOBJC_ONED"]}`.
  `swift` is not `common`/`debug`/`release`, so `resolveCompilerFlags` returns `{c:[],cxx:[]}` and
  **all three defines vanish with no error.** Only occurrence across all 74 configs.
- **CocoaPods is NOT affected**: `ios/ExpoCameraBarcodeScanning.podspec:26` sets the same three via
  `GCC_PREPROCESSOR_DEFINITIONS`. So the divergence is CocoaPods-correct / SPM-silently-wrong.
  Cross-reference [[project_expo_camera_zxing_companion]] — a missing provider here previously
  killed all scanning, so this is the same blast radius.
- NOT overclaimed: I did not verify whether this product is prebuilt+shipped today, only that the
  flags cannot reach the build through this path.
**Why it gates step 7:** expo-camera is one of the three `spmPackages` packages in Tier C. Migrating
it while its Swift defines are silently dropped would bake the defect into a checked-in manifest.
**It needs a DECISION, not a schema edit** — either teach `resolveCompilerFlags` a `swift` channel
(config works as written, behavioural change) or reject `swift` and fix expo-camera's config. Do not
let an implementer pick. Now plan step **2d**.
Note this also sharpens F75: deriving the schema from `resolveCompilerFlags` (as the peer correctly
advises) would make expo-camera's `swift` key schema-INVALID — which is the right answer, because it
IS invalid, silently. Fix F76 first, then the schema.

**Peer follow-up (expo-swiftpm), no action owed:** they accept the strict `?: never` union as-is
(their consumers are untyped JS plus one read-only TS reader). They will NOT copy my uncommitted
hunks — they pick it up when `chrfalch/expo-swift-manifests` lands, to avoid cross-branch drift.
They confirm the three undeclared `target` properties are real and load-bearing, i.e. **the schema
is behind the pipeline and expo-camera is not misusing the format** — correct, except for the
`swift` sub-key above. T11 does NOT depend on the schema gap; they read the JSON directly.
**Tier C signal (no commitment either way):** their pure-Swift emitter cannot express
`ExpoCameraBarcodeScanning` at all — it roots targets at `<module>/ios` with no sub-path, has no
`compilerFlags` channel, and cannot express a cross-package dependency. A checked-in `Package.swift`
for expo-camera would handle all three natively and shrink their side. They are putting it to their
user as an option and will tell me before it affects my sequencing. **Do not reorder steps 7-8 on
this yet.**

**F76 RESOLVED — the silent drop is ACCIDENTALLY CORRECT, and the obvious fix would have broken
QR scanning.** The peer proposed a third option (the `swift` key is an authoring error for `c`)
plus an explicitly-unverified hypothesis with a named test. I ran the test. It settles it, and the
answer is stronger than either of us proposed: **no build change at all.**
Evidence, all verified by me on the real source:
- The defines appear NOWHERE in expo-camera's own sources — only in `spm.config.json:58` and
  `ios/ExpoCameraBarcodeScanning.podspec:26`. They are not expo-camera's conditional compilation.
- They are ZXingObjC's OWN subspec-narrowing mechanism. Guard shape, in its umbrella header
  `ZXingObjC/ZXingObjC.h:25-40` (1 header + 2 `.m` files carry it):
  `#if defined(ZXINGOBJC_PDF417) || !defined(ZXINGOBJC_USE_SUBSPECS)`
  **Without `ZXINGOBJC_USE_SUBSPECS`, EVERYTHING is included.** The defines only ever RESTRICT.
- CocoaPods narrows deliberately: the podspec depends on `ZXingObjC/PDF417` + `ZXingObjC/OneD`
  only (`:18-20`), so the defines match the subspecs actually installed.
- SPM has no subspecs. `spm.config.json` declares the WHOLE product — `zxingify-objc`, exact 3.6.9,
  `productName: ZXingObjC`.
**CORRECTION (2026-09-18, peer-flagged, verified by me — my first rationale was WRONG.)** I claimed
honouring the flags "would silently drop QR code". It would not. `ios/barcode-scanning/` holds ONE
file, `ExpoCameraZXingProvider.swift`, and its only ZXing readers are `ZXPDF417Reader`,
`ZXCode39Reader`, `ZXCodaBarReader` plus core types (`ZXBinaryBitmap`, `ZXHybridBinarizer`,
`ZXCGImageLuminanceSource`, `ZXReader`). A case-insensitive grep for qr/aztec/datamatrix/maxicode
there returns NOTHING. PDF417 + two OneD formats — **exactly what the podspec narrows to.** So the
CocoaPods narrowing is deliberate and matches the code, and moving `swift` → `c` would have
compiled fine and lost no format this provider uses. (Whether expo-camera scans QR elsewhere via
AVFoundation is untouched by any of this and is not ZXing's path.)
**The accurate reason to delete the block:** on the SPM path the config declares the WHOLE
`ZXingObjC` product, so the flags are inert today, and honouring them would buy only a smaller
binary while creating a CocoaPods/SPM divergence nobody asked for. Delete because it is
unimplemented and pointless here — NOT because it is a live hazard.
**The one genuine LATENT hazard, worth keeping:** the guard is not only in the umbrella header. It
is also in `ZXMultiFormatReader.m` and `ZXMultiFormatWriter.m`, the two multi-format dispatchers.
Under SwiftPM every source compiles with no subspec selection, so defining the macro would narrow
which readers those dispatchers REGISTER while all sources still build — a silent skew. Today's
provider uses the individual readers directly and never touches `ZXMultiFormatReader`, so this bites
only future code. That, not QR, is the reason to leave the macro undefined on SPM.
**D27 (me) — resolution: no build change.** Do NOT teach `resolveCompilerFlags` a `swift` channel.
Do NOT move the flags to `c`. **Delete the `compilerFlags` block from expo-camera's config** — it is
meaningless on the SPM path and dangerous if honoured — and let the F75 schema work reject `swift`,
derived from `resolveCompilerFlags` as the peer advised. Step 2d is now small and carries no
behaviour decision.
Known, accepted divergence (NOT a defect): CocoaPods gets a narrowed ZXingObjC, SPM gets the full
one. Larger binary, superset of formats.
**Sequencing relief:** expo-camera is no longer gated on a build decision. The one hard requirement
stands — **a checked-in `Package.swift` for expo-camera must NOT carry these flags**, or it would
bake in the QR-dropping behaviour that the current accidental silence avoids.
⚠ Method note: this is the second peer claim in a row that was confidently wrong in a
load-bearing way ("c/cxx/swift channels", then "the flags are needed, just mis-keyed"). Both were
caught by reading the actual source. Keep verifying peer claims that touch my files.

**Step 2 round 6a — CODE-COMPLETE 2026-09-18. All 4 blockers closed. Fence held (4 files).**
- **Text scanning is GONE, not improved.** `readManifestCode` (the comment stripper),
  `binaryTargetPaths` and `findBinaryTarget` are DELETED. No regex over manifest text remains in
  the module (the surviving regexes match `otool` output and the build log). D23 executed.
  `readSwiftManifest` copies the `Package.swift` to a scratch dir (the dump writes a `.build`
  beside it) and parses `swift package dump-package` ONCE per run; the parsed value travels in
  `SpmPackagesCheckInput.manifest`, so the two checks CANNOT read different builds — astra's
  double-read race closed as a side effect.
- **B2 proven on the real artifact, both polarities.** Debug `expo-image` + real Release manifest +
  `--flavor Release`: BEFORE (override precedence restored) exit **0**, "SPM package dependencies
  of ExpoImage (Release)" with every dependency ✓ — a full false green on Debug artifacts. AFTER:
  refuses, naming both. A correct Release+Release pairing still exits 0 with 20 ✓ / 0 ✗, so the new
  refusals do NOT over-reject.
- **B3 proven on the real manifest**, doctored to `…/debug/../release/…`: pre-normalisation code
  exits 0 calling it Debug; final code refuses, naming the declared path AND what it resolves to.
- Reds: cycle A 7 fails / 35 (items 1-2), cycle B 7 fails / 35 (items 3-4). **A build DID fail
  mid-work (TS18048) and was caught only because the test count looked stale — F69 is live, not
  theoretical.**
- **GREEN: 149 suites / 650 tests / 647 pass / 0 fail / 3 skip** (baseline was 146/632; +3 suites,
  +18 tests). `tsc` 0, `lint --max-warnings 0` 0, `prettier --check` clean, no `any`.
**My rulings on the 4 judgment calls it flagged:**
- **Unparseable artifact path REFUSED — ⚠ MY RULING WAS WRONG; CORRECTED 2026-09-18 (see F77).**
  The principle stands (a path carrying no evidence must not be reported on, per D9). The cost I
  accepted did not: I wrote that only "an artifact stashed outside
  `.build/<pkg>/output/[<ver>/]<flavor>/xcframeworks/`" stops comparing, i.e. a user's scratch copy.
  In fact the refusal rejects a SECOND layout this repo itself produces. See F77. The fix is to
  teach `ARTIFACT_PATH` that layout, not to loosen the refusal.
- **No-flavour-segment binary target REFUSED (old permissive test INVERTED) — accept.** Those paths
  are the ONLY thing tying a generated manifest to an artifact; a manifest with none establishes
  nothing. `--skip-spm-packages-check` remains the explicit artifacts-only route.
- **Beyond-spec addition — accept:** a contradicting `--flavor` is now an error even under
  `--skip-spm-packages-check`. Same principle as item 1; a contradiction is not a thing to skip.
- **No dump cache — accept.** Tests shell out to Swift (~20s for the 2 files; full-suite wall time
  unchanged, files run in parallel). Precedent: `CheckedInManifest.test.ts` already requires a Swift
  toolchain. A cache returning a stale parse is the exact class this round removes.
- ⚠ **Red-provenance caveat to hand the reviewer:** cycle B's red used the OLD call shapes
  (`assertManifestMatchesFlavor(path, flavor)`, `input.manifestPath`); the green run has identical
  manifests and assertions with the call shape retargeted. Not a fabricated red, but not a
  like-for-like one either.

**DISPATCHED:** step 1 **round 7** (`opus-implementer`, high) — holds the build slot; briefed with
the moved baseline (149/650) and told to state what it actually observes.
`astra-reviewer` BLIND on step 2 round 6a — static, no build. **Briefed explicitly against the F74
placeholder failure** (explicit long timeout or background-and-poll; do not return without findings).
**STILL OWED: the Claude fault-injection review of step 2 round 6a**, which per D25 also carries the
round-5 claims astra could not check statically (the real-artifact repro, test counts, build
freshness, whether the collateral-test invocation was ever run). It builds → dispatch after round 7.

### Order of work on resume — AS OF 2026-09-18 END OF SESSION expo-53 (supersedes the list below)
Both steps are reviewed and both need a fix round. Both specs are written. Nothing is committed.
**Run the two fix rounds ONE AT A TIME — both build `tools/`** ([[feedback_concurrent_tools_build_collides]]).
1. Step 1 round 5 — `.claude/specs/step-1-round5-review-fixes.md`. 4 items, fenced to
   `CheckedInManifest.ts` + `.test.ts`. opus-implementer, high. Acceptance: suite at ZERO failures.
2. Step 2 round 5 — `.claude/specs/step-2-round5-review-fixes.md`. B1 + 3 should-fixes + the
   uncollected collateral gate. opus-implementer, high. B1 must be proven on the real `expo-image`
   artifact, not only a fixture.
3. Re-review each fix round with a FRESH reviewer (never the author). Step 1 round 5 wants
   `astra-reviewer` again — it caught the symlink blocker the Claude reviewer missed.
4. ONLY THEN the canonical `pnpm build && node --test` from `tools/`, run ALONE. Still owed for
   BOTH steps. Confirm the BUILD succeeded (F69) and a non-zero test count.
Then: step 2b (F15 `.product(name:package:)`; coordinate with the ENG-24314 session, which owns
`packages/expo/scripts/spm/`), step 3 (expo-haptics pilot; D13 log capture; D14 dead per F65),
steps 4-9.

### Order of work on resume (older, superseded)
1. Finish step 1: apply D16 and D17 (above). One agent, red-first.
2. Re-dispatch the step-2 round-4 review. The brief that died is reconstructable from this ledger:
   verify the external-configs fallback incl. both scoped names, prove order-independence by
   swapping the two paths, check the basename fix did not open the opposite hole, verify the
   empty-`artifacts` throw resists `--allow-missing-build-log`, and independently verify the
   unbriefed `ConfigRoots` refactor preserved behaviour. Fault injection, plus one invented shape.
3. ONLY THEN the canonical `pnpm build && node --test` from `tools/`, run ALONE with no other
   agent active ([[concurrent_tools_build_collides]]). Still owed for BOTH steps. Confirm a
   non-zero test count. Expect the `Utils.test.ts` Hermes-polarity failure to be ABSENT here —
   it is a scratch-only artifact (F59).

Then: step 2b (F15 `.product(name:package:)` silent drop; coordinate with the ENG-24314 session,
which owns `packages/expo/scripts/spm/`), step 3 (expo-haptics pilot; D13 log capture; D14 is dead,
superseded by F65), steps 4-9.

Spec state: `.claude/specs/step-1-mode-b.md` no longer says DRAFT, carries amended D-F.
`.claude/specs/step-2-equivalence-harness.md` carries amended A2 and A3. D-C's post-#50329
`manifests.js` is at `origin/chrfalch/spm-declare-swiftpm-packages`, OPEN and unmerged.

## Findings added 2026-09-18 (researcher; do not re-derive)

**F17 — Single-package build command.** `tools/src/commands/PrebuildPackages.ts`, command
`prebuild-packages`, alias `prebuild`. Scope is positional, not a flag:
`et prebuild expo-haptics -f Debug -p iOS -n ExpoHaptics`. Output lands at
`packages/precompile/.build/<pkg>/output/<flavor-lowercase>/xcframeworks/<Product>.xcframework`
(`Frameworks.getFrameworksOutputPath`, `Frameworks.ts:166-178`); monorepo packages carry no
`versionPrefix`, external ones do (`RunSteps.ts:576-578`).

**F18 — A single-package build silently expands.** `expandWithUnbuiltDependencies`
(`RunSteps.ts:525-529`) adds monorepo packages named in `externalDependencies` whose
xcframework is missing, so a first `expo-haptics` build may also build `expo-modules-core`.
No flag disables it; later runs do not re-expand. Budget the first run accordingly.

**F19 — No symbol-extraction code exists in this base.** No `nm`, `dyld_info` or
`swift-demangle` anywhere in `tools/`. The only binary inspection is diagnostic text:
`otool -hv` (`Verifier.ts:619`) and `otool -L` (`Verifier.ts:638`), neither parsed into a
structure. The ABI-skew check recorded elsewhere in project memory is NOT in `466da8e06a1`.
Symbol comparison is new code, not a reuse.

**F20 — `SwiftInterfaceChecks.ts` is a validator, not a comparator.** It answers "does this
one artifact import a test-only module". Its slice→interface walk `findSwiftInterfaces`
(`:64`) is the only reusable part and is not exported. Neighbours in `Verifier.ts` that could
help are mostly unexported too (`verifySwiftInterfaceTypecheck:1028`, `verifySlice:1598`);
`verifySwiftInterfaceImports:1197` is exported.

**F21 — A dropped SPM dependency does NOT fail the build.** `Frameworks.ts:651-655` logs
`⚠️ SPM dependency <name> not found in Build/Products/ or SourcePackages/artifacts/` and
continues; the dep is absent from the output and from the tarball
(`Frameworks.ts:730-735`). This is the failure mode the step-2 harness exists to catch.

**F22 — The `spmPackages` counter-case that breaks a naive check.** A shared SPM dep
legitimately does NOT sit beside the product: it lives in `packages/precompile/.build/.spm-deps/`
(currently SDWebImage, SDWebImageAVIFCoder, SDWebImageSVGCoder, SDWebImageWebPCoder, libavif,
ZXingObjC) and `Frameworks.ts:562-564` logs `⏭️ Skipping shared SPM dep` on a CORRECT build.
Verified: `expo-image/output/{debug,release}/xcframeworks/` holds only `ExpoImage.xcframework`
and `ExpoImage.tar.gz`. Asserting the dep sits next to the product fails on a correct build
unless `bundleSharedDeps` is set.

**F23 — Build cost is unmeasured.** No timing figures exist in code or docs. Artifact cache
is `packages/precompile/.cache` (~12 GB, warm); per-product DerivedData persists at
`<buildPath>/output/<flavor>/frameworks/<product>` (`SPMBuild.ts:217`) and is wiped only by
`--clean` or `et prebuild prune` (~2 GB/package). `--skip-artifacts` verifies presence and
throws if absent rather than skipping the check (`Artifacts.ts:109-118`).

**F25 — `nm -gU` on a universal binary reports the HOST ARCH ONLY** (llvm-nm 21; verified by
the step-2 implementer: 148 symbols with and without `-arch arm64`). The `ios-arm64_x86_64-simulator`
slice is fat, so a naive per-slice symbol read never compares the x86_64 half, and a regression
confined to x86_64 passes the gate silently. Fix in flight: enumerate with `lipo -archs` and run
`nm -arch <arch> -gU` per architecture, keyed on (slice, arch), reporting a difference when the
two sides disagree on the arch LIST as well as within an arch. The spec's literal `nm -gU <binary>`
(A2) is superseded by this.

**F26 — Nothing in the pipeline persists a full build log.** Only `prebuild-errors-*.log`, and
only on failure (`Reporter.ts:146`). The step-2 `spmPackages` check therefore cannot read the
`not found in Build/Products/` warning (F21) on its own: the log is supplied via `--build-log`,
and the check reports a third state, `skipped`, when it is absent. Passing silently would be the
false green the harness exists to prevent; failing would fire on every normal run.

## Step 1 re-review — astra-reviewer (blind), 2026-09-18: REQUEST CHANGES (3 must-fix)

**F55 — BLOCKING, and it is the fifth gate fault shape: the collateral gate accepts corrupted
content via its OWN normalization marker.** `check-spm-manifest-collateral.cjs:213` replaces every
fixture-root occurrence with `<EXPO_ROOT_DIR>` and cannot distinguish that marker from literal
generated content. Astra injected a current-generator change emitting the literal string
`<EXPO_ROOT_DIR>` where real paths belong: **152 manifests corrupted, including ExpoClipboard's
macro-plugin executable path, and the full gate exited 0 reporting 154 byte-identical.** The gate's
blind spot is its own placeholder. Fix direction: before normalizing, assert the marker does not
already occur in the raw text and fail if it does; or carry a hash of the pre-normalization content
alongside. Evidence: `/tmp/mode-b-adversarial.fHELlP/full-gate-fault.log`.

**F56 — BLOCKING. A6's in-repo restriction is LEXICAL only, and wrong in both directions.**
`CheckedInManifest.ts:55`. Three triggers, all executed: `packages/fixture` symlinked to
`node_modules/third-party` → Mode B wrongly ENABLED; a real `ExternalPackage` whose workspace link
resolves into `packages/fixture` → Mode B enabled during both manifest and source generation; and
`/PACKAGES/` on the case-insensitive filesystem → Mode B wrongly DISABLED for an existing package.
Needs canonicalisation (`fs.realpathSync`) plus case-insensitive comparison on macOS.

**F57 — BLOCKING. Declared resources are counted as compilable sources, so a legitimate package is
falsely rejected.** `CheckedInManifest.ts:397`. Trigger:
`.target(name:"Main", path:"ios", resources:[.copy("Templates")])` with `ios/Value.swift` and
`ios/Templates/template.c`. Real `swift package describe` lists only `Value.swift` and `swift build`
succeeds; Mode B rejects it as mixed-language. Declared resource paths must be removed from the
language-inference source set. Evidence: `/tmp/mode-b-adversarial.fHELlP/followup-probes.log`.

**F58 — a fourth vacuous assertion.** `CheckedInManifest.test.ts:69`: deleting the whole remediation
sentence still passes, because the regex matches "use" inside "Cannot use"; changing the quoted
target to `Wrong` also passes. Both mutations executed.

**Astra's fault table — what the hardened gate now DOES catch** (all exit 1): current inventory
loses ExpoClipboard; generator writes nothing; Release-only no-write; current-only
ExpoModulesCore version change; empty/whitespace-only files; trailing-whitespace / CRLF-only change
(detected in all 154); swallowed exception with no output for one product; concurrent before/after
workers (both succeed, snapshots match). Only the marker shape got through.

**Round-1 fixes CONFIRMED by Astra:** A1 holds in BOTH directions (`Ghost` throws; by-name `React`
from externalDependencies and `Remote` from spmPackages resolve and emit); A2 holds for
`plugins: ["Generate"]`, `.plugin(name:)` AND executable-target dependencies; **A7 holds as a class
— all 27 rejection sites** (18 covering the nine D-G rows plus nine more) fail under unrelated-error
substitution; S7 memoization survived same-second edits, same-length edits, restored mtime, failed
dumps, invalid JSON and overlapping requests with no stale hit.
**F49's harness link masks nothing** — canonical-location probes pass without it, no masked
canonical failure found. That closes the question both re-reviewers were asked.
Astra did not re-run the full 561-test suite. It re-confirms the disclosed residual: shared current
`node_modules` and synthetic artifact metadata still limit historical-environment coverage.

## Step 2 round 4 — implemented 2026-09-18, awaiting review

F64 fixed: config lookup searches `packages/<pkg>/` then `getExternalPackagesDir()/<pkg>/`, and
`parseArtifactPath` accepts a scoped name spanning two segments (`PrebuildEquivalence.ts:153-171`,
`ArtifactPath.ts:14-21`). Verified on the real `RNScreens.xcframework` at the reviewer's own path:
exit 0, "No SPM package dependencies declared".

F65 fixed properly, not documented: `SpmPackagesCheckInput.productBinaries: string[]` became
`artifacts: InspectedArtifact[]` (`{path, binaries}`), the CLI fills it with BOTH artifacts, and
`checkRuntimeLink` emits one verdict per artifact naming its resolved path. The silent-green hole
is now covered by a test ("fails the artifact holding no product binary, rather than reading the
other one" — red: `['pass']`, expected `['pass','fail']`). D14 is formally dead.

F66 fixed (locate by xcframework basename) and F67 fixed (`-f ""` errors).

Two unbriefed changes, both flagged by the implementer and both accepted: a pre-red
test-enablement refactor exporting `resolveSpmPackagesCheck` with an explicit `ConfigRoots`
argument, with 76/76 re-verified at the checkpoint before any behaviour changed; and a FIFTH fix
the implementer's own first pass at F66 introduced — a second framework vendored into the same
slice was being required to link the dependency. Found and fixed red-first by the implementer.

Verification: 13 new tests red first (the reviewer's literal trigger among them), then
**90 tests / 90 pass / 0 fail / 22 suites** (baseline 76/19). `tsc` clean,
`eslint --max-warnings 0` clean on all touched files, the unused `InspectedArtifact` import gone.
Whole `tools` suite 601/595/3/3 — all 3 failures are `CheckedInManifest.test.ts:615`, the step-1
agent's in-flight file. Two agents independently reporting the same 3 failures in the same place
is a useful cross-check that the scratch isolation held.

**D19 — an empty `artifacts` array must fail loudly.** `assertSpmPackagesResolved` with
`artifacts: []` emitted no `runtime-link` diagnostic at all, reading as green. Unreachable from
today's CLI, which always passes two. Ordered fixed anyway: "a skipped check reports green" is the
defect class that produced a blocker in EVERY round of this task (missing config skipping all
assertions, the gate passing on corrupted content, a dropped slice never compared), and steps 3-9
will add callers not visible from here. Guard ordered red-first.

**D20 — per-side reporting stays verbose.** Passes do NOT collapse to one line when both sides
agree, even though it doubles `runtime-link` output (10 → 20 lines for expo-image). Collapsing
would reintroduce precisely what F65 was about: output that makes the two artifacts
indistinguishable, so a reader cannot tell which side was inspected.

D19's guard is IN. `SpmPackagesCheck.ts:84-92` throws (not a diagnostic) right after the
`spmPackages.length === 0` early return, matching how `resolveProduct` and `readSlices` already
treat "this check cannot run". The implementer verified the throw cannot be swallowed by
`--allow-missing-build-log`, which only forgives `skipped` diagnostics. Equivalence suite now
**91/91/0, 22 suites**; whole `tools` suite 602/596/3/3 with the same 3 step-1 failures.
Step 2 round 4 is CODE-COMPLETE and was sent to a fresh `reviewer` 2026-09-18 for narrow
verification with a fault-injection brief.

**F68 — third-party coverage rests entirely on the artifact comparison.** All seven external
configs declare no `spmPackages`, so the SPM dependency check always returns "nothing more to
check" on today's third-party corpus. Fixing F64's hard-fail was still correct — a tool must not
fail on a supported input class — but steps 3-9 must not treat the dependency check as third-party
coverage. It contributes nothing there today.

**Known-fragile test, accepted.** One test calls `resolveProduct(repoConfigRoots(), …)` against
the real repo for `react-native-screens` and `@shopify/react-native-skia`. It depends on
`EXPO_ROOT_DIR` and on those two configs staying checked in. Kept deliberately: a pure-fixture
test cannot catch a wrong external-configs path, which is the thing most worth guarding. If it
ever fails, check those two configs before suspecting the code.

## Decisions 2026-09-18 (step 1 round 3, mid-flight)

**D16 — the unreachable-guard tests are rewritten, not deleted.** Astra stopped on three extra
absolute-path tests it authored for `sources`, `exclude` and `resources`: they fail because Swift
rejects those manifests during `dump-package` before the `CheckedInManifest.ts:169` guard runs.
Stopping was correct under the "a wrong test is a spec question" rule. Resolution: the guard is
defence-in-depth and correct; it is reachable for `publicHeadersPath` (proved red/green) and
unreachable for the other three only because Swift rejects first. So split the coverage — unit
tests with a synthetic `dump-package` JSON fixture that exercise the guard directly, plus ONE
integration test asserting the real behaviour (absolute `sources` → Swift's own error surfaced as
our dump-failure error). The integration test exists to stop a future reader deleting the guard as
dead code. Nothing is deleted and no test asserts something untrue.

**D17 — the case-insensitive compare is withdrawn; my spec was wrong.** Astra flagged that an
unconditional lowercase compare on darwin equates `PACKAGES` and `packages` on a case-sensitive
APFS volume, where they are genuinely different directories. It followed the spec and reported the
caveat rather than silently diverging. Correct. Replacement: containment on canonical paths —
`realpathSync` both sides, then `path.relative(packagesRoot, candidate)` must be non-empty, must
not start with `..`, and must not be absolute. No case comparison at all. This rests on `realpath`
returning the on-disk canonical casing, so Astra was told to VERIFY that empirically on this
machine and, if it does not hold, to detect the volume's actual case sensitivity rather than
branch on `process.platform`.

**D18 — Astra's item-3 deviation is accepted.** Excluding `ExternalPackage` instances and
node_modules paths explicitly, on top of the canonical-path check, because canonical paths alone
cannot identify an external package whose workspace link lands inside `packages`. Constraint
attached: it must not wrongly DISABLE Mode B for a legitimate first-party package. Silent fallback
to Mode A for a migrated package is the worst failure mode in this change — nothing downstream
notices — and it needs its own test.

Also accepted: the new `tools/scripts/check-spm-manifest-collateral.test.cjs`, and generating the
gate's manifests at production depth.

**Routing note.** The unused `InspectedArtifact` at `PrebuildEquivalence.ts:12` (lint failure,
`--max-warnings 0`) was found by the step-1 agent in a file the step-2 agent owns this round. Sent
to step 2, with `eslint --max-warnings 0` added to its report requirements.

## Step 1 re-review — Claude `reviewer` (blind), 2026-09-18: REQUEST CHANGES

Both labs independently reached the SAME two blockers (F55 marker blind spot, F57
resources-as-sources), each reproducing them from its own invented trigger. Convergence between
two blind reviews is the strongest evidence this round produced.

Claude's scratch controls: 571/568/0/3 (56 Mode B), gate `PASS: 154` exit 0, `tsc --noEmit` and
`eslint --max-warnings 0` clean. Its fault table: 8 unit faults caught, 3 uncaught (all Mode A,
see F62); 12 gate faults caught, 1 uncaught (F55).

**F59 — the harness-link question is CLOSED.** Without `$SCRATCH/../apps/bare-expo/package.json`
the suite is 570/571 with exactly one failure: `getVersionsInfoAsync — Hermes V1 polarity` in
`Utils.test.ts`. That is pre-existing, is the `Utils.ts` polarity issue already in project memory,
and is unrelated to this change. The link moves scratch toward canonical behaviour and can mask
nothing of ours. No Mode B test changes outcome either way. A canonical run is still owed.

**F60 — a target `path:` that escapes the package root is unchecked. NEW, promoted to must-fix.**
`CheckedInManifest.ts:118-134` / `:375-388`. `sources`, `exclude`, `resources` and
`publicHeadersPath` are all escape-checked by `prefixSourcePath` (S2), but the target path itself
is not. `.target(name: "Main", path: "../secret")` was ACCEPTED, `sourceRoot` resolved to
`packages/secret`, and `SPMGenerator.ts:163` would symlink it into staging. SwiftPM would reject
that manifest; Mode B only runs `dump-package`, which does not validate paths. Same class as S2,
which is already a requirement — so it is must-fix, not should-fix.

**F61 — two correct-but-unguarded behaviours.** Removing the failed-dump discard
(`CheckedInManifest.ts:92`) leaves 56/56 green; so does deleting the `path.isAbsolute` clause
(`:169`), because only `../other` is tested and `path.posix.join('src','/abs/x')` yields
`src/abs/x`, which passes the prefix test. Both need tests.

**F62 — the Mode A half of the `generateExportsFile` extraction is unguarded.** The collateral
gate calls only `SPMPackage.writePackageSwiftAsync`, never
`SPMGenerator.generateIsolatedSourcesForTargetsAsync`, and no test covers the Mode A call site
(`SPMGenerator.ts:372`). Three injected Mode A faults — no-op `generateExportsFile`, emptied
`internalTargetNames`, failed dump left in the memo — all passed 56/56. Claude compared old and
new line by line and calls the extraction textually faithful, so this is coverage, not a defect.
It is the one place a 77-package regression could land with no gate seeing it.

**F63 — nit: the gate generates one directory deeper than production.**
`<buildPath>/generated/<product>/<flavor>/Package.swift` vs production `generated/<product>/`.
Every `path.relative(packageSwiftDir, …)` therefore carries an extra `../`. Both runs are equally
affected so the comparison is sound, but the `PASS` line claims byte-identity of manifests that
are not the production ones.

**Disagreement, resolved.** Astra called A6 (F56) blocking; Claude called it should-fix, on the
correct observation that no external package has a root `Package.swift` today. Both agree the
silent-DISABLE direction (`/PACKAGES/` on a case-insensitive filesystem) bites at step 3.
Decision: fix now. It is cheap — `realpathSync` plus a case-insensitive compare on darwin — and
step 3 is the next step.

## Step 2 round-3 verification — 2026-09-18: CHANGES REQUIRED (1 blocker)

Round-3 fixes C1-C7 confirmed genuinely fixed by fault injection (framework-loop `.slice(0,1)`
→ 2 red; `resolveProduct` reverted → 4 red; `ARTIFACT_PATH` un-anchored → 1 red). Baseline
76/76/0. The C3 assertion is the tightened, non-vacuous one. Rename `product` → `artifactName`
left no stale reader.

**F64 — BLOCKING, and it is a regression MY C1 instruction caused.**
`PrebuildEquivalence.ts:139` resolves the config only at `packages/<packageName>/spm.config.json`.
That contradicts F1, the finding this whole task rests on: seven third-party configs live at
`packages/expo-modules-autolinking/external-configs/ios/<pkg>/spm.config.json`.
`Directories.getExternalPackagesDir()` exists and is not consulted. Reproduced on the real
`RNScreens.xcframework`: exit 1, with a message telling the user to check a spelling that is
correct, and `--package` offers no escape because no such directory exists. Before round 3 this
path returned `null` and skipped. Aggravated by C6, which deliberately ADDED support for exactly
these versioned third-party paths. Fix must handle the two scoped names
(`@shopify/react-native-skia`, `@react-native-async-storage/async-storage`).

**F65 — C5 must get the real fix; D14 is superseded.** I previously accepted side-B-only
dependency checking as documented, with a constraint on step 3. New evidence overturns that: of
the four assertions only `runtime-link` is order-sensitive (`:123` passes `pathB` alone to
`findProductBinaries`), and the output at `:52-54` prints the LABEL, not the path — so a script
that swaps paths while keeping `--label-b B` prints a reassuring and wrong line. For a gate that
steps 3-9 run unattended, documenting is not mitigation.

**F66 — `findProductBinaries` looks up the binary by product name.** `:200-206` builds
`<slice>/<productName>.framework/<productName>`, but C2's resolution order exists precisely
because the framework basename often differs. When they differ AND the product declares
`spmPackages`, every dependency reports "No product binary to inspect". Loud, not silent, so not
a correctness hole. One line: locate by `artifactName`. No package in today's corpus hits it,
which is why no test catches it.

**F67 — nit: `-f ""` bypasses validation.** `:85` uses `options.flavor ? …`, so an explicit empty
flavor silently falls back to the path-derived one. Use `!== undefined`.

## Step 1 fix round — 2026-09-18, all 7 blockers + S1-S7 done; both re-reviewers dispatched
Green: **561 tests / 136 suites / 558 pass / 0 fail / 3 skipped**, 56 of them Mode B. Red captured
per blocker, each failing for its own reason rather than on a missing symbol; the shared R2 red run
collected 13 tests and all 13 failed. `tsc --noEmit`, lint `--max-warnings 0`, `git diff --check`
clean. ~1h40m at xhigh this round (2.5h in round 1).

**A5 gate re-run: `PASS: 154 byte-identical … baseline 466da8e06a1`, with FOUR fault injections,
each in an isolated clone, each now exit 1** — inventory removal; silent no-write
(`expo-json-utils/EXJSONUtils/Debug did not write Package.swift`); **Release-only no-write, a fifth
shape the implementer invented itself**; and the baseline-input probe (`DIFF:
expo-modules-core/ExpoModulesCore/Debug` + `/Release`). Gate now uses separate per-worker/per-flavor
output dirs with absent-before / exists-after / non-empty assertions, and takes baseline package
inputs from `git archive 466da8e06a1 packages`.

**S5 red evidence supplied** for the three acceptance-criterion tests that lacked it: with both
presence checks inverted in compiled scratch files only (restored in `finally`), all three failed —
missing `Main/src` staging, stale config structure leaking into `targets`, and root-manifest
loading when only `apple/Package.swift` exists.

Fix notes: A1 rejects unknown dependency names **while still permitting by-name refs to
`externalDependencies`/`spmPackages`**; A2 inspects SwiftPM `pluginUsages`; A3 restores the
vendored-framework loop unconditionally; A6 restricts the presence check to in-repo workspace paths
at both call sites; A7 anchors every D-G assertion to its unique diagnostic clause; S7 memoizes the
dump promise per package root, invalidated on manifest stat change, failed dumps discarded.

**F49 — `Utils.ts` ignores `EXPO_ROOT_DIR`.** It reads
`__dirname/../../../apps/bare-expo/package.json`, resolved from the COMPILED FILE's location, so a
scratch `--outDir` build breaks where the canonical `tools/build/` one works. The implementer
worked around it with a read-only link at `$SCRATCH/../apps/bare-expo/package.json`, changing no
source. **Both re-reviewers asked to confirm the link masks nothing** — i.e. that no test passes
because of it that would fail canonically. Durable, now in
[[feedback_et_uses_expo_root_dir_not_cwd]]: a scratch-compiled run and a canonical run are
DIFFERENT ENVIRONMENTS; a green scratch run is provisional until one canonical
`pnpm build && node --test` confirms it.

**Residual limit, disclosed:** the collateral gate still shares installed third-party
`node_modules` and artifact metadata between the two runs; only in-repo package inputs are
revision-specific. Both re-reviewers asked to judge whether that admits a real false pass.

⚠ A canonical whole-suite run is still OWED for step 1's round 2 — its green is scratch-only
(F49). Step 2's 546-test figure was canonical; step 1 adds to it (561 scratch). Run one canonical
`pnpm build && node --test` once both re-reviewers are done and `tools/` is quiet.

## Step 1 review — Claude reviewer, 2026-09-18: CHANGES-REQUIRED
Verified independently, not taken from the implementer's report: the full 3-file/141-line diff read
hunk by hunk (**environment half confirmed untouched** — the only shared emitter touched is
`generateTargetDeclaration` at `SPMPackage.ts:714`, behind an `isCheckedInResolvedTarget` guard a
Mode A target can never satisfy); the A5 gate re-run (`PASS: 154 byte-identical manifests across 77
products`, 4.5s); 41/41 tests; `tsc` and `eslint --max-warnings 0` clean; **nothing migrated** — all
74 `spm.config.json` siblings and all 7 external node_modules packages checked for a root
`Package.swift`, none present. The reviewer also re-created all nine D-G rows plus subcases and
printed each thrown message: **every one is the intended error**, none a masquerading
`dump-package` failure, none a loose-regex accident. The disclosed red-run weakness is real but the
assertions are sound in substance.

**F36 — BLOCKING. A dependency naming a target that does not exist is silently dropped.**
`CheckedInManifest.ts:268` diagnoses only when `declaredByName.has(name)`; `:349` then filters
siblings by `reachable.has(name)`. A name that is neither declared nor reachable falls through both
and disappears. Verified: `.target(name:"Main", dependencies:["Ghost"], path:"ios")` resolves to
`{"n":"Main","deps":[]}` with no error, and `swift package dump-package` accepts it so nothing
upstream catches it either. This is exactly the F15 silent-drop class D-C forbids ("Silence is the
one behaviour that is not acceptable"). Fix is one branch: a dependency name that is neither a
declared regular target nor present in `externalDependencies`/`spmPackages` must throw.

**F37 — PROMOTED TO BLOCKING BY ORCHESTRATOR. The presence switch fires on third-party
node_modules packages, violating F1.** `SPMPackage.ts:1351` and `SPMGenerator.ts:143` test
`<pkg.path>/Package.swift`, and for the 7 `external-configs/ios/*` products `pkg.path` is a
**node_modules** directory. F1 already establishes those must stay Mode A permanently — there is
nowhere to check in a manifest. So this is enforcement of an existing finding, NOT a change to D11:
D11 scopes the rule, it does not extend it into node_modules. Today none of the 7 ships a root
`Package.swift`, but any can add one in a patch release, and SwiftPM support is actively landing in
RN community packages. The day `react-native-screens` ships one, Mode B activates and immediately
throws, because that config is the repo's ONLY `moduleMapContent` user. **A dependency bump would
break prebuild with no repo change.** Restrict the presence check to in-repo packages.

Should-fix, all accepted for the batch:
- **F38** `publicHeaders: false` is ignored in Mode B. `resolveSourceTarget` honours it
  (`SPMPackage.ts:874`), then `Object.assign(resolved, checkedIn, …)` (`:1668-1675`) unconditionally
  overwrites `publicHeadersPath` with `src/include` for every objc/cpp target.
  `external-configs/ios/@shopify/react-native-skia` sets it today, deliberately, to suppress module
  creation. Same trigger as F37.
- **F39** `prefixSourcePath` (`CheckedInManifest.ts:121-123`) does `path.posix.join('src', value)`,
  so `sources: ["../other"]` silently becomes `"other"` — pointing at the staging dir, no
  diagnostic. Reject any prefixed path escaping `src/`.
- **F40** Mode B staging is never pruned (`SPMGenerator.ts:143-170`), unlike Mode A (`:302-313`). A
  package flipping A→B leaves the previous run's symlinked sources beside `src`; the explicit
  `sources:` list keeps them out of the build but SwiftPM will warn and the tree misleads.
- **F41** Red provenance absent for 6 of 41 tests, three of them ACCEPTANCE-CRITERION tests:
  `A6 stages real directories and compiles`, `D-F1 keeps config settings and platforms`,
  `D-B checks only the package-root manifest`. Per the test-first gate these must be shown failing
  (e.g. by temporarily inverting the presence check) before acceptance. The other three are D-G
  edge cases. Genuine incremental red logs DO exist for the later-added tests.
- **F42** A5 compares manifest TEXT only; nothing observes Mode A **staging** output, which the
  `generateExportsFile` extraction (`SPMGenerator.ts:60-86`) did change. The reviewer read it as
  behaviour-preserving (same template, same `internalTargetNames` derivation, same
  `writeFileIfChanged`) but that is a reading, not a check.
- **F43** The absolute-`path` trick at `SPMPackage.ts:1637` contradicts `SourceTarget.path`'s
  package-relative contract and works only because `path.resolve` (`:1105`) ignores the earlier
  argument; it also silently defeats the `.build/` prefix branch at `:1099`. A `why` comment is
  warranted — there is none, and the `as ObjcTarget | SwiftTarget | CppTarget` cast at `:1645`
  hides the violation from the type checker.

**Reviewer's verdict on the three self-authorized departures:** `moduleMapContent` reasoning is
**CORRECT** — Mode A writes the modulemap to `<staging>/<Target>/include/module.modulemap` with
`publicHeadersPath: "include"`; in Mode B that becomes `src/include`, inside the real repo tree, so
writing there would MUTATE THE SOURCE CHECKOUT. Throwing is right under D-G, but D-F must be
amended rather than silently narrowed. Impact today: zero in-repo packages, one external config —
which F37's fix removes entirely. Localized resources: **non-issue**, all 7 resource declarations in
the repo use `"rule": "copy"` and there is no `.lproj` anywhere. Conditional sibling deps:
**non-issue**, `spm.config.json` has no condition concept and no manifest exists yet.

**A5 shrink-resistance CONFIRMED** (asked explicitly): `checkInventory` diffs baseline git inventory
against the working tree and fails on any product added or removed; `generate()` asserts both
`configs.length > 0` and `selected.length > 0`; a generation error propagates out of the unguarded
`writePackageSwiftAsync` and the worker exits non-zero; a missing output makes `readFileSync` throw;
`assert.deepEqual(Object.keys(after), Object.keys(before))` catches asymmetric coverage. It cannot
pass on an empty comparison. ⚠ Caveat: `--base` defaults to the hardcoded `466da8e06a1`, so **steps
3-9 must pass their own base** or the comparison goes stale rather than wrong.

Nits: `isCheckedInResolvedTarget` duck-types on `'sourceRoot' in target` rather than a discriminant;
`for (const t of checkedInTargets == null ? product.targets : [])` (`:1557`, `:1612`) is an `if`
written as an empty loop; `resolveCheckedInManifestAsync` runs `swift package dump-package` three
times per product (~0.5s each) and should memoize; the A4 test (`CheckedInManifest.test.ts:285-305`)
hand-builds the Mode A comparison config, so it confirms emission ORDER for a given list rather than
that Mode A derives the same list. No comment bloat — one doc comment, the D-C-mandated pointer.

## Step 1 review — astra-reviewer (blind), 2026-09-18: REQUEST CHANGES
**Contradicted the Claude reviewer TWICE, both times with executed fault injection. Orchestrator
sided with Astra both times — injecting a fault is strictly stronger evidence than reading the code
and re-creating the correct case.** Lesson for future review briefs: ask for fault injection
explicitly.

**F44 — BLOCKING, and it overturns Claude's "A5 shrink-resistance CONFIRMED". The A5 gate passes
when the current generator writes NOTHING.** `check-spm-manifest-collateral.cjs:190`, read at
`:199`: baseline and current runs SHARE output paths, so a product whose generation silently no-ops
is compared against the baseline's own leftover file. Astra made current `writePackageSwiftAsync`
return early for `expo-json-utils` and the gate still printed `PASS: 154 manifests / 77 products`.
Claude tested inventory shrink (product added/removed) — which the gate does catch, and which is
what the implementer's own fault injection exercised. This is the OTHER fault, and it is the silent
one. Fix: separate output dirs per run, and fail when a product produces no output.

**F45 — BLOCKING. The A5 baseline reads CURRENT package inputs.** `:219` — only `tools/src` comes
from the baseline revision; packages are symlinked into both runs. Astra set
`expo-modules-core/package.json` to `999.0.0-a5-probe`; all 154 comparisons passed although
`EXPO_MODULES_CORE_VERSION` differs from the true baseline. Benign for step 1 (tools-only), but
steps 3-9 change package files by definition and the gate's purpose there is exactly to prove the
untouched packages are unaffected.

**F46 — BLOCKING. Legitimate plugin dependencies are silently dropped.**
`CheckedInManifest.ts:250` inspects `dependencies`, but SwiftPM represents plugin application
separately in `plugins:`. A manifest with `.target(…, plugins: [.plugin(name:"Generate")])` plus a
`.plugin` target passes `swift package describe`; Mode B accepts it and emits only `Main`,
defeating the D-G non-regular-dependency row. Escaped because the existing test used
`dependencies: ["Helper"]` rather than the legal plugin-application spelling.

**F47 — BLOCKING. Mode B drops environment-owned binary targets — the environment half leaking
into Mode B.** `SPMPackage.ts:1557`: the vendored-framework loop is skipped whenever a checked-in
manifest exists. With a `Vendor.xcframework` and config targets declaring it, Mode A emits Vendor's
binary declaration and Mode B omits it while keeping `dependencies: ["Vendor"]` — an unresolvable
manifest. **This violates the spec's core architectural claim**, which Claude certified as holding:
Claude's check was true of the Mode A path and the 77 existing packages; this is the Mode B path.
Invisible today, lands on the step-3 pilot.

**F48 — BLOCKING (promoted). A D-G test passes vacuously, so acceptance A3 is not met for that
row.** `CheckedInManifest.test.ts:166` — `/external|package|dependencies/i` also matches the generic
manifest-loading diagnostic, which contains "Package". Astra substituted an unrelated rejection and
the test still passed without inspecting any dependency. **Directly contradicts Claude's "none
matched a loose regex by accident"**; Claude verified the thrown messages were correct, Astra
verified whether the tests would catch a WRONG throw. Fix requires auditing the whole class
([[feedback_audit_whole_class]]), not just this row.

Astra should-fix: emitted Swift string paths are unescaped (`SPMPackage.ts:724`) — `sources:
["a\"b.swift"]` emits `sources: ["src/a"b.swift"]`, which fails to compile.
Astra nit: the Tests-directory rule (`CheckedInManifest.ts:337`) checks recognized source files
rather than directory presence.

Astra verified: all eight named environment/rendering functions byte-identical to `466da8e06a1`;
the unmodified gate reports 154/77/74 with exact string equality; path failures, URL deps,
`.product` deps **including the qualified `Target.Dependency.product` spelling with a platform
condition**, macro/system declarations, mixed languages, zero sources and forbidden config fields
all reject; nothing migrated. Inferred only: the downstream build consequence of the dropped plugin.
Astra's provenance judgement: the initial 25-test red log proves only that the module was missing;
the six-regression log has behaviour-specific failures but its execution ORDER cannot be
independently established; one test is demonstrably vacuous. **The green run does not prove every
acceptance criterion.**

Astra agrees with Claude on `moduleMapContent`: placement argument technically CORRECT (SwiftPM
discovers custom module maps under the public-header dir, which Mode B puts inside the real-source
symlink), rejection contradicts D-F, present in two `react-native-screens` external-config targets,
no active Mode B package hits it. Both agree localized resources and conditional sibling deps are
non-issues. **Decision: keep the throw, amend spec D-F.** A6's in-repo restriction removes the only
real-world user from Mode B's reach anyway.

Hygiene note: Astra's first invocation used `--reasoning-effort`, which Codex CLI 0.153.4 rejects;
that run was discarded and re-run with `-c model_reasoning_effort="xhigh"`. Worth remembering for
future astra briefs.

**Fix batch SENT 2026-09-18**: 7 blocking (A1 unknown-dependency silent drop, A2 plugin deps,
A3 binary-target leak, A4 A5-gate no-op pass, A5 A5-baseline package inputs, A6 in-repo-only
presence check, A7 vacuous D-G regexes — audit the whole class) + 7 should-fix (publicHeaders:false
override, `..` escape, Swift string escaping, staging prune, red runs for A6/D-F1/D-B, why-comment
on the absolute-path trick, memoize `dump-package`). Red-first per blocker with the reviewers'
literal triggers; both fault shapes to be re-injected against the fixed A5 gate.

## Step 1 result (2026-09-18, pre-review)
Delivered: `tools/src/prebuilds/CheckedInManifest.ts` + `.test.ts` (41 tests), branches in
`SPMPackage.ts` (~84 lines) and `SPMGenerator.ts` (~102 lines), and the A5 gate at
`tools/scripts/check-spm-manifest-collateral.cjs`. Implementer's own account:
`.claude/astra-report-step1.md`. Nothing committed, nothing staged.
A1-A6 all reported met. **A5: 154 manifests over 77 products, byte-identical vs `466da8e06a1`**,
and fault injection (removing `expo-haptics/ExpoHaptics`) made the gate exit 1, so the inventory
check is live. A6 ran `swift package describe` + `swift build` for real; a file with no import of
its own compiled via the generated `@_exported` imports.
Claimed green: 508 tests / 505 pass / 0 fail / 3 skipped — contradicted step 2's run (514/510/1).
**RESOLVED by an authoritative runner pass:** `514 tests / 129 suites / 511 pass / 0 fail /
3 skipped`, exit 0. Both agents' work IS collected in the full run — 41 `CheckedInManifest` tests
and 34 `equivalence` tests, 0 failures in either. Step 1's 508/127 was simply stale (predates 6
tests). **The Hermes `HERMES_VERSION_NAME` fallback test PASSES now** (`ok 4 … single-engine RN`,
no SKIP marker); step 2's reported failure did not reproduce. The 3 skips are its dual-key
siblings, self-skipping on `version.properties does not expose distinct classic/V1 keys` — a
documented environment guard, cf. [[project_precompiled_hermes_eval]].
⚠ The earlier failure's cause was NOT established. Two candidates, neither verified: RN submodule
state (`react-native-lab/react-native` is modified), or step 2's whole-suite run having raced
step 1's concurrent `pnpm build` into the shared `tools/build/` (F24 — the exact collision the
scratch-dir rule exists to prevent). Treat a lone Hermes failure in this suite as unproven until
re-run in isolation.
Build warning, pre-existing and non-blocking: `node_modules are out of sync with your lockfile`.
`SwiftInterfaceChecks.ts` verified by orchestrator to carry EXACTLY ONE change (the `export`),
which is step 2's. Astra flagged it as unattributed; attribution resolved, no conflict, no clobber.

**⚠ Red evidence is weaker than the gate requires.** The red run used a dynamic-import sentinel
later replaced by a normal import, so it proves the MODULE WAS ABSENT, not that each D-G assertion
fails for its own reason. Seven later review-found regressions were each seen red then green, which
is partial mitigation. Both reviewers were asked to check whether any D-G test can pass vacuously.

**Three self-authorized scope departures, awaiting orchestrator decision:**
1. `moduleMapContent` — D-F keeps it in `spm.config.json`; Astra made Mode B THROW, arguing SwiftPM
   resolves it beneath `publicHeadersPath`, now inside the real-source symlink. Real departure from
   D-F; needs a spec decision. Reviewers asked whether the reasoning is technically correct and
   whether any package hits it today.
2. Localized resources and resource rules other than `.copy`/`.process` — rejected, not handled.
3. Conditional sibling deps (`.when(platforms:)`) — rejected, not flattened.

Also noted: the A5 script lives in a NEW `tools/scripts/` dir as `.cjs`, not named in the spec.
A6's "manifest set" wording in the spec is stale — the fixture opts in via a root `Package.swift`
per D-B.

## Step 2 round 3 — 2026-09-18, C1-C7 done; narrow verification review dispatched
**CANONICAL green (the number to accept): `571 tests / 139 suites / 568 pass / 0 fail / 3 skipped`**
via `EXPO_ROOT_DIR=<worktree> pnpm build && node --test 'build/**/*.test.js'` from `tools/`.
Baseline was 514/511/0/3; same 3 Hermes skips. `tsc --noEmit`, `prettier --check`,
`eslint --max-warnings 0` clean. `et --help` lists `prebuild-equivalence` once — the new
`src/commands/*.test.ts` does not register as a command.
Red was made behavioural, not a compile error: the two command-layer helpers were first extracted
with today's behaviour intact, giving `47 tests / 38 pass / 9 fail` before the fixes.
**C3 mutation check re-run: re-applying `.slice(0, 1)` now fails 2 tests** (was 66/66 green) —
F52 closed. Mutation restored, verified by `grep -c` → 0.

**F54 — the implementer self-caught a vacuous assertion mid-round.** Its first draft of the C3 test
matched `/SDWebImage/`, which the symbol name itself contains, so it passed vacuously; it tightened
the assertion before implementing. Same class as F48 and A7. Worth noting that the vacuous-regex
trap recurs naturally in this codebase — fixture names and symbol names overlap.

Fix notes: C1 `resolveProduct` throws naming the path and pointing at `--package` /
`--skip-spm-packages-check`; C2 resolution order is explicit `--product` (must exist) → sole
declared product → product matching the artifact name → an error stating the artifact is named X
while the config declares Y, Z, and that framework and product names often differ, with
`ArtifactContext.product` renamed `artifactName` since treating the framework basename as a product
name was the root cause; C3 fixture adds a second `SDWebImage.framework` to every slice and the
summary now reads `Exported symbols differ in SDWebImage (arm64): …`; C4 `parseFlavor` accepts
Debug/Release in any case and rejects the rest before any `.spm-deps` lookup; C5 documented rather
than two-sided (see D14); C6 `(?:^|/)\.build/`; C7 help wording. Extra, unprompted and right: a
product with no `spmPackages` now prints "nothing more to check" instead of printing nothing — the
same silence-looks-like-a-pass shape as F50.

**D14 (orchestrator, 2026-09-18) — the dependency check reads side B only; accepted as documented,
with a constraint on step 3.** The implementer declined to check both sides, reasoning that the
baseline is by definition known-good, and made the output heading say `read from B`. Residual risk
is real: if a caller passes the paths in the other order, the check verifies the BASELINE and a
dependency dropped by the new build goes unnoticed — exactly the F15/F16 failure the assertion
exists for. Accepted because steps 3-9 drive this from a script, not by hand. **Constraint: step 3's
build driver MUST pass Mode A first and Mode B second, and that ordering needs its own test.**
Making it two-sided would change `SpmPackagesCheckInput` (`productBinaries: string[]` →
`{label, path}[]`); revisit if the ordering ever proves fragile.

**D15 — `sharedSpmDepFrameworkPath` stays duplicated.** Not the one-line import it looked like: the
pure core takes `sharedSpmDepsRoot` as an input precisely so it never imports `Frameworks` or
`Directories`, and importing would pull the build pipeline into a unit-tested module. Drift risk
accepted; a comment naming the counterpart (`Frameworks.getSharedSPMDepFrameworkPath`) would be the
cheap mitigation, per the D-C pattern.

## Step 2 re-review — Claude reviewer, 2026-09-18: CHANGES-REQUIRED (comparator core HOLDS)
**The comparator itself is verified.** 18 real-artifact perturbations, every one caught and named:
bundle deleted from every slice, modulemap gutted, `-Swift.h` gutted, `-enable-library-evolution`
dropped, public declaration removed, whole slice removed, header removed, modulemap removed,
`PrivacyInfo.xcprivacy` content changed, simulator binary thinned to arm64, another product's
binary swapped in, `@available` moved between declarations, **a second framework in a slice losing
an arch** (per-binary loop works), framework binary deleted, symlink loop (no hang), whole
`Modules/` subtree deleted (ONE collapsed line, not thousands). Plus the two that matter most:
a **pure-ObjC package with 0 exported symbols and no `.swiftinterface`** (`EXJSONUtils`) — a
nullability change in its header IS caught, so F28's worst consequence is closed; and a 6-slice
`ExpoModulesJSI` incl. `macos-arm64_x86_64` and `maccatalyst`, self-compare equivalent in 0.28s.
Normalizer attack failed to find a third hiding trigger; `nm` parser attack failed.
**Mutation testing: 12 of 13 mutations turn the suite red.** One survived — see F52.
A4 on real data: exactly four checks, no fifth assertion, `.spm-deps/` counter-case passes;
`ZXingObjC` and `expo-image-manipulator` green; injected faults (commented-out `.binaryTarget`,
bogus `path:` basename, AVIFCoder warning, simulator-only binary swap) each fail correctly and the
AVIFCoder warning fails ONLY AVIFCoder, not SDWebImage. Exit codes behave.

**F50 — BLOCKING. A missing `spm.config.json` silently skips all four A4 assertions, exit 0.**
`PrebuildEquivalence.ts:120-124`: `resolveProduct` returns `null`, propagated as "no dependencies".
Reproduced with a typo'd `--package expo-imagee` → `Equivalent`, exit 0, no SPM section, no warning.
Indistinguishable from a full pass, and it contradicts the error text the same function prints two
branches earlier ("…so it is not skipped quietly").

**F51 — BLOCKING. The command hard-fails on a real in-tree artifact in its DEFAULT invocation.**
`PrebuildEquivalence.ts:119-140`: `parseArtifactPath` yields the framework basename
(`EXApplication`), `products.find(name === …)` misses the declared product (`ExpoApplication`), and
the `products.length === 1` fallback is unreachable whenever the path parses. The message states the
config declares exactly one product and refuses anyway. **Not an edge case — framework basename ≠
product name across much of the corpus**, so the default invocation is broken for a large share of
the packages steps 3-9 will run it against.

**F52 — the one surviving mutation: no test covers a slice with more than one `.framework`.**
`.filter(n => frameworksA.has(n)).slice(0,1)` at `XCFrameworkComparison.ts:184-186` leaves 66/66
green. Behaviour is correct (proven on a real two-framework slice) but the per-binary half of the
arch fix is unprotected against regression.

Worth-considering, sent in the batch: `-f/--flavor` unvalidated (`-f Foo` → five confusing
`.spm-deps/…/foo/` failures); `findProductBinaries` reads only side B, undocumented, so a caller who
passes the new build first has the BASELINE checked; the default manifest path is not flavor-scoped
(`.build/<pkg>/generated/<Product>/Package.swift` is overwritten per build — the on-disk ExpoImage
manifest carried `release/` paths while a Debug run passed check 1); `ArtifactPath.ts:17` `\.build\/`
unanchored, so `/r/my.build/pkg/…` parses as package `pkg`.
Noted, no action: `diffArrays` is quadratic in edit count (10k lines / 50% edits = 3.8s; largest
real artifact text is 1,916 lines); header/modulemap diffs reported as `kind: 'structure'` reads
oddly for an ObjC signature change; `SpmPackagesCheck.ts:280-287` reimplements
`Frameworks.getSharedSPMDepFrameworkPath` instead of importing it (drift risk).

**F53 — F49 confirmed from a second direction.** The reviewer's scratch whole-suite run showed
**14 failures, all in `CheckedInManifest.test.js`**, which the step-1 implementer does not see in
its own scratch. The difference is the `apps/bare-expo/package.json` link F49 describes. This is
evidence that those tests are environment-fragile, NOT that step 1 is broken — and it is the second
independent reason a canonical run is owed before either step is accepted.

## Step 2 fix round — 2026-09-18, all 13 items done; focused re-review dispatched
Unit suite 66/66. **Canonical whole suite 546 tests / 136 suites / 543 pass / 0 fail / 3 skipped**
(baseline 514/511/0/3; +32 tests, all passing; same 3 Hermes dual-key skips). `tsc --noEmit`,
`prettier`, `eslint --max-warnings 0` all clean. Nothing committed.
Both previously-false-green real-artifact cases now FAIL correctly: bundle deleted from every slice
→ `Not equivalent — 2 differences`, naming `expo-application_EXApplication.bundle`; modulemap +
`-Swift.h` gutted → `Not equivalent — 4 differences`, naming the header, exit 1.
New file `equivalence/ArtifactPath.ts` (+ test) derives package/flavor/product from the artifact
path so the SPM check is on by default (B8). `normalizeSwiftInterface` renamed
`normalizeArtifactText` — it now normalizes headers and modulemaps too.
Implementation notes worth keeping: whole-slice walk ignores only `dSYMs/` and `_CodeSignature/`,
and collapses a missing subtree to its root so a deleted bundle is ONE line; content comparison
covers `Headers/`, `*.modulemap`, `*.xcprivacy`; order-awareness uses `diffArrays` from `diff` and
notes that `@available` binds to the FOLLOWING declaration; path collapsing is anchored to repo +
precompile roots, requires a non-word boundary after the root, and skips double-quoted string
literals; `SYMBOL_LINE` is matched BEFORE header patterns so `T api:` parses, and header patterns
must look like a file or arch header so `nm: error reading …:` throws; linkage is keyed
`<slice>/<arch>` via `otool -arch <arch> -L`; `--allow-missing-build-log` and
`--skip-spm-packages-check` are the two explicit opt-outs.

**D13 (orchestrator, 2026-09-18) — the `--allow-missing-build-log` habit problem, deferred to
step 3 by design.** The implementer flagged, correctly, that in CI a missing build log is the
NORMAL case, so the flag becomes something people paste by reflex and the strictness evaporates.
It cannot be fixed by "locating" the log: F26 established the pipeline persists no full build log,
only `prebuild-errors-*.log` and only on failure. The real fix is that the harness captures the log
itself — which requires the build driver that step 3 needs anyway (step 2 deliberately has none,
since there is no Mode A/Mode B pair to drive until step 1 lands). **Step 3 scope now includes: the
build driver captures build output and passes it as the log, so the opt-out flag becomes the
exception rather than the routine.**

## Step 2 review — Claude reviewer, 2026-09-18: CHANGES-REQUIRED

**F27 — The comparator only looks inside `*.framework`, so a dropped resource bundle reads as
equivalent. Reproduced on a real artifact.** `XCFrameworkComparison.ts:149-175` (`compareSlice`
enumerates only `*.framework`) and `:177-222`. Deleting `expo-application_EXApplication.bundle`
from EVERY slice of a real `EXApplication.xcframework` printed `Equivalent … diffs 0`. Real slices
carry bundles both beside the framework (expo-application) and inside it (expo-media-library), and
each holds `PrivacyInfo.xcprivacy`. This project has already lost resource bundles once when the
build shape changed — [[project_spm_resource_bundles_dropped_at_embed]]. A Mode B build that drops
or relocates a bundle would pass this gate and ship an app without its resources or privacy manifest.

**F28 — File CONTENTS are never compared, only presence and file NAMES. Reproduced.**
`XCFrameworkComparison.ts:194-210` (modulemap presence only) and `:251-279` (`Headers/` name set
only). Gutting every `module.modulemap` to one comment and overwriting `EXApplication-Swift.h`
with `// gutted` printed `Equivalent … diffs 0`. The modulemap is path-free text (`use React`,
`umbrella header`, `export *`) and trivially comparable. **Worst consequence: the 3 pure-ObjC
Tier C packages emit no `.swiftinterface` at all**, and ObjC method signatures produce no exported
symbols — so for those packages the entire interface half of the gate is empty and a changed public
ObjC API is invisible.

Both are faithful to spec A2 as written, which lists presence only. **The spec is the defect**;
A2 amended 2026-09-18 to require slice-wide comparison and text-content comparison.

Non-blocking findings, all accepted for the same fix batch:
- **F29** The most important check is opt-in. `PrebuildEquivalence.ts:37` runs
  `assertSpmPackagesResolved` only under `--package`; comparing `expo-image` without it prints
  Equivalent, exit 0, A4 never executed.
- **F30** `skipped` does not affect the exit code (`PrebuildEquivalence.ts:44` counts only `fail`).
  Without `--build-log`, two of A4's four conditions are unverified and the command still exits 0.
- **F31** Negative controls are one-sided: only the "only in A" direction is asserted for the arch
  list, missing slice and missing header. Neutering `architecturesOnlyInB` (`:293`) leaves 34/34
  green — the code is symmetric, the tests do not hold it so.
- Interface text compares as an unordered multiset of trimmed lines (`:520-542`); a declaration
  moved between types reads equivalent. Low risk, cheap to order.
- `SpmPackagesCheck.ts:92` matches the exact literal `.package(url: "<url>"` — the text-matching
  class this project has been bitten by ([[feedback_no_ruby_parsing_of_podspecs]]); failure
  direction is safe (false fail), so not blocking.
- `ABSOLUTE_PATH` (`:39`) collapses any `/a/b` token, broader than A3's stated roots. Reviewer
  scanned 300 real `.swiftinterface` files: zero non-flag lines altered, so theoretical today.
- `process.exit()` after `console.log` (`:48`) can truncate piped stdout; `process.exitCode` is
  the in-repo pattern (`AndroidBuildPackages.ts:381`). Report leads with paths, not the verdict
  (A5 asks for verdict first). `PrivateHeaders/` uncompared.

**Verified independently by the reviewer, not taken on trust:** the mutation claim, with its own
mutations on compiled JS in scratch — `compareSymbols`→[] 5 fails, `compareInterfaces`→[] 4,
`comparePresence`→[] 1, `compareHeaders`→[] 1, slice union→intersection 1; B1 passed in every case.
Also re-ran B6 on `ExpoAudio.xcframework` (equivalent, 170 ms; `lipo -remove x86_64` detected) and
A4 on real `expo-image` data (15 ✓, forbidden fifth assertion absent). B2 tests DO name the
perturbed item, meeting the stricter reading.

## Step 2 review — astra-reviewer (blind), 2026-09-18: REQUEST CHANGES
Found a DIFFERENT set from the Claude reviewer; running both paid for itself.

**F32 — `nm` parsing drops colon-terminated symbols.** `SymbolTable.ts:32` skips every line
ending in `:` before parsing, so a real export `0000000000000000 T api:` (from `__asm__("api:")`)
vanishes and its removal is undetectable. Malformed text ending in `:` also yields an EMPTY SET
rather than throwing — the precise false green B4 was written to prevent.

**F33 — SPM linkage is checked on one binary, with per-arch `otool` output pooled.**
`PrebuildEquivalence.ts:111` takes the first binary; `SpmPackagesCheck.ts:218` pools arches. A
build keeping SDWebImage on device but losing it on simulator passes, and inside a fat binary an
arm64 entry masks absence on x86_64. Needs the same (slice, arch) discipline as symbols.

**F34 — ORCHESTRATOR OVERRULED THE CLAUDE REVIEWER on normalization.** Claude called the
unanchored `ABSOLUTE_PATH` regex theoretical (0 of 300 real `.swiftinterface` files affected).
Astra produced two live triggers that both reported equivalent: a public default changing from
`"https://api.example.com/v1"` to `".../v2"`, and `-Xcc -DFACTOR=8/2/1` vs `8/4/1` (both collapse
to `-DFACTOR=8<PATH>`). A URL in a public default IS public API. Promoted to blocking.

**F35 — declaration ORDER, likewise promoted.** Claude ranked the unordered-multiset comparison
"worth considering, low risk"; Astra ran a trigger — `@available(*, unavailable)` moving from
`first()` to `second()` — which changes public API and compares clean. Blocking.

Astra should-fix, all folded into the batch: commented-out `.package(url:)` passes the raw-text
manifest search and the binary-target branch ignores `path:` (`SpmPackagesCheck.ts:90`);
`startsWith` on the install name lets `@rpath/SDWebImage.framework/SDWebImageFake` pass (`:180`);
substring warning matching means `SDWebImageAVIFCoder not found…` also fails the SDWebImage check
(`:157`) — **live false positive on expo-image today**, which ships both.

Astra cleared: the forbidden fifth A4 assertion is absent; shared-dependency path handling is
correct; the per-architecture design is sound (missing arch reported, empty `lipo` throws, command
failures propagate); `SwiftInterfaceChecks.ts` is exactly one `export`; real-artifact self-compare
of `ExpoFont` passed both slices and both simulator arches at 148 symbols each.
Astra's test-provenance judgement: B2 and B5 do assert the perturbed item by name; gaps are
synthetic `###` arch fixtures, linkage tests injecting pre-parsed names instead of real `otool`
text, and no test of the CLI exit verdict for the missing-log case.

**SPEC AMENDED 2026-09-18 (orchestrator): A2 now requires whole-slice comparison (bundles,
`PrivacyInfo.xcprivacy`) and text-CONTENT comparison (`module.modulemap`, every header); A3 now
requires the path collapse to be anchored to real path arguments under repo/build/cache roots and
requires order-aware interface comparison.** Both blockers were spec defects, not implementer error.

**Fix batch SENT 2026-09-18**: 8 blocking (B1 slice contents, B2 file contents, B3 order-aware,
B4 anchored normalization, B5 nm colon + malformed-throw, B6 per-binary/per-arch linkage,
B7 skipped must not exit 0, B8 A4 must not be opt-in) + 5 should-fix (S1 two-sided negative
controls, S2 commented-out manifest line, S3 exact install-name match, S4 exact warning match,
S5 `process.exitCode` + verdict-first report). Red-first required per blocker; `tools/` is now
exclusively step 2's since step 1 finished, so the canonical `pnpm build && node --test` is
allowed again. Baseline to beat: 514 / 511 pass / 0 fail / 3 skipped.

## Step 2 result (2026-09-18, pre-review)
Delivered: `tools/src/prebuilds/equivalence/{SymbolTable,XCFrameworkComparison,SpmPackagesCheck}.ts`
+ tests, `tools/src/commands/PrebuildEquivalence.ts`, and one `export` keyword added to
`findSwiftInterfaces` in `SwiftInterfaceChecks.ts` (1-line diff, no behaviour change).
Red shown (TS2307 + 3 failing tests), green 28/28 in the equivalence suite; whole tools suite
501/505 with **one pre-existing unrelated failure**: `prebuilds/Utils.test.ts` "falls back to
HERMES_VERSION_NAME when there is no V1 key" — cf. [[project_precompiled_hermes_eval]].
All 7 B2 negative controls detected and named. A **mutation check** (comparators neutered to
return `[]`) failed 8/12 tests while B1 still passed — provenance that a do-nothing comparator
would clear the positive control but not the negative ones.
A4 counter-case verified on REAL data: `expo-image`, 15 `✓` across five shared deps resolving
from `.spm-deps/`, with no check asserting a dep sits beside the product.
Accepted deviations: `assertSpmPackagesResolved` takes a resolved input struct rather than
`(pkg, product, flavor)` (fixture-testability, matches the pure-core/thin-shell split); a third
core file; no build driver in layer 3 (nothing to drive until step 1 lands); no demangling.
**B6 wall-clock build time still UNKNOWN** — the implementer used an existing artifact from the
main checkout rather than building.

**Per-arch fix (F25) landed 2026-09-18, same implementer.** The defect was demonstrated before
being fixed: the pre-fix comparator printed `Equivalent` for a fat fixture whose two x86_64
halves differed by a whole exported symbol. Now `SymbolReader` returns
`ArchitectureSymbols = Map<arch, SymbolSet>`; `parseLipoArchs` throws on an empty arch list (an
archless binary would otherwise compare equivalent to anything); an arch-list mismatch reports as
a `structure` difference, per-arch symbol diffs carry `architecture` and print as `[symbols x86_64]`.
Real-artifact proof: `ExpoImage.xcframework` simulator slice now reads 816 symbols for EACH of
x86_64 and arm64 (1632 total, was 816), and `lipo -remove x86_64` on a copy exits 1 naming the
lost arch. Touched only `SymbolTable.ts` and `XCFrameworkComparison.ts`. Suite 34/34; whole tools
suite 510/514 with the same one pre-existing Hermes failure.

**F24 — `tools/` compiles with a shared incremental state.** `tools/tsconfig.json` sets
`outDir: ./build` and `tsBuildInfoFile: ./cache/.tsbuildinfo`, both `incremental`. Two agents
running `pnpm build` in `tools/` at once corrupt each other and can produce a zero-test run
that exits 0. Concurrent work compiles with an explicit `--outDir` / `--tsBuildInfoFile` into
a scratch dir instead.

⚠ `.claude/ledger.md` is gitignored but `.claude/specs/` is NOT — it shows as untracked.
Never `git add -A` in this worktree; stage explicit paths only, or the spec lands in the PR.

On go: delegate step 1 to astra-implementer at xhigh, acceptance A1-A4 handed over as failing
tests first (or "write the failing tests and show the failure" as step one), then `reviewer`,
then `astra-reviewer` — this is architectural. Step 2 (build-equivalence harness) depends on
nothing in step 1 and can run in parallel.

Do not let the implementer touch `packages/expo/scripts/spm/` — that is the ENG-24314
session's file ownership, agreed 2026-09-18 and binding on both sides.

## Step 2 round 6a — astra's 3 blockers ADJUDICATED by me, 2026-09-18 (verified, do not re-derive)

Astra (blind cross-lab) returned REQUEST CHANGES with 3 blockers. I verified all three at the
source. **One is a true blocker; two are real defects that today's corpus cannot reach.**

**F77 (TRUE BLOCKER, and it corrects a ruling of mine) — the unparseable-path refusal rejects a
layout the repo produces.** `ArtifactPath.ts:20` anchors `ARTIFACT_PATH` on `/.build/<pkg>/output/`.
There is a second producer layout:
- `PackageLocalBuild.ts:5` `PACKAGE_LOCAL_BUILD_DIRECTORY = '.expo-prebuild'`;
  `getPackageLocalBuildPath(pkg) = <pkg.path>/.expo-prebuild`.
- `RunSteps.ts:521` — under `request.exactPackage`, every requested package is mapped through
  `withPackageLocalBuildPath`, so `pkg.buildPath` becomes `<pkg>/.expo-prebuild`.
- `PrebuildPackageForPublish.ts:41` sets `exactPackage: true`. This is the **Turbo publish path**
  (`et prebuild-package-for-publish`), not a scratch copy.
- `Frameworks.ts:167` `getFrameworksOutputPath` then writes
  `<pkg>/.expo-prebuild/output/[<ver>/]<flavor>/xcframeworks/<Product>.xcframework`.
That path has no `.build` segment, so `parseArtifactPath` returns `null` and
`readArtifactContext` (`PrebuildEquivalence.ts:203`) throws. Astra is right and I was wrong to
record the cost as "an artifact stashed outside `.build/…`".
⚠ The fix is NOT a tweak: the two layouts put the package name on opposite sides of the marker —
`.build/<pkg>/output/…` (after) vs `<pkg>/.expo-prebuild/output/…` (before) — and external
packages are scoped (`@scope/name`). It needs a second alternative, with tests for both.

**F78 (real, NOT reachable today — demote to should-fix) — `flavorDirectoryOf` takes the FIRST
flavour segment.** `SpmPackagesCheck.ts:433` uses `.find(seg => seg === 'debug' || 'release')`, so
`../debug/.spm-deps/SDWebImage/release/SDWebImage.xcframework` reads as Debug. Reachability traced
and it is nil on today's emitter: every `.binaryTarget` path is `path.relative(packageSwiftDir, …)`
(`SPMPackage.ts:1535`, `:602`), the climb is `..` segments only, and both dep roots
(`Frameworks.getSharedSPMDepFrameworkPath` = `.build/.spm-deps/<Product>/<flavor>/…`, and the
package-local `intermediates/spm-deps/<Product>/<flavor>/…`) carry exactly one flavour segment.
**Fix it anyway**: `assertManifestMatchesFlavor` exists to catch a manifest that does NOT describe
this build, so "the emitter cannot produce that" is assuming the thing the check must not assume.
Correct reading is the flavour nearest the artifact (`findLast`), and two DIFFERENT flavour
segments must refuse, not resolve — silently picking one is this task's recurring defect class.

**F79 (real, NOT reachable today — demote to should-fix) — `--product` can silently switch the
dependency check off.** `PrebuildEquivalence.ts:130` returns `null` (→ exit 0, no check, no word)
when the resolved product declares no `spmPackages`. Corpus census (67 `spm.config.json`, script
inline in the 2026-09-18 transcript): only **3** products declare `spmPackages`
(`expo-image/ExpoImage`, `expo-image-manipulator/ExpoImageManipulator`,
`expo-camera/ExpoCameraBarcodeScanning`) and only **expo-camera** mixes — sibling `ExpoCamera`
declares none. So astra's named exploit (`--product ExpoCamera` on the barcode artifacts) is
**refused today**, by the guard at `:288`: it fires when the artifact basename is itself a declared
product, and for that product name == podName == target name == artifact name.
The guard is a coincidence, not a defence: it is inert whenever the framework name differs from the
product name, which the code's own comment at `ArtifactPath.ts:7` says is common
(`EXApplication.xcframework` ← `ExpoApplication`). The day a mixed package ships such a product,
the one check that can catch a dropped SwiftPM dependency turns itself off silently. Close it: a
product with no `spmPackages` in a package that has one that does must SAY the check did not run.
`--skip-spm-packages-check` is already the explicit route.

**Verification gap, stated:** `packages/precompile/.build` does not exist in this worktree, so F78
and F79 reachability were traced through the emitter and the configs, not read off real generated
manifests. F77 needed no artifacts — it is a path-shape proof.

## Step 1 round 7 — CODE-COMPLETE 2026-09-18; both reviews dispatched

Spec: `.claude/specs/step-1-round7-canonical-once.md`. Fence held — four files:
`CheckedInManifest.ts`, `CheckedInManifest.test.ts`, `SPMGenerator.ts`, `SPMPackage.ts`.

- **API change:** `hasCheckedInManifest(pkg): boolean` → `resolveCheckedInManifestRoot(pkg): string |
  null`. Canonicalizes `pkg.path` ONCE up front, then runs the existence, `node_modules` and
  containment checks against that one path and returns it. Both call sites now pass the returned
  canonical root to `resolveCheckedInManifestAsync`, closing the check/use divergence (the round-7
  blocker: `path.join` collapsed `..` lexically while `realpathSync.native` followed symlinks, so it
  validated `packages/fixture` and consumed `vendor/fixture/Package.swift`). `grep -rn
  hasCheckedInManifest tools/src` → nothing.
- **Item 1 red (correct order, pre-fix build):** reproduced exactly — validated `packages/fixture`,
  consumed `vendor/fixture`, `hasCheckedInManifest` = `true`.
- **Item 4 red:** on a case-sensitive APFS sparse image (`hdiutil`, `TMPDIR` redirected), the
  case-folding test failed at its own guard rather than skipping.
- **GREEN: 149 suites / 652 tests / 649 pass / 0 fail / 3 skipped** after `rm -rf build && pnpm
  build` (exit 0 checked). Baseline was 149/650; +2 tests. `tsc` 0, `lint --max-warnings 0` 0.
- **Item 5:** `node_modules` check made exact (`split(path.sep).includes(...)`), case-insensitive
  comparison dropped, **no test added** — the agent argues the two spellings are not distinguishable
  from outside the function. Flagged to both reviewers as an argument to break, not to accept.
- ⚠ **DISCLOSED PROVENANCE GAP — the thing the reviews must settle.** A scripted edit silently
  no-opped, so three tests (`review 10 reports …`, two `review 11`) landed AFTER the implementation.
  Compensation offered: the finished test file run against the genuine pre-fix module (6 of 88 fail)
  plus three targeted fault injections. Establishing "fails against old code" is NOT the same as
  establishing test-first provenance; both reviewers were told to judge it, not accept it.
- Note: one unrelated failure on the sparse image was `No space left on device` from `swift build`
  (200 MB image too small), not a code defect.

**Dispatched 2026-09-18, both running:**
- `astra-reviewer` (blind, `-s read-only`, xhigh) on step 1 round 7. Carries the F74 warning
  verbatim (the wrapper once returned a placeholder after 27s having reviewed nothing).
  **Read-only → takes no build slot.**
- `reviewer` (Claude, fresh) on step 2 round 6a: fault injection + the four round-5 claims a static
  review could not check (real-artifact expo-image repro, test counts, build freshness, whether the
  collateral gate is invoked by anything). Mutations confined to a scratch copy; no git state
  commands. **Holds the build slot.**
- Neither brief mentions astra's 6a findings (F77/F78/F79) or any prior verdict — both review blind.

## Next step (as of 2026-09-18, after the two dispatches above)

1. Write `.claude/specs/step-2-round6b-*.md` while the reviews run, folding **F77 (blocker)**,
   F78, F79 and the three `XCFrameworkComparison.ts` should-fixes below. **Do not dispatch it until
   the step-2 round-6a review lands** — 6b must fold that review's findings too, and it needs the
   build slot the reviewer holds.
2. Adjudicate both review verdicts. Step 1 round 7 is accepted only if the provenance gap is
   settled.

**The three `XCFrameworkComparison.ts` should-fixes, stated precisely (verified by me at source):**
- **S1 — a `.framework` present on BOTH sides but holding no binary is never symbol-compared.**
  `:190` runs `compareSymbols` only when the binary exists on both sides; when it exists on neither,
  nothing runs and nothing is reported. The `carriesFramework` guard at `:494` only requires some
  slice to hold a `.framework` *directory*, which an empty one satisfies. So two artifacts whose
  frameworks are all empty directories report "Equivalent — 0 differences": the "two empty things
  are equal" failure that guard was written to prevent, reintroduced one level down. (The
  one-side-only case IS caught, by the tree compare.)
- **S2 — the slice tree compare matches path names, not entry kind.** `:215-218` builds
  `pathsA`/`pathsB` from `entry.path` alone. `TreeEntry` carries `isDirectory` (`:52-55`) and it is
  never compared, so a directory `Foo.bundle` on one side and a FILE named `Foo.bundle` on the other
  report no difference.
- **S3 — a `.swiftinterface` outside a `.framework` is invisible to both comparisons.** `readTree`
  drops every path matching `SWIFT_INTERFACE` (`:61`, applied `:526`) on the grounds that the
  interface comparison owns it — but `compareInterfaces` is only ever called per matched
  `.framework` (`:196`), and indexes from inside it. A loose `.swiftinterface` in a slice is
  excluded from the tree compare and never reaches the interface compare.

**Round 6b spec WRITTEN, not dispatched:** `.claude/specs/step-2-round6b-place-the-artifact.md`.
Folds F77 as item 1 (blocker), F78 as item 2, F79 as item 3, S1/S2/S3 as items 4-6. Design decisions
I made in it, so they are not re-opened: (a) item 1 parses BOTH layouts as two named patterns and
derives layout B's marker by importing `PACKAGE_LOCAL_BUILD_DIRECTORY` rather than retyping it;
(b) item 2 takes the LAST flavour segment and refuses two differing ones; (c) item 3 does NOT refuse
merely because a product lacks `spmPackages` — that is a legitimate permanent state and refusing
would cry wolf. It refuses only the four-condition shape where `--product` alone turned the check off
with nothing corroborating it, and otherwise requires the report to STATE that the check did not run.
**Hold the dispatch until the step-2 round-6a review lands**, then fold its findings in first.

## Cross-session coordination 2026-09-18 — expo-camera `Package.swift` ownership (peer: expo-swiftpm/expo-20)

Their T11 now needs `packages/expo-camera/Package.swift` to exist (their plugin branches on bare
`fs.existsSync`). They asked whether I write it or they do, and for rough timing.

**My answer: weeks, not days — they take their option 2** (author it as an uncommitted local lever,
never staged, as they already did for `packages/expo-image/Package.swift` under ENG-26920). Reason
beyond timing: their option 3 (they author, I absorb) would have my equivalence harness validate a
manifest it did not derive, which is the one thing the harness exists to rule out.

Timing basis (from this ledger, not estimated): expo-camera is Tier C "already separated" = **step 7
of 9**. Steps 1 and 2 are both still in review rounds; 2c and 2d must land before step 3; steps 3-6
precede 7.

**Three constraints I gave them, so their lever matches what step 7 will land.** If their file
diverges from these, it is a spec question, not a silent landing:
1. **D12** — the manifest carries STRUCTURE ONLY. This subsumes their ZXing `compilerFlags`
   requirement: no checked-in manifest carries `compilerFlags` for any package, so it never arises.
   Reinforced independently by F76 (the block is dead on the SPM path today; step 2d deletes it).
2. **D10** — SwiftPM `exclude` takes paths, not globs: `"barcode-scanning/**"` → `"barcode-scanning"`.
3. **R2** — `packages/expo-camera/ios/Tests` EXISTS (8 Swift test files, verified). The generated
   path applies a `Tests/**` default a checked-in manifest does not inherit, and Mode B hard-errors
   on a manifest that fails to exclude its own test dir. So `ExpoCamera` needs
   `exclude: ["barcode-scanning", "Tests"]`. `ExpoCameraBarcodeScanning` (`ios/barcode-scanning`,
   one source file) needs none.

## Step 1 round 7 — astra-reviewer (blind), 2026-09-18: APPROVE with 2 should-fix + 1 nit

No blockers. Implementation of `resolveCheckedInManifestRoot` judged correct; canonicalize-once
holds. My adjudication below — one of astra's should-fixes I promote, one I partly reject.

- **SF1 → PROMOTED TO MUST-FIX. Nothing binds the call sites, which is the entire point of round 7.**
  Both `review 11` tests (`CheckedInManifest.test.ts:927`, `:935`) call the resolver DIRECTLY;
  neither drives `SPMGenerator.ts` or `SPMPackage.ts`. Reverting either caller to consume raw
  `pkg.path` — the round-7 blocker returning — leaves the whole suite green. Verified at source.
  Second gap in the same area: the positive test builds `packages/anchor/../fixture`, a lexical `..`
  with NO symlink, so canonical and lexical agree; it proves `..` collapse, not symlink divergence.
  The real-symlink test asserts REJECTION. **The accepting path through a real symlink is untested,
  and that is the exact case where a reverted caller reads the wrong manifest.**
  Why I promote it: this compounds with the provenance gap. Tests written after the implementation
  are tests shaped to the code, and the thing they fail to hold is the thing the round existed to
  fix. That is the defect class of this whole task, applied to the test suite itself.
- **SF2 → PARTLY REJECTED; my ruling recorded so it is not re-derived.** Astra refuted the
  implementer's stated justification for the exact `node_modules` comparison with: if `packages/` is
  a symlink to a dir literally named `NODE_MODULES`, containment passes and the exact match misses.
  The refutation of the *justification* is correct — but the counterexample is NOT a miss of this
  check. It is a case where the ANCHOR moved (the packages root was redefined), and no spelling
  comparison repairs a redefined anchor. What the exclusion actually defends is a NESTED dependency
  tree inside the packages root (`packages/<pkg>/node_modules/<dep>/Package.swift`), which passes
  containment legitimately; npm always spells that `node_modules`, so exact is right for that threat.
  Required: fix the comment to state the real purpose and name the boundary, plus a test for the
  nested case. **Explicitly NOT required: a guard for the redirected-anchor scenario** — it needs
  control of the repo layout and is out of scope.
- **Nit → ACCEPTED as a real repo standard, not a nit.** `CheckedInManifest.ts:79` and `:107` state
  what and why and stop; this repo's CLAUDE.md requires what/why/**how**.
- **Provenance — astra's finding matches mine.** It judges the three disputed tests load-bearing for
  what they assert (confirmed by modeled fault injection per test), but states explicitly that this
  does NOT establish test-first chronology, and that the aggregate "6/88 fail against old code"
  would not have sufficed alone. So: functional coverage confirmed, chronology not.
- ⚠ **Verification gap:** astra did not rerun the suite, so `149 suites / 652 tests` is UNVERIFIED by
  this review. The step-2 round-6a reviewer runs the full suite and will give an independent count.

**Round 8 spec WRITTEN, not dispatched:** `.claude/specs/step-1-round8-bind-the-call-sites.md`.
Item 1 (must) binds both call sites, requiring a first-party package accepted through a REAL symlink
with a different `Package.swift` at the lexical location, and **two independent revert injections** —
revert `SPMGenerator.ts` alone and only its test goes red; then `SPMPackage.ts` alone, the reverse.
Items 2-3 are the comment/test and the two error messages. Mostly test work; the implementation
logic is settled and explicitly out of scope.
**Blocked on the build slot**, held by the step-2 round-6a reviewer.

## Step 2 round 6a — Claude `reviewer` fault injection, 2026-09-18: CHANGES-REQUIRED (4 blockers)

**Strong convergence: it independently reproduced F77/F78/F79 blind, matching astra.** Two labs,
neither seeing the other's verdict nor mine, reached the same three. Treat them as settled.

- **16 fault injections, 14 went red.** Baseline 29 suites / 125 tests / 125 pass. The round's
  claimed behaviours ARE test-bound: structural `dump-package` read, the `--manifest` requirement,
  the flavour check, `..` normalisation, override contradiction, agreement ordering, and all three
  xcframework comparisons. **Two stayed green — see S1/S2 below.**
- **F78 STRENGTHENED — my "not reachable" was about the emitter, and the false pass is live.** The
  reviewer executed it: `"../release/.spm-deps/SDWebImage/debug/SDWebImage.xcframework"` +
  `assertManifestMatchesFlavor(manifest, 'Release')` → ACCEPTED. A Release build vouched for by a
  debug dependency. Accurate statement: real and executable on a crafted manifest; nobody has shown
  today's emitter producing such a path. Fix stands either way.
- **F79 reproduced live** on an `expo-av`-shaped config (`ExpoAV` with `spmPackages`, `ExpoAudio`
  without, artifacts named `EXAV.xcframework`) → `resolveSpmPackagesCheck` returns `null`, and
  `runPrebuildEquivalence:88` then PRINTS "No SPM package dependencies declared, so there was
  nothing more to check" and exits 0. Constructed config, not today's corpus — my census stands.

**New findings I did not have, all folded into the 6b spec:**
- **S4 → item 7 (MUST).** Round 6a hoisted `assertSameBuild` only. The manifest flavour check still
  runs AFTER the verdict is printed: on real `expo-image` artifacts the command printed "Equivalent
  — same exported symbols, same public interface, same structure." and only then threw. Exit code
  correct, so CI is safe; the operator reads green first. Same defect class, different hat. I
  required the fix be STRUCTURAL, not one more hoisted call — `:76` and `:124` both run the
  agreement checks today, which is why the property is invisible.
- **S1 → item 8.** The PRODUCT leg of `assertSameBuild` (`:178`) is untested: neutering only that
  row leaves 125 pass / 0 fail. Package and flavour legs are bound; this one is not.
- **S2 → item 9.** `XCFrameworkComparison.ts:333` silently ignores a one-sided
  `.package.swiftinterface`; deleting the skip changes no test. A permissive skip with zero coverage
  in the file whose job is refusing to pass unexamined differences.
- **Claim 4 REFUTED → item 10 (MUST). The collateral gate has NEVER run.** Repo-wide grep: referenced
  only from `.claude/` notes — no `package.json` script, no workflow, no `et` command.
  `tools/package.json:test` is `pnpm build && node --test 'build/**/*.test.js'`; `scripts/` is not
  compiled into `build/` and `.cjs` does not match `*.test.js`. Round 5 was asked to wire it in or
  give it an explicit invocation and did NEITHER. It enforces byte-identical manifests for
  non-migrated packages — half the acceptance criterion for steps 3-9. **It now has an owner**: I
  extended the 6b fence to `tools/package.json` plus adding/moving one file, and required it be
  demonstrated both collected-and-passing and going red against an altered manifest.

**Claims 1-3 CONFIRMED.**
- Claim 2 closes astra's verification gap: `rm -rf build cache` → build exit 0 →
  **149 suites / 652 tests / 649 pass / 0 fail / 3 skipped**, exactly as reported. `tsc` 0,
  `eslint --max-warnings 0` 0.
- Claim 1: the real-artifact `expo-image` demonstration reproduces, but only against the MAIN
  checkout's `.build` (read-only, `EXPO_ROOT_DIR` pointed there) — this worktree has no `.build`.
  Both defects shown refused on real artifacts.
- Red provenance: the reviewer does NOT treat round 6a's disclosed cycle-B gap as blocking, since 14
  injections independently establish test-boundness. **I accept that for step 2** — note it is the
  inverse of step 1, where the injections showed the call sites were NOT bound.
- Fence held (mtimes confirm only the four intended files). Worktree byte-identical after review;
  all mutations in a scratch copy.

**DISPATCHED: step 2 round 6b** — `opus-implementer`, high, spec
`.claude/specs/step-2-round6b-place-the-artifact.md`, now **ten items, three must-fix (1, 7, 10)**.
Holds the build slot.

**Step 1 round 8 is specced and QUEUED behind it** —
`.claude/specs/step-1-round8-bind-the-call-sites.md`. Do not dispatch until 6b reports: both build,
and concurrent `tools/` builds share outDir + tsbuildinfo and produce a wrong pass/fail.

## Step 2 round 6b — CODE-COMPLETE 2026-09-18; my rulings on its 3 open questions

All ten items implemented. **GREEN: 156 suites / 686 tests / 683 pass / 0 fail / 3 skipped**
(baseline 149/652; +7 suites, +34 tests, same 3 pre-existing skips). `pnpm build` 0, `tsc` 0,
`lint --max-warnings 0` 0. No `any`. Fence held; `PackageLocalBuild.ts` imported not edited, and
`tools/package.json` did NOT need editing after all (see item 10).

- **Item 1** — parser split into `SHARED_BUILD_TREE` and `PACKAGE_LOCAL_BUILD` over a shared
  `OUTPUT_TAIL`; layout B's marker is `escapeRegExp(PACKAGE_LOCAL_BUILD_DIRECTORY)`, never retyped.
  New exported `ARTIFACT_PATH_LAYOUTS` is the single source for both the parser and the refusal
  message. 8 accepting rows proved (2 layouts × version prefix × scoping) plus 4 rejections
  including the near-miss spellings `my.build/…` and `my.expo-prebuild/…`.
- **Item 7 — made structural, as required.** `decideEquivalence(…, runtime: Omit<EquivalenceRuntime,
  'log'>)`: the deciding phase has no logger **in its type**, so it cannot print, and returns
  `{exitCode, lines}`. `runPrebuildEquivalence` only iterates that array. The duplicated agreement
  check is gone — `resolveSpmPackagesCheck` is now the single place every refusal happens, and
  `--skip-spm-packages-check` short-circuits INSIDE it (after the agreement checks) rather than
  bypassing it at the caller.
- **Item 10 — the gate now runs, and was shown failing.** Ported to
  `tools/src/prebuilds/SpmManifestCollateral.test.ts`; the orphan `.test.cjs` deleted.
  `tools/package.json` unchanged — the canonical `node --test 'build/**/*.test.js'` collects it once
  it is compiled. Collected as `ok 161`, 3/3. Red against altered manifests: `GATE_EXIT=1`, 154 ×
  `DIFF: <package>/<product>/<flavor>`. Gate path derived from `__dirname`, deliberately NOT
  `EXPO_ROOT_DIR` — a gate pointed at another checkout would pass having compared nothing.
- ⚠ **F69 paid off twice more:** two stale-build incidents (first item-1 red, first item-9 mutation)
  reported green from a stale `build/` after `pnpm build` exited 1. Both caught by the exit-status
  check and re-run.

**MY RULINGS on the three open questions — do not re-litigate:**
1. **Item 2 "last-wins" is unobservable — KEEP AS IMPLEMENTED, no change.** The agent is right that
   once two DIFFERING flavour segments are refused, every surviving case has last == first, so
   `.at(-1)` can never be the deciding clause. I will NOT narrow the refusal to make it reachable:
   a path carrying two different flavours genuinely cannot say which flavour its artifact is, and
   refusing is the safe reading. `.at(-1)` stays as defence in depth, and the ordering is visible in
   the refusal message (`release, then debug nearest the artifact`), asserted by both tests.
2. **Item 9 `.package.swiftinterface` skip — ACCEPT the skip.** Reasoning I accept: `package`-level
   API is reachable only within the same Swift package, never from a consumer of the built
   framework, and whether the file exists at all depends on the compiler receiving `-package-name`,
   which the two build systems under comparison handle differently. So one-sided presence is a fact
   about the build systems, not about the artifacts. Content IS still compared when both sides have
   one, and that is now test-bound. The agent flagged this itself as the one reversible call —
   correct practice; it is flagged to both reviewers as the call to attack.
3. **Item 4 reported-difference over refusal — ACCEPT.** Exit code is 1 either way so CI is equally
   protected, and a refusal thrown from inside the comparison loop would lose every other finding in
   the artifact.

**NEW OPEN ITEM (F80) — the collateral gate's base pin will go stale silently.**
`tools/scripts/check-spm-manifest-collateral.cjs` pins `base: '466da8e06a1'`, the current tip of this
worktree. As the branch advances the gate compares against an ever-older commit, and **nothing fails
loudly when it goes stale**. This is the defect class of the whole task, now sitting inside the gate
that is supposed to catch it. Not in 6b's scope and correctly not touched. **Must be resolved before
steps 3-9 rely on this gate** — it is half their acceptance criterion. No owner yet.

**DISPATCHED 2026-09-18, both running in parallel:**
- `astra-reviewer` (blind, `-s read-only`, xhigh) on step 2 round 6b. Told to attack item 9 hardest
  (the implementer's own flagged reversible call), item 1's leftmost-match scoping claim, item 7's
  "the type IS the guarantee" claim, and whether the item-10 gate could pass comparing nothing.
  Also asked to confirm/refute F80 rather than repeat it. Carries the F74 wrapper warning.
  **Read-only → no build slot.** Told another agent is editing other files concurrently and NOT to
  run the full suite.
- `opus-implementer` (high) on step 1 round 8, spec
  `.claude/specs/step-1-round8-bind-the-call-sites.md`. **Holds the build slot.** Told the
  equivalence files are out of its fence.
- Neither brief carries any prior verdict; both work blind.

**QUEUED, needs the build slot after round 8:** Claude `reviewer` fault-injection review of step 2
round 6b. It must attack the same four points astra is attacking, independently, plus verify the
686-test green from a clean rebuild. Do NOT dispatch it concurrently with a builder.

## Step 2 round 6b — astra-reviewer (blind, static), 2026-09-18: REQUEST CHANGES. My adjudication.

I verified every finding at source before ruling. Astra ran NO builds or tests (static review), so
its counts/lint/red-green say nothing — that must come from the Claude reviewer still queued.

- **Astra blocker 1 (item 7) — REJECTED AS STATED; a REAL defect found behind it.**
  Astra says `PrebuildEquivalence.ts:125` formats the verdict before dependency validation. **False.**
  `resolveSpmPackagesCheck` — which holds EVERY refusal (`assertSameBuild`, `assertOverridesAgree`,
  the `--manifest` requirement, `assertManifestMatchesFlavor`) — runs at **:120**, before
  `runtime.compare` (:121) and before `formatEquivalenceReport` (:125). Nothing prints inside
  `decideEquivalence`; the caller iterates `lines` at the end. A throw therefore emits no verdict.
  **Item 7's structural fix HOLDS.**
  **But:** `assertSpmPackagesResolved` (:132) RETURNS diagnostics rather than throwing. When
  `report.equivalent === true` and `spmPackagesOk === false`, exitCode is 1 and `lines[0]` is
  literally `'Equivalent — same exported symbols, same public interface, same structure.'`
  → **MUST FIX (6c): the verdict line must state the run's overall outcome, not just the artifact
  comparison.** Same "green first" class, surviving in the diagnostics path rather than the throw
  path. Astra found the right smell at the wrong line.
- **Astra blocker 2 (item 1, marker collision) — CONFIRMED mechanically, DEMOTED to should-fix.**
  I traced it: `/repo/packages/.build/.expo-prebuild/output/debug/xcframeworks/Foo.xcframework`
  matches `SHARED_BUILD_TREE` with `([^/]+)` = `.expo-prebuild`, so packageName is the marker. Also
  `(?:.+/)?` is greedy and can swallow a second `.build/<pkg>/output/` into the version prefix.
  Both constructions need a package directory named `.build` or a nested output tree — not
  realistic. But the package name selects which `spm.config.json` the dependency check reads, so a
  wrong one is a false pass in the only check that catches a dropped dependency. **Fix, consistent
  with the established principle: a path that cannot be placed UNAMBIGUOUSLY is refused, not
  guessed.** Refuse when both layouts match, or when a marker occurs more than once.
- **Item 9 (`.package.swiftinterface` one-sided skip) — I REVERSE MY OWN RULING. Astra is right,
  for a stronger reason than it gave.** I previously accepted the skip. **Decisive evidence I
  gathered:** the current pipeline emits **190 `.package.swiftinterface` files across 20 packages**
  in real Mode A output (`packages/precompile/.build`), including expo-camera, expo-image and
  expo-modules-core — the very packages being migrated. So the skip is live, widespread code, not
  dead. The implementer's premise — that existence depends on `-package-name`, "which the two build
  systems handle differently" — is **unverified**: `-package-name` appears nowhere in the pipeline
  (only in that comment), and Mode A emits the files regardless. Whether Mode B emits them is
  **unknowable until step 3**. So the skip would hide precisely a Mode A/B divergence, on a file the
  harness looked at and chose to ignore. That is this task's defect class with extra steps.
  → **MUST FIX (6c): report it as a difference.** Astra's SE-0386 argument is secondary; this is the
  operative reason. (My earlier acceptance is superseded — do not re-apply it.)
- **Item 6 — CONFIRMED, the gap MOVED rather than closed.**
  `XCFrameworkComparison.ts:65` `SWIFT_INTERFACE_IN_FRAMEWORK` excludes EVERY `.swiftinterface`
  under any `*.framework/`, but `findSwiftInterfaces` (`SwiftInterfaceChecks.ts:64-79`) scans only
  `<framework>/Modules/*.swiftmodule/`. So `Foo.framework/Extras/Loose.swiftinterface` is excluded
  from the tree compare AND never indexed — invisible to both, which is the original item-6 defect
  in a narrower form. **Fix: exclude exactly what `findSwiftInterfaces` indexes, nothing wider.**
- **Item 3 sibling naming — CONFIRMED spec miss.** The `--skip-spm-packages-check` path returns
  before reading the config, so the report cannot name sibling dependency-bearing products as the
  spec required. Minor (the user asked for the skip) but it is what the spec said.
- **Diagnostics at `:220` and `:387` — ACCEPTED.** Raw read errors with no what/why/how.
- **Astra found sound, no issue:** items 2, 4, 5, 8, 10.

**F80 — REFUTED, closed.** The implementer worried the gate's pinned base would go stale silently.
It will not: the gate uses `git show <base>:<file>` and `git archive <base>`, so as the branch
advances every newly-migrated package shows as a diff and the gate FAILS LOUDLY. `--exclude
<npm-package>/<product>` (repeatable, documented at `check-spm-manifest-collateral.cjs:4`) is the
designed workflow for each migration, alongside `--base`. Astra reached the same conclusion
independently. No action; steps 3-9 must remember the `--exclude` per migrated product.

**Next:** do NOT spec round 6c until the Claude fault-injection review of 6b lands — it is still
owed, needs the build slot (held by step 1 round 8), and 6c must fold both reviews.
Known 6c contents so far: verdict line (must), item 9 reversal (must), item 6 narrowing, item 1
ambiguity refusal, item 3 sibling naming, two error messages.

## Step 1 round 8 — CODE-COMPLETE 2026-09-18; both reviews dispatched

**GREEN: 156 suites / 691 tests / 688 pass / 0 fail / 3 skipped** (baseline 156/686; +5).
`pnpm build` exit 0 on all 7 runs, `tsc` 0, `lint --max-warnings 0` 0, no `any`.
`SPMGenerator.ts` / `SPMPackage.ts` touched ONLY for the injections and restored byte-identical
(md5 verified before/after).

- **Item 1 DELIVERED EXACTLY AS SPECIFIED — the call sites are now independently bound.**
  New `fixtureBehindSymlink()`: `vendor/link` → real `packages/anchor`, so `vendor/link/../fixture`
  is lexically `vendor/fixture` (decoy manifest declaring target `Decoy`) and canonically
  `packages/fixture` (real manifest declaring `Main`). **Both manifests parse**, so a regressed
  caller SUCCEEDS with the wrong manifest rather than erroring — the tests assert WHICH was
  consumed, not merely that something was.
  - Injection A (`SPMGenerator.ts:146` → raw `pkg.path`): 93 / 92 pass / **1 fail** — only
    `stages the canonical manifest` red; the SPMPackage test stayed green.
  - Injection B (`SPMPackage.ts:1364` → raw `pkg.path`, generator restored first): 93 / 92 / **1
    fail** — only `writes the canonical manifest targets` red (written manifest contained
    `targets: ["Decoy"]`); the generator test stayed green.
  - Each test binds exactly one caller. This is what round 7 lacked.
- **Item 3 — genuine red → green.** RED 93 / 91 / 2 fail (both debug lines failed the remediation
  regex), GREEN 93 / 93 / 0.
- **Item 2 — DISCLOSED GAP, accepted.** Deleting the `node_modules` exclusion line left both tests
  green, because `isFirstPartyPackagePath` already rejects such paths on its own component check and
  on depth. So the test holds the BEHAVIOUR but does not uniquely bind that line; binding it uniquely
  would need a production change (out of scope). **Consequence worth carrying: the explicit
  `node_modules` check is redundant defence-in-depth, not the sole guard.** Reviewer asked to judge
  whether the two mechanisms can ever disagree.
- **Two process notes, both good:** a splice misfired mid-work (dropped an assertion from
  `assertManifestDiagnostic`, left a stray brace), was caught on re-read and repaired **before any
  run** — exactly the behaviour demanded after round 7's provenance failure. And `prettier --check`
  flags 6 hunks in `CheckedInManifest.test.ts`, **all in pre-existing code, none in the additions**;
  left alone deliberately. `tools/AGENTS.md` lists only build/tsc/lint as CI, so this is not a gate —
  but the repo is inconsistent about prettier. No action.

**DISPATCHED 2026-09-18, both running in parallel:**
- `reviewer` (Claude, fresh) on **step 2 round 6b**: fault injection across all ten items, plus three
  independent determinations — ordering on paths where a check REPORTS failure rather than throwing,
  the 691 count from a clean rebuild, and whether the ported collateral gate can be made to pass
  while comparing nothing. **Holds the build slot.** Brief carries no prior verdict — blind.
- `astra-reviewer` (blind, `-s read-only`, xhigh) on **step 1 round 8**: judge whether the two tests
  genuinely discriminate between callers, whether the decoy fixture makes a regressed caller succeed
  (not merely error), and whether the disclosed item-2 redundancy is acceptable. **No build slot.**

## Step 1 round 8 — astra-reviewer (blind, static), 2026-09-18: APPROVE with should-fix. My adjudication.

**Item 1 direct answer from astra: YES — the two call sites are now genuinely and independently
bound.** It traced both tests, confirmed the fixture uses a REAL symlink, and confirmed the decoy
manifest parses so a wrong-path read yields wrong OUTPUT rather than an error. That closes the gap
astra itself found in round 7. Step 1's core is done.

**Astra's "SPMGenerator.ts / SPMPackage.ts still differ from HEAD" — FALSE ALARM, I verified.**
Both call sites read `const checkedInRoot = resolveCheckedInManifestRoot(pkg)` and pass
`checkedInRoot` (`SPMGenerator.ts:144-146`, `SPMPackage.ts:1362-1364`). No injection was left behind.
They differ from HEAD because **round 7's rewiring is uncommitted** — they were already `M` at
session start. Astra flagged it honestly as "may predate round 8"; it does. Likewise
`CheckedInManifest.*` being untracked is expected (new files).

**⚠ CORRECTION — my previous ledger note on item 2 was WRONG. Astra found the disagreeing case.**
I recorded that the explicit `node_modules` check is "redundant defence-in-depth". It is not.
`isFirstPartyPackagePath` (`CheckedInManifest.ts:60-66`) computes `path.relative(packagesRoot,
packagePath)` and inspects only the RELATIVE parts. So when the packages root is itself inside a
dependency tree — `packagesRoot = /repo/node_modules/expo/packages`, candidate
`/repo/node_modules/expo/packages/fixture` — the relative path is just `fixture`: no `..`, no
`node_modules`, depth 1 → **containment PASSES**. Only the absolute-path exclusion at `:100` rejects
it. **The line is load-bearing and is the sole guard for that shape.**
The implementer's fault injection was insufficient, not wrong: deleting the line left the tests green
because no test uses a packages root inside `node_modules`. Rejecting is the correct behaviour
(it falls back to Mode A, the safe direction), so this is a COVERAGE gap, not a behaviour bug.

**Step 1 round 9 — QUEUED, small, three items. Do NOT dispatch while a builder holds the slot.**
1. Test for the disagreeing shape above: a packages root inside `node_modules`, proving the exclusion
   at `:100` is what rejects it (delete the line → this test must go red).
2. `CheckedInManifest.test.ts:937` — the test is named `review 11 resolves a package reached through
   a symlink…` but its fixture uses only a lexical `..` with NO symlink. Round 8 added the real
   symlink tests alongside it and left the misleading name. Rename to say what it actually covers;
   a name that overstates coverage is how a future reader concludes a case is tested when it is not.
3. `CheckedInManifest.ts:110` — "one directory under it" is unclear; name `${packagesRoot}` directly.
Small enough to do in-thread (one test file + one comment line) once the slot is free.

**Provenance:** astra could not verify round 8's red/green or counts (static review, no injection
logs). The Claude reviewer currently running on step 2 round 6b runs the FULL suite, which now
includes round 8's tests, so its observed count will independently cover them.

## Step 2 round 6b — Claude `reviewer` fault injection, 2026-09-18: CHANGES-REQUIRED. Adjudicated.

**16 injections, 15 red.** Baseline 35 suites / 156 tests targeted. Worktree byte-identical after;
all mutations in a scratch copy. Counts INDEPENDENTLY CONFIRMED from a clean rebuild:
**156 suites / 691 tests / 688 pass / 0 fail / 3 skipped**, `tsc` 0, `lint` 0 — this also covers
step 1 round 8's tests, closing astra's provenance gap on those counts.

- **Item 7 ordering — CONFIRMED FAILING, with a verbatim screen dump.** Throwing refusals ARE
  hoisted (my earlier ruling stands: astra's cited line was wrong). But the NON-throwing path was
  untouched: `:125` formats the verdict before `assertSpmPackagesResolved` at `:132`, and `:141`
  puts it at `lines[0]`. A run that exits 1 prints "Equivalent — same exported symbols…" first and
  "exit code: 1" last, with **nothing anywhere saying the run failed**. The doc comment at
  `:107-113` overstates: unreachable `log` orders printing vs deciding, not `verdict` vs
  `diagnostics` inside `lines`. → 6c item 1.
- **Item 6 gap — CONFIRMED SURVIVING, reproduced.** A carries
  `Demo.framework/Modules/Loose.swiftinterface`, B does not, all else identical → `differences: 0,
  equivalent: true`. Matches astra and my own trace. → 6c item 2.
- **NEW must-fix — a test that passes for the WRONG REASON.** `PrebuildEquivalence.ts:287`'s package
  leg is NOT test-bound: neutering that row alone leaves 156/156 green. The test at
  `.test.ts:653-667` asserts `/expo-image[\s\S]*expo-video/`, but the message BEGINS with the two
  full artifact paths, which already contain both names — so it passes off the ARTIFACT row. Same
  shape as round 6b's item 8, one row over. This is the task's defect class inside a test. → 6c item 3.
- **NEW must-fix — the collateral gate WILL FAIL IN CI, and this REOPENS F80 in a new form.**
  `check-spm-manifest-collateral.cjs:18` pins `base: '466da8e06a1'`, reached via `git ls-tree/show/
  archive`; `.github/workflows/expotools.yml:22` checks out with no `fetch-depth`, i.e. depth-1,
  where that object does not exist → `fatal: not a tree object`, raw stack, all three tests fail.
  **F80 restated correctly:** the implementer said a stale base degrades silently (wrong); astra said
  it fails loudly (right but incomplete); it fails loudly **in CI, immediately, for the wrong
  reason**. → 6c item 4.
- **NEW must-fix — baseline rot.** `checkInventory` (`:55-74`) asserts the product inventory equals
  the frozen SHA's, so ANY unrelated PR adding or removing an `spm.config.json` product turns the
  whole expotools job red. I specified the semantics in 6c item 5: in both → must be byte-identical;
  baseline-only → FAIL (a vanished product IS collateral damage); current-only → INFORMATIONAL.
- **The gate does gate.** Independently altered a manifest → 154 DIFF lines, `GATE_EXIT=1`. The
  reviewer could not make it pass while comparing nothing: four separate guards block every empty
  route. `production-depth` confirmed live, not vacuous.
- Should-fix folded into 6c: the hoist regressed the missing-artifact error to a raw ENOENT stack
  (item 7); the `--skip-spm-packages-check` sibling naming (item 10); two raw error messages (item 9);
  gate runtime ~36s of a 38s suite because `runGate` runs 3× (item 11); a misnamed preload (item 12).

**⚠ I REVISE MY OWN REVERSAL on item 9 (`.package.swiftinterface`). The skip STAYS.**
I reversed it earlier on the evidence that 190 such files exist across 20 packages, concluding the
skip might hide a Mode A/B divergence. That evidence proved the skip is LIVE code; it did not prove
it hides anything harmful. The reviewer supplied the missing piece: **for an xcframework consumed by
an app, package-level API is unreachable**, so a one-sided `.package.swiftinterface` cannot change
what any consumer can do. Astra's SE-0386 argument is about same-package SOURCE consumers and does
not apply to a precompiled binary consumed cross-package. Decision bound by tests at
`XCFrameworkComparison.test.ts:357` and `:368`; one-sided `.private.swiftinterface` still reported.
**What was genuinely wrong is the stated REASON**, not the decision → 6c item 8 corrects the comment
and drops the unverified `-package-name` claim.

**SETTLED, recorded so no future round "fixes" it:** the "last-wins" flavour leg is **unbindable by
construction**. With the ambiguity refusal in place, two distinct flavours throw and the same flavour
twice has `first === last`, so `named[0]` and `named.at(-1)` are provably equivalent — injection B1
stayed green for that reason. The implementation is right; the tests are honest. Do not add a
phantom assertion.
**Fence note:** `SwiftInterfaceChecks.ts:64` went `function` → `export function` in round 6b, outside
that round's fence. Accepted; 6c item 2 licenses the file.

## Next step (2026-09-19) — round 6c RUNNING, round 9 queued

**Backup done (USER request 2026-09-19).** Everything that was uncommitted is now committed
and pushed to `origin/chrfalch/expo-swift-manifests`:
- `96945f98863` — source: Mode B + equivalence harness (`tools/`).
- `cea69733b28` — session state: specs, ledger, astra reports. **DROP THIS COMMIT BEFORE THE PR.**
  `.claude/ledger.md` is in the global gitignore, so it was force-added; it will not pick up
  later edits on its own — re-add it with `-f` when backing up again.
Base `466da8e06a1` is now reachable from the branch, so the collateral gate's baseline
resolves locally. Item 4's CI failure is about the shallow clone in Actions, not the worktree.

**Routing change (USER 2026-09-19): use Codex implementers, not Claude, to save tokens.**
Round 6c went to `astra-implementer` (gpt-6-astra, xhigh) rather than `opus-implementer` —
these specs are hard and crisply specified, which is Astra's tier; sol fills gaps on work
this size. Round 9 is genuinely mechanical and goes to `sol-implementer`.

1. **Step 2 round 6c — DISPATCHED 2026-09-19, astra-implementer xhigh, IN FLIGHT.**
   Spec `.claude/specs/step-2-round6c-say-what-happened.md`. Six must-fix, six should-fix.
   **Holds the build slot.**
2. **Step 1 round 9 — QUEUED, spec written:** `.claude/specs/step-1-round9-name-what-is-covered.md`.
   Three items, no behaviour change. Owner `sol-implementer`. **Needs the build slot — dispatch
   only after 6c reports.** Concurrent `tools/` builds share one outDir and tsbuildinfo, so a
   parallel run reports a wrong pass/fail.
3. Then: step 2c (F73), step 2d (F76/F75), then step 3 (expo-haptics pilot) — still the first
   real migration.

Both rounds need review by a fresh agent before acceptance.
