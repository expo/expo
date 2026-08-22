import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import { findExecutableOnPath, spawnSubprocessAsync } from '../subprocess';

/** Build a `PATH` value the way the running platform writes it. */
const pathOf = (...dirs: string[]) => dirs.join(path.delimiter);

interface FakeChild extends EventEmitter {
  stdout: EventEmitter | null;
  stderr: EventEmitter | null;
  kill: jest.Mock;
}

function mockSpawn({ piped = true }: { piped?: boolean } = {}): FakeChild {
  const child = Object.assign(new EventEmitter(), {
    stdout: piped ? new EventEmitter() : null,
    stderr: piped ? new EventEmitter() : null,
    kill: jest.fn(),
  });
  jest.mocked(spawn).mockReturnValue(child as any);
  return child;
}

afterEach(() => {
  vol.reset();
});

describe(spawnSubprocessAsync, () => {
  it(`should capture the output and never attach stdin`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('eas', ['deploy'], { output: 'capture' });
    child.stdout!.emit('data', 'Deployment URL: https://app--123.expo.app\n');
    child.stderr!.emit('data', 'warning\n');
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({
      exitCode: 0,
      stdout: 'Deployment URL: https://app--123.expo.app\n',
      stderr: 'warning\n',
    });
    expect(spawn).toHaveBeenCalledWith(
      'eas',
      ['deploy'],
      expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] })
    );
  });

  it(`should stream and capture at the same time in tee mode`, async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderrWrite = jest.spyOn(process.stderr, 'write').mockReturnValue(true);
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('eas', ['deploy'], { output: 'tee' });
    child.stdout!.emit('data', 'exporting\n');
    child.stderr!.emit('data', 'slow\n');
    child.emit('close', 0, null);

    await expect(promise).resolves.toMatchObject({ stdout: 'exporting\n', stderr: 'slow\n' });
    expect(stdoutWrite).toHaveBeenCalledWith('exporting\n');
    expect(stderrWrite).toHaveBeenCalledWith('slow\n');
    stdoutWrite.mockRestore();
    stderrWrite.mockRestore();
  });

  it(`should hand the terminal to the child in inherit mode`, async () => {
    const child = mockSpawn({ piped: false });

    const promise = spawnSubprocessAsync('create-expo', ['my-app'], { output: 'inherit' });
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: '', stderr: '' });
    expect(spawn).toHaveBeenCalledWith(
      'create-expo',
      ['my-app'],
      expect.objectContaining({ stdio: ['ignore', 'inherit', 'inherit'] })
    );
  });

  it(`should forward the exit code of a failed run`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('eas', ['build'], { output: 'capture' });
    child.stderr!.emit('data', 'Build failed\n');
    child.emit('close', 7, null);

    await expect(promise).resolves.toMatchObject({ exitCode: 7 });
  });

  it(`should report a missing binary instead of rejecting`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('eas', ['deploy'], { output: 'capture' });
    const error: NodeJS.ErrnoException = new Error('spawn eas ENOENT');
    error.code = 'ENOENT';
    child.emit('error', error);

    await expect(promise).resolves.toMatchObject({ exitCode: null, spawnError: error });
  });

  it(`should treat an interrupt as a clean stop, like the expo wrapper does`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('eas', ['build'], { output: 'capture' });
    child.emit('close', null, 'SIGINT');

    await expect(promise).resolves.toMatchObject({ exitCode: 0 });
  });

  it(`should forward terminal signals to the child while it runs`, async () => {
    const child = mockSpawn();
    const listenersBefore = process.listenerCount('SIGTERM');

    const promise = spawnSubprocessAsync('eas', ['build'], { output: 'capture' });
    expect(process.listenerCount('SIGTERM')).toBe(listenersBefore + 1);
    process.emit('SIGTERM');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');

    child.emit('close', 0, null);
    await promise;
    // The listener is removed once the child is gone, or `exagent` would keep ignoring signals.
    expect(process.listenerCount('SIGTERM')).toBe(listenersBefore);
  });
});

describe(findExecutableOnPath, () => {
  it(`should return the first directory of PATH that holds the executable`, () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh', '/opt/bin/eas': '#!/bin/sh' });

    expect(findExecutableOnPath('eas', { pathEnv: pathOf('/opt/bin', '/usr/local/bin') })).toBe(
      path.join('/opt/bin', 'eas')
    );
  });

  it(`should skip entries of PATH that do not hold the executable`, () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh' });

    expect(findExecutableOnPath('eas', { pathEnv: pathOf('/nope', '', '/usr/local/bin') })).toBe(
      path.join('/usr/local/bin', 'eas')
    );
  });

  it(`should return null when nothing on PATH provides the executable`, () => {
    vol.fromJSON({ '/usr/local/bin/expo': '#!/bin/sh' });

    expect(findExecutableOnPath('eas', { pathEnv: pathOf('/usr/local/bin') })).toBeNull();
  });

  it(`should return null for an empty PATH`, () => {
    expect(findExecutableOnPath('eas', { pathEnv: '' })).toBeNull();
  });
});
