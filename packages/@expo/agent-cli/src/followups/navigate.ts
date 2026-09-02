// @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`.
// A deep link that opened is only half an answer: the other half is what the screen now shows and
// what it threw getting there. Both commands are named for the device that was actually used.

import { AGENT_DEVICE_SPEC } from '../device/cloudSimulator';
import { openInPhrase } from '../navigate/connectUrl';
import type { DeviceBackend, NavigatePlatform } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface NavigateFollowUpInput {
  /**
   * Which device layer opened the link.
   *
   * A `Try:` line has to be runnable [llp/0009 §Examples per command], and `xcrun simctl io <session-id>` is not:
   * a cloud session is not a simulator on this machine, and the screenshot for one is taken through
   * the EAS CLI. Defaults to the local backend for the platform, which is what every caller that
   * predates the cloud one means.
   */
  backend?: DeviceBackend;
  platform: NavigatePlatform;
  /** Simulator UDID or `adb` serial the link was opened on. */
  deviceId: string;
  /**
   * The `adb` that was actually run, when one was.
   *
   * A `Try:` line has to be runnable [llp/0009 §Examples per command], and a bare `adb` is not on a machine whose
   * SDK was never put on `PATH` — which is the machine this whole Android round was about
   * (`src/device/adb.ts`, F49). Absent means the bare name, which is what a caller with no
   * resolution has.
   */
  adbPath?: string;
}

export interface PrintUrlFollowUpInput {
  /** The URL that was resolved for the route. */
  url: string;
  /** What kind of host the URL carries: `tunnel`, `lan`, `localhost`, or null. */
  hostType: string | null;
  /** How to point an app at this dev server, one entry per application that could be meant. */
  connect?: { target: string; url: string; label: string }[];
  /**
   * The platform the caller named, when it named one.
   *
   * Carried into `runtime:errors` for the same reason an opened link carries it: a machine with an
   * iOS simulator and an Android emulator on one dev server reads whichever target is listed first
   * otherwise (F51, F54). Absent when the caller named none — and then nothing may be claimed about
   * which platform the app is on, because `--print-url` opened nothing to find out.
   */
  platform?: NavigatePlatform;
}

/**
 * What to do with a URL nothing opened.
 *
 * The first rung is the URL that has to be opened **next**, and which one that is depends on the
 * app. For Expo Go with a route, the route URL already carries the dev server host, so it is both
 * the connect link and the destination. For a development build it is not: `<scheme>://<route>`
 * navigates an app that is already loaded, and the app has to be pointed at this dev server first
 * with `<scheme>://expo-development-client/?url=…` — so that goes first and the route link follows.
 *
 * A ladder names one command per rung, so when two applications could be meant it names the first
 * and says where the other is: the labelled pair is printed above it, and rides in `connect` of
 * `--json`.
 */
export function buildPrintUrlFollowUps({
  url,
  hostType,
  connect = [],
  platform,
}: PrintUrlFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];

  const connectFirst = connect.filter((entry) => entry.url !== url);
  if (connectFirst.length > 0) {
    const [first, ...rest] = connectFirst;
    followups.push({
      id: 'connect-url',
      command: first!.url,
      why: `Open this on the device that runs the app: it points ${openInPhrase(first!.target)} at this dev server, which has to happen before the route link below can go anywhere.${
        rest.length
          ? ` Which app is running could not be established, so ${openInPhrase(rest[0]!.target)}'s URL is printed above and carried in "connect".`
          : ''
      }`,
    });
  }

  followups.push({
    id: 'open-url',
    command: url,
    why:
      hostType === 'tunnel'
        ? 'Open this URL on the device that runs the app — a phone, a cloud simulator, anywhere with a network.'
        : 'Open this URL on the device that runs the app; nothing was opened here.',
  });

  if (hostType === 'localhost' || hostType === 'lan') {
    followups.push({
      id: 'tunnel-for-reach',
      command: `${PROGRAM_PREFIX} dev --detach --tunnel`,
      why: `The dev server is only reachable from ${
        hostType === 'localhost' ? 'this machine' : 'this network'
      }, so a device anywhere else cannot load that URL; a tunnel serves the same dev server from any network.`,
    });
  }

  followups.push({
    id: 'runtime-errors',
    command: platform
      ? `${PROGRAM_PREFIX} runtime:errors --${platform}`
      : `${PROGRAM_PREFIX} runtime:errors`,
    why: 'Once something opens the URL and the app attaches, this reads what it throws.',
  });

  return capFollowUps(followups);
}

export function buildNavigateFollowUps({
  backend,
  platform,
  deviceId,
  adbPath = 'adb',
}: NavigateFollowUpInput): FollowUp[] {
  const on = backend ?? (platform === 'ios' ? 'local-ios' : 'local-android');
  return capFollowUps([
    {
      id: 'screenshot',
      command:
        on === 'cloud'
          ? // [inferred] — the controller's own verb, run through the session bridge. Never
            // `xcrun`: there is no simulator on this machine to point it at.
            `npx eas simulator:exec npx ${AGENT_DEVICE_SPEC} screenshot screen.png`
          : on === 'local-ios'
            ? `xcrun simctl io ${deviceId} screenshot screen.png`
            : `${adbPath} -s ${deviceId} exec-out screencap -p > screen.png`,
      why:
        // @ref llp/0009 §Examples per command — friction run 7, F79. `navigate` returns when the app has
        // *attached*, and attaching is not rendering: the app then fetches and evaluates the
        // bundle. Run at once, this captured the Expo Go splash and "Loading project…", and the
        // screen was ready about twelve seconds later [observed — friction run 7, n1/n2-lab.png].
        // `smoke` waits for that before its own capture; here the wait is the caller's, so what
        // this line owes them is the fact and something to wait *on* rather than a number of
        // seconds — a cold bundle on a slow machine takes as long as it takes.
        (on === 'cloud'
          ? 'Captures the screen this route opened on the cloud simulator and downloads it here, so the change can be checked as it renders. '
          : 'Captures the screen this route opened, so the change can be checked as it renders. ') +
        'The app may still be loading its bundle: this route was opened a moment ago, and a cold start takes seconds, so ' +
        // F104 — the wait to name is one the caller's platform can actually run. `runtime:tree`
        // needs `Runtime.evaluate`, and Expo Go for Android has no CDP debugger at all
        // (llp/0005 §Android) — so on Android the line above was an
        // instruction that exits 1 every time it is followed. `smoke` is what waits there: its
        // screenshot phase waits on the honest neighbouring fact — two reads of the dev server's
        // target list naming the same ids (F57) — and then captures the screen itself.
        (platform === 'android'
          ? `wait with "${PROGRAM_PREFIX} smoke --android", which waits for the app and captures the screen itself — this runtime has no debugger, so "runtime:tree" cannot answer there. Otherwise the picture is of the splash.`
          : `run "${PROGRAM_PREFIX} runtime:tree" first and capture once it lists the screen — otherwise the picture is of the splash.`),
    },
    {
      id: 'runtime-errors',
      // The platform this link was opened on, carried into the next command. Without it, a machine
      // with both an iOS simulator and an Android emulator attached to one dev server reads
      // whichever target the dev server lists first — which after `navigate --android` was the
      // simulator [friction run 6, F54 and F51].
      command: `${PROGRAM_PREFIX} runtime:errors --${platform}`,
      why: `Reads the errors the app on this ${platform} device reported while rendering this route.`,
    },
  ]);
}
