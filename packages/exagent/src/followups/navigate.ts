// @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`.
// A deep link that opened is only half an answer: the other half is what the screen now shows and
// what it threw getting there. Both commands are named for the device that was actually used.

import type { NavigatePlatform } from '../navigate/device';
import { capFollowUps, type FollowUp } from './types';

export interface NavigateFollowUpInput {
  platform: NavigatePlatform;
  /** Simulator UDID or `adb` serial the link was opened on. */
  deviceId: string;
}

export interface PrintUrlFollowUpInput {
  /** The URL that was resolved. */
  url: string;
  /** What kind of host the URL carries: `tunnel`, `lan`, `localhost`, or null. */
  hostType: string | null;
  /** The run's tunnel is gone, so the URL is the fallback rather than the address it should be. */
  tunnelExpired?: boolean;
}

/**
 * What to do with a URL nothing opened.
 *
 * The URL itself is the first rung, because opening it is the next step and this command's whole
 * output is the thing to paste. What follows depends on where the URL can be used from: a host only
 * this machine can reach is the one case where the answer is a different dev server rather than a
 * different opener, and saying so here is cheaper than a cloud simulator timing out on it.
 */
export function buildPrintUrlFollowUps({
  url,
  hostType,
  tunnelExpired = false,
}: PrintUrlFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [
    {
      id: 'open-url',
      command: url,
      why:
        hostType === 'tunnel'
          ? 'Open this URL on the device that runs the app — a phone, a cloud simulator, anywhere with a network.'
          : 'Open this URL on the device that runs the app; nothing was opened here.',
    },
  ];

  if (tunnelExpired) {
    // Named for the reason it is gone rather than for the reach of the URL that replaced it: this
    // run *had* the right address and lost it, which is a different problem from never having had
    // one, and a different thing to tell whoever is reading.
    followups.push({
      id: 'tunnel-restart',
      command: 'npx exagent dev --detach --tunnel',
      why: 'The tunnel this dev server had is gone, so the URL above is the fallback address of this machine rather than one a device elsewhere can load; a restart takes a new tunnel.',
    });
  } else if (hostType === 'localhost' || hostType === 'lan') {
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
