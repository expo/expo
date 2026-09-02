# Agent instructions — @expo/agent-cli

<!-- BEGIN LLP MANAGED BLOCK (llp-adopt) -->

## LLP

This package's design lives in Linked Literate Programming (LLP) documents in `llp/`.

- Start with `llp/0000-expo-monorepo.explainer.md` (orientation) and `llp/0001-agentic-cli-on-expo-cli.rfc.md` (the umbrella RFC and index).
- Before changing a subsystem, read the LLPs whose `**Systems:**` header covers it, and follow `@ref llp/...` comments from the code.
- Capture significant design decisions as new LLPs (`llp/NNNN-slug.type.md`, start as `Draft`).
<!-- END LLP MANAGED BLOCK (llp-adopt) -->

Key constraints (from `llp/0001`): invoke the Expo CLI family (`expo`, `eas-cli`, `expo-doctor`, `fingerprint`, `create-expo`) as subprocesses. Never import `@expo/cli` internals. Ship no model and no API keys (Shape 1). Testing first, per `llp/0002`. The kernel is `llp/foundation/`. Work in play is `llp/current/`.
