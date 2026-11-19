import { events, flushEventLogger } from '2g';

import { exit } from '../../log';
import { AbortCommandError, CommandError, logCmdError, SilentError } from '../errors';
import { isInteractive } from '../interactive';
import { withProgramStatus } from '../programStatus';

jest.mock('../interactive', () => ({
  isInteractive: jest.fn(() => false),
}));

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

describe('program status', () => {
  let write: jest.SpyInstance;
  let processExit: jest.SpyInstance;
  const stopped = new Error('process exited');
  const stop = () => {
    throw stopped;
  };

  beforeEach(async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    jest.mocked(exit).mockImplementation(stop);
    processExit = jest.spyOn(process, 'exit').mockImplementation(stop);
    write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await withProgramStatus({ state: 'working' }, async () => {});
    write.mockClear();
  });

  afterEach(() => {
    write.mockRestore();
    processExit.mockRestore();
    jest.mocked(isInteractive).mockReturnValue(false);
  });

  it('reports error with the message after reporting working', async () => {
    await expect(logCmdError(new Error('Installing failed'))).rejects.toThrow(stopped);

    expect(write.mock.calls).toEqual([
      ['\x1b]7501;state=error:app=expo:msg=SW5zdGFsbGluZyBmYWlsZWQ=\x1b\\'],
    ]);
  });

  it('reports nothing for a cancelled prompt', async () => {
    await expect(logCmdError(new AbortCommandError())).rejects.toThrow(stopped);

    expect(write).not.toHaveBeenCalled();
  });
});
