import { parseDetachedChildPhase, parseDetachedChildVerdict } from '../childVerdict';
import { needsHumanError } from '../../needsHuman/error';
import { formatStartPlan } from '../../plan/format';
import type { StartPlan } from '../../project/types';
import { formatNeedsHumanBlock } from '../../utils/errors';

/**
 * The log a child writes when it fails, built out of the functions that write it.
 *
 * This is the round trip the parser depends on: `Log.exception` prints `Error.toString()` and
 * `logCmdError` prints the handoff block under it, so a log is assembled here from those two rather
 * than from a string somebody typed. The pair drifts, this test fails.
 */
function childLog(error: Error, needsHuman: ReturnType<typeof formatNeedsHumanBlock> | null) {
  return [
    'Starting project at /project',
    'Waiting on http://127.0.0.1:8081',
    error.toString(),
    ...(needsHuman ?? []),
  ];
}

describe(parseDetachedChildVerdict, () => {
  it(`should read the scenario the child named`, () => {
    const error = needsHumanError('macos-automation', {
      message:
        'The plan stopped at "start": macOS refused "npx expo start --go --ios" permission to control Simulator.app.\nWhy: automation permission is granted per app.\nHow: grant it in System Settings.',
      detectedBy: 'exit-signature',
    });

    const verdict = parseDetachedChildVerdict(
      childLog(error, formatNeedsHumanBlock(error.needsHuman))
    );

    expect(verdict?.scenario).toBe('macos-automation');
    expect(verdict?.message).toContain('macOS refused');
    // The block is re-rendered by the parent from the registry, so quoting the child's copy would
    // print the same three lines twice.
    expect(verdict?.message).not.toContain('Needs a human');
  });

  it(`should read a failure that is not a needs-human one`, () => {
    const verdict = parseDetachedChildVerdict([
      'Starting project at /project',
      'CommandError: The plan stopped at "start".',
      'Why: the bundler could not start.',
    ]);

    expect(verdict).toEqual({
      scenario: null,
      message: 'CommandError: The plan stopped at "start".\nWhy: the bundler could not start.',
    });
  });

  it(`should keep the last error, which is the one the child stopped on`, () => {
    const verdict = parseDetachedChildVerdict([
      'CommandError: the first one, recovered from',
      'Waiting on http://127.0.0.1:8081',
      'CommandError: the one it stopped on',
    ]);

    expect(verdict?.message).toBe('CommandError: the one it stopped on');
  });

  it(`should answer null for the log of a healthy run`, () => {
    expect(
      parseDetachedChildVerdict([
        'Starting project at /project',
        'Waiting on http://127.0.0.1:8081',
        ' ERROR  [Error: boom from HomeScreen]',
        'Android Bundled 1200ms',
      ])
    ).toBeNull();
  });

  it(`should answer null for an empty log`, () => {
    expect(parseDetachedChildVerdict([])).toBeNull();
  });
});

// @ref llp/0004-smart-start-and-project-state.rfc.md §What a development build costs the plan
// F125. The plan table is a format of this CLI's own (`src/plan/format.ts`), so it round-trips the
// same way the verdict does: the log is built by `formatStartPlan` and read back here.
describe(parseDetachedChildPhase, () => {
  /** The child's log, as `formatStartPlan` writes it, for a plan of the given steps. */
  function planLog(steps: { argv: string[]; reason: string }[], ...after: string[]): string[] {
    const plan: StartPlan = {
      rule: 'bare-stale',
      target: 'bare',
      reasons: ['Expo SDK 57.0.17.'],
      buildLocation: null,
      steps: steps.map((step, index) => ({
        id: `step-${index}`,
        argv: step.argv,
        reason: step.reason,
        timeClass: 'minutes',
        runsOn: null,
      })),
    };
    return [...formatStartPlan(plan).split('\n'), ...after];
  }

  const RUN_ANDROID = { argv: ['expo', 'run:android'], reason: 'Builds and installs the app.' };
  const PREBUILD = { argv: ['expo', 'prebuild', '--platform', 'android'], reason: 'Generates it.' };
  const START = { argv: ['expo', 'start', '--dev-client'], reason: 'Starts the dev server.' };

  // The whole of F125: the lock is taken at the *start* of the dev-server step, and for a `run:*`
  // step that step is a ten-minute Gradle build. So a published port is not a listening one.
  it(`reads a plan still on its build step as building`, () => {
    expect(parseDetachedChildPhase(planLog([PREBUILD, RUN_ANDROID], 'Building app...'))).toEqual({
      phase: 'building',
      step: 'expo run:android',
    });
  });

  // The install is what says the compiler finished (`./buildEvidence.ts`, F121's own marker), and
  // after it the same step is starting a dev server rather than building one.
  it(`reads the same plan as serving once the app is on the device`, () => {
    expect(
      parseDetachedChildPhase(
        planLog([PREBUILD, RUN_ANDROID], '› Installing /tmp/app.apk', 'Starting Metro Bundler')
      )
    ).toEqual({ phase: 'serving', step: 'expo run:android' });
  });

  it(`reads a plan whose only step is the dev server as serving`, () => {
    expect(parseDetachedChildPhase(planLog([START]))).toEqual({
      phase: 'serving',
      step: 'expo start --dev-client',
    });
  });

  // A log with no plan in it says nothing about a phase, and guessing "building" would put a
  // sentence about a compiler into the report of a dev server that never had one.
  it(`reads a log with no plan in it as serving`, () => {
    expect(parseDetachedChildPhase(['Starting project at /project'])).toEqual({
      phase: 'serving',
      step: null,
    });
  });
});
