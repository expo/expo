# 0021: Honest Reports — What a Command May Claim, and About What

**Type:** RFC
**Status:** Draft — implemented
**Systems:** `src/dev/stopAsync.ts`, `src/dev/portListener.ts`; `src/dev/detachAsync.ts`, `src/dev/childVerdict.ts`, `src/dev/advertisedUrl.ts`; `src/dev/forwardedArgs.ts`; `src/status/statusAsync.ts`, `src/status/sections.ts`, `src/status/format.ts`, `src/status/assert.ts`, `src/status/types.ts`, `src/impact/buildCache.ts`; `src/needsHuman/preflight.ts`; `src/deploy/deployAsync.ts`, `src/deploy/easFailure.ts`; `src/typecheck/generatedTypes.ts`; `src/passthrough/auth.ts`; `src/followups/doctor.ts`, `src/followups/typecheck.ts`, `src/followups/status.ts`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27
**Related:** [[0004-smart-start-and-project-state]], [[0005-runtime-loop-tools]], [[0008-guardrails]], [[0010-agent-conventions]], [[0011-impact-and-freshness]], [[0015-backend-selection-and-config]], [[0016-v1-scope]]

## Summary

Friction run 7, the first live-staging run and Kudo's own cloud loop found thirteen failures of one
kind. In every one of
them the CLI **had** the right answer and reported a different one: the detached child wrote its own
needs-human verdict into a log while the parent printed `Bundler ready` and exit 0; `dev:stop --port
8195` read a lock for port 8190 and killed that; one EAS build's fingerprint comparison was copied
onto both platforms and said an iOS build could run android code; `status` reported `auth unknown
(nothing could answer)` in a directory where `exagent whoami` printed the name.

None of them is a missing feature. Each is a **claim made about the wrong subject**, or at the wrong
time, or from the wrong evidence — and the cloud loop added the two most expensive versions of it:
`freshness ios: stale (no recorded build)` about a project whose fingerprint matched a finished EAS
build, and a dev server line quoting a URL nothing can open. This LLP records the rules that came out
of fixing them, because the same mistake is available to every command in the surface.

## The rules

1. **A flag that names a target is the target.** Not a hint, not a fallback — the thing the command
   acts on.
2. **A claim is about the moment it is printed.** Readiness established two seconds ago is not
   readiness, and a report is written after the waits, not before them.
3. **One subject, one answer.** An answer about one platform, one build or one process is never
   copied onto its siblings; they get a stated non-answer instead.
4. **Read the tool's own sentence before guessing.** A guess is allowed only where nothing was
   recognised, and it must say that it is one.
5. **A note nobody reads is not a note.** A failure that reached `--json` and not the text report is
   a failure the caller did not see.
6. **A generated file is not a mistake in the code.** A gate red for a file no human wrote must say
   what generates it.
7. **Two questions get two answers.** "Is my app up to date" is a question per *backend*, and one
   axis answering for both is the same mistake as one platform answering for both.
8. **Advice is about the device the loop is on.** A cloud loop is not a local loop with a longer
   wire.
9. **A string this CLI prints is a string that works.** Relaying another tool's URL unchecked is
   relaying a URL nobody can open.

Every section below is one of these applied, with the finding that forced it.

## `--port` names the target

`dev:stop` is the one destructive verb in the v1 surface. It read the project's dev-server lock
first and the caller's `--port` second, so `dev:stop --port 8195` sent `SIGTERM` to the pid on
**8190**, left the listener on 8195 alone, and reported `Stopped yes · Dev server
http://127.0.0.1:8190 · via lock` — naming a port the caller had not asked about
[observed — friction run 7, F60, reproduced twice].

**The decision.** When `--port` is passed, the lock is consulted only to decide whether the listener
on *that* port is this CLI's. A lock for another port is reported in `detail` — so a caller who
mistyped a port learns where their own dev server actually is — and never signalled. `lockHeld` is
now "a lock answered **for the target**", which is false in that case.

The negative answer had the same shape of error. With a `python3 -m http.server` on 8195 the command
answered `nothing is listening on port 8195`, because `lsof` had named no process and a null lookup
was read as an empty port [F72]. Those are two different facts. `isPortInUseAsync` (a bind attempt on
the loopback interface, `src/dev/portListener.ts`) settles it without naming anyone: a port that
cannot be bound is in use, the reason becomes `no Expo dev server answered on port 8195; pid 63465
(python3) is listening and is not one`, and the outcome is the `foreign-dev-server` shape at exit 20
rather than `not-running` at exit 0.

## Readiness is a claim about now

`dev --detach --wait-ready` returned exit 0 and `Bundler ready` for a dev server that was dead or
had never started, twice in the friction run and twice again live [F61, S4]. The parent's facts were
all true when it collected them: the lock answered, `/status` answered, the tunnel wait ran. The
child then failed and exited, and nothing looked again.

**The decision.** `ready: true` is never printed without a live child process **and** a live
`/status` at the moment of return. `resolveDetachFailure` (exported, pure) takes the three facts and
produces one verdict:

| child exited | log holds a handoff | `/status` answers | verdict |
| --- | --- | --- | --- |
| — | yes | — | `needs-human` |
| yes | no | — | `child-exited` |
| no | no | no (and readiness was established) | `not-answering` |
| no | no | yes | success |

`statusAnswering` is `null` for a run that never asked for readiness, and a null is not a failure: a
bundler still working is not a broken one.

The tunnel wait now also ends when the child exits. A tunnel cannot arrive from a process that is
gone, and that wait is where the live reproduction died — twenty seconds of waiting followed by a
success report.

**What this does not fix.** A child that dies *after* the parent has returned cannot be caught by
the parent. The `--ios` reproduction of F61 is that case: `expo start --ios` published the lock,
answered `/status`, and only then was refused permission to control Simulator.app, eight seconds
after the parent had exited. `dev:logs` reads that verdict correctly, and `navigate` fails honestly
afterwards; catching it at the source would need a signal for "the app opened" that the CLI family
does not emit. Recorded here rather than left as a surprise.

### A detached child's own verdict

The verdict the child computes is a **rendering of this CLI's own error**, so the parent reads it
back rather than re-deriving it: `Log.exception` prints `Error.toString()`, `logCmdError` prints
`formatNeedsHumanBlock`'s three rows under it, and `parseDetachedChildVerdict`
(`src/dev/childVerdict.ts`) recovers the scenario id and the message from those. The round trip is
pinned by a test that builds the log out of the two functions that write it — the same discipline
`formatPortMove`/`parsePortMove` are held to.

A recovered handoff is raised as a `NeedsHumanError` with the registry's own row, so the caller gets
exit 7 and the full machine-readable handoff. Its `detectedBy` is a new value,
**`detached-child-log`**: the stop was not observed by this process, it was relayed, and a reader of
a handoff deserves to know which. Everything else is exit 20 with the log tail fenced.

### The tunnel host the log never held

`tunnelUrl` was null while the tunnel was up [S3]. The scrape looks for `Waiting on <url>`, and a
detached run's log did not contain it. The dev server still knew: it builds its manifest's
`launchAsset.url` from `getDevServerUrl()`, which is the tunnel origin whenever a tunnel is running.
`fetchAdvertisedUrlAsync` asks it, one request, and `resolveDevServerReachAsync` falls back to it
whenever the log named nothing — which fixes `navigate --print-url` and `status` at the same time.

**Wave 19 widened that fallback by one condition**, and a live run is why. A dev server serving a
**public origin** through a proxy prints `Waiting on http://localhost:<port>` and advertises the
public origin in its manifest [observed — 2026-08-27, `EXPO_PACKAGER_PROXY_URL` against a public
host, while validating the cloud reload]. The log named *something*, so the manifest was never asked,
and `hostType: localhost` refused a cloud open the session could have served. So the manifest also
wins over a log line that names **this machine** — and only then: it replaces the log's reading only
when the manifest names a tunnel, because swapping a LAN address for `localhost` would hand back a
URL a phone cannot use. The log stays first for a host a device can already reach: it is the dev
server's own announcement, and it costs nothing.

### The premise that could not be tested

`runtime:reload --cloud`'s broadcast was `[inferred]`, and the inference was written into the code as
prose: "the dev-server broadcast reaches a cloud session already — a cloud session has to reach that
dev server through a tunnel to be running the bundle at all". Staging could not close it (S12) and
kept it marked. **It is now resolved by observation, and it was false**: the tunnel carries the
bundle over HTTP and the app holds no client on the dev server's command socket through it, so the
broadcast reached nobody and the fallback stranded the app
[observed — 2026-08-27, live; llp/0005 §Reloading a cloud session].

Two rules for the corpus come out of it, both of them about *this* kind of claim — a sentence that
explains why something must work, in a place no test can reach:

- **A premise that justifies skipping a check is a claim, and it carries a tag.** The sentence read
  like a derivation and was never labelled `[inferred]`, so nothing in the review or the friction
  runs treated it as something to test.
- **Report what was observed, not what follows from it.** The replacement path reports the two lists
  separately and names its proof (`verifiedBy: dev-server-bundle`), so the next reader can see which
  fact is an observation and which is the mechanism that ran.

## The plan has to carry the forwarded flags

`dev --plan --json --tunnel` printed `argv: ["expo","start","--go"]` while the run executed
`expo start --go --port 8190 --tunnel` [F71, S5]. The options a caller typed for `expo start` were
folded in *while the step ran*, which is after the plan was printed, the event was emitted and the
confirmation was answered. [[0015-backend-selection-and-config]] §The plan approved is the plan run
forbids exactly this.

**The decision.** `withForwardedExpoArgs` folds them onto the plan's own steps before anything is
printed, so the plan object, the `cli:start_plan` event, the table and the subprocess all read one
argv. `resolveStepArgs` still runs at execution time and is idempotent — a flag the argv already
holds is never added twice. `--tunnel`, `--lan` and `--localhost` are listed in `dev --help`'s
options block as well as in its forwarded-flags paragraph, because the block is where a reader looks.

## One build is one platform

`status --explain --build <id>` ran one `eas fingerprint:compare --build-id`, which takes no
platform, and wrote its verdict onto **every** platform — so an iOS development-simulator build was
reported as able to run android code [S1, `statusAsync.ts:448-450`].

**The decision.** The build's platform is asked of EAS (`eas build:view <id> --json
--non-interactive`), or taken from `--platform` when the caller named one — a stated fact is never
overruled by a lookup. Only that platform's headline is replaced. The others get
`class: null` with `reason: "not compared — EAS build <id> is an ios build, and one build is one
platform"`, which is the same "nothing was established" the rest of the report uses and which
`--assert` already answers with exit 22 rather than a guess.

When the platform cannot be established the comparison is attributed to **no** platform, and every
platform says so. A comparison whose subject is unknown is not an answer about either of them.

**Provenance.** `buildViewArgs` is `[inferred]` — `build:view` is eas-cli's command for one build and
`--json` implies `--non-interactive` on its siblings, but this argv has **not** been run against the
published binary ([[0002-testing-and-evals]] §A flag is not shipped until it has run against the
published binary). Every caller treats a failure as "not established", so a spelling this CLI got
wrong costs the attribution and never the report. It needs one live run to become `[observed]`.

## A note nobody reads is not a note

`status --explain --build abc123` against a broken `eas` printed an ordinary report and exit 0, with
the string `abc123` nowhere on it, while `--json` carried the whole reason the comparison never
happened [F66]. Two causes: `freshness.comparison` was written *after* the call, so a failure left
`buildId: null` behind; and the text renderer only shows `errors.<section>` for a section that is
**null**, and this section had plenty else to say.

**The decision.** The comparison target is recorded before the call, so a failed `--build` still
echoes what was asked. And a section that printed a line and still failed gets a `<section> note`
line, **in full and never summarized** — the actionable half of one of these sentences is usually
its last clause, which is exactly what a width cut removes [S9]. The same rule applies to the
per-platform `reason` of the `eas build` line: too long for the line means printed under it.

`status` still exits 0. It is a report, and reporting what it could not read is its contract
([[0004-smart-start-and-project-state]] §Contract); `--assert` is the flag that turns it into a gate.

## Two CLIs read one session file

`status` reported `auth unknown (nothing could answer)` in a directory where `exagent whoami`
printed `kudochien` [F65]. The preflight asked only the `eas` binary, which on that machine was a
shim that panicked.

**The decision.** The preflight asks the EAS CLI first and, when that produced no answer, the
project's own `expo whoami` — the rung `exagent whoami` itself uses. Both CLIs read the same
`state.json`, so it is the same question asked of the CLI the project actually installed. The
`source` field says which answered, and the union gains `expo whoami`.

**The project's `node_modules/.bin/expo` only.** `resolveExpoCli` would fall back to a package
runner, which downloads an SDK to read one JSON file; `status` promises to be instant. The cost of
the fix is therefore one subprocess on a machine that has no EAS CLI — which previously spent none
and reported nothing.

### Name the session file this run will read

The `whoami` preamble hardcoded `~/.expo/state.json` [S6]. Under `EXPO_STAGING=1` the whole family
reads `~/.expo-staging/state.json`, so the notice named a file the run never touched.
`sessionFilePath()` applies the family's own three rules — `__UNSAFE_EXPO_HOME_DIRECTORY`, then
`EXPO_STAGING`, then `EXPO_LOCAL` — and the notice prints the answer.

### `whoami --json`, and what a forwarded command still owes

`whoami` is deliberately a **forwarded** command ([[0010-agent-conventions]] §Registry rules): its
options go to the CLI that answers, and an option this CLI does not know is that CLI's to report.
That stays. But `--json` is *this* CLI's contract and neither CLI has such a flag, so it was ignored
and an agent that asked for one object got a line of prose at exit 0 [S7].

**The decision.** `whoami --json` is answered here — captured rather than inherited, `--json`
stripped from what is forwarded — as one object with `loggedIn`, `user`, `source`, `sessionFile` and
`cli`. The exit code stays the answering CLI's, so the two forms of the command agree. The forwarding
of every other option is documented in the help rather than changed: the four auth commands are
`expo`/`eas` commands, and a wrapper that started rejecting their flags would be a wrapper that has
to track them.

## Read the tool's own sentence before guessing

`deploy --web` against an unlinked project said *"the upload ran non-interactively, so anything that
needs an answer — most often an account that is not signed in — fails instead of prompting"* to
somebody who was signed in. The real cause was in the raw output: `EAS project not configured`, and
the `eas init` that fixes it [S2, F67]. The diagnosis came from the *exit signature* alone.

**The decision.** `classifyEasDeployFailure` (`src/deploy/easFailure.ts`) matches the two stable
sentences observed live — the unlinked project and the signed-out machine — and supplies the `Why:`,
the `How:` and the command. Nothing recognised keeps the old sentence and **says that it is a
guess**. It is not a needs-human classification: that is `src/needsHuman/` and it is still asked
separately, because an unlinked project and a signed-out machine are both diagnosable and only one
of them needs a person.

## Route around a binary that is not the CLI

The same run printed the shim's Rust backtrace verbatim, ahead of anything this CLI said, and ended
with `Try: <the broken binary> whoami` — a recovery that reproduces the panic [F67].

**Three decisions.**

1. **Fall back.** A run that never was the EAS CLI uploaded nothing, so retrying it through
   `<runner> eas-cli@latest` is safe, and it is the only rung left. `deploy` now does what
   `passthrough/auth.ts` already did. The note on stderr names the file that failed and the runner
   that is being tried instead.
2. **Never suggest the broken binary.** A `Try:` line names the fix the CLI's own words asked for,
   or — after a wrapper crash — the real CLI through the runner.
3. **Fence a tool's stream.** [[0008-guardrails]] §Untrusted-content marking applies to a tool's
   bytes as much as to an app's. The captured tail is wrapped, and the *streamed* output is bracketed
   by the markers with a per-line filter that neutralizes forged ones.

## A generated file is not a mistake in the code

A brand-new `exagent new` project fails `exagent typecheck` [F64]: `tsconfig.json` includes
`expo-env.d.ts`, that file does not exist until something generates it, and the two diagnostics that
follow are about CSS-module imports whose types live in the `expo/types` reference it carries. The
follow-up said *"Fix the diagnostics above"* — advice for a problem the caller cannot fix by editing
either file named.

**The decision, and why it is the second-best one.** The preference was for `typecheck` to *perform*
the typegen through a subprocess. There is no such subprocess: `expo-env.d.ts` is written by
`startTypescriptTypeGenerationAsync` when Metro instantiates, and the command table of
`@expo/cli/src/index.ts` has no typegen verb [observed — SDK 57]. Writing the file here instead
would be this CLI keeping a copy of another package's template, which [[0001-agentic-cli-on-expo-cli]] §Constraints exists
to prevent. So the case is **recognised** and reported as what it is: the report names the file, what
generates it, and `npx exagent dev --detach --wait-ready`, and that command *replaces* the "fix the
diagnostics" rung. The note is printed above the diagnostics, because it changes what they mean.

Detection is two cheap facts: `tsconfig.json` mentions the file, and the file is absent. The mention
is looked for in the text rather than in a parse, because a `tsconfig` may hold comments — and being
wrong can only cost the note, never produce a false one.

**Upstream ask:** a standalone `expo` command that runs the typegen ([[0010-agent-conventions]]
§Upstream asks).

## The next action is this CLI's

`doctor`'s follow-up was `npx expo install --check`, quoted out of expo-doctor's advice [F78]. The
advice is written for a person; the reader of a `Suggested next:` line is usually an agent driving
this CLI, and `exagent install --check` runs the same check and adds the structured `check` object
the rest of the surface expects. The advice itself is still quoted verbatim above — those are
expo-doctor's words — and only the offered command is rewritten. The mapping is a table of two rows
(`--check`, `--fix`), because a rewrite is a claim that two commands do the same thing and that is
the only pair where it has been verified.

## Freshness has two axes

`status` in Kudo's cloud loop reported `freshness ios: stale (no recorded build)` for a project whose
fingerprint matched a **finished development-simulator EAS build**, `device none`, and a `next` line
naming `smoke` and `navigate /` — three answers about a machine that was not where the app was
running [observed — 2026-08-27, K7].

The freshness half is one axis answering for two. "Does this need a native build" has two sources —
what this machine built, and what EAS has — and the section only ever read the first.

**The decision** [design direction — Kudo, 2026-08-27: *"maybe we should split local and eas for the
freshness. local/eas x ios/android = 2 x 2 = 4 combos"*]: `freshness.platforms` carries one entry per
**backend × platform**, four in the ordinary case, each with its own `state`, `detail` and — on the
`eas` axis — the `buildId` and `buildProfile` that answered. The text report prints one line per
platform and one entry per backend:

```
freshness   ios      local stale (no recorded build) · eas fresh (simulator build 21d7d434 matches this fingerprint)
            android  local stale (no recorded build) · eas unknown (EAS was not asked — pass --explain)
```

Three rules keep the four honest:

- **The `eas` axis costs nothing extra.** It is folded in from the lookup `readEasBuildsStatusAsync`
  already performs, whose key *is* the working tree's per-platform fingerprint — so a `found` is the
  definition of fresh here, and there is no second network call and no second source of truth.
- **`unknown`, not `stale`, before anything asks.** A default run does not pay for the lookup. Saying
  so is cheaper and truer than either verdict, and it is the exact confusion the finding is about.
- **`--build <id>` replaces the `eas` axis of the platform it names**, and leaves `local` alone. This
  is where §One build is one platform lands: the comparison the caller asked for is an answer about
  EAS, and the local record was never what they asked about. `--assert` follows the same rule — under
  `--build` it gates on the `eas` axis only.

**Who reads which.** The *effective* answer — the freshest axis — is what a consumer branching on
"does this need a build" wants, and that is what `effectivePlatformFreshness` returns and what the
`cli:status` event carries. One consumer deliberately does **not** use it: the download follow-up
exists exactly for `local stale` + `eas found`, and reading the effective answer there would hide the
rung in the one state it is for.

## Advice for the device the loop is actually on

The other half of K7. Every rung of `next` drives a local simulator or an attached device, and the
section chose between them from the local device probe alone — so a run whose app was on an EAS
Simulator over a tunnel was told `exagent smoke` (looks for a simulator here) and `exagent navigate /`
(opens one here).

**The decision.** A cloud session on record plus a local device that is not `present` is a **cloud
loop**, and every rung takes `--cloud`: `smoke --cloud` when an app is connected, `navigate / --cloud`
when none is. `!== 'present'` rather than `=== 'absent'` on purpose: with a session on record, a
device probe that could not run is not a reason to name the local path — the caller has *told* this
project where its device is, and that outranks a missing `simctl`. Without a session, an unanswered
probe keeps the local rung exactly as before: nothing has shown there is no device here.

## The scheme in "Waiting on" is not the dev server's

K8, and it is an upstream bug with an exagent-side consequence.

**What Kudo saw.** Metro's stdout on a tunnelled run printed
`Waiting on exp+dailywords-grok://<host>.on.staging.expo.app` — a URL that opens the dev-client
*launcher* rather than the app, so an agent copying stdout fails. Locally, in a terminal, the same
command printed the correct URLs and no `Waiting on` line at all.

**Reproduced, deterministically, against this monorepo's own `UrlCreator`** [observed —
2026-08-27]:

```
constructUrl()          = exp+dailywords-grok://x8fj2.on.staging.expo.app
constructUrl({http})    = http://x8fj2.on.staging.expo.app
constructDevClientUrl() = exp+dailywords-grok://expo-development-client/?url=https%3A%2F%2Fx8fj2.on.staging.expo.app
```

The chain, in four steps:

1. `resolveOptions.ts` resolves `location.scheme` to the app's **deep-link** scheme whenever the
   project has `expo-dev-client` (or `--scheme` was passed), and that becomes `UrlCreator.defaults.scheme`.
2. `BundlerDevServer.getDevServerUrl()` returns `this.getUrlCreator().constructUrl()` — **with no
   scheme option** — whenever an `AsyncWsTunnel` is active, i.e. under `EXPO_UNSTABLE_TUNNEL_V2=1` or
   in a webcontainer. The sibling branch returns `instance.location.url`, an `http://` URL, and
   `getJsInspectorBaseUrl` passes `{ scheme: 'http' }` explicitly.
3. `getUrlComponents` then uses `options.scheme ?? 'http'`, and `options` *is* the defaults, so the
   protocol is the app's scheme.
4. `startAsync` prints that string as `Waiting on <url>` — **only in non-interactive mode**. A
   terminal gets the Terminal UI instead and no such line, which is exactly why the local repro
   showed none.

**It is upstream, and it is one option wide**: `constructUrl({ scheme: 'http' })` in step 2 makes it
the URL every other branch produces. Filed in [[0010-agent-conventions]] §Upstream asks with this
repro. Everything that reads `getDevServerUrl()` under a v2 tunnel is affected, not only the printed
line — the MCP server's `devServerUrl` and the non-native `DevelopmentSession` URL take the same
string.

**What was ours.** `parseWaitingOn` read `URL.origin` of that line, and `origin` is the string
`"null"` for every non-special scheme — so `status`, `dev:logs` and `dev --detach` reported
`tunnelUrl: "null"`, a field carrying the word rather than a null. The host is the fact the line
carries, so the host is what is kept, and the origin is rebuilt: `http`/`https` when the line had
one, `https` for a tunnel host otherwise (a tunnel terminates TLS), `http` for a LAN one. A line with
no authority at all — `exp+app:///--/route`, a route link — names no dev server and answers null.

And since the address a device needs was the thing being got wrong, `status` now prints the one that
works next to the one the dev server listens on [K7(c)]:

```
dev server  running on http://127.0.0.1:8081 · tunnel https://x8fj2.on.staging.expo.app
            open in development build: exp+dailywords-grok://expo-development-client/?url=https%3A%2F%2Fx8fj2.on.staging.expo.app
```

`DevServerStatus.openUrls` carries the whole list (one per app, because a development build and Expo
Go take different URLs), the `cli:status` event carries the best one as `openUrl`, and both come from
`buildConnectUrls` — the same builder `navigate --print-url` uses, so no reader is ever given two
different strings for the same thing. Printed only for a dev server a device off this machine can
reach: on a local run the listen address is the whole answer.

## Testing

Every finding above has a test that fails against the code as it shipped:

- Unit: `resolveDetachFailure`'s table, `parseDetachedChildVerdict`'s round trip,
  `forwardedStepArgs`/`withForwardedExpoArgs`, `parseBuildPlatform`, `classifyEasDeployFailure`,
  `findMissingGeneratedTypesSync`, the two new `dev:stop` describes, the preflight's Expo rung, the
  `status` section note and the unclipped reason.
- Unit, wave 17's second half: the four freshness combos and the fold that fills the `eas` axis,
  `effectivePlatformFreshness`, the cloud rungs of `next` (including the unanswered device probe both
  ways), `applyOpenUrls`, and four `Waiting on` shapes — the app-scheme line, the `exp://` line, the
  route link, and the assertion that the word `null` never reaches a URL field.
- e2e, through the published bin: `dev:stop --port` against a real lock and a real signal recorder;
  a detached child that dies inside the tunnel wait, asserted at exit 7 with the relayed scenario;
  `dev --plan --tunnel`; `doctor` at exit 20; `typecheck` naming the generated file; `whoami --json`
  and the staging session file; `status --explain` reporting a stub EAS build as fresh on the `eas`
  axis while the `local` axis answers its own question; and `deploy` falling back through a stub
  `npx` — a stub, because a test that reached the registry would be testing the network.
- K8's upstream half is reproduced by a script rather than by a test: it is another package's
  behaviour, and a test in this package asserting it would fail on the day it is fixed. The chain is
  recorded above with the file and line of each step.
