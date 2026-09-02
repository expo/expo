// @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
// The third device backend: a simulator that runs on EAS rather than on this machine.
//
// `src/navigate/device.ts` resolves two backends, and both are a platform tool this machine has:
// `simctl` for a booted iOS simulator, `adb` for an attached Android device. A laptop with neither
// has no device at all — which is exactly the machine the dogfood session of 2026-08-24 was run
// from, driving Expo Go on a **cloud** simulator through a tunnel while every `navigate` it typed
// stopped at "no booted device was found". Wave 9 gave that machine the URL (`--print-url`). This
// gives it the act.
//
// **Every invocation in this file is gated here, and none of them has been run against a live
// session.** The `eas simulator:*` surface is experimental and hidden, this machine's account is
// signed out, and the `eas` on its PATH is a shim that exits before it reaches the CLI. So the argv
// is built by pure functions and pinned by unit tests: when somebody signs in, one test file says
// what this CLI believes the API is, and one module is where a correction goes.
//
// Source of the syntax: the **published packages**, read rather than guessed — `eas-cli@22.2.0`
// (`oclif.manifest.json` for every flag, `build/commands/simulator/*.js` for the exact JSON each
// command prints) and `agent-device@0.20.10` (`agent-device help <verb>`, which runs offline)
// [observed — 2026-08-26]. That is one rung short of a live run: a manifest says what the CLI
// accepts, not what the service answers. The table is in llp/0005 §Cloud simulator.
//
// One deviation from llp/0001 constraint 5 worth naming: the device verbs are **not** an `eas`
// subcommand. `eas simulator:exec` loads the session's connection environment and spawns the
// command it is given, and the verbs come from `agent-device`, a controller run on demand through
// `npx`. So the process this CLI starts is still `eas` — the family binary — and what it asks that
// binary to run is a second process the CLI never resolves itself. `AGENT_DEVICE_SPEC` is the whole
// of that decision, in one place.

import fs from 'fs';
import path from 'path';

import { classifySubprocessFailure } from '../needsHuman/detect';
import { needsHumanErrorFrom } from '../needsHuman/error';
import { PROGRAM_PREFIX } from '../programName';
import { easCliArgs, easCliLabel, resolveEasCli, type EasCli } from '../utils/easCli';
import { CommandError } from '../utils/errors';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import {
  checkBinaryCommand,
  looksLikeWrapperCrash,
  runnerCrashDetail,
} from '../utils/wrapperCrash';

/** Platforms an EAS Simulator session can run. The same two the local backends drive. */
export type CloudPlatform = 'ios' | 'android';

/**
 * The dotenv file `eas-cli` writes when a session starts, and reads when one is driven.
 *
 * Managed by the EAS CLI and not by this one: it holds the session id and the daemon's URL and
 * token, which is why nothing here ever writes it.
 *
 * It is **not** the gate any more (llp/0005 §Cloud simulator). The file outlives the session it
 * names, and a session started by MCP or by another terminal need never touch it. So its presence
 * proves nothing about what is running — what it is genuinely true about is *which* session this
 * project last started, and that makes it a **preference** when the service reports more than one.
 *
 * A live run made that case stronger and one of its facts wrong [observed — 2026-08-26, staging,
 * `eas-cli` 22.5.0, `eas simulator --platform android --build-id … --type agent-device --json`].
 * The claim used to be that a `--json` start does not write the file at all [read from
 * `eas-cli@22.2.0` `build/simulator/env.js`]. It **does** write it — and writes it **empty**: three
 * comment lines saying not to commit or edit it, and no session id, no daemon URL, no token. So the
 * file can be present, freshly written, and still name nothing, which is a worse failure than an
 * absent file for anything that treats presence as evidence. Reading the service is the only sound
 * way to find a session, which is what this module does.
 *
 * One consequence for advice rather than for code: `eas simulator:stop` with no `--id` defaults to
 * this file, so after a `--json` start it has nothing to read and the session must be stopped with
 * `--id <session-id>` explicitly.
 */
export const CLOUD_SESSION_ENV_FILE = '.env.eas-simulator';

/** The variable inside that file which names the session. */
export const CLOUD_SESSION_ID_VAR = 'EAS_SIMULATOR_SESSION_ID';

/**
 * The controller package `simulator:exec` is asked to run, pinned in one place.
 *
 * `@latest` rather than a version, because `simulator:*` is experimental and the controller moves
 * with it; a pin here would be a version this CLI has never tested either.
 */
export const AGENT_DEVICE_SPEC = 'agent-device@latest';

/**
 * The session status the EAS CLI reports for a session that is up.
 *
 * The raw GraphQL enum rather than the lower-case flag spelling: `simulator:list --json` prints
 * `status` and `platform` verbatim from the API (`NEW | IN_PROGRESS | STOPPED | ERRORED`,
 * `IOS | ANDROID`) while printing `type` in its flag spelling [observed — `eas-cli@22.2.0`
 * `build/commands/simulator/list.js` and `build/graphql/generated.js`].
 */
export const ACTIVE_SESSION_STATUS = 'IN_PROGRESS';

/**
 * The only session type this CLI can drive.
 *
 * The bridge to a device verb is `simulator:exec npx agent-device`, and only an `agent-device`
 * session has that daemon inside it — an `argent`, `appium` or `serve-sim` session answers a
 * different client or none at all. So a session of another type is not a device, and saying "no
 * session" for one would send a reader to start a second one next to it.
 */
export const DRIVABLE_SESSION_TYPE = 'agent-device';

/**
 * How many live sessions one listing asks for.
 *
 * `simulator:list` defaults to 10 and caps at 100 [observed — `build/commands/simulator/list.js`].
 * The listing is already filtered to the running ones, and a project with more than this many at
 * once is a billing problem rather than a selection problem — so one page, no pagination, and a
 * number with room above what anybody runs.
 */
export const CLOUD_SESSION_LIST_LIMIT = 25;

/** Where an account without EAS Simulator asks for it, when the service names one. [observed] */
export const CLOUD_SIMULATOR_WAITLIST_URL = 'https://expo.dev/services/simulators';

/**
 * The command that starts a session this CLI can actually drive, in one place.
 *
 * `--expo-go` is the part that was missing, and its absence made every piece of advice in this
 * package a dead end for an Expo Go project: a session started without it comes up with **no app on
 * it**. `apps --platform ios` on such a session listed only the controller's own test runner, and
 * every `open` of an `exp://` URL failed with `LSApplicationWorkspaceErrorDomain error 115` — the
 * simulator has nothing registered for the scheme [observed — live, 2026-08-27, session
 * `01a04375-…`]. The same start with `--expo-go` listed `Expo Go (host.exp.Exponent)` and loaded the
 * project [observed — live, session `01a04378-…`].
 *
 * `eas simulator` rather than `eas simulator:start`: that is the command name in the CLI's own
 * manifest, and it is the one carrying `--expo-go` [observed — `eas-cli@22.6.0`
 * `oclif.manifest.json`, and run live]. A project with a development build of its own passes
 * `--build-id <id>` instead, which is the other observed way to have an app on the session.
 */
export const CLOUD_SESSION_START_COMMAND =
  'npx eas simulator --platform ios --type agent-device --expo-go --non-interactive --name "expo-agent-cli"';

// ---- The argv, as pure functions -------------------------------------------------------------
//
// Pure and exported for the same reason `buildOpenUrlCommand` and `buildScreenshotCommand` are: the
// argv is the whole of what this module decides, and a wrong one fails only on a machine that has
// an account, a session, and a bill. Here the stakes are higher than for `simctl`, because nothing
// in this package has ever seen the right answer.

/**
 * `eas simulator:list`, which answers what this project has running right now.
 *
 * The whole of session discovery, and the reason the dotenv is no longer the gate: this asks the
 * service rather than the filesystem, so a session started by MCP, by another terminal, or by a
 * `simulator:start --json` that wrote no dotenv is still found (llp/0005 §Cloud simulator).
 *
 * `--status in-progress` server-side, because a stopped session is never an answer and there is no
 * reason to carry one across a process boundary. The **type** filter is deliberately *not* sent:
 * the flag exists, but a project whose only live session is a `serve-sim` deserves to be told that
 * rather than told there is nothing — so every live session comes back and the filtering that
 * decides drivability happens here, where it can be explained.
 *
 * [observed — `eas-cli@22.2.0` `build/commands/simulator/list.js`; not yet run against the service.]
 */
export function buildSessionListArgs({
  limit = CLOUD_SESSION_LIST_LIMIT,
}: { limit?: number } = {}): string[] {
  return ['simulator:list', '--status', 'in-progress', '--limit', String(limit), '--json'];
}

/**
 * `eas simulator:availability`, the read-only check for whether the account has the feature.
 *
 * Read-only: no session is started, so nothing is billed. Asked only when the listing came back
 * with no usable session, to tell "this account cannot start one" apart from "this project has none
 * running" — two facts with two different next actions.
 *
 * [observed — `build/commands/simulator/availability.js`: `{available, accountName}`, plus
 * `waitlistUrl` only when the account is gated.]
 */
export function buildAvailabilityArgs(): string[] {
  return ['simulator:availability', '--json'];
}

/**
 * The deep link, as the cloud backend opens it.
 *
 * `simulator:exec` loads the session environment and runs the controller, and the controller's verb
 * is `open` — the same verb for an app id and for a deep link. `--platform` is passed because the
 * skill's examples pass it on `open`, and a session knows its own platform: this says which of the
 * two the URL is for, and a session probe is where the value comes from rather than a guess.
 * [observed — live, 2026-08-26: the bare `open <url> --platform <p>` form, exit 0.]
 *
 * Three optional pieces, all of them from the controller's own help [observed —
 * `agent-device help open`, 0.20.10] and all of them for the cloud **reload** (llp/0005 §Cloud simulator):
 *
 * - `appId` in front of the URL — the shell-plus-link form, `open "Expo Go" exp://host …`, which
 *   launches the named app *with* the link instead of handing the link to the system. What that
 *   avoids is the "Open in 'Expo Go'?" dialog nothing can answer on a cloud device (S10).
 * - `relaunch` — `--relaunch`, which "terminate[s] the app process before launching it". One verb
 *   for the force-stop and the relaunch, so a reload never has to `close` first; `close` ends the
 *   *controller's* session and is what left a cloud app stranded (S12).
 * - `session` — `--session <name>`, the remedy the controller names in its own `DEVICE_IN_USE`
 *   refusal (S14).
 *
 * The order is the controller's: subcommand, then positionals, then flags.
 */
export function buildCloudOpenUrlArgs({
  url,
  platform,
  appId,
  relaunch = false,
  session,
}: {
  url: string;
  platform: CloudPlatform;
  /** Application id of the shell to launch the URL with, or undefined for a bare URL open. */
  appId?: string;
  /** Terminate the app process before launching it. */
  relaunch?: boolean;
  /** Controller session to bind the verb to, or undefined for the controller's own default. */
  session?: string;
}): string[] {
  return [
    'simulator:exec',
    'npx',
    AGENT_DEVICE_SPEC,
    'open',
    ...(appId ? [appId] : []),
    url,
    '--platform',
    platform,
    ...(relaunch ? ['--relaunch'] : []),
    ...(session ? ['--session', session] : []),
  ];
}

/**
 * The screenshot, as the cloud backend takes it.
 *
 * The controller writes the PNG to a **local** path — it downloads the image from the daemon — so
 * unlike `adb exec-out` there is nothing to redirect, and unlike `simctl` the file arrives over a
 * network.
 *
 * Both halves of the argv are the controller's own account of itself [observed — 2026-08-26,
 * `agent-device@latest help screenshot`, which runs offline]: the usage line is
 * `agent-device screenshot [path] …`, so the path is **positional**; and the flag list holds
 * `--out`, `--overlay-refs`, `--pixel-density`, `--fullscreen`, `--scale`, `--no-stabilize` and
 * `--normalize-status-bar` — and **no `--platform`**, which the `open` verb's help does document
 * ("Use --platform to bind URL/deep-link opens to the target platform"). Sending one here is how an
 * experimental CLI answers "unknown option", so none is sent.
 *
 * The controller requires an app to be open first, which is a property of the *verb* and is said
 * out loud in the caller's reason string rather than worked around here.
 */
export function buildCloudScreenshotArgs({ filePath }: { filePath: string }): string[] {
  return ['simulator:exec', 'npx', AGENT_DEVICE_SPEC, 'screenshot', filePath];
}

/**
 * The system alert, as the controller reads and answers one.
 *
 * `agent-device alert [get|accept|dismiss|wait] [timeout]`, and the subcommand is the whole argv
 * [observed — `agent-device@latest help alert`, run offline, 2026-08-27: "Inspect, wait for, accept,
 * or dismiss a platform alert. Use get before acting when the alert content matters; accept and
 * dismiss change the active alert state."].
 *
 * **What `get` answers when there is no alert**, which is the branch that decides whether this is
 * safe to run speculatively: exit **1** with `Error (COMMAND_FAILED): alert not found`
 * [observed — 2026-08-27, `agent-device@latest alert get` against a runner with nothing on screen].
 * So a read costs a refusal rather than an action, and a run that finds no alert accepts nothing.
 *
 * No `--platform`: the flag table carries the platform binding on `open`/`install`/`apps`, and
 * sending one where it is not documented is how an experimental CLI answers "unknown option"
 * (§`buildCloudScreenshotArgs`).
 */
export function buildCloudAlertArgs({
  action,
}: {
  action: 'get' | 'accept' | 'dismiss';
}): string[] {
  return ['simulator:exec', 'npx', AGENT_DEVICE_SPEC, 'alert', action];
}

/**
 * Whether an alert the controller read is iOS asking to open a URL in a named app.
 *
 * The alert this exists for is the one S10 is: "Open in 'Expo Go'?", which SpringBoard raises when a
 * custom-scheme URL is handed to the system, and which nothing on an unattended cloud device answers
 * [observed — live staging, 2026-08-26, S10; `agent-device alert accept` proved the causality].
 *
 * **Read as text rather than parsed**, deliberately. What `alert get` prints for a *present* alert
 * has not been seen by anything in this package — only the empty answer has — so a parser for it
 * would be a shape invented here and then trusted. Two substrings the dialog cannot lack are what
 * is asked for instead: the word `open`, and the name of the app whose URL this run just sent. An
 * alert that names neither is some other dialog, and answering an unknown system prompt is granting
 * something the caller did not ask for — so it is reported and left alone.
 *
 * @param output everything `alert get` wrote, stdout and stderr together.
 * @param appLabel the app the URL was for, e.g. `Expo Go` or `host.exp.Exponent`.
 */
export function isOpenInAppAlert(output: string, appLabel: string): boolean {
  const text = output.toLowerCase();
  if (!text.includes('open')) {
    return false;
  }
  // Both the display name and the bundle id are accepted: the dialog says "Expo Go" and the caller
  // knows `host.exp.Exponent`, so the id is matched by its last component too.
  const names = [appLabel, appLabel.split('.').pop() ?? appLabel]
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length >= 3);
  return names.some((name) => text.includes(name));
}

/** Read the alert on the session's device. Exit 1 with "alert not found" when there is none. */
export function readCloudAlertAsync(options: CloudRunOptions): Promise<CloudRunResult> {
  return runCloudVerbAsync(buildCloudAlertArgs({ action: 'get' }), options);
}

/** Answer the alert on the session's device with its default accept action. */
export function acceptCloudAlertAsync(options: CloudRunOptions): Promise<CloudRunResult> {
  return runCloudVerbAsync(buildCloudAlertArgs({ action: 'accept' }), options);
}

/**
 * Ending the app on the session's device, and not the session.
 *
 * `--shutdown` is never passed, and that is the safety of this function: it would stop the
 * simulator itself, which is a machine billed by the minute and may belong to a session this CLI
 * did not start [observed — `agent-device@0.20.10`, `agent-device help close`].
 *
 * **What `close` does not do is tell you whether it stopped the app you named.** The help says
 * "close the named app, or the active session app when app is omitted", and the live run says
 * something narrower: `close com.nonexistent.zzz.qqq` on a blank simulator exits **0** with
 * `{"success":true,"data":{"session":"default","message":"Closed: default"}}` — the same answer as
 * `close host.exp.Exponent` on a simulator that had never had Expo Go on it [observed — live
 * session `01a03d80`, 2026-08-26]. So the argument does not make the answer specific: a success
 * here is evidence that the **controller closed its session's app**, and no evidence at all about
 * the id. `stopAppOnCloudAsync` is where that is turned into a report that does not overclaim, and
 * llp/0005 §Cloud simulator is why it is not simply approximated.
 *
 * The id is still passed, because it is the documented way to name a target and a later controller
 * may honour it; nothing downstream is allowed to read the exit code as being about that id.
 *
 * No `--platform`: a session has one device, and the documented flag table carries the platform
 * binding on `open`/`install`/`apps` rather than on this verb.
 */
export function buildCloudStopAppArgs({ appId }: { appId: string }): string[] {
  return ['simulator:exec', 'npx', AGENT_DEVICE_SPEC, 'close', appId];
}

/**
 * Whether the controller — rather than the EAS CLI — is what refused.
 *
 * `agent-device` prints its own failures as `Error (CODE): <sentence>` and exits non-zero, and
 * `simulator:exec` propagates that exit code as its own [observed — live, 2026-08-26:
 * `Error (COMMAND_FAILED): Simulator device failed to open myapp://.` for a scheme no app on the
 * simulator had registered, and `Error (SESSION_NOT_FOUND): No active session. Run open first.` for
 * a screenshot with nothing open].
 *
 * It matters because the two failures need opposite headlines. A non-zero exit from `eas` may be a
 * verb this CLI got wrong — but when the controller printed one of these, the argv was right, the
 * bridge worked, and the **device** is what said no. Blaming the syntax there sends a reader to
 * `--help` for a command that is already correct.
 */
export function readControllerError(output: string): { code: string; message: string } | null {
  const match = /^\s*Error \(([A-Z_]+)\):\s*(.+)$/m.exec(output);
  return match ? { code: match[1]!, message: match[2]!.trim() } : null;
}

// ---- Reading a session -----------------------------------------------------------------------

/** One session, as much of it as this CLI reads. */
export interface CloudSessionInfo {
  id: string | null;
  /** The status verbatim, so a report can print what the service said rather than a translation. */
  status: string | null;
  platform: CloudPlatform | null;
  /**
   * The controller behind the session — `agent-device`, `argent`, `appium` or `serve-sim`.
   *
   * Read because it decides whether the session is a device at all: only `agent-device` answers the
   * verbs `simulator:exec` bridges to. Kept verbatim so a refusal can name the type that is up.
   */
  type: string | null;
  /** The `--name` the session was started with, for a report that says which one was picked. */
  name: string | null;
  /** When the service says it was created, used as the last tiebreaker between live sessions. */
  createdAt: string | null;
}

/**
 * The session id out of the dotenv `eas-cli` manages.
 *
 * A hand-rolled reader rather than a dotenv dependency: one `KEY=value` line is the whole of what
 * is wanted, and the file also carries a **token**, which is a thing to read as little of as
 * possible. Quotes are stripped because a value with a `#` in it may be written quoted.
 */
export function parseSessionIdFromEnvFile(text: string): string | null {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match || match[1] !== CLOUD_SESSION_ID_VAR) {
      continue;
    }
    const value = match[2]!.trim().replace(/^(['"])(.*)\1$/, '$2');
    return value.length > 0 ? value : null;
  }
  return null;
}

/**
 * What `eas simulator:list --json` said this project has running.
 *
 * `{"sessions":[…],"pageInfo":{…}}` is the documented shape [observed —
 * `build/commands/simulator/list.js`], and this reads the array from there or from the top level,
 * because a shape that moved is worth surviving. Null — rather than an empty list — for anything
 * unreadable: "no sessions" and "the answer could not be read" are the two states this whole module
 * is careful to keep apart, since the first is an instruction to start a billed session.
 */
export function parseSessionListJson(stdout: string): CloudSessionInfo[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return null;
  }
  const list = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.sessions)
      ? parsed.sessions
      : null;
  if (!list) {
    return null;
  }

  const sessions: CloudSessionInfo[] = [];
  for (const entry of list) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = stringOf(entry.id) ?? stringOf(entry.sessionId);
    if (id == null) {
      // An entry with no id names no session, and there is nothing to drive or to report.
      continue;
    }
    sessions.push({
      id,
      status: stringOf(entry.status),
      platform: normalizePlatform(stringOf(entry.platform)),
      type: stringOf(entry.type),
      name: stringOf(entry.name),
      createdAt: stringOf(entry.createdAt),
    });
  }
  return sessions;
}

/** Whether a status names a session that is up and can be driven. */
export function isActiveSessionStatus(status: string | null): boolean {
  return status != null && status.trim().toUpperCase() === ACTIVE_SESSION_STATUS;
}

/**
 * Whether a session is one this CLI can send a device verb to.
 *
 * Two facts, both from the service: it is running, and its controller is `agent-device`. A session
 * that answers a different client is not a device here however healthy it is.
 */
export function isDrivableSession(session: CloudSessionInfo): boolean {
  return (
    isActiveSessionStatus(session.status) &&
    session.type?.trim().toLowerCase() === DRIVABLE_SESSION_TYPE
  );
}

/** What a listing of live sessions amounts to for one run. */
export interface CloudSessionSelection {
  /** The session to drive, or null when none of them is one this CLI can use. */
  selected: CloudSessionInfo | null;
  /** The live sessions this CLI could drive, in the order the rule ranked them. */
  candidates: CloudSessionInfo[];
  /** Live sessions dropped for having a controller this CLI does not speak to. */
  wrongType: CloudSessionInfo[];
}

/**
 * Pick the session to drive, deterministically.
 *
 * Pure and total, because "which session did it use" must not depend on the order the service
 * returned or on the second the command was run (llp/0005 §Cloud simulator). The rule, in order:
 *
 * 1. only `agent-device` sessions are candidates at all;
 * 2. the one `.env.eas-simulator` names, when it is among them — the file is a bad existence proof
 *    and a good preference, because it is the session this project started;
 * 3. the platform the caller asked for;
 * 4. the most recently created, `id` ascending as the final tiebreaker so two sessions created in
 *    the same millisecond still order the same way on every run.
 *
 * A session on the *other* platform is still returned when it is all there is: the caller compares
 * and raises `cloudPlatformMismatchError`, which says a session exists and is not the one asked
 * for — an answer that "no session" would have hidden.
 */
export function selectCloudSession(
  sessions: CloudSessionInfo[],
  {
    preferredId = null,
    platform = null,
  }: { preferredId?: string | null; platform?: CloudPlatform | null } = {}
): CloudSessionSelection {
  const live = sessions.filter((session) => isActiveSessionStatus(session.status));
  const candidates = live.filter(isDrivableSession);
  const wrongType = live.filter((session) => !isDrivableSession(session));

  const ranked = [...candidates].sort((a, b) => {
    const preferred = rank(b.id === preferredId) - rank(a.id === preferredId);
    if (preferred !== 0) {
      return preferred;
    }
    const wanted = rank(b.platform === platform) - rank(a.platform === platform);
    if (wanted !== 0) {
      return wanted;
    }
    const newest = (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    return newest !== 0 ? newest : (a.id ?? '').localeCompare(b.id ?? '');
  });

  return { selected: ranked[0] ?? null, candidates: ranked, wrongType };
}

function rank(value: boolean): number {
  return value ? 1 : 0;
}

/** What `simulator:availability --json` said about the account. */
export interface CloudAvailability {
  /** Whether the feature is on. Null when the answer could not be read. */
  available: boolean | null;
  /** Where access comes from, which the service returns only for a gated account. */
  waitlistUrl: string | null;
}

/**
 * Read `simulator:availability --json`.
 *
 * `{available, accountName}` [observed — 2026-08-26, eas-cli 22.4.0, recorded in
 * `src/__fixtures__/eas/simulator-availability.json`], plus `waitlistUrl` when and only when the account is gated [observed
 * — `build/commands/simulator/availability.js`]. The URL is read rather than hard-coded here so a
 * refusal quotes the service; {@link CLOUD_SIMULATOR_WAITLIST_URL} is the fallback for an older CLI
 * that answers without one.
 */
export function parseAvailabilityJson(stdout: string): CloudAvailability {
  try {
    const parsed: unknown = JSON.parse(stdout.trim());
    if (isRecord(parsed) && typeof parsed.available === 'boolean') {
      return { available: parsed.available, waitlistUrl: stringOf(parsed.waitlistUrl) };
    }
  } catch {
    // An answer this cannot read establishes nothing, which is what null says.
  }
  return { available: null, waitlistUrl: null };
}

/** What this project has, or has not, on EAS Simulator right now. */
export type CloudSessionState =
  /** A session is up and can be driven. */
  | 'active'
  /** The dotenv names a session, and the service does not list it among the running ones. */
  | 'inactive'
  /** The service lists nothing this CLI can drive. */
  | 'none'
  /** Nothing could be established: no EAS CLI, an unreadable answer, or a binary that is not it. */
  | 'unknown';

export interface CloudSessionProbe {
  state: CloudSessionState;
  sessionId: string | null;
  platform: CloudPlatform | null;
  /** The status the service reported, verbatim. Null when nothing answered. */
  status: string | null;
  /** The `--name` of the session that was picked, when it has one. */
  sessionName: string | null;
  /** How many drivable sessions the listing held, so a report can say a choice was made. */
  candidateCount: number;
  /**
   * How many live sessions were dropped for having a controller this CLI cannot speak to.
   *
   * Carried so a failure that is *not* about the cloud — a `navigate` with no device at all — can
   * still name the session that is up. "No device found" next to a running `serve-sim` is true and
   * unhelpful, and the reader is one `simulator:start` away from a device this CLI can drive.
   */
  otherSessionCount: number;
  /** Why the state is what it is, for a failure that has to explain itself. Null when `active`. */
  reason: string | null;
  /** Whether the account has EAS Simulator at all, when it was worth asking. Null when it was not. */
  available: boolean | null;
  /** Where a gated account asks for access, when the service named it. */
  waitlistUrl: string | null;
  /**
   * The EAS CLI run that failed, when one did.
   *
   * Kept so the failure raised for this probe can run the same layer-3 classification a device verb
   * does: a signed-out account is a step only a person can complete whether it was found while
   * *driving* the session or while *asking about* it, and answering the second with exit `1` would
   * hand an agent a broken-tool story for a login (llp/0010 §Needs-human protocol).
   */
  failure: CloudRunResult | null;
}

/** Where the session dotenv lives for a project. */
export function cloudSessionEnvPath(projectRoot: string): string {
  return path.join(projectRoot, CLOUD_SESSION_ENV_FILE);
}

/**
 * The session id this project last started, read off disk. Never throws.
 *
 * Two callers, and neither of them treats it as proof of anything running (llp/0005 §Cloud simulator):
 *
 * - the **preference** in {@link selectCloudSession}, when the service lists more than one session;
 * - the **suggestion ladders** — `status.next`, the `start`/`dev` banner, `smoke`'s open-app rung
 *   — which promise to be instant and so may not spawn an `eas`. A suggestion naming a dead session
 *   costs one command that says so; a banner held up by a network call costs every run.
 */
export function readCloudSessionIdSync(projectRoot: string): string | null {
  try {
    return parseSessionIdFromEnvFile(fs.readFileSync(cloudSessionEnvPath(projectRoot), 'utf8'));
  } catch {
    return null;
  }
}

/** How long the EAS CLI gets to answer a question about a session. */
export const CLOUD_SESSION_TIMEOUT_MS = 20_000;

/**
 * How long a device verb gets.
 *
 * Generous, and it has to be: `simulator:exec` runs the controller through `npx`, which downloads
 * the package on a cold machine before the verb starts, and the verb then crosses a network to a
 * remote daemon. A budget sized for `simctl openurl` would kill the healthy case.
 */
export const CLOUD_VERB_TIMEOUT_MS = 180_000;

export interface CloudRunOptions {
  projectRoot: string;
  /** The `eas` to spawn, for a caller that resolved it already. */
  easCli?: EasCli | null;
  timeoutMs?: number;
}

/** What one `eas simulator:*` run amounted to. */
export interface CloudRunResult {
  /** The command as a person would type it, for reproducing the step by hand. */
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  /** Set when the process could not be started at all. */
  spawnError: string | null;
  /** The binary that ran, so a failure names the file rather than the package. */
  binPath: string | null;
}

/**
 * Ask the service what this project has running. Never throws: no session is an answer.
 *
 * One listing, and a second read-only request only when the listing held nothing usable. The
 * dotenv is read too, but not as a gate — it is the preference {@link selectCloudSession} applies
 * when the service reports more than one live session (llp/0005 §Cloud simulator).
 *
 * `platform` says which platform the caller would rather have. It is a **preference, not a
 * filter**: a session on the other platform still comes back, because "there is a session and it is
 * an Android one" is an answer and "there is no session" would not be.
 */
export async function probeCloudSessionAsync({
  projectRoot,
  easCli,
  platform = null,
  timeoutMs = CLOUD_SESSION_TIMEOUT_MS,
}: CloudRunOptions & { platform?: CloudPlatform | null }): Promise<CloudSessionProbe> {
  const cli = easCli ?? resolveEasCli(projectRoot);
  if (!cli) {
    // The resolver's third rung downloads the published CLI, so reaching here means this machine has
    // no `eas` *and* no `npx` or `bunx` to fetch one with (`src/utils/easCli.ts`).
    return unknownSession(
      null,
      'no "eas" binary was found in node_modules/.bin or on PATH, and no package runner ("npx" or "bunx") is on PATH to download one, so nothing could be asked about a cloud simulator session'
    );
  }

  // The file is read before the listing and used after it: it names the session this project
  // started, which is the tiebreaker when the account has several up at once.
  const preferredId = readCloudSessionIdSync(projectRoot);

  const result = await runEasAsync(cli, buildSessionListArgs(), { projectRoot, timeoutMs });
  if (result.spawnError) {
    return unknownSession(
      preferredId,
      `"${result.command}" could not be run (${result.spawnError})`
    );
  }
  // A binary that is not the EAS CLI has said nothing about this project's sessions, and reading its
  // exit code as "there are none" would send a caller to start a second billed one
  // (`wrapperCrash.ts`).
  if (looksLikeWrapperCrash({ tool: 'eas', ...result })) {
    return unknownSession(
      preferredId,
      `the "eas" at ${result.binPath} exited ${result.exitCode} and printed nothing an eas run would print, so it may not be the EAS CLI`
    );
  }
  if (result.exitCode !== 0) {
    return {
      ...unknownSession(
        preferredId,
        `"${result.command}" exited ${result.exitCode ?? 'on a signal'}${
          firstLine(result.stderr) ? `: ${firstLine(result.stderr)}` : ''
        }`
      ),
      failure: result,
    };
  }

  const sessions = parseSessionListJson(result.stdout);
  if (!sessions) {
    return unknownSession(
      preferredId,
      `"${result.command}" answered with JSON this CLI cannot read`
    );
  }

  const { selected, candidates, wrongType } = selectCloudSession(sessions, {
    preferredId,
    platform,
  });
  if (selected?.id != null) {
    return {
      state: 'active',
      sessionId: selected.id,
      platform: selected.platform,
      status: selected.status,
      sessionName: selected.name,
      candidateCount: candidates.length,
      otherSessionCount: wrongType.length,
      available: true,
      waitlistUrl: null,
      failure: null,
      reason: null,
    };
  }

  return await noUsableSessionAsync({
    cli,
    projectRoot,
    timeoutMs,
    preferredId,
    wrongType,
  });
}

/**
 * The listing came back with nothing this CLI can drive. Work out which kind of nothing it is.
 *
 * This is the one branch that pays for the availability check, and it pays for it because it is the
 * one branch whose instruction changes: "start a session" is wrong for an account that cannot have
 * one, and telling somebody to run a command that will refuse them is a dead end where a waitlist
 * link is a next step.
 */
async function noUsableSessionAsync({
  cli,
  projectRoot,
  timeoutMs,
  preferredId,
  wrongType,
}: {
  cli: EasCli;
  projectRoot: string;
  timeoutMs: number;
  preferredId: string | null;
  wrongType: CloudSessionInfo[];
}): Promise<CloudSessionProbe> {
  const availability = await runEasAsync(cli, buildAvailabilityArgs(), { projectRoot, timeoutMs });
  // A check that stopped because nobody is signed in has established nothing about the account's
  // access — and the next step for it is a person, not a session. Answered as `unknown` with the
  // run attached, so the caller raises the handoff rather than "this project has no session".
  if (needsHumanFor(availability)) {
    return {
      ...unknownSession(preferredId, 'no Expo account is signed in'),
      failure: availability,
    };
  }
  const { available, waitlistUrl } = availability.spawnError
    ? { available: null, waitlistUrl: null }
    : parseAvailabilityJson(availability.stdout);

  const base = {
    platform: null,
    status: null,
    sessionName: null,
    candidateCount: 0,
    otherSessionCount: wrongType.length,
    available,
    waitlistUrl: waitlistUrl ?? (available === false ? CLOUD_SIMULATOR_WAITLIST_URL : null),
    failure: null,
  };

  if (available === false) {
    return {
      ...base,
      state: 'none',
      sessionId: null,
      reason:
        'EAS Simulator is not enabled on this account, so no session can be started for this project',
    };
  }
  // A live session of a type this CLI cannot drive is not "no session". Naming the types is what
  // stops a reader from starting a second billed session next to the one they are already paying
  // for, and it is the only way "there is nothing running" and "the thing running answers a
  // different client" can be told apart.
  if (wrongType.length > 0) {
    const types = [...new Set(wrongType.map((session) => session.type ?? 'an unreported type'))];
    return {
      ...base,
      state: 'none',
      sessionId: null,
      reason: `this project has ${wrongType.length} running EAS Simulator session${
        wrongType.length === 1 ? '' : 's'
      } (${types.join(', ')}) and none of them is a "${DRIVABLE_SESSION_TYPE}" session, which is the only kind this CLI can send a device verb to`,
    };
  }
  // The dotenv names a session the service did not list as running. The file outlives the session,
  // so this is the common shape of a stale one — and saying so is what stops the id in it from
  // reading as an answer.
  if (preferredId != null) {
    return {
      ...base,
      state: 'inactive',
      sessionId: preferredId,
      reason: `${CLOUD_SESSION_ENV_FILE} names session ${preferredId}, and the service does not list it among this project's running sessions, so that session has ended`,
    };
  }
  return {
    ...base,
    state: 'none',
    sessionId: null,
    reason: 'the service lists no running EAS Simulator session for this project',
  };
}

/**
 * Open a URL on the cloud simulator. Never throws for a verb that ran and refused.
 *
 * `appId`, `relaunch` and `session` are {@link buildCloudOpenUrlArgs}'s: a caller that wants the
 * one-verb relaunch passes them, and a caller that wants the plain open passes none.
 */
export function openUrlOnCloudSimulatorAsync({
  url,
  platform,
  appId,
  relaunch,
  session,
  ...options
}: CloudRunOptions & {
  url: string;
  platform: CloudPlatform;
  appId?: string;
  relaunch?: boolean;
  session?: string;
}): Promise<CloudRunResult> {
  return runCloudVerbAsync(
    buildCloudOpenUrlArgs({ url, platform, appId, relaunch, session }),
    options
  );
}

/**
 * End one app on the cloud simulator, leaving the session up.
 *
 * The cloud form of `simctl terminate` and `am force-stop`. Never throws for a verb that ran and
 * refused — the caller weighs "it was not running" against what it is trying to do, exactly as it
 * does for the local backends.
 */
export function stopAppOnCloudSimulatorAsync({
  appId,
  ...options
}: CloudRunOptions & { appId: string }): Promise<CloudRunResult> {
  return runCloudVerbAsync(buildCloudStopAppArgs({ appId }), options);
}

/** Take a screenshot of the cloud simulator into a local file. */
export function captureCloudScreenshotAsync({
  filePath,
  ...options
}: CloudRunOptions & { filePath: string }): Promise<CloudRunResult> {
  return runCloudVerbAsync(buildCloudScreenshotArgs({ filePath }), options);
}

async function runCloudVerbAsync(
  args: string[],
  { projectRoot, easCli, timeoutMs = CLOUD_VERB_TIMEOUT_MS }: CloudRunOptions
): Promise<CloudRunResult> {
  const cli = easCli ?? resolveEasCli(projectRoot);
  if (!cli) {
    throw easCliMissingError();
  }
  return await runEasAsync(cli, args, { projectRoot, timeoutMs });
}

async function runEasAsync(
  cli: EasCli,
  args: string[],
  { projectRoot, timeoutMs }: { projectRoot: string; timeoutMs: number }
): Promise<CloudRunResult> {
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync(
    cli.command,
    easCliArgs(cli, args),
    {
      cwd: projectRoot,
      timeoutMs,
    }
  );
  return {
    // How a person would reproduce the step. The runner and the package spec, not a bare `eas`:
    // that used to be the honest short form of a resolved binary, and is now the name of a command
    // the machine may not have (`src/utils/easCli.ts`).
    command: [easCliLabel(cli), ...args].join(' '),
    stdout,
    stderr,
    exitCode,
    spawnError: spawnError?.message ?? null,
    binPath: cli.command,
  };
}

// ---- The failures ----------------------------------------------------------------------------

/**
 * The failure for a project asked to use a cloud simulator that has no live session.
 *
 * Names the command that starts one, taken from the documented syntax rather than guessed, and
 * branches on which of the three "no session" states this is: an account without the feature is not
 * told to start a session it cannot have, and a session that has *ended* is named by its id so the
 * reader knows the file on disk is stale rather than wrong.
 */
export function cloudSessionUnavailableError(probe: CloudSessionProbe): CommandError {
  const start = CLOUD_SESSION_START_COMMAND;

  if (probe.available === false) {
    const error = new CommandError(
      'CLOUD_SIMULATOR_UNAVAILABLE',
      [
        'EAS Simulator is not enabled on this account, so there is no cloud simulator to open the link on.',
        `Why: ${probe.reason ?? 'the availability check answered that the feature is off for this account'}. It is a limited-access EAS feature that is still rolling out, so it is not a thing this command can turn on.`,
        // The URL comes from the service when it sends one, so a refusal ends in where access comes
        // from rather than only in "no".
        `How: ask for access at ${probe.waitlistUrl ?? CLOUD_SIMULATOR_WAITLIST_URL}. Until then, open the link on a local device — boot a simulator or attach a device and run this command again — or hand the URL to whatever can open it with "${PROGRAM_PREFIX} navigate <route> --print-url".`,
      ].join('\n')
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} navigate / --print-url`;
    return error;
  }

  const error = new CommandError(
    'NO_CLOUD_SIMULATOR_SESSION',
    [
      'No EAS Simulator session this CLI can drive is running for this project, so there is no cloud simulator to open the link on.',
      `Why: ${probe.reason ?? 'the service listed no running session'}. A cloud simulator is a session that is started, driven and stopped — unlike a local simulator, there is nothing to find that somebody else left booted.`,
      // `--id` is named rather than left out: `simulator:stop` defaults to `.env.eas-simulator`,
      // and a session started with `--json` writes that file empty, so the bare form has nothing to
      // read [observed — 2026-08-26, live]. Advice that bills by the minute has to work first time.
      `How: start one with "${start}", then run this command again. "--expo-go" is not optional advice: a session started without it comes up with no app installed, and every link opened on it is refused. A project with a development build of its own passes "--build-id <id>" instead. The session bills until it is stopped, so end it with "npx eas simulator:stop --id <session-id>" when the run is done. To see what this project has running, "npx eas simulator:list --status in-progress" lists it, with the id. To open the link somewhere this CLI does not drive, "${PROGRAM_PREFIX} navigate <route> --print-url" prints the URL and asks for no device.`,
    ].join('\n')
  );
  error.suggestedCommand = start;
  return error;
}

/**
 * The failure for a session nothing could be established about.
 *
 * Deliberately not folded into {@link cloudSessionUnavailableError}: "start a session" is the wrong
 * instruction for a machine whose EAS CLI could not be asked, and following it would start a second
 * billed session next to one that may well be running. This is the `unknown` of the probe, which is
 * the same distinction `DeviceProbe.toolError` draws for `adb` (F49) — a tool that did not answer
 * has said nothing about the world.
 */
export function cloudSessionUnknownError(probe: CloudSessionProbe): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_SESSION_UNKNOWN',
    [
      'Whether this project has a running EAS Simulator session could not be established, so nothing was opened on one.',
      `Why: ${probe.reason ?? 'the EAS CLI gave no answer this command could read'}. ${
        probe.sessionId
          ? `${CLOUD_SESSION_ENV_FILE} names session ${probe.sessionId}, and whether that session is still up is exactly what could not be read — so this is not being reported as "no session", which would be an instruction to start a second billed one.`
          : 'What this project has running could not be listed, so "no session" would be a guess, and acting on it would start a second billed one next to any that is up.'
      }`,
      `How: run "npx eas simulator:list --status in-progress" to see what the CLI says, and check that the "eas" being run is the EAS CLI. Then run this command again, or open the URL elsewhere with "${PROGRAM_PREFIX} navigate <route> --print-url".`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx eas simulator:list --status in-progress';

  // The same layer-3 hand-off a device verb does. A signed-out account stops the *question* about
  // the session exactly as it stops the answer, and both are a login rather than a broken CLI.
  const needsHuman =
    probe.failure &&
    classifySubprocessFailure({
      tool: 'eas',
      invocation: probe.failure.command,
      exitCode: probe.failure.exitCode,
      stdout: probe.failure.stdout,
      stderr: probe.failure.stderr,
    });
  return needsHuman
    ? needsHumanErrorFrom(needsHuman, { code: error.code, message: error.message })
    : error;
}

/** The failure for a `--ios`/`--android` that names the platform the session is not. */
export function cloudPlatformMismatchError(
  wanted: CloudPlatform,
  session: CloudPlatform,
  sessionId: string | null
): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_PLATFORM_MISMATCH',
    [
      `--${wanted} names a platform the running cloud simulator is not, so nothing was opened.`,
      `Why: an EAS Simulator session is created for one platform and keeps it for its whole life${sessionId ? ` — session ${sessionId} is ${session}` : ''}. There is no second device in it to switch to.`,
      `How: run this command with --${session} (or with no platform flag, which takes the session's own), or start a ${wanted} session and run it again.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} navigate / --cloud --${session}`;
  return error;
}

/** The failure for a live session whose platform the service did not report. */
export function cloudPlatformUnknownError(sessionId: string | null): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_PLATFORM_UNKNOWN',
    [
      `The running cloud simulator did not say which platform it is, so nothing was opened on it.`,
      `Why: the URL shape, the connect URL and the check for the app attaching afterwards all differ between iOS and Android, and ${sessionId ? `session ${sessionId}` : 'the session'} reported no platform for this command to read. Guessing one would open a link built for the other.`,
      `How: name it — run this command again with --ios or --android.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} navigate / --cloud --ios`;
  return error;
}

/**
 * The failure for a cloud run against a dev server no cloud simulator can reach.
 *
 * The one precondition that differs from every local backend, and the reason it is refused rather
 * than attempted: `exp://127.0.0.1:<port>` names the loopback of whatever resolves it, and on a
 * machine in EAS's datacenter that is a port nothing listens on — the same shape as the Android
 * emulator finding of llp/0005 §Cloud simulator, with no `adb reverse`
 * available to fix it. A LAN address is no better: the session is not on this network.
 */
export function cloudNeedsTunnelError(url: string, hostType: string | null): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER',
    [
      `The dev server is only reachable from ${hostType === 'localhost' ? 'this machine' : 'this network'}, so a cloud simulator cannot load ${url} and nothing was opened.`,
      `Why: the URL carries a ${hostType ?? 'local'} host, and the simulator runs on EAS infrastructure — ${hostType === 'localhost' ? 'that host is the loopback of whatever resolves it, which there is a machine in a datacenter' : 'that address is on this network and the session is not'}. Opening it would land the app on an error screen with the device tool reporting success, which is the class of false green this command exists to remove.`,
      `How: restart the dev server with a tunnel — "${PROGRAM_PREFIX} dev --detach --tunnel" — and run this command again. A tunnel serves the same dev server from any network, which is the one address a cloud simulator can use.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} dev --detach --tunnel`;
  return error;
}

/**
 * The failure for a device verb that ran and did not work.
 *
 * Four things folded into one place, because all of them are about a subprocess this CLI cannot
 * verify: a binary that was never the EAS CLI is named as such rather than quoted (`wrapperCrash`),
 * a signed-out account becomes the needs-human handoff and exit `7` rather than a plain failure,
 * **the controller refusing is separated from the syntax being wrong**, and anything else quotes
 * what the tool printed.
 *
 * That third one was a live finding. The first cut had one "Why" for every non-zero exit — "a verb
 * or a flag this CLI sends may not be the one the installed eas-cli has" — and the first real
 * session printed `Error (COMMAND_FAILED): Simulator device failed to open myapp://.` under it
 * [observed — 2026-08-26]. The argv was right, the bridge worked, and the **device** had refused a
 * scheme no app on it had registered; sending that reader to `--help` would have had them checking
 * a command that was already correct.
 */
/**
 * What to do about a device the controller says is already in use.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator — live staging, S14.
 *
 * `DEVICE_IN_USE` is the one controller refusal whose remedy is in its own message: it names the
 * session that holds the device. The general advice for a refused verb — "a session can end between
 * the moment it was listed and the moment a verb reaches it; start a new one if it has" — is the
 * opposite of the truth here, and acting on it bills a second machine and leaves this one held.
 *
 * The session name is read out of the controller's sentence rather than assumed: the observed one is
 * `Device is already in use by session "default".` [observed — live, 2026-08-26], and a message that
 * stops carrying a name falls back to advice that names none.
 */
/**
 * The controller session named in a `DEVICE_IN_USE` message, or null when it named none.
 *
 * `Device is already in use by session "default".` [observed — live, 2026-08-26]. Exported because
 * two callers need it: the advice below, and the cloud reload — which binds its verb to that session
 * and retries, rather than telling a reader to do it (`src/runtime/reload/cloudReload.ts`).
 */
export function readHeldSessionName(message: string): string | null {
  return /session\s+["']([^"']+)["']/.exec(message)?.[1] ?? null;
}

function heldDeviceHow(message: string): string {
  const session = readHeldSessionName(message);
  return [
    session
      ? `The device is held by the session named ${JSON.stringify(session)}, so bind this verb to that session — the controller takes --session ${session} — or wait for whatever is holding it to let go.`
      : `The device is held by another session, so bind this verb to the session that holds it (the controller takes --session <name>), or wait for it to let go.`,
    `Do not start a second session: that bills another machine and leaves this one held. "npx eas simulator:list --status in-progress" shows which sessions are up.`,
  ].join(' ');
}

export function cloudVerbFailedError(
  result: CloudRunResult,
  { what, how }: { what: string; how: string }
): CommandError {
  if (result.spawnError) {
    return new CommandError(
      'CLOUD_SIMULATOR_TOOL_MISSING',
      [
        `Could not run "${result.command}", so ${what}`,
        `Why: ${result.spawnError}`,
        `How: add the EAS CLI to the project with "npm install --save-dev eas-cli", then run this command again. The project's own copy is the first thing this command looks for, so it takes precedence over whatever could not be spawned.`,
      ].join('\n')
    );
  }

  // The controller's own refusal, which is a fact about the **device** rather than about the argv.
  const controller = readControllerError(`${result.stderr}\n${result.stdout}`);
  if (controller) {
    // One controller code carries its own remedy, and the general `how` is the opposite of it.
    const held = controller.code === 'DEVICE_IN_USE' ? heldDeviceHow(controller.message) : null;
    const error = new CommandError(
      'CLOUD_SIMULATOR_DEVICE_REFUSED',
      [
        `The cloud simulator refused the command, so ${what}`,
        `Why: the session's controller ran and answered ${controller.code} — "${controller.message}" — so the command reached the device and the device is what said no. This is not a syntax problem: "${result.command}" was accepted and executed.${
          held ? ` The session did not end: the device is up and something else is holding it.` : ''
        }`,
        `How: ${held ?? how}`,
      ].join('\n')
    );
    // The listing either way: for a session that may have ended it is how to find out, and for a
    // held device it is how to see which session is holding it. Neither starts anything.
    error.suggestedCommand = 'npx eas simulator:list --status in-progress';
    return error;
  }

  const wrapperCrash = looksLikeWrapperCrash({ tool: 'eas', ...result });
  const detail = wrapperCrash
    ? runnerCrashDetail({ tool: 'eas', exitCode: result.exitCode }, result.command)
    : `\nWhat the tool printed:\n${(result.stderr.trim() || result.stdout.trim() || 'nothing').trim()}`;

  const error = new CommandError(
    'CLOUD_SIMULATOR_COMMAND_FAILED',
    [
      `"${result.command}" exited ${result.exitCode ?? 'on a signal'}, so ${what}`,
      `Why: the EAS Simulator commands are experimental, so a verb or a flag this CLI sends may not be the one the installed eas-cli has. ${
        wrapperCrash
          ? 'What ran under that name did not behave like the EAS CLI at all, which is the first thing to check.'
          : 'The output below is what it said.'
      }`,
      `How: ${how} Check the syntax the installed CLI has with "${checkBinaryCommand(result.binPath ?? 'eas', ['simulator:exec', '--help'])}".`,
      detail,
    ].join('\n')
  );

  // Layer 3 of the needs-human protocol: a signed-out account is a step only a person can complete,
  // and it moves the run into exit 7 rather than reporting a broken command (llp/0010).
  const needsHuman = classifySubprocessFailure({
    tool: 'eas',
    invocation: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  return needsHuman
    ? needsHumanErrorFrom(needsHuman, { code: error.code, message: error.message })
    : error;
}

/**
 * The failure for an act the cloud backend has no verb for.
 *
 * Kept for the acts that genuinely have none, and no longer used for `runtime:stop`: reading the
 * controller found `close <appId>`, which ends the named app and leaves the device up (llp/0005
 * §Cloud simulator). The distinction this text was protecting is real and
 * is now a **flag** — `close --shutdown` would stop the billed machine, and this CLI never passes
 * it — rather than a missing verb.
 */
export function cloudVerbNotSupportedError(action: string): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_UNSUPPORTED',
    [
      `${action} is not something this CLI can do on a cloud simulator, so nothing ran.`,
      `Why: the controller that drives an EAS Simulator session has no verb for it. "eas simulator:stop" ends the whole session — the remote machine and everything on it — which is a larger act than the one asked for here, and doing it under this name would report a session teardown as the act that was requested.`,
      `How: to put the app back into a known state, open a route on it again with "${PROGRAM_PREFIX} navigate / --cloud". To end the session itself, and its billing, run "npx eas simulator:stop".`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx eas simulator:stop';
  return error;
}

/** The failure for a cloud run on a machine with no EAS CLI at all. */
export function easCliMissingError(): CommandError {
  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      'The EAS CLI could not be reached, so a cloud simulator cannot be driven from here.',
      'Why: no "eas" binary was found in node_modules/.bin or on PATH, and no package runner ("npx" or "bunx") is on PATH either, so the published eas-cli could not be downloaded to stand in for one — and an EAS Simulator session is created and driven entirely through that CLI.',
      'How: add the EAS CLI to the project with "npm install --save-dev eas-cli", then run this command again. If that command is also unavailable, PATH is missing the Node.js install that provides npm and npx — fix that first.',
    ].join('\n')
  );
  error.suggestedCommand = 'npm install --save-dev eas-cli';
  return error;
}

function unknownSession(sessionId: string | null, reason: string): CloudSessionProbe {
  return {
    state: 'unknown',
    sessionId: sessionId || null,
    platform: null,
    status: null,
    sessionName: null,
    candidateCount: 0,
    otherSessionCount: 0,
    available: null,
    waitlistUrl: null,
    failure: null,
    reason,
  };
}

/** Whether a failed EAS CLI run is a step only a person can complete. */
function needsHumanFor(result: CloudRunResult): boolean {
  return (
    classifySubprocessFailure({
      tool: 'eas',
      invocation: result.command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    }) != null
  );
}

function normalizePlatform(value: string | null): CloudPlatform | null {
  const lower = value?.trim().toLowerCase();
  return lower === 'ios' || lower === 'android' ? lower : null;
}

function stringOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
}
