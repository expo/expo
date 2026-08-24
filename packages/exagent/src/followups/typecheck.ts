// @ref llp/0009-smart-followups.rfc.md §Examples per command — `typecheck`.
// The three outcomes need three different next steps: a project that does not type-check has one
// thing worth doing, a clean one has the checks this gate cannot make, and a project with no
// TypeScript in it needs to know that nothing was checked rather than that everything passed.

import { capFollowUps, type FollowUp } from './types';

export interface TypeCheckFollowUpInput {
  /** Whether a compiler ran at all. */
  checked: boolean;
  /** How many diagnostics it reported. */
  errorCount: number;
}

export function buildTypeCheckFollowUps({
  checked,
  errorCount,
}: TypeCheckFollowUpInput): FollowUp[] {
  if (!checked) {
    return capFollowUps([
      {
        id: 'typecheck-not-run',
        command: 'npx exagent dev:wait',
        why: 'Nothing was type-checked, so this proves nothing about the code: the bundle check is the gate that still applies to a project without TypeScript.',
      },
    ]);
  }

  if (errorCount > 0) {
    return capFollowUps([
      {
        id: 'typecheck-rerun',
        command: 'npx exagent typecheck',
        why: 'Fix the diagnostics above and run this again — a type error the bundler is happy to compile is one nothing else in this CLI can see.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'typecheck-dev-wait',
      command: 'npx exagent dev:wait',
      why: 'The types are consistent, which is not the same as the project bundling: this builds the entry bundle and reports where it stops.',
    },
    {
      id: 'typecheck-runtime-errors',
      command: 'npx exagent runtime:errors --fail-on-error',
      why: 'Types and a bundle both being fine still says nothing about what the running app throws, which is the last of the three.',
    },
  ]);
}
