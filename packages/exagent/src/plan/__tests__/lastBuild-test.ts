import fs from 'fs';
import { vol } from 'memfs';

import {
  LAST_BUILD_FILE_NAME,
  readLastBuildFingerprints,
  recordLastBuildFingerprint,
} from '../lastBuild';

const projectRoot = '/project';
const lastBuildFile = `${projectRoot}/.expo/${LAST_BUILD_FILE_NAME}`;

beforeEach(() => {
  vol.reset();
});

describe(readLastBuildFingerprints, () => {
  it(`should return nothing when the project has no record`, () => {
    vol.fromJSON({ '/project/package.json': '{}' });

    expect(readLastBuildFingerprints(projectRoot)).toEqual({});
  });

  it(`should read the recorded hash of every platform`, () => {
    vol.fromJSON({ [lastBuildFile]: JSON.stringify({ ios: 'hash-ios', android: 'hash-android' }) });

    expect(readLastBuildFingerprints(projectRoot)).toEqual({
      ios: 'hash-ios',
      android: 'hash-android',
    });
  });

  it(`should ignore a corrupt record instead of failing the command`, () => {
    vol.fromJSON({ [lastBuildFile]: '{ not json' });

    expect(readLastBuildFingerprints(projectRoot)).toEqual({});
  });

  it(`should ignore a record that is not an object`, () => {
    vol.fromJSON({ [lastBuildFile]: '"hash-ios"' });

    expect(readLastBuildFingerprints(projectRoot)).toEqual({});
  });

  it(`should ignore unknown platforms and non-string hashes`, () => {
    vol.fromJSON({
      [lastBuildFile]: JSON.stringify({ ios: 'hash-ios', android: 42, windows: 'hash-windows' }),
    });

    expect(readLastBuildFingerprints(projectRoot)).toEqual({ ios: 'hash-ios' });
  });
});

describe(recordLastBuildFingerprint, () => {
  it(`should create the record in the .expo directory`, () => {
    vol.fromJSON({ '/project/package.json': '{}' });

    recordLastBuildFingerprint(projectRoot, 'ios', 'hash-ios');

    expect(readLastBuildFingerprints(projectRoot)).toEqual({ ios: 'hash-ios' });
    expect(fs.existsSync(lastBuildFile)).toBe(true);
  });

  it(`should keep the hash recorded for the other platform`, () => {
    vol.fromJSON({ [lastBuildFile]: JSON.stringify({ android: 'hash-android' }) });

    recordLastBuildFingerprint(projectRoot, 'ios', 'hash-ios');

    expect(readLastBuildFingerprints(projectRoot)).toEqual({
      ios: 'hash-ios',
      android: 'hash-android',
    });
  });

  it(`should replace the hash of the same platform`, () => {
    vol.fromJSON({ [lastBuildFile]: JSON.stringify({ ios: 'old-hash' }) });

    recordLastBuildFingerprint(projectRoot, 'ios', 'new-hash');

    expect(readLastBuildFingerprints(projectRoot)).toEqual({ ios: 'new-hash' });
  });

  it(`should replace a corrupt record`, () => {
    vol.fromJSON({ [lastBuildFile]: '{ not json' });

    recordLastBuildFingerprint(projectRoot, 'android', 'hash-android');

    expect(readLastBuildFingerprints(projectRoot)).toEqual({ android: 'hash-android' });
  });

  it(`should never fail the command when the record cannot be written`, () => {
    vol.fromJSON({ '/project/package.json': '{}' });
    const writeFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => recordLastBuildFingerprint(projectRoot, 'ios', 'hash-ios')).not.toThrow();

    writeFileSync.mockRestore();
  });
});
