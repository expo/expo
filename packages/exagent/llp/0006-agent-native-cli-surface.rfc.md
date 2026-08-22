# 0006: Agent-Native CLI Surface

**Type:** RFC
**Status:** Draft
**Systems:** `packages/@expo/cli`; JSONL events; `exagent` launcher (new)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]]

## Summary

Make the Expo CLI itself pleasant for a driving agent: structured output in, structured answers out, no TTY assumptions, and a hard process boundary.

## The process boundary

Constraint [confirmed — Kudo, 2026-08-20]: agentic tooling **invokes the `expo` CLI as a subprocess as much as possible; it does not import `@expo/cli` code.** Rationale [inferred]:

- The tool layer works against whatever CLI version the project has installed, across SDK versions.
- `@expo/cli` is rolled up with swc [observed — its CLAUDE.md]; internals are not a public API.
- It forces the real contract — the JSONL event stream — to stay complete: anything the tool layer needs must be an emitted event or a command flag, which benefits every consumer.

Consequence: gaps discovered while building tools become upstream `@expo/cli` improvements (new events, new flags), not imports.

## Surface improvements

- **JSONL events as the API.** `installEventLogger` / `LOG_EVENTS` exist today (`packages/@expo/cli/bin/cli.ts` [observed]; JSONL event-based debugger noted in the CLI's CLAUDE.md [observed]). The tool layer treats the event schema as a versioned contract; missing events are bugs to fix upstream.
- **Agent-mode dev server output** [confirmed — Kudo seed, 2026-08-18]: no QR code, no spinner, no interactive keymap. JSONL events plus a small status endpoint: bundle state, connected clients, last error. A QR code is meaningless to an agent; a URL + platform-launch tool is not.
- **Non-interactive parity** [confirmed — Kudo direction via headless creation seed, 2026-08-18]: every interactive prompt in Expo/EAS CLIs must have a programmatic answer path (flag or JSON). The eval suite ([[0002-testing-and-evals]]) runs everything with no TTY attached; a prompt that blocks a pipe is a bug.
- **Headless CI mode.** Structured pass/fail invocations with `--json` and exit codes, for CI jobs like "verify the app still boots after this PR".
- **Errors are prompts** [confirmed — Kudo accepted, 2026-08-20; implemented 2026-08-22: `CommandError.suggestedCommand` prints a trailing `Try: <command>` line and rides the `cli:error` JSONL event; wired into the dev-server and deep-link errors first]. The repo already has a what/why/how error-message guideline [observed — `.claude/CLAUDE.md` §Error messages]. For a driving agent, every CLI error is literally its next prompt. Systematize: every error event carries machine-readable fields — cause classification and a `suggestedCommand`/next step — so the agent's recovery path is one hop, not a search.
- **MCP resources + versioned tool schemas** [confirmed — Kudo accepted, 2026-08-20; design inferred]. Expose cheap-to-read context (resolved config, router sitemap, doctor report, project brief) as MCP _resources_, not only tools. Version the tool/event schemas and negotiate capabilities on connect, so older driving agents keep working against newer servers.
- **AGENTS.md generation** [confirmed — Kudo accepted, 2026-08-20; design inferred]. `exagent setup` writes and maintains a managed section in the project's `AGENTS.md`: SDK version, targets, the right commands, project quirks. Orients every agent — including ones that never call a tool.

## Output contract

Decision [confirmed — Kudo, 2026-08-22]: the default output stays **terse human text — which is the agent-friendly shape** — with three channels, each with one job:

1. **Default text** — for humans and LLMs reading terminals: one fact per line, `label value` style, stable rule/id names, untrusted app output fenced. Evidence: the tier-1 4B model drove `dev --plan` from the human table alone. Fewer tokens than pretty JSON.
2. **`--json`** — for programmatic consumers: exactly one JSON object on stdout, nothing else. Guaranteed on **every** command. Field names mirror the text labels; top-level keys are stable per command and covered by shape tests (de-facto versioning).
3. **`LOG_EVENTS` JSONL** — the streaming/telemetry channel for long-running commands, same contract as the expo CLI family.

Anti-rule: **no detection-based shape switching.** `agent-cli-detector` may gate extras (skill context dumps, follow-up verbosity — [[0009-smart-followups]]) but never changes the core shape; an agent transcript must show what a human terminal shows (reproducibility, docs, evals).

## The `exagent` launcher

The reserved bins (`exagent` / `ai-expo` [observed — npm, reserved by kudochien 2026-08-18]) ship as a model-free CLI: `setup` (install Expo skills + register the MCP server into Claude Code/Cursor/Codex), `skills` (sync/list/show/clean, [[0003-knowledge-tools-and-skills]]), `install` and `start` (wrapping the `expo` equivalents as subprocesses, with skill sync [confirmed — Kudo, 2026-08-20]), `dev` (the smart-start engine of [[0004-smart-start-and-project-state]]), `mcp` (start/connect), `context` (machine-readable project brief), `status` (where the project is right now), `runtime` (eval/errors/network, [[0005-runtime-loop-tools]]), `navigate` (deep-link a route), `checkpoint`/`undo` ([[0008-guardrails]]), `new` and `deploy` (headless creation and shipping, [[0007-deploy-and-headless]]).

Naming rule [confirmed — Kudo, 2026-08-22]: **a command sharing a name with an `expo` command behaves like that command; a capability only `exagent` has gets a verb of its own; every other command is forwarded to the project's `expo` CLI verbatim.** Rationale [inferred]: the launcher is a superset of `expo`, so an agent that knows `expo` is never wrong about `exagent`, and nothing has to be re-learned per command. The forwarding half is what makes the rule cheap to hold — `exagent` never has to decide what to do with a command it does not implement, and never has to grow a wrapper to stay usable as a project's only CLI entry point.

Implemented [observed — 2026-08-22]: `start` and `install` add skill sync and follow-ups to `expo start`/`expo install` and forward every other argument untouched; the plan-first engine that `start` briefly owned is the `dev` verb; anything else runs through `src/passthrough/`, which spawns the project's `expo` CLI with stdio inherited, forwards the exit code, emits one `cli:expo_passthrough` event, and adds nothing else. A command neither CLI knows is not a special case: `expo` reports it, and its exit code is forwarded like any other.

## Testing

Event-schema snapshot tests; e2e subprocess runs against fixtures asserting event sequences; TTY-free CI environment as the default test condition ([[0002-testing-and-evals]]).
