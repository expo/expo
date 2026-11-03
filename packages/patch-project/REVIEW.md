# Review guidance for patch-project

The autonomous reviewer reads this file with the repository's acceptance criteria. It adds
what is specific to this package. It never lowers the criteria. Paths are relative to this
directory.

## Model

A patch is a diff against the prebuild template, applied at `withFinalizedMod` time. A fix
that works around that model fails right solution.

## Layers

- CLI flow lives in `src/cli/`.
- Plugin behavior lives in `src/withPatchPlugin.ts`.
- Git calls live in `src/gitPatch.ts` and go through `@expo/spawn-async` argv arrays. A shell
  string fails clean solution.

## What failure looks like here

- The patch applies on the first `prebuild` and fails on the second with `--no-clean`. Walk
  the second run before you report, and name the write that breaks idempotency.
- Paths resolve against the wrong root in a monorepo. `getPatchPathArgsAsync` in
  `src/gitPatch.ts` exists for this.
- The user's `android/` or `ios/` directory is moved aside and not restored when a step
  throws. Every move in `src/cli/patchProjectAsync.ts` needs a restore path.
- A warning replaces an error the user needed, or the reverse. `WarningAggregator` is the
  documented channel for a project shape the plugin skips.

## Always needs a human

- The apply and reverse logic in `src/gitPatch.ts`.

## Tests

- A change to the prebuild flow needs an e2e case in `e2e/__tests__/`.
