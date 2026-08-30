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
- **Plan-with-cost dry run**: shipped as `@expo/agent-cli dev --plan`, and as the plan `@expo/agent-cli dev` prints before it runs it ([[0004-smart-start-and-project-state]]). Since that default executes, a run watched from a terminal stops before a step that costs more than seconds and prints the command that runs it (`src/dev/planConsent.ts`); see §Consent is a re-run, never a prompt below. `--yes` is that consent, `--json` and every non-interactive run never stop, and a stop exits 0 having run nothing.
- **Untrusted-content marking**: shipped in the runtime commands ([[0005-runtime-loop-tools]]), as fenced blocks with marker-forgery neutralization.
- Not built: MCP impact metadata, because there is no MCP server surface yet.

## Consent is a re-run, never a prompt

Decision [confirmed — Kudo, 2026-08-29: "because the tool is for agent. we should revisit all cases
that should not use prompt … if you need prompt, exit and share the next hint to call the command
again with `--yes`"]. Implemented in wave 41.

**This CLI asks no questions.** Where a guardrail used to open a prompt, the command now prints what
it was about to do, prints the command that does it, and ends. Consent is the caller running that
command. Three properties follow, and they are the reason:

- **An agent can give it.** A `? Run this plan? › (Y/n)` needs a keystroke on a TTY. An agent
  driving this CLI through a pty gets the cursor and nothing to type into it, and one driving it
  through a pipe used to get a different behaviour than the person who wrote its prompt saw. A
  command line is the one form of consent every caller can produce.
- **It is specific.** The line handed back is the caller's own `process.argv` plus `--yes`
  (`src/utils/consent.ts`), so what gets approved is the run that was described, down to `--ios`
  and `--port`. Rebuilding it from parsed options is what F58 and F103 were filed for.
- **It leaves a record.** The approved run is a command in the caller's history or the agent's
  transcript, not a keystroke nobody can show afterwards.

The guardrail's *trigger* is unchanged, and it is still a terminal: a run with no TTY is an agent or
a CI job that asked for the work and is waiting for it, and stopping that would break the path this
CLI exists for. `--json` counts as machine use for the same reason. So the stop is what a person
watching sees, and `--yes` is what everyone can say.

**The exit code of a stop is `0`**, which is the `--plan` dry run's code and the code the declined
prompt used to leave with: nothing ran, and nothing is wrong. The text leads with `Nothing ran`, and
`cli:start_plan_needs_consent` carries the same fact with the `rerun` command, because an agent that
reads only the exit code would otherwise see a success it did not get. That risk is named in
[[0010-agent-conventions]] §Exit codes rather than solved by a second code, and it is bounded to the
case above: an agent that has a TTY, did not pass `--yes` or `--json`, and asked for a plan that
builds.

Sites, as of wave 41: the `dev` plan (`src/dev/planConsent.ts`) and the deferred
`doctor:fix --apply` (`src/deferred/doctor-fix/fixAsync.ts`). The `skills`/`agents:setup` agent
checklist was not converted but **removed** — it selected among detected agents, which is the answer
the non-interactive path already gave for free, so the terminal now gets that same answer and
`--agent` is the override. No prompt module remains in the package; the `prompts` dependency is gone.

Out of scope, and deliberately unchanged: a **forwarded** CLI that prompts. `expo login` asks for a
password on purpose, and the needs-human protocol ([[0010-agent-conventions]]) is what covers it.

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
