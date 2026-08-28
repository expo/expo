// @ref llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
//
// The design decision is "the cache is free and exact, the network is opt-in", and only two of
// these tests are about the answer: the rest pin the *cost*, which is the thing a report promising
// to be instant cannot get wrong quietly.

import fs from 'fs';
import { vol } from 'memfs';

import { lookUpCachedBuildAsync } from '../../impact/buildCache';
import { generateFingerprintAsync } from '../../project/fingerprint';
import { resolveEasCli } from '../../utils/easCli';
import {
  EAS_BUILDS_FILE_NAME,
  readEasBuildsRecord,
  readEasBuildsStatusAsync,
  writeEasBuildsEntry,
} from '../easBuilds';
import type { AuthStatus, PlatformBuild } from '../types';

jest.mock('../../impact/buildCache', () => ({
  lookUpCachedBuildAsync: jest.fn(),
  // The real one: it is a pure function of the resolved CLI, and the deadline's reason is the thing
  // under test in one of these cases.
  runnerDownloadNote: jest.requireActual('../../impact/buildCache').runnerDownloadNote,
}));
jest.mock('../../project/fingerprint', () => ({ generateFingerprintAsync: jest.fn() }));
jest.mock('../../utils/easCli', () => ({
  ...jest.requireActual('../../utils/easCli'),
  resolveEasCli: jest.fn(),
}));

const projectRoot = '/project';
const recordFile = `${projectRoot}/.expo/${EAS_BUILDS_FILE_NAME}`;

/** The whole-project hash `status` computes for freshness — the cache key. */
const PROJECT_HASH = '031f6b0cf531347325945ec1a8b2986964d6d55f';
/** The iOS hash of the same working tree, which is the one an EAS build carries. */
const IOS_HASH = '8ce1acfbc22138726c1525aeb99d577a812de3cf';

const BUILD = {
  id: '21d7d434-6495-4e74-b8c7-68ecd0dff489',
  status: 'FINISHED',
  platform: 'IOS',
  buildProfile: 'simulator',
  createdAt: '2026-08-19T17:37:12.674Z',
  buildUrl: 'https://expo.dev/artifacts/eas/abc.tar.gz',
};

const signedIn: AuthStatus = { loggedIn: true, user: 'kudochien', source: 'eas whoami' };

function writeCache(entry: Record<string, unknown>): void {
  vol.fromJSON({ [recordFile]: JSON.stringify({ ios: entry }) });
}

function iosOf(platforms: PlatformBuild[]): PlatformBuild {
  return platforms.find((platform) => platform.platform === 'ios')!;
}

beforeEach(() => {
  vol.reset();
  jest.mocked(resolveEasCli).mockReturnValue({
    command: 'npx',
    prefixArgs: ['--yes', 'eas-cli@latest'],
    source: 'npx --yes eas-cli@latest',
    runner: 'npx',
    pinned: false,
  });
  jest.mocked(generateFingerprintAsync).mockResolvedValue({ hash: IOS_HASH, sources: [] });
  jest.mocked(lookUpCachedBuildAsync).mockResolvedValue({ state: 'none' });
});

describe(readEasBuildsStatusAsync, () => {
  it(`should answer unknown for both platforms without --explain, and spawn nothing`, async () => {
    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: false,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(status.askedEas).toBe(false);
    expect(status.platforms.map((platform) => platform.state)).toEqual(['unknown', 'unknown']);
    expect(iosOf(status.platforms).reason).toContain('--explain');
    expect(generateFingerprintAsync).not.toHaveBeenCalled();
    expect(lookUpCachedBuildAsync).not.toHaveBeenCalled();
  });

  // The whole point of keying the cache on the hash `status` already has: a hit is exact and free.
  it(`should answer found from the cache without --explain, and still spawn nothing`, async () => {
    writeCache({ projectHash: PROJECT_HASH, fingerprintHash: IOS_HASH, build: BUILD });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: false,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms)).toMatchObject({
      state: 'found',
      source: 'cache',
      buildId: BUILD.id,
      buildProfile: 'simulator',
      createdAt: BUILD.createdAt,
      fingerprintHash: IOS_HASH,
    });
    expect(generateFingerprintAsync).not.toHaveBeenCalled();
    expect(lookUpCachedBuildAsync).not.toHaveBeenCalled();
  });

  it(`should ignore a cached answer taken under a different project fingerprint`, async () => {
    writeCache({ projectHash: 'some-older-hash', fingerprintHash: IOS_HASH, build: BUILD });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: false,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms).state).toBe('unknown');
  });

  it(`should ignore the cache entirely when this project has no fingerprint of its own`, async () => {
    writeCache({ projectHash: PROJECT_HASH, fingerprintHash: IOS_HASH, build: BUILD });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: false,
      auth: signedIn,
      projectHash: null,
    });

    // Nothing establishes that the entry belongs to what is on disk now, so it is not an answer.
    expect(iosOf(status.platforms).state).toBe('unknown');
  });

  // The auth section already answered this. A second probe would spend a second to be told the
  // same thing, which is exactly the cost this design exists to avoid.
  it(`should not ask EAS on a signed-out machine, even with --explain`, async () => {
    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: { loggedIn: false, user: null, source: 'eas whoami' },
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms).state).toBe('unknown');
    expect(iosOf(status.platforms).reason).toContain('not signed in');
    expect(lookUpCachedBuildAsync).not.toHaveBeenCalled();
  });

  it(`should ask EAS when the auth answer is itself unknown`, async () => {
    await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: { loggedIn: null, user: null, source: null },
      projectHash: PROJECT_HASH,
    });

    expect(lookUpCachedBuildAsync).toHaveBeenCalled();
  });

  // The reason the lookup needs a fingerprint run of its own: the hash `status` has covers both
  // @ref llp/0023-fingerprint-caching.rfc.md §Every consumer can turn it off
  // This section pays for two of the three fingerprints a `status --explain` computes, so a caller
  // who refused the cache has to be refused it here too — or the flag would only apply to a third
  // of the cost it is about.
  it(`should pass a refused cache through to both platforms`, async () => {
    await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
      fingerprintCache: false,
    });

    expect(generateFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
      platform: 'ios',
      cache: false,
    });
    expect(generateFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
      platform: 'android',
      cache: false,
    });
  });

  // platforms, and an EAS build carries a per-platform one.
  it(`should look the per-platform fingerprint up, not the project one`, async () => {
    await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(generateFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
      platform: 'ios',
      cache: undefined,
    });
    expect(lookUpCachedBuildAsync).toHaveBeenCalledWith(
      {
    command: 'npx',
    prefixArgs: ['--yes', 'eas-cli@latest'],
    source: 'npx --yes eas-cli@latest',
    runner: 'npx',
    pinned: false,
  },
      projectRoot,
      'ios',
      IOS_HASH,
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });

  it(`should report a hit and record it against the project fingerprint`, async () => {
    jest.mocked(lookUpCachedBuildAsync).mockResolvedValue({ state: 'found', build: BUILD });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms)).toMatchObject({
      state: 'found',
      source: 'eas',
      buildId: BUILD.id,
    });
    expect(readEasBuildsRecord(projectRoot).ios).toMatchObject({
      projectHash: PROJECT_HASH,
      fingerprintHash: IOS_HASH,
      build: { id: BUILD.id },
    });
  });

  // A "none" goes out of date on the timeline of the workflow it belongs to: a build started now
  // finishes in fifteen minutes, and a cached "there is none" would be wrong exactly then.
  it(`should record nothing for an answer of none`, async () => {
    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms)).toMatchObject({ state: 'none', source: 'eas' });
    expect(fs.existsSync(recordFile)).toBe(false);
  });

  it(`should pass the lookup's own reason through as the unknown`, async () => {
    jest
      .mocked(lookUpCachedBuildAsync)
      .mockResolvedValue({ state: 'unknown', reason: 'EAS project not configured.' });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms)).toMatchObject({
      state: 'unknown',
      reason: 'EAS project not configured.',
      fingerprintHash: IOS_HASH,
    });
    expect(fs.existsSync(recordFile)).toBe(false);
  });

  it(`should answer unknown, and ask nobody, when the platform cannot be fingerprinted`, async () => {
    jest
      .mocked(generateFingerprintAsync)
      .mockResolvedValue({ hash: null, sources: null, error: 'no fingerprint CLI' });

    const status = await readEasBuildsStatusAsync(projectRoot, {
      lookUp: true,
      auth: signedIn,
      projectHash: PROJECT_HASH,
    });

    expect(iosOf(status.platforms)).toMatchObject({
      state: 'unknown',
      reason: 'no fingerprint CLI',
    });
    expect(lookUpCachedBuildAsync).not.toHaveBeenCalled();
  });

  // The deadline is the section's own, above the one the lookup is given, so a fingerprint run
  // that never returns costs a line rather than the report.
  it(`should answer unknown when the whole lookup runs past its deadline`, async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(generateFingerprintAsync).mockReturnValue(new Promise(() => {}));

      const pending = readEasBuildsStatusAsync(projectRoot, {
        lookUp: true,
        auth: signedIn,
        projectHash: PROJECT_HASH,
        timeoutMs: 5000,
      });
      await jest.advanceTimersByTimeAsync(5000);
      const status = await pending;

      expect(iosOf(status.platforms)).toMatchObject({
        state: 'unknown',
        reason: expect.stringContaining('the lookup did not finish within 5000ms'),
      });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe(readEasBuildsRecord, () => {
  it(`should read nothing when the project has no record`, () => {
    vol.fromJSON({ '/project/package.json': '{}' });

    expect(readEasBuildsRecord(projectRoot)).toEqual({});
  });

  it.each([
    ['unparsable JSON', '{ not json'],
    ['an array', '[]'],
    ['an entry with no project hash', JSON.stringify({ ios: { fingerprintHash: 'a', build: {} } })],
    ['an entry with no fingerprint hash', JSON.stringify({ ios: { projectHash: 'a', build: {} } })],
    [
      'an entry whose build has no id',
      JSON.stringify({ ios: { projectHash: 'a', fingerprintHash: 'b', build: { status: 'X' } } }),
    ],
  ])(`should drop %s rather than trusting it`, (_name, contents) => {
    vol.fromJSON({ [recordFile]: contents });

    expect(readEasBuildsRecord(projectRoot).ios).toBeUndefined();
  });
});

describe(writeEasBuildsEntry, () => {
  it(`should keep the other platform's entry`, () => {
    writeCache({ projectHash: PROJECT_HASH, fingerprintHash: IOS_HASH, build: BUILD });

    writeEasBuildsEntry(projectRoot, 'android', {
      projectHash: PROJECT_HASH,
      fingerprintHash: 'android-hash',
      build: { ...BUILD, id: 'android-build', platform: 'ANDROID' },
    });

    const record = readEasBuildsRecord(projectRoot);
    expect(record.ios?.build.id).toBe(BUILD.id);
    expect(record.android?.build.id).toBe('android-build');
  });

  it(`should write nothing when there is no project hash to key the entry on`, () => {
    writeEasBuildsEntry(projectRoot, 'ios', {
      projectHash: null,
      fingerprintHash: IOS_HASH,
      build: BUILD,
    });

    expect(fs.existsSync(recordFile)).toBe(false);
  });

  it(`should not fail the caller when the record cannot be written`, () => {
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('EROFS');
    });

    expect(() =>
      writeEasBuildsEntry(projectRoot, 'ios', {
        projectHash: PROJECT_HASH,
        fingerprintHash: IOS_HASH,
        build: BUILD,
      })
    ).not.toThrow();
  });
});
