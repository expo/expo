import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import {
  buildGenerateArgs,
  diffItemSource,
  generateFingerprintAsync,
  parseDiffItems,
  parseFingerprint,
  resolveFingerprintCli,
} from '../fingerprint';

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

    expect(resolveFingerprintCli(projectRoot)).toBe(projectBin('fingerprint'));
  });

  it(`should resolve the .cmd shim on Windows`, () => {
    mockPlatform('win32');
    writeFingerprintBin('fingerprint.cmd');

    expect(resolveFingerprintCli(projectRoot)).toBe(projectBin('fingerprint.cmd'));
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

    await expect(promise).resolves.toEqual({ hash: 'abc123', sources: [] });
    expect(spawn).toHaveBeenCalledWith(
      projectBin('fingerprint'),
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

    await expect(promise).resolves.toEqual({ hash: 'def456', sources: null });
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
      sources: null,
      error: expect.stringContaining('ENOENT'),
    });
  });
});

describe(buildGenerateArgs, () => {
  it(`should generate for the project with no options`, () => {
    // Not only a default: **no option is sent unless the caller named it**, because the option may
    // not exist in the CLI the project resolves. `--preset` is in this monorepo's
    // `@expo/fingerprint` and not in the 0.20.9 a real SDK 57 project installs, which answers
    // `unknown or unexpected option: --preset` and exits non-zero [observed — live, 2026-08-24],
    // so a bare argv is what makes this command work against the projects that exist.
    // @ref llp/0002-testing-and-evals.plan.md §A flag is not shipped until it has run against the
    // published binary
    expect(buildGenerateArgs(projectRoot)).toEqual(['fingerprint:generate', projectRoot]);
  });

  it(`should pass the platform through`, () => {
    // A fingerprint of both platforms answers a freshness question and the wrong per-platform
    // one: a change under `ios/` would move the android answer too.
    expect(buildGenerateArgs(projectRoot, { platform: 'ios' })).toEqual([
      'fingerprint:generate',
      projectRoot,
      '--platform',
      'ios',
    ]);
  });

  it(`should pass the preset through`, () => {
    expect(buildGenerateArgs(projectRoot, { preset: 'strict' })).toEqual([
      'fingerprint:generate',
      projectRoot,
      '--preset',
      'strict',
    ]);
  });

  it(`should pass both`, () => {
    expect(buildGenerateArgs(projectRoot, { platform: 'android', preset: 'relaxed' })).toEqual([
      'fingerprint:generate',
      projectRoot,
      '--platform',
      'android',
      '--preset',
      'relaxed',
    ]);
  });
});

describe(parseFingerprint, () => {
  it(`should read the hash and the sources`, () => {
    expect(parseFingerprint(JSON.stringify({ sources: [{ type: 'file' }], hash: 'abc' }))).toEqual({
      hash: 'abc',
      sources: [{ type: 'file' }],
    });
  });

  it(`should read a hash with no sources as sources null`, () => {
    // Still a usable freshness answer, so the sources degrade rather than failing the parse.
    expect(parseFingerprint(JSON.stringify({ hash: 'abc' }))).toEqual({
      hash: 'abc',
      sources: null,
    });
  });

  it(`should read the last JSON line, past a warning`, () => {
    const output = `warning: something\n${JSON.stringify({ hash: 'def', sources: [] })}\n`;

    expect(parseFingerprint(output)).toEqual({ hash: 'def', sources: [] });
  });

  it(`should answer null when there is no hash anywhere`, () => {
    expect(parseFingerprint('not json at all')).toBeNull();
    expect(parseFingerprint(JSON.stringify({ sources: [] }))).toBeNull();
  });
});

describe(parseDiffItems, () => {
  it(`should read the pretty-printed array the CLI prints`, () => {
    // `fingerprint:diff` pretty-prints, so the array spans many lines and the reverse-line scan
    // that reads a generate does not apply here.
    const output = JSON.stringify([{ op: 'added', addedSource: { type: 'file' } }], null, 2);

    expect(parseDiffItems(output)).toEqual([{ op: 'added', addedSource: { type: 'file' } }]);
  });

  it(`should read an empty diff`, () => {
    expect(parseDiffItems('[]')).toEqual([]);
  });

  it(`should skip anything printed before the array`, () => {
    expect(parseDiffItems('debug line\n[]')).toEqual([]);
  });

  it(`should answer null for output with no array in it`, () => {
    expect(parseDiffItems('nothing here')).toBeNull();
    expect(parseDiffItems('{"hash":"abc"}')).toBeNull();
  });

  it(`should answer null for an unparsable array`, () => {
    expect(parseDiffItems('[{')).toBeNull();
  });
});

describe(diffItemSource, () => {
  it(`should read the added source`, () => {
    expect(diffItemSource({ op: 'added', addedSource: { id: 'a' } })).toEqual({ id: 'a' });
  });

  it(`should read the removed source`, () => {
    expect(diffItemSource({ op: 'removed', removedSource: { id: 'r' } })).toEqual({ id: 'r' });
  });

  it(`should read the *after* side of a change`, () => {
    // The reasons of a source that is still there are what it is there for now.
    expect(
      diffItemSource({ op: 'changed', beforeSource: { id: 'b' }, afterSource: { id: 'a' } })
    ).toEqual({ id: 'a' });
  });
});
