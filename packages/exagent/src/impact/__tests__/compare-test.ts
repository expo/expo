import { readLastBuildRecord } from '../../plan/lastBuild';
import { diffFingerprintsAsync, generateFingerprintAsync } from '../../project/fingerprint';
import { spawnSubprocessAsync } from '../../utils/subprocess';
import { buildCacheArgs, findCachedBuildAsync, parseCachedBuild } from '../buildCache';
import {
  buildEasCompareArgs,
  compareWithEasBuildAsync,
  compareWithLastBuildAsync,
  describeGenerateFailure,
  parseEasCompare,
} from '../compare';
import realDiff from './fixtures/notesapp-ios-diff.json';

jest.mock('../../utils/subprocess', () => ({ spawnSubprocessAsync: jest.fn() }));
jest.mock('../../plan/lastBuild', () => ({ readLastBuildRecord: jest.fn(() => ({})) }));
jest.mock('../../project/fingerprint', () => ({
  ...(jest.requireActual('../../project/fingerprint') as object),
  generateFingerprintAsync: jest.fn(),
  diffFingerprintsAsync: jest.fn(),
}));

const projectRoot = '/project';
const easCli = { command: '/bin/eas', source: 'path' as const };

function mockSpawn(result: Partial<Awaited<ReturnType<typeof spawnSubprocessAsync>>>) {
  jest
    .mocked(spawnSubprocessAsync)
    .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '', ...result });
}

const source = { type: 'dir', filePath: 'node_modules/x', reasons: ['expoAutolinkingIos'] };

beforeEach(() => {
  jest.mocked(spawnSubprocessAsync).mockReset();
  jest.mocked(readLastBuildRecord).mockReset().mockReturnValue({});
  jest.mocked(generateFingerprintAsync).mockReset();
  jest.mocked(diffFingerprintsAsync).mockReset();
});

describe(compareWithLastBuildAsync, () => {
  it(`should fingerprint the working tree for the platform and the preset asked for`, async () => {
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'head', sources: [source] });

    await compareWithLastBuildAsync(projectRoot, 'ios', { preset: 'strict' });

    expect(generateFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
      platform: 'ios',
      preset: 'strict',
    });
  });

  it(`should report an undecidable comparison when nothing is recorded`, async () => {
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'head', sources: [source] });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    // Nothing recorded is not "unchanged": a build made by EAS or by Xcode leaves no record here.
    expect(result.fingerprintChanged).toBeNull();
    expect(result.items).toBeNull();
    expect(result.error).toBeNull();
    expect(result.caveats[0]).toContain('No build is recorded');
    expect(result.caveats[0]).toContain('--build');
  });

  it(`should report the fingerprint failure as an error, not as unchanged`, async () => {
    jest
      .mocked(generateFingerprintAsync)
      .mockResolvedValue({ hash: null, sources: null, error: 'no fingerprint CLI' });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    expect(result.error).toBe('no fingerprint CLI');
    expect(result.fingerprintChanged).toBeNull();
  });

  it(`should say a v1 record can answer whether, and not what`, async () => {
    jest.mocked(readLastBuildRecord).mockReturnValue({ ios: { hash: 'base', sources: null } });
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'head', sources: [source] });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    expect(result.fingerprintChanged).toBe(true);
    expect(result.items).toBeNull();
    expect(result.caveats[0]).toContain('only a hash');
    expect(diffFingerprintsAsync).not.toHaveBeenCalled();
  });

  it(`should diff a v2 record against the head`, async () => {
    jest.mocked(readLastBuildRecord).mockReturnValue({ ios: { hash: 'base', sources: [source] } });
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'head', sources: [source] });
    jest.mocked(diffFingerprintsAsync).mockResolvedValue({ items: realDiff as any });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    expect(diffFingerprintsAsync).toHaveBeenCalledWith(
      projectRoot,
      { hash: 'base', sources: [source] },
      { hash: 'head', sources: [source] }
    );
    expect(result.items).toHaveLength(3);
    expect(result.fingerprintChanged).toBe(true);
    expect(result.caveats).toEqual([]);
  });

  it(`should report an unchanged fingerprint with an empty diff`, async () => {
    jest.mocked(readLastBuildRecord).mockReturnValue({ ios: { hash: 'same', sources: [source] } });
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'same', sources: [source] });
    jest.mocked(diffFingerprintsAsync).mockResolvedValue({ items: [] });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    expect(result.fingerprintChanged).toBe(false);
    expect(result.items).toEqual([]);
  });

  it(`should keep the hash answer when the diff itself failed`, async () => {
    jest.mocked(readLastBuildRecord).mockReturnValue({ ios: { hash: 'base', sources: [source] } });
    jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: 'head', sources: [source] });
    jest.mocked(diffFingerprintsAsync).mockResolvedValue({ items: null, error: 'diff failed' });

    const result = await compareWithLastBuildAsync(projectRoot, 'ios');

    expect(result.fingerprintChanged).toBe(true);
    expect(result.caveats).toEqual(['diff failed']);
    expect(result.error).toBeNull();
  });
});

describe(buildEasCompareArgs, () => {
  it(`should ask EAS non-interactively, for JSON`, () => {
    // Nothing is attached to stdin, so a prompt here is a hang rather than a question.
    expect(buildEasCompareArgs('build-1')).toEqual([
      'fingerprint:compare',
      '--build-id',
      'build-1',
      '--json',
      '--non-interactive',
    ]);
  });
});

describe(compareWithEasBuildAsync, () => {
  it(`should spawn eas with the compare argv, in the project`, async () => {
    mockSpawn({ stdout: '[]' });

    await compareWithEasBuildAsync(easCli, projectRoot, 'build-1');

    expect(spawnSubprocessAsync).toHaveBeenCalledWith('/bin/eas', buildEasCompareArgs('build-1'), {
      cwd: projectRoot,
      output: 'capture',
    });
  });

  it(`should report a non-zero exit as an error naming the id`, async () => {
    mockSpawn({ exitCode: 1, stderr: 'Build not found' });

    const result = await compareWithEasBuildAsync(easCli, projectRoot, 'build-1');

    expect(result.error).toContain('build-1');
    expect(result.error).toContain('Build not found');
    expect(result.error).toContain('eas build:list');
  });

  it(`should read a diff array printed at the top level`, async () => {
    mockSpawn({ stdout: JSON.stringify(realDiff) });

    const result = await compareWithEasBuildAsync(easCli, projectRoot, 'build-1');

    expect(result.items).toHaveLength(3);
    expect(result.fingerprintChanged).toBe(true);
    expect(result.caveats).toEqual([]);
  });
});

describe(parseEasCompare, () => {
  it(`should read a bare diff array`, () => {
    expect(parseEasCompare(JSON.stringify(realDiff))).toMatchObject({
      fingerprintChanged: true,
      caveats: [],
    });
  });

  it(`should read an empty diff array as unchanged`, () => {
    expect(parseEasCompare('[]')).toMatchObject({ items: [], fingerprintChanged: false });
  });

  it.each(['diff', 'fingerprintDiff', 'differences', 'changes'])(
    `should find the diff under a "%s" key`,
    (key) => {
      const result = parseEasCompare(JSON.stringify({ [key]: realDiff }));

      expect(result.items).toHaveLength(3);
      expect(result.caveats).toEqual([]);
    }
  );

  it(`should read the two hashes out of a shape it does not otherwise recognise`, () => {
    // The shape of this payload is unverified, so the fallback has to be able to answer from the
    // hashes alone — "whether", without "what".
    const result = parseEasCompare(JSON.stringify({ builds: 'aaa', projects: 'bbb' }));

    expect(result).toMatchObject({ items: null, baseHash: 'aaa', headHash: 'bbb' });
    expect(result.fingerprintChanged).toBe(true);
  });

  it(`should read hashes nested one level in`, () => {
    const result = parseEasCompare(
      JSON.stringify({ build: { hash: 'aaa' }, project: { hash: 'aaa' } })
    );

    expect(result).toMatchObject({ baseHash: 'aaa', headHash: 'aaa', fingerprintChanged: false });
  });

  it(`should carry the tail of a payload it could not read at all`, () => {
    const result = parseEasCompare('Signed out. Run eas login.');

    expect(result).toMatchObject({ items: null, fingerprintChanged: null });
    expect(result.caveats[0]).toContain('could not parse as JSON');
    expect(result.caveats[0]).toContain('Signed out');
  });

  it(`should carry a caveat when the JSON parsed but held no recognisable diff`, () => {
    const result = parseEasCompare(JSON.stringify({ somethingElse: true }));

    expect(result.items).toBeNull();
    expect(result.caveats[0]).toContain('shape this CLI does not recognise');
  });

  it(`should not read an array of things that are not diff items`, () => {
    expect(parseEasCompare(JSON.stringify([{ notAnOp: 1 }])).items).toBeNull();
  });
});

describe(buildCacheArgs, () => {
  it(`should ask for one finished build with this exact fingerprint`, () => {
    // `--status finished` is what makes a hit mean something: a queued or errored build with the
    // same fingerprint is not a build anyone can install.
    expect(buildCacheArgs('ios', 'abc')).toEqual([
      'build:list',
      '--platform',
      'ios',
      '--fingerprint-hash',
      'abc',
      '--status',
      'finished',
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ]);
  });
});

describe(findCachedBuildAsync, () => {
  it(`should answer null without spawning anything when there is no EAS CLI`, async () => {
    await expect(findCachedBuildAsync(null, projectRoot, 'ios', 'abc')).resolves.toBeNull();
    expect(spawnSubprocessAsync).not.toHaveBeenCalled();
  });

  it(`should answer null without spawning anything when there is no hash to ask about`, async () => {
    await expect(findCachedBuildAsync(easCli, projectRoot, 'ios', null)).resolves.toBeNull();
    expect(spawnSubprocessAsync).not.toHaveBeenCalled();
  });

  it(`should spawn the lookup with a deadline`, async () => {
    mockSpawn({ stdout: '[]' });

    await findCachedBuildAsync(easCli, projectRoot, 'ios', 'abc');

    expect(spawnSubprocessAsync).toHaveBeenCalledWith(
      '/bin/eas',
      buildCacheArgs('ios', 'abc'),
      expect.objectContaining({
        cwd: projectRoot,
        output: 'capture',
        timeoutMs: expect.any(Number),
      })
    );
  });

  it.each([
    ['a non-zero exit', { exitCode: 1, stdout: '' }],
    ['a timeout', { exitCode: null, timedOut: true, stdout: '' }],
    ['a spawn failure', { exitCode: null, spawnError: new Error('ENOENT') }],
  ])(`should answer null for %s rather than failing the command`, async (_name, result) => {
    mockSpawn(result as any);

    await expect(findCachedBuildAsync(easCli, projectRoot, 'ios', 'abc')).resolves.toBeNull();
  });

  it(`should report the first build of a hit`, async () => {
    mockSpawn({
      stdout: JSON.stringify([
        {
          id: 'build-1',
          status: 'FINISHED',
          platform: 'IOS',
          buildProfile: 'development',
          createdAt: '2026-08-24T00:00:00Z',
          artifacts: { buildUrl: 'https://expo.dev/builds/build-1' },
        },
      ]),
    });

    await expect(findCachedBuildAsync(easCli, projectRoot, 'ios', 'abc')).resolves.toEqual({
      id: 'build-1',
      status: 'FINISHED',
      platform: 'IOS',
      buildProfile: 'development',
      createdAt: '2026-08-24T00:00:00Z',
      buildUrl: 'https://expo.dev/builds/build-1',
    });
  });
});

describe(parseCachedBuild, () => {
  it(`should answer null for an empty list`, () => {
    expect(parseCachedBuild('[]')).toBeNull();
  });

  it(`should answer null for output with no JSON in it`, () => {
    expect(parseCachedBuild('not json')).toBeNull();
  });

  it(`should answer null for unparsable JSON`, () => {
    expect(parseCachedBuild('[{')).toBeNull();
  });

  it(`should null every field the payload did not carry, rather than throwing`, () => {
    expect(parseCachedBuild(JSON.stringify([{ id: 'build-1' }]))).toEqual({
      id: 'build-1',
      status: null,
      platform: null,
      buildProfile: null,
      createdAt: null,
      buildUrl: null,
    });
  });

  it(`should skip the log line eas prints before the payload`, () => {
    expect(parseCachedBuild(`Fetching builds…\n[{"id":"build-1"}]`)).toMatchObject({
      id: 'build-1',
    });
  });
});

describe(describeGenerateFailure, () => {
  it(`should pass an ordinary failure through`, () => {
    expect(describeGenerateFailure('The fingerprint CLI failed: boom', 'ios', undefined)).toBe(
      'The fingerprint CLI failed: boom'
    );
  });

  it(`should say something when there was no message at all`, () => {
    expect(describeGenerateFailure(undefined, 'android', undefined)).toContain('android');
  });

  it(`should name the CLI's age when it rejected a --preset the caller passed`, () => {
    // The generic message sends the reader to look at their project; the cause is the version of
    // @expo/fingerprint it has.
    const result = describeGenerateFailure(
      'The fingerprint CLI failed: unknown or unexpected option: --preset',
      'ios',
      'strict'
    );

    expect(result).toContain('does not accept --preset');
    expect(result).toContain('drop --preset');
  });

  it(`should not claim that when no preset was passed`, () => {
    // Only a caller who asked for a preset can be told to drop one.
    expect(
      describeGenerateFailure(
        'The fingerprint CLI failed: unknown or unexpected option: --preset',
        'ios',
        undefined
      )
    ).not.toContain('drop --preset');
  });
});
