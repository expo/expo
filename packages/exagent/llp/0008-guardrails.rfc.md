# 0008: Guardrails for Agent-Driven Expo Workflows

**Type:** RFC
**Status:** Draft
**Systems:** `expo-mcp` tools; smart start plan contract
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]]

## Summary

Cheap mechanisms that make it safe for a driving agent to act autonomously on an Expo project. All [inferred] brainstorm candidates.

- **Checkpoints.** Auto git snapshot before each action batch; `exagent undo` restores.
- **Plan-with-cost dry run.** Before acting, emit the plan with time-class estimates ("prebuild ~2 min, pod install ~4 min, dev build ~8 min") for one-shot approval. The smart start `--plan` contract ([[0004-smart-start-and-project-state]]) is the first implementation.
- **Permission tiers.** Tools declare impact (read-only / mutating / long-running-expensive) in their MCP metadata so driving agents can map them onto their own permission systems. Expo does not run the permission prompt itself under Shape 1; it supplies honest metadata.
- **Untrusted-content marking** [confirmed — Kudo accepted, 2026-08-20; design inferred]. App logs, network payloads, and screenshots flow into agent context and can contain user- or attacker-controlled text (prompt injection). Tools that relay app-originated content mark it as untrusted data in the MCP response so driving agents can defend accordingly. Designed in from day one; cheap now, expensive to retrofit.

## Implemented in v1 as

[observed — 2026-08-22]

- **Checkpoints/undo**: `exagent checkpoint [--label]` + `exagent undo [--list|--id]`, auto-taken before `expo install`, `setup`'s AGENTS.md write, and `start --smart` plans containing prebuild (`--no-checkpoint` / `EXAGENT_NO_CHECKPOINT` to skip). Mechanism: temp-index `git add -A .` → `write-tree` → parent-linked `commit-tree` as an **unreferenced object** — HEAD/branches/index/reflog untouched; ids in `.expo/exagent-checkpoints.json` (capped at 20). Restore = `read-tree` + `checkout-index -a -f`: restores everything the checkpoint holds including since-deleted files, **never deletes** files created after it (documented limit), reports restored/kept counts. Gitignored files are in no checkpoint (hence the `install-dependencies` follow-up); `git gc --prune=now` can reap old snapshots (`CHECKPOINT_OBJECT_MISSING` names it).
- **Plan-with-cost dry run**: shipped as `exagent start --plan` ([[0004-smart-start-and-project-state]]).
- **Untrusted-content marking**: shipped in the runtime commands ([[0005-runtime-loop-tools]]) — fenced blocks with marker-forgery neutralization.
- Not built: MCP impact metadata (no MCP server surface yet).

## Testing

Checkpoint/undo is deterministic (unit + e2e). Plan-emission is covered by the smart start tests. Impact metadata is schema-validated in tier 0 ([[0002-testing-and-evals]]).
