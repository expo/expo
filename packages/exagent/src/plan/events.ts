import { events } from '2g';
import type { SerializedError } from '2g';

import type { PlanStep, ProjectTarget } from '../project/types';

declare module '2g' {
  interface EventRegistry {
    /**
     * The plan-first contract of LLP 0004: emitted before any step runs, both for
     * `exagent dev --plan` (which stops here) and for `exagent dev` (which executes the steps).
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
     */
    'cli:start_plan': {
      /** `plan` emits and stops; `smart` executes the steps next. */
      mode: 'plan' | 'smart';
      target: ProjectTarget;
      rule: string;
      steps: PlanStep[];
      reasons: string[];
    };
    /**
     * An interactive run was offered a plan with build-class steps and said no, so nothing ran.
     *
     * @see llp/0008-guardrails.rfc.md §Plan-with-cost dry run
     */
    'cli:start_plan_declined': { rule: string; steps: number };
    /** One plan step is about to be spawned. */
    'cli:start_plan_step': { id: string; argv: string[]; index: number; total: number };
    /** One plan step finished. A non-zero code stops the plan. */
    'cli:start_plan_step_exit': { id: string; code: number };
    'cli:last_build_record_failed': { error: SerializedError };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
