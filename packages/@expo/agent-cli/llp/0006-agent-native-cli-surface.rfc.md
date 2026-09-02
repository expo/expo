# 0006: Agent-native CLI surface

**Type:** RFC
**Status:** Active
**Systems:** `packages/@expo/cli`; JSONL events; `@expo/agent-cli` launcher (`src/commandRegistry.ts`, `src/cli.ts`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]], [[0024-cli-ui]]

## Summary

Make the Expo CLI itself pleasant for a driving agent: structured output in, structured answers out, no TTY assumptions, and a hard process boundary.

## The process boundary

Agentic tooling invokes the `expo` CLI as a subprocess as much as possible. It does not import `@expo/cli` code. [confirmed, Kudo, 2026-08-20]

The tool layer then works against whatever CLI version the project has installed, across SDK versions. `@expo/cli` is rolled up with swc, and internals are not a public API. The boundary also forces the real contract, the JSONL event stream, to stay complete. Anything the tool layer needs must be an emitted event or a command flag.

Consequence: gaps discovered while building tools become upstream `@expo/cli` improvements (new events, new flags), rather than imports.

## Surface improvements

JSONL events are the API. `installEventLogger` and `LOG_EVENTS` exist today (`packages/@expo/cli/bin/cli.ts`). The tool layer treats the event schema as a versioned contract. Missing events are bugs to fix upstream.

Agent-mode dev server output: no QR code, no spinner, no interactive keymap. JSONL events plus a small status endpoint carrying bundle state, connected clients, and the last error. A QR code is meaningless to an agent. A URL plus a platform-launch tool is not. [confirmed, Kudo, 2026-08-18]

Non-interactive parity: every interactive prompt in Expo/EAS CLIs must have a programmatic answer path (flag or JSON). [confirmed, Kudo, 2026-08-18] The eval suite ([[0002-testing-and-evals]]) runs everything with no TTY attached. A prompt that blocks a pipe is a bug.

Headless CI mode: structured pass/fail invocations with `--json` and exit codes, for jobs like "verify the app still boots after this PR".

### Errors are prompts

Every CLI error is a driving agent's next prompt. `CommandError.suggestedCommand` prints a trailing `Try: <command>` line and rides the `cli:error` JSONL event. Every error event carries machine-readable fields, a cause classification, and a suggested next step.

`agents:setup` writes and maintains a managed section in the project's `AGENTS.md`: SDK version, targets, the right commands, project quirks. It orients every agent, including ones that never call a tool.

## Output contract

The default output stays terse human text, which is the agent-friendly shape. [confirmed, Kudo, 2026-08-22] Three channels, each with one job:

1. Default text, for humans and LLMs reading terminals: one fact per line, in `label value` style, with stable rule and id names, and untrusted app output fenced.
2. `--json`, for programmatic consumers: exactly one JSON object on stdout and nothing else, guaranteed on every command. Field names mirror the text labels. Top-level keys are stable per command and covered by shape tests.
3. `LOG_EVENTS` JSONL, the streaming and telemetry channel for long-running commands, on the same contract as the expo CLI family.

**The keys a help block names are every key the object has.** `--help`'s `keys` line is where a caller reads them, so the branch can be written without running the command once to find out. `--no-followups` is the invariant the guard hangs on: the commands that emit `followups` offer the flag that suppresses it, and the flag is in the help block already, so a command that grows one and forgets the key fails `src/help/__tests__/template-test.ts`. Documented keys are compared against emitted keys through the process boundary (`documentedJsonKeys`). See [[0024-cli-ui]].

Anti-rule: no detection-based shape switching. `agent-cli-detector` may gate extras such as skill context dumps and follow-up verbosity ([[0009-smart-followups]]). It never changes the core shape. An agent transcript must show what a human terminal shows.

## The `@expo/agent-cli` launcher

The package ships as a model-free CLI.

| Command                                               | What it does                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `agents:setup`                                        | install Expo skills, and write the AGENTS.md managed block                         |
| `skills:sync\|list\|show\|clean`                      | [[0003-knowledge-tools-and-skills]]                                                |
| `install`, `start`                                    | wrap the `expo` equivalents as subprocesses, with skill sync                       |
| `dev` / `dev:stop` / `dev:logs`                       | the smart-start engine of [[0004-smart-start-and-project-state]]                   |
| `status`                                              | where the project is right now. Under `--json`, the machine-readable project brief |
| `runtime:eval\|errors\|reload\|stop\|tree\|tap\|type` | [[0005-runtime-loop-tools]], [[0018-interaction-commands]]                         |
| `navigate`                                            | deep-link a route                                                                  |
| `typecheck`                                           | run the project's own TypeScript compiler as a gate ([[0010-agent-conventions]])   |
| `new`, `deploy`                                       | headless creation and shipping ([[0007-deploy-and-headless]])                      |
| `inspect:build-log`, `inspect:config-plugins`         | read what the project produced, without running it                                 |
| `doctor` / `doctor:check`                             | expo-doctor, normalized                                                            |
| `smoke`                                               | the whole gate in one command                                                      |
| `help`                                                | the workflow on-ramp ([[0024-cli-ui]])                                             |

Names that are not in this table are not in v1. See [[0017-deferred-commands]].

### Naming rule

A command sharing a name with an `expo` command behaves like that command. A capability only `@expo/agent-cli` has gets a verb of its own. The `expo` commands `@expo/agent-cli` does not wrap are forwarded to the project's `expo` CLI verbatim. [confirmed, Kudo, 2026-08-22] The launcher is a superset of `expo`, so an agent that knows `expo` is never wrong about `@expo/agent-cli`.

### Fixed forwarded list

What is forwarded is a list, not a fallback. It is the `commands` map of `packages/@expo/cli/src/index.ts` minus the commands `@expo/agent-cli` wraps (`start`, `install`, and `add`). What is left: `run`, `run:ios`, `run:android`, `prebuild`, `config`, `export`, `export:web`, `export:embed`, `serve`, `customize`, `lint`, `login`, `logout`, `register`, `whoami`. A name in neither surface is a command neither CLI has, and it fails with `UNKNOWN_COMMAND`. An unrecognized name is a typo far more often than it is a new `expo` command. Cost: the list is hand-maintained, so an `expo` command added upstream is unreachable through `@expo/agent-cli` until the list grows.

### Auth fallback

A forwarded command that acts on the machine rather than on the project falls back to the EAS CLI, rather than failing for want of a project one. [confirmed, Kudo, 2026-08-26] The four are `login`, `logout`, `register`, and `whoami`. The project's own `expo` wins whenever there is one. They read and write `~/.expo/state.json`, a file that exists on the machine whether or not the current directory has an Expo app in it. Both CLIs resolve that file identically.

`prebuild` and `export` get none of this. They act on the project, so "there is no project CLI here" is a real answer.

`eas register` does not exist, so `register` keeps the `npx expo` rung (`project-expo` → `runner-expo` through `resolvePackageRunner`). A line on stderr names the CLI and warns about the download. The fallback's output is the EAS CLI's. The note saying which one answered is on stderr, because this CLI's own auth preflight parses stdout.

One asymmetry: `@expo/cli` also honours `__UNSAFE_EXPO_HOME_DIRECTORY` and `eas-cli` does not. Recorded rather than handled.

### Alias rule

An `expo` command that is another name for one `@expo/agent-cli` wraps is an alias of the wrapper, not a forward. [confirmed, Kudo, 2026-08-22] `expo add` and `expo install` are the same command, so `@expo/agent-cli add` must run the `install` wrapper (skill sync, impact report) rather than silently skipping it. Aliases resolve to their target's name (`commandAliases` in the registry), so the event stream and the follow-ups only ever name the command that ran.

### Grouping rule

A capability with several actions is one colon group, `<group>:<action>`, spelled the way `eas-cli` spells its own commands (`runtime:eval`, `skills:list`, `agents:setup`). [confirmed, Kudo, 2026-08-22] Membership in one of the three lists is what resolves a name, never the shape of it. `expo export:web` has a colon too. An action of a group `@expo/agent-cli` owns is never forwarded. An unknown one is an error naming the actions that exist.

The rules are data rather than string matching (`src/commandRegistry.ts`). Three lists are the whole surface: `topLevelCommands`, `commandGroups`, and `forwardedCommands`. One pure `resolveCommand(command, argv)` answers with one of five cases (`command`, `group-help`, `unknown-action`, `passthrough`, `unknown-command`) that `cli.ts` acts on without deciding anything again.

- The space form is free. `<group> <action>` resolves to the same command as `<group>:<action>` when the action is the argument right after the group. The colon is canonical. The space form is silent.
- A bare group is answerable. `@expo/agent-cli runtime` prints the group's actions and exits 0. A group that declares a `defaultAction` runs it instead, so `@expo/agent-cli skills` syncs and `@expo/agent-cli doctor` checks. `@expo/agent-cli <group> --help` is always the listing.
- A group whose actions share their options stays one module. `withAction(action, load)` hands the action back as `argv[0]`.
- The help cannot drift. `helpSections` groups the surface by the job at hand. A unit test pins that every name in all three lists appears in exactly one section. What each of those screens actually says is [[0024-cli-ui]]. The registry carries the data all of it reads: a one-line `summary` and a lazy `help` loader on every entry, and the `workflow` map.
- Adding a command is one entry. No `switch`, no CLI framework.

Implemented: `start` and `install` add skill sync and follow-ups to `expo start` and `expo install`, and forward every other argument untouched. The plan-first engine is the `dev` verb. The forwarded set runs through `src/passthrough/`, which spawns the project's `expo` CLI with stdio inherited, forwards the exit code, emits one `cli:expo_passthrough` event, and adds nothing else.

## Testing

Event-schema snapshot tests. E2E subprocess runs against fixtures, asserting event sequences. A TTY-free CI environment as the default test condition ([[0002-testing-and-evals]]).
