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
      // The platform this link was opened on, carried into the next command. Without it, a machine
      // with both an iOS simulator and an Android emulator attached to one dev server reads
      // whichever target the dev server lists first — which after `navigate --android` was the
      // simulator [friction run 6, F54 and F51].
      command: `npx exagent runtime:errors --${platform}`,
      why: `Reads the errors the app on this ${platform} device reported while rendering this route.`,
    },
  ]);
}
