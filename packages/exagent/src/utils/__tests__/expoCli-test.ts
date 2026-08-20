import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { resolveExpoCli, runExpoAsync } from '../expoCli';

const projectRoot = '/project';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

interface FakeChild extends EventEmitter {
  kill: jest.Mock;
}

function mockSpawn(): FakeChild {
  const child = Object.assign(new EventEmitter(), { kill: jest.fn() });
  jest.mocked(spawn).mockReturnValue(child as any);
  return child;
}

beforeEach(() => {
  vol.reset();
});

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(resolveExpoCli, () => {
  it(`should use the project's local expo bin when it exists`, () => {
    mockPlatform('darwin');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '#!/usr/bin/env node' });

    expect(resolveExpoCli(projectRoot, ['start', '--web'])).toEqual({
      command: '/project/node_modules/.bin/expo',
      args: ['start', '--web'],
    });
  });

  it(`should use the .cmd shim on Windows`, () => {
    mockPlatform('win32');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo.cmd`]: '' });

    expect(resolveExpoCli(projectRoot, ['start']).command).toBe(
      '/project/node_modules/.bin/expo.cmd'
    );
  });

  it(`should fall back to npx expo when the project has no local bin`, () => {
    mockPlatform('darwin');
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(resolveExpoCli(projectRoot, ['install', 'expo-sqlite'])).toEqual({
      command: 'npx',
      args: ['expo', 'install', 'expo-sqlite'],
    });
  });
});

describe(runExpoAsync, () => {
  it(`should spawn the expo CLI in the project with inherited stdio`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['install', 'expo-sqlite']);
    child.emit('close', 0, null);

    await expect(promise).resolves.toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      '/project/node_modules/.bin/expo',
      ['install', 'expo-sqlite'],
      expect.objectContaining({ cwd: projectRoot, stdio: 'inherit' })
    );
  });

  it(`should forward a non-zero exit code`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['install']);
    child.emit('close', 17, null);

    await expect(promise).resolves.toBe(17);
  });

  it(`should treat an interrupt as a clean exit`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['start']);
    child.emit('close', null, 'SIGINT');

    await expect(promise).resolves.toBe(0);
  });

  it(`should report a signal exit as a failure`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['start']);
    child.emit('close', null, 'SIGSEGV');

    await expect(promise).resolves.toBe(1);
  });

  it(`should forward terminal signals to the child instead of exiting`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['start']);
    process.emit('SIGINT');
    process.emit('SIGTERM');

    expect(child.kill).toHaveBeenCalledWith('SIGINT');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');

    child.emit('close', null, 'SIGINT');
    await promise;
  });

  it(`should stop listening for signals once the child exits`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();
    const before = process.listenerCount('SIGINT');

    const promise = runExpoAsync(projectRoot, ['start']);
    expect(process.listenerCount('SIGINT')).toBe(before + 1);

    child.emit('close', 0, null);
    await promise;

    expect(process.listenerCount('SIGINT')).toBe(before);
  });

  it(`should explain how to install the CLI when it cannot be spawned`, async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['start']);
    child.emit('error', Object.assign(new Error('spawn npx ENOENT'), { code: 'ENOENT' }));

    await expect(promise).rejects.toThrow(/npx expo/);
  });
});
