// @ref llp/0009-smart-followups.rfc.md §Examples per command, and §Wider ideas — escalation
// ladders. A deploy is never the last rung: a web deployment has a preview URL to promote, and a
// native build is a binary that still has to reach a store.

import type { DeployPlatform } from '../deploy/types';
import { capFollowUps, type FollowUp } from './types';

export interface DeployFollowUpInput {
  /** The web deployment that ran, or null when no web target was deployed. */
  web: { url: string | null } | null;
  /** The native build that was started, or null when no native target was built. */
  native: { platform: DeployPlatform; buildUrl: string | null } | null;
}

/** The next rungs after the deploy that just ran, web first, because it is the one that is live. */
export function buildDeployFollowUps({ web, native }: DeployFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];

  if (web) {
    if (web.url) {
      followups.push({
        id: 'open-deployment',
        command: web.url,
        why: 'The deployment answers here; open it to check what shipped.',
      });
    }
    followups.push({
      id: 'eas-deploy-prod',
      command: 'npx eas deploy --prod',
      why: 'This deploy got a preview URL; --prod publishes the same export to the production URL.',
    });
  }

  if (native) {
    if (native.buildUrl) {
      followups.push({
        id: 'open-build',
        command: native.buildUrl,
        why: 'The build runs in the cloud; this page has its logs and the install link when it finishes.',
      });
    }
    followups.push({
      id: 'eas-submit',
      command: `npx eas submit --platform ${native.platform} --latest`,
      why: 'Sends the finished build to the store, which is the rung above internal distribution.',
    });
  }

  return capFollowUps(followups);
}
