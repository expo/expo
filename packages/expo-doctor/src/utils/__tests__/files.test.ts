import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { isFileIgnoredAsync, existsAndIsNotIgnoredAsync } from '../files';

jest.mock('fs');

describe(isFileIgnoredAsync, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns true if file is ignored by .easignore', async () => {
    vol.fromJSON({
      '.easignore': 'ignored-file.txt',
      'ignored-file.txt': 'content',
    });

    const result = await isFileIgnoredAsync('ignored-file.txt');
    expect(result).toBe(true);
  });

  it('returns false if file is not ignored by .easignore', async () => {
    vol.fromJSON({
      '.easignore': 'other-file.txt',
      'not-ignored-file.txt': 'content',
    });
    const result = await isFileIgnoredAsync('not-ignored-file.txt');
    expect(result).toBe(false);
  });

  it('falls back to .gitignore if .easignore does not exist', async () => {
    vol.fromJSON({
      '.gitignore': 'ignored-file.txt',
      'ignored-file.txt': 'content',
    });
    const result = await isFileIgnoredAsync('ignored-file.txt');
    expect(result).toBe(true);
  });

  it('returns false if neither .easignore nor .gitignore exists', async () => {
    vol.fromJSON({
      'app.tsx': 'hello world!',
    });
    const result = await isFileIgnoredAsync('app.tsx');
    expect(result).toBe(false);
  });
});

describe(existsAndIsNotIgnoredAsync, () => {
  it('returns true if file exists and is not ignored', async () => {
    vol.fromJSON({
      'test.txt': 'test',
    });
    const result = await existsAndIsNotIgnoredAsync('test.txt');
    expect(result).toBe(true);
  });

  it('returns false if file does not exist', async () => {
    vol.fromJSON({
      'other-file.txt': 'test',
    });
    const result = await existsAndIsNotIgnoredAsync('random-file.txt');
    expect(result).toBe(false);
  });

  it('returns false if file is ignored', async () => {
    vol.fromJSON({
      '.easignore': 'ignored-file.txt',
      'ignored-file.txt': 'test',
    });
    const result = await existsAndIsNotIgnoredAsync('ignored-file.txt');
    expect(result).toBe(false);
  });
});

describe('gitignore fallback behavior', () => {
  beforeEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('correctly identifies ignored files when git is not available', async () => {
    vol.fromJSON({
      '.gitignore': '/ios\n/android',
      'ios/Podfile': 'content',
      'android/build.gradle': 'content',
      'src/App.js': 'content',
    });

    // Mock git command to fail as if git wasn't available
    jest.mocked(spawnAsync).mockRejectedValue(new Error('git not available'));

    const iosIgnored = await isFileIgnoredAsync('ios/Podfile');
    const androidIgnored = await isFileIgnoredAsync('android/build.gradle');
    const srcNotIgnored = await isFileIgnoredAsync('src/App.js');

    expect(iosIgnored).toBe(true);
    expect(androidIgnored).toBe(true);
    expect(srcNotIgnored).toBe(false);
  });
});
