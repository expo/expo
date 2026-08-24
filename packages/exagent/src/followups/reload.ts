// @ref llp/0009-smart-followups.rfc.md §Examples per command — `reload`.
// What to do with an app that has just been put back on the current code: read what the *new*
// run reports, and look at the screen it is on.

import { capFollowUps, type FollowUp } from './types';

export interface ReloadFollowUpInput {
  /** Device the app is on, or null when the reload never needed one. */
  platform: 'ios' | 'android' | null;
  deviceId: string | null;
  /** Route the reload landed on, or null when it resumed where it was. */
  route: string | null;
}

/**
 * The next actions after a reload.
 *
 * `runtime:errors` leads, and the reason is the whole point of the command: before the reload, a
 * non-empty error window described a run that no longer exists, so the first useful thing to do
 * with a reloaded app is to read the errors of the run that does.
 */
export function buildReloadFollowUps({
  platform,
  deviceId,
  route,
}: ReloadFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [
    {
      id: 'runtime-errors',
      command: 'npx exagent runtime:errors --fail-on-error',
      why: 'The app is running the current code now, so the errors it reports are about that code and not about the run this reload replaced.',
    },
  ];

  if (platform != null && deviceId != null) {
    followups.push({
      id: 'screenshot',
      command:
        platform === 'ios'
          ? `xcrun simctl io ${deviceId} screenshot screen.png`
          : `adb -s ${deviceId} exec-out screencap -p > screen.png`,
      why: `Captures what the reloaded app is showing${route ? ` on ${route}` : ''}, which is the one thing no gate in this CLI can read.`,
    });
  }

  if (route == null) {
    followups.push({
      id: 'navigate',
      command: 'npx exagent navigate /',
      why: 'The app resumed on the route it was launched with; this puts it back on the root route.',
    });
  }

  return capFollowUps(followups);
}
