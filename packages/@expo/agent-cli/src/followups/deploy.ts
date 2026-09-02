// @ref llp/0009-smart-followups.rfc.md §Examples per command — escalation
// ladders. A deploy is never the last rung: a web deployment has a preview URL to promote, and a
// launch is not finished until someone opens it in a browser.

import { capFollowUps, type FollowUp } from './types';

export interface DeployFollowUpInput {
  /** The web deployment that ran, or null when no web target was deployed. */
  web: { url: string | null } | null;
  /** The launch that was created, or null when no native target was deployed. */
  launch: { url: string; expiresInHours: number } | null;
}

/**
 * The next rungs after the deploy that just ran.
 *
 * The launch comes first when both rails ran: the web deployment is already live, while the launch
 * is a handover that nothing else can finish (llp/0007 §deploy).
 */
export function buildDeployFollowUps({ web, launch }: DeployFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];

  if (launch) {
    followups.push({
      id: 'open-launch-url',
      command: launch.url,
      why: `Open this in a browser to finish the launch: the store account, the signing and the submission happen there. The link expires in ${launch.expiresInHours} hours.`,
    });
  }

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

  return capFollowUps(followups);
}
