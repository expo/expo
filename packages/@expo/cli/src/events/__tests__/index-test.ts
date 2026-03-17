import { Writable } from 'node:stream';

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
  it('reuses the existing stderr stream when logging events to stdout', () => {
    const stderr = createMockStream(2);
    const LogStream = jest.fn().mockImplementation(() => ({
      writable: true,
      _write: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({ LogStream }));
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
      _write: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({ LogStream }));
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
