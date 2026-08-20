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

[confirmed — Kudo seed, 2026-08-18] SDK packages carry their own skill (usage, pitfalls, config-plugin notes); installed packages teach the driving agent automatically.

**Reference implementation exists** [observed — open PRs against `@expo/cli`, read 2026-08-20]: Kudo has built this as four PRs; direction [confirmed — Kudo, 2026-08-20]: copy most of that code, but move it out of `@expo/cli` into our CLI (`exagent`).

- [expo/expo#48592](https://github.com/expo/expo/pull/48592) — `npx expo skills` command (`sync`/`list`/`show`/`clean`): autolinking-based discovery of `skills/*/SKILL.md` in packages; symlinks into `.claude/skills`, `.agents/skills`, etc.; `.gitignore` maintenance; Windows junction handling. Unit + e2e tests included.
- [expo/expo#48972](https://github.com/expo/expo/pull/48972) — auto-sync the installed package's skills on `expo install` (`--no-agent-skills` opt-out).
- [expo/expo#48973](https://github.com/expo/expo/pull/48973) — auto-sync all skills shortly after `expo start` reaches idle (~3 s).
- [expo/expo#49018](https://github.com/expo/expo/pull/49018) — when a known agent CLI is detected, dump the installed module's `SKILL.md` into the agent's context on `expo install`, avoiding a manual `/reload-skills`.

This settles the discovery contract [confirmed — by the PR implementation]: a **directory convention, `skills/*/SKILL.md`**, discovered via autolinking — not a `package.json` field. Scope [confirmed — Kudo, 2026-08-20]: **co-located module skills** (e.g. `expo-sqlite/skills/`); distributing the general `expo/skills` repo content is out of scope for `exagent`.

**Migration** [confirmed — Kudo, 2026-08-20]: everything lands in `exagent`; the four PRs stay unmerged as proof-of-concept and the code is copied over. `exagent` ships its own `install` and `start` commands that wrap `expo install` / `expo start` as subprocesses and run skill sync (and later the smart-start engine, [[0004-smart-start-and-project-state]]) around them. `@expo/cli` gets no hooks.

## Knowledge tool candidates

All [inferred]:

- **Version-pinned docs lookup.** Answers from documentation matching the project's installed SDK version. Wrong-version API usage is a top agent failure mode. Concrete mechanism [confirmed — Kudo accepted, 2026-08-20; design inferred]: docs.expo.dev serves `llms.txt` / `llms-full.txt`-style files **per SDK version**; the lookup tool fetches the file matching the project's SDK. This also serves agents that never speak MCP.
- **API diff.** "What changed in expo-camera between SDK 52 and 54" — from changelogs and type diffs; feeds the upgrade workflow.
- **Example transplant.** Fetch the canonical, version-matched integration from `expo/examples` and adapt it into the project.
- **Dependency explainer.** Why a package is in the tree; which native module versions conflict; what `expo install --fix` intends to change and why.

## Workflow candidates built on these

- **Doctor auto-fix** [confirmed — feature list, 2026-08-18]: run `expo-doctor` (as a subprocess), then fix findings instead of printing them.
- **SDK upgrade workflow** [confirmed — feature list, 2026-08-18]: bump, `expo install --fix`, codemods, prebuild, build, boot-check — reused as a tier-2 eval scenario ([[0002-testing-and-evals]]).
- **Module authoring flow** [inferred]: `create-expo-module`, scaffold Swift/Kotlin/TS, build the example app, iterate against it.

## Testing

Skill discovery and doc/diff lookups are deterministic: unit tests + fixtures. The four reference PRs already carry unit + e2e tests [observed]; they migrate with the code. Doctor auto-fix and upgrade are eval scenarios with programmatic graders.

## Resolved

[confirmed — Kudo, 2026-08-20]

1. Auto-sync triggers live in `exagent`'s own `install` and `start` commands (which wrap the `expo` equivalents as subprocesses). The `--no-agent-skills` opt-out survives.
2. PRs #48592–#49018 will not merge; they are proof-of-concept. The code is copied into `packages/exagent`.
