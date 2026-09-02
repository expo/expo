// @ref llp/0007-deploy-and-headless.rfc.md §deploy — "native platforms via
// launch.expo.dev". One launch: hand the project to `create-launch`, hand its URL to the user.
//
// The browser step is not a failure and not an afterthought: signing, store accounts and
// submission need a person, so the URL *is* the result of this command.

import { event } from './events';
import { runCreateLaunchAsync, type CreateLaunchCli } from './launchCli';
import type { LaunchDeployResult } from './types';

/**
 * How long the launch URL stays open, in hours.
 *
 * The launch CLI does not report an expiry, so this is the documented lifetime of a launch rather
 * than a value read from its output — it is here, once, so the two places that print it cannot
 * drift.
 */
export const LAUNCH_LINK_EXPIRY_HOURS = 8;

export interface LaunchProjectOptions {
  cli: CreateLaunchCli;
  /** Directory the launch CLI runs in, which is the directory it uploads. */
  uploadRoot: string;
  /** Path of the app inside that directory, posix separated, for a monorepo. */
  projectPath?: string;
  /** The command owns stdout, so the progress of the CLI is not printed. */
  json: boolean;
}

/** Create the launch for the native platforms, and report what has to be opened. */
export async function launchProjectAsync(
  options: LaunchProjectOptions
): Promise<LaunchDeployResult> {
  const launch = await runCreateLaunchAsync(options);

  event('launch', { id: launch.id, url: launch.url, framework: launch.framework });

  return { ...launch, expiresInHours: LAUNCH_LINK_EXPIRY_HOURS };
}
