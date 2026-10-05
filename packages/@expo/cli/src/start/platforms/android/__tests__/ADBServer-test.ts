import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'node:path';

import * as Log from '../../../../log';
import { AbortCommandError } from '../../../../utils/errors';
import { ADBServer } from '../ADBServer';
import { AdbProcessWaitError } from '../adbProcess';

jest.mock('fs', () => jest.requireActual('memfs').fs);
jest.mock('../../../../log');
jest.unmock('child_process');

const env = process.env;

beforeEach(() => {
  delete process.env.ANDROID_HOME;
});

afterEach(() => vol.reset());

afterAll(() => {
  process.env = env;
});

describe('getAdbExecutablePath', () => {
  it(`returns the default adb path`, () => {
    const adbPath = new ADBServer().getAdbExecutablePath();
    expect(adbPath).toEqual('adb');
  });
  it(`returns the user defined adb path`, () => {
    vol.fromJSON({ '/Users/user/android/file': '' });
    process.env.ANDROID_HOME = '/Users/user/android';
    const adbPath = new ADBServer().getAdbExecutablePath();
    expect(adbPath).toEqual('/Users/user/android/platform-tools/adb');
  });
  it('warns if Android SDK is not found', () => {
    process.env.ANDROID_HOME = '/Users/user/android';
    new ADBServer().getAdbExecutablePath();
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve the Android SDK path')
    );
  });
});

describe('resolveAdbPromise', () => {
  it(`passes`, async () => {
    const server = new ADBServer();
    await expect(server.resolveAdbPromise(Promise.resolve('foobar'))).resolves.toBe('foobar');
  });
  it(`asserts abort error`, async () => {
    const server = new ADBServer();
    const rejects = (async () => {
      // eslint-disable-next-line no-throw-literal
      throw { signal: 'SIGINT' };
    })();
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrow(AbortCommandError);
  });
  it(`formats error message`, async () => {
    const server = new ADBServer();
    const rejects = (async () => {
      throw new Error('error: foobar');
    })();
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrow(/^foobar$/);
  });
  it(`formats bad user number error`, async () => {
    const server = new ADBServer();
    const rejects = (async () => {
      // eslint-disable-next-line no-throw-literal
      throw {
        status: 255,
        stdout: 'Error: java.lang.IllegalArgumentException: Bad user number: FUNKY\n',
      };
    })();
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrow(
      /^Invalid ADB user number "FUNKY" set with environment variable EXPO_ADB_USER. Run "adb shell pm list users" to see valid user numbers.$/
    );
  });
  it('preserves structured wait errors even when the terminated client produced output', async () => {
    const server = new ADBServer();
    const error = Object.assign(
      new AdbProcessWaitError(
        'Expo stopped waiting for discovery.',
        'device discovery',
        'host-request'
      ),
      {
        stdout: 'partial output',
        stderr: 'diagnostic output',
        signal: 'SIGTERM',
      }
    );

    await expect(server.resolveAdbPromise(Promise.reject(error))).rejects.toBe(error);
  });
});

describe('runDeviceQueryAsync', () => {
  it(`runs an ADB command`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: 'did thing',
      stderr: '',
      status: 0,
      signal: null,
    } as any);
    const server = new ADBServer();
    server.resolveAdbPromise = jest.fn(server.resolveAdbPromise);
    server.getAdbExecutablePath = jest.fn(() => 'adb');
    await expect(server.runDeviceQueryAsync(['foo', 'bar'], 'test query')).resolves.toBe(
      'did thing'
    );
    expect(server.getAdbExecutablePath).toHaveBeenCalledTimes(1);
    expect(server.resolveAdbPromise).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledWith('adb', ['foo', 'bar']);
  });

  it('keeps diagnostic stderr out of parsed query output', async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: 'machine-readable output',
      stderr: 'diagnostic output',
      status: 0,
      signal: null,
    } as any);
    const server = new ADBServer();
    server.getAdbExecutablePath = jest.fn(() => 'adb');

    await expect(server.runDeviceQueryAsync(['devices', '-l'], 'device query')).resolves.toBe(
      'machine-readable output'
    );
  });

  it('rejects a nonexistent ADB user reported with a successful exit', async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: '',
      stderr: 'Error: user 99 does not exist',
      status: 0,
      signal: null,
    } as any);
    const server = new ADBServer();
    server.getAdbExecutablePath = jest.fn(() => 'adb');

    await expect(
      server.runDeviceQueryAsync(['shell', 'pm', 'list', 'packages'], 'query')
    ).rejects.toMatchObject({
      code: 'EXPO_ADB_USER',
    });
  });
});
describe('getFileOutputAsync', () => {
  it(`returns UTF-8 file output from ADB`, async () => {
    const output = '日本語 🚀';
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: output,
      stderr: '',
      status: 0,
      signal: null,
    } as any);
    const server = new ADBServer();
    server.resolveAdbPromise = jest.fn(server.resolveAdbPromise);
    server.getAdbExecutablePath = jest.fn(() => 'adb');
    await expect(server.getFileOutputAsync(['foo', 'bar'])).resolves.toBe(output);
    expect(server.getAdbExecutablePath).toHaveBeenCalledTimes(1);
    expect(server.resolveAdbPromise).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledWith('adb', ['foo', 'bar']);
  });

  it('maps ADB errors from property queries', async () => {
    jest.mocked(spawnAsync).mockRejectedValueOnce({
      status: 255,
      stdout: 'Error: java.lang.IllegalArgumentException: Bad user number: FUNKY\n',
      stderr: '',
    });
    const server = new ADBServer();
    server.getAdbExecutablePath = jest.fn(() => 'adb');

    await expect(server.getFileOutputAsync(['shell', 'getprop'])).rejects.toThrow(
      'Invalid ADB user number "FUNKY"'
    );
  });

  it('maps bad ADB users reported on stderr', async () => {
    const server = new ADBServer();
    await expect(
      server.resolveAdbPromise(
        Promise.reject({
          status: 255,
          stderr: 'java.lang.IllegalArgumentException: Bad user number: FUNKY',
        })
      )
    ).rejects.toMatchObject({ code: 'EXPO_ADB_USER' });
  });

  it('formats status failures without stdout', async () => {
    const server = new ADBServer();
    const error = { status: 255, stderr: 'device rejected command' };

    await expect(server.resolveAdbPromise(Promise.reject(error))).rejects.toMatchObject({
      message: 'device rejected command',
    });
  });

  it('does not block scheduled JavaScript while a property query is pending', async () => {
    let resolveSpawn!: (result: any) => void;
    jest.mocked(spawnAsync).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSpawn = resolve;
      }) as any
    );
    const server = new ADBServer();
    server.getAdbExecutablePath = jest.fn(() => 'adb');
    const scheduledTask = jest.fn();
    const query = server.getFileOutputAsync(['shell', 'getprop']);

    await new Promise<void>((resolve) =>
      setTimeout(() => {
        scheduledTask();
        resolve();
      }, 0)
    );
    expect(scheduledTask).toHaveBeenCalledTimes(1);

    resolveSpawn({ stdout: 'value', stderr: '', status: 0, signal: null });
    await expect(query).resolves.toBe('value');
  });
});

describe('bounded commands', () => {
  jest.setTimeout(10_000);

  class FixtureADBServer extends ADBServer {
    override getAdbExecutablePath(): string {
      return process.execPath;
    }

    override runDeviceQueryAsync(args: string[], operation: string, signal?: AbortSignal) {
      const fixture = path.join(__dirname, 'fixtures', 'adb-long-command.js');
      return super.runDeviceQueryAsync([fixture, ...args], operation, signal);
    }
  }

  beforeEach(() => {
    jest.mocked(spawnAsync).mockImplementation(jest.requireActual('@expo/spawn-async'));
  });

  it('allows a finite command to finish within the default deadline', async () => {
    await expect(new FixtureADBServer().runDeviceQueryAsync(['finite'], 'finite')).resolves.toBe(
      'completed'
    );
  });

  it('keeps a stream active until its caller cancels', async () => {
    const controller = new AbortController();
    const stream = new FixtureADBServer().runDeviceQueryAsync(
      ['stream'],
      'stream',
      controller.signal
    );
    const reason = new Error('stop stream');
    const cancellation = setTimeout(() => controller.abort(reason), 100);

    try {
      await expect(stream).rejects.toBe(reason);
    } finally {
      clearTimeout(cancellation);
    }
  });
});
