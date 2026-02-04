import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { isFileIgnoredAsync, existsAndIsNotIgnoredAsync } from '../files';

jest.mock('fs');

beforeEach(() => {
  vol.reset();
  // Mock git command to fail as if git wasn't available
  jest.mocked(spawnAsync).mockRejectedValue(new Error('git not available'));
});

describe(isFileIgnoredAsync, () => {
  it('returns true if file is ignored by .easignore', async () => {
    vol.fromJSON(
      {
        '.easignore': 'ignored-file.txt',
        'ignored-file.txt': 'content',
      },
      '/project'
    );

    const result = await isFileIgnoredAsync('/project/ignored-file.txt');
    expect(result).toBe(true);
  });

  it('returns false if file is not ignored by .easignore', async () => {
    vol.fromJSON(
      {
        '.easignore': 'other-file.txt',
        'not-ignored-file.txt': 'content',
      },
      '/project'
    );
    const result = await isFileIgnoredAsync('/project/not-ignored-file.txt');
    expect(result).toBe(false);
  });

  it('falls back to .gitignore if .easignore does not exist', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'ignored-file.txt',
        'ignored-file.txt': 'content',
      },
      '/project'
    );
    const result = await isFileIgnoredAsync('/project/ignored-file.txt');
    expect(result).toBe(true);
  });

  it('returns null if neither .easignore nor .gitignore exists', async () => {
    vol.fromJSON(
      {
        'app.tsx': 'hello world!',
      },
      '/project'
    );
    const result = await isFileIgnoredAsync('/project/app.tsx');
    expect(result).toBe(null);
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

  it('correctly identifies ignored files', async () => {
    vol.fromJSON(
      {
        '.gitignore': '/ios\n/android',
        'ios/Podfile': 'content',
        'android/build.gradle': 'content',
        'src/App.js': 'content',
      },
      '/project'
    );

    const iosIgnored = await isFileIgnoredAsync('/project/ios/Podfile');
    const androidIgnored = await isFileIgnoredAsync('/project/android/build.gradle');
    const srcNotIgnored = await isFileIgnoredAsync('/project/src/App.js');

    expect(iosIgnored).toBe(true);
    expect(androidIgnored).toBe(true);
    expect(srcNotIgnored).toBe(false);
  });
});
