# exagent

Agent-native CLI on top of the Expo CLI family. `exagent` gives coding agents (and humans) deterministic, machine-readable entry points into Expo workflows. It invokes `expo`, `eas-cli`, `expo-doctor`, and friends as subprocesses — it does not import their internals.

Design documents: see `llp/0001-agentic-cli-on-expo-cli.rfc.md` and its child LLPs in this package.

## Commands

- `exagent setup` — set a project up for coding agents: link the agent skills of the installed packages, and maintain a managed block in the project's `AGENTS.md` describing the project and the commands that answer in a machine-readable shape.
- `exagent skills [sync|list|show|clean]` — discover agent skills shipped inside installed Expo modules (`skills/*/SKILL.md`) and link them into agent skill directories (`.claude/skills`, `.agents/skills`, ...).
- `exagent install <pkg>` — run `expo install`, then sync the installed package's skills.
- `exagent start` — run `expo start`, with agent-friendly output and skills sync.

## Status

Experimental. Commands and output formats may change.
