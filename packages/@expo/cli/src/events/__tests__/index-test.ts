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

describe('setProjectLogRoot', () => {
  it('creates log file and flushes early buffer', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const LogStreamWrite = jest.fn();
      const LogStream = jest.fn().mockImplementation(() => ({
        writable: true,
        _write: LogStreamWrite,
        _end: jest.fn(),
      }));
      jest.doMock('../stream', () => ({ LogStream }));

      const { events, setProjectLogRoot } = require('..') as typeof import('..');

      const event = events('test', (t: any) => [t.event<'foo', { v: number }>()]);

      // Emit events before project root is set
      (event as any)('foo', { v: 1 });
      (event as any)('foo', { v: 2 });

      // Should not have called LogStream yet
      expect(LogStream).not.toHaveBeenCalled();

      setProjectLogRoot(projectRoot, 'start');

      // LogStream created for the project log file
      const nodePath = require('node:path');
      expect(LogStream).toHaveBeenCalledWith(
        nodePath.join(projectRoot, '.expo', 'dev', 'logs', 'start.log')
      );

      // Buffered events should have been flushed
      expect(LogStreamWrite).toHaveBeenCalledTimes(2);
      expect(LogStreamWrite.mock.calls[0][0]).toContain('"_e":"test:foo"');
      expect(LogStreamWrite.mock.calls[1][0]).toContain('"v":2');
    });
  });

  it('is idempotent — second call is a no-op', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const LogStream = jest.fn().mockImplementation(() => ({
        writable: true,
        _write: jest.fn(),
        _end: jest.fn(),
      }));
      jest.doMock('../stream', () => ({ LogStream }));

      const { setProjectLogRoot } = require('..') as typeof import('..');

      setProjectLogRoot(projectRoot, 'start');
      setProjectLogRoot(projectRoot, 'export');

      // Only one LogStream created
      expect(LogStream).toHaveBeenCalledTimes(1);
    });
  });

  it('returns relative log path and exposes it via getProjectLogPath', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({
        LogStream: jest.fn().mockImplementation(() => ({
          writable: true,
          _write: jest.fn(),
          _end: jest.fn(),
        })),
      }));

      const { setProjectLogRoot, getProjectLogPath } = require('..') as typeof import('..');

      expect(getProjectLogPath()).toBeUndefined();

      const result = setProjectLogRoot(projectRoot, 'start');
      expect(result).toBe('.expo/dev/logs/start.log');
      expect(getProjectLogPath()).toBe('.expo/dev/logs/start.log');
    });
  });

  it('writes events to both streams when both are active', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const envWrite = jest.fn();
      const projectWrite = jest.fn();
      let streamIndex = 0;
      const LogStream = jest.fn().mockImplementation(() => {
        const write = streamIndex === 0 ? envWrite : projectWrite;
        streamIndex++;
        return { writable: true, _write: write, _end: jest.fn() };
      });
      jest.doMock('../stream', () => ({ LogStream }));

      const { installEventLogger, setProjectLogRoot, events } =
        require('..') as typeof import('..');

      installEventLogger('/dev/null');
      setProjectLogRoot(projectRoot, 'start');

      const event = events('dual', (t: any) => [t.event<'ping', { n: number }>()]);
      (event as any)('ping', { n: 42 });

      // Both streams received the event
      expect(envWrite).toHaveBeenCalled();
      expect(projectWrite).toHaveBeenCalled();
      const envPayload = envWrite.mock.calls.at(-1)[0];
      const projectPayload = projectWrite.mock.calls.at(-1)[0];
      expect(envPayload).toContain('"_e":"dual:ping"');
      expect(projectPayload).toContain('"_e":"dual:ping"');
    });
  });

  it('caps early buffer at 1000 entries', () => {
    jest.isolateModules(() => {
      jest.doMock('../stream', () => ({
        LogStream: jest.fn().mockImplementation(() => ({
          writable: true,
          _write: jest.fn(),
          _end: jest.fn(),
        })),
      }));

      const { events } = require('..') as typeof import('..');
      const event = events('buf', (t: any) => [t.event<'x', {}>()]);

      for (let i = 0; i < 1100; i++) {
        (event as any)('x', {});
      }

      // Verify indirectly: set project root and check only 1000 lines flushed
      const mockWrite = jest.fn();
      const { LogStream } = require('../stream');
      LogStream.mockImplementation(() => ({
        writable: true,
        _write: mockWrite,
        _end: jest.fn(),
      }));

      const { setProjectLogRoot } = require('..') as typeof import('..');
      setProjectLogRoot('/test/project', 'start');

      // 1000 buffered events flushed (capped)
      expect(mockWrite).toHaveBeenCalledTimes(1000);
    });
  });

  it('truncates log file on each run', () => {
    const projectRoot = '/test/project';

    jest.isolateModules(() => {
      const mockMkdirSync = jest.fn();
      const mockWriteFileSync = jest.fn();
      jest.doMock('node:fs', () => ({
        mkdirSync: mockMkdirSync,
        writeFileSync: mockWriteFileSync,
      }));
      jest.doMock('../stream', () => ({
        LogStream: jest.fn().mockImplementation(() => ({
          writable: true,
          _write: jest.fn(),
          _end: jest.fn(),
        })),
      }));

      const { setProjectLogRoot } = require('..') as typeof import('..');
      setProjectLogRoot(projectRoot, 'start');

      const nodePath = require('node:path');
      const logFile = nodePath.join(projectRoot, '.expo', 'dev', 'logs', 'start.log');

      // fs.mkdirSync should have been called for the log directory
      expect(mockMkdirSync).toHaveBeenCalledWith(nodePath.dirname(logFile), { recursive: true });
      // fs.writeFileSync should have been called with empty string to truncate
      expect(mockWriteFileSync).toHaveBeenCalledWith(logFile, '');
    });
  });
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
