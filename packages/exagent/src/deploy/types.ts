// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// The result shape of one deploy: "deterministic orchestration (export → upload → URLs back)", so
// the same run answers a human summary and a machine payload. Pure data — no I/O here.

import type { FollowUp } from '../followups/types';

/** A platform EAS Build builds for. Web is not one of these: it deploys, it does not build. */
export type DeployPlatform = 'ios' | 'android';

/** What a deploy run was asked to ship. */
export type DeployTarget = 'web' | 'native';

export interface WebDeployResult {
  /** URL the deployment answers on, read from the `eas deploy` output. Null when it was not found. */
  url: string | null;
  /** Directory `expo export` wrote and `eas deploy` uploaded, relative to the project. */
  exportDir: string;
  /** Last lines of the deploy output, so an agent can see what the URL was parsed from. */
  outputTail: string;
}

export interface NativeDeployResult {
  platform: DeployPlatform;
  /** `eas.json` build profile the build ran with. */
  profile: string;
  /** EAS Build page of the build that was started. Null when it was not found in the output. */
  buildUrl: string | null;
  /** What this build is not yet: an app installed on a device. */
  note: string;
  outputTail: string;
}

/** The shape `exagent deploy --json` prints. Top-level keys are the stable contract (llp/0006). */
export interface DeployReport {
  projectRoot: string;
  /** Targets this run shipped, in the order they ran. */
  targets: DeployTarget[];
  web: WebDeployResult | null;
  native: NativeDeployResult | null;
  followups: FollowUp[];
}
