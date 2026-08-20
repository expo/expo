# 0003: Knowledge Tools and Skills Distribution

**Type:** RFC
**Status:** Draft
**Systems:** `expo/skills` (external repo); SDK packages in `packages/`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Deterministic tools that answer questions agents otherwise guess at, plus the distribution channel for Expo knowledge: skills shipped with the modules themselves.

## Skills shipped from Expo modules

[confirmed — Kudo seed, 2026-08-18] SDK packages carry their own skill (usage, pitfalls, config-plugin notes). Discovery mirrors how `expo-mcp` is resolved from the project [observed — `resolveFrom.silent` pattern in `packages/@expo/cli/src/start/server/MCP.ts`]: scan `node_modules` for a declared skill entry — `expo.skills` in `package.json` or a `skills/` directory (contract TBD, open question in [[0001-agentic-cli-on-expo-cli]]). Installed packages then teach the driving agent automatically. The same contract exports to other agents' formats (Claude Code, Cursor), making Expo packages self-documenting for the whole ecosystem. [inferred]

## Knowledge tool candidates

All [inferred]:

- **Version-pinned docs lookup.** Answers from documentation matching the project's installed SDK version. Wrong-version API usage is a top agent failure mode.
- **API diff.** "What changed in expo-camera between SDK 52 and 54" — from changelogs and type diffs; feeds the upgrade workflow.
- **Example transplant.** Fetch the canonical, version-matched integration from `expo/examples` and adapt it into the project.
- **Dependency explainer.** Why a package is in the tree; which native module versions conflict; what `expo install --fix` intends to change and why.

## Workflow candidates built on these

- **Doctor auto-fix** [confirmed — feature list, 2026-08-18]: run `expo-doctor` (as a subprocess), then fix findings instead of printing them.
- **SDK upgrade workflow** [confirmed — feature list, 2026-08-18]: bump, `expo install --fix`, codemods, prebuild, build, boot-check — reused as a tier-2 eval scenario ([[0002-testing-and-evals]]).
- **Module authoring flow** [inferred]: `create-expo-module`, scaffold Swift/Kotlin/TS, build the example app, iterate against it.

## Testing

Skill discovery and doc/diff lookups are deterministic: unit tests + fixtures. Doctor auto-fix and upgrade are eval scenarios with programmatic graders.
