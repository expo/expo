# 0001: An agentic CLI on top of Expo CLI

**Type:** RFC
**Status:** Active
**Systems:** `packages/@expo/agent-cli`; `packages/@expo/cli`; `packages-detached/expo-agent-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18
**Revised:** 2026-09-02
**Related:** [[0000-expo-monorepo]]

## Summary

Make Expo the best framework to develop through an agent.

**Shape 1:** Expo ships the tool layer, not the model. [confirmed, Kudo, 2026-08-18] The product is deterministic, agent-facing tools plus official skills. The intelligence comes from whatever agent the user already runs: Claude Code, Cursor, the Claude mobile app. No model, no API key, and no billing anywhere in the product. Models appear only in CI, to run the eval suite.

The `@expo/agent-cli` bin ships as a thin, model-free launcher. Shipping is gated on heavy tests and evals. What is not in this release lives in [[0017-deferred-commands]].

## Motivation

Generic coding agents drive Expo CLI through raw terminal output. They guess when to prebuild, when to rebuild, and when a restart is enough. Expo owns the ground truth for these decisions.

An Expo-built tool layer lets any driving agent read structured CLI state, encode Expo-specific decision rules (CNG, dev clients, Expo Go), and see the running app through this CLI's runtime commands.

## Constraints

[confirmed, Kudo, 2026-08-18]

1. The code lives in the `expo/expo` repository.
2. The command can be an entirely new bin, not necessarily an `expo` subcommand.
3. Testing must be heavy. An eval suite must gate shipping. Testing infrastructure is built first [confirmed, Kudo, 2026-08-20].
4. **Process boundary** [confirmed, Kudo, 2026-08-20]: implementation invokes the `expo` CLI as a subprocess as much as possible. It does not import `@expo/cli` code. The same boundary generalizes across the Expo CLI family: `expo`, `eas-cli`, `expo-doctor` (bin `expo-doctor`), `@expo/fingerprint` (bin `fingerprint`), `create-expo`, and more. Details: [[0006-agent-native-cli-surface]].
5. Feature areas are documented in separate LLPs. This document stays the umbrella: decisions, constraints, naming. The v1 command list is [[0016-v1-scope]].

## Status convention

See [[0000-expo-monorepo]] §Status convention. This corpus uses Draft, Active, Open, Deferred - reference, Superseded, and Tombstoned. This document is Active.

## Naming

The package is `@expo/agent-cli`, in `packages/@expo/agent-cli/`. Every command this repository prints or teaches is `npx @expo/agent-cli <command>`. [confirmed, Kudo, 2026-08-28] The scoped name matches the monorepo's other tools (`@expo/cli`, `@expo/fingerprint`) and shows the package comes from the Expo org.

The package declares one bin, `expo-agent-cli` → `bin/cli.js`. Help, `Try:` lines, the README, and the `AGENTS.md` managed block all print `npx @expo/agent-cli`. The bin name exists because `npx <package>` requires a declared bin.

`packages-detached/expo-agent-cli` is the npm package named `expo-agent-cli`, so `bunx expo-agent-cli` and `npx expo-agent-cli` resolve. It is outside `packages/`, so the SDK publish pipeline does not select it on its own. It has no dependency on `@expo/agent-cli`. Its bin reads its own `package.json` version and runs `@expo/agent-cli` at that same version, so `bunx expo-agent-cli@2.0.0` is `bunx @expo/agent-cli@2.0.0`. Publishing `@expo/agent-cli` also publishes this alias at the same version and dist-tag. The taught name stays `@expo/agent-cli`.

## Package layout

New workspace package `packages/@expo/agent-cli/`:

```
packages/@expo/agent-cli/       # model-free CLI (Shape 1). No agent loop.
├── bin/cli.ts                  # flat commands + colon groups
├── src/
│   ├── agents/                 # agents:setup: skills + AGENTS.md managed block
│   ├── skills/                 # skills sync/list/show/clean ([[0003-knowledge-tools-and-skills]])
│   ├── install/                # wraps `expo install` + skill sync + impact classification
│   ├── start/                  # wraps `expo start` + skill sync
│   ├── dev/                    # the plan engine ([[0004-smart-start-and-project-state]])
│   ├── status/                 # where the project is; impact lives under this command
│   ├── impact/                 # the change classifier the status command runs
│   ├── runtime/                # eval, errors, reload, stop, tree/tap/type
│   ├── inspect via builds/, config/
│   ├── deferred/               # reference shelf. Not a live command ([[0017-deferred-commands]])
│   ├── project/                # project-state probe
│   └── new/, deploy/           # headless creation and shipping ([[0007-deploy-and-headless]])
├── e2e/
├── e2e-live/
└── evals/
```

`@expo/agent-cli install` and `@expo/agent-cli start` wrap the `expo` equivalents as subprocesses. [confirmed, Kudo, 2026-08-20] `@expo/cli` gets no hooks.

Knowledge lives in co-located module skills ([[0003-knowledge-tools-and-skills]]). Runtime and decision tooling is self-serve in this package. [confirmed, Kudo, 2026-08-22]

`@expo/cli` stays lean.

## Product shape: tool provider, no model

Shape 1 consequences:

- New capabilities land as `@expo/agent-cli` commands and Expo skills, not as an agent loop.
- Agent-friendly affordances in `@expo/cli` itself (non-interactive parity, JSONL events, deterministic decision commands) serve every driving agent.

## Tool surface

Three layers, all machine-readable:

1. **The Expo CLI family as structured subprocesses.** The tool layer orchestrates `expo`, `eas-cli`, `expo-doctor`, `@expo/fingerprint`, `create-expo`, and more. `expo` already emits JSONL events via `installEventLogger` / `LOG_EVENTS`. Sibling CLIs without structured output get wrapped until they emit events natively.
2. **`expo-mcp` stays untouched. `@expo/agent-cli` is self-serve.** [confirmed, Kudo, 2026-08-22] Runtime capabilities are implemented inside `packages/@expo/agent-cli` as CLI commands. Published `expo-mcp` tools stay available to agents that connect to them.
3. **Expo-specific decision tools** built for the agent: the Expo Go compatibility check, the post-install impact classifier, the project-state probe.

## Design documents

Feature areas live in child LLPs. [confirmed, Kudo, 2026-08-20] The living index is [[0000-expo-monorepo]] §Index. What is not in v1 is [[0017-deferred-commands]].
