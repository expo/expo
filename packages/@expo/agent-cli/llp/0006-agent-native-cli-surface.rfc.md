# 0006: Agent-Native CLI Surface

**Type:** RFC
**Status:** Final
**Systems:** `packages/@expo/cli`; JSONL events; `exagent` launcher (new)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0004-smart-start-and-project-state]], [[0024-cli-ui]]

## Summary

Make the Expo CLI itself pleasant for a driving agent: structured output in, structured answers out, no TTY assumptions, and a hard process boundary.

## The process boundary

Constraint [confirmed — Kudo, 2026-08-20]: agentic tooling **invokes the `expo` CLI as a subprocess as much as possible; it does not import `@expo/cli` code.** Rationale [inferred]:

- The tool layer works against whatever CLI version the project has installed, across SDK versions.
- `@expo/cli` is rolled up with swc [observed — its CLAUDE.md], and internals are not a public API.
- It forces the real contract, the JSONL event stream, to stay complete. Anything the tool layer needs must be an emitted event or a command flag, which benefits every consumer.

Consequence: gaps discovered while building tools become upstream `@expo/cli` improvements, meaning new events and new flags, rather than imports.

## Surface improvements

- **JSONL events as the API.** `installEventLogger` and `LOG_EVENTS` exist today (`packages/@expo/cli/bin/cli.ts` [observed]; the JSONL event-based debugger is noted in the CLI's CLAUDE.md [observed]). The tool layer treats the event schema as a versioned contract, and missing events are bugs to fix upstream.
- **Agent-mode dev server output** [confirmed — Kudo seed, 2026-08-18]: no QR code, no spinner, no interactive keymap. JSONL events plus a small status endpoint carrying bundle state, connected clients and the last error. A QR code is meaningless to an agent. A URL plus a platform-launch tool is not.
- **Non-interactive parity** [confirmed — Kudo direction via headless creation seed, 2026-08-18]: every interactive prompt in Expo/EAS CLIs must have a programmatic answer path (flag or JSON). The eval suite ([[0002-testing-and-evals]]) runs everything with no TTY attached; a prompt that blocks a pipe is a bug.
- **Headless CI mode.** Structured pass/fail invocations with `--json` and exit codes, for CI jobs like "verify the app still boots after this PR".
- **Errors are prompts** [confirmed — Kudo accepted, 2026-08-20; implemented 2026-08-22: `CommandError.suggestedCommand` prints a trailing `Try: <command>` line and rides the `cli:error` JSONL event; wired into the dev-server and deep-link errors first]. The repo already has a what/why/how error-message guideline [observed — `.claude/CLAUDE.md` §Error messages]. For a driving agent, every CLI error is literally its next prompt. So systematize it: every error event carries machine-readable fields, a cause classification and a `suggestedCommand` or next step, which makes the agent's recovery path one hop rather than a search.
- **MCP resources + versioned tool schemas** [confirmed — Kudo accepted, 2026-08-20; design inferred]. Expose cheap-to-read context as MCP _resources_ and not only as tools: the resolved config, the router sitemap, the doctor report, the project brief. Version the tool and event schemas, and negotiate capabilities on connect, so older driving agents keep working against newer servers.
- **AGENTS.md generation** [confirmed — Kudo accepted, 2026-08-20; design inferred]. `exagent agents:setup` writes and maintains a managed section in the project's `AGENTS.md`: SDK version, targets, the right commands, project quirks. It orients every agent, including ones that never call a tool.

## Output contract

Decision [confirmed — Kudo, 2026-08-22]: the default output stays **terse human text, which is the agent-friendly shape.** There are three channels, each with one job:

1. **Default text**, for humans and LLMs reading terminals: one fact per line, in `label value` style, with stable rule and id names, and untrusted app output fenced. Evidence: the tier-1 4B model drove `dev --plan` from the human table alone. It costs fewer tokens than pretty JSON.
2. **`--json`**, for programmatic consumers: exactly one JSON object on stdout and nothing else, guaranteed on **every** command. Field names mirror the text labels, and top-level keys are stable per command and covered by shape tests, which is versioning in fact if not in name.
3. **`LOG_EVENTS` JSONL**, the streaming and telemetry channel for long-running commands, on the same contract as the expo CLI family.

**The keys a help block names are every key the object has** [added 2026-08-28, for **F144**].
Point 2 says top-level keys are stable and shape-tested, and `--help`'s `keys` line is
where a caller reads them — the promise being that the branch can be written without running the
command once to find out. `status --json` and `runtime:errors --json` both emitted a `followups`
array that neither help block listed, and `status`' own e2e already pinned the key in the payload, so
the two lists sat side by side in the same package and disagreed [observed — friction run 9, the JSON
key audit].

The key is not the mistake and was not removed: `followups` is the `Suggested next:` list in
machine-readable form, which is the third of the three places a failure hands back a recovery
([[0010-agent-conventions]] §Three names for the recovery). Two things keep the lists together now.
`--no-followups` is the invariant the guard hangs on — exactly the commands that emit the key offer
the flag that suppresses it, and the flag is in the help block already, so a command that grows one
and forgets the key fails `src/help/__tests__/template-test.ts`. And `status`' documented keys are
compared against its emitted keys through the process boundary, parsed back out of the rendered block
(`documentedJsonKeys`), because that is the text a caller actually reads.

Anti-rule: **no detection-based shape switching.** `agent-cli-detector` may gate extras such as skill context dumps and follow-up verbosity ([[0009-smart-followups]]), but it never changes the core shape. An agent transcript must show what a human terminal shows, for reproducibility, docs, and evals.

## The `exagent` launcher

The reserved bins (`exagent` / `ai-expo` [observed — npm, reserved by kudochien 2026-08-18]) ship as a model-free CLI. The surface:

| Command | What it does |
| --- | --- |
| `agents:setup` | install Expo skills, and register the MCP server into Claude Code, Cursor or Codex |
| `skills:sync\|list\|show\|clean` | [[0003-knowledge-tools-and-skills]] |
| `install`, `start` | wrap the `expo` equivalents as subprocesses, with skill sync [confirmed — Kudo, 2026-08-20] |
| `dev` | the smart-start engine of [[0004-smart-start-and-project-state]] |
| `mcp` | start or connect the MCP server |
| `status` | where the project is right now; under `--json`, also the machine-readable project brief that `context` used to print on its own [confirmed — Kudo, 2026-08-22] |
| `runtime:eval\|errors\|network` | [[0005-runtime-loop-tools]] |
| `navigate` | deep-link a route |
| `checkpoint`, `checkpoint:list\|undo` | [[0008-guardrails]]; deferred out of v1 on 2026-08-26, see [[0016-v1-scope]] and [[0017-deferred-commands]] |
| `typecheck` | run the project's own TypeScript compiler as a gate ([[0010-agent-conventions]] §The fourth) |
| `new`, `deploy` | headless creation and shipping ([[0007-deploy-and-headless]]) |

Naming rule [confirmed — Kudo, 2026-08-22], in three parts: **a command sharing a name with an `expo` command behaves like that command; a capability only `exagent` has gets a verb of its own; and the `expo` commands `exagent` does not wrap are forwarded to the project's `expo` CLI verbatim.** Rationale [inferred]: the launcher is a superset of `expo`, so an agent that knows `expo` is never wrong about `exagent`, and nothing has to be re-learned per command. The forwarding half is what keeps `exagent` usable as a project's only CLI entry point without growing a wrapper per command.

Fixed forwarded set [confirmed — Kudo, 2026-08-22]: **what is forwarded is a list, not a fallback.** It is the `commands` map of `packages/@expo/cli/src/index.ts` [observed — 2026-08-22] minus the commands `exagent` wraps, which are `start`, `install`, and `add` (`install` under another name). What is left: `run`, `run:ios`, `run:android`, `prebuild`, `config`, `export`, `export:web`, `export:embed`, `serve`, `customize`, `lint`, `login`, `logout`, `register`, `whoami`. A name in neither surface is a command neither CLI has, and it fails with `UNKNOWN_COMMAND`. Rationale [inferred]: an unrecognized name is a typo far more often than it is a new `expo` command. The fallback answered a typo by making it the `expo` CLI's problem to report, which is an error from the wrong CLI about the wrong thing, and for a driving agent that is a wasted recovery hop. Cost [observed]: the list is hand-maintained, so an `expo` command added upstream is unreachable through `exagent` until the list grows.

Auth rule [confirmed — Kudo, 2026-08-26]: **a forwarded command that acts on the machine rather than on the project falls back to the EAS CLI, rather than failing for want of a project one.** The four are `login`, `logout`, `register` and `whoami`, and they are still forwarded. The project's own `expo` wins whenever there is one, so nothing changes inside an Expo app. What changes is everywhere else.

They are different in kind because of what they read and write: `~/.expo/state.json`, a file that exists on the machine whether or not the current directory has an Expo app in it, and which **both CLIs resolve identically** [observed — 2026-08-26: `@expo/cli` `api/user/UserSettings.ts` and `eas-cli` 22.4.0 `utils/paths.js` both join `homedir()` with `.expo` (or `.expo-staging` / `.expo-local` under `EXPO_STAGING` / `EXPO_LOCAL`) and then `state.json`, and both carry the same comment saying the directory is shared between them]. Verified end to end: `expo whoami` and `eas whoami` both answer `kudochien` on a machine whose `state.json` holds `auth.username: "kudochien"` [observed — live, 2026-08-26].

One asymmetry, and it is the only one found: **`@expo/cli` also honours `__UNSAFE_EXPO_HOME_DIRECTORY` and `eas-cli` does not.** A machine that sets that variable points the two CLIs at different directories, and there the fallback would answer about a different session than the forward would. It is an escape hatch named `__UNSAFE_` for exactly this class of reason, so this is recorded rather than handled.

`prebuild` and `export` get none of this, and the boundary is the point. They act on the project, so "there is no project CLI here" is a real answer for them, and they keep giving it.

Register exception [confirmed — Kudo, 2026-08-26]: **`eas register` does not exist** [observed — eas-cli 22.5.0, `eas register --help` answers `Error: Command register not found`], so the rule above has nothing to apply. `register` keeps the `npx expo` rung the other three gave up, which is `project-expo → runner-expo` through `resolvePackageRunner` so a Bun user gets `bunx expo`, and it pays the SDK download that motivated this whole section.

That is not an inconsistency. It is the same cost and benefit landing the other way. The download is worth avoiding for `whoami`, because an agent asks it on every run and the answer is a line in a file. It is worth paying for `register`, because that command creates an account, once per person, interactively, in a browser, and no other CLI on the machine can do it. The alternative considered and rejected was to keep failing with a message telling the reader to open expo.dev/signup by hand, which spends the same minute of their time and delivers less. stdio stays inherited, which is the hard constraint either way. A line on stderr names the CLI and warns about the download, so the reader is not surprised by a minute of silence [observed — the notice is `authFallbackNotice`'s `runner-expo` branch].

Cost [observed — 2026-08-26]: the fallback's output is the EAS CLI's. `eas whoami` prints the name, the email and an account list where `expo whoami` prints the name alone, so a caller that parses stdout sees a different shape depending on which CLI answered. The note saying which one did is on **stderr** for the same reason: this CLI's own auth preflight parses that stdout (llp/0010 §Needs-human protocol, layer 1), and a note mixed into it would be the bug this fixes, twice.

Alias rule [confirmed — Kudo, 2026-08-22]: **an `expo` command that is another name for one `exagent` wraps is an alias of the wrapper, not a forward.** The case that forced it is `add`. `expo add` and `expo install` are the same command in `@expo/cli`'s map [observed — `packages/@expo/cli/src/index.ts`, both load `expoInstall`], so forwarding `add` while wrapping `install` would have made one operation reachable two ways with different behaviour: `exagent add expo-camera` silently skipping the skill sync, the impact report and the checkpoint that `exagent install expo-camera` performs. That is the naming rule read backwards. Parity with `expo` is about what a command _does_, so a command that shares an `expo` command's meaning has to behave like this CLI's version of it. Aliases resolve to their target's name (`commandAliases` in the registry), so the event stream and the follow-ups only ever name the command that ran. An alias is documented in its target's `--help` rather than as a listing entry of its own, because the top-level listing names capabilities and an alias adds none.

Grouping rule [confirmed — Kudo, 2026-08-22]: **a capability with several actions is one colon group, `<group>:<action>`, spelled the way `eas-cli` spells its own commands** (`runtime:eval`, `skills:list`, `checkpoint:undo`, `agents:setup`). Rationale [inferred]: the flat namespace was going to collide with `expo`'s as both grow, and a colon makes the boundary legible in one glance. It does not make the boundary _decidable_, though, because `expo export:web` has a colon too [observed]. So membership in one of the three lists is what resolves a name, never the shape of it. Within a group the boundary does hold: an action of a group `exagent` owns is never forwarded, and an unknown one is an error naming the actions that exist.

The rules are implemented as data rather than as string matching [observed — 2026-08-22, `src/commandRegistry.ts`]. Three lists are the whole surface: `topLevelCommands` (name to module loader), `commandGroups` (group to `{ summary, defaultAction?, actions }`), and `forwardedCommands`. One pure `resolveCommand(command, argv)` answers with one of five cases (`command`, `group-help`, `unknown-action`, `passthrough`, `unknown-command`) that `cli.ts` acts on without deciding anything again. Consequences, all generic rather than per command:

- **The space form is free.** `<group> <action>` resolves to the same command as `<group>:<action>` when the action is the argument right after the group, so an agent that types `skills list` is never wrong. The colon is canonical, and the space form is silent.
- **A bare group is answerable.** `exagent runtime` prints the group's actions and exits 0. A group that declares a `defaultAction` runs it instead, so `exagent skills` syncs and `exagent doctor` checks. `exagent <group> --help` is always the listing.
- **A group whose actions share their options stays one module.** `withAction(action, load)` hands the action back as `argv[0]`, which is where such a module already reads it. So `runtime` and `skills` keep one `--help` block and one argument resolver, while `dev` has one command per action. Which of the two a group is, is a property of its entry rather than of the resolver.
- **The help cannot drift.** `helpSections` groups the surface by the job at hand: Develop, Understand the project, Check a running app, Create and ship, Agent setup, Learn, Account, and Expo CLI for the forwarded set. A unit test pins that every name in all three lists appears in exactly one section, so neither a new command nor a newly forwarded one can ship undiscoverable. What each of those screens actually says — the numbered workflow map above the listing, the one template every command's `--help` comes out in, the `help workflow` on-ramp, and the palette — is [[0024-cli-ui]]. The registry carries the data all of it reads: a one-line `summary` and a lazy `help` loader on every entry, and the `workflow` map.
- **Adding a command is one entry.** A new action is a line in a group's `actions`. A new group is a key in `commandGroups`. A newly forwarded `expo` command is a string in `forwardedCommands`. Another name for an existing command is a pair in `commandAliases`. No `switch`, no `if (command === 'runtime:eval')`, and no CLI framework: the resolution is about 45 lines over the three lists.

Implemented [observed — 2026-08-22]: `start` and `install` add skill sync and follow-ups to `expo start` and `expo install`, and forward every other argument untouched. The plan-first engine is the `dev` verb. The forwarded set runs through `src/passthrough/`, which spawns the project's `expo` CLI with stdio inherited, forwards the exit code, emits one `cli:expo_passthrough` event, and adds nothing else.

## Testing

Event-schema snapshot tests. E2E subprocess runs against fixtures, asserting event sequences. A TTY-free CI environment as the default test condition ([[0002-testing-and-evals]]).
