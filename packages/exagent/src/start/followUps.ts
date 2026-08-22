// @ref llp/0009-smart-followups.rfc.md §Examples per command — `start`.
// The follow-ups of a run that starts a dev server, shared by the plain wrapper and the plan
// executor. Both know which app the URL is for, which is the one fact the builder cannot guess.

import {
  buildStartFollowUps,
  easJsonExistsSync,
  followUpsEnabled,
  resolveDevServerPort,
  resolveExpoGoLanUrl,
  type FollowUp,
} from '../followups';
import type { StartOptions } from './resolveOptions';

export interface StartTargetHint {
  /** The app the dev server will be opened in runs inside Expo Go. */
  expoGo: boolean;
  /** The run only serves a web bundle, so no phone or simulator is involved. */
  web: boolean;
}

/**
 * The follow-ups of a dev-server run, or an empty list when they are suppressed.
 *
 * Everything here is read locally and synchronously: the port comes from the arguments already
 * resolved, the LAN address from this host's interface list, and `eas.json` from one `stat`. The
 * caller is on the last line before the dev server takes over the terminal, so nothing may block.
 */
export function resolveStartFollowUps(
  projectRoot: string,
  options: StartOptions,
  { expoGo, web }: StartTargetHint
): FollowUp[] {
  if (!followUpsEnabled(options.followups)) {
    return [];
  }

  return buildStartFollowUps({
    expoGo,
    web,
    lanUrl: expoGo ? resolveExpoGoLanUrl(resolveDevServerPort(options.expoArgs)) : null,
    easJson: easJsonExistsSync(projectRoot),
  });
}
