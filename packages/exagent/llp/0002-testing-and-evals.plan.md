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

- **Tier 0 — deterministic (every PR, free).** Unit tests + subprocess e2e with JSONL-event assertions (layers 1–2 above). _Scripted MCP client replay is an optional add-on, deferred_ [confirmed — Kudo, 2026-08-20: not necessary in the meantime]; revisit when the MCP tool surface grows enough that schema drift becomes a real regression class.
- **Tier 1 — agent-in-the-loop, best-effort (primary early investment).** Requirement [confirmed — Kudo, 2026-08-20]: test real "call from an agent" behavior — unpredictable and best-effort by nature — while staying free, cheap, and as stable as possible. Approach [inferred]:
  - _Model_: a pinned quantized open model (4–8B Qwen/Llama class) via llama.cpp/Ollama on a GitHub-hosted runner, CPU-only (~4 vCPU/16 GB → single-digit tokens/sec; keep scenarios short). GitHub Models is NOT an option — fully retired 2026-07-30 [observed — GitHub changelog]. Hosted free-tier alternatives to spike (all need an API-key secret; limits shift, so report-only use only): Groq free tier (Llama 3.3 70B, ~30 RPM / 1000 req/day [observed — provider comparisons, 2026-08]), Google Gemini Flash free tier, OpenRouter free models (50 req/day), Cloudflare Workers AI. A weekly suite of 2–3 scenarios × pass@5 fits comfortably inside those budgets. Cheap-paid fallback with the best tool-calling reliability: Claude Haiku (cents per run, folds into tier 2's key).
  - _Stability levers_: temperature 0 / greedy decoding, fixed seed, pinned model + quantization + prompt → near-reproducible runs on identical inputs; short single-goal scenarios; outcome graders with tolerance (any valid tool sequence that reaches the goal passes).
  - _Flake containment_: pass@k over k cheap trials instead of single-shot; the job starts **report-only** (non-blocking) and only becomes a gate once its pass rate is stable over a trailing window.
  - Deliberate side effect: if a weak model can use the tools, strong models certainly can — ergonomics get evaluated at the hardest setting.
- **Tier 2 — frontier model (scheduled + pre-release).** A real agent (e.g. Claude Code headless) drives the full scenario set with an API key from CI secrets. N trials per scenario; gate on pass rate; store transcripts as artifacts for regression triage.

## Graders

Programmatic and model-free: dev server responds; app boots (via `automation_take_screenshot`); `expo-doctor` passes; expected files changed; JSONL event stream contains expected events. Graders never read transcripts to decide pass/fail.

## Example scenarios

"Make this broken project start", "add expo-camera and get it running", "is this project Expo Go compatible?", "upgrade this SDK 52 fixture", "deploy this app's web build".

## Real-world failure telemetry feeds the suite

[confirmed — Kudo accepted, 2026-08-20; design inferred] Opt-in reports when an agent gets stuck on an Expo task become eval-scenario candidates. The `submit-expo-feedback` channel already exists in the `expo/skills` repo [observed — expo-skill-feedback skill]. Pipeline: report → triage → minimal fixture reproducing the failure → scenario + grader. The suite grows from field data, not imagination.

## Build order (M0)

1. Fixture projects (minimal Expo Go app; dev-client app; broken variant).
2. Scenario/grader schema + runner skeleton.
3. Tier 0: subprocess e2e with JSONL-event assertions against the real `expo` CLI.
4. GH Actions workflow for tier 0 on PRs.
5. ~~Tier 1 spike~~ — done [observed — local run, 2026-08-21]: Ollama + `qwen3:4b`, temperature 0, seed 42, minimal JSON tool-call loop in `evals/run.mjs`. Result: `skills-sync` passes 5/5 with one correct command per run, ~23.5 s/run on an Apple M4 (expect a few multiples slower on a 4 vCPU GitHub runner). Decision: Ollama-pinned is the canonical tier-1 driver; no model cache (weekly job loses the LRU race for the shared 10 GB pool; cold pull is minutes). Hosted free tiers (Groq/Gemini/OpenRouter) stay optional fast lanes behind a repo secret; GitHub Models is retired [observed — GitHub changelog 2026-07-30]. The `tier1-agent-eval` job now runs live inference, still report-only.
6. ~~Tier 2 runner~~ — built [observed — 2026-08-22, live run pending credentials]: Claude Code headless (`claude -p`, Bash allowed, max 12 turns) drives scenarios via `runTier2Scenario` in `evals/run.mjs`. Runs from a label-triggered **EAS workflow** (`.eas/workflows/exagent-tier2-evals.yml`, label `exagent-eval` or dispatch — mirrors expo/skills' eval pattern [observed — `skill-eval-ci.yml` in expo/skills]), advisory-only: the job never fails; a `github-comment` job posts pass/fail + log excerpt to the PR. Prerequisite: `ANTHROPIC_API_KEY` in the EAS `production` environment. Also decided [confirmed — Kudo, 2026-08-22]: tier 1 runs on every PR (proven cost ~4m37s/run), still report-only.
7. (Optional, deferred) scripted MCP client replay when the tool surface warrants it.

## Resolved decisions

[confirmed — Kudo, 2026-08-20]

- Harness home: `expo/expo`, under `packages/exagent/evals/`.
- CI split: `tier0-linux` on every PR (subprocess + JSONL + schema tests, no simulator); simulator scenarios on macOS runners — `expo/expo` GitHub Actions already runs macOS jobs [confirmed — Kudo].
- `tier0-windows` on every PR [confirmed — Kudo, 2026-08-22]: full unit + e2e on windows-2022. Paid off immediately [observed]: 19 posix-literal test assertions, then a real production bug — Node (post CVE-2024-27980) throws `spawn EINVAL` on `.cmd` shims without `shell: true`, which broke every subprocess spawn on Windows; fixed via `resolveSpawnTarget`.
- Tier-1 per-PR trim [observed — 2026-08-22]: PRs run only `skills-sync` (~4 min); the full scenario set runs on the weekly cron + dispatch. Cause: CPU-inference variance on standard runners (the same turn ranged 23 s locally to >900 s on a slow runner); also `keep_alive: 45m` pins the model between turns and inference failures fail one scenario, not the runner.
- First fixture matrix: latest stable SDK only; three fixtures (Expo Go app, dev-client app, broken variant); iOS-first for simulator scenarios, Android after the harness works.
- Sequencing: feature-set review happens before implementation starts [confirmed — Kudo, 2026-08-20].

## Open questions

1. ~~Which small model for tier 1~~ — resolved [observed — spike, 2026-08-21]: `qwen3:4b` via Ollama (see build order step 5). Quantization pinning by digest still worth adding once CI timing data exists.
2. Pass-rate thresholds and trial counts for tiers 1–2.
