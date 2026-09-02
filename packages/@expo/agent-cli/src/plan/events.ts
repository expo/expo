import { events } from '2g';
import type { SerializedError } from '2g';

import type { PlanStep, ProjectTarget } from '../project/types';
import type { PlanBuildLocation } from '../toolchain/types';

declare module '2g' {
  interface EventRegistry {
    /**
     * The plan-first contract of LLP 0004: emitted before any step runs, both for
     * `@expo/agent-cli dev --plan` (which stops here) and for `@expo/agent-cli dev` (which executes the steps).
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §Plan contract
     */
    'cli:start_plan': {
      /** `plan` emits and stops; `smart` executes the steps next. */
      mode: 'plan' | 'smart';
      target: ProjectTarget;
      rule: string;
      steps: PlanStep[];
      reasons: string[];
      /**
       * Where the build in this plan runs and whether this machine can do it, or `null` when the
       * plan builds nothing.
       *
       * @see llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
       */
      buildLocation: PlanBuildLocation | null;
    };
    /**
     * A plan with build-class steps was printed to a terminal without `--yes`, so nothing ran.
     *
     * `rerun` is the command that runs it: the caller's own invocation plus the flag, which is
     * what consent looks like now that this CLI asks no questions.
     *
     * @see llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt
     */
    'cli:start_plan_needs_consent': { rule: string; steps: number; rerun: string };
    /** One plan step is about to be spawned. */
    'cli:start_plan_step': { id: string; argv: string[]; index: number; total: number };
    /** One plan step finished. A non-zero code stops the plan. */
    'cli:start_plan_step_exit': { id: string; code: number };
    'cli:last_build_record_failed': { error: SerializedError };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
