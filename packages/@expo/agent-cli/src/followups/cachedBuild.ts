// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
//
// "EAS already has the app a rebuild would produce, so the next command is a download."
//
// This was two builders with one sentence between them, reached from `@expo/agent-cli impact` and from
// `@expo/agent-cli status`. The fold left one caller, so it is one builder with one id — the simplification
// the fold was for, and a reminder that two copies of a sentence are often two commands that should
// have been one.

import type { FollowUp } from './types';

/**
 * Download the build EAS already has, instead of making the one it would match.
 *
 * @param buildId the finished build's id; the command is useless without one, so callers check.
 */
export function cachedBuildFollowUp(buildId: string): FollowUp {
  return {
    id: 'cached-build',
    command: `npx eas build:download --build-id ${buildId}`,
    why: `The installed build no longer matches this project, and EAS already has a finished one made from this exact fingerprint (${buildId}) — downloading it is the same app a rebuild would produce, without the build.`,
  };
}
