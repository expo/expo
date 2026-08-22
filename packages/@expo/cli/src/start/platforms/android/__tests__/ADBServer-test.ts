import spawnAsync from '@expo/spawn-async';
import { execFileSync } from 'child_process';
import { vol } from 'memfs';

import * as Log from '../../../../log';
import { AbortCommandError } from '../../../../utils/errors';
import { installExitHooks } from '../../../../utils/exit';
import { ADBServer } from '../ADBServer';

jest.mock('fs', () => jest.requireActual('memfs').fs);
jest.mock('../../../../log');
jest.mock('../../../../utils/exit', () => ({
  installExitHooks: jest.fn(),
}));

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
});

describe('adb command timeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  /** A spawn that never settles, like an adb client talking to a wedged server. */
  function mockHangingSpawn() {
    const kill = jest.fn();
    const promise: any = new Promise(() => {});
    promise.child = { kill };
    jest.mocked(spawnAsync).mockReturnValueOnce(promise);
    return { kill };
  }

  it(`fails with an actionable error when adb never responds`, async () => {
    const { kill } = mockHangingSpawn();
    const server = new ADBServer();
    server.startAsync = jest.fn();
    server.getAdbExecutablePath = jest.fn(() => 'adb');

    // Capture the rejection up front so advancing the timers cannot surface it as an unhandled
    // rejection before the assertion runs.
    const error = server.runAsync(['devices', '-l']).catch((error) => error);
    await jest.advanceTimersByTimeAsync(15000);

    await expect(error).resolves.toThrow(
      'adb did not respond within 15s while running "devices -l". The adb server may be unresponsive, which can happen when a device disconnects mid-transfer. Try running "adb kill-server" and then re-running this command.'
    );
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it(`does not time out a command that responds`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      output: ['did thing'],
      stderr: 'did thing',
    } as any);
    const server = new ADBServer();
    server.startAsync = jest.fn();
    server.getAdbExecutablePath = jest.fn(() => 'adb');

    await expect(server.runAsync(['foo'])).resolves.toBe('did thing');
  });
});

describe('startAsync', () => {
  it(`starts the ADB server`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stderr: '* daemon started successfully',
    } as any);
    const server = new ADBServer();
    await expect(server.startAsync()).resolves.toBe(true);
    expect(server.isRunning).toBe(true);
    expect(installExitHooks).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
  });
  it(`does not start if the server is already running`, async () => {
    const server = new ADBServer();
    server.isRunning = true;
    await expect(server.startAsync()).resolves.toBe(false);
    expect(server.isRunning).toBe(true);
    expect(installExitHooks).toHaveBeenCalledTimes(0);
    expect(spawnAsync).toHaveBeenCalledTimes(0);
  });
});
describe('runAsync', () => {
  it(`runs an ADB command`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      output: ['did thing'],
      stderr: 'did thing',
    } as any);
    const server = new ADBServer();
    server.startAsync = jest.fn();
    server.resolveAdbPromise = jest.fn(server.resolveAdbPromise);
    server.getAdbExecutablePath = jest.fn(() => 'adb');
    await expect(server.runAsync(['foo', 'bar'])).resolves.toBe('did thing');
    expect(server.getAdbExecutablePath).toHaveBeenCalledTimes(1);
    expect(server.startAsync).toHaveBeenCalledTimes(1);
    expect(server.resolveAdbPromise).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(spawnAsync).toHaveBeenCalledWith('adb', ['foo', 'bar']);
  });
});
describe('getFileOutputAsync', () => {
  it(`returns file output from ADB`, async () => {
    jest.mocked(execFileSync).mockReturnValueOnce('foobar');
    const server = new ADBServer();
    server.startAsync = jest.fn();
    server.resolveAdbPromise = jest.fn(server.resolveAdbPromise);
    server.getAdbExecutablePath = jest.fn(() => 'adb');
    await expect(server.getFileOutputAsync(['foo', 'bar'])).resolves.toBe('foobar');
    expect(server.getAdbExecutablePath).toHaveBeenCalledTimes(1);
    expect(server.startAsync).toHaveBeenCalledTimes(1);
    expect(server.resolveAdbPromise).toHaveBeenCalledTimes(1);
    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(execFileSync).toHaveBeenCalledWith('adb', ['foo', 'bar'], {
      encoding: 'latin1',
      stdio: 'pipe',
    });
  });
});
describe('stopAsync', () => {
  it(`stops the ADB server when running`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ output: [''] } as any);
    const server = new ADBServer();
    server.isRunning = true;
    await expect(server.stopAsync()).resolves.toBe(true);
    expect(server.isRunning).toBe(false);
    expect(spawnAsync).toHaveBeenCalledTimes(1);
  });
  it(`stops the ADB server when not running`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ output: [''] } as any);
    const server = new ADBServer();
    server.isRunning = false;
    await expect(server.stopAsync()).resolves.toBe(false);
    expect(spawnAsync).toHaveBeenCalledTimes(0);
  });

  it(`considers the ADB server stopped if the process fails`, async () => {
    const server = new ADBServer();
    server.isRunning = true;
    server.runAsync = jest.fn(() => {
      throw new Error('foobar');
    });
    await expect(server.stopAsync()).resolves.toBe(false);
    expect(server.isRunning).toBe(false);
    expect(Log.error).toHaveBeenCalled();
  });
});
