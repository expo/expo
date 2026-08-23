import { EXIT_NEEDS_HUMAN } from '../../exitCodes';
import { CommandError, logCmdError } from '../errors';

jest.mock('2g', () => {
  const events: any = () => jest.fn();
  events.debug = () => jest.fn();
  return { events, flushEventLogger: jest.fn(async () => {}) };
});

jest.mock('../../log', () => ({
  exit: jest.fn(),
  exception: jest.fn(),
  warn: jest.fn(),
}));

describe(logCmdError, () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  /** Run the error path and wait for the flush the exit is chained onto. */
  async function exitCodeOfAsync(error: Error): Promise<unknown> {
    logCmdError(error);
    await new Promise((resolve) => setImmediate(resolve));
    return exitSpy.mock.calls[0]?.[0];
  }

  it('exits 1 for an error that names no code', async () => {
    expect(await exitCodeOfAsync(new CommandError('BAD_ARGS', 'nope'))).toBe(1);
  });

  // The band an error opts into: a step only a person can finish is not a tool failure
  // (llp/0010 §Exit codes).
  it('exits with the code the error carries', async () => {
    const error = new CommandError('NEEDS_HUMAN', 'Finish the login in your browser.');
    error.exitCode = EXIT_NEEDS_HUMAN;

    expect(await exitCodeOfAsync(error)).toBe(7);
  });
});
