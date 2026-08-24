# 0010: Agent Conventions — Exit Codes, Registry Rules, Upstream Asks

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` launcher (`src/cli.ts`, `src/commandRegistry.ts`, `src/exitCodes.ts`, `src/utils/errors.ts`, `src/utils/jsonMode.ts`); `exagent build:wait` (`src/builds/`); `exagent dev:wait` (`src/dev/waitAsync.ts`, `src/dev/waitFormat.ts`, `src/runtime/bundleCheck.ts`); the needs-human protocol (`src/needsHuman/`, `src/utils/subprocess.ts`, `src/utils/expoCli.ts`); `packages/@expo/cli`; `eas-cli`
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

| Code | The build                                                          | Where it is decided            |
| ---- | ------------------------------------------------------------------ | ------------------------------ |
| `0`  | `FINISHED`                                                         | `src/builds/status.ts`         |
| `20` | `ERRORED`                                                          | `src/builds/status.ts`         |
| `21` | `CANCELED`, **or this wait was interrupted**                       | `src/builds/status.ts`         |
| `22` | still running when `--timeout` elapsed                             | `src/builds/waitAsync.ts`      |
| `7`  | nobody is signed in, so no build is visible                        | `src/needsHuman/assertAuth.ts` |
| `1`  | not readable: bad id, no `eas`, three failed polls                 | `CommandError`                 |

Three details of the mapping are decisions rather than transcription:

- **An unrecognized status is not terminal.** The status enum belongs to a service that ships without this CLI, so a status the table has never seen keeps the wait polling. Ending on it would report an outcome nobody observed; the timeout is what stops a wait that is wrong about this, and `22` says "inconclusive" rather than claiming a result. `PENDING_CANCEL` is the concrete case — a cancellation asked for and not yet happened, which still resolves to `CANCELED` or `FINISHED`.
- **An interrupted wait exits `21`, not `130`.** The definition of `21` above is "canceled by the caller (a declined prompt, `SIGINT`) or by the service", and a Ctrl-C is the caller cancelling. `130` would have been a second convention for the same fact. The two are told apart on the event stream (`cli:build_wait.interrupted`) rather than in the `--json` payload, whose key set is fixed.
- **Three failed polls is `1`, not an outcome.** A wait that cannot read the build has not learned anything about it, so it is a tool failure. Its *prose* names `eas workflow:status <id> --wait --json`, because a build id and a workflow id look alike and come from the same places — but not its `Try:` line [revised — 2026-08-23]. The `How:` sentence states a condition ("*if* it names a workflow run"), and the last line of a failure is what a driving agent acts on, so putting the workflow command there strips the condition and sends the agent to run something that fails again for the same reason [observed — friction run, 2026-08-23: signed out, and `Try:` recommended the workflow command for an id that was obviously not a build]. `Try:` is now `<the eas that ran> whoami`, which is worth running whatever the cause.
- **Signed out is `7`, and it is asked before the first poll** [added — 2026-08-23]. The auth preflight of §Needs-human protocol runs first: a wait that nobody is signed in for cannot see any build, so its three polls are three doomed subprocesses ending in a "gave up waiting" that names the wrong cause. A preflight answering `null` — no EAS CLI, a timeout, or a binary under that name that is not the CLI — is **not** "signed out", and the wait proceeds exactly as before.

Progress goes to the `LOG_EVENTS` JSONL stream as `cli:build_wait_poll`, never to stdout, so `--json` still prints exactly one object ([[0006-agent-native-cli-surface]] §Output contract).

Two consequences worth stating. First, adopting the convention changed no shipped command's exit code by itself; the one command that has been re-coded since is the deploy's auth failure, and that was a deliberate, separate decision recorded below. Second, the convention does not reach a **forwarded** code. `install`, `start`, `dev` and the `expo` passthrough hand back whatever the subprocess exited with, verbatim — `expo prebuild` failing with `3` makes `exagent dev --ios` exit `3` [observed — `e2e/__tests__/dev-test.ts`] — because inventing a code there would hide the one the tool actually reported. A wrapper's _own_ failures use the table; a subprocess's do not.

### The second: `dev:wait`, and what an outcome is an outcome _about_

[observed — 2026-08-23, `src/dev/`] `exagent dev:wait` joined the band next, and it made the band's
one ambiguity concrete: `20` says "the operation failed", and a readiness gate has to decide what
its operation _is_. Waiting for a dev server to answer, or establishing that this project's app is
in a state worth reading? The command exists for the second, so that is what its code answers.

Decision [confirmed — Kudo, 2026-08-23]. A dev server that proved it serves **another project**
exits `20`, with `ok: false`. Before, it exited `0` with `ok: true` while the human report said, on
screen, `serves /other/app, not /this/app` — the two channels of one command disagreeing, with the
machine one wrong. An agent gating on the exit code proceeded into a stranger's app; the `--help`
of the same command calls the project-root header "the one thing a port scan cannot prove", so the
command detected the mismatch and then declined to act on it.

Three details of that mapping are decisions rather than transcription:

- **`null` is not `false`.** A dev server that named no project root has not been _shown_ to be the
  wrong one, and `matchProjectRoot` answers `null` for it. Failing on undecidable would fail every
  dev server too old to send the header, which is a different command's problem to have.
- **A mismatch is `20`, never `22`,** even when the wait also expired. `22` means "look again", and
  no amount of looking turns another project's dev server into this one's. The mismatch is checked
  before the timeout for exactly this reason.
- **The human output is unchanged.** It was already right. Only `ok` and the exit code moved, which
  is the smallest change that makes the two channels agree.

### The gate has to ask about the _project_, not only the dev server

Decision [confirmed — Kudo, 2026-08-23]. `dev:wait` builds the project's entry bundle, and an entry
bundle that does not compile exits `20` with the file, line and message the bundler stopped on.

The finding this answers [observed — friction run 1, 2026-08-23]: a syntax error was appended to a
route of a real SDK 57 app, and `status`, `doctor`, `dev:wait` and `runtime:errors` all reported
green and exited `0`. Every one of them was asking about the dev server. `GET /status` proves the
**bundler process** is alive [observed — `createMetroMiddleware.ts`], `/json/list` proves an app is
attached, and neither has ever had anything to say about whether the code compiles — so the edit →
verify loop returned "fine" immediately after an agent broke the build, which is the most expensive
answer a driving agent can be given.

**How the entry path is found, without importing `@expo/cli`.** Two HTTP requests:

1. `GET /` with `expo-platform: <platform>` and `Accept: application/json`, whose `launchAsset.url`
   is the entry bundle URL the dev server hands a real app [observed —
   `ExpoGoManifestHandlerMiddleware.ts:159-181`, and live on 2026-08-23]. Asking is what keeps the
   entry path out of the wrapper: it is `node_modules/expo-router/entry` for a router project and
   `index` for a plain one, and the URL also carries the whole query string Metro keys its graph by
   (`transform.routerRoot`, `transform.engine`, `lazy`, …). The URL is then used **byte for byte** —
   adding or dropping one parameter compiles a second graph rather than reading the one the app uses
   [observed — `metroOptions.ts`, `Server.js` `getGraphId`].
2. `HEAD` of that URL. HEAD builds the bundle and reports the real status without sending the body,
   which for this app is 8 MB [observed live: 200 in 11 ms warm, 500 in 0.7 s on a broken route].
   The body is fetched only when the status says something went wrong, and then it is the small one:
   Metro answers a failed build with `{"type":"TransformError","lineNumber":…,"column":…,
"filename":…,"message":…}` and status 500 [observed — `metro/src/lib/formatBundlingError.js`].

Four decisions inside that, each of which could have gone the other way:

- **`unknown` is not `broken`.** A manifest that 404s, is not JSON, or names no `launchAsset.url`
  leaves `ok: null` and passes. A dev server that answered nothing the wrapper understands has not
  shown the project to be broken, and a gate that went red on it would trade a false green for a
  false red — which is worse, because the false red is not actionable.
- **A broken bundle is `20`, never `22`,** for the same reason a project-root mismatch is: a file
  with a syntax error in it does not parse on the second look. A cold first build that does not
  finish inside `--timeout` **is** `22`, because that one really is "look again".
- **The check is skipped for another project's dev server.** Building _their_ entry bundle answers
  nothing about this code and would spend the caller's whole budget doing it.
- **`--no-bundle-check` exists.** The first build of a cold dev server compiles the whole app and can
  take tens of seconds; a caller that only wants the old readiness gate must be able to say so
  rather than raise `--timeout` and wait.

**`status` is deliberately not given this.** [inferred] Its readiness probe has a 400 ms ceiling and
its whole contract is that it never waits, while a cold first build is tens of seconds and nothing
the dev server exposes says "is the last build broken" without building. The honest arrangement is
the one now in place: `status` reports where the project is, and its `next` line points at
`exagent dev:wait --require-app`, which is the command that pays for the answer.

### The third: a collector that can be asked to be a gate

[observed — 2026-08-23, `src/runtime/`; friction run 2, F25] `exagent runtime:errors` is the first
command in the band whose entry is **opt-in**, and the reason is the difference between a check and
a window. `dev:wait` asks a question with an answer — does this project's entry bundle compile — so
its exit code can carry the verdict. `runtime:errors` watches for a while and reports what arrived,
and its empty result means "nothing happened while I watched", not "the app is healthy": an error
thrown before the window opened is not in it, and the command says so in its own output.

So the default stays `0` whatever it collects, and `--fail-on-error` exits `20` on a non-empty
window. The flag exists because the asymmetry was itself the friction: an agent could gate on
`dev:wait` and not on `runtime:errors`, and had to parse `count` out of `--json` to close the loop
that the exit code closes everywhere else.

Only `errors` has it. `runtime:network`'s failed requests are something it reports *about* the app —
a 404 the app handles is not the command's operation failing — and there is no equivalent question
for its exit code to answer.

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

1. **Preflight** — ask the cheap question first. `src/needsHuman/preflight.ts` runs `eas whoami` with a short deadline and caches the answer for the process. `eas whoami` is asked before `EXPO_TOKEN` is looked at, because it also knows the account _name_ and because it reads the variable itself — so a token the service rejects reads as "not signed in" rather than as a login. A preflight that cannot run answers `null`, which is not "signed out": the two lead to different next actions. This is the `auth` section of `exagent status` [observed — `src/status/`], and `src/needsHuman/assertAuth.ts` is the same answer *raised* — for `deploy` and `build:wait`, which cannot do their job without an account and would otherwise spend minutes finding out.

   Three things count as "cannot run", and the third was a bug [fixed — 2026-08-23]. No `eas` on this machine, a run that passed the deadline, and **a binary under that name that is not the EAS CLI**. The third exits non-zero exactly like a signed-out CLI does, so it read as "signed out" — and on a machine whose PATH `eas` is a wrapper that crashes (this is not hypothetical: the friction run's was), every command with a preflight would have stopped and handed its user a login they did not need. `looksLikeWrapperCrash` (§The binary may not be the CLI) is what tells the two apart.
2. **Force non-interactive** — every captured subprocess is told that nothing can answer it. For `expo` that is `CI=1` in the child environment, because the CLI rejects `--non-interactive` and names the variable instead [observed — `packages/@expo/cli/src/index.ts`]; `spawnExpoAsync` is the capture path that sets it, and `runExpoAsync` deliberately does not, because there a person has the terminal. For `eas` it is `--non-interactive`, or `--json`, which implies it. stdin was already never attached [observed — `src/utils/subprocess.ts`].
3. **Exit signature** — match the captured output against the registry. Three patterns are load-bearing today: eas-cli's `Either log in with … EXPO_TOKEN` [observed — `build/user/SessionManager.js`], `@expo/cli`'s `is in non-interactive mode` [observed — `src/utils/prompts.ts`], and the `in non-interactive mode` fragment eas-cli's many prompt sites share.
4. **Prompt-hang guard** — for a captured child only, and only when the caller opts in. If it writes nothing for `EXAGENT_PROMPT_TIMEOUT_MS` (default 20 s) _and_ its last non-empty line is prompt-shaped, it is killed and the line is quoted as untrusted text. Both halves are required: silence alone is a long build, and killing that would be worse than the hang it prevents. Never in `inherit` mode, where a prompt is legitimate.

The prompt shape is `/[?:]\s*$|^\s*[?›»]\s+\S|\(y\/N\)|\(Y\/n\)|Password|passphrase/i` [observed — `src/needsHuman/detect.ts`]. The leading-marker half was added because `prompts` and `inquirer` write the marker at the _start_ — `? Select a platform` is a question that ends in neither a question mark nor a colon.

### The binary may not be the CLI

Decision [confirmed — Kudo, 2026-08-23]. Every one of the four layers above assumes that the thing on the other side of the spawn is the CLI. Across a process boundary that is an assumption, not a fact: what runs is whatever the machine has under that name, and a shim, a stale link, or a wrapper from another project will answer instead. The friction run of 2026-08-23 was driven on such a machine — PATH `eas` was a Rust wrapper that panicked — and it broke two things at once.

`src/utils/wrapperCrash.ts` is the one guard, and it is deliberately conservative: a failure counts as "not the CLI" only when the output holds **nothing** that looks like that CLI's *and* the process died the way a wrapper dies (exit `101`, `126`, `127`, `134`, `139`, or a panic/backtrace signature). A false positive hides a real failure's output, which is worse than the vagueness it buys, so both halves have to agree.

Two callers, for the two things that broke:

- **The preflight** answers `null` instead of `false`, per layer 1 above. Reading a crash as "signed out" is the more expensive error of the two: it stops a command that would have worked.
- **The error message** says `The eas at <path> failed to run at all (this may not be the real CLI)` instead of quoting the bytes under `What the tool printed:`. The heading is a claim about provenance, and it was false: an agent reading a Rust backtrace attributed to eas-cli goes looking for a missing file inside a program that was never involved.

The `Try:` lines of `deploy` and `build:wait` changed for the same reason. `npx eas-cli whoami` checks a *different* program than the one that just failed — a healthy answer from it proves nothing — so the check names the resolved path that actually ran.

### What it costs, and the hole that stays

The breaking change [observed — `e2e/__tests__/deploy-test.ts`]: the deploy's two auth failures exited `1` and now exit `7`. At 0.0.2 that is the right moment; a CHANGELOG entry records it.

The plan engine joined the protocol on the same terms [added — 2026-08-23]. `exagent dev` runs its steps as subprocesses, and a step whose output this process can see is a step whose stop can be classified — so `dev` captures its steps whenever nobody is watching a terminal (`--json`, or a non-TTY run) and inherits when somebody is. `Input is required, but 'npx expo' is in non-interactive mode.` is then exit `7` rather than the subprocess's own `1`, which is the definition of the code: what the command is waiting for is an answer, and no re-run supplies one. The message names `--port` for the case that produces it almost every time — 8081 already taken, and the CLI asking whether to use 8082 — because that flag answers the question before it is asked. The friction run of 2026-08-23 is what this is for: `exagent dev --yes` is the documented non-interactive entry point, and on a busy port it exited 1 having started nothing.

One limit stays, deliberately: the **forwarded commands are not covered**. `exagent login`, `exagent prebuild` and the rest of the passthrough inherit the terminal, so their output is never captured and nothing can be classified — `src/passthrough/` is unchanged on purpose. The second limit recorded here — that there was no `--json` error envelope — has since been lifted; see the section below.

Signature matching is version-coupled to two CLIs that do not promise their wording — which is why the generic rows exist, why they are last, and why the upstream ask below is the real fix.

## The `--json` error envelope

Decision [confirmed — Kudo, 2026-08-23]. **A command invoked with `--json` prints one JSON object on stdout whether it succeeded or failed.** The failure object is:

```json
{
  "error": {
    "code": "EAS_DEPLOY_FAILED",
    "message": "The export was built, but EAS Hosting did not accept it …",
    "suggestedCommand": "npx eas-cli whoami",
    "needsHuman": { "scenario": "eas-login", "need": "…", "command": "npx eas login", "…": "…" }
  }
}
```

This replaces the "no `--json` error envelope" limit recorded above [superseded — 2026-08-23]. What changed the answer is a friction run: an agent driving the CLI hit `deploy --json`, `build:wait --json` and `status --json` outside a project, and got **zero bytes on stdout** from all three. Under `--json` the caller has committed to parsing stdout; an empty parse tells it nothing, so it falls back to scraping English out of stderr — the exact failure mode the flag exists to remove. The prose was never the problem, and it does not move: stderr still carries the what / **Why:** / **How:** / `Try:` block, unchanged, because that is what a person reads.

Four properties are load-bearing:

- **The key set never varies.** `suggestedCommand` and `needsHuman` are `null` rather than absent, per [[0006-agent-native-cli-surface]] §Output contract, so a caller reading `error.needsHuman` after a plain tool error branches on a value instead of on a missing key. `needsHuman` carries the whole record — the same one `cli:needs_human` carries — because an agent that has to hand a step to its user needs the URL and the environment variables, not a boolean.
- **The code is the one the site already shipped.** Reclassification never renames a code (the rule of §Needs-human protocol), and the envelope reports `error.code` verbatim.
- **Success paths are untouched.** Nothing about a command that works changes, and no command gained a second object: a failing command printed nothing on stdout before, so the envelope is the *only* thing there.
- **The exit code is still the first thing to read.** The envelope explains a failure; it does not signal one. `7` and the `20`–`29` band mean exactly what the table above says.

Implementation [observed — `src/utils/jsonMode.ts`, `src/utils/errors.ts`, `src/cli.ts`]: `logCmdError` is the one function every command's failure funnels into, and it runs *after* the command module threw — often before that module ever parsed its own arguments. So the flag is answered once, by the launcher, from the raw argv: `setJsonRequested(argvRequestsJson(commandArgs))`. `argvRequestsJson` only looks before a `--` separator, because `install` and `start` forward everything after it to another tool and `exagent install -- --json` is npm's flag, not ours. The alternative — an argument on `logCmdError` and on every `.catch(logCmdError)` — is thirty call sites carrying one boolean that cannot change during a run.

One consequence for a command that prints its payload *before* it can fail. `exagent dev --json` used to emit the plan object and then run the plan, so a failing run would have printed two objects — and, worse, the dev server it spawned inherited stdout and appended raw Metro log lines to the JSON [observed — friction run, 2026-08-23: `JSON.parse` failed at the byte after the closing brace]. In `--json` mode `dev` now captures the subprocess and prints exactly one object when the run ends: the plan (with the step results) on a clean exit, or the envelope. `dev --plan --json` is unchanged — there the plan *is* the answer and nothing runs after it. The plan still reaches a driving agent before the first step either way, on the `cli:start_plan` event.

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

This is narrower than rule (b), and the two do not overlap: rule (b) is for a name in the _forwarded_ set, where `exagent` runs the other command itself; this is for a name owned by a CLI `exagent` does not forward, where the only thing to hand back is the command line.

### (d) An argument a command has no place for is an error, not a shrug

The same failure as rule (a), one level down. `exagent checkpoint:undo <id>` accepted the argument,
dropped it, restored the newest checkpoint over the working tree, and reported that it had worked
[observed — friction run 2, F22]. `checkpoint:list` prints ids and the option is `--id`, so
`checkpoint:undo <id>` is the natural line to type, and the one destructive command in the set was
the one that misread it. Eight other commands dropped a stray argument the same way; only the
commands whose arguments a `resolve*Options` already read rejected it.

So [observed — 2026-08-23, `src/utils/args.ts`] every call to `assertWithOptionsArgs` states
`positionalArgs: 'none' | 'own'`, with **no default**: the type checker asks the question of every
command that parses arguments, including the next one somebody writes. `'none'` reports a `BAD_ARGS`
naming what was dropped, plus an optional per-command sentence for what the caller probably meant
(`checkpoint:undo` names `--id`). `'own'` is for a command that reads `args._` itself, and is the
only setting a permissive parse may use — `arg` puts unrecognized *options* into `_` there, so
rejecting them as positionals would reject the flags the resolver goes on to read. `dev` and `start`
declare `'own'` too: their arguments are forwarded to the Expo CLI, which reports its own.

Note that this is a *silent* no-op, which llp/0006 §Errors are prompts treats as the one answer a
driving agent cannot recover from — it is indistinguishable from the command having understood.

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

- Do not let `expo start --ios` take the dev server down with it. `ensureSimulatorAppRunningAsync`
  runs `osascript … tell app "System Events"`, which fails on a Mac with no usable GUI session, and
  the rejection travels unhandled through `openPlatformsAsync` and ends the process [observed —
  live, 2026-08-23, in both CI and non-CI mode; the app *was* opened first]. Opening a window is a
  convenience and should not be able to fail a start, the way the eager Xcode warm-up already
  swallows its own error [observed — `startAsync.ts`]. Worked around by not relying on `--ios`:
  llp/0004 §A plan step's `reason` records why the follow-ups name `exagent navigate /` instead.
- Emit `cli:error` JSONL for every command error, with a `needsInput` flag — the event contract of llp/0006 §Output contract, extended so a wrapper can see that a prompt is what stopped the command.
- `expo cache:clear` — one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at.
- `expo-doctor --json` — the doctor report as data, so its checks can drive a decision instead of a regex over prose.

Libraries:

- `@expo/fingerprint --git-ref` — fingerprint a revision without checking it out, which is what makes "did the native layer change since the last build?" answerable cheaply.
- `@expo/config-plugins` `_internal.modProvenance` — which plugin wrote a given native change, so an explanation can name the cause rather than the symptom.

## Testing

Unit tests pin the constants and all three resolution rules, including a synthetic group registered under a forwarded name for rule (b) [observed — `src/__tests__/exitCodes-test.ts`, `src/__tests__/commandRegistry-test.ts`]. E2E tests pin what the process boundary actually shows: the exit code and the last line of output for a group given options with no action [observed — `e2e/__tests__/wrapper-test.ts`, `e2e/__tests__/build-wait-test.ts`]. Per [[0002-testing-and-evals]], every layer runs with no TTY attached.

The outcome band gets its own discipline, because a code is not testable by reading it. `build:wait`'s status table is exhaustive at the unit level — every status in both casings and both separators, plus values it has never heard of — and each of the four exit codes gets a separate e2e test against a stub `eas` bin walking a scripted status sequence [observed — `src/builds/__tests__/status-test.ts`, `e2e/__tests__/build-wait-test.ts`]. One test asserting "some non-zero code" would pass while the distinction the band exists for was broken.

The `--json` error envelope is tested at both tiers as well [observed — 2026-08-23]. Unit: `argvRequestsJson` against a table including the `--` separator case, and `logCmdError` asserting that nothing reaches stdout without the flag, that the key set is complete with the flag, and that a needs-human failure carries the whole record. E2E, through the published bin: a failing `--json` run whose stdout is fed to `JSON.parse`, so the property the envelope exists for is checked as the property and not as a substring.

The needs-human protocol is tested the same way, at both tiers [observed — 2026-08-23]. Unit: the classifier against a table of recorded output, one sample per signature that exists plus the cases that must answer `null`; the registry invariants (unique ids and codes, `SCREAMING_SNAKE` codes, a command or a URL for every row that is not a generic fallback, the fallbacks last); `logCmdError` with a `NeedsHumanError`, asserting the event pair, the three printed lines and exit `7`; the preflight answering from one subprocess however often it is asked; the hang guard on fake timers, including the two cases it must _not_ fire in. E2E, through the published bin with stdin closed: a stub `eas` printing the real `SessionManager` auth line, a stub `expo` printing the real non-interactive line, and a stub that prints a question and then waits forever — each asserting the exit code, the printed block and the `cli:needs_human` event in `LOG_EVENTS` [observed — `e2e/__tests__/deploy-test.ts`].
