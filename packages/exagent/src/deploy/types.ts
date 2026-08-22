// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// The result shape of one deploy: "deterministic orchestration (export → upload → URLs back)", so
// the same run answers a human summary and a machine payload. Pure data — no I/O here.

import type { FollowUp } from '../followups/types';

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

/**
 * The launch created for the native platforms.
 *
 * There is no build here and no per-platform result: the service takes the project source and the
 * rest happens in the browser, for iOS and Android together (llp/0007 §Cross-platform deploy).
 */
export interface LaunchDeployResult {
  /** Identifier of the launch, for support and for a later lookup. */
  id: string;
  /** The URL that has to be opened to finish the launch. The result of the command. */
  url: string;
  /** Framework the service recognized in the uploaded source, e.g. `expo`. */
  framework: string;
  /** How long the URL stays open, in hours. */
  expiresInHours: number;
  /** What was sent: the files and bytes of the project source. */
  upload: { files: number; size: number };
}

/** The shape `exagent deploy --json` prints. Top-level keys are the stable contract (llp/0006). */
export interface DeployReport {
  projectRoot: string;
  /** Targets this run shipped, in the order they ran. */
  targets: DeployTarget[];
  web: WebDeployResult | null;
  native: LaunchDeployResult | null;
  followups: FollowUp[];
}
