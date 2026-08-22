# 0006: Agent-Native CLI Surface

**Type:** RFC
**Status:** Draft
**Systems:** `packages/@expo/cli`; JSONL events; `exagent` launcher (new)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

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
- **Errors are prompts** [confirmed — Kudo accepted, 2026-08-20; design inferred]. The repo already has a what/why/how error-message guideline [observed — `.claude/CLAUDE.md` §Error messages]. For a driving agent, every CLI error is literally its next prompt. Systematize: every error event carries machine-readable fields — cause classification and a `suggestedCommand`/next step — so the agent's recovery path is one hop, not a search.
- **MCP resources + versioned tool schemas** [confirmed — Kudo accepted, 2026-08-20; design inferred]. Expose cheap-to-read context (resolved config, router sitemap, doctor report, project brief) as MCP _resources_, not only tools. Version the tool/event schemas and negotiate capabilities on connect, so older driving agents keep working against newer servers.
- **AGENTS.md generation** [confirmed — Kudo accepted, 2026-08-20; design inferred]. `exagent setup` writes and maintains a managed section in the project's `AGENTS.md`: SDK version, targets, the right commands, project quirks. Orients every agent — including ones that never call a tool.

## The `exagent` launcher

The reserved bins (`exagent` / `ai-expo` [observed — npm, reserved by kudochien 2026-08-18]) ship as a model-free CLI: `setup` (install Expo skills + register the MCP server into Claude Code/Cursor/Codex), `skills` (sync/list/show/clean, [[0003-knowledge-tools-and-skills]]), `install` and `start` (wrapping the `expo` equivalents as subprocesses, with skill sync and — later — the smart-start engine [confirmed — Kudo, 2026-08-20]), `mcp` (start/connect), `context` (machine-readable project brief), `new` (headless creation, [[0007-deploy-and-headless]]).

## Testing

Event-schema snapshot tests; e2e subprocess runs against fixtures asserting event sequences; TTY-free CI environment as the default test condition ([[0002-testing-and-evals]]).
