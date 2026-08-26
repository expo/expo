# 0008: Guardrails for Agent-Driven Expo Workflows

**Type:** RFC
**Status:** Draft
**Systems:** `expo-mcp` tools; smart start plan contract
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]], [[0013-doctor-fix]], [[0016-v1-scope]]

> **Checkpoints: Deferred — reference (2026-08-26).** The `checkpoint` group and the automatic
> snapshots that `install`, `agents:setup` and a prebuilding `dev` plan took are out of the v1
> surface; the code is on the reference shelf at `src/deferred/checkpoint/`. The other three
> guardrails of this document — the plan-with-cost dry run, the permission tiers, and the
> untrusted-content marking — are unaffected and ship.
>
> **Why** [confirmed — Kudo, 2026-08-26]: **agents manage git themselves.** The premise of the
> feature was that a driving agent has no undo, and that stopped being true: the agents this CLI is
> built for commit, branch and revert as a matter of course, and a second snapshot mechanism beside
> git — one that writes unreferenced objects a `git gc` can reap, and that no `git log` shows — is a
> second thing to reason about rather than a safety net. The honest version of this guardrail is
> "commit before you start", which needs no command.
>
> **Re-entry criteria:** a driving agent is observed losing work this would have held — which means
> a case where the agent's own git was not enough, not merely a case where a snapshot would also
> have worked. The mechanism below is what it returns as, and `checkpoint:undo`'s documented limit
> (it never deletes files created after the snapshot) is the first thing to revisit if it does.

## Summary

Cheap mechanisms that make it safe for a driving agent to act autonomously on an Expo project. All [inferred] brainstorm candidates.

- **Checkpoints** [deferred out of v1 — see the banner above]. Auto git snapshot before each action batch; `exagent checkpoint:undo` restores.
- **Plan-with-cost dry run.** Before acting, emit the plan with time-class estimates ("prebuild ~2 min, pod install ~4 min, dev build ~8 min") for one-shot approval. The smart start `--plan` contract ([[0004-smart-start-and-project-state]]) is the first implementation.
- **Permission tiers.** Tools declare impact (read-only / mutating / long-running-expensive) in their MCP metadata so driving agents can map them onto their own permission systems. Expo does not run the permission prompt itself under Shape 1; it supplies honest metadata.
- **Untrusted-content marking** [confirmed — Kudo accepted, 2026-08-20; design inferred]. App logs, network payloads, and screenshots flow into agent context and can contain user- or attacker-controlled text (prompt injection). Tools that relay app-originated content mark it as untrusted data in the MCP response so driving agents can defend accordingly. Designed in from day one; cheap now, expensive to retrofit.

## Implemented in v1 as

[observed — 2026-08-22]

- **Checkpoints/undo** [deferred out of v1, 2026-08-26; what follows is what was built]: one colon group per [[0006-agent-native-cli-surface]] §The `exagent` launcher — `exagent checkpoint [--label]` (the bare group takes the snapshot), `exagent checkpoint:list`, and `exagent checkpoint:undo [--id]`; the top-level `exagent undo` and its `--list` flag are gone [confirmed — Kudo, 2026-08-22]. Auto-taken before `expo install`, `agents:setup`'s AGENTS.md write, and `exagent dev` plans containing prebuild (`--no-checkpoint` / `EXAGENT_NO_CHECKPOINT` to skip). Mechanism: temp-index `git add -A .` → `write-tree` → parent-linked `commit-tree` as an **unreferenced object** — HEAD/branches/index/reflog untouched; ids in `.expo/exagent-checkpoints.json` (capped at 20). Restore = `read-tree` + `checkout-index -a -f`: restores everything the checkpoint holds including since-deleted files, **never deletes** files created after it (documented limit), reports restored/kept counts. Gitignored files are in no checkpoint (hence the `install-dependencies` follow-up); `git gc --prune=now` can reap old snapshots (`CHECKPOINT_OBJECT_MISSING` names it).
- **Plan-with-cost dry run**: shipped as `exagent dev --plan`, and as the plan `exagent dev` prints before it runs it ([[0004-smart-start-and-project-state]]). Since that default executes, an interactive terminal is asked `Run this plan?` once when a step costs more than seconds (`src/dev/confirmPlan.ts`); `--yes` skips the question, `--json` and every non-interactive run are never asked, and a decline exits 0 having run nothing.
- **Untrusted-content marking**: shipped in the runtime commands ([[0005-runtime-loop-tools]]) — fenced blocks with marker-forgery neutralization.
- Not built: MCP impact metadata (no MCP server surface yet).

## The one command checkpoints do not protect

[added — 2026-08-24, with `exagent doctor:fix`; see [[0013-doctor-fix]]. Both commands are deferred
out of v1 (2026-08-26), so nothing below is shipped; the **general rule** at the end of the section
is what survives, and it applies to any command whose targets are gitignored.]

The line above — *gitignored files are in no checkpoint* — has been true since the first snapshot, and it read as a footnote for as long as every mutating command's damage was to tracked files. `doctor:fix` is the first command whose **whole subject** is gitignored: `node_modules`, `ios/Pods`, `.expo` and the Metro caches are exactly the files a checkpoint does not hold, and `checkpoint:undo` after one will restore nothing it deleted.

So the honesty has to travel with the artifact, not stay in this document. Two things follow, and both are shipped:

- **A checkpoint is still taken before `doctor:fix --apply` at `moderate` and above**, because it protects the one thing it can: a bare project's tracked `ios/` and `android/`, and a tracked `Podfile.lock` that `pod install` is about to rewrite. The `safe` tier takes none — it deletes nothing tracked, so there would be nothing for one to hold.
- **The snapshot ships with the sentence that says what it is not**, on the human output and as `checkpoint.note` in `--json`. Not a disclaimer: an agent that reads `Checkpoint 22a3cfd9` and infers a safety net will run the aggressive tier believing an undo exists for `node_modules`, and there is none. What actually puts those files back is the plan's own reinstall steps, and the note says so.

The general rule this makes explicit, for the next command like it: **a command whose targets are gitignored must state that its checkpoint does not cover them, in the same output that names the checkpoint.** Printing an id and letting the reader infer the guarantee is worse than printing no id at all.

## Testing

Checkpoint/undo is deterministic (unit + e2e); the suites moved to `src/deferred/checkpoint/__tests__/` with the code and are not run. Plan-emission is covered by the smart start tests. Impact metadata is schema-validated in tier 0 ([[0002-testing-and-evals]]).
