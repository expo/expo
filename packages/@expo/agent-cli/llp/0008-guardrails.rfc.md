# 0008: Guardrails for agent-driven Expo workflows

**Type:** RFC
**Status:** Active
**Systems:** `src/dev/planConsent.ts`; `src/utils/consent.ts`; runtime fences (`src/runtime/untrusted.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]], [[0016-v1-scope]], [[0017-deferred-commands]]

## Summary

Cheap mechanisms that make it safe for a driving agent to act autonomously on an Expo project.

Shipped: plan-with-cost dry runs, consent as a re-run, `--yes`, a TTY stop that exits 0 with `Nothing ran`, and untrusted-content fences.

Checkpoints are deferred. See [[0017-deferred-commands]]. Code is on `src/deferred/checkpoint/`. Nothing in the v1 surface takes a snapshot. `runGitAsync` and `resolveWorkTreeAsync` stayed live in `src/utils/git.ts` because `src/impact/` reads a diff through them.

MCP permission-tier metadata is not built. There is no MCP server. It is scoped out in [[0016-v1-scope]], not a v1 candidate.

## Plan-with-cost dry run

Before acting, emit the plan with time-class estimates, as in "prebuild ~2 min, pod install ~4 min, dev build ~8 min", for one-shot approval. The smart start `--plan` contract ([[0004-smart-start-and-project-state]]) is the first implementation. Shipped as `@expo/agent-cli dev --plan`, and as the plan `@expo/agent-cli dev` prints before it runs it.

## Consent is a re-run, never a prompt

This CLI asks no questions. [confirmed, Kudo, 2026-08-29] Where a guardrail used to open a prompt, the command now prints what it was about to do, prints the command that does it, and ends. Consent is the caller running that command.

An agent can give it. A `? Run this plan? › (Y/n)` needs a keystroke on a TTY. An agent driving this CLI through a pty gets the cursor and nothing to type into it. One driving it through a pipe used to get a different behaviour than the person who wrote its prompt saw. A command line is the one form of consent every caller can produce.

It is specific. The line handed back is the caller's own `process.argv` plus `--yes` (`src/utils/consent.ts`), so what gets approved is the run that was described, down to `--ios` and `--port`.

It leaves a record. The approved run is a command in the caller's history or the agent's transcript, not a keystroke nobody can show afterwards.

The guardrail's trigger is still a terminal. A run with no TTY is an agent or a CI job that asked for the work and is waiting for it. Stopping that would break the path this CLI exists for. `--json` counts as machine use for the same reason. `--yes` is that consent. `--json` and every non-interactive run never stop.

**The exit code of a stop is `0`.** Nothing ran, and nothing is wrong. The text leads with `Nothing ran`. `cli:start_plan_needs_consent` carries the same fact with the `rerun` command, because an agent that reads only the exit code would otherwise see a success it did not get. That risk is named in [[0010-agent-conventions]] §Exit codes rather than solved by a second code.

No prompt module remains in the package. The `prompts` dependency is gone. The `skills` / `agents:setup` agent checklist was not converted. It was removed: it selected among detected agents, which is the answer the non-interactive path already gave for free. `--agent` is the override.

Out of scope, and deliberately unchanged: a forwarded CLI that prompts. `expo login` asks for a password on purpose. The needs-human protocol ([[0010-agent-conventions]]) is what covers it.

The deferred `doctor:fix --apply` used the same consent pattern. It does not ship.

## Untrusted-content marking

App logs, network payloads, and screenshots flow into agent context. They can contain user- or attacker-controlled text, which is prompt injection. [confirmed, Kudo, 2026-08-20] Runtime commands ([[0005-runtime-loop-tools]]) mark that content as untrusted data, as fenced blocks with marker-forgery neutralization.

## A command whose targets are gitignored

A command whose targets are gitignored must state that its recovery does not cover them, in the same output that names the recovery. Printing an id and letting the reader infer the guarantee is worse than printing no id at all. `node_modules`, `ios/Pods`, `.expo`, and the Metro caches are the files a snapshot of tracked content does not hold. Whatever the recovery mechanism of the day is, an artifact that names it must also name what it leaves out. The case that produced the rule was `doctor:fix` and the checkpoint it took. Both are deferred ([[0017-deferred-commands]]). The rule is not about snapshots and stays here.

## Testing

Checkpoint/undo was deterministic. Its suites moved to `src/deferred/checkpoint/__tests__/` with the code and are not run. Plan-emission is covered by the smart start tests. Consent is covered by `src/dev/__tests__/planConsent-test.ts`.
