// @ref llp/0005-runtime-loop-tools.rfc.md §One preflight for the runtime family
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The one question every `runtime:*` command asks before it does any work: is there anything to
// talk to, and what is it.
//
// **Why one module.** Six commands need the same two facts — a dev server, and something connected
// to it — and each one used to establish them its own way. `runtime:eval` read `/json/list` three
// times (discovery, the device index, the "is an app there" check) and any two of those reads could
// disagree about which app was attached. `runtime:tree` asked its bundle gate *first*, so a run with
// no app spent the gate's whole budget before it could say the obvious thing. `runtime:reload` wrote
// its own "no dev server" prose, with a different `How:` line from the identical failure next door.
// The refusals were the same failure in four voices, and the *order* of the checks differed per
// command, which is what makes a family feel like four tools.
//
// **What it answers with.** The populated connection — the dev server URL, how it was found, the
// debugger targets, and the platform-scoped subset a command may read — so that nothing downstream
// resolves any of it again. Or one refusal, in one shape:
//
//   What  which list is empty, and on which dev server
//   Why   no app is connected, **or** no dev server is running there — never the two conflated
//   How   the ladder out, with `--cloud` kept on every command in it when the caller passed it
//
// **Two exit codes, and the difference is whether asking again can help** (llp/0010 §Exit codes).
// No dev server is `1`: nothing answered, and nothing this CLI can do in a second changes that, so
// `1`'s promise — "running the same line again changes nothing" — holds. An empty *target* list is
// `22`, and it is the one refusal here where that promise was false: a reloading app is absent from
// `/json/list` for about half a second, and `runtime:tree` run straight after a reload reported "no
// app" four times in five, recovering on a plain retry every time [friction run 9, F141]. So the
// question is asked for the length of that window before it is answered, and a list that is still
// empty afterwards is reported as inconclusive rather than as a call to fix.

import { EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import type { NavigatePlatform } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import type { CdpTarget } from './cdpClient';
import {
  APP_RECONNECT_GRACE_MS,
  discoverDevServerAsync,
  howToNameTheDevServer,
  normalizeDevServerUrl,
  probeDevServerAsync,
  type DevServerSource,
} from './devServer';
import {
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
  type DeviceNameIndex,
} from './targetPlatform';

/**
 * Where a runtime command was run, when it was run in a project.
 *
 * Only used to find the dev server: a project knows where its own dev server listens, and a command
 * that has no project to ask falls back to scanning ports.
 */
export interface RuntimeContext {
  projectRoot?: string | null;
}

/**
 * What a command cannot do its job without.
 *
 * - **`debugger-target`** — a JavaScript runtime to read or drive: `runtime:eval`, `runtime:errors`,
 *   `runtime:tree`, `runtime:tap`, `runtime:type`. Nothing they do means anything without one.
 * - **`dev-server`** — a dev server and nothing more. `runtime:reload` is here because it can
 *   *start* an app that is not running, so "no app is connected" is a rung of its ladder rather
 *   than a refusal — but with no dev server there is no bundle to reload onto, and stopping the app
 *   would replace a stale screen with no screen.
 * - **`optional`** — neither. `runtime:stop` acts on a *device*, and an app can be running with no
 *   dev server behind it at all; the dev server is its strongest evidence for **which** app is
 *   running and never a precondition (llp/0010 §Other gates, in brief
 *   is success).
 */
export type RuntimeNeed = 'debugger-target' | 'dev-server' | 'optional';

/** The dev server, and what is connected to it, read once. */
export interface RuntimeConnection {
  /** The dev server origin that answered, or the one that was tried and did not. */
  devServerUrl: string;
  /** Which discovery step produced it: `flag`, `lock`, `log`, `default` or `scan`. */
  devServerSource: DevServerSource;
  /** Whether the caller named the dev server, with `--dev-server-url` or `--port`. */
  named: boolean;
  /** The dev server answered its debugger target list. */
  reachable: boolean;
  /** Why it did not, or null when it did. */
  unreachableReason: string | null;
  /** Every debugger target it listed, unscoped — what the *report* owes a reader. */
  targets: CdpTarget[];
  /**
   * The targets this command may read: {@link targets} scoped to the platform the caller named.
   *
   * The same list when no platform was named. Kept apart from {@link targets} because a command
   * told `--android` must not be answered by the iOS simulator on the same dev server (F51), while
   * its report still has to say that the iOS one is there.
   */
  appTargets: CdpTarget[];
  /** What this machine's device tools reported, when a platform had to be resolved. */
  deviceIndex?: DeviceNameIndex;
  /** The platform the caller named, or undefined. */
  platform?: NavigatePlatform;
}

/**
 * The counts a refusal carries, so an agent branches on numbers rather than on prose.
 *
 * @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — the key set never varies,
 * and a fact the run does not have is null. `commandSocketClients` is null for every command that
 * never opens the dev server's `/message` socket, which is all of them but `runtime:reload`.
 */
export interface RuntimePreflightData {
  devServerUrl: string;
  devServerReachable: boolean;
  /** How many runtimes `GET /json/list` named. */
  debuggerTargets: number;
  /** How many clients `getpeers` named on the client command socket, or null when nothing asked. */
  commandSocketClients: number | null;
  /** The platform the caller asked for, or null when they named none. */
  platform: string | null;
}

export interface RuntimePreflightOptions {
  need: RuntimeNeed;
  /** The `--dev-server-url`/`--port` the caller named, or null to discover one. */
  devServerUrl: string | null;
  /** Require an app on this platform instead of any app. */
  platform?: NavigatePlatform;
  /**
   * The caller passed `--cloud`, so every command in the ladder keeps the flag.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator — F5x and S5. A
   * suggestion that drops it sends a caller to a local simulator their machine has not got, and one
   * that drops `--tunnel` starts a dev server the session cannot reach.
   */
  cloud?: boolean;
  /**
   * How long to keep asking while the target list is empty, in milliseconds.
   *
   * Unset is {@link APP_RECONNECT_GRACE_MS} for a command that needs a runtime and zero for one that
   * does not, which is the default a caller almost never has reason to override.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — F39, and **F141.** The grace
   * was `runtime:errors`' alone, because F39 was found on the `reload → errors` chain the CLI's own
   * follow-ups print. `runtime:tree` asks the identical question and asked it once: run straight
   * after a reload it read the list inside the app's re-registration window, found it empty, and
   * reported "no app is connected" — four times in five, recovering on a plain retry every time
   * [observed — friction run 9, F141]. The window belongs to the *question*, not to the command.
   */
  retryMs?: number;
  /**
   * What this machine's device tools reported, instead of asking them.
   *
   * Commands never pass one — reading it from the targets that were just listed is the point of the
   * preflight. It is here for a caller that already has the index, and for the tests, which must
   * not spawn `simctl` and `adb` to ask about a platform.
   */
  deviceIndex?: DeviceNameIndex;
}

/** How often the target list is re-read while the grace period runs. */
const APP_RECONNECT_POLL_MS = 250;

/**
 * Resolve the connection a runtime command needs, or refuse in the family's one shape.
 *
 * @throws {CommandError} `NO_DEV_SERVER` when nothing answers and the command needs one,
 * `NO_APP_CONNECTED` when the dev server runs and names no runtime this command may read.
 */
export async function preflightRuntimeAsync(
  {
    need,
    devServerUrl,
    platform,
    cloud = false,
    retryMs,
    deviceIndex: knownDeviceIndex,
  }: RuntimePreflightOptions,
  context: RuntimeContext = {}
): Promise<RuntimeConnection> {
  // The default belongs to the `need`, not to the command (F141): every command that cannot work
  // without a runtime waits out the window a reloading app is invisible in, and no command that can
  // work without one is made to wait for it.
  const retryBudgetMs = retryMs ?? (need === 'debugger-target' ? APP_RECONNECT_GRACE_MS : 0);
  const named = devServerUrl != null;
  const discovery = await discoverDevServerAsync(devServerUrl ?? undefined, {
    projectRoot: context.projectRoot ?? undefined,
  });
  const url = normalizeDevServerUrl(discovery.devServerUrl);

  let reachable = discovery.reachable;
  let targets = discovery.targets;
  let unreachableReason = discovery.reason ?? null;

  // Only an empty list is worth asking again about: an unreachable dev server does not become
  // reachable by re-reading it within three seconds, and a list with something in it is an answer.
  if (reachable && targets.length === 0 && retryBudgetMs > 0) {
    const deadline = Date.now() + retryBudgetMs;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, APP_RECONNECT_POLL_MS));
      const probe = await probeDevServerAsync(url);
      reachable = probe.reachable;
      targets = probe.targets;
      unreachableReason = probe.reason ?? null;
      if (!reachable || targets.length > 0) {
        break;
      }
    }
  }

  const base: RuntimeConnection = {
    devServerUrl: url,
    devServerSource: discovery.source,
    named,
    reachable,
    unreachableReason: reachable ? null : unreachableReason,
    targets,
    appTargets: targets,
    platform,
  };

  if (!reachable) {
    if (need === 'optional') {
      return { ...base, targets: [], appTargets: [] };
    }
    throw noDevServerError({
      devServerUrl: url,
      reason: unreachableReason,
      named,
      cloud,
      platform,
      reloadable: need === 'dev-server',
    });
  }

  // The device index is built from the list that was already read, so the platform this command was
  // told about is the platform of the app it reads — the two steps cannot disagree about which app
  // that is (F51, F53). It costs a subprocess only when a target's platform cannot be read off its
  // application id or its device name, which for Expo Go is never.
  const deviceIndex =
    platform == null
      ? undefined
      : (knownDeviceIndex ?? (await buildDeviceNameIndexIfNeededAsync(targets)));

  // Scoped for **every** caller that named a platform, whatever it needs, and that is F101. This
  // used to sit below the `need` branch, so `appTargets` — documented as the list a command may read
  // — was the unscoped list for `runtime:stop` (`optional`) and `runtime:reload` (`dev-server`).
  // Live consequence: `runtime:stop --android` took the first application id the dev server listed,
  // which was the iOS one, and force-stopped a package that is not installed on Android while
  // reporting `stopped: true, wasRunning: true`. Reading the other platform's app is F51 whether or
  // not the command also required one to exist.
  const scoped = platform == null ? null : scopeTargets(targets, platform, deviceIndex!);
  const connection: RuntimeConnection = scoped
    ? { ...base, appTargets: scoped.matched, deviceIndex }
    : base;

  if (need !== 'debugger-target') {
    return connection;
  }

  if (targets.length === 0) {
    throw noAppConnectedError({ devServerUrl: url, retryMs: retryBudgetMs, cloud, platform });
  }

  // Only a command that *requires* a runtime refuses on an empty scope. For `reload` an empty scope
  // is a rung of its ladder — it can start the app — and for `stop` it is the state llp/0010 §The
  // seventh and eighth calls a success.
  if (scoped && scoped.matched.length === 0) {
    throw noAppOnPlatformError(url, platform!, scoped, cloud);
  }
  return connection;
}

/**
 * The ladder out of "there is nothing to talk to", as one `How:` sentence.
 *
 * One ladder for the whole family, and the reason it is a function rather than a string per command:
 * the rungs are the same — a dev server, then an app on a device, then the wait that proves both —
 * and six copies of them drifted into six different first steps, one of which named a keypress in a
 * terminal a detached dev server does not have (F48-5).
 */
export function reachTheAppLadder({
  state,
  cloud,
  platform,
}: {
  state: 'no-dev-server' | 'no-app';
  cloud: boolean;
  platform?: NavigatePlatform;
}): string {
  // Carried onto every command in the ladder that takes it. `dev` has no `--cloud`; what a cloud
  // session needs from a dev server is a tunnel, because a datacenter cannot reach this loopback.
  const cloudFlag = cloud ? ' --cloud' : '';
  const platformFlag = platform == null ? '' : ` --${platform}`;
  const navigate = `${PROGRAM_PREFIX} navigate /${platformFlag}${cloudFlag}`;
  // `dev` takes the platform too, and dropping it here was F142's sibling: a bare `dev` asks the
  // plan engine to pick a platform, and on a Mac it picks iOS — so the first rung of the ladder out
  // of "no android app is connected" started a dev server for the other one.
  const dev = `${PROGRAM_PREFIX} dev --detach${cloud ? ' --tunnel' : ''}${platformFlag}`;

  if (state === 'no-dev-server') {
    return `start one with "${dev}" in the project root and open the app with "${navigate}", then run this command again.`;
  }
  return `open the app on a device or simulator with "${navigate}" — or, when the device is a phone or a cloud simulator this machine cannot drive, get the URL to open on it with "${PROGRAM_PREFIX} navigate /${platformFlag} --print-url". Then let "${PROGRAM_PREFIX} smoke${cloudFlag}" wait for the bundle and the app together, and run this command again.`;
}

/** Attach the observed counts to a refusal, in the shape the whole family uses. */
function withData(
  error: CommandError,
  data: Partial<RuntimePreflightData> & { devServerUrl: string }
): CommandError {
  error.data = {
    devServerUrl: data.devServerUrl,
    devServerReachable: data.devServerReachable ?? false,
    debuggerTargets: data.debuggerTargets ?? 0,
    commandSocketClients: data.commandSocketClients ?? null,
    platform: data.platform ?? null,
  } satisfies RuntimePreflightData;
  return error;
}

/**
 * Nothing answered on the dev server this command was going to use.
 *
 * Kept apart from {@link noAppConnectedError} because the recoveries are opposite: one starts a dev
 * server, the other opens an app on a dev server that is already running. An agent that could not
 * tell them apart would restart a healthy dev server.
 */
export function noDevServerError({
  devServerUrl,
  reason,
  named,
  cloud = false,
  platform,
  reloadable = false,
}: {
  devServerUrl: string;
  reason: string | null;
  named: boolean;
  cloud?: boolean;
  platform?: NavigatePlatform;
  /** The command reloads the app, which is what makes a missing dev server actively harmful. */
  reloadable?: boolean;
}): CommandError {
  const error = new CommandError(
    'NO_DEV_SERVER',
    [
      `No Expo dev server answered at ${devServerUrl}, so there is ${reloadable ? 'nothing to reload the app onto' : 'no app runtime to talk to'}.`,
      `Why: the request for the debugger target list failed (${reason ?? 'no answer'}).${
        reloadable
          ? ' A reload makes the app fetch its bundle again, and without a dev server that fetch has nowhere to go — the app would be left on a loading screen rather than on the fixed code.'
          : ''
      }`,
      `How: ${reachTheAppLadder({ state: 'no-dev-server', cloud, platform })} ${howToNameTheDevServer(named)}`,
    ].join('\n')
  );
  // The same command the How: names. They disagreed — `npx expo start` in one and `npx @expo/agent-cli dev`
  // in the other — which is one failure telling a reader two things [observed — friction run 5].
  error.suggestedCommand = `${PROGRAM_PREFIX} dev --detach${cloud ? ' --tunnel' : ''}${platform == null ? '' : ` --${platform}`}`;
  return withData(error, { devServerUrl, devServerReachable: false, platform });
}

/**
 * The dev server is running and nothing has attached a debugger to it.
 *
 * **Exit 22, not 1** — @ref llp/0010-agent-conventions.rfc.md §An empty target list is
 * inconclusive, F141. `1` promises that running the same line again changes nothing, and this is the
 * one refusal of the family where that promise is false: a reloading app is absent from
 * `/json/list` for about half a second, so an empty list can describe a runtime on its way back.
 * The wait above is what makes the code honest either way — 22 is reported only once the reconnect
 * window has been waited out, so it says "asked for as long as it was worth asking".
 */
export function noAppConnectedError({
  devServerUrl,
  retryMs = 0,
  cloud = false,
  platform,
}: {
  devServerUrl: string;
  retryMs?: number;
  cloud?: boolean;
  platform?: NavigatePlatform;
}): CommandError {
  const error = new CommandError(
    'NO_APP_CONNECTED',
    [
      `The Expo dev server at ${devServerUrl} is running, but no app is connected to it.`,
      `Why: its debugger target list (${devServerUrl}/json/list) is empty${retryMs > 0 ? `, and it was still empty ${retryMs}ms later` : ''}, so there is no JavaScript runtime to talk to. Either no app has been opened on it, or one is re-registering — a reloading app is absent from that list for about half a second, which is the window this wait was for.`,
      // Not "press i in the dev server's terminal": a dev server this CLI started with --detach has
      // no terminal to press a key in, and a driving agent has no keyboard for one that has
      // [friction run 5, F48-5]. `navigate` is the command that does the same thing.
      `How: ${reachTheAppLadder({ state: 'no-app', cloud, platform })} If the app was mid-reload, running this command again is the whole recovery.`,
    ].join('\n')
  );
  // 22 rather than 1: the CLI worked and could not *conclude*, which is what this band is for.
  error.exitCode = EXIT_OUTCOME_TIMEOUT;
  error.suggestedCommand = `${PROGRAM_PREFIX} navigate /${platform == null ? '' : ` --${platform}`}${cloud ? ' --cloud' : ''}`;
  return withData(error, { devServerUrl, devServerReachable: true, platform });
}

/**
 * The failure for a dev server whose apps are all on some other platform, or unreadable.
 *
 * Two shapes, because the next steps differ. Apps on another platform means `--android` was asked
 * of a machine running the iOS app, and the fix is to open the Android one. Apps nobody could place
 * means the evidence ran out, and the honest answer is to say which evidence and stop — the whole
 * of F51 was this command answering from a runtime it had not identified.
 */
function noAppOnPlatformError(
  devServerUrl: string,
  platform: NavigatePlatform,
  scoped: { otherPlatform: { platform: NavigatePlatform }[]; undetermined: unknown[] },
  cloud: boolean
): CommandError {
  const others = scoped.otherPlatform.map((entry) => entry.platform);
  const uniqueOthers = [...new Set(others)];

  const error = new CommandError(
    'NO_APP_CONNECTED',
    uniqueOthers.length > 0
      ? [
          `No ${platform} app is connected to the Expo dev server at ${devServerUrl}, so there is nothing on ${platform} to read.`,
          `Why: its debugger target list names ${others.length} app${others.length === 1 ? '' : 's'}, and ${others.length === 1 ? 'it is' : 'they are'} on ${uniqueOthers.join(' and ')}${scoped.undetermined.length > 0 ? `, plus ${scoped.undetermined.length} whose platform nothing in the target names` : ''}. Reading one of those would answer a question about ${uniqueOthers[0]} while reporting it as ${platform}.`,
          `How: open the app on ${platform} with "${PROGRAM_PREFIX} navigate / --${platform}${cloud ? ' --cloud' : ''}", then run this command again. Drop --${platform} to read whichever app is connected.`,
        ].join('\n')
      : [
          `No app connected to the Expo dev server at ${devServerUrl} could be shown to be running on ${platform}.`,
          `Why: its debugger target list names ${scoped.undetermined.length} app${scoped.undetermined.length === 1 ? '' : 's'}, and nothing in ${scoped.undetermined.length === 1 ? 'its target' : 'their targets'} says which platform ${scoped.undetermined.length === 1 ? 'it is' : 'they are'} on — the dev server does not label them, so this is read from the device name and the app id. A development build on a physical device can look like this.`,
          `How: drop --${platform} to read the app that is connected, which is the honest command when only one is. To have the platform recognised, connect the device this machine's device tools can see ("adb devices -l", "xcrun simctl list devices booted").`,
        ].join('\n')
  );
  error.suggestedCommand =
    uniqueOthers.length > 0
      ? `${PROGRAM_PREFIX} navigate / --${platform}${cloud ? ' --cloud' : ''}`
      : `${PROGRAM_PREFIX} status --json`;
  return withData(error, {
    devServerUrl,
    devServerReachable: true,
    debuggerTargets: others.length + scoped.undetermined.length,
    platform,
  });
}
