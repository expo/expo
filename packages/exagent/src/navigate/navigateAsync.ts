// @ref llp/0005-runtime-loop-tools.rfc.md
// Open a route of the project in the app on a booted device, so a change can be verified on the
// screen it belongs to instead of by hand.
import chalk from 'chalk';

import { event } from '../events';
import {
  buildNavigateFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import * as Log from '../log';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import { readProjectRoutesAsync } from '../project/routes';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { discoverDevServerAsync, type DevServerSource } from '../runtime/devServer';
import { CommandError } from '../utils/errors';
import {
  isFullUrlRoute,
  openUrlOnDeviceAsync,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
} from './deepLink';
import { resolveDeviceAsync } from './device';
import { debugEvent } from './events';
import type { NavigateOptions } from './resolveOptions';
import { checkRoute, routeNotFoundError, type RouteCheckJson } from './routeCheck';
import { decideExpoGoTarget } from './target';

/**
 * Machine shape of `exagent navigate --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * with field names mirroring the labels of the human summary. Every key is always present, and
 * a fact the run does not have is `null`, so a parser can read the same shape every time.
 */
export interface NavigateResultJson {
  /** Route as it was passed on the command line. */
  route: string;
  /** URL that was opened on the device. */
  url: string;
  /** Dev server the URL was built from, whether named with `--dev-server-url` or discovered. */
  devServerUrl: string;
  /**
   * Which step produced {@link devServerUrl}: `flag`, `lock`, `log`, `default` or `scan`.
   *
   * Reported for the same reason `status` and `dev:wait` report it: `flag` and `lock` name a dev
   * server on purpose, and `default` or `scan` only found one that answered — which on a machine
   * running two projects may not be this one's.
   */
  devServerSource: DevServerSource;
  /** How the URL was derived, matching the line under `URL` in the human summary. */
  resolution: string;
  /** Why the target app was decided to be Expo Go or a development build. */
  target: string;
  platform: string;
  deviceId: string;
  /** Application id from `--app-id`, or null when it was not passed. */
  appId: string | null;
  /** Device command that was run, for reproducing the step by hand. */
  command: string;
  /** Exit code of that command: non-zero means the device refused the deep link. */
  exitCode: number | null;
  /**
   * Whether the route was checked against the project's routes, and what the check said.
   *
   * Always `ok: true` or `ok: null` here: a route the project has not got is a failure, so it
   * never reaches this object.
   */
  routeCheck: RouteCheckJson;
  /**
   * State-aware next actions, empty when the device refused the link or they are suppressed.
   *
   * @see llp/0009-smart-followups.rfc.md §Design
   */
  followups: FollowUp[];
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * The dev server is read for the app that is actually connected, because that answers which URL
 * shape the app understands. It is not required: a development build with a known scheme is
 * reachable without one.
 *
 * The dev server is *found* the same way every other runtime-facing command finds it — the
 * project's lock, then its start log, then a port scan — and not assumed to be on 8081. This
 * command drives a device, so a wrong dev server does not produce a wrong reading: it loads
 * another project's app onto the user's simulator and reports success.
 *
 * @returns the exit code: non-zero when the device refused the deep link.
 */
export async function navigateAsync(
  projectRoot: string,
  options: NavigateOptions
): Promise<number> {
  const { route, platform, scheme, appId, json, followups: wantFollowUps } = options;

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
    throw routeNotFoundError(route, routeTable, { platform });
  }

  // A named dev server that does not answer is a mistake worth stopping on, and the only case where
  // this command could still build a URL from it: the scheme of a development build needs no dev
  // server, so a `--dev-server-url` typo used to deep-link the device into an app with no bundle to
  // load and report exit 0. Discovery already probes the URL — `flag` is the one source whose
  // failure was not acted on.
  if (devServer.source === 'flag' && !devServer.reachable) {
    const error = new CommandError(
      'DEEP_LINK_UNRESOLVED',
      [
        `No Expo dev server answered at ${devServerUrl}, which --dev-server-url named, so nothing was opened.`,
        `Why: the request for its debugger target list failed (${devServer.reason ?? 'no answer'}). Opening a route against a dev server that is not running loads the app onto the device with nothing to bundle for it, which looks like a crash rather than like a wrong URL.`,
        `How: start the dev server ("npx exagent dev"), or drop --dev-server-url and let this command find the project's own — it asks the dev-server lock first, then the port the project last logged.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent dev:wait';
    throw error;
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
    error.suggestedCommand = 'npx exagent navigate <route> --scheme <your-app-scheme>';
    throw error;
  }
  debugEvent('url_resolved', { url: resolved.url, resolution: resolved.resolution });

  const device = await resolveDeviceAsync(platform);
  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId,
  });

  event('navigate', {
    route,
    url: resolved.url,
    devServerUrl,
    devServerSource: devServer.source,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`. Only a link the
  // device accepted has a screen to capture, so a refusal carries no follow-up: its own what/why/
  // how below is the next step.
  const followups =
    result.exitCode === 0 && followUpsEnabled(wantFollowUps)
      ? buildNavigateFollowUps({ platform: device.platform, deviceId: device.deviceId })
      : [];

  if (json) {
    const report: NavigateResultJson = {
      route,
      url: resolved.url,
      devServerUrl,
      devServerSource: devServer.source,
      resolution: resolved.resolution,
      target: target.reason,
      platform: device.platform,
      deviceId: device.deviceId,
      appId: appId ?? null,
      command: result.command,
      exitCode: result.exitCode,
      routeCheck,
      followups,
    };
    // The object is the whole of stdout, so the output can be piped into a parser. The failure
    // below still explains itself, on stderr.
    Log.log(JSON.stringify(report, null, 2));
  } else {
    const deviceLabel = device.name ? `${device.name} (${device.deviceId})` : device.deviceId;
    Log.log(
      [
        chalk`{bold URL} ${resolved.url}`,
        chalk`{dim  ${resolved.resolution}}`,
        chalk`{dim  target: ${target.reason}}`,
        chalk`{bold Dev server} ${devServerUrl}{dim  · via ${devServer.source}}`,
        chalk`{bold Device} ${device.platform} ${deviceLabel}`,
        chalk`{dim  ${result.command}}`,
        chalk`{bold Route} ${
          routeCheck.ok
            ? `${routeCheck.matched}{dim  · 1 of ${routeCheck.routeCount} routes in ${routeCheck.matched === route ? 'this project' : 'this project, matched as a pattern'}}`
            : chalk`{dim not checked · ${routeCheck.reason}}`
        }`,
      ].join('\n')
    );
  }

  if (result.exitCode !== 0) {
    Log.error(
      [
        chalk.red(
          `The device did not open the deep link (${result.command} exited with ${result.exitCode ?? 'a signal'}).`
        ),
        `Why: ${result.stderr.trim() || result.stdout.trim() || 'the device tool reported no output.'}`,
        target.isExpoGo
          ? `How: make sure Expo Go is installed on this device and the dev server at ${devServerUrl} is running, then run this command again.`
          : `How: make sure the app is installed on this device and its scheme matches ${resolved.url.split('://')[0]}://. Rebuild the app after changing the "scheme" field, then run this command again.`,
      ].join('\n')
    );
    return 1;
  }

  // What the device tool printed is a note for a human, so it is left out of the JSON object
  // rather than added to it: `command` says how to read it again.
  if (!json && result.stdout.trim()) {
    Log.log(chalk.dim(result.stdout.trim()));
  }

  // Last, so the `Suggested next:` section is the last thing in the terminal, after what the device said.
  reportFollowUps('navigate', followups, { json });
  return 0;
}
