// @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`.
// A deep link that opened is only half an answer: the other half is what the screen now shows and
// what it threw getting there. Both commands are named for the device that was actually used.

import { openInPhrase } from '../navigate/connectUrl';
import type { NavigatePlatform } from '../navigate/device';
import { capFollowUps, type FollowUp } from './types';

export interface NavigateFollowUpInput {
  platform: NavigatePlatform;
  /** Simulator UDID or `adb` serial the link was opened on. */
  deviceId: string;
}

export interface PrintUrlFollowUpInput {
  /** The URL that was resolved for the route. */
  url: string;
  /** What kind of host the URL carries: `tunnel`, `lan`, `localhost`, or null. */
  hostType: string | null;
  /** How to point an app at this dev server, one entry per application that could be meant. */
  connect?: { target: string; url: string; label: string }[];
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
      command: 'npx exagent dev --detach --tunnel',
      why: `The dev server is only reachable from ${
        hostType === 'localhost' ? 'this machine' : 'this network'
      }, so a device anywhere else cannot load that URL; a tunnel serves the same dev server from any network.`,
    });
  }

  followups.push({
    id: 'runtime-errors',
    command: 'npx exagent runtime:errors',
    why: 'Once something opens the URL and the app attaches, this reads what it throws.',
  });

  return capFollowUps(followups);
}

export function buildNavigateFollowUps({ platform, deviceId }: NavigateFollowUpInput): FollowUp[] {
  return capFollowUps([
    {
      id: 'screenshot',
      command:
        platform === 'ios'
          ? `xcrun simctl io ${deviceId} screenshot screen.png`
          : `adb -s ${deviceId} exec-out screencap -p > screen.png`,
      why: 'Captures the screen this route opened, so the change can be checked as it renders.',
    },
    {
      id: 'runtime-errors',
      command: 'npx exagent runtime:errors',
      why: 'Reads the errors the app reported while rendering this route.',
    },
  ]);
}
