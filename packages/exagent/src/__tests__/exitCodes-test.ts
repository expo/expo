import { flushEventLogger } from '2g';

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
