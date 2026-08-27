// @ref llp/0015-backend-selection-and-config.rfc.md §The plan approved is the plan run
// Friction run 7's F71 and live staging's S5: `dev --plan --tunnel` printed a command that was not
// the command the run executed.

import type { PlanStep, StartPlan } from '../../project/types';
import { forwardedStepArgs, withForwardedExpoArgs } from '../forwardedArgs';

function step(id: string, argv: string[]): PlanStep {
  return { id, argv, reason: 'because', timeClass: 'seconds', runsOn: null };
}

function plan(...steps: PlanStep[]): StartPlan {
  return { target: 'expo-go', steps, rule: 'test', reasons: [], buildLocation: null };
}

describe(forwardedStepArgs, () => {
  it(`should add the caller's options to the expo start step`, () => {
    expect(
      forwardedStepArgs(step('start', ['expo', 'start', '--go']), ['--tunnel'], { isLast: true })
    ).toEqual({ args: ['start', '--go', '--tunnel'], dropped: [] });
  });

  // The plan already sets the flags it needs, and a flag twice on one command line is a command
  // nobody wrote.
  it(`should not add a flag the plan already sets`, () => {
    expect(
      forwardedStepArgs(step('start', ['expo', 'start', '--go']), ['--go', '--tunnel'], {
        isLast: true,
      }).args
    ).toEqual(['start', '--go', '--tunnel']);
  });

  it(`should leave an earlier step alone`, () => {
    expect(
      forwardedStepArgs(step('prebuild', ['expo', 'prebuild']), ['--tunnel'], { isLast: false })
    ).toEqual({ args: ['prebuild'], dropped: [] });
  });

  // A plan that ends in `expo run:*` has nothing to forward to, and a dropped flag has to be said
  // out loud (friction run 5, F48-3).
  it(`should report what a non-start step cannot receive`, () => {
    expect(
      forwardedStepArgs(step('run', ['expo', 'run:ios']), ['--ios', '--tunnel'], { isLast: true })
    ).toEqual({ args: ['run:ios'], dropped: ['--tunnel'] });
  });
});

describe(withForwardedExpoArgs, () => {
  it(`should carry the forwarded flags on the plan itself`, () => {
    const result = withForwardedExpoArgs(
      plan(step('prebuild', ['expo', 'prebuild']), step('start', ['expo', 'start', '--go'])),
      ['--tunnel', '--port', '8190']
    );

    expect(result.plan.steps.map((one) => one.argv)).toEqual([
      ['expo', 'prebuild'],
      ['expo', 'start', '--go', '--tunnel', '--port', '8190'],
    ]);
    expect(result.dropped).toEqual([]);
  });

  it(`should leave a plan with no forwarded flags untouched`, () => {
    const original = plan(step('start', ['expo', 'start', '--go']));

    expect(withForwardedExpoArgs(original, []).plan).toBe(original);
  });

  it(`should report the flags a run:* plan drops`, () => {
    expect(
      withForwardedExpoArgs(plan(step('run', ['expo', 'run:android'])), ['--android', '--tunnel'])
        .dropped
    ).toEqual(['--tunnel']);
  });
});
