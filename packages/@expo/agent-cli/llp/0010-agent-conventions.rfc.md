# 0010: Agent conventions

**Type:** RFC
**Status:** Active
**Systems:** `@expo/agent-cli` launcher (`src/cli.ts`, `src/commandRegistry.ts`, `src/exitCodes.ts`, `src/utils/errors.ts`, `src/utils/jsonMode.ts`); `@expo/agent-cli typecheck` (`src/typecheck/`); the needs-human protocol (`src/needsHuman/`, `src/utils/subprocess.ts`, `src/utils/expoCli.ts`); `packages/@expo/cli`; `eas-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-23 · finalized 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]], [[0006-agent-native-cli-surface]], [[0008-guardrails]], [[0016-v1-scope]]

## Summary

The conventions every `@expo/agent-cli` command shares. Three of them: what the exit code means, how one argv resolves to one command, and which of the family's gaps the tool layer is working around. [[0006-agent-native-cli-surface]] owns the shape of the surface. This document owns the rules that hold across all of it.

## Exit codes

A driving agent reads the exit code before it reads a word of the output [confirmed, Kudo, 2026-08-23]. The code answers two questions: did the tool work, and did the thing the tool was asked about work.

| Code    | Meaning                                                                         | The agent's next move                            |
| ------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `0`     | The tool worked, the outcome was success                                        | Continue                                         |
| `1`     | The tool did not work: usage error, missing dependency, bug                     | Read the error and the `Try:` line. Fix the call |
| `7`     | The tool worked. A person must finish the step                                  | Hand the printed URL or instruction to the human |
| `20`    | The tool worked. The operation failed                                           | Read the payload. Act on the subject's failure   |
| `21`    | The tool worked. The operation was canceled. Reserved, emitted by no v1 command | Nothing branches on it in this release           |
| `22`    | The tool worked. The operation timed out (inconclusive)                         | Wait longer, or look again                       |
| `23-29` | Reserved for further outcome classes                                            |                                                  |

The codes sit in bands. `20-29` is one band an agent can test with a range, so a command that grows a new outcome class does not break a caller that only knew the old ones. `1` is the whole "the tool did not work" band: an agent that gets `1` reads the error. `7` sits away from both. A step only a person can complete (signing in through a browser, approving a device, finishing a launch in a web page) is its own class. The recovery is a person, so a retry of the same command cannot finish it. Timeout sits apart from failure. Retrying is the next action after `22` and a waste of minutes after `20`. Shell-safe: nothing above `125`, which POSIX shells and `npx` use for their own conditions.

`21` is reserved and no v1 command emits it. `build:wait` was the one command whose outcomes reached it, and it is deferred ([[0016-v1-scope]], code in `src/deferred/build-wait/`). A plan that stopped for consent exits `0` with `Nothing ran` ([[0008-guardrails]] §Consent is a re-run, never a prompt). That stop needs a TTY, so it cannot happen to an agent driving a pipe. The text leads with `Nothing ran`. `cli:start_plan_needs_consent` carries the fact and the `rerun` command on the event stream. Raising it to `21` would re-code every existing caller of a command that ran nothing. The constant stays defined. The number keeps its meaning for the command that brings it back. `src/__tests__/exitCodes-test.ts` sweeps the loadable source for `EXIT_OUTCOME_CANCELED` and fails when anything starts using it.

Implementation [observed, `src/exitCodes.ts`]: a tool error throws a `CommandError`, optionally carrying an `exitCode`. `logCmdError` prints it, puts it on the `cli:error` event, then exits with `error.exitCode ?? EXIT_ERROR`. An outcome is not an error. It calls `exitWithCodeAsync(code)`. Both flush the event logger first.

### An empty target list is inconclusive

`1`'s promise is that running the same line again changes nothing. After a reload, `/json/list` is empty for about half a second while the runtime comes back.

The wait belongs to the question. Every command whose `need` is `debugger-target` waits out `APP_RECONNECT_GRACE_MS` ([[0005-runtime-loop-tools]]). Commands that can work without a runtime skip it. What is left after the wait is `22`. The tool worked and could not conclude. It is reported only after the window, so the code says "asked for as long as it was worth asking".

No-dev-server and wrong-platform stay `1`. Neither becomes different within a second. The fix for the first is to start a dev server. The fix for the second is to change the flag. "Fix the call" is exactly what `1` says.

### Forwarded codes, and the exception

`install`, `start`, `dev`, and the `expo` passthrough hand back whatever the subprocess exited with, verbatim. A wrapper's own failures use the table.

The exception is a command that adds a verdict. `doctor` is `0` when every check passed, `20` when any failed, `1` only when the run produced no verdict ([[0016-v1-scope]] §Doctor's exit code). expo-doctor's own code stays on the `--json` `exitCode` field.

### EAS JSON

No `eas --json` payload can contain a `null`. `printJsonOnlyOutput` deletes every key whose value is null [observed, 2026-08-26, staging]. Absence is the only way that wire has of saying one. No parser may try to tell "the service said null" from "the service said nothing".

### The fourth: `typecheck`

`@expo/agent-cli typecheck` is the fourth command in the outcome band. The other gates parse and watch for throws. This one type-checks.

| Code | The project                                                              |
| ---- | ------------------------------------------------------------------------ |
| `0`  | type-checks, or has no TypeScript in it at all                           |
| `20` | does not type-check. The diagnostics are the payload                     |
| `1`  | a TypeScript project with no compiler, or one that failed saying nothing |

A project with no TypeScript exits `0`, with `checked: false`. `reason` is present exactly when `checked` is false. The follow-up says so in a command as well as in a field, so "nothing was checked" cannot read as "everything passed".

A TypeScript project with no compiler is `1` (`TYPECHECK_CLI_MISSING`), with `Try: npx @expo/agent-cli install typescript --dev`. Either `tsconfig.json` or `.ts`/`.tsx` sources makes it a TypeScript project. `.d.ts` files alone do not, since `expo-env.d.ts` is generated into every app.

No compiler is ever fetched. `doctor:check` falls back to `npx expo-doctor`. This command does not. A type check is a function of the project's own compiler version, its `tsconfig.json`, and its `@types`. Only `node_modules/.bin/tsc` counts.

A compiler that failed and printed nothing readable is `1`. Every verdict is read back out of what the compiler printed. Reporting a silent failure as an outcome would send an agent looking for a type error that was never reported.

Both output forms are parsed. `--pretty false` is asked for, and `pretty` is also a compiler option a project can set. A parser that knew only the terse form would report "no errors" for a project whose compiler printed the other one.

### Other gates, in brief

A command that reports on the app does not gate on what it reported. `runtime:errors` exits 0 whatever it collects. `--fail-on-error` exits 20 on a non-empty window, and 22 on a runtime that cannot answer ([[0005-runtime-loop-tools]]).

`runtime:reload` uses both codes of the band: 0 observed, 20 did not happen, 22 a mechanism ran and nothing was seen, 1 not attempted. Mechanism is [[0005-runtime-loop-tools]] §Reloading the app.

`status --assert <class>` exits 20 when the real class is stronger than the one named, and 22 when nothing could be classified. The default without the flag is 0. Any `--assert` or `--fail-on-*` flag answers a measured failure with 20 and an unmeasurable state with 22.

`runtime:stop` and `dev:stop`: already in the asked-for state is success, exit 0. `wasRunning` and `reason: "not-running"` keep the fact itself readable. A device tool that refused is 1. A foreign dev server is 20.

The entry-bundle check (`src/runtime/bundleCheck.ts`) is what `smoke`, `runtime:reload`, and `dev --detach --wait-ready` call. A broken bundle is 20. A cold first build that does not finish inside `--timeout` is 22. `unknown` is not `broken`. `bundle.checked` is exactly `bundle.ok != null`. The `dev:wait` command itself is deferred ([[0017-deferred-commands]]).

## Needs-human protocol

Exit `7` is raised through one error class, one event, one registry, and four ways of noticing [confirmed, Kudo, 2026-08-23].

`NeedsHumanError extends CommandError` [observed, `src/utils/errors.ts`]. It carries a `NeedsHuman` record (`scenario`, `need`, `command`, `url`, `unattendedEnv`, `resumable`, `detectedBy`), sets `exitCode` to `EXIT_NEEDS_HUMAN`, and exposes `isNeedsHuman: true`. Reclassification never renames a code. `logCmdError` emits `cli:error` (with `needsHuman: boolean`), then `cli:needs_human` with the whole record, then prints:

```
Needs a human   eas-login
Ask the user    npx eas login
Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)
```

The block replaces the `Try:` line. Line two already is the suggested command.

`src/needsHuman/registry.ts` is a data table. Thirteen scenarios. Two rows are marked `generic`: `expo-prompt` and `eas-prompt`. They sort last. Callers never match strings themselves.

Four layers, in priority order:

1. Preflight. `src/needsHuman/preflight.ts` runs `eas whoami` with a short deadline and caches the answer. A preflight that cannot run answers `null`. Three things count as cannot run: no `eas` on this machine, a run that passed the deadline, and a binary under that name that is not the EAS CLI (`looksLikeWrapperCrash`). `src/needsHuman/assertAuth.ts` is the same answer raised.
2. By construction. Rows with no signature (`ios-credentials`, `device-register`, `eas-env-list`) are raised before the tool runs, because those eas-cli commands have no `--non-interactive` flag.
3. Stderr classify. Match the captured output against the registry. Load-bearing patterns: eas-cli's `Either log in with … EXPO_TOKEN`, `@expo/cli`'s `is in non-interactive mode`, and the `in non-interactive mode` fragment eas-cli's prompt sites share.
4. Generic prompt fallback. For a captured child only, and only when the caller opts in. If it writes nothing for `AGENT_CLI_PROMPT_TIMEOUT_MS` (default 20 s) _and_ its last non-empty line is prompt-shaped, it is killed and the line is quoted as untrusted text. Never in `inherit` mode.

Every captured subprocess is told that nothing can answer it. For `expo` that is `CI=1` in the child environment, because the CLI rejects `--non-interactive` and names the variable instead. The exception is the one that starts a dev server (`spawnDevServerAsync`: `expo start`, `expo run:ios`, `expo run:android`). `CI` turns Metro's file watcher off (`isWatchEnabled` returns `!env.CI`). A captured `expo start` inherits the caller's environment instead. Nothing is set, rather than `CI=0`: a machine whose own environment says `CI` is a machine where a frozen bundler is the right behaviour. A captured child's stdout is a pipe, never a TTY, so `isInteractive()` already knows nobody can answer. `expo prebuild` and every other captured step keep `CI=1`. For `eas` it is `--non-interactive`, or `--json`, which implies it. stdin is never attached.

A busy port is a `PORT_IN_USE` failure (exit 20 when the caller named `--port`), or a retry on a free port this CLI picked (`src/dev/portCollision.ts`). It is recognised before the classifier runs. It is not needs-human ([[0004-smart-start-and-project-state]] §A busy port is not a step only a person can complete). The recovery is another command, and one this CLI can run itself. The carve-out is not a negative signature in the registry. `expo-prompt` still catches every other prompt.

`src/utils/wrapperCrash.ts` treats a failure as "not the CLI" only when the output holds nothing that looks like that CLI's _and_ the process died the way a wrapper dies (exit `101`, `126`, `127`, `134`, `139`, or a panic signature). The preflight then answers `null` instead of `false`.

A failed `@expo/agent-cli dev` plan step raises. The plan object prints only when every step of it worked. `--json` gets the error envelope (`PLAN_STEP_FAILED`), with the tail of what the step printed. A genuine stop carries `error.needsHuman`. A coincidence (Node leaving with `7` after an unhandled rejection) carries `null` under that envelope. Forwarded passthrough commands inherit the terminal and are not classified. `src/passthrough/` is unchanged on purpose.

The deploy's two auth failures exited `1` and now exit `7`. The plan engine joined the protocol on the same terms: `dev` captures its steps whenever nobody is watching a terminal, under `--json` or a non-TTY run, and inherits when somebody is.

## The `--json` error envelope

A command invoked with `--json` prints one JSON object on stdout whether it succeeded or failed [confirmed, Kudo, 2026-08-23]. The failure object is:

```json
{
  "error": {
    "code": "EAS_DEPLOY_FAILED",
    "message": "…",
    "suggestedCommand": "npx eas-cli whoami",
    "needsHuman": { "scenario": "eas-login", "need": "…", "command": "npx eas login" },
    "data": null
  }
}
```

The key set never varies. `suggestedCommand`, `needsHuman`, and `data` are `null` rather than absent. `data` holds a flat object of the facts the refusal was made on, or `null`. The key set inside `data` is fixed per error code. Nothing goes in it that is not already in the message a person reads. The code is the one the site already shipped. Success paths are untouched. Stderr still carries the what / Why: / How: / `Try:` block.

The envelope covers argument parsing. `typecheck --json --bogus` used to exit 1 with an empty stdout and a bare `unknown or unexpected option` on stderr. `assertWithOptionsArgs` throws a `CommandError` (`argParseError`) now, and so does the stray-positional check next to it. `cli.ts` catches at the one place every command is invoked from, which is what makes the envelope a property of the CLI rather than of each command. A bad option gets the what / why / how shape and `Try: <command> --help`. When the option exists on a sibling command, such as `--port` on `dev` or `--route` on `runtime:reload`, `OPTION_OWNERS` names it. A unit test pins that every command it names still resolves.

`setJsonRequested(argvRequestsJson(commandArgs))` answers the flag from the raw argv. `logCmdError` runs after the command module threw, often before that module ever parsed its own arguments. `argvRequestsJson` only looks before a `--` separator. `@expo/agent-cli install -- --json` is npm's flag.

In `--json` mode `dev` captures the subprocess and prints exactly one object when the run ends: the plan with the step results on a clean exit, or the envelope. `@expo/agent-cli dev --json` used to emit the plan object and then run the plan, so a failing run printed two objects, and the spawned dev server appended raw Metro log lines after the closing brace. `dev --plan --json` is unchanged: there the plan is the answer. The plan still reaches a driving agent before the first step, on the `cli:start_plan` event.

The exit code is still the first thing to read. The envelope explains a failure. It does not signal one.

## Registry rules

Two resolution rules live in the one pure `resolveCommand` [observed, `src/commandRegistry.ts`].

### (a) Options without an action are an error, not help

`@expo/agent-cli runtime --json` used to resolve to `group-help`, print the group listing, and exit 0. A human reads that as an answer. An agent reads the exit code, believes its command worked, and waits for output that is never coming.

A group name followed by options and no action, in a group with no `defaultAction`, resolves to `flags-without-action`. `cli.ts` prints the group listing first and the error last, as `UNKNOWN_ACTION` with `Try: npx @expo/agent-cli <group> --help`, and exits `1`. The last line is what an agent acts on.

A bare group still prints its listing and exits `0`. There is nothing wrong with asking a group what it does. `<group> --help` and `-h` are always the listing. A group that declares a `defaultAction` still gives it every option, so `@expo/agent-cli doctor --json` checks.

### (b) A group cannot capture the bare form of a forwarded `expo` command

The naming rule of [[0006-agent-native-cli-surface]] decides it. A command sharing a name with an `expo` command behaves like that command.

The bare form of such a name forwards: `@expo/agent-cli config --type public` is `expo config --type public`. The colon forms belong to the group: `config:doctor` resolves as any group action does, and an action the group does not have is `UNKNOWN_ACTION`, never a forward. The space form is unavailable there: `@expo/agent-cli config doctor` forwards two arguments to `expo config`.

A group under a forwarded name reaches its actions by one spelling instead of two. The group's `--help` must show the colon form.

### (c) A group named after another CLI's verb recovers into that CLI

A `CommandGroup` may declare `bareNameCommand`. When it has one, the `flags-without-action` error names it, and the `Try:` line is that command with the caller's own flags on it (`Try: npx eas build --platform ios`). The recovery is a paste.

v1 emptied `build`. `@expo/agent-cli build --platform ios` now answers from the absent-capability table: "starting a build is the EAS CLI's job", with `Try: npx eas build`. The `bareNameCommand` mechanism is kept and still tested.

This is narrower than rule (b). Rule (b) is for a name in the forwarded set, where `@expo/agent-cli` runs the other command itself. This is for a name owned by a CLI `@expo/agent-cli` does not forward.

### (d) An argument a command has no place for is an error, not a shrug

`@expo/agent-cli checkpoint:undo <id>` accepted the argument, dropped it, restored the newest checkpoint, and reported that it had worked. A silent no-op is the one answer a driving agent cannot recover from ([[0006-agent-native-cli-surface]]).

Every call to `assertWithOptionsArgs` states `positionalArgs: 'none' | 'own'`, with no default, so the type checker asks the question of every command that parses arguments. `'none'` reports a `BAD_ARGS` naming what was dropped, plus an optional per-command sentence for what the caller probably meant (`checkpoint:undo` names `--id`). `'own'` is for a command that reads `args._` itself. `arg` puts unrecognized options into `_` there, so rejecting them as positionals would reject the flags the resolver goes on to read. `dev` and `start` declare `'own'` because their arguments are forwarded to the Expo CLI.

## Three names for the recovery

`help workflow` must say all three ([[0024-cli-ui]] §The on-ramp):

| Band                                         | Where the recovery is                                | Under `--json`           |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| `1`, and any failure a command raises itself | `Try: <command>`                                     | `error.suggestedCommand` |
| `7`                                          | `Ask the user <…>`, under `Needs a human <scenario>` | `error.needsHuman`       |
| `20`, `22`                                   | the report's `Suggested next:` list                  | the report's `followups` |

`logCmdError` prints the needs-human block instead of `Try:`. An outcome failure is not an error: it prints its report and calls `exitWithCodeAsync`. A `20`-band failure a command _raises_ still carries a `Try:` (`stillBuildingError`).

## Suggestions are pasted, so they have to be runnable

Every suggestion is written `npx @expo/agent-cli …` and printed in the spelling of the runner the caller actually used [confirmed, Kudo, 2026-08-25]. `src/utils/invoker.ts` rewrites the line as it goes out. Detection is `npm_config_user_agent` / `npm_execpath`. `process.versions.bun` is usually unset under `bunx` because this package's bin has a `#!/usr/bin/env node` shebang. `BUN_INSTALL` is not consulted. Only `npx @expo/agent-cli` is rewritten. `--json` payloads and events keep the written form.

The runner this CLI _spawns_ with is a different question [confirmed, Kudo, 2026-08-26]. `src/utils/packageRunner.ts` resolves `bunx` when Bun started the process _and_ `bunx` is on `PATH`. Five call sites use it: the `eas-cli` auth fallback, `expo-doctor`, `create-launch`, `create-expo`, and the `npx expo` fallback. `eas simulator:exec npx <agent-device>` is exempt: that `npx` runs in a datacenter.

## `inspect:build-log`

The failure-signature table is capped and in-repo. Design, cap, and fixtures are [[0012-build-explain]].

## Upstream asks

Gaps found while building the tool layer. Per [[0001-agentic-cli-on-expo-cli]] constraint 5, these become upstream improvements rather than imports. Recorded here, not yet filed.

`eas-cli` (swept against 22.4.0, 2026-08-26):

- `build:logs`, to read a build's logs from the CLI. `build:view --json` hands back a `logFiles` array of signed GCS URLs, which is a fetch away and is not the same thing.
- `credentials:list --json --non-interactive`.
- `--non-interactive` on `build:view` and `submit:view`.
- Typed non-interactive errors, a machine-readable code when a command cannot proceed without a prompt. This would retire the signature table.
- `env:list --json`.

`@expo/cli`:

- Do not let `expo start --ios` take the dev server down with it (`ensureSimulatorAppRunningAsync` / `osascript`).
- Separate "nobody can answer a prompt" from "do not watch files". `CI` means both today (`isWatchEnabled()` returns `!env.CI`).
- Emit `cli:error` JSONL for every command error, with a `needsInput` flag.
- Put the Metro error class on the web dev server's static error page, and report the file relative to the project root.
- A standalone typegen command, so `expo-env.d.ts` and `.expo/types/` can be generated without starting a dev server.
- `expo cache:clear`.
- Do not print the app's deep-link scheme as the dev server's URL. With the v2 tunnel, `getDevServerUrl()` picks up `UrlCreator.defaults.scheme`. Worked around in `src/dev/advertisedUrl.ts`.
- Emit `devserver:url` in a released SDK. expo 57.0.17 does not. Until then the tunnel host is parsed from `Waiting on <url>`.

`create-expo`:

- A `--no-git` flag. Worked around by removing the repository create-expo made, and only ever that one (`src/new/git.ts`).

`expo-doctor`:

- `expo-doctor --json`.

Expo Go (iOS):

- A cold launch with a dev-server URL kills the app on its own updates database (`UNIQUE constraint failed: updates.scope_key, updates.commit_time`). Worked around by restarting the shell with no URL, then sending the link ([[0005-runtime-loop-tools]]).

`agent-device`:

- A `close` that reports the app it acted on ([[0005-runtime-loop-tools]]).
- `open <app> <url>` should not be the recommended shape for an Expo Go dev URL while the launch path above is broken.

## Testing

Unit tests pin the constants and all four resolution rules, including a synthetic group registered under a forwarded name for rule (b) [observed, `src/__tests__/exitCodes-test.ts`, `src/__tests__/commandRegistry-test.ts`]. The `--json` envelope and the needs-human protocol are tested at both tiers, through the published bin ([[0002-testing-and-evals]]).
)
