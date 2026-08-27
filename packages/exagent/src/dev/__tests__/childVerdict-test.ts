import { parseDetachedChildVerdict } from '../childVerdict';
import { needsHumanError } from '../../needsHuman/error';
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
