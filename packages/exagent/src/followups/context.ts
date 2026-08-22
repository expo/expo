// @ref llp/0009-smart-followups.rfc.md §Design — `context` answers "what is this project", so its
// follow-ups are the two commands that answer the questions it deliberately leaves out: what is
// true right now, and what would happen next.

import type { ProjectState } from '../project/types';
import { capFollowUps, type FollowUp } from './types';

export function buildContextFollowUps(state: ProjectState): FollowUp[] {
  const followups: FollowUp[] = [];

  // A project Expo Go cannot run and that has no dev client cannot be started at all until this
  // is installed, so it comes before the two orientation commands.
  if (!state.expoGo.compatible && !state.usesDevClient) {
    followups.push({
      id: 'install-dev-client',
      command: 'npx exagent install expo-dev-client',
      why: 'Expo Go cannot run this project and expo-dev-client is not a dependency, so no development build can be made yet.',
    });
  }

  followups.push(
    {
      id: 'status',
      command: 'npx exagent status',
      why: 'Adds what is true right now: the dev server, the recorded builds, and the linked skills.',
    },
    {
      id: 'start-plan',
      command: 'npx exagent start --plan',
      why: 'Prints what must run to get this project onto a device, without running any of it.',
    }
  );

  return capFollowUps(followups);
}
