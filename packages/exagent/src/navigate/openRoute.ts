// @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route
// Opening a route on a device, with none of the reporting.
//
// This is `exagent navigate` with its output removed, extracted so `exagent smoke` can perform the
// same act as part of a larger answer. The alternative was for `smoke` to compose the same six
// steps itself — the route check, the scheme resolution, the Expo Go decision, the device probe,
// the deep link, the exit code — and a second composition of those steps is a second place for the
// findings of llp/0005 to be forgotten: the `/--/?` marker the root route needs, the route table
// that has to be consulted *before* the link, the dev server that is found rather than assumed.
//
// So the composition lives here and both callers use it. `navigateAsync` is this function plus the
// event, the follow-ups and the two output channels; `smoke` is this function inside a phase.

import { event as cliEvent } from '../events';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { readProjectRoutesAsync } from '../project/routes';
import { readConfiguredAppId, resolveAppId } from '../runtime/appId';
import { stopAppOnDeviceAsync } from '../runtime/appProcess';
import {
  discoverDevServerAsync,
  probeDevServerAsync,
  type DevServerSource,
} from '../runtime/devServer';
import { buildDeviceNameIndexAsync, scopeTargets } from '../runtime/targetPlatform';
import { CommandError } from '../utils/errors';
import { reverseLoopbackPortAsync, type ReverseResult } from './adbReverse';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
} from './deepLink';
import { resolveDeviceAsync, type NavigateDevice, type NavigatePlatform } from './device';
import { debugEvent } from './events';
import { checkRoute, routeNotFoundError, type RouteCheckJson, type RouteCommand } from './routeCheck';
import { decideExpoGoTarget } from './target';

export interface OpenRouteOptions {
  /** Route as the caller wrote it. */
  route: string;
  /** Platform to open on, or undefined for whichever device is booted. */
  platform?: NavigatePlatform;
  /** URL scheme, instead of the one read from the project's config. */
  scheme?: string;
  /** Application id, for scoping the Android intent. */
  appId?: string;
  /** The `--dev-server-url` the caller named, or null when it is still to be found. */
  devServerUrl: string | null;
  /** Check the route against the project's routes first, cleared by `--no-route-check`. */
  routeCheck: boolean;
  /**
   * The command a route failure suggests re-running.
   *
   * The `Try:` line is what a driving agent runs next, so it has to be the command the caller was
   * running rather than always `navigate` (friction run 5).
   */
  command?: RouteCommand;
  /**
   * How long to wait for an app on this platform to register a debugger target, in milliseconds.
   *
   * Zero — the default — opens the link and reports what the device tool said, which is what a
   * caller with a connection phase of its own (`smoke`) wants. `navigate` passes a budget, because
   * `am start` exiting 0 says only that the *intent* was delivered: the Android run this exists for
   * landed on Expo Go's error screen and reported success [friction run 6, F50].
   */
  confirmAttachMs?: number;
  /**
   * Stop the app and open the link again when the first one did not attach.
   *
   * Only reached on Android, and only once. Expo Go's `ErrorActivity` does not retry the manifest
   * fetch, so a second intent into a stuck instance changes nothing — the process has to go first.
   */
  recoverStuckApp?: boolean;
}

/** Everything one open amounts to, with nothing printed. */
export interface OpenRouteResult {
  route: string;
  /** URL that was opened on the device. */
  url: string;
  devServerUrl: string;
  devServerSource: DevServerSource;
  /** How the URL was derived. */
  resolution: string;
  /** Why the target app was decided to be Expo Go or a development build. */
  target: string;
  platform: NavigatePlatform;
  deviceId: string;
  /** Simulator name, when the platform tool reported one. */
  deviceName?: string;
  appId: string | null;
  /** The device command that was run, for reproducing the step by hand. */
  command: string;
  /** Exit code of that command: non-zero means the device refused the deep link. */
  exitCode: number | null;
  /** What the device tool wrote, for a caller that reports it. */
  stdout: string;
  stderr: string;
  /** Whether the route was checked against the project's routes, and what the check said. */
  routeCheck: RouteCheckJson;
  /** Whether the target app was decided to be Expo Go. */
  isExpoGo: boolean;
  /**
   * What `adb reverse` did before the link, or null on a platform that needs none.
   *
   * @see ./adbReverse — why an Android link to a dev server on this machine cannot work without it.
   */
  reverse: ReverseResult | null;
  /** Whether an app of this platform was seen to attach afterwards. */
  attach: AttachCheck;
}

/** Whether the app was seen to connect to the dev server after the link was opened. */
export interface AttachCheck {
  /** Whether this run looked at all. False when the caller asked for no wait. */
  checked: boolean;
  /**
   * An app on this platform holds a debugger target on this dev server.
   *
   * Null exactly when {@link checked} is false. **Never assumed**: a link that was delivered and an
   * app that is running are different facts, and reporting the first as the second is F50.
   */
  confirmed: boolean | null;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
  /** How many debugger targets this platform had when the wait ended. */
  targets: number;
  /** Whether the app was stopped and the link opened a second time. */
  recovered: boolean;
  /** Why it is not confirmed, or null when it is. */
  reason: string | null;
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * @throws {CommandError} `ROUTE_NOT_FOUND` for a route the project has not got, checked before
 * anything is opened; `DEEP_LINK_UNRESOLVED` for a named dev server that does not answer or a
 * project with no resolvable scheme; and whatever {@link resolveDeviceAsync} throws when there is
 * no device.
 */
export async function openRouteAsync(
  projectRoot: string,
  options: OpenRouteOptions
): Promise<OpenRouteResult> {
  const { route, platform, scheme, appId } = options;

  const [devServer, config, nativeDirs, packageJson, routeTable] = await Promise.all([
    discoverDevServerAsync(options.devServerUrl ?? undefined, { projectRoot }),
    Promise.resolve(readProjectSchemeConfig(projectRoot)),
    readProjectNativeDirsAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
    readProjectRoutesAsync(projectRoot),
  ]);
  const devServerUrl = devServer.devServerUrl;

  // Before anything is opened, and before the device is even looked for. A route the project has
  // not got is the caller's own argument being wrong, and the recovery — the list of routes it
  // does have — costs one directory walk and needs neither a dev server nor a device. Leaving it
  // until after the link is open would put the app on the "Unmatched Route" screen first, which is
  // the state this check exists to prevent (llp/0005 §Verifying the route).
  const routeCheck = checkRoute({
    route,
    table: routeTable,
    enabled: options.routeCheck,
    isFullUrl: isFullUrlRoute(route),
  });
  debugEvent('route_checked', routeCheck);
  if (routeCheck.ok === false) {
    throw routeNotFoundError(route, routeTable, { platform, command: options.command });
  }

  // A named dev server that does not answer is a mistake worth stopping on, and the only case where
  // this command could still build a URL from it: the scheme of a development build needs no dev
  // server, so a `--dev-server-url` typo used to deep-link the device into an app with no bundle to
  // load and report exit 0. Discovery already probes the URL — `flag` is the one source whose
  // failure was not acted on.
  if (devServer.source === 'flag' && !devServer.reachable) {
    throw unreachableNamedDevServerError(devServerUrl, devServer.reason);
  }

  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );

  const target = decideExpoGoTarget({
    appIdOverride: appId,
    targetAppIds: devServer.targets.map((item) => item.appId).filter(Boolean),
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
  });
  debugEvent('target_decided', target);

  const resolved = resolveDeepLinkUrl({
    route,
    schemeOverride: scheme,
    config,
    isExpoGo: target.isExpoGo,
    devServerUrl: devServer.reachable ? devServerUrl : null,
  });
  if (!resolved.ok) {
    const error = new CommandError('DEEP_LINK_UNRESOLVED', resolved.error);
    // Decided where the diagnosis was, so the last line of the failure is a command that can be
    // run: one `Try:` for all three ways this fails was a line with two placeholders in it
    // [observed — friction run 5].
    error.suggestedCommand = resolved.suggestedCommand;
    throw error;
  }
  debugEvent('url_resolved', { url: resolved.url, resolution: resolved.resolution });

  const device = await resolveDeviceAsync(platform);

  // @ref ./adbReverse — before the link, never after. `exp://127.0.0.1:<port>` means the *device's*
  // loopback, so an emulator resolves it to a port nothing listens on and Expo Go lands on its
  // error screen with `am start` having exited 0 (F50).
  const reverse =
    device.platform === 'android' && device.adb != null
      ? await reverseLoopbackPortAsync({ adb: device.adb, deviceId: device.deviceId, url: resolved.url })
      : null;
  if (reverse?.ok === false) {
    debugEvent('adb_reverse_failed', { reason: reverse.reason ?? '' });
  }

  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId,
    adb: device.adb,
  });

  const attach = await confirmAttachAsync({
    projectRoot,
    options,
    device,
    devServerUrl,
    url: resolved.url,
    openedOk: result.exitCode === 0,
  });

  cliEvent('navigate', {
    route,
    url: resolved.url,
    devServerUrl,
    devServerSource: devServer.source,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
    reversedPort: reverse?.port ?? null,
    attached: attach.confirmed,
  });

  return {
    reverse,
    attach,
    route,
    url: resolved.url,
    devServerUrl,
    devServerSource: devServer.source,
    resolution: resolved.resolution,
    target: target.reason,
    platform: device.platform,
    deviceId: device.deviceId,
    deviceName: device.name,
    appId: appId ?? null,
    command: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    routeCheck,
    isExpoGo: target.isExpoGo,
  };
}

/** How often the debugger target list is re-read while the attach wait runs. */
const ATTACH_POLL_MS = 500;

/**
 * Wait for an app on this platform to hold a debugger target, and recover a stuck one once.
 *
 * "The device took the intent" and "the app is running this project" are different facts, and the
 * whole of F50 is the first having been reported as the second. What proves the second is a
 * debugger target **on this platform** — scoped, because a dev server with an iOS simulator already
 * attached would otherwise confirm an Android link from the simulator's target
 * (`src/runtime/targetPlatform.ts`).
 *
 * The recovery is one force-stop and one fresh link, and only on Android: Expo Go's error screen
 * keeps the process alive and does not retry the manifest fetch, so a second intent into it changes
 * nothing. Automatic rather than suggested, because the state it clears is one this command caused.
 */
async function confirmAttachAsync({
  projectRoot,
  options,
  device,
  devServerUrl,
  url,
  openedOk,
}: {
  projectRoot: string;
  options: OpenRouteOptions;
  device: NavigateDevice;
  devServerUrl: string;
  url: string;
  openedOk: boolean;
}): Promise<AttachCheck> {
  const budgetMs = options.confirmAttachMs ?? 0;
  if (budgetMs <= 0) {
    return {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      reason: 'this run did not wait for the app to attach',
    };
  }
  if (!openedOk) {
    return {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      reason: 'the device refused the deep link, so nothing was opened to wait for',
    };
  }

  const startedAt = Date.now();
  const index = await buildDeviceNameIndexAsync();
  const countAsync = async (): Promise<number> => {
    const probe = await probeDevServerAsync(devServerUrl);
    return probe.reachable ? scopeTargets(probe.targets, device.platform, index).matched.length : 0;
  };
  const waitAsync = async (deadline: number): Promise<number> => {
    for (;;) {
      const count = await countAsync();
      if (count > 0 || Date.now() >= deadline) {
        return count;
      }
      await new Promise((resolve) => setTimeout(resolve, ATTACH_POLL_MS));
    }
  };

  let targets = await waitAsync(startedAt + budgetMs);
  let recovered = false;

  if (targets === 0 && device.platform === 'android' && options.recoverStuckApp !== false) {
    const appId = await resolveStuckAppIdAsync(projectRoot, devServerUrl, device, options.appId);
    const stopped = await stopAppOnDeviceAsync({
      platform: device.platform,
      deviceId: device.deviceId,
      appId,
      adb: device.adb,
    });
    debugEvent('attach_recovery', { appId, stopped: stopped.ok });
    if (stopped.ok) {
      recovered = true;
      const again = await openUrlOnDeviceAsync({
        platform: device.platform,
        deviceId: device.deviceId,
        url,
        appId: options.appId,
        adb: device.adb,
      });
      if (again.exitCode === 0) {
        targets = await waitAsync(Date.now() + budgetMs);
      }
    }
  }

  const waitedMs = Date.now() - startedAt;
  return {
    checked: true,
    confirmed: targets > 0,
    waitedMs,
    targets,
    recovered,
    reason:
      targets > 0
        ? null
        : `no ${device.platform} app registered a debugger target on ${devServerUrl} within ${waitedMs}ms${
            recovered ? ', including after the app was stopped and the link opened again' : ''
          }`,
  };
}

/** The application id to force-stop, resolved the way `runtime:stop` resolves it. */
async function resolveStuckAppIdAsync(
  projectRoot: string,
  devServerUrl: string,
  device: NavigateDevice,
  appIdOverride?: string
): Promise<string> {
  const probe = await probeDevServerAsync(devServerUrl);
  return resolveAppId({
    platform: device.platform,
    appIdOverride,
    targetAppIds: probe.targets.map((target) => target.appId).filter(Boolean),
    configured: readConfiguredAppId(projectRoot, device.platform),
  }).appId;
}

/** The failure for a `--dev-server-url` that named a dev server nothing answers on. */
function unreachableNamedDevServerError(
  devServerUrl: string,
  reason: string | undefined
): CommandError {
  const error = new CommandError(
    'DEEP_LINK_UNRESOLVED',
    [
      `No Expo dev server answered at ${devServerUrl}, which --dev-server-url named, so nothing was opened.`,
      `Why: the request for its debugger target list failed (${reason ?? 'no answer'}). Opening a route against a dev server that is not running loads the app onto the device with nothing to bundle for it, which looks like a crash rather than like a wrong URL.`,
      `How: start the dev server ("npx exagent dev --detach"), or drop --dev-server-url and let this command find the project's own — it asks the dev-server lock first, then the port the project last logged.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev:wait';
  return error;
}
