// @ref llp/0015-backend-selection-and-config.rfc.md §The plan approved is the plan run
// @ref llp/0021-honest-reports.rfc.md §How they show up
// Folding the `expo start` options a caller typed into the plan that gets printed.
//
// `@expo/agent-cli dev` forwards what it does not own to the `expo start` its plan ends with, and it used to
// do that *while running the step* — after the plan had been emitted. So `dev --plan --json
// --tunnel` printed `argv: ["expo","start","--go"]` and the run executed
// `expo start --go --port 8190 --tunnel` [observed — friction run 7, F71; live staging, S5]. A plan
// that under-reports the command it will run is the one thing llp/0015 §The plan approved is the
// plan run forbids: the person or agent who approved it approved something else.
//
// The fix is ordering, not new behaviour. The forwarded options are resolved onto the plan's own
// steps *before* anything is printed, so the plan object, the `cli:start_plan` event, the
// confirmation table and the subprocess all read from the same argv.

import { isPlatformFlag } from '../plan/platformFlags';
import type { PlanStep, StartPlan } from '../project/types';

/** What one step runs with, once the caller's own `expo start` options are folded in. */
export interface ForwardedStepArgs {
  /** The step's arguments, without the CLI name. */
  args: string[];
  /**
   * Options that were **not** passed on, because this step is not `expo start`.
   *
   * A plan that ends in `expo prebuild` or `expo run:*` has nothing to forward to, and dropping a
   * flag silently is what made an unknown option read as though it had been understood
   * [friction run 5, F48-3]. Platform flags are not counted: they were already acted on, by
   * choosing the platform the step builds for.
   */
  dropped: string[];
}

/**
 * The arguments a step runs with.
 *
 * Pure, so the one rule that is easy to get wrong is testable: a flag the plan already sets is not
 * added a second time, and only the **last** step of a plan is the one the caller's options belong
 * to — the earlier ones are prebuilds and installs.
 */
export function forwardedStepArgs(
  step: PlanStep,
  expoArgs: readonly string[],
  { isLast }: { isLast: boolean }
): ForwardedStepArgs {
  const args = step.argv.slice(1);
  if (!isLast || expoArgs.length === 0) {
    return { args, dropped: [] };
  }
  if (step.argv[0] !== 'expo' || step.argv[1] !== 'start') {
    return { args, dropped: expoArgs.filter((arg) => !isPlatformFlag(arg)) };
  }
  return { args: [...args, ...expoArgs.filter((arg) => !args.includes(arg))], dropped: [] };
}

/**
 * The same plan, with the caller's `expo start` options on the step that will receive them.
 *
 * @returns the plan and whatever could not be forwarded, for the caller to say out loud.
 */
export function withForwardedExpoArgs(
  plan: StartPlan,
  expoArgs: readonly string[]
): { plan: StartPlan; dropped: string[] } {
  if (expoArgs.length === 0 || plan.steps.length === 0) {
    return { plan, dropped: [] };
  }
  const lastIndex = plan.steps.length - 1;
  let dropped: string[] = [];
  const steps = plan.steps.map((step, index) => {
    const resolved = forwardedStepArgs(step, expoArgs, { isLast: index === lastIndex });
    if (resolved.dropped.length) {
      dropped = resolved.dropped;
    }
    return { ...step, argv: [step.argv[0]!, ...resolved.args] };
  });
  return { plan: { ...plan, steps }, dropped };
}
