// @ref llp/0009-smart-followups.rfc.md §Examples per command — the readiness gate.
// Four outcomes, four different next steps: a wait that expired is worth repeating with a longer
// budget, a ready bundler with no app attached needs the app opened, another project's dev server
// needs a different dev server, and a bundle that is loaded and running is ready to be read.

import { capFollowUps, type FollowUp } from './types';

export interface DevWaitFollowUpInput {
  /** The dev server answered `packager-status:running`. */
  ready: boolean;
  /** The wait expired before the answer arrived. */
  timedOut: boolean;
  /** Whether the dev server proved it serves this project; null when it could not be decided. */
  projectRootMatched: boolean | null;
  /** Debugger targets attached to the dev server. */
  appsConnected: number;
  /** The budget the wait was given, in milliseconds. */
  timeoutMs: number;
}

export function buildDevWaitFollowUps({
  ready,
  timedOut,
  projectRootMatched,
  appsConnected,
  timeoutMs,
}: DevWaitFollowUpInput): FollowUp[] {
  // The wrong dev server first, whatever else is true: every other suggestion is about a bundle
  // that belongs to another project, so acting on one of those would confirm the wrong thing.
  if (projectRootMatched === false) {
    return capFollowUps([
      {
        id: 'dev-wait-other-project',
        command: 'npx exagent dev',
        why: 'The dev server that answered was started for another project, so start this one and pass --dev-server-url to wait on a specific dev server.',
      },
    ]);
  }

  if (timedOut && !ready) {
    return capFollowUps([
      {
        id: 'dev-wait-longer',
        command: `npx exagent dev:wait --timeout ${timeoutMs * 2}`,
        why: 'The bundler was still working when the wait expired, and a first bundle of a large app often takes longer than the budget it was given.',
      },
      {
        id: 'dev-wait-status',
        command: 'npx exagent status',
        why: 'Check that the dev server that answered is the one this project started before waiting on it again.',
      },
    ]);
  }

  if (ready && appsConnected === 0) {
    return capFollowUps([
      {
        id: 'dev-wait-open-app',
        command: `npx exagent dev:wait --require-app --timeout ${timeoutMs}`,
        why: 'The bundle is built but no app is attached, so open the app on a device or simulator and wait for it to connect.',
      },
    ]);
  }

  if (ready) {
    return capFollowUps([
      {
        id: 'dev-wait-runtime-errors',
        command: 'npx exagent runtime:errors',
        why: 'The bundle is loaded in a connected app, so an error window now says whether it is running or red-screening.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'dev-wait-status',
      command: 'npx exagent status',
      why: 'The dev server answered, but not as an Expo dev server does, so check which server is listening on that port.',
    },
  ]);
}
