// @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
// @ref llp/0021-honest-reports.rfc.md §The rules
// Reloading the app on an EAS Simulator session, which is a different act from reloading it here.
//
// **The premise this replaces.** `runtime:reload --cloud` shipped believing the cloud changed only
// the fallback: "the dev-server broadcast reaches a cloud session already — a cloud session has to
// reach that dev server through a tunnel to be running the bundle at all". Live, the tunnel carried
// the **bundle** and not the client command socket. The broadcast reached nobody, the fallback
// force-stopped the app with `close`, and the relaunch was refused — leaving a billed session with
// nothing running on it and the controller's own session ended
// [observed — live staging, 2026-08-26, S12; hit again, 2026-08-27, with "1 app connected"
// on screen].
//
// **What it does instead.** Two controller verbs, both of them the controller's own answer to this
// exact question:
//
//     eas simulator:exec npx agent-device@latest open <app-id> --platform ios --relaunch
//     eas simulator:exec npx agent-device@latest open <url>      --platform ios
//
// `--relaunch` "terminate[s] the app process before launching it", so the force-stop and the
// restart are one call and nothing has to `close` first — `close` is what ends the controller's
// session [observed — `agent-device help open`, 0.20.10; and the controller's own React Native guide
// says "Do not use agent-device reload. Use open --relaunch for native startup reset."].
//
// **Why two verbs and not the shell-plus-link form.** `open <app-id> <url> --relaunch` is documented
// and it killed the app: Expo Go cold-launched with a dev-server URL died on its own updates
// database, `UNIQUE constraint failed: updates.scope_key, updates.commit_time`, on screen, twice out
// of two [observed — 2026-08-27, live cloud session]. Restarting the shell with no URL and then
// deep-linking the route into it is the sequence that loaded the project, with a fresh `Bundled`
// line on the dev server and the app's debugger target back. Neither verb hands the link to the
// system while nothing is running, so the "Open in 'Expo Go'?" dialog (S10) does not appear.
//
// **The URL is the one that opens the app**, resolved by the same function `navigate --cloud` uses
// (`src/navigate/openRoute.ts`): the manifest-derived tunnel host, never `exp+<slug>://<host>`. And
// the tunnel precondition is checked **before** anything is asked of the device, which is the other
// half of the S12 fix — a run that stops the app and only then discovers the URL is unusable is how
// the app was stranded.

import {
  cloudNeedsTunnelError,
  openUrlOnCloudSimulatorAsync,
  readControllerError,
  readHeldSessionName,
  type CloudPlatform,
  type CloudRunResult,
} from '../../device/cloudSimulator';
import { resolveDeviceAsync, type NavigateDevice } from '../../navigate/device';
import { resolveRouteUrlAsync } from '../../navigate/openRoute';
import { readConfiguredAppId, resolveAppId } from '../appId';
import { debugEvent } from './events';
import type { ReloadAttempt } from './reloadAsync';
import type { ReloadOptions } from './resolveOptions';

/** What one cloud reload amounted to. */
export interface CloudReloadResult {
  attempt: ReloadAttempt;
  /** The session the verb was sent to, or null when none was resolved. */
  device: NavigateDevice | null;
  /** The URL the app was relaunched on, or null when nothing was opened. */
  url: string | null;
}

/**
 * Reload the app on this project's cloud simulator session, by relaunching it on the served bundle.
 *
 * @throws {CommandError} `CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER` for a dev server the session
 * cannot reach, `DEEP_LINK_UNRESOLVED` for a project with no resolvable URL, and whatever
 * {@link resolveDeviceAsync} throws when this project has no session to drive — all of them
 * **before** the app is touched, so a refusal never leaves it closed.
 */
export async function reloadOnCloudSimulatorAsync(
  projectRoot: string,
  options: ReloadOptions,
  { devServerUrl, targetAppIds }: { devServerUrl: string; targetAppIds: string[] }
): Promise<CloudReloadResult> {
  // The same resolution `navigate --cloud` runs, which is the one that has been seen to open an app
  // on a live session [observed — 2026-08-26, exit 0]. `routeCheck: false` because the caller
  // checked the route already, and checking it twice would walk the routes twice.
  const resolved = await resolveRouteUrlAsync(projectRoot, {
    route: options.route ?? '/',
    platform: options.platform,
    scheme: options.scheme,
    appId: options.appId,
    devServerUrl: options.devServerUrl,
    routeCheck: false,
    command: 'runtime:reload',
    cloud: 'required',
  });

  // @ref src/device/cloudSimulator.ts §cloudNeedsTunnelError — before the device, not after it.
  // A `127.0.0.1` or LAN host in the link resolves to something that is not this machine, and there
  // is no `adb reverse` for a session in a datacenter. Refusing here is what stops the relaunch from
  // terminating an app it cannot start again.
  if (resolved.hostType === 'localhost' || resolved.hostType === 'lan') {
    throw cloudNeedsTunnelError(resolved.url, resolved.hostType);
  }

  const device = await resolveDeviceAsync(options.platform, {
    url: resolved.url,
    devServerRunning: resolved.devServerReachable,
    cloud: 'required',
    projectRoot,
  });

  // @see ../appId — the same rule the local device method applies: the dev server outranks the app
  // config, because the config says what a build of this project would be called and the dev server
  // says what is running. The targets come from the probe the caller already made.
  const appId = resolveAppId({
    platform: device.platform,
    appIdOverride: options.appId,
    targetAppIds,
    configured: readConfiguredAppId(projectRoot, device.platform),
  }).appId;

  // Step one: restart the app, **with no URL on the launch**.
  //
  // The URL is deliberately not part of this verb, and that is a live finding rather than a
  // preference. `open host.exp.Exponent exp://<host>/--/? --relaunch` cold-launched Expo Go with
  // the dev-server URL and Expo Go died on its own updates database every time:
  // `SQLiteGetResultsError: (code: 19; extendedCode: 2067; message: UNIQUE constraint failed:
  // updates.scope_key, updates.commit_time)`, on the screen, with the app unusable
  // [observed — 2026-08-27, twice, session `01a04378-bf7f-74d3-b9c9-7603b2ff27d3`, SDK 57 Expo Go
  // on an iOS cloud simulator]. Restarting the shell first and *then* sending the link is the
  // sequence that loaded the project, and llp/0010 §Upstream asks records the Expo Go bug.
  const relaunch = async (session?: string): Promise<CloudRunResult> =>
    await openUrlOnCloudSimulatorAsync({
      projectRoot,
      // The app id **as** the thing being opened: this verb starts the shell and nothing else.
      url: appId,
      platform: device.platform as CloudPlatform,
      relaunch: true,
      session,
    });

  let boundSession: string | undefined;
  let restarted = await relaunch();
  debugEvent('cloud_relaunch', { exitCode: restarted.exitCode, url: resolved.url, appId });

  // @ref llp/0005 §Cloud simulator — S14. The one controller refusal whose remedy is in its own
  // message: it names the session holding the device, and binding this verb to that session is the
  // fix. Once, and never a second session: another session bills another machine.
  const held = controllerErrorOf(restarted);
  if (held?.code === 'DEVICE_IN_USE') {
    boundSession = readHeldSessionName(held.message) ?? undefined;
    if (boundSession != null) {
      restarted = await relaunch(boundSession);
      debugEvent('cloud_relaunch_bound', { session: boundSession, exitCode: restarted.exitCode });
    }
  }

  if (restarted.spawnError || restarted.exitCode !== 0) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: refusalReason(restarted, 'the app was not restarted'),
        // Not known, and null is what llp/0006 keeps for a fact a run does not have: `--relaunch`
        // terminates before it launches, so a refusal says nothing about whether the app is still
        // on the screen. `explainReloadFailure` says that in words rather than guessing here.
        leftAppStopped: null,
      },
      device,
      url: null,
    };
  }

  // Step two: the link, into the app that is now running. The same verb `navigate --cloud` runs.
  const linked = await openUrlOnCloudSimulatorAsync({
    projectRoot,
    url: resolved.url,
    platform: device.platform as CloudPlatform,
    session: boundSession,
  });
  if (linked.spawnError || linked.exitCode !== 0) {
    return {
      attempt: {
        method: 'device',
        ok: false,
        reason: refusalReason(
          linked,
          `the app was restarted and the device refused the link that puts it on this project, so ${appId} is running its own screen rather than the app`
        ),
        leftAppStopped: null,
      },
      device,
      url: null,
    };
  }

  return {
    attempt: {
      method: 'device',
      ok: true,
      reason: `${restarted.command} restarted ${appId}, then ${linked.command} opened ${resolved.url} on it`,
      leftAppStopped: null,
    },
    device,
    url: resolved.url,
  };
}

/** The controller's own refusal, when it is the controller that refused. */
function controllerErrorOf(result: CloudRunResult): { code: string; message: string } | null {
  return readControllerError(`${result.stderr}\n${result.stdout}`);
}

/**
 * Why the relaunch did not happen, in the words of whichever layer said no.
 *
 * The controller refusing and the bridge failing are different facts (llp/0005 §Cloud simulator), and a reason that flattened them would send a reader to
 * check a command that was already correct.
 */
function refusalReason(result: CloudRunResult, what: string): string {
  if (result.spawnError) {
    return `${what}: "${result.command}" could not be run (${result.spawnError})`;
  }
  const controller = controllerErrorOf(result);
  if (controller) {
    return `${what}: the session's controller answered ${controller.code} — "${controller.message}" — so the command reached the device and the device is what said no (${result.command})`;
  }
  const said = firstLine(result.stderr) || firstLine(result.stdout);
  return `${what}: "${result.command}" exited ${result.exitCode ?? 'on a signal'}${said ? `: ${said}` : ''}`;
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
}
