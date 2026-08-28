# 0008: Guardrails for Agent-Driven Expo Workflows

**Type:** RFC
**Status:** Final
**Systems:** `expo-mcp` tools; smart start plan contract
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]], [[0016-v1-scope]], [[0017-deferred-commands]]

## Summary

Cheap mechanisms that make it safe for a driving agent to act autonomously on an Expo project. All are [inferred] brainstorm candidates.

- **Checkpoints** [deferred from v1, 2026-08-26 — see [[0017-deferred-commands]]]. An automatic git snapshot before each action batch, with `@expo/agent-cli checkpoint:undo` to restore.
- **Plan-with-cost dry run.** Before acting, emit the plan with time-class estimates, as in "prebuild ~2 min, pod install ~4 min, dev build ~8 min", for one-shot approval. The smart start `--plan` contract ([[0004-smart-start-and-project-state]]) is the first implementation.
- **Permission tiers.** Tools declare impact in their MCP metadata, as read-only, mutating, or long-running-expensive, so driving agents can map them onto their own permission systems. Under Shape 1 Expo does not run the permission prompt itself. It supplies honest metadata.
- **Untrusted-content marking** [confirmed — Kudo accepted, 2026-08-20; design inferred]. App logs, network payloads and screenshots flow into agent context, and they can contain user- or attacker-controlled text, which is prompt injection. Tools that relay app-originated content mark it as untrusted data in the MCP response, so driving agents can defend accordingly. This is designed in from day one, because it is cheap now and expensive to retrofit.

## Implemented in v1 as

[observed — 2026-08-22]

- **Checkpoints/undo**: deferred from v1 on 2026-08-26. The design of what was built, the mechanism, the auto-snapshot points and the `checkpoint:undo` limit are all in [[0017-deferred-commands]], and the code is on the reference shelf at `src/deferred/checkpoint/`. Nothing in the v1 surface takes a snapshot. `runGitAsync` and `resolveWorkTreeAsync` did not go with it: `src/impact/` reads a diff through them, so they are `src/utils/git.ts` and are live.
- **Plan-with-cost dry run**: shipped as `@expo/agent-cli dev --plan`, and as the plan `@expo/agent-cli dev` prints before it runs it ([[0004-smart-start-and-project-state]]). Since that default executes, an interactive terminal is asked `Run this plan?` once when a step costs more than seconds (`src/dev/confirmPlan.ts`). `--yes` skips the question, `--json` and every non-interactive run are never asked, and a decline exits 0 having run nothing.
- **Untrusted-content marking**: shipped in the runtime commands ([[0005-runtime-loop-tools]]), as fenced blocks with marker-forgery neutralization.
- Not built: MCP impact metadata, because there is no MCP server surface yet.

## A command whose targets are gitignored

The case that produced this rule was `@expo/agent-cli doctor:fix` and the checkpoint it took. Both are
deferred, and both are designed in [[0017-deferred-commands]]. The rule itself is not about snapshots
and stays here, because it applies to any command this CLI grows whose subject is files git does not
track.

**A command whose targets are gitignored must state that its checkpoint does not cover them, in the
same output that names the checkpoint.** Printing an id and letting the reader infer the guarantee is
worse than printing no id at all. `node_modules`, `ios/Pods`, `.expo` and the Metro caches are the
files a snapshot of tracked content does not hold, so a reader who is handed a checkpoint id after a
command that deleted them has been given a safety net that does not exist. The general form: whatever
the recovery mechanism of the day is, an artifact that names it must also name what it leaves out.

## Testing

Checkpoint/undo was deterministic, with unit and e2e coverage. Its suites moved to `src/deferred/checkpoint/__tests__/` with the code and are not run (see [[0017-deferred-commands]]). Plan-emission is covered by the smart start tests. Impact metadata is schema-validated in tier 0 ([[0002-testing-and-evals]]).
