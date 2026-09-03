// @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route
// Opening a route on a device, with none of the reporting.
//
// This is `@expo/agent-cli navigate` with its output removed, extracted so `@expo/agent-cli smoke` can perform the
// same act as part of a larger answer. The alternative was for `smoke` to compose the same six
// steps itself — the route check, the scheme resolution, the Expo Go decision, the device probe,
// the deep link, the exit code — and a second composition of those steps is a second place for the
// findings of llp/0005 to be forgotten: the `/--/?` marker the root route needs, the route table
// that has to be consulted *before* the link, the dev server that is found rather than assumed.
//
// So the composition lives here and both callers use it. `navigateAsync` is this function plus the
// event, the follow-ups and the two output channels; `smoke` is this function inside a phase.

import {
  classifyDevServerHost,
  isTunnelCurrent,
  resolveDevServerReachAsync,
  type DevServerHostType,
  type DevServerReach,
} from '../dev/advertisedUrl';
import {
  AGENT_DEVICE_SPEC,
  acceptCloudAlertAsync,
  cloudNeedsTunnelError,
  cloudVerbFailedError,
  isOpenInAppAlert,
  openUrlOnCloudSimulatorAsync,
  readCloudAlertAsync,
  readControllerError,
} from '../device/cloudSimulator';
import { event as cliEvent } from '../events';
import { PROGRAM_PREFIX } from '../programName';
import { checkExpoGoCompatibilityAsync, decidesAgainstExpoGo } from '../project/expoGo';
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
import {
  buildDeviceNameIndexAsync,
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
} from '../runtime/targetPlatform';
import { CommandError } from '../utils/errors';
import { reverseLoopbackPortAsync, type ReverseResult } from './adbReverse';
import { buildConnectUrls, type ConnectUrl } from './connectUrl';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
  type ProjectSchemeConfig,
} from './deepLink';
import {
  resolveDeviceAsync,
  type CloudPreference,
  type DeviceBackend,
  type NavigateDevice,
  type NavigatePlatform,
} from './device';
import { debugEvent } from './events';
import {
  checkRoute,
  routeNotFoundError,
  type RouteCheckJson,
  type RouteCommand,
} from './routeCheck';
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
  /**
   * Where {@link devServerUrl} came from: the **caller's own flag**, or a step of this same run.
   *
   * The two are not the same question, and treating them as one is F96. The reach lookup below is
   * suppressed for a `flag`, because the caller named the host they want reached — but `smoke`
   * discovers this project's dev server in its first phase and hands the URL down to its route
   * phase, and that URL is a *finding of this run*, not a caller's instruction. Passed as `flag`,
   * it silenced the manifest lookup and the gate built `exp://127.0.0.1:<port>` while `navigate`,
   * three minutes earlier and against the same dev server, built the tunnel host from the manifest
   * [observed — live cloud, 2026-08-27, artifacts 003 and 007].
   *
   * Defaults to `flag`, which is the safe reading of a URL whose origin a caller did not say.
   *
   * @see llp/0021-honest-reports.rfc.md §The rules
   */
  devServerUrlSource?: 'flag' | 'discovered';
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
  /**
   * Whether an EAS Simulator session is on this run's device ladder, and how.
   *
   * Defaults to `off`, so a caller that says nothing keeps the two local backends exactly.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  cloud?: CloudPreference;
}

/** Everything the URL alone amounts to: the answer of a run that opens nothing. */
export interface ResolvedRoute {
  route: string;
  /** URL a device opens to reach this route. */
  url: string;
  /** Where the dev server listens on this machine. */
  devServerUrl: string;
  devServerSource: DevServerSource;
  /** Whether that dev server answered. */
  devServerReachable: boolean;
  /** How the URL was derived. */
  resolution: string;
  /** Why the target app was decided to be Expo Go or a development build. */
  target: string;
  /** Whether the target app was decided to be Expo Go. */
  isExpoGo: boolean;
  /**
   * What kind of host **the URL above carries**: `tunnel`, `lan`, `localhost`, or null.
   *
   * Classified from the URL itself rather than from what the dev server advertised, so the two can
   * never disagree — a report that says `tunnel` over a `127.0.0.1` link reads as "open this
   * anywhere" [observed — live, 2026-08-25]. Null for a development build's `<scheme>://<route>`,
   * which carries no host at all: it reaches whatever dev server the app was launched against.
   */
  hostType: DevServerHostType | null;
  /**
   * How to point an app at this dev server, one entry per application that could be meant.
   *
   * A *different* URL from {@link url}: that one navigates an app already loaded against a dev
   * server, and these get it loaded. `exp://<host>` is the Expo Go form and
   * `<scheme>://expo-development-client/?url=…` the development build's, and they are not
   * interchangeable — so two entries appear when nothing established which application is running,
   * and none when there is no dev server to point at.
   *
   * @see ./connectUrl.ts
   */
  connect: ConnectUrl[];
  /** Whether the route was checked against the project's routes, and what the check said. */
  routeCheck: RouteCheckJson;
  /**
   * Whether an app of the platform in question already holds a debugger target on this dev server.
   *
   * The same fact the target decision is made from, kept rather than thrown away: it is what
   * separates "navigate an app that is running" from "get the app running, then navigate it"
   * (F123, {@link openRouteAsync}). False when nothing is connected **or** when there is no dev
   * server to be connected to.
   */
  appAttached: boolean;
}

/** One open of a URL on a device, and what came of it. */
export interface DevLauncherOpen {
  /** The launcher URL: `<scheme>://expo-development-client/?url=<dev server origin>`. */
  url: string;
  /** The device command that opened it, for reproducing the step by hand. */
  command: string;
  /** Its exit code: non-zero means the device refused it. */
  exitCode: number | null;
  /** Whether an app of this platform attached after it, inside the budget this open was given. */
  attached: boolean;
  /** How long the wait for that took, in milliseconds. */
  waitedMs: number;
}

/** Everything one open amounts to, with nothing printed. */
export interface OpenRouteResult extends ResolvedRoute {
  /**
   * Which device layer acted: `local-ios`, `local-android`, or `cloud`.
   *
   * Reported next to {@link platform} rather than folded into it, because `ios` no longer says
   * where the device is — a cloud session runs iOS too. It is the fact that decides whether the
   * command a reader can repeat by hand is `xcrun`, `adb`, or `eas simulator:exec`.
   */
  deviceBackend: DeviceBackend;
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
  /** The `adb` binary that was run, so a follow-up names a command this machine can run (F49). */
  adbPath: string | null;
  /**
   * What `adb reverse` did before the link, or null on a platform that needs none.
   *
   * @see ./adbReverse — why an Android link to a dev server on this machine cannot work without it.
   */
  reverse: ReverseResult | null;
  /**
   * The launcher URL this run opened **before** the route link, or null when it opened none.
   *
   * Non-null exactly when the ladder of F123 fired: a development build, nothing attached, a dev
   * server to point it at, and a budget to wait with. Reported beside {@link command} because two
   * links were delivered and a report that named one of them would describe half the run.
   */
  launch: DevLauncherOpen | null;
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
  /**
   * What the system dialog on a cloud session turned out to be, or null when none was looked for.
   *
   * @see AlertCheck — and llp/0005 §Cloud simulator.
   */
  alert: AlertCheck | null;
  /** Why it is not confirmed, or null when it is. */
  reason: string | null;
}

/**
 * The one system dialog this command answers, and what it took to establish that it was the one.
 *
 * `found` and `accepted` are separate facts because the interesting case is `found: true` with
 * `accepted: false` — an alert was on the screen and it was **not** the one this run's own link
 * raised, so it was left alone and named instead.
 */
export interface AlertCheck {
  /** Whether the device was asked what alert it had. */
  checked: boolean;
  /** Whether the controller reported an alert at all. */
  found: boolean;
  /** Whether this run answered it. */
  accepted: boolean;
  /** The controller command that read it, for reproducing the step by hand. */
  command: string;
  /** What happened, in the words of whichever layer said it. */
  reason: string;
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * @throws {CommandError} `ROUTE_NOT_FOUND` for a route the project has not got, checked before
 * anything is opened; `DEEP_LINK_UNRESOLVED` for a named dev server that does not answer or a
 * project with no resolvable scheme; and whatever {@link resolveDeviceAsync} throws when there is
 * no device.
 */
export async function resolveRouteUrlAsync(
  projectRoot: string,
  options: OpenRouteOptions
): Promise<ResolvedRoute> {
  const { route, platform, scheme, appId } = options;

  const [devServer, config, nativeDirs, packageJson, routeTable, reach, expoGo] = await Promise.all(
    [
      discoverDevServerAsync(options.devServerUrl ?? undefined, { projectRoot }),
      Promise.resolve(readProjectSchemeConfig(projectRoot)),
      readProjectNativeDirsAsync(projectRoot),
      readProjectPackageJsonAsync(projectRoot),
      readProjectRoutesAsync(projectRoot),
      // What the dev server said about where a device reaches it (`src/dev/advertisedUrl.ts`).
      //
      // Not asked when `--dev-server-url` **named** one: the caller named the host they want reached,
      // and substituting this project's tunnel host for it would quietly answer a different question —
      // the flag may well name a dev server that is not this project's at all. A URL a *step of this
      // run* found is not that (F96, `devServerUrlSource`), so it is asked for.
      isCallerNamedDevServer(options)
        ? namedDevServerReach()
        : resolveDevServerReachAsync(projectRoot),
      // @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
      //
      // In this `Promise.all` rather than after it, so it overlaps the dev-server discovery that
      // dominates this function's latency instead of adding to it. Never throws — an unreadable
      // project answers with reasons rather than an error — and its `compatible` is handed to
      // `decideExpoGoTarget` as the one fact about the *project* that outranks the guesses.
      checkExpoGoCompatibilityAsync(projectRoot),
    ]
  );
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
  // failure was not acted on. Attributed to the *caller* rather than to discovery's own label: a
  // URL a phase of this run found reaches discovery as `flag` too, and blaming a flag nobody passed
  // sends a reader to check an argument they never wrote (F96).
  if (devServer.source === 'flag' && isCallerNamedDevServer(options) && !devServer.reachable) {
    throw unreachableNamedDevServerError(devServerUrl, devServer.reason, platform);
  }

  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );

  // Scoped to the platform that was named, for the reason every other reading command is (F51):
  // a dev server with an iOS simulator already attached would otherwise decide an `--android` run's
  // target app from the simulator's registration. Nothing on the named platform leaves the decision
  // to the project's own shape, which is the honest fallback. The index costs no subprocess unless
  // a target cannot be placed by its app id, which Expo Go always can.
  const decisionTargets = platform
    ? scopeTargets(
        devServer.targets,
        platform,
        await buildDeviceNameIndexIfNeededAsync(devServer.targets)
      ).matched
    : devServer.targets;

  const target = decideExpoGoTarget({
    appIdOverride: appId,
    targetAppIds: decisionTargets.map((item) => item.appId).filter(Boolean),
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
    expoGoCompatible: decidesAgainstExpoGo(expoGo),
  });
  debugEvent('target_decided', target);

  // Only a tunnel that is *current* changes the URL: a host read out of a log whose dev server has
  // since stopped is worse than the LAN address, because it looks like it should work.
  const tunnelHost = isTunnelCurrent(reach) ? (reach.advertised?.host ?? null) : null;

  const resolved = resolveDeepLinkUrl({
    route,
    schemeOverride: scheme,
    config,
    isExpoGo: target.isExpoGo,
    devServerUrl: devServer.reachable ? devServerUrl : null,
    reachHost: tunnelHost,
    // The flag the caller typed, so the commands this recovers into ask for the same platform
    // this run was asked for (F142).
    platform,
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

  return {
    route,
    url: resolved.url,
    devServerUrl,
    devServerSource: devServer.source,
    devServerReachable: devServer.reachable,
    resolution: resolved.resolution,
    target: target.reason,
    isExpoGo: target.isExpoGo,
    hostType: resolved.host ? classifyDevServerHost(hostnameOf(resolved.host)) : null,
    // Built from the host a *device* uses — the tunnel's when there is one — rather than from the
    // route URL, because a development build's route URL carries no host at all.
    connect: buildConnectUrls({
      host: devServer.reachable ? (tunnelHost ?? hostnameWithPort(devServerUrl)) : null,
      hostType: tunnelHost ? 'tunnel' : hostTypeOfDevServer(devServerUrl),
      scheme: devBuildScheme(scheme, config),
      isExpoGo: target.isExpoGo,
      certain: target.certain,
    }),
    routeCheck,
    // The same list the target decision was made from. Kept, because "which app is this" and "is
    // that app running" are two questions with one answer here, and F123 is the second one having
    // been computed and then dropped.
    appAttached: decisionTargets.length > 0,
  };
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * @throws {CommandError} whatever {@link resolveRouteUrlAsync} throws, and whatever
 * {@link resolveDeviceAsync} throws when this machine has no device to open the link on.
 */
export async function openRouteAsync(
  projectRoot: string,
  options: OpenRouteOptions
): Promise<OpenRouteResult> {
  const { platform, appId } = options;
  const resolved = await resolveRouteUrlAsync(projectRoot, options);
  const devServerUrl = resolved.devServerUrl;

  // The URL is known by now, so a machine with no device is told what to do with it rather than
  // only that it has none: an agent driving a cloud simulator has somewhere else to open it.
  const device = await resolveDeviceAsync(platform, {
    url: resolved.url,
    devServerRunning: resolved.devServerReachable,
    cloud: options.cloud,
    projectRoot,
  });

  // @ref src/device/cloudSimulator.ts §cloudNeedsTunnelError — refused before anything is opened.
  // A cloud simulator is on EAS's network, so a `127.0.0.1` or LAN host in the link resolves to
  // something that is not this machine, exactly as it does on an Android emulator (F50) — and
  // unlike the emulator there is no `adb reverse` to fix it. Checked here rather than inside the
  // URL resolver, because it is a fact about the *device*, and the same URL is perfectly good for
  // the simulator on this desk.
  if (
    device.backend === 'cloud' &&
    (resolved.hostType === 'localhost' || resolved.hostType === 'lan')
  ) {
    throw cloudNeedsTunnelError(resolved.url, resolved.hostType);
  }

  // Decided before the reverse, because the two links need different ports forwarded: the launcher
  // URL carries the dev server's origin inside its `url` parameter, and a route link for a
  // development build carries no host at all.
  const budgetMs = options.confirmAttachMs ?? 0;
  const launcherUrl = devLauncherUrlFor(resolved, budgetMs);

  // @ref ./adbReverse — before the link, never after. `exp://127.0.0.1:<port>` means the *device's*
  // loopback, so an emulator resolves it to a port nothing listens on and Expo Go lands on its
  // error screen with `am start` having exited 0 (F50).
  //
  // The **dev server's** URL when a launcher open is about to happen: what has to be reachable then
  // is the origin the launcher will fetch the bundle from, and `<scheme>://expo-development-client/`
  // is not a loopback host, so reading the URL itself would forward nothing (F123).
  const reverse =
    device.platform === 'android' && device.adb != null
      ? await reverseLoopbackPortAsync({
          adb: device.adb,
          deviceId: device.deviceId,
          url: launcherUrl == null ? resolved.url : devServerUrl,
        })
      : null;
  if (reverse?.ok === false) {
    debugEvent('adb_reverse_failed', { reason: reverse.reason ?? '' });
  }

  // @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server — F123, and the
  // whole reason this call sits above the route link rather than beside it.
  const startedAt = Date.now();
  const launch = await launchDevClientFirstAsync({
    projectRoot,
    options,
    device,
    devServerUrl,
    launcherUrl,
    budgetMs,
  });

  const result = await openUrlOnBackendAsync(device, {
    projectRoot,
    url: resolved.url,
    appId,
  });

  const attach = await confirmAttachAsync({
    projectRoot,
    options,
    device,
    devServerUrl,
    url: resolved.url,
    openedOk: result.exitCode === 0,
    // What is left of the caller's budget. A launcher open that attached in four seconds leaves
    // almost all of it for the route link, and one that spent the lot still leaves a floor — the
    // route link has only just been delivered, and `checked: false` would report a wait that did
    // happen as one that did not.
    budgetMs:
      launch == null
        ? budgetMs
        : Math.max(budgetMs - (Date.now() - startedAt), ROUTE_ATTACH_FLOOR_MS),
  });

  cliEvent('navigate', {
    route: resolved.route,
    url: resolved.url,
    devServerUrl,
    devServerSource: resolved.devServerSource,
    deviceBackend: device.backend,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
    reversedPort: reverse?.port ?? null,
    attached: attach.confirmed,
    launchUrl: launch?.url ?? null,
  });

  return {
    ...resolved,
    reverse,
    launch,
    attach,
    adbPath: device.adb?.bin ?? null,
    deviceBackend: device.backend,
    platform: device.platform,
    deviceId: device.deviceId,
    deviceName: device.name,
    appId: appId ?? null,
    command: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Open the URL on whichever backend resolved, and report it the same way for all three.
 *
 * The two local backends and the cloud one differ in what a non-zero exit *means*, which is why
 * they are not simply two commands behind one call. `xcrun simctl openurl` exiting non-zero is the
 * device refusing the link — a fact about the app on it, which `navigate` reports and exits `1`
 * for. `eas simulator:exec` exiting non-zero is any of: a session that ended mid-run, a signed-out
 * account, a controller flag this CLI got wrong, or a binary that was never the EAS CLI. None of
 * those is "the device refused", and reporting them as that would send a reader to reinstall Expo
 * Go. So the cloud path raises the tool failure instead, with what the tool printed and — for a
 * signed-out account — the needs-human handoff that makes it exit `7` (llp/0010).
 */
async function openUrlOnBackendAsync(
  device: NavigateDevice,
  {
    projectRoot,
    url,
    appId,
    launchActivity,
  }: { projectRoot: string; url: string; appId?: string; launchActivity?: string }
): Promise<{ command: string; stdout: string; stderr: string; exitCode: number | null }> {
  if (device.backend !== 'cloud') {
    return await openUrlOnDeviceAsync({
      platform: device.platform,
      deviceId: device.deviceId,
      url,
      appId,
      // @see BuildOpenUrlCommandParams.launchActivity — set only for the dev launcher's own URL on
      // Android, where a BROWSABLE intent reaches a code path that dies on a cold app (F123).
      launchActivity,
      adb: device.adb,
    });
  }

  const result = await openUrlOnCloudSimulatorAsync({
    projectRoot,
    url,
    platform: device.platform,
  });
  if (result.spawnError || result.exitCode !== 0) {
    throw cloudVerbFailedError(result, {
      what: `${url} was not opened on the cloud simulator.`,
      how: `Check the session is still running with "npx eas simulator:list --status in-progress" — a session can end between the moment it was listed and the moment a verb reaches it. Start a new one if it has.`,
    });
  }
  return {
    command: result.command,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

/**
 * Whether the dev server URL in these options is the **caller's** rather than this run's finding.
 *
 * Pure and exported for the table, because it is the whole of F96 in one expression: a URL and its
 * provenance are two facts, and a run that keeps only the first cannot tell "the caller pinned this
 * host" from "an earlier phase of mine found this host".
 */
export function isCallerNamedDevServer(options: {
  devServerUrl: string | null;
  devServerUrlSource?: 'flag' | 'discovered';
}): boolean {
  return options.devServerUrl != null && options.devServerUrlSource !== 'discovered';
}

/** The reach of a dev server the caller named: their host, and nothing this project knows. */
async function namedDevServerReach(): Promise<DevServerReach> {
  return {
    advertised: null,
    running: false,
    reason: '--dev-server-url named the dev server, so its host is the one that was used',
  };
}

/**
 * The scheme a development build of this project registers.
 *
 * The same precedence the deep link itself uses: `--scheme` wins, then the `scheme` field of the
 * app config, then the `exp+<slug>` default a managed development build registers. Null when the
 * project declares none of them, and then no development-build URL is offered rather than one with
 * a hole in it.
 */
function devBuildScheme(
  schemeOverride: string | undefined,
  config: ProjectSchemeConfig
): string | null {
  const override = schemeOverride?.trim();
  if (override) {
    return override.replace(/:\/*$/, '');
  }
  if (config.scheme) {
    return config.scheme;
  }
  return config.slug ? `exp+${config.slug}` : null;
}

/** `host[:port]` of a dev server origin, or null when it cannot be parsed. */
function hostnameWithPort(devServerUrl: string): string | null {
  try {
    return new URL(devServerUrl).host || null;
  } catch {
    return null;
  }
}

/** How a device off this machine reaches a dev server origin. */
function hostTypeOfDevServer(devServerUrl: string): DevServerHostType | null {
  try {
    return classifyDevServerHost(new URL(devServerUrl).hostname);
  } catch {
    return null;
  }
}

/** The name part of a `host[:port]`, which is what a host classification is about. */
function hostnameOf(host: string): string {
  const lastColon = host.lastIndexOf(':');
  // An IPv6 literal is bracketed, so its colons are inside the brackets and never the port's.
  return lastColon > 0 && !host.includes(']') ? host.slice(0, lastColon) : host;
}

/** How often the debugger target list is re-read while the attach wait runs. */
const ATTACH_POLL_MS = 500;

/**
 * The least this run waits for the **route link** after a launcher open spent the whole budget.
 *
 * Not a second budget: the caller's `--attach-timeout` is what bounds the run, and this is only the
 * floor under whatever is left of it. Without one, a launcher open that used every millisecond
 * would leave the route link reported as `checked: false` — "this run did not wait" — for a run that
 * had waited a minute and a half.
 */
const ROUTE_ATTACH_FLOOR_MS = 2_000;

/**
 * A function that waits until an app of this platform holds a debugger target, or the deadline.
 *
 * Built once and shared by the two waits of one run — the launcher's and the route link's — so both
 * ask the same question of the same dev server, and the device-name index that scoping needs is
 * built once rather than per open.
 *
 * @returns how many targets this platform had when the wait ended: zero means the deadline won.
 */
async function attachWaiterAsync(
  devServerUrl: string,
  platform: NavigatePlatform
): Promise<(deadline: number) => Promise<number>> {
  const index = await buildDeviceNameIndexAsync();
  const countAsync = async (): Promise<number> => {
    const probe = await probeDevServerAsync(devServerUrl);
    return probe.reachable ? scopeTargets(probe.targets, platform, index).matched.length : 0;
  };
  return async (deadline: number): Promise<number> => {
    for (;;) {
      const count = await countAsync();
      if (count > 0 || Date.now() >= deadline) {
        return count;
      }
      await new Promise((resolve) => setTimeout(resolve, ATTACH_POLL_MS));
    }
  };
}

/**
 * Open the dev launcher's own URL first, when the app this route is for is not loaded.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
 * **F123.** `<scheme>://<route>` navigates an app that is *already* running against a dev server;
 * `<scheme>://expo-development-client/?url=<origin>` is what gets it running. They are both the
 * app's own scheme and they are not interchangeable — so a run that had just decided "no app is
 * connected to the dev server, and the project depends on expo-dev-client" was handing a not-loaded
 * app the link that only a loaded app understands, spending its whole attach budget, and exiting 22
 * after 90.6 s while holding the other URL in its own `connect` array [observed — wave 29,
 * `evidence/61-navigate-after-stop-android.json`].
 *
 * Four conditions, and each rules out a case where loading first would be wrong:
 *
 *  1. **a development build** — `exp://<host>` already carries the dev server, so Expo Go has
 *     nothing to be pointed at first;
 *  2. **nothing attached** — an app that *is* running understands the route link, and reloading it
 *     would throw away the state the caller is navigating within;
 *  3. **a launcher URL exists** — it needs a dev server to point at and a scheme to be addressed
 *     to, and `buildConnectUrls` returns nothing when either is missing;
 *  4. **a budget to wait with** — the launcher fetches a bundle, and a route link delivered into
 *     that gap lands on an app that has not finished loading. `--no-wait-attach` passes none and
 *     keeps exactly the behaviour it had.
 *
 * `smoke` used to be in that fourth exception, and it was wrong there once it started booting its
 * own simulators: a cold development build got the route link, and the run photographed the dev
 * launcher's screen [observed, 2026-09-01; llp/0005 §Loading the app is not navigating it].
 * It passes a budget now, which is how it joins this ladder rather than building a URL of its own.
 *
 * Never throws, and never fails the run: a launcher open the device refused is reported as one, and
 * the route link is opened after it either way — it is what the caller asked for.
 *
 * Decided in its own function because the answer is needed *before* the open: on Android the port
 * that has to be forwarded is the dev server's when this fires and the route link's when it does
 * not, and `adb reverse` runs before anything is opened.
 *
 * @returns the launcher URL to open first, or null when this run opens only the route link.
 */
function devLauncherUrlFor(resolved: ResolvedRoute, budgetMs: number): string | null {
  if (budgetMs <= 0 || resolved.isExpoGo || resolved.appAttached) {
    return null;
  }
  return resolved.connect.find((entry) => entry.target === 'dev-build')?.url ?? null;
}

/** Open the launcher URL {@link devLauncherUrlFor} chose, and wait for the app it loads. */
async function launchDevClientFirstAsync({
  projectRoot,
  options,
  device,
  devServerUrl,
  launcherUrl,
  budgetMs,
}: {
  projectRoot: string;
  options: OpenRouteOptions;
  device: NavigateDevice;
  devServerUrl: string;
  /** The URL {@link devLauncherUrlFor} decided on, or null when this ladder does not fire. */
  launcherUrl: string | null;
  budgetMs: number;
}): Promise<DevLauncherOpen | null> {
  if (launcherUrl == null) {
    return null;
  }

  const startedAt = Date.now();
  const opened = await openUrlOnBackendAsync(device, {
    projectRoot,
    url: launcherUrl,
    appId: options.appId,
    // @see BuildOpenUrlCommandParams.launchActivity — the difference between an app that loads and
    // an app on `DevLauncherErrorActivity`. Null on iOS and on a project whose application id
    // cannot be read, and then this is the ordinary link open it has always been.
    launchActivity: androidLaunchActivityFor(projectRoot, device, options),
  });
  debugEvent('dev_launcher_opened', { url: launcherUrl, exitCode: opened.exitCode ?? -1 });

  // A refused open has nothing to wait for, and the budget belongs to the route link that follows.
  if (opened.exitCode !== 0) {
    return {
      url: launcherUrl,
      command: opened.command,
      exitCode: opened.exitCode,
      attached: false,
      waitedMs: 0,
    };
  }

  const waitAsync = await attachWaiterAsync(devServerUrl, device.platform);
  const targets = await waitAsync(startedAt + budgetMs);
  return {
    url: launcherUrl,
    command: opened.command,
    exitCode: opened.exitCode,
    attached: targets > 0,
    waitedMs: Date.now() - startedAt,
  };
}

/** The activity the Expo CLI hands a dev launcher URL to, or null when this is not that case. */
function androidLaunchActivityFor(
  projectRoot: string,
  device: NavigateDevice,
  options: OpenRouteOptions
): string | undefined {
  if (device.platform !== 'android' || device.backend === 'cloud') {
    return undefined;
  }
  // `--app-id` first, for the same reason every other read of it is: the caller knows which
  // application they installed. `.MainActivity` is the Expo CLI's own default for a project that
  // names no launch activity of its own [reference — `AndroidPlatformManager`
  // §_resolveAlternativeLaunchUrl].
  const appId = options.appId ?? readConfiguredAppId(projectRoot, 'android');
  return appId ? `${appId}/.MainActivity` : undefined;
}

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
 *
 * **On a cloud session there is a second recovery, for a second cause** (S10). The link is handed to
 * the system, iOS asks "Open in 'Expo Go'?", and on a device nobody is sitting in front of, that
 * dialog is never answered — so nothing loads, and the honest `attached: false` this produces is
 * about a modal rather than about the app [observed — live staging, 2026-08-26, where
 * `agent-device alert accept` proved the causality; and again live cloud, 2026-08-27, 60.9 s].
 *
 * @see resolveOpenDialogAsync — why answering it is this command's to do, and what stops that from
 * becoming "answer any system prompt".
 */
async function confirmAttachAsync({
  projectRoot,
  options,
  device,
  devServerUrl,
  url,
  openedOk,
  budgetMs,
}: {
  projectRoot: string;
  options: OpenRouteOptions;
  device: NavigateDevice;
  devServerUrl: string;
  url: string;
  openedOk: boolean;
  /** How long this check may wait. The caller's own budget, less whatever it has already spent. */
  budgetMs: number;
}): Promise<AttachCheck> {
  if (budgetMs <= 0) {
    return {
      checked: false,
      confirmed: null,
      waitedMs: 0,
      targets: 0,
      recovered: false,
      alert: null,
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
      alert: null,
      reason: 'the device refused the deep link, so nothing was opened to wait for',
    };
  }

  const startedAt = Date.now();
  const waitAsync = await attachWaiterAsync(devServerUrl, device.platform);

  let targets = await waitAsync(startedAt + budgetMs);
  let recovered = false;
  let alert: AlertCheck | null = null;

  // The cloud recovery, before the Android one: a modal that is never answered blocks whatever the
  // force-stop-and-relink would do next, so the dialog has to come off the screen first.
  if (targets === 0 && device.backend === 'cloud') {
    alert = await resolveOpenDialogAsync({
      projectRoot,
      platform: device.platform,
      appLabel: options.appId ?? EXPO_GO_DIALOG_LABEL,
    });
    debugEvent('attach_alert', { found: alert.found, accepted: alert.accepted });
    if (alert.accepted) {
      targets = await waitAsync(Date.now() + budgetMs);
    }
  }

  // The gate is the **platform**, not the machine. It used to be `local-android`, because the
  // recovery is a force-stop and the first cut of the cloud backend believed the controller had no
  // verb for one. `agent-device close <app-id>` is that verb, so an Android session recovers
  // exactly as an Android emulator does (llp/0005 §Cloud simulator). It
  // stays Android-only: this is the Android-specific stuck-app shape of llp/0005-runtime-loop-tools.rfc.md §Android, and
  // running it on iOS would restart an app that is merely slow.
  const canRecover = device.platform === 'android' && device.backend !== 'local-ios';
  if (targets === 0 && canRecover && options.recoverStuckApp !== false) {
    const appId = await resolveStuckAppIdAsync(projectRoot, devServerUrl, device, options.appId);
    const stopped = await stopAppOnDeviceAsync({
      platform: device.platform,
      deviceId: device.deviceId,
      appId,
      adb: device.adb,
      backend: device.backend,
      projectRoot,
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
        backend: device.backend,
        projectRoot,
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
    alert,
    reason:
      targets > 0
        ? null
        : `no ${device.platform} app registered a debugger target on ${devServerUrl} within ${waitedMs}ms${
            recovered ? ', including after the app was stopped and the link opened again' : ''
          }${alert?.accepted ? ', including after the system dialog this link raised was accepted' : ''}`,
  };
}

/**
 * The name the "Open in …?" dialog carries for Expo Go, which is its display name and not its id.
 *
 * Matched loosely by {@link isOpenInAppAlert} — the bundle id's last component matches too — so a
 * run that knows only `host.exp.Exponent` still recognises the dialog.
 */
const EXPO_GO_DIALOG_LABEL = 'Expo Go';

/**
 * Read the alert on a cloud session's device, and answer the one this run's own link raised.
 *
 * **Why this command answers a system dialog at all.** llp/0008 keeps this CLI out of the business
 * of granting permissions on somebody's behalf, and that is not what this is. The caller ran
 * `--cloud <route>`, which *is* the instruction "open this route on the cloud simulator". iOS then
 * asked whether it may do the thing that was just asked for, on a machine in a datacenter with
 * nobody in front of it. Answering it completes the requested action and authorises nothing beyond
 * it — and the precedent is one file up: the Android stuck-app recovery is already automatic rather
 * than suggested, "because the state it clears is one this command caused" [decided — wave 23,
 * llp/0005 §Cloud simulator].
 *
 * **What keeps that from becoming "answer any prompt".** Four gates, and all four are cheap:
 *
 *  1. only on `--cloud` — a dialog on the machine at somebody's desk has somebody at it;
 *  2. only after **this run's own** open exited 0;
 *  3. only when nothing attached within the caller's budget, so the happy path spends no verb;
 *  4. the alert is **read before it is answered**, and answered only when it names the app the URL
 *     was for. Anything else is reported and left on the screen.
 *
 * Never throws: a controller that refuses the read is a fact about the device, and this is a
 * recovery inside a check that already has an honest answer without it.
 */
async function resolveOpenDialogAsync({
  projectRoot,
  platform,
  appLabel,
}: {
  projectRoot: string;
  platform: NavigatePlatform;
  appLabel: string;
}): Promise<AlertCheck> {
  const read = await readCloudAlertAsync({ projectRoot }).catch((error: unknown) => ({
    command: `${AGENT_DEVICE_SPEC} alert get`,
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    exitCode: null,
    spawnError: null,
    binPath: null,
  }));
  const output = `${read.stdout}\n${read.stderr}`;
  const base = { checked: true, command: read.command };

  // The controller's own empty answer: exit 1, `Error (COMMAND_FAILED): alert not found`
  // [observed — `agent-device@latest alert get`, 2026-08-27]. Not a failure of this step.
  if (read.exitCode !== 0) {
    const controller = readControllerError(output);
    return {
      ...base,
      found: false,
      accepted: false,
      reason:
        controller?.message.toLowerCase().includes('not found') === true
          ? 'the device had no alert on it, so nothing was blocking the link'
          : `the alert on the device could not be read (${controller?.message ?? (firstLine(read.stderr) || `exit ${read.exitCode ?? 'on a signal'}`)})`,
    };
  }
  if (!isOpenInAppAlert(output, appLabel)) {
    return {
      ...base,
      found: true,
      accepted: false,
      // Named rather than answered, and named with what it said: an alert this run did not cause is
      // not this run's to dismiss, and a reader who can see its text can decide.
      reason: `an alert was on the device and it does not name ${appLabel}, so it is not the dialog this link raised and it was left alone: ${firstLine(read.stdout) || firstLine(read.stderr)}`,
    };
  }

  const accepted = await acceptCloudAlertAsync({ projectRoot }).catch(() => null);
  if (accepted == null || accepted.exitCode !== 0) {
    return {
      ...base,
      found: true,
      accepted: false,
      reason: `the "open in ${appLabel}" dialog was on the device and the controller refused to accept it (${accepted == null ? 'the verb could not be run' : (readControllerError(`${accepted.stderr}\n${accepted.stdout}`)?.message ?? `exit ${accepted.exitCode ?? 'on a signal'}`)})`,
    };
  }
  return {
    ...base,
    found: true,
    accepted: true,
    reason: `the system asked whether to open the link in ${appLabel} — a dialog nothing on a ${platform} cloud simulator is there to answer — and this run accepted it`,
  };
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
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

/**
 * The failure for a `--dev-server-url` that named a dev server nothing answers on.
 *
 * @ref llp/0021-honest-reports.rfc.md §How they show up — F142. The
 * platform the caller typed goes on the `dev` this recovers into, for the same reason it goes on
 * every other suggestion: a bare `dev` asks the plan engine to choose a platform, and a caller who
 * has already chosen one is not asking it to.
 */
function unreachableNamedDevServerError(
  devServerUrl: string,
  reason: string | undefined,
  platform?: NavigatePlatform
): CommandError {
  const platformFlag = platform == null ? '' : ` --${platform}`;
  const error = new CommandError(
    'DEEP_LINK_UNRESOLVED',
    [
      `No Expo dev server answered at ${devServerUrl}, which --dev-server-url named, so nothing was opened.`,
      `Why: the request for its debugger target list failed (${reason ?? 'no answer'}). Opening a route against a dev server that is not running loads the app onto the device with nothing to bundle for it, which looks like a crash rather than like a wrong URL.`,
      `How: start the dev server ("${PROGRAM_PREFIX} dev --detach --wait-ready${platformFlag}"), or drop --dev-server-url and let this command find the project's own — it asks the dev-server lock first, then the port the project last logged.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} dev --detach --wait-ready${platformFlag}`;
  return error;
}
