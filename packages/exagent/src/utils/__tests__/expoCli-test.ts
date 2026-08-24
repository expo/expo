import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import { resolveExpoCli, runExpoAsync, spawnExpoAsync } from '../expoCli';

const projectRoot = '/project';
const realPlatform = process.platform;

/**
 * The path of a bin the project installed, spelled the way the running platform spells it.
 *
 * The resolver builds it with `path.join`, so an expectation written as a posix literal would only
 * hold on posix. Building it the same way keeps the assertion about *which* bin was chosen.
 */
const projectBin = (name: string) => path.join(projectRoot, 'node_modules', '.bin', name);

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

interface FakeChild extends EventEmitter {
  stdout: EventEmitter | null;
  stderr: EventEmitter | null;
  kill: jest.Mock;
}

function mockSpawn({ piped = false }: { piped?: boolean } = {}): FakeChild {
  const child = Object.assign(new EventEmitter(), {
    stdout: piped ? new EventEmitter() : null,
    stderr: piped ? new EventEmitter() : null,
    kill: jest.fn(),
  });
  jest.mocked(spawn).mockReturnValue(child as any);
  return child;
}

beforeEach(() => {
  // A fixed platform for every test but the Windows one: the resolver picks the bin *name* from
  // it, so the tests would otherwise install a bin the resolver on Windows never looks for.
  mockPlatform('darwin');
  vol.reset();
});

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(resolveExpoCli, () => {
  it(`should use the project's local expo bin when it exists`, () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '#!/usr/bin/env node' });

    expect(resolveExpoCli(projectRoot, ['start', '--web'])).toEqual({
      command: projectBin('expo'),
      args: ['start', '--web'],
    });
  });

  it(`should use the .cmd shim on Windows`, () => {
    mockPlatform('win32');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo.cmd`]: '' });

    expect(resolveExpoCli(projectRoot, ['start']).command).toBe(projectBin('expo.cmd'));
  });

  it(`should fall back to npx expo when the project has no local bin`, () => {
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
      projectBin('expo'),
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

// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — layer 2, in the one place where
// nobody is watching the terminal.
describe(spawnExpoAsync, () => {
  it(`should tell the captured CLI that nothing can answer it`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn({ piped: true });

    const promise = spawnExpoAsync(projectRoot, ['export', '--platform', 'web']);
    child.stdout!.emit('data', 'Exported\n');
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({
      cli: { command: projectBin('expo'), args: ['export', '--platform', 'web'] },
      result: { exitCode: 0, stdout: 'Exported\n', stderr: '' },
    });
    const options = jest.mocked(spawn).mock.calls[0]![2] as any;
    expect(options.env.CI).toBe('1');
    expect(options.stdio).toEqual(['ignore', 'pipe', 'pipe']);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — layer 2, and the dev server's
  // exception to it. `CI` also turns Metro's file watcher off, which freezes the dev server on the
  // code it read at start-up; the pipe below is what keeps the prompts failing fast without it.
  it(`should leave CI unset for a caller that needs the file watcher`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn({ piped: true });

    const promise = spawnExpoAsync(projectRoot, ['start', '--go'], { output: 'tee', ci: false });
    child.emit('close', 0, null);
    await promise;

    const options = jest.mocked(spawn).mock.calls[0]![2] as any;
    // No `env` override at all, so a machine whose own environment says CI keeps saying it.
    expect(options.env).toBeUndefined();
    // The half that still makes the CLI non-interactive: its stdout is a pipe, never a TTY.
    expect(options.stdio).toEqual(['ignore', 'pipe', 'pipe']);
  });

  it(`should leave the inherited run interactive, where a person has the terminal`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/expo`]: '' });
    const child = mockSpawn();

    const promise = runExpoAsync(projectRoot, ['prebuild']);
    child.emit('close', 0, null);
    await promise;

    // `env` is not passed at all, so the child inherits this process' own — CI included only if
    // the caller already had it.
    expect((jest.mocked(spawn).mock.calls[0]![2] as any).env).toBeUndefined();
  });
});
