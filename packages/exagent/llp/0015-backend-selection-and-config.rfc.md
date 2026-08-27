# 0015: Backend Selection and the Developer Config

**Type:** RFC
**Status:** Draft
**Systems:** the plan engine (`src/plan/decide.ts`, `src/plan/resolveAsync.ts`, `src/plan/runTarget.ts`); the toolchain probe and its vocabulary (`src/toolchain/`); the developer config (`src/settings/`); EAS CLI resolution (`src/utils/easCli.ts`, `src/utils/packageRunner.ts`, `src/utils/processGroup.ts`); `exagent dev` (`src/dev/`); `exagent status` (`src/status/`); the change-class follow-ups (`src/followups/change.ts`; `exagent impact` carried these until it was folded into `status`, 2026-08-26)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Related:** [[0004-smart-start-and-project-state]], [[0008-guardrails]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0011-impact-and-freshness]]

## Summary

Two decisions this CLI was making badly, and one place to record what a developer wants.

1. **Where a build runs is part of the plan, not a footnote under it.** [[0004-smart-start-and-project-state]] §Where a build runs gave the CLI two words for the two places and a probe that answers which of them this machine can do — and then deliberately left the plan's *steps* alone, adding sentences and a warning instead. On a host that cannot build for the target platform at all, that is a plan nobody should approve, printed as though they should. The selection now happens **while the plan is decided**: a machine with no Xcode gets `eas build` in the steps.
2. **The developer may disagree, and there has to be somewhere to say so.** A dev build where Expo Go would do; the cloud where the toolchain exists. One config, four keys, in `package.json` under `expo.exagent`.

## Impossible is not missing

The probe answered `present` / `missing` / `unknown`, and `missing` covered two states that want
opposite advice. A Mac without Xcode is missing something a person can install in an hour. A Linux
box is missing something that **does not exist for it**, and telling its owner to install Xcode is
not advice, it is an insult delivered by a tool that did not read the room.

`ToolchainProbe` gains **`impossible: boolean`** rather than a fourth `ToolchainStatus`
[decided — 2026-08-26]. A fourth status would have to be handled by every existing reader — the
plan formatter, `applyToolchainProbe`, five follow-ups — and each of them already means the right
thing by `missing`: the tool is not here. What `impossible` adds is *whether the host is the
reason*, which is a second question. Today it is true in exactly one place: `detectXcodeAsync` on a
`process.platform` that is not `darwin`, which is settled before anything is spawned.

## The selection

`selectBuildBackend` (`src/toolchain/selectBackend.ts`) is a pure function of four facts, and the
precedence is the contract:

| Rank | Input | Wins because |
| --- | --- | --- |
| 1 | A flag on this command line (`--eas`, `--local`) | It is the most recent thing anyone said. |
| 2 | The project's `exagent` config | The developer wrote it down on purpose. |
| 3 | The host cannot have the toolchain (`impossible`) | No install here would change it. |
| 4 | The probe found the toolchain missing | This machine cannot, and could. |
| 5 | Nothing | Builds run here. |

Three properties of that table are load-bearing.

**Detection only ever pushes a build _to_ the cloud.** There is no row that moves a build back to
this machine, because "this machine has Xcode" is not a reason to prefer a local build over one the
caller asked for in the cloud.

**`unknown` leaves the build here.** A probe that could not run has established nothing, and routing
a caller into a build queue over a toolchain nobody could reach is worse than the local plan they
would otherwise have got. This is the same rule [[0004-smart-start-and-project-state]] §Where a
build runs already stated for the warning, applied now to a decision with teeth.

**An explicit choice is honoured even where it cannot work**, and is marked `doomed`. The caller may
know something this CLI cannot see — a toolchain on a path nothing probed, a cross-compiler, a
machine that is about to change. What the plan does instead of overriding them is *say so*: the
`Build:` line is red, and a reason reads "the plan above is the plan that runs — and its build step
will fail". Overriding an explicit instruction and calling it help is the failure this whole
document is about, in the opposite direction.

Every choice carries two spellings of the same sentence: `why` (`Building <where>: <because>`) for
the plan's reason list, and `because` on its own for the `status` line, which has already printed
the place as its own column. One string written once, so `--plan`, `status` and the follow-ups
cannot drift.

## The plan approved is the plan run

[[0004-smart-start-and-project-state]] §Where a build runs says: *"The plan says it, and does not
act on it… a plan that quietly swapped its steps for the cloud would stop being the plan that was
approved."* **That constraint is unchanged, and this feature does not violate it.** What it forbids
is a *swap* — steps changing between the moment a plan is printed and the moment it runs. The
selection happens strictly earlier than that: `decideStartPlan` is handed a resolved
`BuildBackendChoice` and produces the plan, and `dev --plan` prints exactly the plan `dev` would
execute. Nothing about the run reads the probe again.

The paragraph that says the steps are never rewritten is therefore **superseded** for the
detection case and kept for every other: `applyToolchainProbe` still folds a probe into a plan
without touching its steps, and is what carries the probe's caveats into a plan that stayed local.

`resolveStartPlanAsync` (`src/plan/resolveAsync.ts`) runs the decision table **twice**, on purpose.
The first pass is what establishes whether this project needs a native build at all and for which
platform — only a plan with a build in it has a backend question — and the second is decided with
the answer. Both passes are pure and free; paying for the second keeps `decideStartPlan` a function
of *project* state, with the host and the config staying the caller's business. The probe is skipped
entirely when the effective choice is already `eas`: two subprocesses that cannot change the answer
are two subprocesses not spawned.

### What the EAS route is made of

`prebuild` + `run:<platform>` becomes, at most:

1. `eas build:configure` — **only** when the project has no `eas.json`, because without one there is
   no `development` profile for the next step to name.
2. `eas build --platform <p> --profile development` — `runsOn: 'eas'`, `many-minutes`.
3. `expo start --dev-client` — `runsOn: null`.

**No prebuild.** EAS Build generates the native project itself for a CNG app, so a prebuild here
would be work done twice — and it is the step that wants the toolchain this route exists to avoid.

**The dev server is its own step**, because `eas build` builds and stops where `expo run:*` builds,
installs and starts.

### Installing is guidance

The local route installs what it builds. The cloud route ends with an artifact, and installing it
needs a booted simulator or an attached device — which is exactly what the host that sent the build
to the cloud may not have. So `eas build:run --platform <p> --latest` is named in the build step's
`reason` and in the plan's `Why`, and is **not a step** [decided — 2026-08-26]: a step that cannot
run on the host it was planned for is worse than a sentence saying what to run when there is
somewhere to run it. If a device probe ever informs the plan engine — [[0009-smart-followups]]
§Device-aware ladders already has one for the follow-ups — this is the first thing it should
reconsider.

The same asymmetry decides the **last-build record**: `recordBuildOf` ignores `eas` steps. That
record answers "does the app *installed on a device* match this project", and a cloud build that
nothing installed would mark the next plan fresh against an app no device is running.

### Running an `eas` step

`exagent dev` executed `expo` and refused everything else (`assertExpoStep`). It now accepts `expo`
and `eas`, resolved through `resolveEasCliOrThrow` — the *throwing* resolver, because a plan that
chose the cloud cannot do its job without the CLI, so an unreachable `eas` is an error rather than a
step that quietly does nothing. Since wave 18 that error needs a machine with no package runner at
all, because the published CLI is what runs (§Resolving the EAS CLI). Failure messages name the CLI the step actually ran (`npx eas build
…`, "the EAS CLI's own" exit code) and the needs-human classifier is given `tool: 'eas'`, because an
`eas build` that stopped for a login is a different scenario from an `expo start` that stopped for a
prompt.

### Resolving the EAS CLI

**An installed `eas-cli` is not something this CLI may expect** [confirmed — Kudo, 2026-08-26: "we
should not expect eas-cli is installed"]. The resolver had two rungs — the project's
`node_modules/.bin/eas`, then one on `PATH` — so a machine that had never installed it got `eas
unknown (no EAS CLI is installed, so nothing here can ask EAS about builds)` out of `status
--explain`, and an install line out of every command that needs EAS [observed — 2026-08-26, reported
by Kudo].

The answer is **one rung, taken every time: the package runner** [decided — Kudo, 2026-08-27]. Not a
ladder with a runner at the bottom — no project bin, no `PATH`, no fallbacks.

```
project declares eas-cli   ->  <runner> eas-cli          (the pin wins)
otherwise                  ->  <runner> eas-cli@latest
runner                     ->  bunx, when the project uses bun; else npx --yes
```

One rung is simpler *and* stronger, for two reasons, both measured before they were relied on:

1. **The runners already prefer the project's own copy**, so the "project bin first" rung was doing
   nothing the runner does not do.
2. **It kills the impostor class by construction.** What answered the name `eas` was whatever the
   machine had under it — a wrapper, a stale symlink, a shim from another tool
   ([[0001-agentic-cli-on-expo-cli]] §Constraints) — and every call site needed a guard against
   reporting its bytes as the service's answer. A runner resolves a *package*, never a file on
   `PATH`, so a stray `eas` is not spawned at all. The guards stay (`utils/wrapperCrash.ts`) and
   should now be unreachable; they are kept because "unreachable" is a claim about today's resolver,
   not about the process boundary. The `--version` probe that used to check the `PATH` candidate is
   **gone**, along with the candidate — one fewer flag on the foreign-flag inventory.

#### What the runners actually do

Claim 1 above is load-bearing, so it was verified rather than read [observed — live, 2026-08-27,
macOS, npm 11.17.0, bun 1.3.14, node 26.5.0; a project holding `eas-cli` 22.4.0 while the registry
served 22.6.0. A **dead registry** (`npm_config_registry=http://127.0.0.1:9/`) is what proves "no
fetch": a run that still answers cannot have reached one].

| Invocation | Project | Ran | Registry needed |
| --- | --- | --- | --- |
| `npx --yes eas-cli` | local 22.4.0 | **22.4.0** (local), 0.26–0.45 s | **no** |
| `bunx eas-cli` | local 22.4.0, `bun.lock` | **22.4.0** (local), 0.10 s | **no** |
| `npx --yes eas-cli` | 22.4.0 hoisted to a workspace root, run from `apps/app` | **22.4.0** (local), 0.48 s | no |
| `bunx eas-cli` | same monorepo | **22.4.0** (local), 0.09 s | no |
| `./node_modules/.bin/eas` | local 22.4.0 | 22.4.0, 0.32–0.42 s | no |
| `npx --yes eas-cli@latest` | local 22.4.0 | **22.6.0 — the pin is defeated** | **yes**; dead registry ⇒ exit 1 after **~70 s** |
| `bunx eas-cli@latest` | local 22.4.0 | 22.6.0, 5.81 s cold. The project's `bun.lock` was **byte-identical** afterwards | yes |
| `npx --yes eas-cli` | no local copy | 22.6.0, 1.13 s warm | yes |

Four things follow, and each one is a rule the code keeps:

- **The pin survives.** Local before published, without a rung for it, and in a monorepo too. Going
  through the runner costs about nothing against spawning the bin directly (0.26–0.45 s against
  0.32–0.42 s), which is what makes one rung affordable on the paths that promise to be quick.
- **A version in the spec defeats the pin**, so `pinned` chooses the bare name and nothing else may.
  The signal is the **declaration** in `package.json`, not an installed copy: the spec has to be
  chosen before anything runs. A package that does not declare it while a sibling workspace does
  therefore gets `@latest` and re-downloads a CLI that is on disk — the honest reading of "this
  project pinned a version", and a cost of one download rather than a wrong version.
- **`@latest` talks to the registry on every run, not just the first**, and stalls for the length of
  npm's retry ladder when it cannot reach one. Every caller spawns it under a deadline.
- **`--yes` for npm's exec only.** npx prompts before installing a package it has not seen, and a
  prompt is a hang rather than a question here: nothing this CLI spawns is given stdin
  ([[0006-agent-native-cli-surface]] §Non-interactive parity), so the answer can never arrive. `bunx`
  installs without asking and has no such flag. `--yes` is on the foreign-flag inventory and was run
  as the rule requires [observed — `npx --yes eas-cli@latest --version` answered `eas-cli/22.6.0
  darwin-arm64 node-v26.5.0`, exit 0].

`EAS_CLI_MISSING` survives with a much narrower meaning: **no `npx` and no `bunx` on `PATH`**, which
is a broken or absent Node install rather than a missing package. `npm install -g eas-cli` is gone
from its advice, because a reader who reaches it cannot run that either.

#### Killing a runner kills the CLI it started

The one thing that broke, found by an e2e that hung for its whole 45 s timeout instead of finishing
in about one [observed — 2026-08-27]. `child.kill()` signals the process this CLI holds a handle to.
That is now the *runner*; the program doing the work is its child, and it survives the signal,
inherits the pipes, and keeps them open — so `'close'`, which waits for EOF as well as for the exit,
never fires. **A deadline meant to stop a tool became a deadline that hangs the command it was
protecting**, and it applied to every timeout, every prompt guard and every forwarded Ctrl-C.

So subprocesses are spawned in a **process group of their own** and signalled as a group
(`src/utils/processGroup.ts`). Safe here because stdin is never attached, so a detached child could
not read a terminal even if it tried; terminal signals were already forwarded explicitly, and now
reach the whole group. Windows has no equivalent — a tree there needs `taskkill /T` — and is a known
gap rather than a solved problem.

#### What the first run costs, and who pays it

In a project that does not declare `eas-cli`, the rung is `npx --yes eas-cli@latest`: the first run
installs the package before the query starts, and every run asks the registry. `pinned` is what lets
each caller weigh that, and they answer differently [decided — 2026-08-27]:

- **The auth preflight declines to pay it.** `src/needsHuman/preflight.ts` reads
  `~/.expo/state.json` through `eas whoami`, and the two rungs under it — the project's own `expo
  whoami`, then `EXPO_TOKEN` — answer the same question from the same file for free. So it asks the
  EAS CLI **only when the project pins it**, where the runner resolves it out of `node_modules` in
  about a third of a second. In every other project `status` asks the project's Expo CLI instead,
  which is the same judgement `askProjectExpoAsync` beside it already made. Verified: a default
  `status` in a project with no `eas-cli` and no `eas` on `PATH` takes **1.58 s** and spawns no
  runner [observed — live, 2026-08-27].
- **`status --explain` widens its budget, and stays bounded.** `EAS_BUILD_RUNNER_TIMEOUT_MS` (45 s)
  replaces the 10 s per-platform deadline when the resolved invocation may download, so a modest
  install answers rather than expiring — and never the minutes a cold install or an unreachable
  registry can take, because `status` must not hang. A pinned project keeps the 10 s.
- **`impact` keeps its 20 s.** Its lookup is *opportunistic* — nobody asked for it, and the report is
  complete without it. Twenty seconds of a command's time is a fair ceiling on a nicety.

Expiring costs one `unknown` and never a wrong answer, and the reason says the fetch was why, that
the install happens once, and that an unreachable registry is the other possibility — with pinning
named as what makes the section work offline (`runnerDownloadNote`). Every reason and report renders
the source as the invocation — `npx --yes eas-cli@latest`, not the path `npx` was found at — so
nothing claims an `eas` binary exists on a machine that has none.

## The run target

The second question the developer may have an opinion about: **which app**, not where. `expo-go` or
`dev-build`.

`dev-build` moves exactly one row of the decision table — the `expo-go` row, to `needs-dev-client`.
Every row below it already ends in a development build, and nothing above it is affected. `expo-go`
moves nothing: this CLI can honour a preference for Expo Go and cannot enforce one, because no
config makes an incompatible project compatible. That case is **said out loud** rather than
silently ignored — "Expo Go cannot run this project, so the plan is a development build regardless"
— which is the difference between a preference that was considered and one that was dropped.

**No new flag names.** `--go` and `--dev-client` are `expo start`'s own, are already accepted and
forwarded by `exagent dev`, and already mean exactly this to a reader. They are now read *first*, as
the run target the plan is decided against. Passing both is refused.

## Where the config lives

Decision [decided — 2026-08-26]: **`package.json` › `expo` › `exagent`**.

Four candidates were considered against what each one costs.

**`app.json`, as a top-level `exagent` key beside `expo`. Rejected — it is broken by design.**
`@expo/config`'s `reduceExpoObject` warns and **discards every top-level key** when an `expo` object
is present: *"Root-level `expo` object found. Ignoring extra keys in Expo config"*
[observed — `packages/@expo/config/src/Config.ts`]. Every Expo command in the project would print
that warning, and the key would be ignored by the tool whose file it is in.

**`app.json`, under `expo.extra`. Rejected — it changes the fingerprint.** `extra` is part of the
hash `@expo/fingerprint` computes, removed only under the opt-in `ExpoConfigExtraSection` source
skip [observed — `packages/@expo/fingerprint/src/sourcer/Expo.ts`]. Writing a *tooling preference*
there would mark every existing development build of the project stale, which is the exact freshness
machinery [[0011-impact-and-freshness]] and the plan engine are built on. It is also shipped into
the app's manifest and readable at runtime, which a preference about this developer's laptop has no
business being.

**`exagent.config.js`. Rejected for now, recorded as a follow-up.** `metro.config.js` is a file
because Metro's configuration is *functions* — resolvers, transformers — and cannot be JSON.
`eas.json` is a file because it holds many named profiles with a schema of its own and is EAS's
contract with the service. This config is four scalars. A `.js` file would mean `require`-ing
project code inside a CLI whose `status` promises to be instant, and would make the config
unreadable by anything that is not this CLI — including another agent, and including this CLI's own
`--json`. If computed values ever become necessary, that is the moment to add it.

**`package.json` › `expo.exagent`. Chosen.** It is where this repository already keeps every other
piece of *tooling* configuration, as distinct from *app* configuration:
`expo.install.exclude` for the Expo CLI's installer
[observed — `packages/@expo/cli/src/install/checkPackages.ts`], `expo.doctor`
[observed — `packages/expo-doctor/src/utils/doctorConfig.ts`], and `expo.autolinking`
[observed — `packages/expo-modules-autolinking/src/commands/autolinkingOptions.ts`]. It is static
JSON, so one `readFileSync` answers it. `package.json`'s `expo` key is **not** merged into the
`ExpoConfig` — only `name`, `version` and `description` are read from that file
[observed — `Config.ts` `ensureConfigHasDefaultValues`] — and only `scripts` and the dependency set
reach the fingerprint [observed — `sourcer/Bare.ts`], so nothing here moves a hash or ships into the
app. And `expo.<tool>` survives `exagent` ever merging into the Expo CLI without the key moving.

The module is `src/settings/` rather than `src/config/`, because `src/config/` is
`exagent inspect:config-plugins` — the **app** config, which is the opposite kind of file.

### The schema

```json
{
  "expo": {
    "exagent": {
      "target": "expo-go" | "dev-build",
      "buildBackend": "local" | "eas",
      "ios": { "buildBackend": "local" | "eas" },
      "android": { "buildBackend": "local" | "eas" }
    }
  }
}
```

Two questions, kept orthogonal: **which app** and **where the build runs**. The per-platform
override exists because the detection it overrides is already per-platform, and because the case is
real: iOS builds in the cloud where the credentials live, Android on this machine where the SDK is.
`target` has no per-platform form — it is about the app, which is not a per-platform fact.

## Validation

Unknown keys and unknown values are **errors**, not warnings [decided — 2026-08-26].

The cost is real and is accepted: a project that names a key a newer `exagent` added cannot be read
by an older one, and the error says exactly that and lists the keys the running version knows. The
reason it is worth paying is that every key here exists to change what a build does. A preference
that was meant to change a plan and silently did not is a **wrong plan approved as a right one**,
which is the failure this entire document exists to prevent — the config-shaped version of the
doomed local build. A typo gets a "looks like" line, because `buildbackend` and `build-backend` are
what people actually write.

Two smaller calls. A `package.json` that is not valid JSON is an error rather than "no config":
a file this CLI cannot parse is a file whose preferences it cannot honour, and pretending none were
written is the silent drop again. A project with **no** `exagent` key is not an error and never
warns — saying nothing is the default and by far the common case.

`status` is the one exception to the fatality: it catches the error, reports every other line, and
exits 0, because `status` promises to be information rather than judgment
([[0004-smart-start-and-project-state]] §`exagent status`) and every other fact in that report is
still worth having. `impact` does the same for the follow-up hint, for the same reason: it answers a
question about a *change*, and refusing to answer it over a preference file would be the wrong
trade.

## What `status` reports

`status` resolves the plan through `resolveStartPlanAsync`, exactly as `dev` does, so the two
commands cannot disagree about what happens next — a `status` that named `expo run:ios` on a Linux
box was the report contradicting the command. `NextActionStatus` gains `buildLocation`, and the text
report gains a **`build`** line, printed only when the next plan contains a build:

```
build       eas · this host runs linux and a ios build needs Xcode, which does not exist for it.
```

Its own line rather than a clause on `next`, for the same reason `next` keeps `rule` when a running
dev server changes the command: where a build happens decides what the caller needs — a toolchain
here, or an account and a queue — and that is not a detail of a command name.

The cost is one probe. On a host that is not macOS the iOS answer is settled without spawning
anything, Android is a `stat`, and only macOS-and-iOS costs the two subprocesses — cached per
process, and bounded at 5 s. That is inside what `status` already pays for the fingerprint CLI and
the local-device probe.

## The follow-ups of a chosen backend

Three changes, all of them the same idea: a ladder must not offer a route the plan already took.

- **`dev --plan` on an EAS plan** leads with `npx eas whoami` instead of `eas-build-instead`. The
  cloud route needs an account, and "not signed in" is a failure that otherwise arrives *after* the
  upload. `eas-build-instead` survives for the one case that still produces a local plan on a
  machine that cannot build: a `--local` or a config that asked for it.
- **`impact`'s `needs-native-build`** keeps `npx exagent dev` first whichever backend was chosen —
  it is the command that *makes a plan*, and on a host that cannot build, the plan it makes is the
  cloud one — and changes the sentence to say which route that is and why. The second rung becomes
  `npx exagent dev --local`, the way past a choice the caller disagrees with.
- Nothing labels a preference it did not act on, and everything labels one it did. The run-target
  sentence is printed on **every** native row rather than only the row it moved, because "did my
  config do anything?" is a question the plan has to answer either way.

## Testing

The selection is a pure function over four inputs, so its whole matrix — host × toolchain × config ×
flag — is one table in `src/toolchain/__tests__/selectBackend-test.ts` (tier 0 of
[[0002-testing-and-evals]]). `hostPlatform` is a parameter rather than `process.platform` for
exactly this reason: a Mac has to be able to test what a Linux box decides.

`resolveAsync-test.ts` pins the *order* the four inputs are read in, with the probe stubbed.
`decide-test.ts` pins the steps each backend produces. The config's parser and reader are tested
without a project. End-to-end, `plan-test.ts` drives a stubbed `xcode-select` — the injection point
that already existed — for the EAS route, an unset `ANDROID_HOME` for the Android one, and a real
`package.json` edit for every config case, so the reader is exercised rather than a switch built for
the test. The one thing not covered by a test is a live `eas build` step, which is the same boundary
every other EAS-backed command in this package stops at.
