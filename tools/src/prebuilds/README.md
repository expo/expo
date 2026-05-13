# Expo Prebuilds

This folder contains the iOS prebuild toolchain used by `et prebuild`.

The toolchain builds XCFramework artifacts from `spm.config.json` definitions, with optional verification and signing.

## Audience And Goals

This README is written for:

- Humans: to understand the system quickly and troubleshoot confidently.
- LLMs/automation: to follow stable sectioning, glossary terms, and explicit invariants.

## Quick Start

Run prebuild for one package:

```bash
et prebuild expo-modules-core
```

Common variants:

```bash
# Build only Debug
et prebuild -f Debug expo-modules-core

# Skip verify
et prebuild --skip-verify expo-modules-core

# Build only one product
et prebuild -n ExpoModulesCore expo-modules-core

# Build only one platform
et prebuild -p iOS expo-modules-core
```

## Key Concepts (Glossary)

- `Package`: one Expo or external package with `spm.config.json`.
- `Product`: one output product in `spm.config.json`.
- `Flavor`: build flavor (`Debug` or `Release`).
- `Unit`: execution identity `package/product@flavor`.
- `Run`: one `et prebuild` invocation.
- `Artifact cache`: shared external dependency cache (Hermes/React/etc.).
- `Generated sources`: staged source layout used by SPM builds.

## Command Entry Points

- CLI command shim: `tools/src/commands/PrebuildPackages.ts`
- Prebuild modules: `tools/src/prebuilds/*`
- Refactor plan: `tools/src/prebuilds/PREBUILD_REFACTOR_PLAN.md`

The command file should remain thin and delegate execution to prebuild internals.

## Main Modules

- `SPMGenerator.ts`: generates staged target source layout and `Package.swift`.
- `SPMPackage.ts`: renders `Package.swift` content from config.
- `SPMBuild.ts`: builds package targets with `xcodebuild`.
- `Frameworks.ts`: composes and post-processes XCFramework outputs.
- `Verifier.ts`: validates built XCFrameworks.
- `Dependencies.ts` / `Artifacts.ts`: resolve and cache build dependencies.
- `Utils.ts` / `ExternalPackage.ts`: discovery, versioning, validation helpers.

## Module Ownership Map

This map is the source of truth for where responsibilities should live.

| Area | Primary owner | Notes |
| --- | --- | --- |
| CLI wiring and flags | `tools/src/commands/PrebuildPackages.ts` | Keep as thin shim only. |
| Pipeline entrypoint | `tools/src/prebuilds/pipeline/Index.ts` | Receives normalized request from shim. |
| Contracts and shared types | `tools/src/prebuilds/pipeline/Types.ts` | Step contract, status/result types. |
| Runtime context | `tools/src/prebuilds/pipeline/Context.ts` | Paths, resolved artifacts, cancellation, run state. |
| Step orchestration | `tools/src/prebuilds/pipeline/Executor.ts` | Sequencing, error policy, status transitions. |
| Run-scope steps | `tools/src/prebuilds/pipeline/RunSteps.ts` | Discovery, validation, versioning, artifact prep, reporting hooks. |
| Package-scope steps | `tools/src/prebuilds/pipeline/PackageSteps.ts` | Scoped clean and package-level prep hooks. |
| Product-scope steps | `tools/src/prebuilds/pipeline/ProductSteps.ts` | Codegen, generate, build, compose, verify. |
| Summary and error log output | `tools/src/prebuilds/pipeline/Reporter.ts` | Final reporting from canonical statuses. |
| SPM source staging | `tools/src/prebuilds/SPMGenerator.ts` | File layout/symlink mechanics. |
| `Package.swift` rendering | `tools/src/prebuilds/SPMPackage.ts` | Transform config to Swift package manifest text. |
| Build invocation | `tools/src/prebuilds/SPMBuild.ts` | `xcodebuild` build paths and arguments. |
| XCFramework composition | `tools/src/prebuilds/Frameworks.ts` | Slice composition, headers/modules, tarball outputs. |
| Verification | `tools/src/prebuilds/Verifier.ts` | Slice-level validation and diagnostics. |
| Artifact download/cache | `tools/src/prebuilds/Artifacts.ts`, `tools/src/prebuilds/Dependencies.ts` | Shared cache resolution (`run x flavor`). |

## Build Flow

Current high-level flow:

1. Discover/validate packages and options.
2. Resolve versions and local tarball inputs.
3. Resolve artifact cache per flavor.
4. For each package/product/flavor unit:
   - generate sources + `Package.swift`
   - build frameworks
   - compose XCFramework
   - verify XCFramework
5. Print summary and write error log when needed.

## Invariants And Policies

These are intentionally explicit so they can be relied upon by maintainers and tooling.

- Source of truth for outcomes is per-unit status records.
- Summary totals are derived from statuses.
- Execution model is sequential.
- Cancellation model is cooperative (stop scheduling new work, emit partial summary).
- Artifact resolution scope is `run x flavor`.
- `warning` status is currently only valid for verification stage.

For full architecture and phased decisions, see:
`tools/src/prebuilds/PREBUILD_REFACTOR_PLAN.md`

## Output Modes

Local interactive mode:

- Spinner + concise subtask progress.
- Terminal status per stage.

CI/non-interactive mode:

- No spinner animation.
- Stable line-oriented logs with key lines:
  - stage start
  - stage result
  - final summary
  - error log path (if any)

## Important Paths

- Config schema:
  - `tools/src/prebuilds/schemas/spm.config.schema.json`
- Generated build root (centralized):
  - `packages/precompile/.build/<package>/...`
- Artifact cache default:
  - `packages/precompile/.cache/...`

## Configuration Notes

Each package must define `spm.config.json` with:

- `products`
- target graph (`swift` / `objc` / `cpp` / `framework`)
- platforms
- optional external dependency metadata

Use the schema above for field-level reference.

## Troubleshooting

`No Package.swift file found`
- Ensure generate step ran and `spm.config.json` is valid.

`Missing artifacts`
- Check resolved RN/Hermes versions and tarball paths.
- Verify cache path and skip flags.

`Compose failed`
- Inspect build outputs for requested platform/flavor.

`Verify failed`
- Review slice-level diagnostics for headers/modules/typecheck/codesign.

## Contributor Rules

When changing prebuild behavior/architecture:

1. Update this README in the same PR.
2. Keep terminology consistent with glossary and plan.
3. Prefer explicit invariants over implicit assumptions.
4. Add/update tests for path logic and execution gating when relevant.

## LLM-Oriented Section (Deterministic)

If an automated tool edits prebuild code, it should preserve and update these items:

- Keep `tools/src/commands/PrebuildPackages.ts` as command shim.
- Keep canonical outcome state in statuses.
- Keep sequential execution unless plan section explicitly changes.
- Update both:
  - `tools/src/prebuilds/PREBUILD_REFACTOR_PLAN.md`
  - `tools/src/prebuilds/README.md`

If behavior changes, update:

- Build Flow section
- Invariants And Policies section
- Contributor Rules section
