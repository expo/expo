# 0003: Knowledge tools and skills

**Type:** RFC
**Status:** Active
**Systems:** `src/skills/`; SDK packages in `packages/`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

The distribution channel for Expo knowledge: skills shipped with the modules themselves.

## Skills shipped from Expo modules

SDK packages carry their own skill covering usage, pitfalls, and config-plugin notes. Installing a package then teaches the driving agent automatically. [confirmed, Kudo seed, 2026-08-18]

Discovery is a directory convention, `skills/*/SKILL.md`, found via autolinking, not a `package.json` field. Scope is co-located module skills (for example `expo-sqlite/skills/`). Distributing the general `expo/skills` repo content is out of scope for `@expo/agent-cli`. [confirmed, Kudo, 2026-08-20]

The code lives in this package, not in `@expo/cli`. Four proof-of-concept PRs against `@expo/cli` (#48592, #48972, #48973, #49018) stay unmerged. The code was copied here. [confirmed, Kudo, 2026-08-20]

`@expo/agent-cli install` and `@expo/agent-cli start` wrap `expo install` and `expo start` as subprocesses and run skill sync around them. The `--no-agent-skills` opt-out survives. `@expo/cli` gets no hooks.

Commands: `skills:sync`, `skills:list`, `skills:show`, `skills:clean`. Bare `skills` syncs (the group's default action).

## No published module ships a skill yet

Ten packages were checked for `skills/*/SKILL.md`. None ships one. So `skills:list` in a real project answers `{"skills": []}`, `skills:sync` links nothing, and `skills:show <pkg>` can only refuse.

That is a consequence of shipping the consumer first, not a defect. The producing half (a module carrying its own skill) has not shipped anywhere. The consuming half is complete: a `SKILL.md` written into a scratch `node_modules` is discovered through real autolinking, linked as a relative symlink, listed, printed, pruned, and cleaned.

Shipping the consumer before the producer is a decision.

## Skipped, not silent

A skill the sync could not link (a directory the user created holds the name, or two packages claim the same link name) is a `skipped` list, carrying the reason (`occupied` or `duplicate-name`) and, for a name clash, the package that kept the name. A report that lists what a command did and omits what it could not do is a report of a run with nothing left over ([[0021-honest-reports]]).

## Testing

Skill discovery is deterministic, so it gets unit tests and fixtures. The four reference PRs already carried unit and e2e tests, and those migrated with the code. The live suite `live-project` is where discovery runs over a real dependency graph rather than a fixture.

## Resolved

[confirmed, Kudo, 2026-08-20]

1. Auto-sync triggers live in `@expo/agent-cli`'s own `install` and `start` commands, which wrap the `expo` equivalents as subprocesses. The `--no-agent-skills` opt-out survives.
2. PRs #48592 through #49018 will not merge. They are proof of concept. The code is copied into `packages/@expo/agent-cli`.
