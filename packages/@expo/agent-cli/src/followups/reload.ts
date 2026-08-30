// @ref llp/0009-smart-followups.rfc.md §Examples per command — `reload`.
// What to do with an app that has just been put back on the current code: read what the *new*
// run reports, and look at the screen it is on.

import { AGENT_DEVICE_SPEC } from '../device/cloudSimulator';
import type { DeviceBackend } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface ReloadFollowUpInput {
  /**
   * Which device layer the app is on.
   *
   * The same reason `navigate`'s follow-ups carry it: a `Try:` line has to be runnable [llp/0009
   * §Design], and `xcrun simctl io <session-id>` is not — a cloud session is not a simulator on
   * this machine. Defaults to the local backend for the platform, which is what a run whose reload
   * went over the dev server and never resolved a device means.
   */
  backend?: DeviceBackend;
  /**
   * Platform this reload was about, or null when nothing named one.
   *
   * The device is only resolved by the *device* method, so a reload over the dev server used to
   * leave this null even for a run told `--android` — and the commands below then carried no flag,
   * which on a machine with both apps attached reads the other platform [friction run 6, F54].
   * So it is the session's platform, not only the resolved device's.
   */
  platform: 'ios' | 'android' | null;
  /** Device the app is on, or null when the reload never needed one. */
  deviceId: string | null;
  /** Route the reload landed on, or null when it resumed where it was. */
  route: string | null;
  /** The `adb` that was run, so the screenshot line is a command this machine can run (F49). */
  adbPath?: string;
}

/**
 * The next actions after a reload.
 *
 * `runtime:errors` leads, and the reason is the whole point of the command: before the reload, a
 * non-empty error window described a run that no longer exists, so the first useful thing to do
 * with a reloaded app is to read the errors of the run that does.
 */
export function buildReloadFollowUps({
  backend,
  platform,
  deviceId,
  route,
  adbPath = 'adb',
}: ReloadFollowUpInput): FollowUp[] {
  const flag = platform == null ? '' : ` --${platform}`;
  const on = backend ?? (platform === 'android' ? 'local-android' : 'local-ios');
  const followups: FollowUp[] = [
    {
      id: 'runtime-errors',
      command: `${PROGRAM_PREFIX} runtime:errors${flag} --fail-on-error`,
      why: 'The app is running the current code now, so the errors it reports are about that code and not about the run this reload replaced.',
    },
  ];

  if (platform != null && deviceId != null) {
    followups.push({
      id: 'screenshot',
      command:
        on === 'cloud'
          ? // The controller's own verb, run through the session bridge. Never `xcrun`: there is no
            // simulator on this machine to point it at.
            `npx eas simulator:exec npx ${AGENT_DEVICE_SPEC} screenshot screen.png`
          : platform === 'ios'
            ? `xcrun simctl io ${deviceId} screenshot screen.png`
            : `${adbPath} -s ${deviceId} exec-out screencap -p > screen.png`,
      why: `Captures what the reloaded app is showing${route ? ` on ${route}` : ''}${
        on === 'cloud' ? ' on the cloud simulator, downloaded here' : ''
      }, which is the one thing no gate in this CLI can read.`,
    });
  }

  if (route == null) {
    followups.push({
      id: 'navigate',
      // The backend the reload used, carried on: `navigate /` without it looks for a device on
      // this machine, which is the machine a cloud run has none on.
      command: `${PROGRAM_PREFIX} navigate /${flag}${on === 'cloud' ? ' --cloud' : ''}`,
      why: 'The app resumed on the route it was launched with; this puts it back on the root route.',
    });
  }

  return capFollowUps(followups);
}
