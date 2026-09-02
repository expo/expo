# 0017: The deferred commands

**Type:** Reference
**Status:** Deferred - reference
**Systems:** the reference shelf (`src/deferred/dev-wait/`, `src/deferred/checkpoint/`, `src/deferred/build-wait/`, `src/deferred/runtime-network/`, `src/deferred/doctor-fix/`); the JSONL event declarations these commands left behind in `src/events.ts`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Revised:** 2026-08-30
**Related:** [[0016-v1-scope]], [[0010-agent-conventions]], [[0008-guardrails]], [[0005-runtime-loop-tools]], [[0004-smart-start-and-project-state]], [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0012-build-explain]], [[0002-testing-and-evals]]

## What this document is

The home for everything that is not in the v1 surface. [[0016-v1-scope]] is what ships. This document is what waits.

Five commands have code on `src/deferred/<area>/`. The rest never shipped: no registry entry, no shelf, no tests. A restored command comes back from its shelf directory and its section here. An unbuilt idea comes back from the list at the bottom.

Nothing described below is a command this CLI has.

Anywhere else in the corpus, a thing that is not v1 gets a one-line pointer here.

**This document is not verified.** Nothing type-checks the shelf and nothing runs its tests ([[0016-v1-scope]]). Both the code and the prose here rot at the rate the tree around them moves. Read a path as where a thing was on 2026-08-26, not as where it is.

| Section                | The command                                | Code                            | Why it left v1                                           |
| ---------------------- | ------------------------------------------ | ------------------------------- | -------------------------------------------------------- |
| §dev:wait              | `@expo/agent-cli dev:wait`                 | `src/deferred/dev-wait/`        | `smoke` asks its questions and three more                |
| §The checkpoint system | `@expo/agent-cli checkpoint[:list\|:undo]` | `src/deferred/checkpoint/`      | agents manage git themselves                             |
| §build:wait            | `@expo/agent-cli build:wait <id>`          | `src/deferred/build-wait/`      | wants to be `build --wait`, not a command                |
| §runtime:network       | `@expo/agent-cli runtime:network`          | `src/deferred/runtime-network/` | the CDP Network domain is unstable and absent on Expo Go |
| §doctor:fix            | `@expo/agent-cli doctor:fix`               | `src/deferred/doctor-fix/`      | the check half is the v1 answer                          |

A deferred area's findings that still govern live code stayed in the LLP that made them. Each section below names which and where.

The events stayed too. `cli:dev_wait`, `cli:runtime_network`, `cli:build_wait*` and `cli:doctor_fix_*` are still declared in `src/events.ts`, each annotated with its deferral. A deferral is not a schema change. Nothing emits them now.

## dev:wait

`@expo/agent-cli dev:wait` waited for this project's dev server to be ready, proved the dev server was this project's, and built the entry bundle to prove the project compiles. Code: `src/deferred/dev-wait/` (`wait.ts`, `waitAsync.ts`, `resolveWaitOptions.ts`, `waitFormat.ts`, `followups.ts`, and the tier-0 eval scenario `dev-wait-no-dev-server.eval.json`).

**Why it left** [confirmed, Kudo, 2026-08-26]: two commands answered the same question with different amounts of it. `dev:wait` proved the bundler was ready, the dev server was this project's, and the entry bundle compiled. `smoke` proves those, then opens the app, evaluates in it, and collects what it threw. An agent that ran the smaller one and believed it had a verdict is the failure mode [[0010-agent-conventions]] is about. The answer is one gate rather than a choice between two.

Where each of its jobs went, in v1: the gate before reading the app is `smoke`; app health over a window is `runtime:errors --fail-on-error`; readiness at start is `dev --detach --wait-ready`. `status`'s `next` line was `dev:wait --require-app` and is now `smoke`, which is a larger command than the one it replaces. That is the point of the deferral.

**Re-entry criteria:** `smoke` is observed being too much for a case that only needs the bundler question, a CI job with no device for instance, and the cheaper wait cannot be had by flags on `smoke`. What returns is the command layer below. The library it called never left.

`src/runtime/waitReady.ts` and `src/runtime/bundleCheck.ts` are what `smoke`, `runtime:reload`, and `dev --detach --wait-ready` call, so every question `dev:wait` settled is still asked. Their design stayed in [[0010-agent-conventions]]: the readiness gate, the two-request entry-bundle check, the web target, and the payload shape. The prose there names `dev:wait` throughout, because that is the command the findings were made against.

What is on the shelf is the command layer only: option resolution, the human report, the exit-code mapping, and the follow-up ladder. `bundleToJson` moved into `src/runtime/bundleCheck.ts` as `BundleCheckJson`. The JSON keys are unchanged. Its tier-0 eval scenario was replaced by `smoke-no-dev-server`.

## The checkpoint system

`@expo/agent-cli checkpoint [--label]`, `checkpoint:list`, and `checkpoint:undo [--id]`, plus the automatic snapshots that `install`, `agents:setup`, and a prebuilding `dev` plan took. Code: `src/deferred/checkpoint/` (`create.ts`, `restore.ts`, `store.ts`, `integration.ts`, `events.ts`, `followups.ts`, `types.ts`, `index.ts`).

**Why it left** [confirmed, Kudo, 2026-08-26]: agents manage git themselves. The premise of the feature was that a driving agent has no undo, and that stopped being true. A second snapshot mechanism beside git, one that writes unreferenced objects a `git gc` can reap and that no `git log` shows, is a second thing to reason about rather than a safety net. The honest version of this guardrail is "commit before you start", which needs no command.

**Re-entry criteria:** a driving agent is observed losing work this would have held. That means a case where the agent's own git was not enough, not merely a case where a snapshot would also have worked. `checkpoint:undo`'s documented limit, that it never deletes files created after the snapshot, is the first thing to revisit if it does.

What was built: one colon group. Automatically before `expo install`, before `agents:setup`'s AGENTS.md write, and before a `dev` plan containing prebuild. `--no-checkpoint` or `AGENT_CLI_NO_CHECKPOINT` skipped it. The snapshot: a temp-index `git add -A .`, then `write-tree`, then a parent-linked `commit-tree` written as an unreferenced object. HEAD, branches, the index, and the reflog are untouched. Ids live in `.expo/agent-cli-checkpoints.json`, capped at 20. The restore: `read-tree` plus `checkout-index -a -f`. It restores everything the checkpoint holds, including since-deleted files, and never deletes files created after the snapshot. Gitignored files are in no checkpoint. `git gc --prune=now` can reap old snapshots, which `CHECKPOINT_OBJECT_MISSING` names.

`src/checkpoint/git.ts` split on the way to the shelf. `runGitAsync` and `resolveWorkTreeAsync` are how `src/impact/` reads a diff, so they are `src/utils/git.ts` now and are live. The snapshot plumbing is what moved. The suites moved with the code to `src/deferred/checkpoint/__tests__/` and are not run.

The general rule a command whose targets are gitignored must state that its recovery does not cover them stayed live, in [[0008-guardrails]]. The other three guardrails of that document ship: the plan-with-cost dry run, consent as a re-run, and untrusted-content marking.

## build:wait

`@expo/agent-cli build:wait <id>` attached to an EAS build that already existed, polled it, and left with what the build did. Code: `src/deferred/build-wait/` (`buildWaitAsync.ts`, `waitAsync.ts`, `status.ts`, `parseView.ts`, `resolveOptions.ts`, `format.ts`, `followups.ts`, `types.ts`, `index.ts`).

**Why it left** [confirmed, Kudo, 2026-08-26]: the shape is wrong rather than the work. A caller who wants to wait on a build has already run a build command, and `build:wait <id>` asks them to carry an id from one command to another, while `npx eas build --wait` does the whole thing in one. The answer is a `--wait` flag on a build verb this CLI owns, not a command of its own.

**Re-entry criteria:** `@expo/agent-cli build` exists as a verb with local and EAS parity, meaning the same flag waits on a local `expo run:ios` and on an EAS build.

What stayed in [[0010-agent-conventions]]: the `20`–`29` outcome band itself, which this command was the first into; the rule that no `eas --json` payload can contain a `null`; and the rule that the convention does not reach a forwarded exit code.

The exit-code mapping, now `src/deferred/build-wait/status.ts`:

| Code | The build                                          |
| ---- | -------------------------------------------------- |
| `0`  | `FINISHED`                                         |
| `20` | `ERRORED`                                          |
| `21` | `CANCELED`, or this wait was interrupted           |
| `22` | still running when `--timeout` elapsed             |
| `7`  | nobody is signed in, so no build is visible        |
| `1`  | not readable: bad id, no `eas`, three failed polls |

The service spells it `CANCELED`, with one `l`. `CANCELLED` stays in the table as a spelling that costs nothing to accept. Four details:

- An unrecognized status is not terminal. Ending on it would report an outcome nobody observed. The timeout is what stops a wait that is wrong about this.
- An interrupted wait exits `21`, not `130`. A Ctrl-C is the caller cancelling. The two are told apart on the event stream (`cli:build_wait.interrupted`) rather than in the `--json` payload.
- Three failed polls is `1`, not an outcome. `Try:` is `<the eas that ran> whoami`.
- Signed out is `7`, and it is asked before the first poll. A preflight answering `null` (no EAS CLI, a timeout, or a binary under that name that is not the CLI) is not "signed out", and the wait proceeds.

Progress goes to the `LOG_EVENTS` JSONL stream as `cli:build_wait_poll`, never to stdout.

`build:wait`'s errored ladder gains a rung naming `npx @expo/agent-cli inspect:build-log --file <path>`, and its `why` says the step in between out loud: once the log above is saved to a file. The obvious rung would have been the reserved `<build-id>` form, which does not work. A follow-up is the next thing to run ([[0009-smart-followups]]). A rung that cannot be run is worse than no rung. Submissions do not get it at all: a submission log is not a native build log.

## runtime:network

`@expo/agent-cli runtime:network` collected the running app's network traffic over the CDP Network domain. Code: `src/deferred/runtime-network/` (`runtimeNetworkAsync.ts`, `networkCollector.ts`, `resolveOptions.ts`, `format.ts`, `followups.ts`, `help.ts`).

**Why it left** [confirmed, Kudo, 2026-08-26]: the CDP Network domain is unstable in React Native and effectively unavailable on Expo Go. The two refusals below are the usual answer there rather than edge cases, so the command's most common outcome was an explanation of why it could not answer.

**Re-entry criteria:** React Native ships network inspection outside `InspectorFlags::getNetworkInspectionEnabled()`, or Expo Go carries a runtime that implements the domain, so that a default run against a default project returns a request log rather than `NETWORK_DOMAIN_UNAVAILABLE`.

What stayed in [[0005-runtime-loop-tools]]: the candidate bullet that proposed it; the shared runtime target selection and the Expo-Go-for-Android finding; and the rule of [[0010-agent-conventions]] that a command that reports on the app does not gate on what it reported.

What was built: a CDP Network domain collector. It correlated request, response, and failure by requestId, and counted three outcomes: answered, failed, and never-answered. The third exists because RN never sends `Network.loadingFailed` for a refused connection. Live-verified on iOS against 200, 404, and refused.

Two refusals, not one. `Network.enable` fails for two unrelated reasons:

- `registeredHostsCount > 1` gives a JSON-RPC internal error: "The Network domain is unavailable when multiple React Native hosts are registered." This is about the state of the app process. It clears when the app is relaunched with only this project loaded. Stopping another dev server does nothing for it. Expo Go reaches it by holding a host for a project it loaded earlier.
- `InspectorFlags::getNetworkInspectionEnabled()` off means the method is never handled, and the dispatcher answers `-32601`. This is about how the runtime was built, and it never clears. Expo Go for Android answers every method this way.

`classifyNetworkDomainRefusal` reads the quoted message, then the JSON-RPC code, and the why and how branch on it. The `unstable_enableNetworkPanel=true` flag on the target is named only in the `-32601` case, where it genuinely contradicts the runtime.

## doctor:fix

`@expo/agent-cli doctor:fix` reset the caches and build state an Expo project accumulates, from a table an agent could read before it ran anything. Code: `src/deferred/doctor-fix/`.

**Why it left** [confirmed, Kudo, 2026-08-26]: expo-doctor diagnoses and `@expo/agent-cli` acts, but only the diagnosing half earns a place in a first surface. What `doctor:fix` deletes is caches and build state, and every one of them is something an agent can delete with the tool it already has. `rm -rf node_modules && npx expo prebuild --clean` is one line an agent writes without help. The command's value is the table and the safety rules around it, which is worth shipping later. `doctor` and `doctor:check` ship unchanged and are still the v1 answer to "what is wrong with this project".

**Re-entry criteria:** the v1 surface has been used enough to say which resets agents actually reach for, so a tier table can be cut down to those. And the checkpoint question is answered, because this command's whole subject is gitignored and no checkpoint holds it. It returns as an action of the `doctor` group, with the dry-run default unchanged.

What it was. Dry run is the default. `--apply` is what executes. That is the opposite of `dev`, which runs the plan it prints. This command deletes, and a deletion has no partial answer to fall back on. A `doctor:fix` with no `--apply` on it cannot delete anything.

Tiers are cumulative. `src/deferred/doctor-fix/fixSteps.ts` is the table, and it is data. `safe`: project-scoped caches, seconds, nothing to reinstall (`.expo` web/dev logs, `node_modules/.cache`, the Metro file map, `watchman watch-del` of this project). `moderate`: a reinstall, minutes (machine-wide Metro transform cache, `node_modules`, `ios/Pods`, Android build dirs). `aggressive`: regenerates, or reaches outside the project (`expo prebuild --clean` on CNG only, Xcode DerivedData, `watchman watch-del-all`). Deliberately excluded and named in `--help`: `npm cache clean --force` and `yarn cache clean`.

Path safety: `rejectUnsafeTarget` is the one predicate every target passes through, once into the plan and again immediately before `rm`. A machine-wide step without `--allow-machine-wide` is skipped, not an error. Uncommitted tracked native work refuses the whole plan at plan time (`DOCTOR_FIX_DIRTY_NATIVE`). A failed step stops the run. Remaining steps are reported as `skipped` with the reason.

Checkpoints do not protect this command, and it says so. Every headline target is gitignored. One is still taken before `--apply` at `moderate` and above, because it protects tracked `ios/` / `android/` and a tracked `Podfile.lock`. The snapshot ships with the sentence that says what it is not. The general rule lives in [[0008-guardrails]]. Consent at `moderate` and above is a re-run with `--yes` ([[0008-guardrails]]). Nothing here ships in v1.

Exit codes: `0` a dry run, an apply whose steps all worked, and a declined confirmation. `20` an applied step failed. `1` a bad argument, `DOCTOR_FIX_DIRTY_NATIVE`, or `DOCTOR_FIX_UNSAFE_PATH`. `20` for a failed step is deliberate: the tool worked and the subject's operation failed ([[0010-agent-conventions]]).

What stayed in [[0010-agent-conventions]]: two upstream asks, `expo cache:clear` and `expo-doctor --json` with stable check ids. Suites moved to `src/deferred/doctor-fix/__tests__/` and are not run.

Open questions, if it returns: a `--from-check` mode that plans only the steps the last `doctor:check` implicates (needs the `expo-doctor --json` ask first); whether the safe tier should run as a follow-up after a bundler failure in `dev`; `derived-data` matches by scheme prefix, so two projects with the same scheme name collide.

## Not built

No code on the shelf. Do not design these in the living LLPs.

**Commands and flags**

- `inspect:build-log <build-id>`. Reserved today (`BUILD_ID_UNSUPPORTED`). Needs eas-cli `build:logs`.
- `new` one-line description, EAS init, and a first-boot check. v1 `new` is `create-expo --yes` plus optional git init.
- `--base <ref>` on a fingerprint comparison. `--build` covers the common case.
- `--preset` / `--profile` on `status`.
- Follow-ups on forwarded `expo` / `eas` subprocess output. v1 follow-ups are this CLI's own commands only.
- Follow-up ladders that probe EAS login / project config.
- A shared `--refresh` spelling for caches. v1 uses `--no-fingerprint-cache`.
- Sharing the whole-project fingerprint cache entry with the per-platform keys.
- Stamping `ios/` and `android/` themselves so a native edit is visible before the ten-minute TTL.

**Product**

- Cloudflare Workers compat preflight, local workerd run, and a Node-to-Workers fix loop.
- Chat-driven development: cloud agent, phone as the only device, `@expo/mcp-tunnel` as the remote transport. Where the agent runs (EAS machines vs bring-your-own) is undecided.
- OAuth device-code grant and scoped agent sessions on www. v1 auth is `EXPO_TOKEN` and the existing login CLIs.
- `expo agent` as a subcommand alias in `@expo/cli`.
- An embedded-loop agent (Shape 2). Shape 1 is the product.
- Version-pinned docs lookup, API diff, example transplant, dependency explainer, SDK upgrade workflow, module authoring.
- Performance probe and a cross-platform screenshot sweep.
- An `@expo/agent-cli mcp` server, and MCP tool-impact permission metadata.
- Ambient and long-running modes: copilot watch, EAS build babysitter, PR bot, maintenance agent.
- A hosted, community-fed build-failure signature DB. v1 is the capped in-repo table ([[0012-build-explain]]).
- Scripted MCP client replay in the eval harness.
- `runtime:tree` picking a list row by its text. v1 matching is by testID and `--index`.
