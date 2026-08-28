# 0003: Knowledge Tools and Skills Distribution

**Type:** RFC
**Status:** Final
**Systems:** `expo/skills` (external repo); SDK packages in `packages/`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Deterministic tools that answer the questions agents otherwise guess at, plus the distribution channel for Expo knowledge: skills shipped with the modules themselves.

## Skills shipped from Expo modules

[confirmed — Kudo seed, 2026-08-18] SDK packages carry their own skill covering usage, pitfalls and config-plugin notes. Installing a package then teaches the driving agent automatically.

**Reference implementation exists** [observed — open PRs against `@expo/cli`, read 2026-08-20]. Kudo has built this as four PRs. Direction [confirmed — Kudo, 2026-08-20]: copy most of that code, but move it out of `@expo/cli` into our CLI (`@expo/agent-cli`).

- [expo/expo#48592](https://github.com/expo/expo/pull/48592) — the `npx expo skills` command (`sync`/`list`/`show`/`clean`): autolinking-based discovery of `skills/*/SKILL.md` in packages, symlinks into `.claude/skills`, `.agents/skills` and similar, `.gitignore` maintenance, and Windows junction handling. Unit and e2e tests included.
- [expo/expo#48972](https://github.com/expo/expo/pull/48972) — auto-sync the installed package's skills on `expo install`, with a `--no-agent-skills` opt-out.
- [expo/expo#48973](https://github.com/expo/expo/pull/48973) — auto-sync all skills shortly after `expo start` reaches idle, at about 3 s.
- [expo/expo#49018](https://github.com/expo/expo/pull/49018) — when a known agent CLI is detected, dump the installed module's `SKILL.md` into the agent's context on `expo install`, which avoids a manual `/reload-skills`.

This settles the discovery contract [confirmed — by the PR implementation]: a **directory convention, `skills/*/SKILL.md`**, discovered via autolinking, not a `package.json` field. Scope [confirmed — Kudo, 2026-08-20]: **co-located module skills** (for example `expo-sqlite/skills/`). Distributing the general `expo/skills` repo content is out of scope for `@expo/agent-cli`.

**Migration** [confirmed — Kudo, 2026-08-20]: everything lands in `@expo/agent-cli`. The four PRs stay unmerged as proof of concept and the code is copied over. `@expo/agent-cli` ships its own `install` and `start` commands that wrap `expo install` and `expo start` as subprocesses and run skill sync around them, and later the smart-start engine of [[0004-smart-start-and-project-state]]. `@expo/cli` gets no hooks.

## Knowledge tool candidates

All [inferred]:

- **Version-pinned docs lookup.** Answers from documentation matching the project's installed SDK version. Wrong-version API usage is a top agent failure mode. Concrete mechanism [confirmed — Kudo accepted, 2026-08-20; design inferred]: docs.expo.dev serves `llms.txt` and `llms-full.txt`-style files **per SDK version**, and the lookup tool fetches the file matching the project's SDK. This also serves agents that never speak MCP.
- **API diff.** "What changed in expo-camera between SDK 52 and 54", answered from changelogs and type diffs. Feeds the upgrade workflow.
- **Example transplant.** Fetch the canonical, version-matched integration from `expo/examples` and adapt it into the project.
- **Dependency explainer.** Why a package is in the tree, which native module versions conflict, and what `expo install --fix` intends to change and why.

## Workflow candidates built on these

- **Doctor auto-fix** [confirmed — feature list, 2026-08-18]: run `expo-doctor` as a subprocess, then fix the findings instead of printing them. Deferred out of v1; see [[0017-deferred-commands]].
- **SDK upgrade workflow** [confirmed — feature list, 2026-08-18]: bump, `expo install --fix`, codemods, prebuild, build, boot-check. Reused as a tier-2 eval scenario ([[0002-testing-and-evals]]).
- **Module authoring flow** [inferred]: `create-expo-module`, scaffold Swift/Kotlin/TS, build the example app, iterate against it.

## No published module ships a skill yet, so the consuming half has no reach

[observed — 2026-08-28] Ten packages were checked for `skills/*/SKILL.md`: `expo-camera`, `@expo/ui`, `expo-router`, `expo-image`, `expo-build-properties` and `react-native-mmkv` as installed in a real SDK 57 scaffold, and `expo-sqlite`, `expo-notifications`, `expo-updates` and `expo-audio` straight off the registry. **None ships one.** So `@expo/agent-cli skills:list` in a real project answers `{"skills": []}`, `skills:sync` links nothing, and `skills:show <pkg>` can only refuse.

That is a consequence of §Resolved item 2 rather than a defect: the four reference PRs stay unmerged, so the *producing* half of this design — a module carrying its own skill — has not shipped anywhere. The consuming half is complete and works: `live-project` writes a `SKILL.md` into a scratch `node_modules` the way a module author would, and the four commands discover it through real autolinking, link it as a relative symlink, list it, print it, prune it and clean it.

It is written down because the asymmetry is invisible from inside the CLI. Every test of `skills:*` supplies its own skill, so a green suite says nothing about whether anything in the ecosystem provides one — and a v1 that advertises `skills:list` in `--help` and in the generated `AGENTS.md` block is advertising a command whose honest answer today is "no skills found". **Shipping the consumer before the producer is a decision, not an oversight**, and what it leaves open is whether one SDK package ships a skill in the same release.

## Testing

Skill discovery and doc/diff lookups are deterministic, so they get unit tests and fixtures. The four reference PRs already carry unit and e2e tests [observed], and those migrate with the code. Doctor auto-fix and upgrade are eval scenarios with programmatic graders.

**And one live suite, `live-project`** [added 2026-08-28], which is where the discovery runs over a real dependency graph rather than a fixture. It found **F131**: a skill the sync could not link — because a directory the user created holds the name — was a warning on stderr and nothing in the `--json` report, so the object read `linked: []`, `removed: []`, which is what a sync with nothing to do reports. There is a `skipped` list now, carrying the reason (`occupied` or `duplicate-name`) and, for a name clash, the package that kept the name. The rule behind it is [[0021-honest-reports]]'s: **a report that lists what a command did and omits what it could not do is a report of a run with nothing left over.**

## Resolved

[confirmed — Kudo, 2026-08-20]

1. Auto-sync triggers live in `@expo/agent-cli`'s own `install` and `start` commands, which wrap the `expo` equivalents as subprocesses. The `--no-agent-skills` opt-out survives.
2. PRs #48592–#49018 will not merge. They are proof of concept, and the code is copied into `packages/@expo/agent-cli`.
