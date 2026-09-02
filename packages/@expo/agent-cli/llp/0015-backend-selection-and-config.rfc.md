# 0015: Backend selection and the developer config

**Type:** RFC
**Status:** Active
**Systems:** the plan engine (`src/plan/decide.ts`, `src/plan/resolveAsync.ts`, `src/plan/runTarget.ts`); the toolchain probe (`src/toolchain/`); the developer config (`src/settings/`); EAS CLI resolution (`src/utils/easCli.ts`, `src/utils/packageRunner.ts`, `src/utils/processGroup.ts`); project-local bin resolution (`src/utils/projectBin.ts`); `@expo/agent-cli dev`; `@expo/agent-cli status`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Revised:** 2026-08-30
**Related:** [[0004-smart-start-and-project-state]], [[0008-guardrails]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0011-impact-and-freshness]]

## Summary

Two decisions this CLI was making badly, and one place to record what a developer wants.

1. Where a build runs is part of the plan, not a footnote under it. On a host that cannot build for the target platform at all, a plan nobody should approve used to print as though they should. The selection now happens while the plan is decided, so a machine with no Xcode gets `eas build` in the steps.
2. The developer may disagree, and there has to be somewhere to say so. One config, four keys, in `package.json` under `expo.agentCli`.

[[0004-smart-start-and-project-state]]'s old claim that the plan "does not act" on where a build runs is superseded. What that document forbids is a swap of steps between the moment a plan is printed and the moment it runs. Selection happens strictly earlier than that.

## Impossible is not missing

The probe answered `present`, `missing`, or `unknown`. `missing` covered two states that want opposite advice. A Mac without Xcode is missing something a person can install in an hour. A Linux box is missing something that does not exist for it.

`ToolchainProbe` gains `impossible: boolean` rather than a fourth `ToolchainStatus`. A fourth status would have to be handled by every existing reader. Each of them already means the right thing by `missing`: the tool is not here. What `impossible` adds is whether the host is the reason. Today it is true in exactly one place: `detectXcodeAsync` on a `process.platform` that is not `darwin`, which is settled before anything is spawned.

## The selection

`selectBuildBackend` (`src/toolchain/selectBackend.ts`) is a pure function of four facts. The precedence is the contract:

| Rank | Input                                             | Wins because                             |
| ---- | ------------------------------------------------- | ---------------------------------------- |
| 1    | A flag on this command line (`--eas`, `--local`)  | It is the most recent thing anyone said. |
| 2    | The project's `@expo/agent-cli` config            | The developer wrote it down on purpose.  |
| 3    | The host cannot have the toolchain (`impossible`) | No install here would change it.         |
| 4    | The probe found the toolchain missing             | This machine cannot, and could.          |
| 5    | Nothing                                           | Builds run here.                         |

Three properties of that table are load-bearing.

Detection only ever pushes a build to the cloud. There is no row that moves a build back to this machine, because "this machine has Xcode" is not a reason to prefer a local build over one the caller asked for in the cloud.

`unknown` leaves the build here. A probe that could not run has established nothing, and routing a caller into a build queue over a toolchain nobody could reach is worse than the local plan they would otherwise have got.

An explicit choice is honoured even where it cannot work, and is marked `doomed`. The caller may know something this CLI cannot see. What the plan does instead of overriding them is say so. The `Build:` line is red, and a reason reads "the plan above is the plan that runs, and its build step will fail".

Every choice carries two spellings of the same sentence: `why`, as `Building <where>: <because>`, for the plan's reason list; and `because` on its own for the `status` line.

## The plan approved is the plan run

What the old "does not act" constraint forbids is a swap: steps changing between the moment a plan is printed and the moment it runs. `decideStartPlan` is handed a resolved `BuildBackendChoice` and produces the plan. `dev --plan` prints exactly the plan `dev` would execute. Nothing about the run reads the probe again.

`applyToolchainProbe` still folds a probe into a plan without touching its steps. It is what carries the probe's caveats into a plan that stayed local.

`resolveStartPlanAsync` (`src/plan/resolveAsync.ts`) runs the decision table twice, on purpose. The first pass establishes whether this project needs a native build at all and for which platform. The second is decided with the answer. Both passes are pure and free. The probe is skipped entirely when the effective choice is already `eas`.

### What the EAS route is made of

`prebuild` + `run:<platform>` becomes, at most:

1. `eas build:configure`. Only when the project has no `eas.json`.
2. `eas build --platform <p> --profile development`. `runsOn: 'eas'`, `many-minutes`.
3. `expo start --dev-client`. `runsOn: null`.

No prebuild. EAS Build generates the native project itself for a CNG app. The dev server is its own step, because `eas build` builds and stops where `expo run:*` builds, installs, and starts.

Installing is guidance. The cloud route ends with an artifact. `eas build:run --platform <p> --latest` is named in the build step's `reason` and in the plan's `Why`. It is not a step. A step that cannot run on the host it was planned for is worse than a sentence.

The last-build record ignores `eas` steps. That record answers "does the app installed on a device match this project". A cloud build that nothing installed would mark the next plan fresh against an app no device is running.

### Running an `eas` step

`@expo/agent-cli dev` accepts `expo` and `eas`, resolved through `resolveEasCliOrThrow`, the throwing resolver. A plan that chose the cloud cannot do its job without the CLI. Failure messages name the CLI the step actually ran. The needs-human classifier is given `tool: 'eas'`.

## Resolving the EAS CLI

An installed `eas-cli` is not something this CLI may expect. [confirmed, Kudo, 2026-08-26] The answer is one rung, taken every time: the package runner. [confirmed, Kudo, 2026-08-27] No project bin, no `PATH`, no fallbacks.

```
project declares eas-cli   ->  <runner> eas-cli          (the pin wins)
otherwise                  ->  <runner> eas-cli@latest
runner                     ->  bunx, when the project uses bun; else npx --yes
```

The runners already prefer the project's own copy, so a "project bin first" rung was doing nothing the runner does not do. A runner resolves a package and never a file on `PATH`, so a stray `eas` is not spawned at all. The impostor guards stay (`utils/wrapperCrash.ts`) because "unreachable" is a claim about today's resolver rather than about the process boundary.

Load-bearing rules of the rung:

- The pin survives. Local before published, in a monorepo too. A version in the spec (`@latest`) defeats the pin, so `pinned` chooses the bare name.
- The signal is the declaration in `package.json` rather than an installed copy. A package that does not declare it while a sibling workspace does therefore gets `@latest`.
- `@latest` talks to the registry on every run, and stalls for the length of npm's retry ladder when it cannot reach one. Every caller spawns it under a deadline.
- `--yes` for npm's exec only. npx prompts before installing a package it has not seen, and a prompt is a hang. `bunx` installs without asking.

`EAS_CLI_MISSING` now means no `npx` and no `bunx` on `PATH`. `npm install -g eas-cli` is gone from its advice.

Subprocesses are spawned in a process group of their own and signalled as a group (`src/utils/processGroup.ts`). Killing the runner otherwise leaves the CLI it started alive, inheriting the pipes, so `'close'` never fires. Stdin is never attached. Windows has no process-group equivalent; `killProcessTree` uses `taskkill /T /F` there.

Who pays the first-run cost, when the project does not declare `eas-cli`:

- The auth preflight declines to pay it. It asks the EAS CLI only when the project pins it. Otherwise `status` asks the project's Expo CLI instead.
- `status --explain` widens its budget (`EAS_BUILD_RUNNER_TIMEOUT_MS`, 45 s) when the resolved invocation may download. A pinned project keeps 10 s. It never allows the minutes a cold install or an unreachable registry can take.
- The opportunistic build-cache lookup keeps 20 s. Nobody asked for it, and the report is complete without it.

One spawn of a spec at a time. A runner keeps one scratch directory per package spec and does not queue for it. `src/utils/runnerLock.ts` serializes per spec inside the spawn layer. See [[0021-honest-reports]] §The runner is not the service.

## Resolving a project-local bin

The EAS CLI is the one member of the family this CLI never resolves as a file. Every other one (`expo`, `tsc`, `fingerprint`, `expo-doctor`, `create-launch`) walks up from the project. `src/utils/projectBin.ts` is that walk.

The nearest copy wins. That is what a package manager does and what Node does. An ancestor's `node_modules` is where the manager put this package's declared dependencies. A workspace has one tree rather than one per package. A type check and a hash are only comparable at the version the project pinned. A global install is still not consulted.

The stop is the filesystem root, not the workspace root. Nothing on disk marks a workspace. A failed search says what it covered: the directory it started in, that it went up, and where it stopped.

What is deliberately still literal: the `node_modules` that deferred `doctor:fix` deletes. It names a directory to remove rather than a tool to run.

## The run target

The second question the developer may have an opinion about is which app, not where: `expo-go` or `dev-build`.

`dev-build` moves exactly one row of the decision table, the `expo-go` row, to `needs-dev-client`. `expo-go` moves nothing. This CLI can honour a preference for Expo Go and cannot enforce one, because no config makes an incompatible project compatible. That case is said out loud: "Expo Go cannot run this project, so the plan is a development build regardless".

No new flag names. `--go` and `--dev-client` are `expo start`'s own, already accepted and forwarded by `@expo/agent-cli dev`. They are now read first, as the run target the plan is decided against. Passing both is refused.

## Where the config lives

`package.json` › `expo` › `agentCli`. [confirmed, 2026-08-26]

`app.json` as a top-level `@expo/agent-cli` key is broken by design. `@expo/config`'s `reduceExpoObject` discards every top-level key when an `expo` object is present. `app.json` under `expo.extra` changes the fingerprint. A tooling preference would mark every existing development build stale. `agent-cli.config.js` was rejected for now: this config is four scalars, and `status` promises to be instant.

`package.json` › `expo.agentCli` is where this repository already keeps tooling configuration (`expo.install.exclude`, `expo.doctor`, `expo.autolinking`). It is static JSON. Nothing here moves a hash or ships into the app. `package.json`'s `expo` key is not merged into the `ExpoConfig`.

The module is `src/settings/` rather than `src/config/`, because `src/config/` is `@expo/agent-cli inspect:config-plugins`.

```json
{
  "expo": {
    "agentCli": {
      "target": "expo-go" | "dev-build",
      "buildBackend": "local" | "eas",
      "ios": { "buildBackend": "local" | "eas" },
      "android": { "buildBackend": "local" | "eas" }
    }
  }
}
```

Two questions, kept orthogonal: which app, and where the build runs. The per-platform override exists because the detection it overrides is already per-platform. `target` has no per-platform form.

## Validation

Unknown keys and unknown values are errors, not warnings. A preference that was meant to change a plan and silently did not is a wrong plan approved as a right one. A typo gets a "looks like" line. A `package.json` that is not valid JSON is an error rather than "no config". A project with no `@expo/agent-cli` key is not an error and never warns.

`status` is the one exception to the fatality. It catches the error, reports every other line, and exits 0, because `status` promises to be information rather than judgment.

## What `status` reports

`status` resolves the plan through `resolveStartPlanAsync`, exactly as `dev` does, so the two commands cannot disagree about what happens next. `NextActionStatus` gains `buildLocation`, and the text report gains a `build` line, printed only when the next plan contains a build. It gets its own line rather than a clause on `next`. Where a build happens decides what the caller needs: a toolchain here, or an account and a queue.

The cost is one probe. On a host that is not macOS the iOS answer is settled without spawning anything. Those are cached per process and bounded at 5 s.

## The follow-ups of a chosen backend

A ladder must not offer a route the plan already took.

- `dev --plan` on an EAS plan leads with `npx eas whoami` instead of `eas-build-instead`. `eas-build-instead` survives for the one case that still produces a local plan on a machine that cannot build: a `--local`, or a config that asked for it.
- A `needs-native-build` keeps `npx @expo/agent-cli dev` first whichever backend was chosen, because it is the command that makes a plan. The sentence now says which route that is and why. The second rung becomes `npx @expo/agent-cli dev --local`.
- Nothing labels a preference it did not act on, and everything labels one it did.

## Testing

The selection is a pure function over four inputs, so its whole matrix of host × toolchain × config × flag is one table in `src/toolchain/__tests__/selectBackend-test.ts`. `hostPlatform` is a parameter rather than `process.platform`. `resolveAsync-test.ts` pins the order the four inputs are read in. `decide-test.ts` pins the steps each backend produces. End to end, `plan-test.ts` drives a stubbed `xcode-select`, an unset `ANDROID_HOME`, and a real `package.json` edit for every config case. The one thing not covered by a test is a live `eas build` step.
