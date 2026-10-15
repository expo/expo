import { events, flushEventLogger } from '2g';

import { exit } from '../../log';
import { AbortCommandError, CommandError, logCmdError, SilentError } from '../errors';

jest.mock('../../log');
jest.mock('2g', () => {
  const actual = jest.requireActual('2g');
  const event = Object.assign(jest.fn(), actual.events('cli'));
  return {
    ...actual,
    events: Object.assign(() => event, actual.events),
    flushEventLogger: jest.fn(),
  };
});

it.each([
  new CommandError('BAD_ARGS', 'invalid options'),
  new Error('unexpected failure'),
  new SilentError(),
  new AbortCommandError(),
])('waits for pending events before exiting for %s', async (error) => {
  let finishFlush!: () => void;
  jest.mocked(flushEventLogger).mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finishFlush = resolve;
    })
  );
  const stopped = new Error('process exited');
  const stop = () => {
    throw stopped;
  };
  jest.mocked(exit).mockImplementation(stop);
  const processExit = jest.spyOn(process, 'exit').mockImplementation(stop);
  try {
    const result = logCmdError(error);
    expect(exit).not.toHaveBeenCalled();
    expect(processExit).not.toHaveBeenCalled();
    finishFlush();
    await expect(result).rejects.toThrow(stopped);
    if (error instanceof SilentError || error instanceof AbortCommandError) {
      expect(events('cli')).not.toHaveBeenCalled();
    }
  } finally {
    processExit.mockRestore();
  }
});
