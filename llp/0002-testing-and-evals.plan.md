# 0002: Testing and Evals for the Agentic Tool Layer

**Type:** Plan
**Status:** Draft
**Systems:** eval harness (new); fixtures; CI (GitHub Actions)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Testing infrastructure is built **first**, before feature work [confirmed — Kudo, 2026-08-20]. Shipping any tool from [[0001-agentic-cli-on-expo-cli]] is gated on the layers below. Constraint [confirmed — Kudo, 2026-08-18]: model-driven tiers prefer a free local model that runs on GitHub Actions.

## Layers

1. **Unit tests (jest).** Same setup as `@expo/cli` (`pnpm test`) [observed — `packages/@expo/cli/package.json`]. Everything deterministic is unit-tested: project-state probe, decision tables, impact classifier, tool input/output schemas, skill discovery.
2. **E2E CLI tests.** Same pattern as `@expo/cli` (`test:e2e`, `e2e/jest.config.js`) [observed]. Run bins against fixture projects; no model involved. Per the process-boundary constraint in [[0001-agentic-cli-on-expo-cli]], e2e tests spawn the real `expo` CLI as a subprocess and assert on its JSONL events — the events contract is the API under test.
3. **Evals.** Scenario = fixture project + task prompt + a driving agent + programmatic grader.

## Eval tiers

- **Tier 0 — scripted MCP client (every PR, free, deterministic).** No model: replay recorded tool-call sequences against the real MCP tools and the real `expo` subprocess. Catches schema breaks, wiring regressions, output-format drift. This tier does most of the CI work.
- **Tier 1 — small local model (every PR or nightly, free).** A quantized open model (4–8B Qwen/Llama class via llama.cpp or Ollama) drives short scenarios on a GitHub-hosted runner, CPU-only. Feasibility [inferred]: standard runners are ~4 vCPU/16 GB → single-digit tokens/sec; keep the suite small and scenarios short. Deliberate side effect: if a weak model can use the tools, strong models certainly can — tool ergonomics get evaluated at the hardest setting.
- **Tier 2 — frontier model (scheduled + pre-release).** A real agent (e.g. Claude Code headless) drives the full scenario set with an API key from CI secrets. N trials per scenario; gate on pass rate; store transcripts as artifacts for regression triage.

## Graders

Programmatic and model-free: dev server responds; app boots (via `automation_take_screenshot`); `expo-doctor` passes; expected files changed; JSONL event stream contains expected events. Graders never read transcripts to decide pass/fail.

## Example scenarios

"Make this broken project start", "add expo-camera and get it running", "is this project Expo Go compatible?", "upgrade this SDK 52 fixture", "deploy this app's web build".

## Build order (M0)

1. Fixture projects (minimal Expo Go app; dev-client app; bare app; broken variants).
2. Scenario/grader schema + runner skeleton.
3. Tier 0: scripted MCP client + JSONL-event assertions against the real `expo` subprocess.
4. GH Actions workflow for tier 0 on PRs.
5. Tier 1 runner (Ollama/llama.cpp setup action, small suite).
6. Tier 2 runner behind CI secrets.

## Open questions

1. Harness home: `expo/expo` (beside fixtures) vs `expo-mcp` (beside tools) vs `expo/skills` (its `eval-harness/` directory exists and is empty [observed]).
2. Which small model/quantization for tier 1 — needs a benchmark spike on a real runner.
3. Pass-rate thresholds and trial counts for tiers 1–2.
