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

  it(`should keep stdout to itself and stream stderr in capture-stdout mode`, async () => {
    // The shape of a tool with machine-readable stdout and human progress on stderr: the payload
    // has to be parsed rather than printed, the progress belongs on the terminal as it happens, and
    // it is still captured because a failing tool says why on that same stream.
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderrWrite = jest.spyOn(process.stderr, 'write').mockReturnValue(true);
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('create-launch', ['--json'], {
      output: 'capture-stdout',
    });
    child.stdout!.emit('data', '{"id":"launch-1"}\n');
    child.stderr!.emit('data', 'Searching for relevant files\n');
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({
      exitCode: 0,
      stdout: '{"id":"launch-1"}\n',
      stderr: 'Searching for relevant files\n',
    });
    expect(stdoutWrite).not.toHaveBeenCalled();
    expect(stderrWrite).toHaveBeenCalledWith('Searching for relevant files\n');
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

  // Layer 2 of the needs-human detection: a child is told that nobody can answer it, in the way
  // the tool understands (llp/0010 §Needs-human protocol).
  it(`should merge the given environment over this process' own`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('expo', ['export'], { env: { CI: '1' } });
    child.emit('close', 0, null);
    await promise;

    const options = jest.mocked(spawn).mock.calls[0]![2] as any;
    expect(options.env.CI).toBe('1');
    expect(options.env.PATH).toBe(process.env.PATH);
  });

  it(`should let the child inherit the environment when nothing is added`, async () => {
    const child = mockSpawn();

    const promise = spawnSubprocessAsync('expo', ['export']);
    child.emit('close', 0, null);
    await promise;

    expect((jest.mocked(spawn).mock.calls[0]![2] as any).env).toBeUndefined();
  });

  describe('the prompt-hang guard', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it(`kills a child that went silent on a question, and quotes the line`, async () => {
      const child = mockSpawn();

      const promise = spawnSubprocessAsync('eas', ['deploy'], { promptGuard: true });
      child.stderr!.emit('data', 'Resolving the project\n? Select a platform\n');
      jest.advanceTimersByTime(20_000);
      expect(child.kill).toHaveBeenCalled();
      child.emit('close', null, 'SIGTERM');

      await expect(promise).resolves.toMatchObject({
        exitCode: null,
        promptHang: '? Select a platform',
      });
    });

    it(`leaves a child that is silent without asking anything alone`, async () => {
      const child = mockSpawn();

      const promise = spawnSubprocessAsync('eas', ['build'], { promptGuard: true });
      child.stderr!.emit('data', 'Compiling native code\n');
      jest.advanceTimersByTime(120_000);
      expect(child.kill).not.toHaveBeenCalled();
      child.emit('close', 0, null);

      await expect(promise).resolves.toMatchObject({ exitCode: 0 });
    });

    it(`restarts the window every time the child writes something`, async () => {
      const child = mockSpawn();

      const promise = spawnSubprocessAsync('eas', ['deploy'], { promptGuard: true });
      child.stderr!.emit('data', '? Select a platform\n');
      jest.advanceTimersByTime(15_000);
      child.stderr!.emit('data', 'ios\nUploading\n');
      jest.advanceTimersByTime(15_000);

      expect(child.kill).not.toHaveBeenCalled();
      child.emit('close', 0, null);
      await promise;
    });

    it(`never runs in inherit mode, where a person can answer`, async () => {
      const child = mockSpawn({ piped: false });

      const promise = spawnSubprocessAsync('create-expo', ['my-app'], {
        output: 'inherit',
        promptGuard: true,
      });
      jest.advanceTimersByTime(120_000);
      expect(child.kill).not.toHaveBeenCalled();
      child.emit('close', 0, null);

      await expect(promise).resolves.toEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it(`is off unless the caller asks for it`, async () => {
      const child = mockSpawn();

      const promise = spawnSubprocessAsync('eas', ['deploy']);
      child.stderr!.emit('data', '? Select a platform\n');
      jest.advanceTimersByTime(120_000);
      expect(child.kill).not.toHaveBeenCalled();
      child.emit('close', 0, null);

      await promise;
    });
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
    // The listener is removed once the child is gone, or `@expo/agent-cli` would keep ignoring signals.
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
