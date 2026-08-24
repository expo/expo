# 0010: Agent Conventions — Exit Codes, Registry Rules, Upstream Asks

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` launcher (`src/cli.ts`, `src/commandRegistry.ts`, `src/exitCodes.ts`, `src/utils/errors.ts`); `exagent build:wait` (`src/builds/`); `exagent dev:wait` (`src/dev/waitAsync.ts`, `src/dev/waitFormat.ts`); the needs-human protocol (`src/needsHuman/`, `src/utils/subprocess.ts`, `src/utils/expoCli.ts`); `packages/@expo/cli`; `eas-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-23
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0006-agent-native-cli-surface]], [[0002-testing-and-evals]]

## Summary

The conventions every `exagent` command shares, written down once so a feature does not decide them again: what the exit code means, how one argv resolves to one command, and which of the family's gaps the tool layer is working around rather than fixing. [[0006-agent-native-cli-surface]] owns the shape of the surface; this document owns the rules that hold across all of it.

## Exit codes

Decision [confirmed — Kudo, 2026-08-23]. A driving agent reads the exit code before it reads a word of the output, so the code answers two questions that a single non-zero number cannot: **did the tool work**, and **did the thing the tool was asked about work**. A command that ran a smoke test and reported the app crashing has done its job perfectly; a command that could not find the project has not. `1` for both makes the agent scrape stdout to tell them apart, which is the failure mode this convention exists to remove.

| Code    | Meaning                                                     | The agent's next move                             |
| ------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `0`     | The tool worked, the outcome was success                    | Continue                                          |
| `1`     | The tool did not work: usage error, missing dependency, bug | Read the error and the `Try:` line; fix the call  |
| `7`     | The tool worked; a person must finish the step              | Hand the printed URL or instruction to the human  |
| `20`    | The tool worked; the operation failed                       | Read the payload; act on the _subject's_ failure  |
| `21`    | The tool worked; the operation was canceled                 | Nothing is known; re-run if it was not deliberate |
| `22`    | The tool worked; the operation timed out (inconclusive)     | Wait longer, or look again                        |
| `23–29` | Reserved for further outcome classes                        | —                                                 |

Rationale for the shape [inferred]:

- **Bands, not a flat enumeration.** `20`–`29` is one band an agent can test with a range, so a command that grows a new outcome class does not break a caller that only knew the old ones. `1` stays the whole "the tool did not work" band on purpose: an agent that gets `1` never has a useful branch beyond reading the error, which llp/0006 §Errors are prompts already makes one hop.
- **`7`, away from both bands.** A step only a person can complete — signing in through a browser, approving a device, finishing a launch in a web page — is neither a tool error nor an outcome. The recovery is not another command, so it must not look like one that a retry could fix. The error class that carries it arrives with the first command that needs it; the number is reserved now.
- **Timeout apart from failure.** Retrying is the obvious next action after `22` and a waste of minutes after `20`. Collapsing them costs either wasted builds or missed successes.
- **Shell-safe range.** Nothing above `125`, which POSIX shells and `npx` use for their own conditions.

Implementation [observed — 2026-08-23, `src/exitCodes.ts`]: the constants are the only place a code is spelled, and there are two supported ways to leave the process with one. A **tool** error throws a `CommandError`, optionally carrying an `exitCode`; `logCmdError` prints it, puts it on the `cli:error` event with its `suggestedCommand`, then exits with `error.exitCode ?? EXIT_ERROR`. An **outcome** is not an error and has nothing to print that the command has not printed already, so it calls `exitWithCodeAsync(code)`. Both flush the event logger first: `process.exit` drops whatever the JSONL stream has buffered, which would lose the very events that explain the code the agent just read.

### The first command in the outcome band: `build:wait`

[observed — 2026-08-23, `src/builds/`] `exagent build:wait <id>` is the first command whose whole answer is its exit code, and it is what the `20`–`29` band was reserved for. It attaches to an EAS build that already exists — one started by CI, by the dashboard, or by another agent — polls `eas build:view <id> --json`, and leaves with what the build did:

| Code | The build | Where it is decided |
| ---- | --------- | ------------------- |
| `0`  | `FINISHED` | `src/builds/status.ts` |
| `20` | `ERRORED` | `src/builds/status.ts` |
| `21` | `CANCELED`, **or this wait was interrupted** | `src/builds/status.ts` |
| `22` | still running when `--timeout` elapsed | `src/builds/waitAsync.ts` |
| `1`  | not readable: bad id, no `eas`, not signed in, three failed polls | `CommandError` |

Three details of the mapping are decisions rather than transcription:

- **An unrecognized status is not terminal.** The status enum belongs to a service that ships without this CLI, so a status the table has never seen keeps the wait polling. Ending on it would report an outcome nobody observed; the timeout is what stops a wait that is wrong about this, and `22` says "inconclusive" rather than claiming a result. `PENDING_CANCEL` is the concrete case — a cancellation asked for and not yet happened, which still resolves to `CANCELED` or `FINISHED`.
- **An interrupted wait exits `21`, not `130`.** The definition of `21` above is "canceled by the caller (a declined prompt, `SIGINT`) or by the service", and a Ctrl-C is the caller cancelling. `130` would have been a second convention for the same fact. The two are told apart on the event stream (`cli:build_wait.interrupted`) rather than in the `--json` payload, whose key set is fixed.
- **Three failed polls is `1`, not an outcome.** A wait that cannot read the build has not learned anything about it, so it is a tool failure — and its `Try:` line names `eas workflow:status <id> --wait --json`, because a build id and a workflow id look alike and come from the same places.

Progress goes to the `LOG_EVENTS` JSONL stream as `cli:build_wait_poll`, never to stdout, so `--json` still prints exactly one object ([[0006-agent-native-cli-surface]] §Output contract).

Two consequences worth stating. First, adopting the convention changed no shipped command's exit code by itself; the one command that has been re-coded since is the deploy's auth failure, and that was a deliberate, separate decision recorded below. Second, the convention does not reach a **forwarded** code. `install`, `start`, `dev` and the `expo` passthrough hand back whatever the subprocess exited with, verbatim — `expo prebuild` failing with `3` makes `exagent dev --ios` exit `3` [observed — `e2e/__tests__/dev-test.ts`] — because inventing a code there would hide the one the tool actually reported. A wrapper's _own_ failures use the table; a subprocess's do not.

### The second: `dev:wait`, and what an outcome is an outcome *about*

[observed — 2026-08-23, `src/dev/`] `exagent dev:wait` joined the band next, and it made the band's
one ambiguity concrete: `20` says "the operation failed", and a readiness gate has to decide what
its operation *is*. Waiting for a dev server to answer, or establishing that this project's app is
in a state worth reading? The command exists for the second, so that is what its code answers.

Decision [confirmed — Kudo, 2026-08-23]. A dev server that proved it serves **another project**
exits `20`, with `ok: false`. Before, it exited `0` with `ok: true` while the human report said, on
screen, `serves /other/app, not /this/app` — the two channels of one command disagreeing, with the
machine one wrong. An agent gating on the exit code proceeded into a stranger's app; the `--help`
of the same command calls the project-root header "the one thing a port scan cannot prove", so the
command detected the mismatch and then declined to act on it.

Three details of that mapping are decisions rather than transcription:

- **`null` is not `false`.** A dev server that named no project root has not been *shown* to be the
  wrong one, and `matchProjectRoot` answers `null` for it. Failing on undecidable would fail every
  dev server too old to send the header, which is a different command's problem to have.
- **A mismatch is `20`, never `22`,** even when the wait also expired. `22` means "look again", and
  no amount of looking turns another project's dev server into this one's. The mismatch is checked
  before the timeout for exactly this reason.
- **The human output is unchanged.** It was already right. Only `ok` and the exit code moved, which
  is the smallest change that makes the two channels agree.

## Needs-human protocol

Decision [confirmed — Kudo, 2026-08-23]. Exit `7` above needed a way to be _raised_, and the class of failure it names is the one an agent cannot recover from by trying harder: a login, an Apple two-factor push, a device to scan a code on, a page to open. This section is the convention for all of them — one error class, one event, one registry, four ways of noticing.

### The class

`NeedsHumanError extends CommandError` [observed — `src/utils/errors.ts`]. It carries a `NeedsHuman` record — `scenario`, `need`, `command`, `url`, `unattendedEnv`, `resumable`, `detectedBy` — sets `exitCode` to `EXIT_NEEDS_HUMAN` on construction, and exposes `isNeedsHuman: true`. The boolean is the point: an agent must not need a code allowlist to know its user is required. The `code` stays per site, so a failure that is reclassified keeps the code it shipped with — `LAUNCH_NOT_AUTHENTICATED` is still `LAUNCH_NOT_AUTHENTICATED`, and now also scenario `expo-login`.

`logCmdError` emits `cli:error` (now with `needsHuman: boolean`), then `cli:needs_human` with the whole record, then prints the error and ends with three lines [observed — `src/utils/errors.ts`]:

```
Needs a human   eas-login
Ask the user    npx eas login
Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)
```

`label value`, per [[0006-agent-native-cli-surface]] §Output contract, with the recovery last. The block replaces the `Try:` line rather than following it: line two already _is_ the suggested command, and printing both would end the output on the weaker of the two.

### The registry

`src/needsHuman/registry.ts` is a data table, in the style of `src/commandRegistry.ts`: thirteen scenarios, each with its id, code, one sentence of need, the command or URL a person uses, the environment variables that remove the need on an unattended machine, whether a re-run resumes, the tools whose output it may be recognised in, and the stderr patterns that recognise it. Callers never match strings themselves.

Two of the rows are marked `generic` — `expo-prompt` and `eas-prompt`. They name no command of their own, because the command a person has to run is the one that just stopped, so the classifier fills it in from the invocation. They sort last, which is what makes them a fallback: a generic answer that names the tool and quotes what it printed beats a confident wrong guess, and that is the same honesty `src/deploy/launchCli.ts` already practices about `create-launch` output.

Rows with no signature are not a gap. `ios-credentials`, `device-register` and `eas-env-list` are raised _by construction_: 39 of eas-cli's 144 commands have no `--non-interactive` flag at all [observed — eas-cli 22.2.0 manifest], so needing one of them is knowable before it runs. `apple-auth` deliberately has none either: the wording of an Apple sign-in failure is Apple's, and a pattern broad enough to catch it would claim a two-factor push for every Apple error.

### Four layers, in priority order

1. **Preflight** — ask the cheap question first. `src/needsHuman/preflight.ts` runs `eas whoami` with a short deadline and caches the answer for the process. `eas whoami` is asked before `EXPO_TOKEN` is looked at, because it also knows the account _name_ and because it reads the variable itself — so a token the service rejects reads as "not signed in" rather than as a login. A preflight that cannot run answers `null`, which is not "signed out": the two lead to different next actions. This is the `auth` section of `exagent status` [observed — `src/status/`].
2. **Force non-interactive** — every captured subprocess is told that nothing can answer it. For `expo` that is `CI=1` in the child environment, because the CLI rejects `--non-interactive` and names the variable instead [observed — `packages/@expo/cli/src/index.ts`]; `spawnExpoAsync` is the capture path that sets it, and `runExpoAsync` deliberately does not, because there a person has the terminal. For `eas` it is `--non-interactive`, or `--json`, which implies it. stdin was already never attached [observed — `src/utils/subprocess.ts`].
3. **Exit signature** — match the captured output against the registry. Three patterns are load-bearing today: eas-cli's `Either log in with … EXPO_TOKEN` [observed — `build/user/SessionManager.js`], `@expo/cli`'s `is in non-interactive mode` [observed — `src/utils/prompts.ts`], and the `in non-interactive mode` fragment eas-cli's many prompt sites share.
4. **Prompt-hang guard** — for a captured child only, and only when the caller opts in. If it writes nothing for `EXAGENT_PROMPT_TIMEOUT_MS` (default 20 s) _and_ its last non-empty line is prompt-shaped, it is killed and the line is quoted as untrusted text. Both halves are required: silence alone is a long build, and killing that would be worse than the hang it prevents. Never in `inherit` mode, where a prompt is legitimate.

The prompt shape is `/[?:]\s*$|^\s*[?›»]\s+\S|\(y\/N\)|\(Y\/n\)|Password|passphrase/i` [observed — `src/needsHuman/detect.ts`]. The leading-marker half was added because `prompts` and `inquirer` write the marker at the _start_ — `? Select a platform` is a question that ends in neither a question mark nor a colon.

### What it costs, and the hole that stays

The breaking change [observed — `e2e/__tests__/deploy-test.ts`]: the deploy's two auth failures exited `1` and now exit `7`. At 0.0.2 that is the right moment; a CHANGELOG entry records it.

Two limits, both deliberate. First, the **forwarded commands are not covered**. `exagent login`, `exagent prebuild` and the rest of the passthrough inherit the terminal, so their output is never captured and nothing can be classified — `src/passthrough/` is unchanged on purpose. Second, there is **no `--json` error envelope** [observed — `src/cli.ts`, `src/utils/errors.ts`]: a failing command prints prose on stderr and nothing on stdout, whatever mode it was asked for, so the handoff travels on the printed block and on `cli:needs_human`, both machine-readable. Adding a JSON error object for every command is a separate decision about the whole error path, not a needs-human one.

Signature matching is version-coupled to two CLIs that do not promise their wording — which is why the generic rows exist, why they are last, and why the upstream ask below is the real fix.

## Registry rules

Two resolution rules generalize what [[0006-agent-native-cli-surface]] §The `exagent` launcher describes, and both live in the one pure `resolveCommand` [observed — `src/commandRegistry.ts`].

### (a) Options without an action are an error, not help

Before [observed — 2026-08-22]: `exagent runtime --json` resolved to `group-help`, printed the group listing, and **exited 0**. A human reads that as an answer. An agent reads the exit code, believes its command worked, and waits for output that is never coming — a silent no-op is the one answer a driving agent cannot recover from.

Now [observed — 2026-08-23]: a group name followed by options and no action, in a group with no `defaultAction`, resolves to `flags-without-action`. `cli.ts` prints the group listing first and the error last — the last line is what an agent acts on — as `UNKNOWN_ACTION` with `Try: npx exagent <group> --help`, and exits `1`.

Unchanged, deliberately: a bare group still prints its listing and exits `0` (there is nothing wrong with asking a group what it does), `<group> --help`/`-h` is always the listing, and a group that declares a `defaultAction` still gives it every option — `exagent checkpoint --label x` snapshots, because there the options do belong to something.

### (b) A group cannot capture the bare form of a forwarded `expo` command

The case it is written for [inferred, no such group exists yet]: `config` is in the forwarded set, and a future `config:*` group would want the colon names without taking `exagent config` away from `expo config`. The naming rule of llp/0006 decides it — a command sharing a name with an `expo` command behaves like that command — so:

- The **bare** form of such a name forwards: `exagent config --type public` is `expo config --type public`.
- The **colon** forms belong to the group: `config:doctor` resolves as any group action does, and an action the group does not have is `UNKNOWN_ACTION`, never a forward.
- The **space** form is unavailable there: `exagent config doctor` forwards two arguments to `expo config`, because the bare form is what it starts from.

Cost [observed]: a group under a forwarded name reaches its actions by one spelling instead of two, so the "the space form is free" property of llp/0006 has an exception, and the group's `--help` must show the colon form. That is cheaper than a name meaning two things depending on its arguments.

### (c) A group named after another CLI's verb recovers into that CLI

Rule (a) says what `exagent build --platform ios` must not do — print a listing and exit 0. It does not say what the reader should do instead, and for this group the honest answer is not "read our help": `build` is a real verb of a real CLI, `--platform ios` is a real flag of it, and the caller aimed a correct command at the wrong binary.

So [observed — 2026-08-23, `src/commandRegistry.ts`] a `CommandGroup` may declare `bareNameCommand`, the command another CLI owns its bare name for. When it has one, the `flags-without-action` error names it and the `Try:` line is that command **with the caller's own flags on it** — `Try: npx eas build --platform ios` — so the recovery is a paste rather than a re-read. A group without one is unchanged and recovers into `npx exagent <group> --help`.

This is narrower than rule (b), and the two do not overlap: rule (b) is for a name in the *forwarded* set, where `exagent` runs the other command itself; this is for a name owned by a CLI `exagent` does not forward, where the only thing to hand back is the command line.

## `build:explain`: the rule table is capped and in-repo

Decision [confirmed — Kudo, 2026-08-23]. The failure-signature rules that `build:explain` matches build logs against ship **in the repository, as a bounded table** — a capped set of Expo-specific signatures with a test each, reviewed like code and versioned with the CLI.

This does not reopen [[0001-agentic-cli-on-expo-cli]] §Scoped out, which rules out **the build-failure signature DB**: a hosted, growing, community-fed corpus with its own service, submission path and moderation. What is in scope is the opposite of that in every dimension that made it a scope-out — no service, no ingestion, no unbounded growth, no data to moderate. Rationale [inferred]: the value of the feature is concentrated in a small number of failures Expo itself causes and can name precisely (a missing pod, a mismatched SDK, an unsupported New Architecture module); a table that stays small stays accurate, and the cap is what keeps a maintainer from answering every field report by appending a rule instead of fixing the cause.

## Upstream asks

Gaps found while building the tool layer. Per the process boundary of [[0001-agentic-cli-on-expo-cli]] constraint 5, these become upstream improvements rather than imports — but they are **recorded here, not yet filed**, and each is worked around in the meantime.

`eas-cli`:

- `build:logs` — read a build's logs from the CLI. Today the logs are reachable through the web dashboard, so a headless agent explaining a failed build has nothing to read.
- `credentials:list --json --non-interactive` — see what credentials a project has without a TTY.
- `--non-interactive` on `build:view` and `submit:view` — both are read-only and both can still prompt.
- Typed non-interactive errors — a machine-readable code when a command cannot proceed without a prompt, so the tool layer can distinguish "needs a human" (exit `7` above) from "failed". This is the ask that would retire the signature table of the needs-human protocol: today the wording of 100-plus prompt sites is what the classifier reads, and it is version-coupled to a CLI that never promised it.
- `env:list --json` — the environment a build will run with, as data.

`@expo/cli`:

- Emit `cli:error` JSONL for every command error, with a `needsInput` flag — the event contract of llp/0006 §Output contract, extended so a wrapper can see that a prompt is what stopped the command.
- `expo cache:clear` — one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at.
- `expo-doctor --json` — the doctor report as data, so its checks can drive a decision instead of a regex over prose.

Libraries:

- `@expo/fingerprint --git-ref` — fingerprint a revision without checking it out, which is what makes "did the native layer change since the last build?" answerable cheaply.
- `@expo/config-plugins` `_internal.modProvenance` — which plugin wrote a given native change, so an explanation can name the cause rather than the symptom.

## Testing

Unit tests pin the constants and all three resolution rules, including a synthetic group registered under a forwarded name for rule (b) [observed — `src/__tests__/exitCodes-test.ts`, `src/__tests__/commandRegistry-test.ts`]. E2E tests pin what the process boundary actually shows: the exit code and the last line of output for a group given options with no action [observed — `e2e/__tests__/wrapper-test.ts`, `e2e/__tests__/build-wait-test.ts`]. Per [[0002-testing-and-evals]], every layer runs with no TTY attached.

The outcome band gets its own discipline, because a code is not testable by reading it. `build:wait`'s status table is exhaustive at the unit level — every status in both casings and both separators, plus values it has never heard of — and each of the four exit codes gets a separate e2e test against a stub `eas` bin walking a scripted status sequence [observed — `src/builds/__tests__/status-test.ts`, `e2e/__tests__/build-wait-test.ts`]. One test asserting "some non-zero code" would pass while the distinction the band exists for was broken.

The needs-human protocol is tested the same way, at both tiers [observed — 2026-08-23]. Unit: the classifier against a table of recorded output, one sample per signature that exists plus the cases that must answer `null`; the registry invariants (unique ids and codes, `SCREAMING_SNAKE` codes, a command or a URL for every row that is not a generic fallback, the fallbacks last); `logCmdError` with a `NeedsHumanError`, asserting the event pair, the three printed lines and exit `7`; the preflight answering from one subprocess however often it is asked; the hang guard on fake timers, including the two cases it must _not_ fire in. E2E, through the published bin with stdin closed: a stub `eas` printing the real `SessionManager` auth line, a stub `expo` printing the real non-interactive line, and a stub that prints a question and then waits forever — each asserting the exit code, the printed block and the `cli:needs_human` event in `LOG_EVENTS` [observed — `e2e/__tests__/deploy-test.ts`].
