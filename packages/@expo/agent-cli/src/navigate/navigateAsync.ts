// @ref llp/0005-runtime-loop-tools.rfc.md
// Open a route of the project in the app on a booted device, so a change can be verified on the
// screen it belongs to instead of by hand.
//
// The act itself is `openRouteAsync` (`./openRoute.ts`), which `@expo/agent-cli smoke` performs too. What
// is left here is this command's own half: its two output channels, its follow-ups, and the exit
// code it gives a device that refused the link.
import chalk from 'chalk';

import { AGENT_DEVICE_SPEC } from '../device/cloudSimulator';
import { event as cliEvent } from '../events';
import { EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import {
  buildNavigateFollowUps,
  buildPrintUrlFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import type { DevServerSource } from '../runtime/devServer';
import { openInPhrase } from './connectUrl';
import {
  openRouteAsync,
  resolveRouteUrlAsync,
  type AlertCheck,
  type OpenRouteResult,
} from './openRoute';
import type { NavigateOptions } from './resolveOptions';
import type { RouteCheckJson } from './routeCheck';

/**
 * Machine shape of `@expo/agent-cli navigate --json`.
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
  /**
   * What kind of host {@link url} carries: `tunnel`, `lan`, `localhost`, or null.
   *
   * The one fact that decides whether the URL is usable anywhere but here. `localhost` means only a
   * process on this machine can open it, and `tunnel` means anything on the internet can — which is
   * what a cloud simulator needs. Null for a development build's `<scheme>://<route>`, which
   * carries no host at all.
   */
  hostType: string | null;
  /**
   * How to point an app at this dev server, one entry per application that could be meant.
   *
   * A different URL from {@link url}: that one navigates an app already loaded against a dev
   * server, and these get it loaded. `exp://<host>` is the **Expo Go** form; a development build
   * takes its own scheme, `<scheme>://expo-development-client/?url=…`. Two entries when nothing
   * established which application is running, none when no dev server answered.
   */
  connect: { target: string; url: string; label: string }[];
  /**
   * Whether the run only resolved the URL (`--print-url`), so no device was asked for.
   *
   * Everything downstream of the device is absent exactly when this is true: the four device
   * fields below are null, no port was reversed, and nothing was waited for — `attached` is null
   * rather than false, because nothing was asked to connect.
   */
  printUrl: boolean;
  /**
   * Which device layer opened the link: `local-ios`, `local-android`, `cloud`, or null.
   *
   * Null exactly when nothing was opened, alongside the other device keys. Reported next to
   * {@link platform} because that no longer says where the device is — an EAS Simulator session
   * runs iOS too, and the difference decides whether the dev server has to be tunnelled and which
   * command under `command` a reader can repeat by hand.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  deviceBackend: string | null;
  platform: string | null;
  deviceId: string | null;
  /** Application id from `--app-id`, or null when it was not passed. */
  appId: string | null;
  /** Device command that was run, for reproducing the step by hand. */
  command: string | null;
  /** Exit code of that command: non-zero means the device refused the deep link. */
  exitCode: number | null;
  /**
   * The dev launcher URL that was opened **before** {@link url}, or null when none was.
   *
   * Two links are delivered when the target is a development build with nothing loaded: this one
   * gets the app running against the dev server, and {@link url} then navigates it. Null in every
   * other case — Expo Go, an app that is already attached, no dev server to point at, and any run
   * that waits for nothing (`--no-wait-attach`), because the bundle this fetches takes seconds and a
   * route link delivered into that gap reaches an app that has not finished loading.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server — F123.
   */
  launch: {
    url: string;
    command: string;
    exitCode: number | null;
    /** Whether an app attached after it, which is what made the route link worth sending. */
    attached: boolean;
    waitedMs: number;
  } | null;
  /**
   * Whether the route was checked against the project's routes, and what the check said.
   *
   * Always `ok: true` or `ok: null` here: a route the project has not got is a failure, so it
   * never reaches this object.
   */
  routeCheck: RouteCheckJson;
  /**
   * The port forwarded onto the device before the link, or null when none needed to be.
   *
   * Android only, and the fix for F50: `exp://127.0.0.1:<port>` means the *device's* loopback, so
   * without this an emulator loads the link against a port nothing listens on.
   */
  reversedPort: number | null;
  /**
   * Whether an app on this platform was seen to connect to the dev server afterwards.
   *
   * `null` when this run did not wait (`--no-wait-attach`). **This, not {@link exitCode}, is what
   * says the app is running the project**: `am start` exits 0 for an intent that lands on Expo Go's
   * error screen.
   */
  attached: boolean | null;
  /** How long the wait for that took, in milliseconds. */
  attachWaitedMs: number;
  /** Whether the app had to be stopped and the link opened again to get there. */
  attachRecovered: boolean;
  /**
   * The system dialog this run's own link raised on a cloud session, or null when none was sought.
   *
   * Only ever non-null for `--cloud`, and only when nothing attached inside the budget: the dialog
   * is what an unattended `open` of a custom-scheme URL produces on iOS (S10), and `found` beside
   * `accepted` is the pair that says whether it was in the way and whether this run cleared it.
   *
   * @see src/navigate/openRoute.ts §resolveOpenDialogAsync
   */
  attachAlert: AlertCheck | null;
  /**
   * State-aware next actions, empty when the device refused the link or they are suppressed.
   *
   * @see llp/0009-smart-followups.rfc.md §The follow-up block
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

  if (options.printUrl) {
    return await printRouteUrlAsync(projectRoot, options);
  }

  const opened = await openRouteAsync(projectRoot, {
    route,
    platform,
    scheme,
    appId,
    devServerUrl: options.devServerUrl,
    routeCheck: options.routeCheck,
    confirmAttachMs: options.attachTimeoutMs,
    cloud: options.cloud,
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`. Only a link the
  // device accepted has a screen to capture, so a refusal carries no follow-up: its own what/why/
  // how below is the next step.
  const followups =
    opened.exitCode === 0 && opened.attach.confirmed !== false && followUpsEnabled(wantFollowUps)
      ? buildNavigateFollowUps({
          backend: opened.deviceBackend,
          platform: opened.platform,
          deviceId: opened.deviceId,
          adbPath: opened.adbPath ?? undefined,
        })
      : [];

  if (json) {
    const report: NavigateResultJson = {
      route: opened.route,
      url: opened.url,
      devServerUrl: opened.devServerUrl,
      devServerSource: opened.devServerSource,
      resolution: opened.resolution,
      target: opened.target,
      hostType: opened.hostType,
      connect: opened.connect,
      printUrl: false,
      deviceBackend: opened.deviceBackend,
      platform: opened.platform,
      deviceId: opened.deviceId,
      appId: opened.appId,
      command: opened.command,
      exitCode: opened.exitCode,
      launch: opened.launch,
      routeCheck: opened.routeCheck,
      reversedPort: opened.reverse?.ok ? opened.reverse.port : null,
      attached: opened.attach.confirmed,
      attachWaitedMs: opened.attach.waitedMs,
      attachRecovered: opened.attach.recovered,
      attachAlert: opened.attach.alert,
      followups,
    };
    // The object is the whole of stdout, so the output can be piped into a parser. The failure
    // below still explains itself, on stderr.
    Log.log(JSON.stringify(report, null, 2));
  } else {
    // The backend, not only the platform: `Device ios <udid>` reads as a simulator on this desk,
    // and a run that drove an EAS session has to say so on the line a reader scans.
    const deviceLabel = opened.deviceName
      ? `${opened.deviceName} (${opened.deviceId})`
      : opened.deviceId;
    const deviceLine =
      opened.deviceBackend === 'cloud'
        ? chalk`{bold Device} cloud ${opened.platform} ${deviceLabel}{dim  · an EAS Simulator session, not a device on this machine}`
        : chalk`{bold Device} ${opened.platform} ${deviceLabel}`;
    Log.log(
      [
        chalk`{bold URL} ${opened.url}`,
        chalk`{dim  ${opened.resolution}}`,
        chalk`{dim  target: ${opened.target}}`,
        chalk`{bold Dev server} ${opened.devServerUrl}{dim  · via ${opened.devServerSource}}`,
        deviceLine,
        // Always a line when a reverse was needed, whether or not it worked: the absence of one is
        // not something a reader can notice, and this is the step F50 was missing entirely.
        ...(opened.reverse?.ran
          ? [
              chalk`{bold Port} ${
                opened.reverse.ok
                  ? chalk.green(`reversed tcp:${opened.reverse.port}`)
                  : chalk.red(`not reversed · ${opened.reverse.reason}`)
              }{dim  · ${opened.reverse.command}}`,
            ]
          : []),
        chalk`{dim  ${opened.command}}`,
        // Above `App`, in the order the two links went out. Without this line the report names one
        // URL for a run that delivered two, and the reader cannot tell a navigation from a cold
        // load — which is the difference between "the app moved" and "the app started" (F123).
        ...(opened.launch
          ? [
              chalk`{bold Launch} ${opened.launch.url}`,
              chalk`{dim  the app was not loaded, so the dev launcher URL was opened first · ${
                opened.launch.exitCode === 0
                  ? opened.launch.attached
                    ? `it attached after ${opened.launch.waitedMs}ms`
                    : `nothing attached within ${opened.launch.waitedMs}ms`
                  : `the device refused it (exit ${opened.launch.exitCode ?? 'on a signal'})`
              }}`,
            ]
          : []),
        chalk`{bold App} ${
          opened.attach.confirmed === true
            ? chalk.green('attached') +
              chalk.dim(
                ` · ${opened.attach.targets} ${opened.platform} debugger ${
                  opened.attach.targets === 1 ? 'target' : 'targets'
                } after ${opened.attach.waitedMs}ms${
                  opened.attach.recovered ? ', after a restart' : ''
                }`
              )
            : opened.attach.confirmed === false
              ? chalk.red('not attached') + chalk.dim(` · ${opened.attach.reason}`)
              : chalk.dim(`not checked · ${opened.attach.reason}`)
        }`,
        chalk`{bold Route} ${
          opened.routeCheck.ok
            ? `${opened.routeCheck.matched}${chalk.dim(
                ` · 1 of ${opened.routeCheck.routeCount} routes in this project${
                  opened.routeCheck.matched === route ? '' : ', matched as a pattern'
                }`
              )}`
            : chalk.dim(`not checked · ${opened.routeCheck.reason}`)
        }`,
      ].join('\n')
    );
  }

  if (opened.exitCode !== 0) {
    Log.error(
      [
        chalk.red(
          `The device did not open the deep link (${opened.command} exited with ${opened.exitCode ?? 'a signal'}).`
        ),
        `Why: ${opened.stderr.trim() || opened.stdout.trim() || 'the device tool reported no output.'}`,
        opened.isExpoGo
          ? `How: make sure Expo Go is installed on this device and the dev server at ${opened.devServerUrl} is running, then run this command again.`
          : `How: make sure the app is installed on this device and its scheme matches ${opened.url.split('://')[0]}://. Rebuild the app after changing the "scheme" field, then run this command again.`,
      ].join('\n')
    );
    return 1;
  }

  // What the device tool printed is a note for a human, so it is left out of the JSON object
  // rather than added to it: `command` says how to read it again.
  if (!json && opened.stdout.trim()) {
    Log.log(chalk.dim(opened.stdout.trim()));
  }

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — `22`, "nothing was shown to be wrong and
  // nothing was proved right". The link was delivered and no app came back, which is exactly that:
  // the device may still be loading a cold bundle, and it may be sitting on an error screen. What
  // it is not is a success, which is what exit 0 said here [friction run 6, F50].
  if (opened.attach.confirmed === false) {
    Log.error(attachNotConfirmed(opened, options));
    reportFollowUps('navigate', followups, { json });
    return EXIT_OUTCOME_TIMEOUT;
  }

  // Last, so the `Suggested next:` section is the last thing in the terminal, after what the device said.
  reportFollowUps('navigate', followups, { json });
  return 0;
}

/**
 * Resolve the URL for a route and print it, opening nothing.
 *
 * Everything `navigate` does except the last step, and the same code path for all of it: the route
 * check, the dev-server discovery, the Expo Go decision, and the tunnel host when there is one. The
 * device is the only thing left out, which is what makes this usable from a machine that has none.
 *
 * @returns `0` whenever a URL could be resolved. A URL is the whole outcome asked for, and whether
 * anything then opens it is not this command's to know.
 * @see llp/0005-runtime-loop-tools.rfc.md §navigate
 */
async function printRouteUrlAsync(projectRoot: string, options: NavigateOptions): Promise<number> {
  const { json, followups: wantFollowUps } = options;

  const resolved = await resolveRouteUrlAsync(projectRoot, {
    route: options.route,
    platform: options.platform,
    scheme: options.scheme,
    appId: options.appId,
    devServerUrl: options.devServerUrl,
    routeCheck: options.routeCheck,
    command: 'navigate',
  });

  const followups = followUpsEnabled(wantFollowUps)
    ? buildPrintUrlFollowUps({
        url: resolved.url,
        hostType: resolved.hostType,
        connect: resolved.connect,
      })
    : [];

  cliEvent('navigate_url', {
    route: resolved.route,
    url: resolved.url,
    devServerUrl: resolved.devServerUrl,
    devServerSource: resolved.devServerSource,
    hostType: resolved.hostType,
  });

  if (json) {
    const report: NavigateResultJson = {
      route: resolved.route,
      url: resolved.url,
      devServerUrl: resolved.devServerUrl,
      devServerSource: resolved.devServerSource,
      resolution: resolved.resolution,
      target: resolved.target,
      hostType: resolved.hostType,
      connect: resolved.connect,
      printUrl: true,
      // Every key of the shape is present, and the five a device would have filled in are null:
      // a parser reads the same object whether or not anything was opened (llp/0006 §Output
      // contract).
      deviceBackend: null,
      platform: null,
      deviceId: null,
      appId: options.appId ?? null,
      command: null,
      exitCode: null,
      // Nothing was opened, so neither of the two links this command can deliver was.
      launch: null,
      routeCheck: resolved.routeCheck,
      // Nothing was opened, so nothing downstream of the device happened. `adb reverse` belongs to
      // opening a loopback link on an Android device (F50) and this run opened none; `attached` is
      // null rather than false for the same reason it is null under `--no-wait-attach` — nothing
      // was waited for, which is not the same as nothing having connected.
      reversedPort: null,
      attached: null,
      attachWaitedMs: 0,
      attachRecovered: false,
      attachAlert: null,
      followups,
    };
    Log.log(JSON.stringify(report, null, 2));
  } else {
    // The URL on its own line and first, so a caller that reads one line of this reads the answer.
    Log.log(
      [
        chalk`{bold URL} ${resolved.url}`,
        chalk`{dim  ${resolved.resolution}}`,
        chalk`{dim  target: ${resolved.target}}`,
        chalk`{bold Dev server} ${resolved.devServerUrl}{dim  · via ${resolved.devServerSource}}`,
        chalk`{bold Reach} ${reachLine(resolved.hostType)}`,
        ...connectLines(resolved.connect),
        chalk`{bold Device} {dim nothing was opened — --print-url resolves the URL only}`,
      ].join('\n')
    );
  }

  reportFollowUps('navigate', followups, { json });
  return 0;
}

/**
 * The lines that say how to point an app at this dev server.
 *
 * Printed when they add something the `URL` line does not. For Expo Go with a route they do not:
 * the route URL already carries the host, and repeating it under another label reads as two places
 * to go. For a development build they always do — its route URL carries no host at all, so nothing
 * above says which dev server it would reach. Two labelled lines when nothing established which
 * application is running, because a guess between two applications is not one URL.
 */
function connectLines(connect: { target: string; url: string; label: string }[]): string[] {
  const worthPrinting = connect.length > 1 || connect.some((entry) => entry.target !== 'expo-go');
  if (!worthPrinting) {
    return [];
  }
  if (connect.length === 1) {
    return [
      chalk`{bold Connect} ${connect[0]!.url}{dim  · open in ${openInPhrase(connect[0]!.target)}}`,
    ];
  }
  return [
    chalk`{bold Connect} {dim which app is running could not be established, so both:}`,
    ...connect.map((entry) => chalk`{dim  ${entry.label.padEnd(18)}}${entry.url}`),
  ];
}

/** What the host in the URL means for anything that is not this machine. */
function reachLine(hostType: string | null): string {
  if (hostType === 'tunnel') {
    return chalk.green('tunnel · reachable from any network, including a cloud simulator');
  }
  if (hostType === 'lan') {
    return chalk.yellow('lan · reachable from this network only');
  }
  if (hostType === 'localhost') {
    return chalk.yellow(
      'localhost · reachable from this machine only — start with --tunnel for a device elsewhere'
    );
  }
  return chalk.dim(
    'unknown · nothing captured what the dev server advertised, so the host above is where it listens on this machine'
  );
}

/**
 * The what / why / how for a link that was delivered and produced no connected app.
 *
 * **The cloud clauses are not decoration** (S10, and the first live-cloud run). On an EAS Simulator
 * session the most common cause of this exact outcome is not the app at all: iOS asks "Open in
 * 'Expo Go'?" and nothing on an unattended device answers it. This run reads and answers that dialog
 * itself (`openRoute.ts §resolveOpenDialogAsync`), so the report says which of the three states it
 * found — answered, some other alert, or none — and names the verb a reader can run by hand either
 * way. A report that left the dialog unmentioned sent readers to debug a bundle that was never
 * fetched.
 *
 * The screen-reading suggestion follows the backend rather than the platform, for llp/0022-live-tier.plan.md's
 * reason: `--platform ios` is a local flag, and a host that reached for a cloud session may have no
 * local device to run it against.
 */
function attachNotConfirmed(opened: OpenRouteResult, options: NavigateOptions): string {
  const reverseClause =
    opened.reverse?.ran && opened.reverse.ok === false
      ? ` The port forward this link needs did not go in either (${opened.reverse.reason}), so the app had no route back to this machine at all.`
      : opened.reverse?.ok
        ? ` The dev server's port was forwarded onto the device first, so the app could reach it.`
        : '';

  const alert = opened.attach.alert;
  const alertClause = alert == null ? '' : ` And the device's own screen: ${alert.reason}.`;
  const cloud = opened.deviceBackend === 'cloud';
  const alertHow =
    alert?.accepted === true
      ? ` The dialog this link raised was accepted and the app still did not connect, so the next thing to look at is the screen rather than the modal.`
      : cloud
        ? ` On a cloud session the usual cause is a system dialog nothing answered — read it with "npx eas simulator:exec npx ${AGENT_DEVICE_SPEC} alert get" and answer it with "npx eas simulator:exec npx ${AGENT_DEVICE_SPEC} alert accept".`
        : '';
  const look = cloud
    ? `${PROGRAM_PREFIX} smoke --cloud --no-route-check`
    : `${PROGRAM_PREFIX} smoke --platform ${opened.platform} --no-route-check`;

  return [
    chalk.red(
      `The link was opened on the device, and no ${opened.platform} app connected to ${opened.devServerUrl} within ${opened.attach.waitedMs}ms.`
    ),
    `Why: "${opened.command}" exited 0, which says the device accepted the intent and nothing more — an app that fails to load its bundle sits on an error screen having accepted one.${reverseClause}${
      opened.attach.recovered
        ? ' The app was stopped and the link opened a second time, and that did not attach either.'
        : ''
    }${alertClause}`,
    `How: look at what the dev server was asked for with "${PROGRAM_PREFIX} dev:logs", and at the screen with "${look}". A first bundle on a cold device can take longer than this wait — raise it with --attach-timeout 90s. Pass --no-wait-attach to report only what the device tool said, which is what this command used to do.${alertHow}`,
  ].join('\n');
}
