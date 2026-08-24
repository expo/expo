// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// The two words this CLI has for where a build happens, defined once. Every plan step, follow-up,
// help page and report that mentions a build takes its wording from here, so `local` and `eas`
// mean the same thing in all of them.

import type { NativePlatform } from '../plan/types';

/**
 * Where a build runs.
 *
 * - `local` — on this machine, with this machine's toolchain (Xcode, the Android SDK).
 * - `eas` — on EAS, in the cloud, with an Expo account and a place in the build queue.
 *
 * A step that builds nothing carries `null` rather than a third value: "where does it run" is not
 * a question about `expo start`, and answering it anyway would make the key unreadable.
 */
export type RunsOn = 'local' | 'eas';

/** Where a `local` build runs, as a phrase that fits mid-sentence. */
export const LOCAL_WHERE = 'on this machine';

/** Where an `eas` build runs, as a phrase that fits mid-sentence. */
export const EAS_WHERE = 'on EAS, in the cloud';

/** What an EAS build needs before it can start, in the caller's terms. */
export const EAS_REQUIREMENT = 'an Expo account';

/** The profile an EAS build of a development client is started with. */
export const EAS_DEVELOPMENT_PROFILE = 'development';

/** One word per place, for a column in a table. */
export const RUNS_ON_LABELS: Record<RunsOn, string> = {
  local: 'local',
  eas: 'eas',
};

/**
 * What a local build of one platform needs on this machine.
 *
 * Named the same way everywhere: the requirement a plan prints, the requirement a follow-up names
 * and the requirement the probe reports are one string, so a reader never has to decide whether
 * "Xcode" and "the Xcode toolchain" are the same thing.
 */
export function localRequirement(platform: NativePlatform): string {
  return platform === 'ios' ? `Xcode ${LOCAL_WHERE}` : `the Android SDK ${LOCAL_WHERE}`;
}

/** Where a build of this platform runs, and what that place asks of the caller. */
export function describeRunsOn(runsOn: RunsOn, platform: NativePlatform): string {
  return runsOn === 'local'
    ? `runs ${LOCAL_WHERE}, and needs ${localRequirement(platform)}`
    : `runs ${EAS_WHERE}, and needs ${EAS_REQUIREMENT}`;
}

/** The EAS build that replaces a local one, ready to paste. */
export function easBuildCommand(
  platform: NativePlatform,
  profile: string = EAS_DEVELOPMENT_PROFILE
): string {
  return `npx eas build --platform ${platform} --profile ${profile}`;
}
