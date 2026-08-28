import { flushEventLogger } from '2g';
import fs from 'fs';
import path from 'path';

import {
  EXIT_ERROR,
  EXIT_NEEDS_HUMAN,
  EXIT_OK,
  EXIT_OUTCOME_CANCELED,
  EXIT_OUTCOME_FAILED,
  EXIT_OUTCOME_TIMEOUT,
  exitWithCodeAsync,
} from '../exitCodes';

jest.mock('2g', () => ({ flushEventLogger: jest.fn(async () => {}) }));

// The sweep below reads this repository rather than a fixture, and the suite-wide `fs` mock is
// memfs, which has none of these files in it.
jest.unmock('fs');
jest.unmock('node:fs');

/**
 * Every `.ts` file of the CLI that a command can reach, relative to `src`.
 *
 * `deferred` is out for the reason llp/0016 §Deferred is a place gives: nothing there is loaded by
 * a registry entry, and `build:wait` — the one command whose outcomes reached exit 21 — lives in
 * it. The tests are out because a test naming a constant is not a command emitting it.
 *
 * Walked here rather than through `src/lint/sweep.ts`, which pulls the event logger in with it and
 * would need this suite's `2g` double to be the whole module.
 */
function sourceFilesUnder(root: string, prefix = ''): string[] {
  const skipped = new Set(['__tests__', '__mocks__', 'node_modules', 'build', 'deferred']);
  return fs
    .readdirSync(path.join(root, prefix), { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      if (entry.isDirectory()) {
        return skipped.has(entry.name) ? [] : sourceFilesUnder(root, relative);
      }
      return entry.name.endsWith('.ts') ? [relative] : [];
    })
    .sort();
}

describe('exit codes', () => {
  // The numbers are the contract a driving agent reads before it reads any output, so they are
  // pinned here rather than only where they are used (llp/0010).
  it('are the numbers of the convention', () => {
    expect(EXIT_OK).toBe(0);
    expect(EXIT_ERROR).toBe(1);
    expect(EXIT_NEEDS_HUMAN).toBe(7);
    expect(EXIT_OUTCOME_FAILED).toBe(20);
    expect(EXIT_OUTCOME_CANCELED).toBe(21);
    expect(EXIT_OUTCOME_TIMEOUT).toBe(22);
  });

  it('keeps the outcome band inside the 20-29 reservation', () => {
    for (const code of [EXIT_OUTCOME_FAILED, EXIT_OUTCOME_CANCELED, EXIT_OUTCOME_TIMEOUT]) {
      expect(code).toBeGreaterThanOrEqual(20);
      expect(code).toBeLessThanOrEqual(29);
    }
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — `21` is reserved and unemitted
  // The doc comment on the constant, and the row of the table, both claim that no v1 command exits
  // 21. This is what makes the claim checkable: a command that starts emitting it fails here, and
  // whoever adds it updates the documentation in the same change.
  it('emits 21 from nowhere, which is what its documentation says', () => {
    const root = path.resolve(__dirname, '..');
    const files = sourceFilesUnder(root);
    // A floor, so a walk that stopped finding anything cannot report "nothing emits it".
    expect(files.length).toBeGreaterThan(150);

    const users = files.filter(
      (file) =>
        file !== 'exitCodes.ts' &&
        fs.readFileSync(path.join(root, file), 'utf8').includes('EXIT_OUTCOME_CANCELED')
    );


    expect(users).toEqual([]);
  });

  it('names every code once', () => {
    const codes = [
      EXIT_OK,
      EXIT_ERROR,
      EXIT_NEEDS_HUMAN,
      EXIT_OUTCOME_FAILED,
      EXIT_OUTCOME_CANCELED,
      EXIT_OUTCOME_TIMEOUT,
    ];
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe(exitWithCodeAsync, () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('flushes the event stream before it exits', async () => {
    let flushed = false;
    jest.mocked(flushEventLogger).mockImplementation(async () => {
      flushed = true;
    });

    exitWithCodeAsync(EXIT_OUTCOME_FAILED);
    await new Promise((resolve) => setImmediate(resolve));

    expect(flushed).toBe(true);
    expect(exitSpy).toHaveBeenCalledWith(20);
  });

  // A flush that fails must not turn an outcome into a hung process: the code still leaves.
  it('exits even when the flush fails', async () => {
    jest.mocked(flushEventLogger).mockRejectedValue(new Error('no writer'));

    exitWithCodeAsync(EXIT_NEEDS_HUMAN);
    await new Promise((resolve) => setImmediate(resolve));

    expect(exitSpy).toHaveBeenCalledWith(7);
  });

  it('never settles, so a caller has nothing left to run', async () => {
    jest.mocked(flushEventLogger).mockResolvedValue(undefined as never);
    const settled = jest.fn();

    exitWithCodeAsync(EXIT_OK).then(settled, settled);
    await new Promise((resolve) => setImmediate(resolve));

    expect(settled).not.toHaveBeenCalled();
  });
});
