import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { generateFingerprintAsync, resolveFingerprintCli } from '../fingerprint';

const projectRoot = '/project';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

interface FakeChild extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

function mockSpawn(): FakeChild {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  jest.mocked(spawn).mockReturnValue(child as any);
  return child;
}

/** Install the fingerprint bin the project would get from `@expo/fingerprint`. */
function writeFingerprintBin(name = 'fingerprint') {
  vol.fromJSON({ [`${projectRoot}/node_modules/.bin/${name}`]: '' });
}

beforeEach(() => {
  mockPlatform('darwin');
  vol.reset();
});

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(resolveFingerprintCli, () => {
  it(`should resolve the project's fingerprint bin`, () => {
    writeFingerprintBin();

    expect(resolveFingerprintCli(projectRoot)).toBe('/project/node_modules/.bin/fingerprint');
  });

  it(`should resolve the .cmd shim on Windows`, () => {
    mockPlatform('win32');
    writeFingerprintBin('fingerprint.cmd');

    expect(resolveFingerprintCli(projectRoot)).toBe('/project/node_modules/.bin/fingerprint.cmd');
  });

  it(`should return null when the project does not ship the CLI`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(resolveFingerprintCli(projectRoot)).toBeNull();
  });
});

describe(generateFingerprintAsync, () => {
  it(`should spawn the fingerprint CLI and parse the hash`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    child.stdout.emit('data', JSON.stringify({ sources: [], hash: 'abc123' }));
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({ hash: 'abc123' });
    expect(spawn).toHaveBeenCalledWith(
      '/project/node_modules/.bin/fingerprint',
      ['fingerprint:generate', projectRoot],
      expect.objectContaining({ cwd: projectRoot })
    );
  });

  it(`should parse the hash from the last JSON line of the output`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    child.stdout.emit('data', 'warning: something\n');
    child.stdout.emit('data', `${JSON.stringify({ hash: 'def456' })}\n`);
    child.emit('close', 0, null);

    await expect(promise).resolves.toEqual({ hash: 'def456' });
  });

  it(`should report a missing CLI without spawning anything`, async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    const result = await generateFingerprintAsync(projectRoot);

    expect(result.hash).toBeNull();
    expect(result.error).toMatch(/@expo\/fingerprint/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it(`should report a non-zero exit code with the stderr output`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    child.stderr.emit('data', 'Invalid project root\n');
    child.emit('close', 1, null);

    const result = await promise;

    expect(result.hash).toBeNull();
    expect(result.error).toContain('Invalid project root');
  });

  it(`should report unparsable output`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    child.stdout.emit('data', 'not json at all');
    child.emit('close', 0, null);

    const result = await promise;

    expect(result.hash).toBeNull();
    expect(result.error).toMatch(/output/i);
  });

  it(`should report a spawn failure instead of throwing`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    child.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }));

    await expect(promise).resolves.toEqual({
      hash: null,
      error: expect.stringContaining('ENOENT'),
    });
  });
});
