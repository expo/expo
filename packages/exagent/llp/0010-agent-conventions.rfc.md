# 0010: Agent Conventions — Exit Codes, Registry Rules, Upstream Asks

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` launcher (`src/cli.ts`, `src/commandRegistry.ts`, `src/exitCodes.ts`, `src/utils/errors.ts`, `src/utils/jsonMode.ts`); `exagent build:wait` (`src/builds/`); `exagent dev:wait` (`src/dev/waitAsync.ts`, `src/dev/waitFormat.ts`, `src/runtime/bundleCheck.ts`); `exagent typecheck` (`src/typecheck/`); the needs-human protocol (`src/needsHuman/`, `src/utils/subprocess.ts`, `src/utils/expoCli.ts`); `packages/@expo/cli`; `eas-cli`
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

> **Status:** Deferred — reference (2026-08-26). The command is out of the v1 surface and its code
> is on the reference shelf at `src/deferred/build-wait/`; the exit-code band it established is
> unchanged and every command that stayed still uses it.
>
> **Why:** the shape is wrong rather than the work. A caller who wants to wait on a build has
> already run a build command, and `exagent build:wait <id>` asks them to carry an id from one
> command to another — while `npx eas build --wait` does the whole thing in one. The answer is a
> **`--wait` flag on a build verb this CLI owns**, not a command of its own.
>
> **Re-entry criteria:** `exagent build` exists as a verb with local and EAS parity — the same flag
> waiting on a local `expo run:ios` and on an EAS build — so that `exagent build --wait` is one
> answer rather than two commands wearing one name. The table below is what it returns as. See
> [[0016-v1-scope]].

[observed — 2026-08-23, `src/builds/`] `exagent build:wait <id>` is the first command whose whole answer is its exit code, and it is what the `20`–`29` band was reserved for. It attaches to an EAS build that already exists — one started by CI, by the dashboard, or by another agent — polls `eas build:view <id> --json`, and leaves with what the build did:

| Code | The build                                          | Where it is decided            |
| ---- | -------------------------------------------------- | ------------------------------ |
| `0`  | `FINISHED`                                         | `src/deferred/build-wait/status.ts` |
| `20` | `ERRORED`                                          | `src/deferred/build-wait/status.ts` |
| `21` | `CANCELED`, **or this wait was interrupted**       | `src/deferred/build-wait/status.ts` |
| `22` | still running when `--timeout` elapsed             | `src/deferred/build-wait/waitAsync.ts` |
| `7`  | nobody is signed in, so no build is visible        | `src/needsHuman/assertAuth.ts` |
| `1`  | not readable: bad id, no `eas`, three failed polls | `CommandError`                 |

**The table has now been run against live builds** [observed — 2026-08-26, staging, `@kudo1/DailyWords-Grok`]. `ERRORED` → **20** and `CANCELED` → **21** were both produced by real builds rather than by fixtures: an iOS build that failed in `INSTALL_PODS`, and an Android build cancelled mid-flight with `eas build:cancel`. The service spells it **`CANCELED`**, one `l` — `CANCELLED` stays in the table as a spelling that costs nothing to accept and would hang a wait if the service ever used it. The non-terminal statuses a wait polls through are `IN_QUEUE` and `IN_PROGRESS`, both now recorded as fixtures (`src/__fixtures__/eas/README.md`). `NEW` and `PENDING_CANCEL` were still not seen: `NEW` is held for less than one poll interval, and `PENDING_CANCEL` needs a cancellation to be caught in flight.

One assumption the same runs contradicted, though it costs nothing: **`queuePosition` and `estimatedWaitTimeLeftSeconds` do not arrive.** They are real `BuildFragment` fields and are requested on every query, and they appeared on none of 47 polls across a ~10-minute queue on either platform. The cause is general and worth knowing wherever this CLI reads EAS JSON: `printJsonOnlyOutput` sanitizes each payload by **deleting every key whose value is null**, so no `eas --json` output can contain a `null` at all, and absence is the only way the wire has of saying one. No parser may try to tell "the service said null" from "the service said nothing".

Three details of the mapping are decisions rather than transcription:

- **An unrecognized status is not terminal.** The status enum belongs to a service that ships without this CLI, so a status the table has never seen keeps the wait polling. Ending on it would report an outcome nobody observed; the timeout is what stops a wait that is wrong about this, and `22` says "inconclusive" rather than claiming a result. `PENDING_CANCEL` is the concrete case — a cancellation asked for and not yet happened, which still resolves to `CANCELED` or `FINISHED`.
- **An interrupted wait exits `21`, not `130`.** The definition of `21` above is "canceled by the caller (a declined prompt, `SIGINT`) or by the service", and a Ctrl-C is the caller cancelling. `130` would have been a second convention for the same fact. The two are told apart on the event stream (`cli:build_wait.interrupted`) rather than in the `--json` payload, whose key set is fixed.
- **Three failed polls is `1`, not an outcome.** A wait that cannot read the build has not learned anything about it, so it is a tool failure. Its _prose_ names `eas workflow:status <id> --wait --json`, because a build id and a workflow id look alike and come from the same places — but not its `Try:` line [revised — 2026-08-23]. The `How:` sentence states a condition ("_if_ it names a workflow run"), and the last line of a failure is what a driving agent acts on, so putting the workflow command there strips the condition and sends the agent to run something that fails again for the same reason [observed — friction run, 2026-08-23: signed out, and `Try:` recommended the workflow command for an id that was obviously not a build]. `Try:` is now `<the eas that ran> whoami`, which is worth running whatever the cause.
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

#### The web target answers the same question with different documents

Decision [confirmed — Kudo, 2026-08-23]. `--platform web` gets a real check, not a skipped one.

The finding [observed — friction run 2, 2026-08-23]: `dev:wait --platform web` on the same broken
file that `--platform ios` exited `20` for exited `0` with
`{"checked": true, "ok": null, "reason": "http://…/ did not answer with JSON: Unexpected token '<'…"}`.
Three separate faults in one payload — no protection for the web target at all, a `checked: true`
that contradicted its own `ok: null`, and an internal parse error standing in for a diagnosis.

The web dev server has no manifest. `GET /` is the page a browser loads, and it answers the same two
questions in two other places:

1. **The entry bundle URL is the `<script src>` the dev server appends to that page** [observed —
   `ManifestMiddleware.getSingleHtmlTemplateAsync` → `appendScriptsToHtml(contents, [getWebBundleUrl()])`,
   and live: `<script src="/node_modules/expo-router/entry.bundle?platform=web&…" defer></script>`].
   From there the check is byte for byte the native one: HEAD that URL, and fetch the body only when
   the status says something went wrong.
2. **A project that does not compile never produces that page at all.** The web dev server renders
   on the server, so the failure surfaces one step earlier: `GET /` answers **500** with an error
   page carrying the whole LogBox record as JSON in `<script id="_expo-static-error">` [observed —
   `metroErrorInterface.ts` `getErrorOverlayHtmlAsync`, and live: file, line, column, message and
   code frame, with `<` escaped so the payload cannot close its own tag]. That is read as `broken`
   directly, because there is no bundle left to ask about.

A 500 whose body is _not_ an Expo error page stays `unknown` — the conservatism of the four
decisions above is unchanged, and something else answering on that port has not shown this project
to be broken.

##### What app counting can and cannot see

Decision [confirmed — Kudo, 2026-08-24]. `--platform web` reports `appsConnected: null` with a
reason, and `--require-app --platform web` is a `BAD_ARGS` — exit `1`.

The finding [observed — friction run 4, F40]: with only Expo Go on a simulator attached,
`dev:wait --platform web --require-app` exited **0** with `apps 1 app connected` and a follow-up
reading "The bundle is loaded in a connected app". No web client existed. The follow-ups also
dropped `--platform web` and named `runtime:errors`, which reads the _native_ runtime over the
debugger — a different app on a different platform than the one that had just been waited on.

The first instinct was to filter the target list by platform. That is not a smaller version of the
right fix, it is impossible, and the live check is what settles it [observed — 2026-08-24, notesapp
on port 8190]: the web bundle was loaded in Safari against the same dev server — Metro logged
`Web Bundled 220ms node_modules/expo-router/entry.js (1307 modules)` and then
`Web LOG Running application "main"`, so the client was genuinely running — and `/json/list` stayed
at exactly **one** target, the iOS one, through 90 s of polling. `/json/list` is the inspector
proxy's list of React Native runtimes that connected over `/inspector/device`; a browser has no
such module, so a web client is not an entry with the wrong platform on it, it is not an entry at
all. There is nothing to filter and no field to filter on.

So the honest answer is the absence of one, and it is reported as an absence in the shape this
document already uses for `bundle.ok`: `appsConnected: null` with `appsReason` present exactly when
it is null, and no number in the human line either — a reader who takes one thing from that line
takes the number, and for web the number is about other platforms.

**`--require-app --platform web` is `1`, not `0` and not `22`.** The three readings, and why this
one:

- `0` with no count is what the report above already is, and it would let `--require-app` — a flag
  whose entire purpose is to make the exit code depend on an app being attached — silently not do
  that. An agent passing it across platforms in a sweep would read the same `0` it reads for iOS
  and conclude the same thing.
- `22` says "look again", and no amount of looking makes a browser register a debugger target.
  Same reasoning as the project-root mismatch of §The second: `dev:wait`.
- `1` is the band for "the tool did not work: usage error … fix the call", and this is exactly
  that: a flag combination that cannot be answered, with two spellings that can (drop the flag, or
  name a native platform), both in the `How:` line. The false red it introduces is a caller who
  wanted the web bundle checked and passed `--require-app` out of habit; they lose one run and get
  told what to type.

The follow-ups gain the platform for the same reason. Every `dev:wait` a web run suggests re-running
carries `--platform web`, and the ready-state rung is the page to open plus `typecheck` — the two
things that mean something with no runtime to read — rather than `runtime:errors`, which would talk
to whatever native app happens to be attached.

The limit this leaves, stated plainly rather than papered over: for web, `dev:wait` proves the
bundler is this project's and the web entry bundle compiles, and it proves nothing whatsoever about
a page being open. The command now says so in both channels instead of implying otherwise.

##### One error, one shape, whichever document answered

Decision [confirmed — Kudo, 2026-08-23]. The `error` object is the same shape on both targets:
`type` is populated on web too, and `filename` is project-relative on both.

The finding [observed — friction run 3, F37]: the same file with the same syntax error, checked by
the same command, came back as `{"type":"TransformError","filename":"src/app/index.tsx"}` for
`--platform ios` and `{"type":null,"filename":"/Users/…/src/app/index.tsx"}` for `--platform web`.
Both are true reports of what each document said, and together they are a shape a consumer cannot
parse once. The two halves have different answers:

- **`filename` is normalized, in one place.** Metro names the file relative to the project root and
  the web error page names it absolutely, so the relativizing happens where every result leaves the
  check rather than per reader. A file _outside_ the project stays absolute, for the reason a stack
  frame outside it does: `../../..` is not more useful than the path.
- **`type` is derived on web, and the derivation is sound because of when the page exists.** The
  page has no field for it, and the earlier code declined to invent one — correctly, as a rule about
  inventing facts. What makes it not an invention is that the web dev server renders this page **in
  place of** the bundle, so a page is only ever produced by a failure that stopped the build, and
  the record's `level` says which kind stopped it: `resolution` is built from an
  `UnableToResolveError` and everything else from Metro's `TransformError` [observed —
  `@expo/log-box-utils` `parseWebBuildErrors`]. Two guards keep it honest — an explicit `type` on
  the record wins, so the day the page carries the class this stops deriving anything; and `'error'`
  is _not_ read as one, because `LogBoxLog` fills that in for a record that named no type
  [observed — `log-box/LogBoxLog.ts`, `data.type ?? 'error'`], which is the absence of an answer
  wearing the shape of one. A record with no level at all still reports `null`.

The upstream ask that would retire the derivation is recorded below.

#### `checked` and `ok` move together

Decision [confirmed — Kudo, 2026-08-23]. In the `--json` payload, `bundle.checked` is exactly
`bundle.ok != null`. `checked: true` with `ok: null` said "this was checked, and the answer is
nothing", which is not a state a caller can branch on; the honest split is that a check either got
an answer from the bundler or did not, and `reason` says which of the ways it did not. `reason` is
now present exactly when `ok` is null, including for `--no-bundle-check` (`the entry bundle check
was not run`), so the two keys are readable as one fact instead of three.

The reasons themselves stopped being exception messages [revised — 2026-08-23]. A manifest request
that came back as HTML reports the content type the dev server sent and that whatever is on the port
may not be an Expo dev server; it does not report `Unexpected token '<', "<!DOCTYPE "... is not
valid JSON`, which describes byte 0 of a body the reader never sees.

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

Only `errors` has it. The rule was written against `runtime:network`, which had no equivalent
question for its exit code to answer: its failed requests are something it reports _about_ the app —
a 404 the app handles is not the command's operation failing. That command was deferred out of v1 on
2026-08-26 ([[0016-v1-scope]]), and the rule it established stands: a command that reports on the app
does not gate on what it reported.

**Amendment — a runtime that cannot answer is `22`, not `0`** [observed — friction run 6 (Android),
2026-08-24; settled in [[0005-runtime-loop-tools]] §Android]. "The default stays `0` whatever it
collects" was written when every runtime this CLI talks to could report something. Expo Go for
Android cannot: it acknowledges `Runtime.enable` and sends nothing, so its empty window is not
"nothing happened while I watched" — it is _no observation_, and `--fail-on-error` exiting `0` on it
reports health that nothing established. So on a runtime that announced it carries no debugger, and
where no dev server log could be read instead, `--fail-on-error` exits `22`: nothing was shown to be
wrong and nothing was proved right. When a log **was** read the window is a real observation and `0`
stands, and without the flag the command still exits `0` and prints the caveat — the flag is what
says a caller is gating on this.

### The fourth: `typecheck`, and the gate the other three could not be

[observed — 2026-08-23, `src/typecheck/`] `exagent typecheck` is the fourth command in the band, and
the first one whose _whole reason to exist_ is a class of failure the band's other members are
structurally blind to.

The finding [observed — friction run 3, F34]: a feature was finished with `dev:wait` at `0`,
`runtime:errors --fail-on-error` at `0` and `doctor` at 21 of 21, and `npx tsc --noEmit` then
reported seven errors. One of them was `Spacing.md` on a constant with no `md`, which evaluates to
`undefined`, so the screen rendered with `padding: undefined` — every line of text flush against the
left edge, in the screenshots, with every gate green. Both other gates were _correct_: nothing threw,
so the error window was right to be empty, and nothing failed to transform, so the bundle check was
right to pass. Green meant "it parses and does not throw", and an agent following the CLI's own
follow-ups would have shipped it.

| Code | The project                                                                       | Where it is decided               |
| ---- | --------------------------------------------------------------------------------- | --------------------------------- |
| `0`  | type-checks, **or** has no TypeScript in it at all                                | `src/typecheck/typecheckAsync.ts` |
| `20` | does not type-check; the diagnostics are the payload                              | `src/typecheck/typecheckAsync.ts` |
| `1`  | unknown: a TypeScript project with no compiler, or one that failed saying nothing | `CommandError`                    |

Four details of that are decisions rather than transcription:

- **A project with no TypeScript exits `0`, with `checked: false`.** Failing for the absence of
  TypeScript would make the gate red for every JavaScript project forever, and a red that is not
  about the code is a red nobody can act on — the same reasoning as `bundle.ok: null` in §The gate
  has to ask about the _project_, and the same key pair reporting it. `reason` is present exactly
  when `checked` is false, and the follow-up says so in a command as well as in a field, because
  "nothing was checked" must not read as "everything passed".
- **A TypeScript project with no compiler is `1`, not `0`.** Amendment [confirmed — friction run 4,
  2026-08-24]. These were one answer, word for word: `run4b/tsnots` has a `tsconfig.json` and a
  `.tsx` entry and no `node_modules`, and it reported "this project has no TypeScript compiler
  installed … so there is nothing to type-check" — the same string as the genuinely JavaScript-only
  fixture next to it — and exited `0` [observed — F43]. An exit-code gate read a broken TypeScript
  setup as a pass, and the reason it printed was false. There are **three** states, not two: no
  `tsconfig.json` and no `.ts`/`.tsx` sources is a JavaScript project and exits `0`; either of those
  present with no `node_modules/.bin/tsc` is a broken setup and exits `1` with
  `TYPECHECK_CLI_MISSING` and `Try: npx exagent install typescript --dev`; a compiler present runs.
  The sources are evidence in their own right because a project can lose its `tsconfig.json` and
  still be one; `.d.ts` files alone are not, since `expo-env.d.ts` is generated into every app.
- **No compiler is ever fetched.** `doctor:check` falls back to `npx expo-doctor` and this
  deliberately does not: `expo-doctor` is a tool you run _at_ a project and its checks are its own,
  while a type check is a function of the project's own compiler version, its `tsconfig.json` and
  its `@types` — so a compiler from the registry would answer a question about a project that does
  not exist. Only `node_modules/.bin/tsc` counts.
- **A compiler that failed and printed nothing readable is `1`, not `20`.** Every verdict this
  command reports is read back out of what the compiler printed, so a failure with no diagnostic in
  it has not answered the question. Reporting it as an outcome would send an agent looking for a type
  error that was never reported. The error quotes what the compiler did print and names the exact
  command to re-run by hand.
- **Both output forms are parsed.** `--pretty false` is what the compiler is asked for, and `pretty`
  is a _compiler option_ as well as a flag, so a project can set it in its own `tsconfig.json` and
  what runs is whatever the project has under that name — an assumption, not a fact, exactly as §The
  binary may not be the CLI says. A parser that knew only the terse form would report "no errors"
  for a project whose compiler printed the other one, which is the one answer a gate must never
  give. Both recordings are committed, from one run of one project, and a test asserts they parse to
  the same answer.

Where the command is reachable from — which follow-up ladders gained the rung, and which rung it
replaces in each — is [[0009-smart-followups]] §Where the typecheck rung goes.

### The fifth: `runtime:reload`, and the difference between failed and inconclusive

[observed — 2026-08-23, `src/runtime/reload/`; friction run 3, F31] `exagent runtime:reload` is the
first command that uses **both** codes of the band in one run, and the boundary between them is the
whole design (the mechanism is [[0005-runtime-loop-tools]] §Reloading the app):

| Code | The reload                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| `0`  | happened, and a debugger target that was not there before has registered                                   |
| `20` | did not happen: the entry bundle does not compile, nothing answered, or nothing acted on it                |
| `22` | happened, and no _new_ app had registered when `--timeout` expired; or the entry bundle was still building |
| `1`  | was not attempted: no dev server to reload onto, or a bad argument                                         |

Three details are decisions rather than transcription:

- **A reload is never assumed.** The broadcast has no reply, so a command that sent one and exited
  0 would be reporting an act it did not observe — the same shape of lie as a bundle check on a
  frozen watcher. `reloaded: true` requires the app's connection to the dev server to have been
  _replaced_, which the dev server's never-reused socket ids make provable without CDP. What that
  proves is that the app **acted**; [[0005-runtime-loop-tools]] §Peer churn proves the app _acted_
  covers why it does not prove the app came back, and what is waited for instead.
- **`20` and `22` split on whether anything happened.** Nothing reloaded is a failure with a cause
  to read; reloaded-but-not-back is a wait that ran out, and the next action is to look again, not
  to re-run the reload. Collapsing them would make an agent reload an app that was already fine.
- **No dev server is `1`, not `20`.** Nothing was attempted, and the operation the code would be
  reporting on never started. A reload with no dev server would also be actively harmful — it makes
  the app re-fetch a bundle from nowhere — so the command refuses rather than reports.

#### The reload gate

Decision [confirmed — Kudo, 2026-08-24]. `runtime:reload` runs the entry-bundle check of §The gate
has to ask about the _project_ **before** it broadcasts anything, and a bundle that does not
compile is exit `20` with nothing reloaded.

The finding [observed — friction run 4, F38]: garbage was appended to a route, `dev:wait` exited
`20` with the `TransformError`, and `runtime:reload` then exited **0** with
`Reloaded yes · Apps connected 1` and a follow-up reading "The app is running the current code
now". The app was on the red bundling-error screen. `runtime:errors --fail-on-error` after it
exited `0` too. Two of the three gates wave 4 added as the recovery chain went green on an app
frozen at a syntax error, and the third had just said why.

The reasoning is the same one that put the check in `dev:wait`, applied one command further along:
a reload does not run the code on disk, it makes the app **fetch the served bundle again**. When
that bundle is the one the bundler stopped on, the reload replaces the red screen with the same red
screen — so `reloaded: true` is not even wrong about the mechanism, it is just an answer to a
question nobody asked. The check costs a `HEAD` on a warm dev server (39–48 ms live) and is the one
thing that makes the command's success mean what a caller reads into it.

Four details:

- **It is before the broadcast, not after it.** Live, the refusal reports `attempts: []` — no
  `getpeers`, no broadcast, no device tool. A gate that ran afterwards would have already put the
  app on the broken bundle and would only be choosing what to call it.
- **`--no-bundle-check` mirrors `dev:wait`'s**, including the reason it exists: reloading onto a
  bundle you know is broken is a thing someone may mean to do, and a gate with no way past it is a
  gate people route around.
- **`unknown` passes and `timeout` is `22`.** Fail-open is unchanged from §The gate has to ask
  about the _project_ — a dev server that answered nothing this CLI understands has not shown the
  project to be broken. A check that ran out of budget is the "look again" case, and refusing there
  is honest for the same reason `dev:wait` is: until the build finishes, nobody knows whether a
  reload would fetch working code, so the command attempts nothing rather than guessing.
- **The `bundle` object is the one `dev:wait` prints**, same keys, same `checked`/`ok`/`reason`
  invariant, produced by the same function. One question asked in two commands must not have two
  shapes.

Live [observed — 2026-08-24, notesapp on port 8190, app connected]: exit **20** in 48 ms,
`attempts: []`, `bundle.error` = `{type: "TransformError", filename: "src/app/notes.tsx",
lineNumber: 77, column: 4}` with the code frame, and the prose naming that a reload would only
re-fetch the broken bundle.

One consequence worth recording: `appsConnected` on a run that refuses is the count the dev server
gave, not `0`. A flat zero there would be this command inventing "no app is connected" out of a
step it deliberately skipped, which is the same class of unverified claim the whole round removes.

### The sixth: `status --assert`, and a gate that is not about a process

[observed — 2026-08-24 as `impact --assert`; moved onto `status` 2026-08-26 when `exagent impact`
was folded in, see [[0011-impact-and-freshness]] §Two commands, one classifier — and then one
command] This is the first command in the band whose subject is neither a process nor a service but
a **classification** of the working tree, and it joins the band the way `runtime:errors` did:
opt-in.

The default is `0` always, because `status` is information and not judgment — the contract
[[0004-smart-start-and-project-state]] §`exagent status` gives it. `--assert <class>` is the gate,
and it exits `20` when the real class is stronger than the one named.

**A command whose default is `0` by contract can still carry a gate, and this is the rule for when.**
The objection is real — a command documented as always exiting 0 growing a non-zero path looks like
the contract breaking — and the answer is that the contract is about what a *report* does. Three
conditions make it safe, and all three hold for `runtime:errors --fail-on-error` and for
`status --assert`:

1. **The caller opts in by name.** A run without the flag is byte for byte the run it was before the
   flag existed, so nothing that reads the command as a report can be surprised by it.
2. **The report still prints in full.** The gate adds a verdict; it does not replace the output.
3. **The verdict is in the payload too**, so an agent that captured stdout and lost the exit code can
   still read what happened.

A flag that failed any of the three would be a different command wearing this one's name.

Decision [confirmed against the cluster plan, which proposed `1`]. The plan for this command wrote
the assertion failure as exit `1`, and that is the pre-convention reflex. `1` is the band for "the
tool did not work: fix the call", and here the tool worked perfectly: the fingerprint was computed,
the diff was classified, and the whole report is on stdout. There is nothing about the call to fix,
so an agent reading `1` would go looking for a usage mistake it did not make. This is the shape the
`20`–`29` band exists for, and `runtime:errors --fail-on-error` already uses `20` for the identical
one — a flag that turns a report into a gate.

Three details:

- **The whole report still prints on the run that exits `20`.** The exit code is the answer and the
  payload is why; a gate that dropped one of the two would be unreadable.
- **`22` when nothing could be classified** [added — 2026-08-26]. `status` answers `class: null`
  where nothing was established, and a gate must neither round that up to a conservative class nor
  pass on it. `22` is this document's code for "nothing was shown to be wrong and nothing was proved
  right", which is exactly the state, and `runtime:errors --fail-on-error` already uses it for the
  same shape — an empty window from a runtime that cannot report. The two failures need different
  fixes, which is what earns the second code: `20` means change the code or raise the assertion,
  `22` means give the gate something to measure.

  Decision [confirmed — Kudo's delegate, 2026-08-26]: this is the rule for **every** gate-shaped
  flag, not a local choice. Any `--assert`- or `--fail-on-*`-shaped flag this CLI grows — the
  planned `credentials:status --assert` included — answers a measured failure with `20` and an
  unmeasurable state with `22`, and carries the distinction in its payload as well
  (`assertion.actual: null` beside the reason). One convention across the gates is the point: a
  caller branching on a gate's exit must get the same answer to the same situation from every
  command that offers one.
- **The class is not the OTA verdict**, and neither is derived from the other. That split is the
  normative part of [[0011-impact-and-freshness]] and the reason it is a document rather than a
  paragraph here: a fingerprint answers "does the native binary differ" and OTA safety is a
  `runtimeVersion` question, so a tool deriving one from the other reports the `fingerprint` policy
  — the one where a native change is *safest* — exactly backwards.

### The seventh and eighth: the stop commands, and what "already done" is worth

[observed — 2026-08-23, `src/runtime/stopAsync.ts`, `src/dev/stopAsync.ts`] `runtime:stop` and
`dev:stop` are the first commands whose subject can be **already in the state that was asked for**,
and both answer it the same way: that is success.

Decision [confirmed — Kudo, 2026-08-23]. An app that was not running, and a dev server that was not
running, both exit `0`. The alternative was tempting — a distinct code for "nothing to do" — and it
is wrong for the reason the band exists: the code answers _did the thing the tool was asked about
work_, and the thing being asked about is a state, not an act. An agent that stops an app twice
would otherwise have to special-case the second run, which is exactly the branching the convention
removes. What is _not_ collapsed is the fact itself: `runtime:stop` reports `wasRunning`, and
`dev:stop` reports `reason: "not-running"`, so a caller that cares can read it without reading the
code.

The two codes each command does use:

| Command        | `20`                                                                 | `1`                     |
| -------------- | -------------------------------------------------------------------- | ----------------------- |
| `runtime:stop` | `--app-id` named an app that was not running, and a different one is | the device tool refused |
| `dev:stop`     | it is still running, or it is not this CLI's to stop                 | a bad argument          |

Two details are decisions rather than transcription:

- **A device tool that refused is `1`, not `20`.** The operation `runtime:stop` performs cannot
  half-succeed: either the app is stopped or the tool would not run it, and a tool that would not
  run is a tool failure. The message names the id it tried and the evidence that chose it, so the
  recovery is `--app-id`.

  `runtime:stop` did also gain one `20` [added — 2026-08-24], and it is the one case where "already
  in the state that was asked for" is not the whole truth: the state holds for an id nothing was
  using, while the app the caller can see is untouched. [[0005-runtime-loop-tools]] §An `--app-id`
  nobody is running has the three conditions and the argument, including why a note on a `0` was
  rejected — an agent reads the code before it reads a word of the output, so a warning inside a
  zero is a warning nobody acts on.

- **A dev server this CLI did not start is `20`, not `1`.** The command worked perfectly and
  declined on purpose; nothing about the invocation was wrong. `1` would tell an agent to fix its
  call, and there is nothing to fix — the recovery is `--force`, or stopping it where it was
  started, and both are in the `How:` line.

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

### One question of the family is not a needs-human: the busy port

Amendment [confirmed — friction run 4, 2026-08-24]. `Use port 8181 instead?` matches the
`expo-prompt` signatures like every other question the Expo CLI asks, and it is the only one a
machine can answer for itself. `exagent dev` recognises it **before** the classifier runs
(`src/dev/portCollision.ts`) and either retries the step on a free port it picked or, when the
caller named `--port`, reports `PORT_IN_USE` with exit `20`.

The shipped behaviour was exit `7`, `needsHuman.scenario: "expo-prompt"`, a `suggestedCommand`
re-running the identical failing command, and a `How:` naming the flag the caller had just passed
[observed — F41]. Exit `7` means "the recovery is not another command"; here the recovery _is_
another command, and one this CLI can run itself.

The carve-out is deliberately **not** a negative signature in the registry. A registry row describes
a stop and the handoff for it; what makes this one different is the _action_ — find a free port, run
the step again — which belongs to the caller that owns the step. `expo-prompt` is unchanged and
still catches every other prompt; only its `How:` line lost the port example, which now belongs to
an error of its own. The full reasoning, including why a named `--port` is a requirement rather than
a preference, is [[0004-smart-start-and-project-state]] §A busy port is not a step only a person can
complete.

### Four layers, in priority order

1. **Preflight** — ask the cheap question first. `src/needsHuman/preflight.ts` runs `eas whoami` with a short deadline and caches the answer for the process. `eas whoami` is asked before `EXPO_TOKEN` is looked at, because it also knows the account _name_ and because it reads the variable itself — so a token the service rejects reads as "not signed in" rather than as a login. A preflight that cannot run answers `null`, which is not "signed out": the two lead to different next actions. This is the `auth` section of `exagent status` [observed — `src/status/`], and `src/needsHuman/assertAuth.ts` is the same answer _raised_ — for `deploy` and `build:wait`, which cannot do their job without an account and would otherwise spend minutes finding out.

   Three things count as "cannot run", and the third was a bug [fixed — 2026-08-23]. No `eas` on this machine, a run that passed the deadline, and **a binary under that name that is not the EAS CLI**. The third exits non-zero exactly like a signed-out CLI does, so it read as "signed out" — and on a machine whose PATH `eas` is a wrapper that crashes (this is not hypothetical: the friction run's was), every command with a preflight would have stopped and handed its user a login they did not need. `looksLikeWrapperCrash` (§The binary may not be the CLI) is what tells the two apart.

   **What a signed-in machine showed** [observed — 2026-08-26, eas-cli 22.4.0, account `kudochien`]. Two of the three answers were right and one was half right. `loggedIn` was `true` and `assertSignedInAsync` let `deploy` through to its export, checked without deploying by stubbing the `expo` that runs next — the event stream goes `deploy:resolved` → `deploy:export` with no `cli:needs_human` [observed — a live run]. In the same project *before* a local `eas-cli` was installed, the preflight answered `null` rather than `true`, because the machine's PATH `eas` is the crashing shim and the third "cannot run" case fired: **on this machine the signed-in state is invisible to any project that has no `eas-cli` of its own.** That is the design working — `null` is honest, and the alternative is stopping a command that had every right to run — and it is also the whole cost of the shim, so it is worth saying out loud rather than discovering twice.

   The half-right answer was the *name*. `user` came back `null` for a signed-in account, because the parser read the **last** non-empty line and `eas whoami` prints an account list *below* the name: name, email, then `Accounts:` and one `• <name> (Role: <role>)` per account, for any actor belonging to more than their own personal account [observed — `src/__fixtures__/eas/whoami.txt`, and `eas-cli/build/commands/account/view.js`]. The last line of a real answer is a role. It now reads the first line that looks like one name, which keeps what the old rule was for — a notice printed above the answer has spaces and is skipped — and drops the `(authenticated using EXPO_TOKEN)` note the CLI appends when the session came from the variable.

2. **Force non-interactive** — every captured subprocess is told that nothing can answer it. For `expo` that is `CI=1` in the child environment, because the CLI rejects `--non-interactive` and names the variable instead [observed — `packages/@expo/cli/src/index.ts`]; `spawnExpoAsync` is the capture path that sets it, and `runExpoAsync` deliberately does not, because there a person has the terminal. For `eas` it is `--non-interactive`, or `--json`, which implies it. stdin was already never attached [observed — `src/utils/subprocess.ts`]. **Except the dev-server step, which is spawned with `ci: false`** — see below.

#### The dev server is the exception, and `CI` is why

Decision [confirmed — Kudo, 2026-08-23]. Every captured `expo` run gets `CI=1` **except the one
that starts a dev server** (`expo start`, `expo run:ios`, `expo run:android`, all of which reach
`spawnDevServerAsync`). That one is spawned with the variable left alone.

`CI` does two jobs in the Expo CLI and this layer only ever wanted the first:

- it makes prompts fail fast, through `isInteractive()`; and
- it turns **Metro's file watcher off** [observed — `instantiateMetro.ts` `isWatchEnabled` logs
  `Metro is running in CI mode, reloads are disabled`, and `withMetroMultiPlatform.ts:496` passes
  `watch: !isExporting && !env.CI`].

The second is fatal here. A dev server with no watcher never invalidates its graph, so it serves the
snapshot it read at start-up forever — and the entry-bundle check of §The gate has to ask about the
_project_ then reads that frozen server and certifies code the agent has already replaced. That is
run 1's F1 failure mode reproduced through a different mechanism, on the exact path the F1 fix was
written for [observed — friction run 2, 2026-08-23: a syntax error appended to a route of a live SDK
57 app left `dev:wait --json` at `bundle.ok: true`, exit 0, while the same file on a server started
by `exagent start` — which never set `CI` — exited 20].

**Dropping it costs nothing, because the two concerns were never the same mechanism.**
`isInteractive()` is `!shouldReduceLogs() && !env.CI && process.stdout.isTTY` [observed —
`packages/@expo/cli/src/utils/interactive.ts`], and a captured child's stdout is a pipe, never a TTY
[observed — `src/utils/subprocess.ts` `stdioFor`, which wires `['ignore', 'pipe', 'pipe']` for every
mode but `inherit`]. So the CLI already knows nobody can answer it: the prompt helper still throws
`Input is required, but 'npx expo' is in non-interactive mode.`, layer 3 still recognises it, and the
keypress menu of `expo start` is still never installed [observed — `start/startAsync.ts:140`].
Verified live: with 8140 held, `exagent dev --yes --json --port 8140` exits **7** in one second with
the full envelope and the three-line handoff, exactly as it did with `CI=1`.

Three details of that are decisions rather than transcription:

- **Nothing is set, rather than `CI=0`.** A machine whose own environment says `CI` is a machine
  where a frozen bundler is the right behaviour, and overriding it here would be the wrapper
  deciding something about its caller's environment that nobody told it. `spawnExpoAsync` passes no
  `env` at all in that mode, so the child inherits.
- **`expo run:*` is in the exception too**, not only `expo start`: it ends in a dev server, and a
  development build attached to a frozen bundler is the same lie in a longer plan.
- **`expo prebuild` and every other captured step keep `CI=1`.** They start no bundler, so the
  variable does only the job it was added for.

The alternative that was looked for and does not exist: an env var or flag that re-enables the
watcher under `CI`. `isWatchEnabled()` returns `!env.CI` with nothing in between, so there is
nothing to pass. The upstream ask that would retire this exception is recorded below. 3. **Exit signature** — match the captured output against the registry. Three patterns are load-bearing today: eas-cli's `Either log in with … EXPO_TOKEN` [observed — `build/user/SessionManager.js`], `@expo/cli`'s `is in non-interactive mode` [observed — `src/utils/prompts.ts`], and the `in non-interactive mode` fragment eas-cli's many prompt sites share. 4. **Prompt-hang guard** — for a captured child only, and only when the caller opts in. If it writes nothing for `EXAGENT_PROMPT_TIMEOUT_MS` (default 20 s) _and_ its last non-empty line is prompt-shaped, it is killed and the line is quoted as untrusted text. Both halves are required: silence alone is a long build, and killing that would be worse than the hang it prevents. Never in `inherit` mode, where a prompt is legitimate.

The prompt shape is `/[?:]\s*$|^\s*[?›»]\s+\S|\(y\/N\)|\(Y\/n\)|Password|passphrase/i` [observed — `src/needsHuman/detect.ts`]. The leading-marker half was added because `prompts` and `inquirer` write the marker at the _start_ — `? Select a platform` is a question that ends in neither a question mark nor a colon.

### The binary may not be the CLI

Decision [confirmed — Kudo, 2026-08-23]. Every one of the four layers above assumes that the thing on the other side of the spawn is the CLI. Across a process boundary that is an assumption, not a fact: what runs is whatever the machine has under that name, and a shim, a stale link, or a wrapper from another project will answer instead. The friction run of 2026-08-23 was driven on such a machine — PATH `eas` was a Rust wrapper that panicked — and it broke two things at once.

`src/utils/wrapperCrash.ts` is the one guard, and it is deliberately conservative: a failure counts as "not the CLI" only when the output holds **nothing** that looks like that CLI's _and_ the process died the way a wrapper dies (exit `101`, `126`, `127`, `134`, `139`, or a panic/backtrace signature). A false positive hides a real failure's output, which is worse than the vagueness it buys, so both halves have to agree.

Two callers, for the two things that broke:

- **The preflight** answers `null` instead of `false`, per layer 1 above. Reading a crash as "signed out" is the more expensive error of the two: it stops a command that would have worked.
- **The error message** says `The eas at <path> failed to run at all (this may not be the real CLI)` instead of quoting the bytes under `What the tool printed:`. The heading is a claim about provenance, and it was false: an agent reading a Rust backtrace attributed to eas-cli goes looking for a missing file inside a program that was never involved.

The `Try:` lines of `deploy` and `build:wait` changed for the same reason. `npx eas-cli whoami` checks a _different_ program than the one that just failed — a healthy answer from it proves nothing — so the check names the resolved path that actually ran.

### What it costs, and the hole that stays

The breaking change [observed — `e2e/__tests__/deploy-test.ts`]: the deploy's two auth failures exited `1` and now exit `7`. At 0.0.2 that is the right moment; a CHANGELOG entry records it.

The plan engine joined the protocol on the same terms [added — 2026-08-23]. `exagent dev` runs its steps as subprocesses, and a step whose output this process can see is a step whose stop can be classified — so `dev` captures its steps whenever nobody is watching a terminal (`--json`, or a non-TTY run) and inherits when somebody is. `Input is required, but 'npx expo' is in non-interactive mode.` is then exit `7` rather than the subprocess's own `1`, which is the definition of the code: what the command is waiting for is an answer, and no re-run supplies one. The message names `--port` for the case that produces it almost every time — 8081 already taken, and the CLI asking whether to use 8082 — because that flag answers the question before it is asked. The friction run of 2026-08-23 is what this is for: `exagent dev --yes` is the documented non-interactive entry point, and on a busy port it exited 1 having started nothing.

### A failed plan step reports a failure, not a plan

Decision [confirmed — Kudo, 2026-08-23]. `exagent dev` prints its plan object only when every step
of it worked. A run whose step failed raises instead, so `--json` gets the error envelope of §The
`--json` error envelope and a terminal gets what / **Why:** / **How:**.

The finding [observed — friction run 2, 2026-08-23]: `exagent dev --yes --json --ios` exited **7**
with the plan object on stdout — keys `target`, `rule`, `steps`, `reasons`, `followups`, no `error`
— zero bytes on stderr, and no dev server on the port. An agent parsing stdout read a started dev
server, an agent reading stderr read nothing, and only the exit code disagreed with both.

Three things were wrong at once, and each is fixed on its own terms:

- **The payload.** The plan describes what the run _meant_ to do. After a step failed it is a
  description of something that did not happen, and its follow-ups ("The dev server is up but opens
  nothing…", `exp://…:8131`) are advice about a dev server that does not exist. `PLAN_STEP_FAILED`
  is the envelope now, and in `capture` mode it carries the tail of what the step printed —
  otherwise `--json` throws that output away and the agent has nothing at all.
- **The classification.** The step failed on `osascript`: `expo start --ios` drives Simulator.app
  through AppleScript, and this Mac had granted no Automation permission (`-1743`). The Expo CLI
  does not catch the rejection, so it ends the process — the dev server with it. That is a person
  flipping a switch in System Settings, which is the definition of exit `7`, so it is a registry row
  now (`macos-automation`) and arrives with the whole handoff instead of a bare code.
- **The `7` itself was a coincidence.** Node leaves with `7` after an unhandled rejection inside an
  exception handler [observed live, 2026-08-23], and `exagent dev` forwards a step's code verbatim,
  so the CLI's own needs-human code arrived by accident. The forwarding rule does **not** change —
  inventing a code would hide the one the tool reported — but the payload now says which it is: a
  genuine stop carries `error.needsHuman`, and a coincidence carries `null` under
  `PLAN_STEP_FAILED`. The exit code was never meant to be read alone; the envelope is what
  disambiguates it.

What is deliberately _not_ changed: `--ios` stays in the plan's argv. It is the step that opens the
app, it works on a Mac with the permission granted, and llp/0004's `reason` already tells a reader
what each form does. The recovery an agent can take without a person — start without `--ios`, then
`exagent navigate /`, which deep-links through `simctl openurl` and needs no Automation grant — is
named in the error's `How:` line, where it is read at the moment it is useful.

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
- **Success paths are untouched.** Nothing about a command that works changes, and no command gained a second object: a failing command printed nothing on stdout before, so the envelope is the _only_ thing there.

**The envelope has to cover argument parsing too** [amended — friction run 4, 2026-08-24]. It did
not: `typecheck --json --bogus` exited 1 with an empty stdout and a bare `unknown or unexpected
option: --bogus` on stderr, with no `CommandError:` prefix, while every other command's `--json`
failure printed one parseable object [observed — F44]. Two things caused it, and both were at the
shared layer rather than in the command:

- `assertWithOptionsArgs` reported `arg`'s failures with `Log.exit`, which prints and exits without
  ever reaching `logCmdError` — so no event, no `Try:` line, no envelope. It throws a `CommandError`
  now (`argParseError`), and so does the stray-positional check next to it, which had the same shape
  and a worse consequence: `logCmdError` flushes the event log before exiting, so it does not end
  the process on that tick, and the command body went on running in the window before the exit
  fired.
- Nothing caught what a command rejected with. A command's own body ends in `.catch(logCmdError)`,
  but its _argument parsing_ runs before that chain is built, so a throw there was an unhandled
  rejection and Node printed a stack trace. `cli.ts` now catches at the one place every command is
  invoked from, which is what makes the envelope a property of the CLI rather than of each command.

The same change gives a bad option the what / why / how shape the rest of the CLI has, and a
`Try: <command> --help`. When the option exists on a sibling command — `--port` on `dev`, `--route`
on `runtime:reload` — the message names it, from a small hand-kept table (`OPTION_OWNERS`) in the
style of `absentCapabilities` here: only options a caller actually reaches for on the wrong command
belong in it, and a unit test pins that every command it names still resolves.

- **The exit code is still the first thing to read.** The envelope explains a failure; it does not signal one. `7` and the `20`–`29` band mean exactly what the table above says.

Implementation [observed — `src/utils/jsonMode.ts`, `src/utils/errors.ts`, `src/cli.ts`]: `logCmdError` is the one function every command's failure funnels into, and it runs _after_ the command module threw — often before that module ever parsed its own arguments. So the flag is answered once, by the launcher, from the raw argv: `setJsonRequested(argvRequestsJson(commandArgs))`. `argvRequestsJson` only looks before a `--` separator, because `install` and `start` forward everything after it to another tool and `exagent install -- --json` is npm's flag, not ours. The alternative — an argument on `logCmdError` and on every `.catch(logCmdError)` — is thirty call sites carrying one boolean that cannot change during a run.

One consequence for a command that prints its payload _before_ it can fail. `exagent dev --json` used to emit the plan object and then run the plan, so a failing run would have printed two objects — and, worse, the dev server it spawned inherited stdout and appended raw Metro log lines to the JSON [observed — friction run, 2026-08-23: `JSON.parse` failed at the byte after the closing brace]. In `--json` mode `dev` now captures the subprocess and prints exactly one object when the run ends: the plan (with the step results) on a clean exit, or the envelope. `dev --plan --json` is unchanged — there the plan _is_ the answer and nothing runs after it. The plan still reaches a driving agent before the first step either way, on the `cli:start_plan` event.

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
only setting a permissive parse may use — `arg` puts unrecognized _options_ into `_` there, so
rejecting them as positionals would reject the flags the resolver goes on to read. `dev` and `start`
declare `'own'` too: their arguments are forwarded to the Expo CLI, which reports its own.

Note that this is a _silent_ no-op, which llp/0006 §Errors are prompts treats as the one answer a
driving agent cannot recover from — it is indistinguishable from the command having understood.

## `build:explain`: the rule table is capped and in-repo

Decision [confirmed — Kudo, 2026-08-23]. The failure-signature rules that `build:explain` matches build logs against ship **in the repository, as a bounded table** — a capped set of Expo-specific signatures with a test each, reviewed like code and versioned with the CLI.

Shipped [observed — 2026-08-24, `src/builds/explain/anchors.ts`]: 34 rules, a cap of 40 spelled as `MAX_SIGNATURES` with a unit test on it, and a fixture with an expectation for every rule that has one. [[0012-build-explain]] is the design, and it records which of the fixtures are logs captured on a real machine and which were written from a documented format.

This does not reopen [[0001-agentic-cli-on-expo-cli]] §Scoped out, which rules out **the build-failure signature DB**: a hosted, growing, community-fed corpus with its own service, submission path and moderation. What is in scope is the opposite of that in every dimension that made it a scope-out — no service, no ingestion, no unbounded growth, no data to moderate. Rationale [inferred]: the value of the feature is concentrated in a small number of failures Expo itself causes and can name precisely (a missing pod, a mismatched SDK, an unsupported New Architecture module); a table that stays small stays accurate, and the cap is what keeps a maintainer from answering every field report by appending a rule instead of fixing the cause.

## Suggestions are pasted, so they have to be runnable

Decision [confirmed — Kudo, 2026-08-25]. Every suggestion is **written** `npx exagent …` and
**printed** in the spelling of the runner the caller actually used.

The finding [observed — dogfood, 2026-08-24]. The project's own `AGENTS.md` says "Use `bunx` instead
of `npx` if the project uses bun", and every line this CLI printed said `npx`. `npx` still works
there, so this is a courtesy rather than a correctness fix — but a suggestion whose whole value is
that it can be pasted should not need translating first.

**Render-time substitution, not a second set of literals.** `src/utils/invoker.ts` decides once per
process and rewrites the line as it goes out — `formatFollowUps` for the `Suggested next:` block,
`logCmdError` for the error prose, its `Try:` line and the needs-human block. No builder learns
about it, and the alternative (editing every literal, or threading a runner through every builder)
would have to be redone for the next runner.

**Detection, and what is not a signal** [observed — live against bun 1.3.14 and npm 11.17.0,
2026-08-25]. `process.versions.bun` is conclusive and usually absent: `bunx` honours a
`#!/usr/bin/env node` shebang, so this package's own bin runs on **Node** under `bunx`. What
actually fires is `npm_config_user_agent`, which is `bun/1.3.14 npm/? node/…` under both `bunx` and
`bun run` and `npm/11.17.0 node/…` under `npx`; `npm_execpath` points at the Bun binary in the same
cases and is kept as a fallback. `BUN_INSTALL` is deliberately **not** consulted: it says Bun is
installed, not that it started this process, and a Mac with `~/.bun` running `npx exagent` would be
handed a line for a runner it is not in.

**Scoped to this CLI's own name.** `npx eas-cli` is a *different package name* under Bun — projects
run it as `bunx eas-cli` — and `npx expo` may be too, so a blanket `npx` → `bunx` swap would produce
lines that do not run. Only `npx exagent` is rewritten.

**The machine channels keep the written form.** The `--json` payloads and the `cli:followups` and
`cli:error` events carry `npx exagent`, whatever shell the terminal is. That contract does not move
with the caller's runner, and `npx exagent` runs in a Bun project exactly as it does anywhere else.

### The runner this CLI *spawns* with is a different question

[confirmed — Kudo, 2026-08-26, from a field report: `bunx exagent whoami` spawned `npm exec eas-cli`.]

The scoping rule above is about **text a person reads**, and it is right: a suggestion naming
another package is a line that may not run under Bun, so only this CLI's own name is rewritten. It
was silently doing a second job it was never meant to do, though — nothing rewrote the runner this
CLI *spawns* published packages with, and that was the literal `npx` in five places. So a caller who
reached `exagent` through Bun was handed npm's exec for every package the CLI fetches: a different
runner, a different cache, and a slower first run, from a CLI they had reached through Bun.

`src/utils/packageRunner.ts` is the second answer, and the split is the design: **a suggestion is
text and a spawn is a binary.** Text is rewritten conservatively, because a wrong line wastes a
person's paste. A spawn resolves outright, because the runner is not a package name — `bunx <pkg>`
and `npx <pkg>` fetch and run the same published package, and the only thing that differs is which
tool does the fetching. Verified rather than assumed: `bunx eas-cli@latest whoami` answers
`kudochien` and `bunx expo-doctor@latest --version` answers `1.20.3` [observed — live, 2026-08-26,
bun 1.3.14], and `bunx` resolves a local `node_modules/.bin` entry before it downloads, exactly as
`npx` does.

Detection is shared with the suggestion path and needed no change — the same
`npm_config_user_agent` / `npm_execpath` pair, re-confirmed live against `bunx`, `bun run` and
`npx` on 2026-08-26. Worth restating why in-process detection is not enough: under `bunx`, a bin
with a `#!/usr/bin/env node` shebang runs on **Node**, so `process.versions.bun` is unset and
`process.execPath` is a Node. The environment is the only witness.

Two conditions gate the swap, not one. Bun has to have started the process, **and** `bunx` has to
be findable on `PATH` — "bun started this" is not the claim "bun is reachable from here", and
spawning a name that is not there fails where `npx` would have worked. `npx` stays the default and
stays a bare name, so a machine that never mentioned Bun is unchanged.

Five call sites use it: the `eas-cli` rung of the auth fallback (llp/0006 §Auth rule),
`expo-doctor`, `create-launch`, `create-expo`, and the `npx expo` fallback for a project with no
`expo` installed. **The `eas simulator:exec npx <agent-device>` invocations are deliberately
exempt** [observed — `src/device/cloudSimulator.ts`]: that `npx` is a token in an argv the *EAS
service* executes on a machine in a datacenter, not on the caller's, and rewriting it would name a
runner that machine may not have. The rule that separates them is whether this process is the one
doing the spawning.

The resolved runner is named where the CLI already names binaries — the `cli:auth_passthrough`
event and the fallback notice now read `bunx eas-cli@latest`. By *name* rather than by the absolute
path it resolved to, because the path says nothing the name does not and the name is what a reader
would type. The `source` field of that event moved with it: `npx-eas` became `runner-eas`, since
which runner fetches the package is the caller's choice and naming npm in the contract was wrong
under Bun.

## Upstream asks

Gaps found while building the tool layer. Per the process boundary of [[0001-agentic-cli-on-expo-cli]] constraint 5, these become upstream improvements rather than imports — but they are **recorded here, not yet filed**, and each is worked around in the meantime.

`eas-cli` — **swept against the published 22.4.0 on 2026-08-26; all five still stand** [observed — `eas <cmd> --help`, and the full command list from `eas --help`]:

- `build:logs` — read a build's logs from the CLI. Today the logs are reachable through the web dashboard, so a headless agent explaining a failed build has nothing to read. Still absent: `build` has `version`, `cancel`, `configure`, `delete`, `dev`, `download`, `inspect`, `list`, `resign`, `run`, `view`, and no `logs`. `build:view --json` does hand back a `logFiles` array of signed GCS URLs [observed — `src/__fixtures__/eas/build-view.json`], which is a fetch away from the same thing and is not the same thing.
- `credentials:list --json --non-interactive` — see what credentials a project has without a TTY. Still absent: `eas credentials` has exactly one subcommand, `credentials:configure-build`, and the rest of it is the interactive menu.
- `--non-interactive` on `build:view` and `submit:view` — both are read-only and both can still prompt. Still absent: both take `--json` and nothing else.
- Typed non-interactive errors — a machine-readable code when a command cannot proceed without a prompt, so the tool layer can distinguish "needs a human" (exit `7` above) from "failed". This is the ask that would retire the signature table of the needs-human protocol: today the wording of 100-plus prompt sites is what the classifier reads, and it is version-coupled to a CLI that never promised it. Still prose, and here is a fresh instance of it: `eas config --json` — whose own help says `--json` "implies `--non-interactive`" — prompts for a build profile when none is given, and fails with `Input is required, but stdin is not readable. Failed to display prompt: Select build profile` [observed — 2026-08-26]. A flag documented to remove the prompts does not remove them, and what a wrapper gets back is a sentence.
- `env:list --json` — the environment a build will run with, as data. Still absent: `env:list` takes `--format long|short` and has no `--json` at all, which makes it the last read-only command in this family with no machine channel.

`@expo/cli`:

- Do not let `expo start --ios` take the dev server down with it. `ensureSimulatorAppRunningAsync`
  runs `osascript … tell app "System Events"`, which fails on a Mac with no usable GUI session, and
  the rejection travels unhandled through `openPlatformsAsync` and ends the process [observed —
  live, 2026-08-23, in both CI and non-CI mode; the app *was* opened first]. Opening a window is a
  convenience and should not be able to fail a start, the way the eager Xcode warm-up already
  swallows its own error [observed — `startAsync.ts`]. Worked around by not relying on `--ios`:
  llp/0004 §A plan step's `reason` records why the follow-ups name `exagent navigate /` instead.
- Separate "nobody can answer a prompt" from "do not watch files". `CI` means both today
  [observed — `isWatchEnabled()` returns `!env.CI`], so a wrapper that wants the first has to give
  up the second, and a wrapper that wants the second has to accept the first. Either an
  `EXPO_NO_WATCH`-style variable of its own, or letting the existing `--non-interactive` spelling
  cover the prompt half, would retire §The dev server is the exception, and `CI` is why.
- Emit `cli:error` JSONL for every command error, with a `needsInput` flag — the event contract of llp/0006 §Output contract, extended so a wrapper can see that a prompt is what stopped the command.
- Put the Metro error class on the web dev server's static error page. `parseWebBuildErrors` knows
  it — it branches on `error.type === 'TransformError'` and on `UnableToResolveError`'s own fields —
  and then drops it, so the record the page carries has `type: 'error'`, which `LogBoxLog` filled in
  [observed — `@expo/log-box-utils/src/utils/parseWebBuildErrors.ts`, `log-box/LogBoxLog.ts`].
  Carrying the class through would retire §One error, one shape, whichever document answered.
  Reporting the file the way the native bundler reports it — relative to the project root, rather
  than `${projectRoot}/${error.filename}` — would retire the other half.
- `expo cache:clear` — one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at.
- `expo-doctor --json` — the doctor report as data, so its checks can drive a decision instead of a regex over prose.
- Emit `devserver:url` in a **released** SDK. The event already exists on `main` with exactly the
  right fields — `url`, `runtimeUrl`, `hostType`, `port` [observed — `BundlerDevServer.startAsync`,
  2026-08-25] — and expo 57.0.17 does not emit it [observed — live: `start.log` carries
  `metro:instantiate` and `devserver:start` and nothing else]. Until then the only way to learn a
  tunnel host is to parse `Waiting on <url>` out of captured stdout (llp/0005 §Where a device
  reaches the dev server), which works and is prose.

## Testing

Unit tests pin the constants and all three resolution rules, including a synthetic group registered under a forwarded name for rule (b) [observed — `src/__tests__/exitCodes-test.ts`, `src/__tests__/commandRegistry-test.ts`]. E2E tests pin what the process boundary actually shows: the exit code and the last line of output for a group given options with no action [observed — `e2e/__tests__/wrapper-test.ts`, `e2e/__tests__/build-wait-test.ts`]. Per [[0002-testing-and-evals]], every layer runs with no TTY attached.

The outcome band gets its own discipline, because a code is not testable by reading it. `build:wait`'s status table is exhaustive at the unit level — every status in both casings and both separators, plus values it has never heard of — and each of the four exit codes gets a separate e2e test against a stub `eas` bin walking a scripted status sequence [observed — `src/builds/__tests__/status-test.ts`, `e2e/__tests__/build-wait-test.ts`]. One test asserting "some non-zero code" would pass while the distinction the band exists for was broken.

The `--json` error envelope is tested at both tiers as well [observed — 2026-08-23]. Unit: `argvRequestsJson` against a table including the `--` separator case, and `logCmdError` asserting that nothing reaches stdout without the flag, that the key set is complete with the flag, and that a needs-human failure carries the whole record. E2E, through the published bin: a failing `--json` run whose stdout is fed to `JSON.parse`, so the property the envelope exists for is checked as the property and not as a substring.

The needs-human protocol is tested the same way, at both tiers [observed — 2026-08-23]. Unit: the classifier against a table of recorded output, one sample per signature that exists plus the cases that must answer `null`; the registry invariants (unique ids and codes, `SCREAMING_SNAKE` codes, a command or a URL for every row that is not a generic fallback, the fallbacks last); `logCmdError` with a `NeedsHumanError`, asserting the event pair, the three printed lines and exit `7`; the preflight answering from one subprocess however often it is asked; the hang guard on fake timers, including the two cases it must _not_ fire in. E2E, through the published bin with stdin closed: a stub `eas` printing the real `SessionManager` auth line, a stub `expo` printing the real non-interactive line, and a stub that prints a question and then waits forever — each asserting the exit code, the printed block and the `cli:needs_human` event in `LOG_EVENTS` [observed — `e2e/__tests__/deploy-test.ts`].
