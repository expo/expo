import { Writable } from 'node:stream';

import { getWellKnownTemporaryLogFile } from '..';

const originalConsole = globalThis.console;
const originalStdoutDescriptor = Object.getOwnPropertyDescriptor(process, 'stdout');
const originalStderrDescriptor = Object.getOwnPropertyDescriptor(process, 'stderr');

type MockWriteStream = Writable &
  NodeJS.WriteStream & {
    getOutput(): string;
  };

function createMockStream(fd: number): MockWriteStream {
  let output = '';

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  }) as MockWriteStream;

  Object.defineProperties(stream, {
    fd: { value: fd, configurable: true },
    isTTY: { value: false, configurable: true },
  });

  stream.getOutput = () => output;
  return stream;
}

afterEach(() => {
  if (originalStdoutDescriptor) {
    Object.defineProperty(process, 'stdout', originalStdoutDescriptor);
  }
  if (originalStderrDescriptor) {
    Object.defineProperty(process, 'stderr', originalStderrDescriptor);
  }
  globalThis.console = originalConsole;
  jest.resetModules();
  jest.unmock('../stream');
  jest.unmock('node:tty');
});

describe('installEventLogger', () => {
  it('activates the event logger with the well-known log path', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const LogStream = jest.fn().mockImplementation(() => ({
        writable: true,
        _writeln: jest.fn(),
        _end: jest.fn(),
      }));
      jest.doMock('../stream', () => ({
        LogStream,
        writeEvent: jest.requireActual('../stream').writeEvent,
      }));

      const { installEventLogger, isEventLoggerActive } = require('..') as typeof import('..');

      expect(isEventLoggerActive()).toBe(false);

      installEventLogger(getWellKnownTemporaryLogFile(projectRoot, 'start'));

      const nodePath = require('node:path');
      const logFile = nodePath.join(projectRoot, '.expo', 'dev', 'logs', 'start.log');

      expect(LogStream).toHaveBeenCalledWith(logFile);
      expect(isEventLoggerActive()).toBe(true);
    });
  });

  it('is a no-op on subsequent calls', () => {
    jest.isolateModules(() => {
      const LogStream = jest.fn().mockImplementation(() => ({
        writable: true,
        _writeln: jest.fn(),
        _end: jest.fn(),
      }));
      jest.doMock('../stream', () => ({
        LogStream,
        writeEvent: jest.requireActual('../stream').writeEvent,
      }));

      const { installEventLogger } = require('..') as typeof import('..');

      installEventLogger('/dev/null');
      expect(LogStream).toHaveBeenCalledTimes(1);

      // Second call with project fallback should be a no-op
      installEventLogger('/foo');
      expect(LogStream).toHaveBeenCalledTimes(1);
    });
  });

  it('exposes the log file path via getLogFile', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const mockFile = '/test/project/.expo/dev/logs/start.log';
      jest.doMock('../stream', () => ({
        LogStream: jest.fn().mockImplementation(() => ({
          writable: true,
          file: mockFile,
          _writeln: jest.fn(),
          _end: jest.fn(),
        })),
        writeEvent: jest.requireActual('../stream').writeEvent,
      }));

      const { installEventLogger, getLogFile } = require('..') as typeof import('..');

      expect(getLogFile()).toBeUndefined();

      installEventLogger(getWellKnownTemporaryLogFile(projectRoot, 'start'));
      expect(getLogFile()).toBe(mockFile);
    });
  });
  it('reuses the existing stderr stream when logging events to stdout', () => {
    const stderr = createMockStream(2);
    const LogStream = jest.fn().mockImplementation(() => ({
      writable: true,
      _writeln: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({
        LogStream,
        writeEvent: jest.requireActual('../stream').writeEvent,
      }));
      jest.doMock('node:tty', () => ({
        WriteStream: jest.fn(() => {
          throw new Error('TTY initialization should not run');
        }),
      }));

      Object.defineProperty(process, 'stderr', { value: stderr, configurable: true });

      const { installEventLogger } = require('..') as typeof import('..');
      expect(() => installEventLogger('1')).not.toThrow();
    });

    expect(process.stdout).toBe(stderr);
    console.log('hello stderr');
    expect(stderr.getOutput()).toContain('hello stderr');
    expect(LogStream).toHaveBeenCalledWith(1);
  });

  it('reuses the existing stdout stream when logging events to stderr', () => {
    const stdout = createMockStream(1);
    const LogStream = jest.fn().mockImplementation(() => ({
      writable: true,
      _writeln: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({
        LogStream,
        writeEvent: jest.requireActual('../stream').writeEvent,
      }));
      jest.doMock('node:tty', () => ({
        WriteStream: jest.fn(() => {
          throw new Error('TTY initialization should not run');
        }),
      }));

      Object.defineProperty(process, 'stdout', { value: stdout, configurable: true });

      const { installEventLogger } = require('..') as typeof import('..');
      expect(() => installEventLogger('2')).not.toThrow();
    });

    expect(process.stderr).toBe(stdout);
    console.error('hello stdout');
    expect(stdout.getOutput()).toContain('hello stdout');
    expect(LogStream).toHaveBeenCalledWith(2);
  });
});
