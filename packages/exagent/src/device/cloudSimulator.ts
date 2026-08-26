// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
// The third device backend: a simulator that runs on EAS rather than on this machine.
//
// `src/navigate/device.ts` resolves two backends, and both are a platform tool this machine has:
// `simctl` for a booted iOS simulator, `adb` for an attached Android device. A laptop with neither
// has no device at all — which is exactly the machine the dogfood session of 2026-08-24 was run
// from, driving Expo Go on a **cloud** simulator through a tunnel while every `navigate` it typed
// stopped at "no booted device was found". Wave 9 gave that machine the URL (`--print-url`). This
// gives it the act.
//
// **Every invocation in this file is gated here, and every one of them is [inferred].** The
// `eas simulator:*` surface is experimental and hidden, this machine's account is signed out, and
// the `eas` on its PATH is a shim that exits before it reaches the CLI — so nothing below has been
// run against a live session. The argv is built by pure functions and pinned by unit tests for that
// reason: when somebody signs in, one test file says what this CLI believes the API is, and one
// module is where a correction goes. The table of unverified invocations is in llp/0005.
//
// Source of the syntax: the `eas-simulator` skill (session lifecycle, `simulator:exec` as the
// bridge, `agent-device` as the controller) [inferred — read, not run].
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
import { resolveEasCli, type EasCli } from '../utils/easCli';
import { CommandError } from '../utils/errors';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { checkBinaryCommand, looksLikeWrapperCrash, wrapperCrashDetail } from '../utils/wrapperCrash';

/** Platforms an EAS Simulator session can run. The same two the local backends drive. */
export type CloudPlatform = 'ios' | 'android';

/**
 * The dotenv file `eas-cli` writes when a session starts, and reads when one is driven.
 *
 * Managed by the EAS CLI and not by this one: it holds the session id and the daemon's URL and
 * token, which is why nothing here ever writes it. Its **presence** is the cheap question this
 * module asks first — a project that has never started a session has no file, and then no
 * subprocess is spawned to find that out.
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

/** The session status the EAS CLI reports for a session that is up. */
export const ACTIVE_SESSION_STATUS = 'IN_PROGRESS';

// ---- The argv, as pure functions -------------------------------------------------------------
//
// Pure and exported for the same reason `buildOpenUrlCommand` and `buildScreenshotCommand` are: the
// argv is the whole of what this module decides, and a wrong one fails only on a machine that has
// an account, a session, and a bill. Here the stakes are higher than for `simctl`, because nothing
// in this package has ever seen the right answer.

/**
 * `eas simulator:get`, which answers a session's status and connection details. [inferred]
 *
 * `--json` so the answer is parsed rather than scraped. The id is omitted whenever the caller has
 * none: with no `--id` the CLI targets the session named by the dotenv, which is the session this
 * project last started.
 */
export function buildSessionGetArgs(sessionId?: string | null): string[] {
  return ['simulator:get', ...(sessionId ? ['--id', sessionId] : []), '--json'];
}

/**
 * `eas simulator:availability`, the read-only check for whether the account has the feature.
 * [inferred]
 *
 * Read-only: no session is started, so nothing is billed. Asked only when there is no session, to
 * tell "this account cannot start one" apart from "this project has not started one yet" — two
 * facts with two different next actions.
 */
export function buildAvailabilityArgs(): string[] {
  return ['simulator:availability', '--json'];
}

/** `eas simulator:stop`, which ends the **session** — not the app inside it. [inferred] */
export function buildSessionStopArgs(sessionId?: string | null): string[] {
  return ['simulator:stop', ...(sessionId ? ['--id', sessionId] : [])];
}

/**
 * The deep link, as the cloud backend opens it. [inferred]
 *
 * `simulator:exec` loads the session environment and runs the controller, and the controller's verb
 * is `open` — the same verb for an app id and for a deep link. `--platform` is passed because the
 * skill's examples pass it on `open`, and a session knows its own platform: this says which of the
 * two the URL is for, and a session probe is where the value comes from rather than a guess.
 */
export function buildCloudOpenUrlArgs({
  url,
  platform,
}: {
  url: string;
  platform: CloudPlatform;
}): string[] {
  return ['simulator:exec', 'npx', AGENT_DEVICE_SPEC, 'open', url, '--platform', platform];
}

/**
 * The screenshot, as the cloud backend takes it. [inferred]
 *
 * The controller writes the PNG to a **local** path — it downloads the image from the daemon — so
 * unlike `adb exec-out` there is nothing to redirect, and unlike `simctl` the file arrives over a
 * network. No `--platform`: the skill's verb table carries it on `open`/`install`/`apps` and not on
 * `screenshot`, and inventing a flag is how an experimental CLI answers "unknown option".
 *
 * The controller requires an app to be open first, which is a property of the *verb* and is said
 * out loud in the caller's reason string rather than worked around here.
 */
export function buildCloudScreenshotArgs({ filePath }: { filePath: string }): string[] {
  return ['simulator:exec', 'npx', AGENT_DEVICE_SPEC, 'screenshot', filePath];
}

// ---- Reading a session -----------------------------------------------------------------------

/** One session, as much of it as this CLI reads. */
export interface CloudSessionInfo {
  id: string | null;
  /** The status verbatim, so a report can print what the service said rather than a translation. */
  status: string | null;
  platform: CloudPlatform | null;
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
 * What `eas simulator:get --json` said about the session. [inferred]
 *
 * Written to survive a shape that is not what this expects: the fields are looked for at the top
 * level and one level down under the keys an envelope would use, and anything missing is null.
 * A session whose JSON this cannot read is reported as `unknown` by the probe rather than as
 * absent — a parser that guessed "no session" from an unfamiliar envelope would send a caller to
 * start a second billed session next to the one it failed to see.
 */
export function parseSessionJson(stdout: string): CloudSessionInfo | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return null;
  }
  const envelope = isRecord(parsed) ? parsed : null;
  if (!envelope) {
    return null;
  }
  const session =
    (isRecord(envelope.session) ? envelope.session : null) ??
    (isRecord(envelope.data) ? envelope.data : null) ??
    envelope;

  const status = stringOf(session.status);
  const platform = normalizePlatform(stringOf(session.platform));
  const id = stringOf(session.id) ?? stringOf(session.sessionId);
  return status == null && platform == null && id == null ? null : { id, status, platform };
}

/** Whether a status names a session that is up and can be driven. */
export function isActiveSessionStatus(status: string | null): boolean {
  return status != null && status.trim().toUpperCase() === ACTIVE_SESSION_STATUS;
}

/** Whether `simulator:availability --json` said the account has the feature. [inferred] */
export function parseAvailabilityJson(stdout: string): boolean | null {
  try {
    const parsed: unknown = JSON.parse(stdout.trim());
    if (isRecord(parsed) && typeof parsed.available === 'boolean') {
      return parsed.available;
    }
  } catch {
    // An answer this cannot read establishes nothing, which is what null says.
  }
  return null;
}

/** What this project has, or has not, on EAS Simulator right now. */
export type CloudSessionState =
  /** A session is up and can be driven. */
  | 'active'
  /** A session id is on disk and the service says that session is over. */
  | 'inactive'
  /** This project has never started one, so there is no id to ask about. */
  | 'none'
  /** Nothing could be established: no EAS CLI, an unreadable answer, or a binary that is not it. */
  | 'unknown';

export interface CloudSessionProbe {
  state: CloudSessionState;
  sessionId: string | null;
  platform: CloudPlatform | null;
  /** The status the service reported, verbatim. Null when nothing answered. */
  status: string | null;
  /** Why the state is what it is, for a failure that has to explain itself. Null when `active`. */
  reason: string | null;
  /** Whether the account has EAS Simulator at all, when it was worth asking. Null when it was not. */
  available: boolean | null;
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
 * One `readFileSync`, and the gate in front of every subprocess this module would otherwise spawn:
 * a machine with no session file is a machine with no cloud simulator, established for the cost of
 * a `stat`, on the failure path of every `navigate` that found no local device.
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
 * Ask the service about this project's session. Never throws: no session is an answer.
 *
 * Three cheap questions in order, and each one is skipped when the one before it settled the
 * matter: is there an `eas` at all, is there a session id on disk, and — only then — what does the
 * service say about it. The availability check is last and only for the `none` case, because it is
 * the one question that turns "start a session" into "this account cannot".
 */
export async function probeCloudSessionAsync({
  projectRoot,
  easCli,
  timeoutMs = CLOUD_SESSION_TIMEOUT_MS,
}: CloudRunOptions): Promise<CloudSessionProbe> {
  const cli = easCli ?? resolveEasCli(projectRoot);
  if (!cli) {
    return {
      state: 'unknown',
      sessionId: null,
      platform: null,
      status: null,
      available: null,
      failure: null,
      reason:
        'no "eas" binary was found in node_modules/.bin or on PATH, so nothing could be asked about a cloud simulator session',
    };
  }

  const sessionId = readCloudSessionIdSync(projectRoot);
  if (sessionId == null) {
    // No id on disk. Whether that is "start one" or "this account has none" is worth one read-only
    // request, and only this branch pays for it.
    const availability = await runEasAsync(cli, buildAvailabilityArgs(), { projectRoot, timeoutMs });
    // A check that stopped because nobody is signed in has established nothing about the account's
    // access — and the next step for it is a person, not a session. Answered as `unknown` with the
    // run attached, so the caller raises the handoff rather than "this project has no session".
    if (needsHumanFor(availability)) {
      return { ...unknownSession('', 'no Expo account is signed in'), sessionId: null, failure: availability };
    }
    const available = availability.spawnError ? null : parseAvailabilityJson(availability.stdout);
    return {
      state: 'none',
      sessionId: null,
      platform: null,
      status: null,
      available,
      failure: null,
      reason:
        available === false
          ? 'EAS Simulator is not enabled on this account, so no session can be started for this project'
          : `no ${CLOUD_SESSION_ENV_FILE} names a session, so this project has not started one`,
    };
  }

  const result = await runEasAsync(cli, buildSessionGetArgs(sessionId), { projectRoot, timeoutMs });
  if (result.spawnError) {
    return unknownSession(sessionId, `"${result.command}" could not be run (${result.spawnError})`);
  }
  // A binary that is not the EAS CLI has said nothing about the session, and reading its exit code
  // as "the session is over" would send a caller to start a second billed one (`wrapperCrash.ts`).
  if (looksLikeWrapperCrash({ tool: 'eas', ...result })) {
    return unknownSession(
      sessionId,
      `the "eas" at ${result.binPath} exited ${result.exitCode} and printed nothing an eas run would print, so it may not be the EAS CLI`
    );
  }
  if (result.exitCode !== 0) {
    return {
      ...unknownSession(
        sessionId,
        `"${result.command}" exited ${result.exitCode ?? 'on a signal'}${
          firstLine(result.stderr) ? `: ${firstLine(result.stderr)}` : ''
        }`
      ),
      failure: result,
    };
  }

  const session = parseSessionJson(result.stdout);
  if (!session) {
    return unknownSession(sessionId, `"${result.command}" answered with JSON this CLI cannot read`);
  }
  if (!isActiveSessionStatus(session.status)) {
    return {
      state: 'inactive',
      sessionId: session.id ?? sessionId,
      platform: session.platform,
      status: session.status,
      available: true,
      failure: null,
      reason: `session ${session.id ?? sessionId} is ${session.status ?? 'in an unreported state'}, not ${ACTIVE_SESSION_STATUS}`,
    };
  }

  return {
    state: 'active',
    sessionId: session.id ?? sessionId,
    platform: session.platform,
    status: session.status,
    available: true,
    failure: null,
    reason: null,
  };
}

/** Open a URL on the cloud simulator. Never throws for a verb that ran and refused. */
export function openUrlOnCloudSimulatorAsync({
  url,
  platform,
  ...options
}: CloudRunOptions & { url: string; platform: CloudPlatform }): Promise<CloudRunResult> {
  return runCloudVerbAsync(buildCloudOpenUrlArgs({ url, platform }), options);
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
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync(cli.command, args, {
    cwd: projectRoot,
    timeoutMs,
  });
  return {
    command: ['eas', ...args].join(' '),
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
  const start = `npx eas simulator:start --platform ios --type agent-device --non-interactive --name "exagent navigate"`;

  if (probe.available === false) {
    const error = new CommandError(
      'CLOUD_SIMULATOR_UNAVAILABLE',
      [
        'EAS Simulator is not enabled on this account, so there is no cloud simulator to open the link on.',
        `Why: ${probe.reason ?? 'the availability check answered that the feature is off for this account'}. It is a limited-access EAS feature that is still rolling out, so it is not a thing this command can turn on.`,
        `How: open the link on a local device instead — boot a simulator or attach a device and run this command again — or hand the URL to whatever can open it with "npx exagent navigate <route> --print-url".`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent navigate / --print-url';
    return error;
  }

  const error = new CommandError(
    'NO_CLOUD_SIMULATOR_SESSION',
    [
      'No EAS Simulator session is running for this project, so there is no cloud simulator to open the link on.',
      `Why: ${probe.reason ?? 'nothing named a live session'}. A cloud simulator is a session that is started, driven and stopped — unlike a local simulator, there is nothing to find that somebody else left booted.`,
      `How: start one with "${start}", then run this command again. The session bills until it is stopped, so end it with "npx eas simulator:stop" when the run is done. To open the link somewhere this CLI does not drive, "npx exagent navigate <route> --print-url" prints the URL and asks for no device.`,
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
          : 'Nothing on this machine could be asked.'
      }`,
      `How: run "npx eas simulator:get --json" to see what the CLI says, and check that the "eas" being run is the EAS CLI. Then run this command again, or open the URL elsewhere with "npx exagent navigate <route> --print-url".`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx eas simulator:get --json';

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
  error.suggestedCommand = `npx exagent navigate / --cloud --${session}`;
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
  error.suggestedCommand = 'npx exagent navigate / --cloud --ios';
  return error;
}

/**
 * The failure for a cloud run against a dev server no cloud simulator can reach.
 *
 * The one precondition that differs from every local backend, and the reason it is refused rather
 * than attempted: `exp://127.0.0.1:<port>` names the loopback of whatever resolves it, and on a
 * machine in EAS's datacenter that is a port nothing listens on — the same shape as the Android
 * emulator finding of llp/0005 §The device's loopback is not this machine's, with no `adb reverse`
 * available to fix it. A LAN address is no better: the session is not on this network.
 */
export function cloudNeedsTunnelError(url: string, hostType: string | null): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER',
    [
      `The dev server is only reachable from ${hostType === 'localhost' ? 'this machine' : 'this network'}, so a cloud simulator cannot load ${url} and nothing was opened.`,
      `Why: the URL carries a ${hostType ?? 'local'} host, and the simulator runs on EAS infrastructure — ${hostType === 'localhost' ? 'that host is the loopback of whatever resolves it, which there is a machine in a datacenter' : 'that address is on this network and the session is not'}. Opening it would land the app on an error screen with the device tool reporting success, which is the class of false green this command exists to remove.`,
      `How: restart the dev server with a tunnel — "npx exagent dev --detach --tunnel" — and run this command again. A tunnel serves the same dev server from any network, which is the one address a cloud simulator can use.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev --detach --tunnel';
  return error;
}

/**
 * The failure for a device verb that ran and did not work.
 *
 * Three things folded into one place, because all three are about a subprocess this CLI cannot
 * verify: a binary that was never the EAS CLI is named as such rather than quoted (`wrapperCrash`),
 * a signed-out account becomes the needs-human handoff and exit `7` rather than a plain failure,
 * and anything else quotes what the tool printed.
 */
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
        `How: install the EAS CLI with "npm install -g eas-cli", or add it to the project with "npm install --save-dev eas-cli", then run this command again.`,
      ].join('\n')
    );
  }

  const wrapperCrash = looksLikeWrapperCrash({ tool: 'eas', ...result });
  const detail = wrapperCrash
    ? wrapperCrashDetail({ tool: 'eas', exitCode: result.exitCode }, result.binPath ?? 'eas')
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
 * Named rather than approximated. `eas simulator:stop` ends the **session** — the whole remote
 * machine — and running it for `runtime:stop`, which stops one app and leaves the device up, would
 * perform a much larger act than the one that was asked for and report it as that one.
 */
export function cloudVerbNotSupportedError(action: string): CommandError {
  const error = new CommandError(
    'CLOUD_SIMULATOR_UNSUPPORTED',
    [
      `${action} is not something this CLI can do on a cloud simulator, so nothing ran.`,
      `Why: the controller that drives an EAS Simulator session has verbs for opening a link and taking a picture, and none for ending one app on the device. "eas simulator:stop" ends the whole session — the remote machine and everything on it — which is a larger act than the one asked for here, and doing it under this name would report a session teardown as an app that was stopped.`,
      `How: to put the app back into a known state, open a route on it again with "npx exagent navigate / --cloud". To end the session itself, and its billing, run "npx eas simulator:stop".`,
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
      'The EAS CLI is not available, so a cloud simulator cannot be driven from here.',
      'Why: no "eas" binary was found in node_modules/.bin or on PATH, and an EAS Simulator session is created and driven entirely through it.',
      'How: install it once with "npm install -g eas-cli", or add it to the project with "npm install --save-dev eas-cli", then run this command again.',
    ].join('\n')
  );
  error.suggestedCommand = 'npm install -g eas-cli';
  return error;
}

function unknownSession(sessionId: string, reason: string): CloudSessionProbe {
  return {
    state: 'unknown',
    sessionId: sessionId || null,
    platform: null,
    status: null,
    available: null,
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
