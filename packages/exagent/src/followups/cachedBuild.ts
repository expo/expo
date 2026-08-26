// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
// @ref llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
//
// The one rung two commands share. `impact` reaches it from "the native surface changed" and
// `status` from "the recorded build is stale", and both arrive at the same place: EAS already has
// the app a rebuild would produce, so the next command is a download.
//
// One builder rather than two identical strings, because the sentence is the reason the whole
// build-cache lookup exists and two copies drift the moment one of them is edited. The **id** is
// the caller's, since ids are the assertable half of the follow-up contract (`FollowUp.id`) and an
// eval that asserts `impact-cached-build` must not start matching a `status` run.

import type { FollowUp } from './types';

/** Where the rung is offered, and therefore what it is an answer to. */
export type CachedBuildContext = 'impact' | 'status';

/**
 * "Download the build EAS already has" — for a build that was actually found.
 *
 * @param buildId the finished build's id; the command is useless without one, so callers check.
 */
export function cachedBuildFollowUp(context: CachedBuildContext, buildId: string): FollowUp {
  return {
    id: `${context}-cached-build`,
    command: `npx eas build:download --build-id ${buildId}`,
    why:
      context === 'impact'
        ? `EAS already has a finished build made from this exact fingerprint (${buildId}), so installing it is the same app a new build would produce, without the wait.`
        : `The recorded build no longer matches this project, but EAS already has a finished one made from this exact fingerprint (${buildId}) — downloading it is the same app a rebuild would produce, without the build.`,
  };
}
