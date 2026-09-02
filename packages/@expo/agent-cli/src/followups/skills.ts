// @ref llp/0009-smart-followups.rfc.md §Examples per command — `skills:sync`.
// @ref llp/0017-deferred-commands.reference.md §Not built — agent-aware rendering: a detected agent gets
// the note that it does not have to load these files itself.

import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface SkillsSyncFollowUpInput {
  /** Packages that ship a discovered skill. */
  skillPackages: string[];
  /** Id of the agent driving the CLI, or null when none was detected. */
  agentId: string | null;
}

export function buildSkillsSyncFollowUps({
  skillPackages,
  agentId,
}: SkillsSyncFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [
    {
      id: 'skills-list',
      command: `${PROGRAM_PREFIX} skills:list`,
      why: 'Lists every discovered skill and the agent directories it is linked into.',
    },
  ];

  if (agentId && skillPackages.length) {
    followups.push({
      id: 'skills-show',
      command: `${PROGRAM_PREFIX} skills:show ${skillPackages[0]}`,
      why: `${agentId} loads the linked skills automatically, so nothing has to read them here; this prints one on demand.`,
    });
  }

  return capFollowUps(followups);
}
