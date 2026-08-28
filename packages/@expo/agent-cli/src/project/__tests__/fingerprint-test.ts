import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import {
  buildGenerateArgs,
  clearFingerprintMemo,
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
  // One fingerprint per key per *process*, and a test file is one process: without this, the second
  // test to ask for the same key would be answered by the first test's memo and spawn nothing.
  clearFingerprintMemo();
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

  // F113: npm hoists a workspace's dependencies to the workspace root, so the app's own
  // `node_modules` does not exist and the literal path found nothing — while `npm install` in that
  // repository had succeeded and put `fingerprint` one directory up. An ancestor's `node_modules`
  // *is* this project's dependency tree, so the "no npx fallback" rule holds: what the walk finds
  // is still the version this project resolves, and a hash from it is comparable.
  it(`should resolve a CLI an npm workspace hoisted above the project`, () => {
    const workspace = path.resolve('/workspace');
    const app = path.join(workspace, 'apps', 'mobile');
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'fingerprint');
    vol.fromJSON({
      [path.join(workspace, 'package.json')]: '{"workspaces":["apps/*"]}',
      [path.join(app, 'package.json')]: '{"name":"mobile"}',
      [hoisted]: '#!/bin/sh',
    });

    expect(resolveFingerprintCli(app)).toBe(hoisted);
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

    // @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
    // `source` rides along on every answer, so no consumer has to guess whether a hash was measured
    // now or read off a record.
    await expect(promise).resolves.toEqual({ hash: 'abc123', sources: [], source: 'computed' });
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

    await expect(promise).resolves.toEqual({ hash: 'def456', sources: null, source: 'computed' });
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
      source: 'computed',
      error: expect.stringContaining('ENOENT'),
    });
  });
});

// @ref llp/0023-fingerprint-caching.rfc.md §Layer 1 — one fingerprint per key per process
describe('the in-process memo', () => {
  it(`should spawn once for two sequential calls with the same key`, async () => {
    writeFingerprintBin();
    const first = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    first.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    first.emit('close', 0, null);
    await promise;

    await expect(generateFingerprintAsync(projectRoot)).resolves.toMatchObject({
      hash: 'abc123',
      source: 'computed',
      memoized: true,
    });
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it(`should share one spawn between concurrent callers`, async () => {
    // F93's lesson at the fingerprint boundary: the probe, the freshness section and the build
    // lookup all start at once, so two callers racing for the same key must join one promise
    // rather than start two subprocesses.
    writeFingerprintBin();
    const child = mockSpawn();

    const first = generateFingerprintAsync(projectRoot);
    const second = generateFingerprintAsync(projectRoot);
    child.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    child.emit('close', 0, null);

    await expect(first).resolves.toMatchObject({ hash: 'abc123' });
    await expect(second).resolves.toMatchObject({ hash: 'abc123' });
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it(`should keep the platforms apart`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const ios = generateFingerprintAsync(projectRoot, { platform: 'ios' });
    const android = generateFingerprintAsync(projectRoot, {
      platform: 'android',
    });
    child.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    child.emit('close', 0, null);
    await Promise.all([ios, android]);

    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should keep the presets apart`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const balanced = generateFingerprintAsync(projectRoot, {
      preset: 'balanced',
    });
    const strict = generateFingerprintAsync(projectRoot, { preset: 'strict' });
    child.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    child.emit('close', 0, null);
    await Promise.all([balanced, strict]);

    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should never answer a caller that asked for no cache out of the memo of one that did`, async () => {
    writeFingerprintBin();
    const child = mockSpawn();

    const cached = generateFingerprintAsync(projectRoot);
    const fresh = generateFingerprintAsync(projectRoot, { cache: false });
    child.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    child.emit('close', 0, null);
    await Promise.all([cached, fresh]);

    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should spawn again after the memo is cleared`, async () => {
    writeFingerprintBin();
    const first = mockSpawn();

    const promise = generateFingerprintAsync(projectRoot);
    first.stdout.emit('data', JSON.stringify({ hash: 'abc123', sources: [] }));
    first.emit('close', 0, null);
    await promise;

    // What a command that mutates the project calls: a prebuild, an install or a build makes every
    // answer above it a statement about a project that no longer exists.
    clearFingerprintMemo(projectRoot);
    const second = mockSpawn();
    const again = generateFingerprintAsync(projectRoot);
    second.stdout.emit('data', JSON.stringify({ hash: 'def456', sources: [] }));
    second.emit('close', 0, null);

    await expect(again).resolves.toMatchObject({ hash: 'def456' });
    expect(spawn).toHaveBeenCalledTimes(2);
  });
});

// @ref llp/0023-fingerprint-caching.rfc.md §Layer 2 — the cross-run cache
describe('the cross-run cache', () => {
  /** A project complete enough to be cached: sentinels to pin, and a CLI version to key on. */
  function writeCacheableProject() {
    writeFingerprintBin();
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/package-lock.json`]: '{"lockfileVersion":3}',
      [`${projectRoot}/app.json`]: '{"expo":{"name":"app"}}',
      [`${projectRoot}/node_modules/@expo/fingerprint/package.json`]: '{"version":"0.20.10"}',
    });
  }

  /**
   * Answer every spawn with `hash`, whenever it happens.
   *
   * The generate now reads the pinned files before it spawns, so a test that emitted on the child
   * up front would be feeding a subprocess that does not exist yet. This answers on the spawn
   * itself, which is also what a real subprocess does.
   */
  function answerSpawnsWith(hash: string, { exitCode = 0 } = {}) {
    jest.mocked(spawn).mockImplementation((() => {
      const child = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      setImmediate(() => {
        if (exitCode === 0) {
          child.stdout.emit('data', JSON.stringify({ hash, sources: [{ type: 'file' }] }));
        } else {
          child.stderr.emit('data', 'boom\n');
        }
        child.emit('close', exitCode, null);
      });
      return child;
    }) as any);
  }

  /** Run one generate against a stubbed subprocess that prints `hash`. */
  function generateAsync(
    hash: string,
    options: Parameters<typeof generateFingerprintAsync>[1] = {}
  ) {
    answerSpawnsWith(hash);
    return generateFingerprintAsync(projectRoot, options);
  }

  it(`should serve the next process out of the record it wrote`, async () => {
    writeCacheableProject();
    await expect(generateAsync('abc123')).resolves.toMatchObject({
      source: 'computed',
    });
    expect(spawn).toHaveBeenCalledTimes(1);

    clearFingerprintMemo();
    const cached = await generateFingerprintAsync(projectRoot);

    expect(cached).toMatchObject({
      hash: 'abc123',
      source: 'cache',
      revalidatedAgainst: expect.any(Number),
    });
    expect(cached.revalidatedAgainst).toBeGreaterThan(0);
    expect(cached.sources).toEqual([{ type: 'file' }]);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it(`should recompute after a lockfile changes`, async () => {
    writeCacheableProject();
    await generateAsync('abc123');
    clearFingerprintMemo();

    // A different length, so the stamp moves on the size alone: the key is size and modification
    // time, and an in-memory filesystem can write twice inside one millisecond.
    vol.writeFileSync(`${projectRoot}/package-lock.json`, '{"lockfileVersion":4,"packages":{}}');
    await expect(generateAsync('def456')).resolves.toMatchObject({
      hash: 'def456',
      source: 'computed',
    });
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should not be read when the caller asked for no cache`, async () => {
    writeCacheableProject();
    await generateAsync('abc123');
    clearFingerprintMemo();

    await expect(generateAsync('def456', { cache: false })).resolves.toMatchObject({
      hash: 'def456',
      source: 'computed',
    });
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should not be written by a run that failed`, async () => {
    writeCacheableProject();
    answerSpawnsWith('never printed', { exitCode: 1 });
    await expect(generateFingerprintAsync(projectRoot)).resolves.toMatchObject({
      hash: null,
    });

    clearFingerprintMemo();
    await expect(generateAsync('abc123')).resolves.toMatchObject({
      source: 'computed',
    });
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should be skipped whole for a project with no fingerprint CLI version to key on`, async () => {
    writeFingerprintBin();
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });

    await generateAsync('abc123');
    clearFingerprintMemo();

    await expect(generateAsync('def456')).resolves.toMatchObject({
      hash: 'def456',
    });
    expect(spawn).toHaveBeenCalledTimes(2);
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
