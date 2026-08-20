# 0008: Guardrails for Agent-Driven Expo Workflows

**Type:** RFC
**Status:** Draft
**Systems:** `expo-mcp` tools; smart start plan contract
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0003-smart-start-and-project-state]]

## Summary

Cheap mechanisms that make it safe for a driving agent to act autonomously on an Expo project. All [inferred] brainstorm candidates.

- **Checkpoints.** Auto git snapshot before each action batch; `exagent undo` restores.
- **Plan-with-cost dry run.** Before acting, emit the plan with time-class estimates ("prebuild ~2 min, pod install ~4 min, dev build ~8 min") for one-shot approval. The smart start `--plan` contract ([[0003-smart-start-and-project-state]]) is the first implementation.
- **Permission tiers.** Tools declare impact (read-only / mutating / long-running-expensive) in their MCP metadata so driving agents can map them onto their own permission systems. Expo does not run the permission prompt itself under Shape 1; it supplies honest metadata.

## Testing

Checkpoint/undo is deterministic (unit + e2e). Plan-emission is covered by the smart start tests. Impact metadata is schema-validated in tier 0 ([[0002-testing-and-evals]]).
