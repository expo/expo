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
    expect(Log.warn).toBeCalledWith(
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
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrowError(AbortCommandError);
  });
  it(`formats error message`, async () => {
    const server = new ADBServer();
    const rejects = (async () => {
      throw new Error('error: foobar');
    })();
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrowError(/^foobar$/);
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
    await expect(server.resolveAdbPromise(rejects)).rejects.toThrowError(
      /^Invalid ADB user number "FUNKY" set with environment variable EXPO_ADB_USER. Run "adb shell pm list users" to see valid user numbers.$/
    );
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
    expect(installExitHooks).toBeCalledTimes(1);
    expect(spawnAsync).toBeCalledTimes(1);
  });
  it(`does not start if the server is already running`, async () => {
    const server = new ADBServer();
    server.isRunning = true;
    await expect(server.startAsync()).resolves.toBe(false);
    expect(server.isRunning).toBe(true);
    expect(installExitHooks).toBeCalledTimes(0);
    expect(spawnAsync).toBeCalledTimes(0);
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
    expect(server.getAdbExecutablePath).toBeCalledTimes(1);
    expect(server.startAsync).toBeCalledTimes(1);
    expect(server.resolveAdbPromise).toBeCalledTimes(1);
    expect(spawnAsync).toBeCalledTimes(1);
    expect(spawnAsync).toBeCalledWith('adb', ['foo', 'bar']);
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
    expect(server.getAdbExecutablePath).toBeCalledTimes(1);
    expect(server.startAsync).toBeCalledTimes(1);
    expect(server.resolveAdbPromise).toBeCalledTimes(1);
    expect(execFileSync).toBeCalledTimes(1);
    expect(execFileSync).toBeCalledWith('adb', ['foo', 'bar'], {
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
    expect(spawnAsync).toBeCalledTimes(1);
  });
  it(`stops the ADB server when not running`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ output: [''] } as any);
    const server = new ADBServer();
    server.isRunning = false;
    await expect(server.stopAsync()).resolves.toBe(false);
    expect(spawnAsync).toBeCalledTimes(0);
  });

  it(`considers the ADB server stopped if the process fails`, async () => {
    const server = new ADBServer();
    server.isRunning = true;
    server.runAsync = jest.fn(() => {
      throw new Error('foobar');
    });
    await expect(server.stopAsync()).resolves.toBe(false);
    expect(server.isRunning).toBe(false);
    expect(Log.error).toBeCalled();
  });
});
