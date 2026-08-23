# 0010: Agent Conventions — Exit Codes, Registry Rules, Upstream Asks

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` launcher (`src/cli.ts`, `src/commandRegistry.ts`, `src/exitCodes.ts`, `src/utils/errors.ts`); `packages/@expo/cli`; `eas-cli`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-23
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0006-agent-native-cli-surface]], [[0002-testing-and-evals]]

## Summary

The conventions every `exagent` command shares, written down once so a feature does not decide them again: what the exit code means, how one argv resolves to one command, and which of the family's gaps the tool layer is working around rather than fixing. [[0006-agent-native-cli-surface]] owns the shape of the surface; this document owns the rules that hold across all of it.

## Exit codes

Decision [confirmed — Kudo, 2026-08-23]. A driving agent reads the exit code before it reads a word of the output, so the code answers two questions that a single non-zero number cannot: **did the tool work**, and **did the thing the tool was asked about work**. A command that ran a smoke test and reported the app crashing has done its job perfectly; a command that could not find the project has not. `1` for both makes the agent scrape stdout to tell them apart, which is the failure mode this convention exists to remove.

| Code    | Meaning                                                    | The agent's next move                            |
| ------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `0`     | The tool worked, the outcome was success                   | Continue                                         |
| `1`     | The tool did not work: usage error, missing dependency, bug | Read the error and the `Try:` line; fix the call |
| `7`     | The tool worked; a person must finish the step              | Hand the printed URL or instruction to the human |
| `20`    | The tool worked; the operation failed                       | Read the payload; act on the *subject's* failure |
| `21`    | The tool worked; the operation was canceled                 | Nothing is known; re-run if it was not deliberate|
| `22`    | The tool worked; the operation timed out (inconclusive)     | Wait longer, or look again                       |
| `23–29` | Reserved for further outcome classes                        | —                                                |

Rationale for the shape [inferred]:

- **Bands, not a flat enumeration.** `20`–`29` is one band an agent can test with a range, so a command that grows a new outcome class does not break a caller that only knew the old ones. `1` stays the whole "the tool did not work" band on purpose: an agent that gets `1` never has a useful branch beyond reading the error, which llp/0006 §Errors are prompts already makes one hop.
- **`7`, away from both bands.** A step only a person can complete — signing in through a browser, approving a device, finishing a launch in a web page — is neither a tool error nor an outcome. The recovery is not another command, so it must not look like one that a retry could fix. The error class that carries it arrives with the first command that needs it; the number is reserved now.
- **Timeout apart from failure.** Retrying is the obvious next action after `22` and a waste of minutes after `20`. Collapsing them costs either wasted builds or missed successes.
- **Shell-safe range.** Nothing above `125`, which POSIX shells and `npx` use for their own conditions.

Implementation [observed — 2026-08-23, `src/exitCodes.ts`]: the constants are the only place a code is spelled, and there are two supported ways to leave the process with one. A **tool** error throws a `CommandError`, optionally carrying an `exitCode`; `logCmdError` prints it, puts it on the `cli:error` event with its `suggestedCommand`, then exits with `error.exitCode ?? EXIT_ERROR`. An **outcome** is not an error and has nothing to print that the command has not printed already, so it calls `exitWithCodeAsync(code)`. Both flush the event logger first: `process.exit` drops whatever the JSONL stream has buffered, which would lose the very events that explain the code the agent just read.

Two consequences worth stating. First, no existing command's exit code changes by adopting this: the convention binds the codes commands choose from here on, and re-coding a shipped command is a separate, breaking decision. Second, the convention does not reach a **forwarded** code. `install`, `start`, `dev` and the `expo` passthrough hand back whatever the subprocess exited with, verbatim — `expo prebuild` failing with `3` makes `exagent dev --ios` exit `3` [observed — `e2e/__tests__/dev-test.ts`] — because inventing a code there would hide the one the tool actually reported. A wrapper's *own* failures use the table; a subprocess's do not.

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

## `build:explain`: the rule table is capped and in-repo

Decision [confirmed — Kudo, 2026-08-23]. The failure-signature rules that `build:explain` matches build logs against ship **in the repository, as a bounded table** — a capped set of Expo-specific signatures with a test each, reviewed like code and versioned with the CLI.

This does not reopen [[0001-agentic-cli-on-expo-cli]] §Scoped out, which rules out **the build-failure signature DB**: a hosted, growing, community-fed corpus with its own service, submission path and moderation. What is in scope is the opposite of that in every dimension that made it a scope-out — no service, no ingestion, no unbounded growth, no data to moderate. Rationale [inferred]: the value of the feature is concentrated in a small number of failures Expo itself causes and can name precisely (a missing pod, a mismatched SDK, an unsupported New Architecture module); a table that stays small stays accurate, and the cap is what keeps a maintainer from answering every field report by appending a rule instead of fixing the cause.

## Upstream asks

Gaps found while building the tool layer. Per the process boundary of [[0001-agentic-cli-on-expo-cli]] constraint 5, these become upstream improvements rather than imports — but they are **recorded here, not yet filed**, and each is worked around in the meantime.

`eas-cli`:

- `build:logs` — read a build's logs from the CLI. Today the logs are reachable through the web dashboard, so a headless agent explaining a failed build has nothing to read.
- `credentials:list --json --non-interactive` — see what credentials a project has without a TTY.
- `--non-interactive` on `build:view` and `submit:view` — both are read-only and both can still prompt.
- Typed non-interactive errors — a machine-readable code when a command cannot proceed without a prompt, so the tool layer can distinguish "needs a human" (exit `7` above) from "failed".
- `env:list --json` — the environment a build will run with, as data.

`@expo/cli`:

- Emit `cli:error` JSONL for every command error, with a `needsInput` flag — the event contract of llp/0006 §Output contract, extended so a wrapper can see that a prompt is what stopped the command.
- `expo cache:clear` — one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at.
- `expo-doctor --json` — the doctor report as data, so its checks can drive a decision instead of a regex over prose.

Libraries:

- `@expo/fingerprint --git-ref` — fingerprint a revision without checking it out, which is what makes "did the native layer change since the last build?" answerable cheaply.
- `@expo/config-plugins` `_internal.modProvenance` — which plugin wrote a given native change, so an explanation can name the cause rather than the symptom.

## Testing

Unit tests pin the constants and both resolution rules, including a synthetic group registered under a forwarded name for rule (b) [observed — `src/__tests__/exitCodes-test.ts`, `src/__tests__/commandRegistry-test.ts`]. E2E tests pin what the process boundary actually shows: the exit code and the last line of output for a group given options with no action [observed — `e2e/__tests__/wrapper-test.ts`]. Per [[0002-testing-and-evals]], every layer runs with no TTY attached.
